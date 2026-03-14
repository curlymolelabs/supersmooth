# Supersmooth

Supersmooth smooths out the Antigravity approval flow with an explicit enable and disable model.

The extension can patch local Antigravity files to:

- remove terminal autorun confirmations when your saved policy is already trusted
- auto-expand approval sections so waiting steps are visible
- auto-click specific approval prompts inside Antigravity notifications and dialogs
- auto-scroll the agent side panel during generation
- dismiss the corrupt-install banner after patching

Supersmooth is installed separately from the on-disk patch. That distinction is important:

- installing the extension does not immediately patch files without your consent
- disabling Supersmooth restores the original files without requiring an uninstall hook
- uninstalling the extension only removes the extension package; it is not the cleanup step

## Platform Support

| Platform | Status |
|----------|--------|
| Windows | Verified |
| macOS | Beta |
| Linux | Beta |

## Install Flow

### Option A: Install from VSIX

1. Open Antigravity.
2. Open the Extensions panel.
3. Install `supersmooth-0.1.0.vsix`.
4. A modal dialog appears after a few seconds asking whether to enable now or later.
5. Click **Enable Now**.
6. A modal confirmation tells you to fully quit and reopen Antigravity. A window reload is not enough.

If you clicked **Later**, you can enable any time by:

- clicking the `Supersmooth: Enable` status bar action
- running `Supersmooth: Show Status` from the Command Palette

### Option B: Install from Open VSX

If Supersmooth is published, the flow is the same:

1. Install the extension.
2. Click **Enable Now** in the modal dialog that appears.
3. Fully quit and reopen Antigravity.

### Option C: CLI

The CLI patches files directly and does not manage extension state:

```bash
supersmooth status
supersmooth apply
supersmooth verify
```

If you use the CLI, fully quit and reopen Antigravity after `apply` or `revert`.

## Daily Use

Once Supersmooth has been enabled for an installation, the extension remembers that choice.

- if Antigravity starts with the patched files still present, Supersmooth stays quiet
- if Antigravity updates and replaces the patched files, Supersmooth re-applies them and shows a modal asking you to quit and reopen
- if you disable Supersmooth, it stays disabled and will not silently re-patch on the next launch

## Clean Disable and Uninstall

The smooth removal flow is:

1. Open the Command Palette.
2. Run `Supersmooth: Remove Cleanly`.
3. Confirm in the modal dialog. Supersmooth restores the original files.
4. A modal confirmation tells you to fully quit and reopen Antigravity.
5. Uninstall the extension from the Extensions panel whenever you are ready.

You can also run `Supersmooth: Disable Supersmooth` to keep the extension installed but inactive. Once disabled, the extension stays quiet and does not re-patch on launch.

## Commands

| Command | What it does |
|---------|---------------|
| `Supersmooth: Show Status` | Guided wizard: offers **Enable Now** / **Later** for new installs, **Re-enable** / **Dismiss** for disabled installs, and health actions for active installs |
| `Supersmooth: Enable Supersmooth` | Patches the local Antigravity files and marks Supersmooth as enabled |
| `Supersmooth: Disable Supersmooth` | Restores the original files and marks Supersmooth as disabled |
| `Supersmooth: Remove Cleanly` | Disables Supersmooth, restores original files, and offers to open the Extensions panel for uninstall |
| `Supersmooth: Verify Installation` | Checks the patched state and checksum integrity |

## CLI Reference

```bash
supersmooth status
supersmooth apply
supersmooth revert
supersmooth verify
supersmooth watch
supersmooth apply --force
```

## Safety Notes

Supersmooth is designed to be reversible:

- it creates manifest-backed backups before writing files
- it restores those backups during disable and remove-cleanly flows
- it updates only the relevant integrity checksums
- it validates patched JavaScript before writing bundle changes

Two practical notes:

- a full quit and reopen is safer than `Reload Window` after patch changes
- uninstalling the extension is not the cleanup step; disabling via `Remove Cleanly` is the cleanup step

## Packaging

To build a fresh VSIX from this folder:

```bash
npx @vscode/vsce package
```

---

## 简体中文

Supersmooth 使用显式的启用/禁用模型来简化 Antigravity 的审批流程。

### 安装流程

1. 打开 Antigravity。
2. 打开扩展面板。
3. 安装 `supersmooth-0.1.0.vsix`。
4. 几秒后会弹出模态对话框，询问是否立即启用。
5. 点击 **Enable Now**。
6. 模态确认会提示你完全退出并重新打开 Antigravity。仅重新加载窗口是不够的。

如果你点击了 **Later**，可以随时通过以下方式启用:

- 点击状态栏的 `Supersmooth: Enable` 操作
- 从命令面板运行 `Supersmooth: Show Status`

### 日常使用

启用后，扩展会记住你的选择。

- Antigravity 启动时如果补丁文件仍然存在，Supersmooth 保持静默
- 如果 Antigravity 更新替换了补丁文件，Supersmooth 会自动重新应用并弹出模态提示退出重启
- 如果你禁用了 Supersmooth，它会保持禁用状态，不会在下次启动时静默重新打补丁

### 干净禁用和卸载

1. 打开命令面板。
2. 运行 `Supersmooth: Remove Cleanly`。
3. 在模态对话框中确认。Supersmooth 会恢复原始文件。
4. 模态确认会提示你完全退出并重新打开 Antigravity。
5. 在扩展面板中卸载扩展。

### 命令

