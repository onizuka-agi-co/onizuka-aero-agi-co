# Reproduce the project outputs

[日本語](#日本語) | [English](#english)

## 日本語

### 必要な環境

- Node.js 24とnpm 11
- FreeCAD 1.1.3と、同梱Pythonから`FreeCAD`および`Part`をインポートできる環境
- PowerShell
- ブラウザ検証ではPlaywright用Chromium

### CADと記録の生成

リポジトリのルートで依存関係を導入し、FreeCAD同梱Pythonを指定してCAD出力を生成します。

```powershell
npm ci

$env:FREECAD_PYTHON = 'C:\path\to\FreeCAD\bin\python.exe'
& $env:FREECAD_PYTHON .\scripts\generate-cad.py
```

同じFreeCAD Pythonで検証モードも実行します。このモードは再生成した`mesh.json`のSHA-256を既存値と比較します。`.FCStd`などを含む全ファイルのバイト一致は検証しません。

```powershell
& $env:FREECAD_PYTHON .\scripts\generate-cad.py --verify-determinism
```

次に、ゲーム記録、カタログ、データ検証を順に実行します。

```powershell
npm run record:arcade
npm run catalog
npm run verify:data
```

`npm run record:arcade`は保存済み入力フレームを`src/arcade.mjs`で再生し、JSONとCSVを生成します。`npm run catalog`は`public/data/manifest.json`を作り、`npm run verify:data`はマニフェストに記載されたファイルとソースのバイト数、SHA-256を照合します。

### テストとローカル起動

```powershell
npm test
npm run build
```

`npm test`はNodeの14テストを実行し、`npm run build`は本番用ファイルを生成します。2026-10-20時点で14件すべてが通過しました。ローカルの開発サーバーは`npm run dev`、ビルド済みアプリのプレビューは`npm run preview`で起動します。previewは`npm run build`の後に実行してください。

ブラウザ検証を実行する前にChromiumを入れます。`npm run test:browser`はビルド済みアプリを使い、ポート4188で専用のVite previewを起動して12項目を確認します。別途`npm run preview`を起動する必要はありません。

```powershell
npx playwright install chromium
npm run test:browser
```

2026-10-20の自動ブラウザ記録は12項目すべて通過しました。画面を使った確認記録は`evidence/browser-qa.json`と`evidence/browser-automated.json`にあります。公開サイトでも12項目が通過し、`evidence/browser-public.json`に保存しています。Chromiumのデスクトップ画面と390×844のタッチエミュレーションで確認しました。スマートフォン実機では未確認です。[初回のGitHub Actions CIとPagesデプロイ](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39426065882)は成功しました。匿名取得したファイルのサイズとSHA-256の確認結果は`evidence/publication.json`にあります。

測定値は任意設計単位の形状データとゲーム内の模擬値です。実際の飛行性能や航空宇宙工学の評価として解釈しないでください。

## English

### Requirements

- Node.js 24 and npm 11
- FreeCAD 1.1.3 with bundled Python able to import `FreeCAD` and `Part`
- PowerShell
- Playwright Chromium for browser validation

### Generate CAD and records

From the repository root, install dependencies and set `FREECAD_PYTHON` to FreeCAD's bundled Python executable before generating the CAD outputs.

```powershell
npm ci

$env:FREECAD_PYTHON = 'C:\path\to\FreeCAD\bin\python.exe'
& $env:FREECAD_PYTHON .\scripts\generate-cad.py
```

Run the verification mode with the same FreeCAD Python. It compares regenerated `mesh.json` SHA-256 hashes with the recorded values. It does not check byte-for-byte identity of every file, including `.FCStd` archives.

```powershell
& $env:FREECAD_PYTHON .\scripts\generate-cad.py --verify-determinism
```

Then generate the arcade records, catalog, and data verification in order.

```powershell
npm run record:arcade
npm run catalog
npm run verify:data
```

`npm run record:arcade` replays saved input frames through `src/arcade.mjs` and writes JSON and CSV files. `npm run catalog` writes `public/data/manifest.json`. `npm run verify:data` checks the byte counts and SHA-256 hashes for manifest entries and source files.

### Tests and local preview

```powershell
npm test
npm run build
```

`npm test` runs 14 Node tests, and `npm run build` creates the production bundle. All 14 Node tests passed on 2026-10-20. Start the local development server with `npm run dev`, or preview the built app with `npm run preview` after the build.

Install Chromium before the browser checks. `npm run test:browser` uses the built app and starts its own Vite preview on port 4188 to run 12 checks. You do not need to start `npm run preview` separately.

```powershell
npx playwright install chromium
npm run test:browser
```

The automated browser record dated 2026-10-20 shows all 12 checks passing. Browser records are in `evidence/browser-qa.json` and `evidence/browser-automated.json`. All 12 checks also passed against the public site, recorded in `evidence/browser-public.json`. Validation covered Chromium on desktop and a 390 by 844 touch-emulated viewport. Physical phones are untested. The [initial GitHub Actions CI and Pages deployment](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39426065882) succeeded. Anonymous-download size and SHA-256 verification is recorded in `evidence/publication.json`.

Geometry values use arbitrary design units and arcade values are simulated gameplay data. Do not interpret them as actual flight performance or aerospace engineering results.
