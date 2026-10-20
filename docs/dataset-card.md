# Dataset card

[日本語](#日本語) | [English](#english)

## 日本語

### 概要

このカードは架空のコレクショントイ AX-01 SUZAKU r2 の形状データと、民生向けアーケードゲームの模擬記録を説明します。ゲーム記録は合成入力を再生した結果で、実機の飛行データやユーザーのテレメトリではありません。r2のローカル検証と公開サイトでの操作・匿名取得の確認は完了しました。

| 項目 | 値 |
| --- | --- |
| データセットID | `onizuka-aero-ax01-r2` |
| デザインID / 表示名 / 改訂 | `AX-01` / `AX-01 SUZAKU` / `r2` |
| CAD生成ツール | FreeCAD 1.1.3 |
| 造形バリアント | `standard`、`longwing` |
| CAD形状 | 各バリアント40個。すべて妥当と判定 |
| メッシュ | `standard` 2,800三角形、62,320バイト。`longwing` 2,752三角形、61,278バイト |
| 左右主翼の最大偏差 | 0.0任意設計単位。許容値は`1e-6` |
| 形状レポート | `public/data/geometry-report.json`。状態は`passed` |
| 再生成チェック | 実行済み。両メッシュのSHA-256が一致 |
| アーケード記録 | 3ケース。JSON 3件とCSV 3件。`schemaVersion: 1` |
| リプレイテスト | 3件すべて通過 |
| 現行ローカル検証 | Node 15/15、Chromium 12/12、直接UI 9/9、本番ビルド合格 |
| データ記録のライセンス | CC BY 4.0 |

メッシュ境界（X/Y/Z、任意設計単位）は、standard が X[-8.35, 8.45]・Y[-9.2, 9.2]・Z[-0.688344, 3.56]、longwing が X[-8.35, 8.45]・Y[-11.4, 11.4]・Z[-0.688344, 3.56] です。各メッシュのSHA-256と出力ファイルの詳細は形状レポートに記録しています。

### コンセプトアートと選択

組み込みの `image_gen imagegen` ツールで4案を生成し、ユーザーが C / SUZAKU を選びました。画像と各案のプロンプトは `design/concepts/ax01-r2/` にあります。選ばれた画像はCADを作るための視覚資料です。CAD出力や工学的解析の結果ではありません。4枚すべてにMIT Licenseを適用します。

![選択された C / SUZAKU のコンセプトシート](../design/concepts/ax01-r2/c-suzaku.png)

### 内容と用途

各バリアントの `public/assets/ax01/standard/` と `public/assets/ax01/longwing/` に、FreeCAD形式の `.FCStd`、STEP、STL、`mesh.json`、`preview.svg` があります。形状レポートではFreeCAD形式とSTEPを各40形状で再読み込みし、STLの三角形数も確認しました。形状同士は重なる場合があるため、組み立てた水密ソリッドとは扱いません。

両バリアントの主翼パーツ名は `LeftForwardSweptWing` と `RightForwardSweptWing` です。メッシュの座標系は `+X forward, Y span, +Z up` です。主翼の鏡映対称性はY軸で反転した頂点集合の対称Hausdorff距離で測定しました。任意設計単位での最大偏差は0.0で、許容値`1e-6`の範囲内です。

形状レポートは各メッシュのバイト数、SHA-256、境界、部品数、三角形数、再読み込み結果を記録します。再生成チェックは `scripts/generate-cad.py --verify-determinism` を実行し、既存メッシュと再生成メッシュのSHA-256を比較します。確認対象は `mesh.json` です。`.FCStd` などを含むすべての出力がバイト単位で一致するとは保証しません。

会社ミッション記録 `public/data/company-mission.json` は、`scripts/snapshot-company.mjs` がGitHub CLIで公開Issueの状態を取得し、記録時点のタスク進行として保存する観測記録です。議事録、承認記録、航空機性能データではありません。

アーケード記録は保存済みの合成入力を `src/arcade.mjs` で再生した結果です。JSONには入力、各フレームのゲーム状態、結果、実行条件、来歴を記録します。CSVにはフレームごとの状態を並べます。

| ケース | 再生フレーム数 | 得点 | ゲート結果 |
| --- | ---: | ---: | --- |
| `standard` route-following | 1,334 | 3,300 | 14通過、0ミス |
| `longwing` route-following | 1,233 | 3,300 | 14通過、0ミス |
| `standard` miss-control | 1,426 | 0 | 0通過、14ミス |

各ケースの詳細は[アーケード概要](../public/data/arcade-summary.json)、形状確認の詳細は[形状レポート](../public/data/geometry-report.json)、ファイルとSHA-256の一覧は[マニフェスト](../public/data/manifest.json)を参照してください。

### 制限

このデータセットが扱うのは、架空のビジュアル資産の形状とゲーム内の模擬操作です。任意設計単位で測った形状の妥当性、境界、要素数、左右対称性は、実在機の寸法、空力、飛行性能、構造強度、推進、製造を評価または保証しません。形状パーツは独立した外形で、組み上げた航空機の構造や機能を表しません。

ゲームはゲート通過を目的とする民生向けアーケードです。実機の飛行を再現せず、兵器も登場しません。記録は合成入力と模擬ゲーム状態で、ユーザーのテレメトリではありません。ゲームはテレメトリを収集しません。

FreeCADの形状レポートと再生成チェックは合格しました。リプレイテスト3件、Nodeテスト15件、本番ビルド、ローカルChromium自動確認12件、直接UI確認9件もすべて合格しました。ブラウザ記録は[自動確認](../evidence/browser-automated.json)と[直接UI確認](../evidence/browser-suzaku-ui.json)にあります。いずれもローカルプレビューの結果で、スマートフォン実機では確認していません。[GitHub Actions CIとPagesデプロイ](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39439337215)は成功しました。公開サイトでもブラウザ12項目が通過し、匿名取得した41ファイルのサイズとSHA-256が一致しました。r1と明記された記録は履歴として扱います。

### 来歴と帰属表示

アーケードJSONには `recordId`、`designId`、`displayName`、改訂、スキーマ版、記録時刻、生成ツール、入力ハッシュ、実行条件、状態、ライセンス、帰属表示があります。形状レポートにはデザインID、改訂、コンセプト画像のパスとSHA-256、生成スクリプトのハッシュ、チェック設定、測定結果を記録します。

`public/data/manifest.json` は、`public/assets/` のCADアセットと `public/data/` のデータ記録について、パス、バイト数、SHA-256、ライセンスを一覧にします。`design/concepts/ax01-r2/` の画像とプロンプトもソースとして記録し、MIT Licenseを付与します。`evidence/*.json` と `decisions.tsv` は別の監査記録群で、データセットのマニフェストには含めません。各ファイルのハッシュはそのファイル内ではなくマニフェストに保存します。データ記録のライセンス本文は[LICENSE-DATA](../LICENSE-DATA)を参照してください。帰属表示には `ONIZUKA AERO AGI Co.` と対象の記録またはリリースを含めてください。

## English

### Overview

This card describes geometry data for AX-01 SUZAKU r2, a fictional collectible toy, and simulated records from a civilian arcade game. The game records replay synthetic inputs. They are not flight data or user telemetry. The r2 public site passed browser and anonymous-download verification.

| Item | Value |
| --- | --- |
| Dataset ID | `onizuka-aero-ax01-r2` |
| Design ID / display name / revision | `AX-01` / `AX-01 SUZAKU` / `r2` |
| CAD generator | FreeCAD 1.1.3 |
| Artistic variants | `standard`, `longwing` |
| CAD shapes | 40 per variant; all reported valid |
| Mesh | `standard`: 2,800 triangles, 62,320 bytes. `longwing`: 2,752 triangles, 61,278 bytes |
| Maximum mirrored-wing deviation | 0.0 arbitrary design units; tolerance `1e-6` |
| Geometry report | `public/data/geometry-report.json`; status `passed` |
| Regeneration check | Executed; both mesh SHA-256 hashes matched |
| Arcade records | 3 cases, with 3 JSON files and 3 CSV files; `schemaVersion: 1` |
| Replay tests | All 3 passed |
| Current local checks | Node 15/15, Chromium 12/12, direct UI 9/9, production build passed |
| Data-record license | CC BY 4.0 |

Mesh bounds (X/Y/Z, in arbitrary design units) are standard X[-8.35, 8.45] / Y[-9.2, 9.2] / Z[-0.688344, 3.56], and longwing X[-8.35, 8.45] / Y[-11.4, 11.4] / Z[-0.688344, 3.56]. The geometry report records each mesh SHA-256 and export details.

### Concept art and selection

Four concept sheets were generated with the built-in `image_gen imagegen` tool. The user selected C / SUZAKU. The images and prompts are in `design/concepts/ax01-r2/`. The selected sheet is a visual reference for the CAD model. It is not a CAD export or an engineering result. All four sheets use the MIT License.

![Selected C / SUZAKU concept sheet](../design/concepts/ax01-r2/c-suzaku.png)

### Contents and uses

Each variant directory, `public/assets/ax01/standard/` and `public/assets/ax01/longwing/`, contains a native FreeCAD `.FCStd` file, STEP, STL, `mesh.json`, and `preview.svg`. The geometry report records 40 shapes reopened from the native FreeCAD file and STEP for each variant. It also records STL triangle counts that match each mesh. The separate shapes may overlap; they do not claim to form a watertight assembly.

The primary wing parts are named `LeftForwardSweptWing` and `RightForwardSweptWing`. The mesh coordinate system is `+X forward, Y span, +Z up`. The report measures mirrored-wing symmetry as the symmetric Hausdorff distance between vertex sets after reflection across Y. The maximum deviation is 0.0 arbitrary design units, within the `1e-6` tolerance.

The geometry report records each mesh's byte count, SHA-256, bounds, part count, triangle count, and export-reopen checks. The regeneration check runs `scripts/generate-cad.py --verify-determinism` and compares SHA-256 hashes for the existing and regenerated `mesh.json` files. It does not promise byte-for-byte identity for every output, including `.FCStd` archives.

The company mission record, `public/data/company-mission.json`, is an observation snapshot of public GitHub issue status at `recordedAt`. `scripts/snapshot-company.mjs` generates it with the GitHub CLI. The record is not meeting minutes, an approval record, or aircraft performance data.

The arcade records replay saved synthetic inputs through `src/arcade.mjs`. Each JSON file stores inputs, per-frame game state, results, run conditions, and provenance. CSV files list per-frame state.

| Case | Replay frames | Score | Gate result |
| --- | ---: | ---: | --- |
| `standard` route-following | 1,334 | 3,300 | 14 passed, 0 missed |
| `longwing` route-following | 1,233 | 3,300 | 14 passed, 0 missed |
| `standard` miss-control | 1,426 | 0 | 0 passed, 14 missed |

See the [arcade summary](../public/data/arcade-summary.json), [geometry report](../public/data/geometry-report.json), and [manifest](../public/data/manifest.json) for case details and file hashes.

### Limits

The dataset covers the geometry of a fictional visual asset and simulated gameplay. Shape validity, bounds, element counts, and symmetry in arbitrary design units do not evaluate or guarantee real aircraft dimensions, aerodynamics, flight performance, structural strength, propulsion, or manufacturing. The parts are separate outer shapes and do not describe an assembled aircraft structure or function.

The game is a civilian gate-flight arcade experience. It does not simulate real flight and includes no weapons. The records contain synthetic inputs and simulated game state, not user telemetry. The game collects no telemetry.

The FreeCAD geometry report and regeneration check passed. All three replay tests, all 15 Node tests, the production build, 12 automated Chromium checks, and 9 direct UI checks passed locally. The browser reports are [automated](../evidence/browser-automated.json) and [direct UI](../evidence/browser-suzaku-ui.json). Both target local previews; physical phones have not been tested. [GitHub Actions CI and Pages deployment](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39439337215) passed for r2. All 12 browser checks also passed on the public site, and 41 anonymous downloads matched byte sizes and SHA-256 hashes. Reports labeled r1 remain historical.

### Provenance and attribution

Arcade JSON records include `recordId`, `designId`, `displayName`, revision, schema version, recording time, generator, input hash, run conditions, status, license, and attribution. The geometry report includes the design ID, revision, concept image path and SHA-256, generator-script hash, check settings, and measurements.

`public/data/manifest.json` lists paths, byte counts, SHA-256 hashes, and licenses for CAD assets under `public/assets/` and data records under `public/data/`. The catalog also records concept images and prompts under `design/concepts/ax01-r2/` as MIT sources. Audit records under `evidence/*.json` and `decisions.tsv` are a separate record set and are not part of the dataset manifest. The manifest stores file hashes separately from the files. See [LICENSE-DATA](../LICENSE-DATA) for the data-record license notice. Include `ONIZUKA AERO AGI Co.` and the relevant record or release in attribution.
