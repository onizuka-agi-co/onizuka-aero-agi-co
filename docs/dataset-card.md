# Dataset card

[日本語](#日本語) | [English](#english)

## 日本語

### 概要

このカードは架空のコレクショントイ AX-01 SUZAKU r3 の形状データと、民生向けアーケードゲームの模擬記録を説明します。ゲーム記録は合成入力を再生した結果で、実機の飛行データやユーザーのテレメトリではありません。形状と定性的な見た目の確認は合格しました。Nodeテスト、本番ビルド、カタログ、Chromiumの自動確認も合格しています。[GitHub CIとPages公開](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39448567448)が成功しました。公開サイトでもブラウザ12項目が通過し、匿名取得した42ファイルのサイズとSHA-256が一致しました（[操作記録](../evidence/browser-public.json)、[照合記録](../evidence/publication.json)）。r2の記録は履歴として保存しています。

| 項目 | 値 |
| --- | --- |
| データセットID | `onizuka-aero-ax01-r3` |
| デザインID / 表示名 / 改訂 | `AX-01` / `AX-01 SUZAKU` / `r3` |
| CAD生成ツール | FreeCAD 1.1.3 |
| 造形バリアント | `standard`、`longwing` |
| CAD形状とメッシュ | 妥当性と再読み込みの結果は[形状レポート](../public/data/geometry-report.json)を参照。各形式の再確認に合格 |
| 左右主翼の対称性 | 対称性の測定値と許容値は形状レポートを参照。確認に合格 |
| 再生成チェック | r3の決定性確認に合格。メッシュSHA-256が一致 |
| アーケード記録 | 合成入力による3ケース。JSON 3件とCSV 3件。`schemaVersion: 1` |
| リプレイテスト | `npm test` に含まれるリプレイ検証を含め、Nodeテスト15件すべて合格 |
| 現行ローカル検証 | Nodeテスト15/15、本番ビルド、カタログ照合、[Chromium自動確認12/12](../evidence/browser-automated.json)に合格 |
| データ記録のライセンス | CC BY 4.0 |

メッシュの境界とSHA-256を含むr3測定値は、重複を避けるため形状レポートにまとめています。形状と決定性の確認結果も同レポートを参照してください。r2の形状レポートは[履歴記録](../evidence/history/suzaku-r2/geometry-report.json)にあります。

### コンセプトアートと選択

組み込みの `image_gen imagegen` ツールで4案を生成し、ユーザーが C / SUZAKU を選びました。画像と各案のプロンプトは `design/concepts/ax01-r2/` にあります。r3でも同じC案画像を視覚資料として使います。最終の定性的確認では、架空のコレクショントイとして6つの主要条件を満たすと評価されました。これはユーザー承認や写真のような完全再現を意味しません。[確認記録](../evidence/suzaku-concept-review.json)と[最終CADビュー](../evidence/suzaku-r3-cad-final.jpg)を参照してください。画像はCAD出力や工学的解析の結果ではありません。4枚すべてにMIT Licenseを適用します。

![選択された C / SUZAKU のコンセプトシート](../design/concepts/ax01-r2/c-suzaku.png)

### 内容と用途

各バリアントの `public/assets/ax01/standard/` と `public/assets/ax01/longwing/` に、FreeCAD形式の `.FCStd`、STEP、STL、`mesh.json`、`preview.svg` を生成します。形状レポートにr3の部品数と各形式の再読み込み結果を記録します。形状同士は重なる場合があるため、組み立てた水密ソリッドとは扱いません。

両バリアントの主翼パーツ名は `LeftForwardSweptWing` と `RightForwardSweptWing` です。メッシュの座標系は `+X forward, Y span, +Z up` です。形状レポートは、Y軸で反転した頂点集合間の対称Hausdorff距離を使って主翼の対称性を記録します。r3の測定値と許容値は形状レポートを参照してください。

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

r3の形状、決定性、リプレイ、Nodeテスト、本番ビルド、カタログ確認、Chromium自動確認は合格しました。ビルドでは572 kBのチャンクサイズ警告が出ました。カタログは公開ファイル20件とハッシュ付きソース21件を照合しています。Chromiumの自動確認はタッチ操作をエミュレートしたローカル画面で実施し、スマートフォン実機では確認していません。最初の失敗記録は[初回のブラウザレポート](../evidence/suzaku-r3-browser-first-failure.json)にあります。[GitHub CIとPages公開](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39448567448)が成功しました。公開サイトでもブラウザ12項目が通過し、匿名取得した42ファイルのサイズとSHA-256が一致しました（[操作記録](../evidence/browser-public.json)、[照合記録](../evidence/publication.json)）。r2のローカル・公開確認は[履歴記録](../evidence/history/suzaku-r2/)に保存しています。[r2のCIとPagesデプロイ](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39439337215)の成功は、r3の検証結果ではありません。

### 来歴と帰属表示

アーケードJSONには `recordId`、`designId`、`displayName`、改訂、スキーマ版、記録時刻、生成ツール、入力ハッシュ、実行条件、状態、ライセンス、帰属表示があります。形状レポートにはデザインID、改訂、コンセプト画像のパスとSHA-256、生成スクリプトのハッシュ、チェック設定、測定結果を記録します。

`public/data/manifest.json` は、`public/assets/` のCADアセットと `public/data/` のデータ記録について、パス、バイト数、SHA-256、ライセンスを一覧にします。`design/concepts/ax01-r2/` の画像とプロンプトもソースとして記録し、MIT Licenseを付与します。`evidence/*.json` と `decisions.tsv` は別の監査記録群で、データセットのマニフェストには含めません。各ファイルのハッシュはそのファイル内ではなくマニフェストに保存します。データ記録のライセンス本文は[LICENSE-DATA](../LICENSE-DATA)を参照してください。帰属表示には `ONIZUKA AERO AGI Co.` と対象の記録またはリリースを含めてください。

## English

### Overview

This card describes geometry data for AX-01 SUZAKU r3, a fictional collectible toy, and simulated records from a civilian arcade game. The game records replay synthetic inputs. They are not flight data or user telemetry. Geometry and qualitative visual review passed. Node tests, the production build, catalog verification, and automated Chromium checks also passed. [GitHub CI and Pages deployment](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39448567448) passed for r3. All 12 browser checks passed on the public site, and 42 anonymous downloads matched byte sizes and SHA-256 hashes. See the [browser report](../evidence/browser-public.json) and [publication record](../evidence/publication.json). R2 records remain historical.

| Item | Value |
| --- | --- |
| Dataset ID | `onizuka-aero-ax01-r3` |
| Design ID / display name / revision | `AX-01` / `AX-01 SUZAKU` / `r3` |
| CAD generator | FreeCAD 1.1.3 |
| Artistic variants | `standard`, `longwing` |
| CAD geometry and meshes | See the [geometry report](../public/data/geometry-report.json) for r3 measurements and reopen results; validity checks passed |
| Mirrored-wing symmetry | The geometry report records r3 measurements and tolerance; the check passed |
| Regeneration check | The r3 determinism check passed; mesh SHA-256 hashes matched |
| Arcade records | 3 cases, with 3 JSON files and 3 CSV files; `schemaVersion: 1` |
| Replay tests | All 15 Node tests passed, including replay tests |
| Current local checks | Node tests 15/15, production build, catalog verification, and [Chromium checks 12/12](../evidence/browser-automated.json) passed |
| Data-record license | CC BY 4.0 |

The geometry report is the source for r3 mesh bounds, hashes, and export details. Do not use the archived r2 values as r3 measurements. The [r2 geometry report](../evidence/history/suzaku-r2/geometry-report.json) is retained for historical comparison.

### Concept art and selection

Four concept sheets were generated with the built-in `image_gen imagegen` tool. The user selected C / SUZAKU. The images and prompts are in `design/concepts/ax01-r2/`. R3 reuses the selected C sheet as its visual reference; no new r3 concept art was generated. The qualitative review accepted all six salient criteria for a fictional toy interpretation; this does not claim user approval or exact photoreal reproduction. See the [concept review](../evidence/suzaku-concept-review.json) and [final CAD views](../evidence/suzaku-r3-cad-final.jpg). The sheet is not a CAD export or an engineering result. All four sheets use the MIT License.

![Selected C / SUZAKU concept sheet](../design/concepts/ax01-r2/c-suzaku.png)

### Contents and uses

Generation writes a native FreeCAD `.FCStd` file, STEP, STL, `mesh.json`, and `preview.svg` to each variant directory, `public/assets/ax01/standard/` and `public/assets/ax01/longwing/`. The geometry report records r3 part counts and export-reopen results for each variant. Separate shapes may overlap; they do not claim to form a watertight assembly.

The primary wing parts are named `LeftForwardSweptWing` and `RightForwardSweptWing`. The mesh coordinate system is `+X forward, Y span, +Z up`. The report measures mirrored-wing symmetry as the symmetric Hausdorff distance between vertex sets after reflection across Y. See the report for the r3 deviation and tolerance.

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

R3 geometry, deterministic regeneration, replay, Node tests, production build, catalog verification, and automated Chromium checks passed. The build emitted a 572 kB chunk-size warning; the catalog verified 20 public files and 21 hashed source entries. Chromium used an emulated touch viewport; physical phones are untested. An earlier mobile-touch failure is retained in the [first-failure report](../evidence/suzaku-r3-browser-first-failure.json). [GitHub CI and Pages deployment](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39448567448) passed for r3. All 12 browser checks passed on the public site, and 42 anonymous downloads matched byte sizes and SHA-256 hashes. See the [browser report](../evidence/browser-public.json) and [publication record](../evidence/publication.json). The r2 local and public reports are archived under [evidence/history/suzaku-r2](../evidence/history/suzaku-r2/). The [r2 CI and Pages deployment](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39439337215) passed for r2 and does not verify r3.

### Provenance and attribution

Arcade JSON records include `recordId`, `designId`, `displayName`, revision, schema version, recording time, generator, input hash, run conditions, status, license, and attribution. The geometry report includes the design ID, revision, concept image path and SHA-256, generator-script hash, check settings, and measurements.

`public/data/manifest.json` lists paths, byte counts, SHA-256 hashes, and licenses for CAD assets under `public/assets/` and data records under `public/data/`. The catalog also records concept images and prompts under `design/concepts/ax01-r2/` as MIT sources. Audit records under `evidence/*.json` and `decisions.tsv` are a separate record set and are not part of the dataset manifest. The manifest stores file hashes separately from the files. See [LICENSE-DATA](../LICENSE-DATA) for the data-record license notice. Include `ONIZUKA AERO AGI Co.` and the relevant record or release in attribution.
