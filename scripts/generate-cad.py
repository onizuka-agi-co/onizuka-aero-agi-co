#!/usr/bin/env python3
"""Generate the fictional AX-01 KIRIN visual CAD assets with FreeCAD."""

from __future__ import annotations

import argparse
import getpass
import hashlib
import json
import math
import re
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import FreeCAD as App
import Mesh
import MeshPart
import Part


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "assets" / "ax01"
REPORT_PATH = ROOT / "public" / "data" / "geometry-report.json"
DESIGN_ID = "AX-01"
REVISION = "r1"
UNITS = "arbitrary-design-unit"
COORDINATE_SYSTEM = {"forward": "+X", "span": "Y", "up": "+Z"}
COORDINATE_DECIMALS = 6
MESH_SETTINGS = {
    "method": "FreeCAD MeshPart.meshFromShape",
    "linearDeflection": 0.16,
    "angularDeflectionRadians": 0.35,
    "relative": False,
    "coordinateDecimals": COORDINATE_DECIMALS,
}
MAX_TRIANGLES = 30000
MAX_MESH_BYTES = 2_000_000
SYMMETRY_TOLERANCE = 1e-6


def local_path_patterns() -> tuple[tuple[str, re.Pattern[str]], ...]:
    patterns = [
        ("windows-user-path", re.compile(r"[A-Za-z]:[\\/]Users[\\/]", re.I)),
        ("repository-path", re.compile(re.escape(str(ROOT)), re.I)),
    ]
    local_user_name = getpass.getuser()
    if local_user_name:
        patterns.append(("local-user-name", re.compile(re.escape(local_user_name), re.I)))
    return tuple(patterns)


@dataclass(frozen=True)
class Variant:
    name: str
    wing_span: float


@dataclass(frozen=True)
class PartSpec:
    name: str
    color: str
    draw_order: int
    builder: Callable[[Variant, int], object]
    side: int = 0


VARIANTS = (Variant("standard", 12.8), Variant("longwing", 16.0))


def vec(x: float, y: float, z: float) -> App.Vector:
    return App.Vector(float(x), float(y), float(z))


def closed_wire(points: list[App.Vector]) -> Part.Wire:
    return Part.Wire(Part.makePolygon(points + [points[0]]).Edges)


def loft(sections: list[list[App.Vector]]) -> Part.Shape:
    return Part.makeLoft([closed_wire(section) for section in sections], True, False, False)


def body_section(x: float, half_width: float, center_z: float, half_height: float) -> list[App.Vector]:
    yz = [
        (-half_width, center_z),
        (-0.72 * half_width, center_z + 0.62 * half_height),
        (0.0, center_z + half_height),
        (0.72 * half_width, center_z + 0.62 * half_height),
        (half_width, center_z),
        (0.72 * half_width, center_z - 0.62 * half_height),
        (0.0, center_z - half_height),
        (-0.72 * half_width, center_z - 0.62 * half_height),
    ]
    return [vec(x, y, z) for y, z in yz]


def build_fuselage(_variant: Variant, _side: int) -> Part.Shape:
    stations = [
        (-8.2, 0.22, 0.10, 0.14),
        (-7.4, 0.48, 0.12, 0.31),
        (-6.0, 0.72, 0.12, 0.52),
        (-3.2, 0.98, 0.12, 0.73),
        (0.0, 1.02, 0.12, 0.78),
        (2.8, 0.78, 0.12, 0.66),
        (5.2, 0.48, 0.12, 0.43),
        (6.8, 0.24, 0.12, 0.22),
        (7.9, 0.055, 0.12, 0.065),
    ]
    return loft([body_section(*station) for station in stations])


def canopy_section(x: float, half_width: float, base_z: float, crown_z: float) -> list[App.Vector]:
    shoulder_z = base_z + (crown_z - base_z) * 0.40
    yz = [
        (-half_width, base_z),
        (-0.72 * half_width, shoulder_z),
        (0.0, crown_z),
        (0.72 * half_width, shoulder_z),
        (half_width, base_z),
    ]
    return [vec(x, y, z) for y, z in yz]