| 命令 | 功能 |
|------|------|
| `Supersmooth: Show Status` | 引导向导: 新安装显示 **Enable Now** / **Later**，已禁用显示 **Re-enable** / **Dismiss** |
| `Supersmooth: Enable Supersmooth` | 修补本地 Antigravity 文件并标记为已启用 |
| `Supersmooth: Disable Supersmooth` | 恢复原始文件并标记为已禁用 |
| `Supersmooth: Remove Cleanly` | 禁用 Supersmooth，恢复原始文件，并提供打开扩展面板的选项 |
| `Supersmooth: Verify Installation` | 检查补丁状态和校验完整性 |

---

## 日本語

Supersmooth は明示的な有効化/無効化モデルで Antigravity の承認フローを効率化します。

### インストール手順

1. Antigravity を開く。
2. 拡張機能パネルを開く。
3. `supersmooth-0.1.0.vsix` をインストール。
4. 数秒後にモーダルダイアログが表示され、今すぐ有効にするか尋ねられます。
5. **Enable Now** をクリック。
6. モーダル確認で Antigravity を完全に終了して再度開くよう指示されます。ウィンドウのリロードだけでは不十分です。

**Later** をクリックした場合、いつでも以下の方法で有効にできます:

- ステータスバーの `Supersmooth: Enable` アクションをクリック
- コマンドパレットから `Supersmooth: Show Status` を実行

### 日常の使い方

有効にすると、拡張機能はその選択を記憶します。

- パッチ済みファイルが存在する状態で Antigravity が起動した場合、Supersmooth は何もしません
- Antigravity が更新されてパッチ済みファイルが置き換えられた場合、自動的に再適用してモーダルで終了、再起動を促します
- Supersmooth を無効にした場合、無効のまま維持され、次回起動時に再パッチされません

### クリーンな無効化とアンインストール

1. コマンドパレットを開く。
2. `Supersmooth: Remove Cleanly` を実行。
3. モーダルダイアログで確認。Supersmooth が元のファイルを復元します。
4. モーダル確認で Antigravity を完全に終了して再度開くよう指示されます。
5. 拡張機能パネルから拡張機能をアンインストール。

### コマンド

| コマンド | 機能 |
|----------|------|
| `Supersmooth: Show Status` | ガイド付きウィザード: 新規は **Enable Now** / **Later**、無効時は **Re-enable** / **Dismiss** |
| `Supersmooth: Enable Supersmooth` | ローカル Antigravity ファイルにパッチを適用し有効としてマーク |
| `Supersmooth: Disable Supersmooth` | 元のファイルを復元し無効としてマーク |
| `Supersmooth: Remove Cleanly` | Supersmooth を無効化し、元のファイルを復元、拡張機能パネルを開くオプションを提供 |
| `Supersmooth: Verify Installation` | パッチ状態とチェックサムの整合性を確認 |

---

## 한국어

Supersmooth는 명시적인 활성화/비활성화 모델로 Antigravity의 승인 흐름을 간소화합니다.

### 설치 방법

1. Antigravity를 엽니다.
2. 확장 프로그램 패널을 엽니다.
3. `supersmooth-0.1.0.vsix`를 설치합니다.
4. 몇 초 후 모달 대화 상자가 나타나 지금 활성화할지 묻습니다.
5. **Enable Now**를 클릭합니다.
6. 모달 확인에서 Antigravity를 완전히 종료하고 다시 열라고 안내합니다. 창 새로고침만으로는 충분하지 않습니다.

**Later**를 클릭한 경우, 언제든지 다음 방법으로 활성화할 수 있습니다:

- 상태 표시줄의 `Supersmooth: Enable` 작업 클릭
- 명령 팔레트에서 `Supersmooth: Show Status` 실행

### 일상적인 사용

활성화하면 확장 프로그램이 선택을 기억합니다.

- 패치된 파일이 있는 상태로 Antigravity가 시작되면 Supersmooth는 조용히 유지됩니다
- Antigravity가 업데이트되어 패치된 파일이 교체되면 자동으로 다시 적용하고 모달로 종료 후 재시작을 안내합니다
- Supersmooth를 비활성화하면 비활성 상태를 유지하며 다음 시작 시 자동 패치하지 않습니다

### 깨끗한 비활성화 및 제거

1. 명령 팔레트를 엽니다.
2. `Supersmooth: Remove Cleanly`를 실행합니다.
3. 모달 대화 상자에서 확인합니다. Supersmooth가 원본 파일을 복원합니다.
4. 모달 확인에서 Antigravity를 완전히 종료하고 다시 열라고 안내합니다.
5. 확장 프로그램 패널에서 확장 프로그램을 제거합니다.

### 명령어

| 명령어 | 기능 |
|--------|------|
| `Supersmooth: Show Status` | 안내 마법사: 신규 설치 시 **Enable Now** / **Later**, 비활성 시 **Re-enable** / **Dismiss** |
| `Supersmooth: Enable Supersmooth` | 로컬 Antigravity 파일을 패치하고 활성으로 표시 |
| `Supersmooth: Disable Supersmooth` | 원본 파일을 복원하고 비활성으로 표시 |
| `Supersmooth: Remove Cleanly` | Supersmooth를 비활성화하고 원본 파일을 복원하며 확장 프로그램 패널 열기 옵션 제공 |
| `Supersmooth: Verify Installation` | 패치 상태 및 체크섬 무결성 확인 |
