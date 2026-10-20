# ONIZUKA AERO AGI Co.

ONIZUKA AERO AGI Co. publishes original aviation-themed digital art, geometry checks, and a civilian arcade game as reproducible artifacts. A human mission owner sets the mission and publication policy.

The current design is **AX-01 SUZAKU r2**, a fictional collectible toy with red, ivory, and gold detailing and forward-swept main wings. The `standard` and `longwing` variants retain the existing controls and rules, with their variant-specific in-game tuning unchanged.

Four concept sheets were generated with the built-in `image_gen imagegen` tool. The user selected C / SUZAKU. The prompts and selection are recorded in `design/concepts/ax01-r2/concepts.json`. The PNG files are concept art, not CAD renders or engineering results.

![Selected C / SUZAKU concept sheet](design/concepts/ax01-r2/c-suzaku.png)

![AX-01 SUZAKU standard CAD preview](public/assets/ax01/standard/preview.svg)

## Project status

The FreeCAD 1.1.3 geometry report passes for both variants. Each has 40 valid shapes. The standard mesh has 2,800 triangles and the longwing mesh has 2,752. FreeCAD and STEP files reopened with 40 shapes each, and the STL facet counts match the meshes. The mirrored-wing deviation is 0.0 arbitrary design units. The regeneration check matched both mesh SHA-256 hashes. See the [geometry report](public/data/geometry-report.json).

The arcade dataset contains three generated replay records. The standard and longwing route-following runs each pass all 14 gates and score 3,300 points. The miss-control run passes no gates and scores 0. All three replay tests passed after regeneration. See the [arcade summary](public/data/arcade-summary.json).

The r2 local production build and browser checks passed: automated Chromium reported 12/12 checks, and a separate direct in-app-browser session passed 9/9 checks. The Node suite passed 15/15, and the manifest covers 20 public files and 20 hashed sources. The direct session also verified course completion and pause/resume behavior. These checks target local previews; physical phones are untested. GitHub r2 CI, Pages publication, and anonymous verification of the latest public deployment are pending. Older browser and publication reports describe r1 and remain historical. See the [automated browser report](evidence/browser-automated.json) and [direct browser report](evidence/browser-suzaku-ui.json).

## Reproduce

Install dependencies with `npm ci`, run the checks with `npm test`, and build with `npm run build`. The [reproduction guide](docs/reproduce.md) gives the CAD, data, and browser-validation commands.

## Project policies

- [Mission and governance](docs/company.md) explains decision authority and task management.
- [Data policy](docs/data-policy.md) defines publication, provenance, and telemetry limits.
- [Dataset card](docs/dataset-card.md) describes the generated records and their limits.
- [Contributing](CONTRIBUTING.md) explains how to propose and check changes.

## Licenses

The MIT License covers source code, art, images, meshes, CAD files, and documentation. The CC BY 4.0 license covers records under `public/data/*`, `evidence/*.json`, and `decisions.tsv`. Third-party materials retain their original licenses. See [THIRD_PARTY.md](THIRD_PARTY.md) for notices.
