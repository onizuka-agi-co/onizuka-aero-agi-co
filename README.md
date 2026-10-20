# ONIZUKA AERO AGI Co.

[日本語](README.ja.md) · [Play SUZAKU r3](https://onizuka-agi-co.github.io/onizuka-aero-agi-co/) · [SUZAKU r3 CAD preview](https://onizuka-agi-co.github.io/onizuka-aero-agi-co/assets/ax01/standard/preview.svg)

ONIZUKA AERO AGI Co. publishes original aviation-themed digital art, geometry checks, and a civilian arcade game as reproducible artifacts. A human mission owner sets the mission and publication policy.

The current source design is **AX-01 SUZAKU r3**, a fictional collectible toy with red, ivory, and gold detailing and forward-swept main wings. The selected C concept image remains the visual reference at `design/concepts/ax01-r2/c-suzaku.png`; r3 does not introduce new concept art. The `standard` and `longwing` variants are generated from the r3 design.

Four concept sheets were generated with the built-in `image_gen imagegen` tool. The user selected C / SUZAKU. The prompts and selection are recorded in `design/concepts/ax01-r2/concepts.json`. The PNG files are concept art, not CAD renders or engineering results.

![Selected C / SUZAKU concept sheet](design/concepts/ax01-r2/c-suzaku.png)

![AX-01 SUZAKU standard CAD preview](public/assets/ax01/standard/preview.svg)

## Project status

The r3 [geometry report](public/data/geometry-report.json) passes shape validity, native/STEP/STL reopen checks, mirrored-wing symmetry, and deterministic mesh regeneration. The qualitative review accepted all six salient criteria for a fictional toy interpretation; it does not claim user approval or exact photoreal reproduction. See the [concept review record](evidence/suzaku-concept-review.json) and [final CAD views](evidence/suzaku-r3-cad-final.jpg).

The r3 arcade summary contains three generated synthetic-input records. `npm test` passed all 15 Node tests, including replay tests. See the [arcade summary](public/data/arcade-summary.json).

The r3 production build and catalog verification passed. The build emitted a 572 kB chunk-size warning; the catalog verifies 20 public files and 21 hashed source entries. Automated Chromium validation passed 12/12 checks with an emulated touch viewport; see the [passing browser report](evidence/browser-automated.json). Physical phones are untested. An earlier mobile-touch failure is retained in the [first-failure report](evidence/suzaku-r3-browser-first-failure.json). [GitHub CI and Pages deployment](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39448567448) passed for r3. All 12 browser checks passed on the public site, and 42 anonymous downloads matched byte sizes and SHA-256 hashes. See the [browser report](evidence/browser-public.json) and [publication record](evidence/publication.json). The r2 build, browser, CI, and publication results are historical in [evidence/history/suzaku-r2](evidence/history/suzaku-r2/); the game and CAD preview links above now serve r3.

## Reproduce

The r3 geometry, Node, build, catalog, and automated Chromium checks passed. [GitHub CI and Pages deployment](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39448567448) passed for r3. All 12 browser checks passed on the public site, and 42 anonymous downloads matched byte sizes and SHA-256 hashes. See the [browser report](evidence/browser-public.json) and [publication record](evidence/publication.json). See [docs/reproduce.md](docs/reproduce.md) for commands and evidence. The r2 public-site and anonymous-download reports remain in [evidence/history/suzaku-r2](evidence/history/suzaku-r2/).

Install dependencies with `npm ci`, run the checks with `npm test`, and build with `npm run build`. The [reproduction guide](docs/reproduce.md) gives the CAD, data, and browser-validation commands.

## Project policies

- [Mission and governance](docs/company.md) explains decision authority and task management.
- [Data policy](docs/data-policy.md) defines publication, provenance, and telemetry limits.
- [Dataset card](docs/dataset-card.md) describes the generated records and their limits.
- [Contributing](CONTRIBUTING.md) explains how to propose and check changes.

## Licenses

The MIT License covers source code, art, images, meshes, CAD files, and documentation. The CC BY 4.0 license covers records under `public/data/*`, `evidence/*.json`, and `decisions.tsv`. Third-party materials retain their original licenses. See [THIRD_PARTY.md](THIRD_PARTY.md) for notices.