def build_canopy(_variant: Variant, _side: int) -> Part.Shape:
    stations = [
        (0.20, 0.10, 0.79, 0.94),
        (0.65, 0.40, 0.80, 1.33),
        (1.15, 0.55, 0.81, 1.68),
        (2.45, 0.55, 0.81, 1.72),
        (3.25, 0.46, 0.79, 1.51),
        (3.85, 0.12, 0.76, 1.00),
    ]
    return loft([canopy_section(*station) for station in stations])


def polygon_prism_xy(points: list[tuple[float, float]], z: float, thickness: float) -> Part.Shape:
    wire = closed_wire([vec(x, y, z) for x, y in points])
    return Part.Face(wire).extrude(vec(0, 0, thickness))


def polygon_prism_xz(points: list[tuple[float, float]], y: float, span: float) -> Part.Shape:
    wire = closed_wire([vec(x, y, z) for x, z in points])
    return Part.Face(wire).extrude(vec(0, span, 0))


def wing_outline(variant: Variant, side: int) -> list[tuple[float, float]]:
    return [
        (4.15, side * 0.72),
        (2.30, side * 3.10),
        (-2.00, side * variant.wing_span),
        (-5.80, side * variant.wing_span * 0.91),
        (-3.55, side * 4.55),
        (-2.15, side * 0.78),
    ]


def build_wing(variant: Variant, side: int) -> Part.Shape:
    return polygon_prism_xy(wing_outline(variant, side), -0.12, 0.42)


def build_fin(_variant: Variant, side: int) -> Part.Shape:
    outline = [(-7.00, 0.40), (-4.25, 0.46), (-5.55, 3.18), (-7.05, 2.78)]
    return polygon_prism_xz(outline, side * 1.18, side * 0.30)


def build_wing_accent(variant: Variant, side: int) -> Part.Shape:
    span = variant.wing_span
    outline = [
        (1.62, side * 3.75),
        (1.13, side * 4.25),
        (-0.55, side * span * 0.80),
        (0.02, side * span * 0.79),
    ]
    return polygon_prism_xy(outline, 0.305, 0.028)


def spine_section(x: float, half_width: float, base_z: float, crown_z: float) -> list[App.Vector]:
    shoulder_z = base_z + (crown_z - base_z) * 0.55
    yz = [
        (-half_width, base_z),
        (-half_width * 0.55, shoulder_z),
        (0.0, crown_z),
        (half_width * 0.55, shoulder_z),
        (half_width, base_z),
        (0.0, base_z - 0.035),
    ]
    return [vec(x, y, z) for y, z in yz]


def build_spine(_variant: Variant, _side: int) -> Part.Shape:
    stations = [
        (-7.20, 0.12, 0.43, 0.57),
        (-6.45, 0.14, 0.64, 0.78),
        (-5.60, 0.15, 0.71, 0.84),
        (-4.75, 0.12, 0.72, 0.82),
    ]
    return loft([spine_section(*station) for station in stations])


PART_SPECS = (
    PartSpec("Fuselage", "#a9b9bb", 0, build_fuselage),
    PartSpec("LeftSweptWing", "#c6d1d0", 1, build_wing, 1),
    PartSpec("RightSweptWing", "#c6d1d0", 1, build_wing, -1),
    PartSpec("LeftTailFin", "#d4b66c", 2, build_fin, 1),
    PartSpec("RightTailFin", "#d4b66c", 2, build_fin, -1),
    PartSpec("SpineAccent", "#d4b66c", 3, build_spine),
    PartSpec("LeftWingAccent", "#63c4d0", 4, build_wing_accent, 1),
    PartSpec("RightWingAccent", "#63c4d0", 4, build_wing_accent, -1),
    PartSpec("FacetedCanopy", "#448d9f", 5, build_canopy),
)


