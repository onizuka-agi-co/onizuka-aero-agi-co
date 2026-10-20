# Reproduce the project outputs

[日本語](#日本語) | [English](#english)

## 日本語

### 必要な環境

- Node.js 24とnpm 11
- FreeCAD 1.1.3。同梱Pythonから `FreeCAD` と `Part` を読み込める環境
- PowerShell
- ブラウザ検証用のPlaywright Chromium
- 会社ミッション記録の更新にはGitHub CLI

### CADと記録を生成する

リポジトリのルートで依存関係を導入し、FreeCAD同梱Pythonの実行ファイルを `FREECAD_PYTHON` に指定します。

~~~powershell
npm ci
$env:FREECAD_PYTHON = 'C:\path\to\FreeCAD\bin\python.exe'

& $env:FREECAD_PYTHON .\scripts\generate-cad.py
& $env:FREECAD_PYTHON .\scripts\generate-cad.py --verify-determinism
npm run record:arcade
node .\scripts\snapshot-company.mjs
npm run catalog
npm run verify:data
~~~

`generate-cad.py` は両バリアントのFreeCAD、STEP、STL、`mesh.json`、プレビューSVG、形状レポートを生成します。最初の生成後に `--verify-determinism` を実行すると、再生成したメッシュのSHA-256を既存値と比較します。`.FCStd` を含むすべてのファイルのバイト一致は確認しません。

`npm run record:arcade` は保存済みの合成入力を `src/arcade.mjs` で再生し、JSONとCSVを出力します。`node .\scripts\snapshot-company.mjs` はGitHub CLIで公開Issueの状態を取得し、実行時点の記録を保存します。この記録は実行時刻と公開Issueの状態を反映したスナップショットです。

`npm run catalog` は公開ファイルとソースのサイズ、SHA-256、ライセンスを `public/data/manifest.json` に記録します。`design/concepts/ax01-r2/` の画像とプロンプトもMITソースとして含めます。ソースをすべて生成した後にカタログを更新してください。`npm run verify:data` はマニフェストに記載されたファイルを照合します。

### テストとローカル起動

~~~powershell
npm test
npm run build
npx playwright install chromium
npm run test:browser
~~~

`npm test` はNodeのテストを実行し、`npm run build` は本番用ファイルを生成します。r2の実行ではNodeテスト15件と本番ビルドが合格しました。`npm run test:browser` はビルド済みアプリを使い、ポート4188で専用のVite previewを起動します。別途 `npm run preview` を起動する必要はありません。現在のローカル記録では自動Chromium確認12件、直接UI確認9件が合格しています（[自動確認](../evidence/browser-automated.json)、[直接UI確認](../evidence/browser-suzaku-ui.json)）。スマートフォン実機では未確認です。[GitHub Actions CIとPagesデプロイ](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39439337215)は成功しました。公開サイトでもブラウザ12項目が通過し、匿名取得した41ファイルのサイズとSHA-256が一致しました。

開発サーバーは `npm run dev` で起動します。ビルド済みアプリを確認する場合は、先に `npm run build` を実行し、その後 `npm run preview` を起動します。

### 公開サイトを確認する

公開後にChromiumで操作確認し、匿名HTTP取得で公開ファイルを照合します。

~~~powershell
npm run test:browser -- https://onizuka-agi-co.github.io/onizuka-aero-agi-co/ evidence/browser-public.json
node .\scripts\verify-public.mjs
~~~

`scripts/verify-public.mjs` は公開サイトのファイルと、`HEAD` のコミットを指定したGitHub rawソースを匿名で取得します。コミットを公開してから実行してください。ローカル変更が未公開の場合、ソースの照合に失敗します。

### 記録の解釈

形状値は任意設計単位です。アーケード記録は模擬ゲーム状態です。どちらも実際の飛行性能や航空宇宙工学の評価として解釈しないでください。ブラウザ確認はChromiumの画面とタッチ操作のエミュレーションです。スマートフォン実機の確認とは異なります。r2のローカル確認に加え、公開URLでの操作と匿名取得も確認しました。r1と明記された以前のブラウザ・公開記録は履歴資料として扱います。

## English

### Requirements

- Node.js 24 and npm 11
- FreeCAD 1.1.3 with bundled Python that can import `FreeCAD` and `Part`
- PowerShell
- Playwright Chromium for browser checks
- GitHub CLI to refresh the company mission snapshot

### Generate CAD and records

From the repository root, install dependencies and set `FREECAD_PYTHON` to FreeCAD's bundled Python executable.

~~~powershell
npm ci
$env:FREECAD_PYTHON = 'C:\path\to\FreeCAD\bin\python.exe'

& $env:FREECAD_PYTHON .\scripts\generate-cad.py
& $env:FREECAD_PYTHON .\scripts\generate-cad.py --verify-determinism
npm run record:arcade
node .\scripts\snapshot-company.mjs
npm run catalog
npm run verify:data
~~~

`generate-cad.py` creates FreeCAD, STEP, and STL files, `mesh.json`, preview SVGs, and a geometry report for both variants. Run `--verify-determinism` after the first generation to compare SHA-256 hashes of the regenerated meshes with the existing files. The check does not verify byte-for-byte identity for every output, including `.FCStd` files.

`npm run record:arcade` replays saved synthetic inputs through `src/arcade.mjs` and writes JSON and CSV files. `node .\scripts\snapshot-company.mjs` reads public issue status through the GitHub CLI and writes an observation record for the current time. That record changes with the run time and public issue state.

`npm run catalog` records public file and source sizes, SHA-256 hashes, and licenses in `public/data/manifest.json`. It includes the concept images and prompts under `design/concepts/ax01-r2/` as MIT sources. Update the catalog after generating all source files. `npm run verify:data` checks the files listed in the manifest.

### Tests and local preview

~~~powershell
npm test
npm run build
npx playwright install chromium
npm run test:browser
~~~

`npm test` runs the Node tests, and `npm run build` creates the production files. `npm run test:browser` uses the built app and starts its own Vite preview on port 4188. You do not need to start `npm run preview` separately.

Start the development server with `npm run dev`. To inspect the built app, run `npm run build` first, then start `npm run preview`.

### Verify the public site

After publishing, check the site in Chromium and compare the public files with the anonymous HTTP results.

~~~powershell
npm run test:browser -- https://onizuka-agi-co.github.io/onizuka-aero-agi-co/ evidence/browser-public.json
node .\scripts\verify-public.mjs
~~~

`scripts/verify-public.mjs` fetches public files anonymously and fetches source files from GitHub raw at the commit in `HEAD`. Publish the commit before running the script. The source check fails when the local changes are not public.

### Interpret the records

Geometry values use arbitrary design units. Arcade records are simulated game state. Do not interpret either as actual flight performance or aerospace engineering results. Current local r2 browser checks are recorded in the automated Chromium and direct UI reports. The automated touch check uses an emulated viewport; the direct session used a desktop in-app browser. Neither tests physical phones. [GitHub Actions CI and Pages deployment](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39439337215) passed for r2. All 12 browser checks also passed on the public site, and 41 anonymous downloads matched byte sizes and SHA-256 hashes. Older reports labeled r1 are historical.
