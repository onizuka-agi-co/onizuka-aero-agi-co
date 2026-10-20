# ONIZUKA AERO AGI Co.

日本語 | [English](README.md)

ONIZUKA AERO AGI Co. は、航空をテーマにした設計・検証・ゲーム制作をAIエージェントが進め、活動と成果をオープンデータとして公開する実験会社です。人間のミッション責任者が使命と公開方針を定めます。エージェントは事前承認された範囲で設計から公開まで担います。

初期版には、架空の近未来戦闘機風ビジュアル資産 AX-01 KIRIN のCAD形状確認と、民生向けゲート飛行アーケードゲームを収録しています。`standard` と `longwing` は造形上のバリアントです。ゲームは各CAD資産から生成したメッシュを読み込みます。収録データと利用上の制限は[データセットカード](docs/dataset-card.md)を参照してください。

![AX-01 KIRIN standard バリアント](public/assets/ax01/standard/preview.svg)

## プロジェクトの状態

FreeCAD 1.1.3で両バリアントのCAD出力を生成しました。形状レポートでは各9パーツとメッシュ360三角形が妥当と判定されています。FreeCAD形式、STEP、STLを再度開いて確認しました。左右翼を反転して比較した頂点偏差は任意設計単位で0.0です。再生成チェックでは両メッシュのSHA-256が一致しました。詳細は[形状レポート](public/data/geometry-report.json)を参照してください。

保存した入力フレームからアーケード記録を3件生成しました。`standard` と `longwing` のコース走行は、それぞれ14ゲート中14ゲートを通過し、3,300点を記録しました。`standard` のミス制御例では14ゲートすべてを逃し、得点は0点です。[アーケード記録の概要](public/data/arcade-summary.json)に結果をまとめています。

ローカル検証ではNodeの14テストとPlaywrightのブラウザ12項目が通過しました。Chromiumのデスクトップ表示とタッチ操作をエミュレートしたモバイル画面で確認しています。実機のスマートフォンでは確認していません。[自動ブラウザ検証](evidence/browser-automated.json)と[画面確認記録](evidence/browser-qa.json)を参照してください。

GitHubリポジトリと[ゲームサイト](https://onizuka-agi-co.github.io/onizuka-aero-agi-co/)を公開しました。[初回のGitHub Actions CIとPagesデプロイ](https://github.com/onizuka-agi-co/onizuka-aero-agi-co/actions/runs/39426065882)は成功しています。公開サイトでもブラウザ12項目が通過し、匿名で取得した35ファイルのサイズとSHA-256が一致しました。[公開確認](evidence/publication.json)と[公開サイトの操作記録](evidence/browser-public.json)に対象コミットと確認結果を保存しています。

## 再現方法

依存関係は`npm ci`で導入し、テストは`npm test`で実行します。`npm run build`でビルドした後、`npm run dev`でローカルの開発サーバーを起動できます。CAD、データ、ブラウザ確認を含む手順は[再現手順](docs/reproduce.md)にあります。

## プロジェクトの方針

- [使命とガバナンス](docs/company.md)では、意思決定権限とタスクの進め方を説明します。
- [データ方針](docs/data-policy.md)は公開、来歴、テレメトリの扱いを定めます。
- [データセットカード](docs/dataset-card.md)は生成済みの記録と利用上の制限を説明します。
- [コントリビューション](CONTRIBUTING.md)は変更の提案方法と検証方法を説明します。

## ライセンス

ソースコード、アート、画像、メッシュ、CADファイル、文書には[MIT License](LICENSE)を適用します。[MIT Licenseの公式本文](https://opensource.org/license/mit)も参照してください。`public/data/*`、`evidence/*.json`、`decisions.tsv`のデータ記録には[CC BY 4.0](LICENSE-DATA)を適用します。第三者の素材には元のライセンスを維持します。詳細は[サードパーティ通知](THIRD_PARTY.md)を参照してください。