def json_bytes(value: object, *, pretty: bool = False) -> bytes:
    if pretty:
        text = json.dumps(value, ensure_ascii=False, allow_nan=False, indent=2, sort_keys=True)
    else:
        text = json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(",", ":"), sort_keys=True)
    return (text + "\n").encode("utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for block in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def rounded(value: float, digits: int = COORDINATE_DECIMALS) -> float:
    result = round(float(value), digits)
    return 0.0 if result == 0.0 else result


def vector_tuple(point: App.Vector) -> tuple[float, float, float]:
    return (rounded(point.x), rounded(point.y), rounded(point.z))


def shape_objects(document: App.Document) -> list[App.DocumentObject]:
    return [
        obj for obj in document.Objects
        if obj.TypeId == "Part::Feature" and hasattr(obj, "Shape") and not obj.Shape.isNull()
    ]


def shape_bounds(shapes: list[Part.Shape]) -> dict[str, list[float]]:
    bounds = [shape.BoundBox for shape in shapes]
    return {
        "min": [rounded(min(getattr(box, axis + "Min") for box in bounds)) for axis in ("X", "Y", "Z")],
        "max": [rounded(max(getattr(box, axis + "Max") for box in bounds)) for axis in ("X", "Y", "Z")],
    }


def create_document(variant: Variant) -> tuple[App.Document, list[dict[str, object]]]:
    doc = App.newDocument(f"AX01_{variant.name}")
    doc.Label = f"AX-01 KIRIN r1 / {variant.name}"
    group = doc.addObject("App::DocumentObjectGroup", "AX01_KIRIN")
    group.Label = f"AX-01 KIRIN / {variant.name}"
    records: list[dict[str, object]] = []
    for spec in PART_SPECS:
        shape = spec.builder(variant, spec.side)
        if shape.isNull() or not shape.isValid():
            raise RuntimeError(f"Invalid FreeCAD shape: {spec.name} ({variant.name})")
        obj = doc.addObject("Part::Feature", spec.name)
        obj.Label = spec.name
        obj.Shape = shape
        obj.addProperty("App::PropertyString", "DesignId", "Provenance")
        obj.DesignId = DESIGN_ID
        obj.addProperty("App::PropertyString", "Revision", "Provenance")
        obj.Revision = REVISION
        obj.addProperty("App::PropertyString", "Variant", "Provenance")
        obj.Variant = variant.name
        obj.addProperty("App::PropertyString", "SourceFile", "Provenance")
        obj.SourceFile = "scripts/generate-cad.py"
        obj.addProperty("App::PropertyString", "ArtColor", "Visual")
        obj.ArtColor = spec.color
        obj.addProperty("App::PropertyString", "SourceParametersJSON", "Source")
        parameters = {
            "variant": variant.name,
            "wingSpan": variant.wing_span,
            "side": spec.side,
            "coordinateSystem": COORDINATE_SYSTEM,
            "units": UNITS,
        }
        obj.SourceParametersJSON = json_bytes(parameters).decode("utf-8").strip()
        view_object = getattr(obj, "ViewObject", None)
        if view_object is not None:
            rgb = tuple(int(spec.color[index:index + 2], 16) / 255.0 for index in (1, 3, 5))
            view_object.ShapeColor = rgb
            view_object.LineColor = (0.08, 0.13, 0.16)
        group.addObject(obj)
        records.append({
            "name": spec.name,
            "color": spec.color,
            "drawOrder": spec.draw_order,
            "shape": shape,
            "object": obj,
            "sourceParameters": parameters,
        })
    doc.recompute()
    return doc, records


def tessellate(shape: Part.Shape) -> tuple[Mesh.MeshObject, list[App.Vector], list[tuple[int, int, int]]]:
    mesh = MeshPart.meshFromShape(
        shape,
        MESH_SETTINGS["linearDeflection"],
        MESH_SETTINGS["angularDeflectionRadians"],
        MESH_SETTINGS["relative"],
    )
    points, facets = mesh.Topology
    triangles = [tuple(int(index) for index in face) for face in facets]
    if any(len(face) != 3 for face in triangles):
        raise RuntimeError("FreeCAD tessellation returned a non-triangle face")
    if any(index < 0 or index >= len(points) for face in triangles for index in face):
        raise RuntimeError("FreeCAD tessellation returned an out-of-range index")
    return mesh, points, triangles


def part_mesh_record(record: dict[str, object]) -> tuple[dict[str, object], dict[str, object]]:
    shape = record["shape"]
    mesh, points, triangles = tessellate(shape)
    positions = [rounded(axis) for point in points for axis in (point.x, point.y, point.z)]
    indices = [index for triangle in triangles for index in triangle]
    item = {
        "name": record["name"],
        "color": record["color"],
        "positions": positions,
        "indices": indices,
    }
    bounds = shape_bounds([shape])
    info = {
        "name": record["name"],
        "valid": bool(shape.isValid()),
        "isNull": bool(shape.isNull()),
        "solidCount": len(shape.Solids),
        "bounds": bounds,
        "vertexCount": len(points),
        "triangleCount": len(triangles),
        "indexCount": len(indices),
        "meshObject": mesh,
        "points": points,
        "triangles": triangles,
    }
    return item, info


def hausdorff_distance(left: set[tuple[float, float, float]], right: set[tuple[float, float, float]]) -> float:
    if not left or not right:
        return math.inf
    def directed(first: set[tuple[float, float, float]], second: set[tuple[float, float, float]]) -> float:
        return max(min(math.dist(point, candidate) for candidate in second) for point in first)
    return max(directed(left, right), directed(right, left))


def mirrored_wing_deviation(infos: list[dict[str, object]]) -> dict[str, object]:
    by_name = {item["name"]: item for item in infos}
    left = {vector_tuple(point) for point in by_name["LeftSweptWing"]["points"]}
    right = {vector_tuple(point) for point in by_name["RightSweptWing"]["points"]}
    mirrored_right = {(x, rounded(-y), z) for x, y, z in right}
    deviation = hausdorff_distance(left, mirrored_right)
    return {
        "leftPart": "LeftSweptWing",
        "rightPart": "RightSweptWing",
        "method": "symmetric Hausdorff distance between tessellated wing vertex sets after Y reflection",
        "maximumVertexDeviation": rounded(deviation, 9),
        "tolerance": SYMMETRY_TOLERANCE,
        "withinTolerance": deviation <= SYMMETRY_TOLERANCE,
        "comparedLeftVertices": len(left),
        "comparedRightVertices": len(right),
    }


def projected(point: App.Vector, view: str) -> tuple[float, float]:
    if view == "top":
        return (point.y, -point.x)
    if view == "side":
        return (point.x, -point.z)
    return (0.8660254037844386 * (point.x - point.y), 0.5 * (point.x + point.y) - point.z)


def convex_hull(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    unique = sorted(set((round(x, 7), round(y, 7)) for x, y in points))
    if len(unique) <= 2:
        return unique
    def cross(o: tuple[float, float], a: tuple[float, float], b: tuple[float, float]) -> float:
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower: list[tuple[float, float]] = []
    for point in unique:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], point) <= 0:
            lower.pop()
        lower.append(point)
    upper: list[tuple[float, float]] = []
    for point in reversed(unique):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], point) <= 0:
            upper.pop()
        upper.append(point)
    return lower[:-1] + upper[:-1]


