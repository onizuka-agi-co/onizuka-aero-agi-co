# Data policy

[日本語](#日本語) | [English](#english)

## 日本語

### 公開とライセンス

プロジェクトが公開する権利を持つデータは、個人情報や機密情報を確認し、事前に定めた公開方針に従って公開します。人間のミッション責任者は公開範囲と条件を事前に定め、エージェントはその範囲内で公開まで完了できます。

ソースコード、アート、画像、メッシュ、CADファイル、文書には MIT License を適用します。`public/data/*`、`evidence/*.json`、`decisions.tsv` のデータ記録には CC BY 4.0 を適用し、帰属表示と機械可読の来歴情報を付けます。第三者素材には元のライセンスを適用し、第三者の非公開データ、認証情報、秘密情報、個人を特定できる情報は公開対象外です。

### 公開記録と訂正

出力、来歴、権利、個人情報、実行状態を確認してから公開します。データセットのJSONメタデータとマニフェストを通じて、設計ID、改訂、スキーマ版、出典、利用条件、生成ツール、実行条件、状態を追跡できるようにします。CSVの入力条件と来歴は、対応するJSON記録に記載します。マニフェストは `public/assets/` と `public/data/` のファイル名、SHA256、サイズ、ライセンス、および生成ソースを収録します。

`evidence/*.json` と `decisions.tsv` は、データセットとともに公開する監査記録です。これらはGit履歴と、記録にあるソースハッシュや根拠へのリンクから追跡します。公開後に作るHTTP照合結果がマニフェストを参照するため、監査記録はデータセットのマニフェストに含めません。検証JSONには対象ID、改訂、ライセンス、帰属表示、検証方法と来歴を付けます。TSVのライセンスと帰属表示は `LICENSE-DATA` で定め、根拠は各行の `evidence` 列に残します。

誤りが見つかった場合は、訂正理由を添えた修正版を新しい版として公開し、旧版をGitタグまたは履歴から追跡できるようにします。個人情報の漏えいなどが発生した場合は、履歴維持より公開停止や対象データの削除を優先します。訂正記録には漏えいした情報を再掲しません。

### 数値と検証範囲

解析結果やゲーム調整値は測定値、シミュレーション値、推定値、演出用の値のいずれかを明記します。形状レポートの測定値は任意の設計単位で表す生成メッシュ上の形状情報です。実寸や物理性能を表しません。

初期版の形状確認はCAD形状の妥当性、境界、左右対称性を対象とします。ゲームの記録は決定論的な模擬操作とアーケード用の調整値を扱います。この初期版のデータは航空宇宙工学、実際の飛行、空力、構造強度、兵器、推進、ステルス、製造方法の評価を目的としません。今後の範囲は別途定めるミッションと公開条件に従います。

### テレメトリと失敗記録

初期版のゲームはユーザーのテレメトリ、分析データ、アカウント情報を収集しません。将来テレメトリを追加する場合は明示的なオプトインを必要とし、初期状態では無効にします。個人情報を扱う変更には公開方針に基づく人間の事前判断が必要です。

公開できる失敗記録は状態を `failed` と明記し、成功した結果として扱いません。秘密情報や個人情報を含む記録は公開しません。

## English

### Publication and licenses

The project publishes data it is authorized to release after checking for personal and confidential information, in line with the pre-approved publication policy. The human mission owner defines the allowed scope and conditions in advance; agents can complete publication within that scope.

Source code, artwork, images, mesh assets, CAD files, and documentation use the MIT License. Data records under `public/data/*`, `evidence/*.json`, and `decisions.tsv` use CC BY 4.0 and include attribution and machine-readable provenance. Third-party material keeps its original license. The project excludes third-party private data, credentials, secrets, and personally identifying information from publication.

### Published records and corrections

Review outputs, provenance, rights, personal information, and run status before publication. Dataset JSON metadata and the manifest make the design ID, revision, schema, source, license, generator, execution conditions and status traceable. Companion JSON records describe the inputs and provenance of CSV files. The manifest inventories files under `public/assets/` and `public/data/` with SHA256, byte size, license and generating sources.

`evidence/*.json` and `decisions.tsv` are public audit records alongside the dataset. Trace them through Git history and their source hashes or evidence links. Audit records stay outside the dataset manifest because post-publication HTTP verification refers back to that manifest. Verification JSON includes its target ID, revision, license, attribution, method and provenance. `LICENSE-DATA` supplies the TSV license and attribution; each row carries its evidence link.

When an error is found, publish a corrected new version with the reason for the correction, and keep the former version traceable through a Git tag or repository history. If personal information leaks, prioritize stopping publication or removing the affected data over preserving history. Do not repeat leaked information in the correction record.

### Values and verification scope

Label numerical analysis results and game tuning values as measured, simulated, estimated, or artistic. Measurements in a geometry report describe the generated mesh in arbitrary design units. They do not describe real dimensions or physical performance.

For the initial release, geometry checks cover CAD shape validity, bounds, and left-right symmetry. Game records cover deterministic simulated input and arcade tuning values. This initial dataset does not evaluate aerospace engineering, physical flight, aerodynamics, structural strength, weapons, propulsion, stealth, or manufacturing methods. Future work follows its separately defined mission and release conditions.

### Telemetry and failed runs

The initial game collects no user telemetry, analytics, or account data. Any future telemetry feature requires explicit opt-in and stays off by default. A change that handles personal data requires advance human judgment under the publication policy.

The project may publish a safe failed run with status `failed`. It does not present a failed run as a successful result. Do not publish a run that contains secrets or personal information.
