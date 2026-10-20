# ONIZUKA AERO AGI Co.

日本語 | [English](README.md)

ONIZUKA AERO AGI Co. は、航空をテーマにした設計・検証・ゲーム制作をAIエージェントが進め、活動と成果をオープンデータとして公開する実験会社です。人間のミッション責任者が使命と公開方針を定めます。エージェントは事前承認された範囲で設計から公開まで担います。

初期版の中心は、架空の近未来戦闘機風ビジュアル資産 AX-01 KIRIN、形状確認、民生向けゲート飛行アーケードゲームです。`standard` と `longwing` は造形上のバリアントです。ゲームはCAD資産から生成した同じメッシュを読み込みます。収録データと制限は[データセットカード](docs/dataset-card.md)を参照してください。

![AX-01 KIRIN standard バリアント](public/assets/ax01/standard/preview.svg)

## プロジェクトの状態

FreeCAD 1.1.3で両バリアントのCAD出力を生成しました。形状レポートでは各9パーツとメッシュ360三角形が妥当と判定されています。FreeCAD形式、STEP、STLを再度開いて確認しました。左右翼を反転して比較した頂点偏差は任意設計単位で0.0です。再生成チェックでは両メッシュのSHA-256が一致しました。詳細は[形状レポート](public/data/geometry-report.json)を参照してください。

保存した入力フレームからアーケード記録を3件生成しました。`standard` と `longwing` のコース走行は、それぞれ14ゲート中14ゲートを通過し、3,300点を記録しました。`standard` のミス制御例では14ゲートすべてを逃し、得点は0点です。[アーケード記録の概要](public/data/arcade-summary.json)に結果をまとめています。

ローカル検証ではNodeの14テストとPlaywrightのブラウザ12項目が通過しました。Chromiumのデスクトップ表示とタッチ操作をエミュレートしたモバイル画面で確認しています。実機のスマートフォンでは確認していません。[自動ブラウザ検証](evidence/browser-automated.json)と[画面確認記録](evidence/browser-qa.json)を参照してください。

GitHubリポジトリは[onizuka-agi-co/onizuka-aero-agi-co](https://github.com/onizuka-agi-co/onizuka-aero-agi-co)で公開しています。ゲームサイトは[onizuka-agi-co.github.io/onizuka-aero-agi-co](https://onizuka-agi-co.github.io/onizuka-aero-agi-co/)を公開先とし、現在はGitHub Pagesへの公開とGitHub Actions CIの実行待ちです。

## 再現方法

`npm ci`で依存関係を導入し、`npm test`でテストを実行して、`npm run build`でビルドします。ローカルの開発サーバーは`npm run dev`で起動します。CAD、データ、ブラウザ確認を含む手順は[再現手順](docs/reproduce.md)にあります。

## プロジェクトの方針

- [使命とガバナンス](docs/company.md)では、意思決定権限とタスクの進め方を説明します。
- [データ方針](docs/data-policy.md)は公開、来歴、テレメトリの扱いを定めます。
- [データセットカード](docs/dataset-card.md)は生成済みの記録と利用上の制限を説明します。
- [コントリビューション](CONTRIBUTING.md)は変更の提案方法と検証方法を説明します。

## ライセンス

ソースコード、アート、画像、メッシュ、CADファイル、文書には[MIT License](LICENSE)を適用します。[MIT Licenseの公式本文](https://opensource.org/license/mit)も参照してください。`public/data/*`、`evidence/*.json`、`decisions.tsv`のデータ記録には[CC BY 4.0](LICENSE-DATA)を適用します。第三者の素材には元のライセンスを維持します。詳細は[サードパーティ通知](THIRD_PARTY.md)を参照してください。