def projection_fit(points: list[tuple[float, float]], box: tuple[float, float, float, float], margin: float = 24.0) -> tuple[float, float, float]:
    x, y, width, height = box
    px = [point[0] for point in points]
    py = [point[1] for point in points]
    lo_x, hi_x = min(px), max(px)
    lo_y, hi_y = min(py), max(py)
    scale = min((width - margin * 2) / max(hi_x - lo_x, 1e-9), (height - margin * 2) / max(hi_y - lo_y, 1e-9))
    offset_x = x + (width - (hi_x - lo_x) * scale) * 0.5 - lo_x * scale
    offset_y = y + (height - (hi_y - lo_y) * scale) * 0.5 - lo_y * scale
    return scale, offset_x, offset_y


def fitted_polygon(points: list[tuple[float, float]], fit: tuple[float, float, float]) -> str:
    scale, offset_x, offset_y = fit
    return " ".join(f"{offset_x + px_i * scale:.2f},{offset_y + py_i * scale:.2f}" for px_i, py_i in points)


def svg_preview(variant: Variant, mesh_records: list[dict[str, object]], infos: list[dict[str, object]]) -> str:
    info_by_name = {item["name"]: item for item in infos}
    part_hulls: dict[str, dict[str, list[tuple[float, float]]]] = {}
    for record in mesh_records:
        points = info_by_name[record["name"]]["points"]
        part_hulls[record["name"]] = {
            view: convex_hull([projected(point, view) for point in points])
            for view in ("top", "side", "iso")
        }

    view_specs = (
        ("top", "PLAN VIEW", (48, 138, 840, 660)),
        ("iso", "AXONOMETRIC", (916, 138, 468, 344)),
        ("side", "SIDE VIEW", (916, 532, 468, 266)),
    )
    body: list[str] = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 860" role="img" aria-labelledby="title desc">',
        f'<title id="title">AX-01 KIRIN, {variant.name} visual CAD preview</title>',
        '<desc id="desc">Three projected views derived from FreeCAD tessellated geometry. Units are arbitrary design units.</desc>',
        '<defs><pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#25343d" stroke-width="1"/></pattern></defs>',
        '<rect width="1440" height="860" fill="#0b1218"/>',
        '<rect width="1440" height="860" fill="url(#grid)" opacity="0.5"/>',
        '<text x="48" y="54" fill="#e7f0ef" font-family="Segoe UI,Arial,sans-serif" font-size="30" font-weight="700" letter-spacing="2">AX-01  KIRIN</text>',
        f'<text x="48" y="88" fill="#6fd2dd" font-family="Segoe UI,Arial,sans-serif" font-size="15" letter-spacing="2">{variant.name.upper()} / FICTIONAL VISUAL GEOMETRY</text>',
        '<text x="1384" y="56" text-anchor="end" fill="#a9b9bb" font-family="Segoe UI,Arial,sans-serif" font-size="13">REV r1 · ARBITRARY DESIGN UNITS</text>',
    ]
    draw_order = {spec.name: spec.draw_order for spec in PART_SPECS}
    color_map = {record["name"]: record["color"] for record in mesh_records}
    for view, label, box in view_specs:
        x, y, width, height = box
        projected_points = [point for hulls in part_hulls.values() for point in hulls[view]]
        fit = projection_fit(projected_points, (x + 10, y + 38, width - 20, height - 48))
        body.extend([
            f'<g id="{view}">',
            f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="12" fill="#101a21" stroke="#344750" stroke-width="1.2"/>',
            f'<text x="{x + 20}" y="{y + 26}" fill="#9cb6bb" font-family="Segoe UI,Arial,sans-serif" font-size="12" letter-spacing="2">{label}</text>',
        ])
        for name in sorted(part_hulls, key=lambda key: draw_order[key]):
            hull = part_hulls[name][view]
            if len(hull) < 3:
                continue
            pts = fitted_polygon(hull, fit)
            body.append(
                f'<polygon points="{pts}" fill="{color_map[name]}" fill-opacity="0.88" '
                'stroke="#e1eeee" stroke-opacity="0.8" stroke-width="1.3" stroke-linejoin="round"/>'
            )
        if view == "top":
            body.append(f'<path d="M {x + width / 2:.1f} {y + 55} V {y + height - 24}" stroke="#8ca6aa" stroke-opacity="0.35" stroke-dasharray="7 7"/>')
            body.append(f'<text x="{x + width / 2:.1f}" y="{y + height - 17}" text-anchor="middle" fill="#768b91" font-family="Segoe UI,Arial,sans-serif" font-size="10">+X FORWARD</text>')
        body.append('</g>')
    body.extend([
        '<text x="48" y="834" fill="#6b8289" font-family="Segoe UI,Arial,sans-serif" font-size="11" letter-spacing="1">ART GEOMETRY ONLY · NO PERFORMANCE OR ENGINEERING ANALYSIS</text>',
        '</svg>',
    ])
    return "\n".join(body) + "\n"


