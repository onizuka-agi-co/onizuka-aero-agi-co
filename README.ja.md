# ONIZUKA AERO AGI Co.

[日本語](README.ja.md) | [English](README.md)

[公開中のr2ゲーム](https://onizuka-agi-co.github.io/onizuka-aero-agi-co/) · [公開中のr2 CADプレビュー](https://onizuka-agi-co.github.io/onizuka-aero-agi-co/assets/ax01/standard/preview.svg)

ONIZUKA AERO AGI Co. は、航空をテーマにしたデジタルアート、形状確認、民生向けアーケードゲームを再現可能な成果物として公開する実験会社です。使命と公開方針は人間のミッションオーナーが定めます。

ソース上の現行デザインは、赤・アイボリー・金の配色と前進翼を持つ架空のコレクショントイ `AX-01 SUZAKU r3` です。選択されたC案の画像は `design/concepts/ax01-r2/c-suzaku.png` にあり、r3でも視覚資料として使っています。r3用の新しいコンセプトアートは生成していません。`standard` と `longwing` はr3のデザインから生成するバリアントです。

組み込みの `image_gen imagegen` ツールで4枚のコンセプトシートを生成しました。ユーザーは C / SUZAKU を選びました。各案のプロンプトと選択結果は `design/concepts/ax01-r2/concepts.json` にあります。PNGはコンセプトアートであり、CADレンダリングや工学的解析の結果ではありません。

![選択された C / SUZAKU のコンセプトシート](design/concepts/ax01-r2/c-suzaku.png)

![AX-01 SUZAKU standard のCADプレビュー](public/assets/ax01/standard/preview.svg)

## プロジェクトの状況

現在のr3[形状レポート](public/data/geometry-report.json)では、形状の妥当性、FreeCAD・STEP・STLの再読み込み、左右主翼の対称性、メッシュの決定性チェックに合格しています。定性的な見た目の確認では、架空のコレクショントイとして6つの主要条件を満たすと評価されました。ユーザーの承認や、写真のような完全再現を意味しません。[確認記録](evidence/suzaku-concept-review.json)と[最終CADビュー](evidence/suzaku-r3-cad-final.jpg)を参照してください。

現在のr3アーケード概要には、合成入力を使った記録を3件収録しています。`npm test` はリプレイテストを含むNodeテスト15件すべてに合格しました。[アーケード記録の概要](public/data/arcade-summary.json)を参照してください。

r3の本番ビルドとカタログ確認は合格しました。ビルドでは572 kBのチャンクサイズ警告が出ており、カタログは公開ファイル20件とハッシュ付きソース21件を照合しています。タッチ操作をエミュレートしたChromiumの自動確認は12/12件に合格しました。[成功レポート](evidence/browser-automated.json)を参照してください。スマートフォン実機では確認していません。最初のモバイルタッチ確認が停止した記録は[初回失敗レポート](evidence/suzaku-r3-browser-first-failure.json)にあります。CIと公開サイトの確認は未実施です。r2のビルド、ブラウザ、CI、公開確認の記録は[evidence/history/suzaku-r2](evidence/history/suzaku-r2/)にあります。冒頭のゲームとCADプレビューのリンクは、現在公開中のr2を指しています。

## 再現方法

r3の形状、Nodeテスト、本番ビルド、カタログ確認、Chromium自動確認は合格しました。CIと公開サイトの確認は未実施です。実行コマンドと記録は[再現手順](docs/reproduce.md)にあります。r2の公開確認記録は[evidence/history/suzaku-r2](evidence/history/suzaku-r2/)に保存しています。

依存関係は `npm ci` で導入します。テストは `npm test`、本番ビルドは `npm run build` で実行できます。CAD、データ、ブラウザ確認のコマンドは[再現手順](docs/reproduce.md)を参照してください。

## プロジェクトの方針

- [使命とガバナンス](docs/company.md)では、意思決定権限とタスクの進め方を説明します。
- [データ方針](docs/data-policy.md)は公開、来歴、テレメトリの扱いを定めます。
- [データセットカード](docs/dataset-card.md)は生成済みの記録と利用上の制限を説明します。
- [コントリビューション](CONTRIBUTING.md)は変更の提案方法と検証方法を説明します。

## ライセンス

ソースコード、アート、画像、メッシュ、CADファイル、文書には[MIT License](LICENSE)を適用します。`public/data/*`、`evidence/*.json`、`decisions.tsv`の記録は[CC BY 4.0](LICENSE-DATA)の対象です。第三者の素材には元のライセンスを維持します。詳細は[サードパーティ通知](THIRD_PARTY.md)を参照してください。
