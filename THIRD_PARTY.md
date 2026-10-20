# Third-party software and notices

Playwright 1.62.1 is used for development and browser verification under the Apache-2.0 license. It is not included in the deployed game. Its browser binaries have their own notices. See https://github.com/microsoft/playwright/blob/main/LICENSE .

This file lists the direct browser dependency and the tools named in the project contract. Check the package lockfile and upstream notices before each release to account for the exact installed versions and their transitive dependencies.

| Component | Role | Version | License and notices |
| --- | --- | --- | --- |
| Three.js | Browser rendering | 0.186.1 | MIT. [Upstream license](https://github.com/mrdoob/three.js/blob/dev/LICENSE) |
| Vite | Local development and build tool | 8.3.4 | MIT. [Upstream license](https://github.com/vitejs/vite/blob/main/LICENSE) |
| Node.js | JavaScript runtime | 24 | See the [upstream license and bundled notices](https://github.com/nodejs/node/blob/main/LICENSE). |
| FreeCAD | CAD authoring and export tool | 1.1.3 | See the [upstream license file](https://github.com/FreeCAD/FreeCAD/blob/main/LICENSE). This repository does not include the FreeCAD application. |

The project contract specifies the versions shown above. Reconcile this list with the actual lockfile and tool versions before publication. Third-party material keeps its original license; preserve required upstream notices when redistributing third-party software.