def sanitize_step_header(path: Path, generated_at: str) -> dict[str, object]:
    text = path.read_text(encoding="utf-8")
    marker = "ENDSEC;"
    boundary = text.find(marker)
    if boundary < 0:
        raise RuntimeError("STEP export has no HEADER terminator")
    header, body = text[:boundary], text[boundary:]
    replacement = (
        "FILE_NAME('ax01.step', "
        f"'{generated_at}', ('ONIZUKA AERO AGI Co.'), ('ONIZUKA AERO AGI Co.'), "
        "'FreeCAD', 'FreeCAD', '');"
    )
    sanitized, count = re.subn(r"FILE_NAME\s*\(.*?\)\s*;", replacement, header, count=1, flags=re.DOTALL)
    if count != 1:
        raise RuntimeError("STEP export has no recognizable FILE_NAME header")
    path.write_text(sanitized + body, encoding="utf-8", newline="\n")
    checked = path.read_text(encoding="utf-8")
    leaks = []
    for label, pattern in local_path_patterns():
        if pattern.search(checked):
            leaks.append(label)
    return {"headerSanitized": True, "localPathScanPassed": not leaks, "findings": leaks}


def inspect_fcstd(path: Path) -> dict[str, object]:
    scans = []
    with zipfile.ZipFile(path) as archive:
        for name in archive.namelist():
            if not name.lower().endswith((".xml", ".txt")):
                continue
            content = archive.read(name).decode("utf-8", errors="replace")
            for label, pattern in local_path_patterns():
                if pattern.search(content):
                    scans.append({"entry": name, "finding": label})
    return {"archiveReadable": True, "localPathScanPassed": not scans, "findings": scans}


