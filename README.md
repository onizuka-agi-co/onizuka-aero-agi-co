# ONIZUKA AERO AGI Co.

[日本語](README.ja.md) | English

ONIZUKA AERO AGI Co. explores agent-led aviation-themed design, verification, and game production. AI agents make original digital assets, check their geometry, build a civilian arcade game, and publish the work and its records as reproducible artifacts. A human mission owner sets the mission and publication policy; agents work within that approved scope.

The initial release centers on AX-01 KIRIN, a fictional near-future fighter-inspired visual asset, geometry checks, and a civilian gate-flight arcade game. `standard` and `longwing` are artistic variants. The game uses the mesh generated from the corresponding CAD asset. See the [dataset card](docs/dataset-card.md) for the contents and limits.

![AX-01 KIRIN, standard artistic variant](public/assets/ax01/standard/preview.svg)

## Project status

FreeCAD 1.1.3 generated the CAD outputs for both variants. The geometry report passes for all nine parts and 360 mesh triangles per variant. Native FreeCAD, STEP, and STL exports reopened successfully. The mirrored-wing vertex deviation is 0.0 arbitrary design units. The regeneration check matched the SHA-256 hashes of both meshes. See the [geometry report](public/data/geometry-report.json).

The arcade dataset contains three replay records built from saved input frames. The `standard` and `longwing` route-following runs each passed 14 of 14 gates and scored 3,300 points. The `standard` miss-control run passed no gates and scored 0. See the [arcade summary](public/data/arcade-summary.json).

Local validation passed 14 Node tests and 12 Playwright browser checks. The browser records cover Chromium on desktop and a touch-emulated mobile viewport; no physical phone was tested. See the [automated browser report](evidence/browser-automated.json) and [browser UI report](evidence/browser-qa.json).

The GitHub repository is public at [onizuka-agi-co/onizuka-aero-agi-co](https://github.com/onizuka-agi-co/onizuka-aero-agi-co). The playable site targets [onizuka-agi-co.github.io/onizuka-aero-agi-co](https://onizuka-agi-co.github.io/onizuka-aero-agi-co/); GitHub Pages publication and GitHub Actions CI are pending.

## Reproduce

Install dependencies with `npm ci`, run the checks with `npm test`, and build with `npm run build`. Start the local development server with `npm run dev`. The [reproduction guide](docs/reproduce.md) gives the full CAD, data, and browser-validation sequence.

## Project policies

- [Mission and governance](docs/company.md) describes decision rights and the task lifecycle.
- [Data policy](docs/data-policy.md) defines publication, provenance, and telemetry rules.
- [Dataset card](docs/dataset-card.md) describes the generated records and their limits.
- [Contributing](CONTRIBUTING.md) explains how to propose and verify changes.

## License

Source code, artwork, images, mesh assets, CAD files, and documentation use the MIT License in [LICENSE](LICENSE); see the [canonical MIT text](https://opensource.org/license/mit). Data records under `public/data/*`, `evidence/*.json`, and `decisions.tsv` use CC BY 4.0 as described in [LICENSE-DATA](LICENSE-DATA). Third-party material keeps its original license; see [third-party notices](THIRD_PARTY.md).
