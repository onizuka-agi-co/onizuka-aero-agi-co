# One CAD source, two public experiences

AX-01 SUZAKU r3 is a fictional collectible toy. The selected concept sheet is visual reference art. It is not a CAD render or an engineering result. The native CAD document and browser mesh describe the generated appearance, not aircraft performance.

The FreeCAD generator owns the geometry. It exports an editable document, STEP, STL, and an indexed JSON mesh with named colored parts. The browser renderer loads that exported mesh directly. It does not draw a second aircraft from hand-written shapes.

~~~mermaid
flowchart LR
  A[Selected C concept sheet and prompts] --> B[Parametric art definition]
  B --> C[FreeCAD generator]
  C --> D[FCStd / STEP / STL]
  C --> E[Colored triangle mesh]
  D --> F[Reopen and geometry checks]
  E --> G[Three.js hangar and arcade]
  H[Independent toy controls] --> G
  H --> I[Deterministic replay recorder]
  F --> J[Public dataset and checksums]
  I --> J
~~~

## Module ownership

| Path | Owns |
| --- | --- |
| `design/concepts/ax01-r2/` | Four concept sheets, prompts, and the user-selected visual reference |
| `scripts/generate-cad.py` | Parametric shapes, visual variants, exports, geometry checks, and concept-reference provenance |
| `src/arcade.mjs` | Fixed-step toy movement, course generation, scoring, and lifecycle |
| Other `src/` modules | Rendering, interface, and normal user input |
| `scripts/record-arcade.mjs` | Executions of the same arcade model and replay data |
| `scripts/catalog.mjs` | Public file inventory, source hashes, and license mapping |
| `scripts/snapshot-company.mjs` | Observed public issue states, without invented company activity |
| `scripts/verify-public.mjs` | Anonymous site downloads and commit-pinned source verification |
| `scripts/review-visibility.mjs` | Repeatable triangle-center ray samples for decorative panel occlusion |

## Mesh interface

Each `public/assets/ax01/{variant}/mesh.json` file contains `schemaVersion`, `designId`, `displayName`, `revision`, `variant`, `units`, `coordinateSystem`, and `parts`.

Each part has a unique `name`, an artistic hex `color`, a flat `positions` array of finite XYZ coordinates, and an `indices` array of triangle indices. Coordinates use +X forward, Y span, and +Z up. Units are arbitrary design units. The renderer changes the coordinate basis and computes display normals.

Named part solids can overlap. Per-part geometric validity does not mean that the visual assembly forms one watertight manufacturing solid.

## Arcade interface

`createState({variant, seed})` creates a session. `step(state, input)` returns the next state. `ARCADE_CONFIGS` contains explicitly artistic tuning. `FIXED_DT_SECONDS` defines the model tick. Rendering and replay recording share the same model.

Geometry measurements do not determine arcade turning or speed values. Differences in game feel are authored choices and are labeled as such. A game score cannot validate physical flight behavior.

## Design decision

The project uses CAD as the geometry authority. This avoids two implementations of geometric semantics. The r3 generator records concept-reference provenance and exports the same mesh consumed by the game. The mesh keeps each CAD part's color without a separate GLB conversion dependency.

The [geometry report](../public/data/geometry-report.json) records fixed tessellation settings, measured part and triangle counts, export-reopen checks, deterministic mesh regeneration, and the selected concept image hash. The SVG preview embeds four orthographic PNG views rendered from those mesh triangles with a CPU depth buffer and supersampling. Depth testing handles overlapping toy panels; sorting whole parts or triangle centroids cannot reliably hide their intersections.

The game centers the exported vertices once, computes normals with crease boundaries, and fits its studio camera to the actual vertices and viewport. Material finishes and lighting affect display only. The [visual review](../evidence/suzaku-concept-review.json) records qualitative comparison with concept C separately from geometry validity, browser controls, and publication checks.