def export_variant(variant: Variant, generated_at: str, source_hash: str) -> dict[str, object]:
    output_dir = ASSET_ROOT / variant.name
    output_dir.mkdir(parents=True, exist_ok=True)
    paths = {
        "nativeCad": output_dir / "ax01.FCStd",
        "step": output_dir / "ax01.step",
        "stl": output_dir / "ax01.stl",
        "mesh": output_dir / "mesh.json",
        "preview": output_dir / "preview.svg",
    }
    doc, records = create_document(variant)
    doc_name = doc.Name
    mesh_records: list[dict[str, object]] = []
    infos: list[dict[str, object]] = []
    part_meshes: list[Mesh.MeshObject] = []
    try:
        for record in records:
            mesh_record, info = part_mesh_record(record)
            mesh_records.append(mesh_record)
            infos.append(info)
            part_meshes.append(info["meshObject"])

        mesh_payload = {
            "schemaVersion": 1,
            "designId": DESIGN_ID,
            "revision": REVISION,
            "variant": variant.name,
            "units": UNITS,
            "coordinateSystem": COORDINATE_SYSTEM,
            "parts": mesh_records,
        }
        mesh_data = json_bytes(mesh_payload)
        paths["mesh"].write_bytes(mesh_data)
        paths["preview"].write_text(svg_preview(variant, mesh_records, infos), encoding="utf-8", newline="\n")

        total_triangles = sum(item["triangleCount"] for item in infos)
        if total_triangles >= MAX_TRIANGLES:
            raise RuntimeError(f"{variant.name} mesh has {total_triangles} triangles, above the {MAX_TRIANGLES} target")
        if len(mesh_data) >= MAX_MESH_BYTES:
            raise RuntimeError(f"{variant.name} mesh JSON is {len(mesh_data)} bytes, above the {MAX_MESH_BYTES} target")

        if paths["nativeCad"].exists():
            paths["nativeCad"].unlink()
        doc.saveAs(str(paths["nativeCad"]))
        Part.export([record["object"] for record in records], str(paths["step"]))
        step_scan = sanitize_step_header(paths["step"], generated_at)

        combined_mesh = Mesh.Mesh()
        for part_mesh in part_meshes:
            combined_mesh.addMesh(part_mesh)
        combined_mesh.write(str(paths["stl"]))

        App.closeDocument(doc.Name)
        reopened = App.openDocument(str(paths["nativeCad"]))
        native_objects = shape_objects(reopened)
        native_valid = all(bool(obj.Shape.isValid()) for obj in native_objects)
        native_check = {
            "reopened": True,
            "shapeObjectCount": len(native_objects),
            "expectedShapeObjectCount": len(PART_SPECS),
            "allShapesValid": native_valid,
            "valid": len(native_objects) == len(PART_SPECS) and native_valid,
        }
        App.closeDocument(reopened.Name)

        step_doc = App.newDocument(f"AX01_{variant.name}_STEP_check")
        try:
            Part.insert(str(paths["step"]), step_doc.Name)
            step_doc.recompute()
            step_objects = shape_objects(step_doc)
            step_valid = all(bool(obj.Shape.isValid()) for obj in step_objects)
            step_check = {
                "reimported": True,
                "shapeObjectCount": len(step_objects),
                "expectedShapeObjectCount": len(PART_SPECS),
                "allShapesValid": step_valid,
                "valid": len(step_objects) == len(PART_SPECS) and step_valid,
            }
        finally:
            App.closeDocument(step_doc.Name)

        stl_mesh = Mesh.Mesh(str(paths["stl"]))
        stl_check = {
            "reopened": True,
            "triangleCount": stl_mesh.CountFacets,
            "expectedTriangleCount": total_triangles,
            "triangleCountMatches": stl_mesh.CountFacets == total_triangles,
        }
        stl_check["valid"] = bool(stl_check["triangleCountMatches"] and stl_mesh.CountFacets > 0)

        symmetry = mirrored_wing_deviation(infos)
        if not symmetry["withinTolerance"]:
            raise RuntimeError(f"{variant.name} wing symmetry exceeded tolerance")

        part_validity = [{key: value for key, value in item.items() if key not in ("meshObject", "points", "triangles")} for item in infos]
        all_parts_valid = all(item["valid"] and not item["isNull"] and item["solidCount"] > 0 for item in part_validity)
        if not all_parts_valid:
            raise RuntimeError(f"{variant.name} has an invalid or non-solid part")

        path_scan = inspect_fcstd(paths["nativeCad"])
        if not step_scan["localPathScanPassed"] or not path_scan["localPathScanPassed"]:
            raise RuntimeError(f"{variant.name} export contains a local path or user-name value")
        if not native_check["valid"] or not step_check["valid"] or not stl_check["valid"]:
            raise RuntimeError(
                f"{variant.name} export reopen validation failed: "
                f"native={native_check}, step={step_check}, stl={stl_check}"
            )

        relative_outputs = {}
        for key, path in paths.items():
            relative_outputs[key] = {
                "path": path.relative_to(ROOT).as_posix(),
                "bytes": path.stat().st_size,
                "sha256": sha256_file(path),
            }
        return {
            "variant": variant.name,
            "status": "passed",
            "bounds": shape_bounds([record["shape"] for record in records]),
            "partCount": len(records),
            "vertexCount": sum(item["vertexCount"] for item in infos),
            "triangleCount": total_triangles,
            "meshJsonBytes": len(mesh_data),
            "partValidity": part_validity,
            "wingSymmetry": symmetry,
            "meshContract": {
                "schemaVersion": mesh_payload["schemaVersion"],
                "allPositionsFlatXYZ": all(len(item["positions"]) % 3 == 0 for item in mesh_records),
                "allIndicesFlatTriangles": all(len(item["indices"]) % 3 == 0 for item in mesh_records),
                "allIndicesInRange": all(
                    all(0 <= index < len(item["positions"]) // 3 for index in item["indices"])
                    for item in mesh_records
                ),
                "underTriangleTarget": total_triangles < MAX_TRIANGLES,
                "underMeshByteTarget": len(mesh_data) < MAX_MESH_BYTES,
            },
            "exportReopenChecks": {
                "nativeCad": native_check,
                "step": step_check,
                "stl": stl_check,
                "stepHeaderScan": step_scan,
                "nativeCadArchiveScan": path_scan,
            },
            "outputs": relative_outputs,
        }
    finally:
        if doc_name in App.listDocuments():
            App.closeDocument(doc_name)


def freecad_version() -> dict[str, str]:
    info = App.Version()
    return {
        "version": ".".join(info[:3]),
        "build": info[3] if len(info) > 3 else "unknown",
        "gitRevision": info[7] if len(info) > 7 else "unknown",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--verify-determinism",
        action="store_true",
        help="compare existing variant mesh hashes with this regeneration",
    )
    args = parser.parse_args()
    if App.listDocuments():
        raise RuntimeError("Run this generator in a fresh FreeCAD Python process; existing documents are left untouched")

    existing_hashes = {}
    if args.verify_determinism:
        for variant in VARIANTS:
            path = ASSET_ROOT / variant.name / "mesh.json"
            if not path.is_file():
                raise RuntimeError(f"Cannot compare deterministic mesh hash because {variant.name} baseline is missing")
            existing_hashes[variant.name] = sha256_file(path)

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    source_hash = sha256_file(Path(__file__).resolve())
    variants = [export_variant(variant, generated_at, source_hash) for variant in VARIANTS]
    generated_hashes = {item["variant"]: item["outputs"]["mesh"]["sha256"] for item in variants}
    determinism = {
        "executed": bool(args.verify_determinism),
        "previousMeshSha256": existing_hashes if args.verify_determinism else None,
        "currentMeshSha256": generated_hashes,
        "matches": all(existing_hashes[name] == generated_hashes[name] for name in generated_hashes) if args.verify_determinism else None,
    }
    status = "passed" if all(item["status"] == "passed" for item in variants) and determinism["matches"] is not False else "failed"
    report = {
        "schemaVersion": 1,
        "reportType": "geometry-analysis",
        "license": "CC-BY-4.0",
        "attribution": "ONIZUKA AERO AGI Co., AX-01 KIRIN geometry record r1",
        "valueKinds": {
            "boundsPartValidityCountsAndSymmetry": "measured-from-generated-CAD-and-mesh",
            "tessellationSettingsAndTolerances": "authored-check-configuration",
            "colorsAndShapeDefinition": "artistic",
        },
        "status": status,
        "designId": DESIGN_ID,
        "revision": REVISION,
        "units": UNITS,
        "coordinateSystem": COORDINATE_SYSTEM,
        "scope": "Fictional visual CAD geometry and export validity only. No aerodynamic, structural, propulsion, stealth, weapon, or flight-performance analysis.",
        "assemblyGeometryNote": "Parts are separate artistic outer shapes and may overlap. No assembled watertight-solid claim is made.",
        "generatedAtUtc": generated_at,
        "freeCAD": freecad_version(),
        "generatorSource": {"path": "scripts/generate-cad.py", "sha256": source_hash},
        "tessellationSettings": MESH_SETTINGS,
        "meshBudgets": {"targetTrianglesPerVariantExclusive": MAX_TRIANGLES, "targetJsonBytesPerVariantExclusive": MAX_MESH_BYTES},
        "regenerationCheck": determinism,
        "variants": variants,
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_bytes(json_bytes(report, pretty=True))
    print(json.dumps({
        "status": status,
        "report": REPORT_PATH.relative_to(ROOT).as_posix(),
        "variants": [
            {"variant": item["variant"], "triangles": item["triangleCount"], "meshBytes": item["meshJsonBytes"], "meshSha256": item["outputs"]["mesh"]["sha256"]}
            for item in variants
        ],
        "regenerationMatches": determinism["matches"],
    }, ensure_ascii=False))
    if status != "passed":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
