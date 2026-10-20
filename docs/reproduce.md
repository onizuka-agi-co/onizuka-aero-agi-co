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

`npm test` はリプレイを含むNodeテスト15件すべてに合格しました。本番ビルドも合格しましたが、JavaScriptチャンクサイズ572 kBの警告が1件あります。カタログ照合は公開ファイル20件とハッシュ付きソース21件で合格しました。FreeCAD形状、ネイティブ形式・STEP・STLの再読み込み、主翼の対称性、メッシュの決定性確認も合格しています。自動Chromium確認は12/12件に合格しました。タッチ操作はエミュレーションで、スマートフォン実機では未確認です。[成功レポート](../evidence/browser-automated.json)と、初回のモバイルタッチ確認が停止した[失敗レポート](../evidence/suzaku-r3-browser-first-failure.json)を参照してください。CIと公開サイトの確認は未実施です。r2の確認記録は[履歴フォルダー](../evidence/history/suzaku-r2/)にあります。

standardとlongwingをC案画像と見比べ、真上、側面、前方3/4、後方3/4から肩の量感、キャノピー、翼面、側面の暗色部、後部ポッド、尾翼を確認します。最終確認では、架空のコレクショントイとして6つの主要条件を満たすと評価されました。これは定性的評価であり、ユーザー承認や写真のような完全再現を意味しません。[コンセプト確認記録](../evidence/suzaku-concept-review.json)と[最終CADビュー](../evidence/suzaku-r3-cad-final.jpg)に記録しています。形状レポートの合格だけで、C案との見た目の近さを判定しないでください。

開発サーバーは `npm run dev` で起動します。ビルド済みアプリを確認する場合は、先に `npm run build` を実行し、その後 `npm run preview` を起動します。

### 公開サイトを確認する

公開後にChromiumで操作確認し、匿名HTTP取得で公開ファイルを照合します。

~~~powershell
npm run test:browser -- https://onizuka-agi-co.github.io/onizuka-aero-agi-co/ evidence/browser-public.json
node .\scripts\verify-public.mjs
~~~

`scripts/verify-public.mjs` は公開サイトのファイルと、`HEAD` のコミットを指定したGitHub rawソースを匿名で取得します。コミットを公開してから実行してください。ローカル変更が未公開の場合、ソースの照合に失敗します。

### 記録の解釈

形状値は任意設計単位です。アーケード記録は模擬ゲーム状態です。どちらも実際の飛行性能や航空宇宙工学の評価として解釈しないでください。Chromiumのタッチ確認はエミュレーションで、スマートフォン実機とは異なります。r3の形状、Nodeテスト、本番ビルド、カタログ、ローカルブラウザ確認は合格しました。CIと公開確認は未実施です。r2の結果は[履歴フォルダー](../evidence/history/suzaku-r2/)で確認できます。

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

All 15 Node tests passed, including replay tests. The production build passed with one 572 kB JavaScript chunk-size warning. Catalog verification passed for 20 public files and 21 hashed source entries. FreeCAD shape checks, native/STEP/STL reopen checks, mirrored-wing symmetry, and deterministic mesh regeneration passed. Automated Chromium checks passed 12/12 with an emulated touch viewport; see the [passing browser report](../evidence/browser-automated.json). Physical phones are untested. An initial mobile-touch failure is retained in the [first-failure report](../evidence/suzaku-r3-browser-first-failure.json). `npm run test:browser` uses the built app and starts its own Vite preview on port 4188. You do not need to start `npm run preview` separately. CI and public-site verification are pending. The archived r2 results do not verify the current revision.

Compare `standard` and `longwing` with the selected C concept from the top, side, front three-quarter, and rear three-quarter views. Check shoulder volume, canopy, wing panels, dark side recesses, rear pods, and fins. The final qualitative review accepted all six salient criteria for a fictional toy interpretation; it does not claim user approval or exact photoreal reproduction. See the [concept review](../evidence/suzaku-concept-review.json) and [final CAD views](../evidence/suzaku-r3-cad-final.jpg). A passing geometry report alone does not establish visual similarity to the concept.

Start the development server with `npm run dev`. To inspect the built app, run `npm run build` first, then start `npm run preview`.

### Verify the public site

After publishing, check the site in Chromium and compare the public files with the anonymous HTTP results.

~~~powershell
npm run test:browser -- https://onizuka-agi-co.github.io/onizuka-aero-agi-co/ evidence/browser-public.json
node .\scripts\verify-public.mjs
~~~

`scripts/verify-public.mjs` fetches public files anonymously and fetches source files from GitHub raw at the commit in `HEAD`. Publish the commit before running the script. The source check fails when the local changes are not public.

### Interpret the records

Geometry values use arbitrary design units. Arcade records are simulated game state. Do not interpret either as actual flight performance or aerospace engineering results. R3 geometry, Node, build, catalog, and local Chromium checks passed. CI and publication verification are pending. The [archived r2 records](../evidence/history/suzaku-r2/) describe the earlier revision only.
