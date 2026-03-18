# Supersmooth

Supersmooth makes your Antigravity workflow truly seamless. It automatically patches your installation to remove unnecessary confirmation prompts and auto-expand approval sections, so you can focus on building instead of clicking.

## What It Does

- **Removes terminal autorun confirmations** when your saved policy is already "Always run"
- **Auto-expands approval prompts** so "Steps Require Input" sections are never hidden
- **Auto-clicks approval buttons** (Allow, Always Allow, Accept, Run) in permission dialogs, browser URL prompts, and file access prompts. Prefers persistent options like "Always Allow" over one-time approvals.
- **Auto-scrolls the agent panel** during generation, pauses when you scroll up
- **Dismisses "corrupt installation" warnings** automatically after patching
- **Safely reversible** with full backup and one-click revert
- **Auto-detects updates** and re-applies when Antigravity overwrites patched files

Supersmooth is installed separately from the on-disk patch. That distinction matters:

- Installing the extension does not patch files without your consent
- Disabling Supersmooth restores the original files
- Uninstalling the extension alone is not the cleanup step

## Platform Support

| Platform | Status |
|----------|--------|
| **Windows** | Optimized and verified |
| macOS | Beta (not yet verified) |
| Linux | Beta (not yet verified) |

## Installation

### Option A: Extensions Panel (Recommended)

1. Open the Extensions panel in Antigravity (Ctrl+Shift+X).
2. Search for **Supersmooth**.
3. Click **Install**.
4. A modal dialog appears after a few seconds asking whether to enable now.
5. Click **Enable Now**.
6. Fully quit Antigravity and reopen it. A window reload is not enough.
7. Done. Patches are active.

If you clicked **Later**, you can enable any time by:

- clicking the `Supersmooth: Enable` status bar action
- running `Supersmooth: Show Status` from the Command Palette (Ctrl+Shift+P)

### Option B: Download from Open VSX

If you prefer to download and install manually:

1. Go to the [Supersmooth page on Open VSX](https://open-vsx.org/extension/curlymolelabs/supersmooth).
2. Find the **Download** link on the right side of the listing page.
3. Download the `.vsix` file.
4. In Antigravity, open the Command Palette (Ctrl+Shift+P).
5. Type **Extensions: Install from VSIX...** and press Enter.
6. Choose the downloaded `.vsix` file.
7. A modal dialog appears after a few seconds asking whether to enable now.
8. Click **Enable Now**.
9. Fully quit Antigravity and reopen it. A window reload is not enough.
10. Done. Patches are active.

## Daily Use

Once enabled, Supersmooth remembers your choice across restarts.

- If Antigravity starts with patched files still present, Supersmooth stays quiet.
- If Antigravity updates and replaces the patched files, Supersmooth re-applies them and asks you to quit and reopen.
- If you disable Supersmooth, it stays disabled and will not silently re-patch on the next launch.

## Clean Disable and Uninstall

Supersmooth patches files on disk. Uninstalling the extension alone does not remove these patches. To fully restore original behavior:

1. Open the Command Palette (Ctrl+Shift+P).
2. Run **Supersmooth: Remove Cleanly**.
3. Confirm in the modal dialog. Supersmooth restores the original files.
4. Fully quit Antigravity and reopen it.
5. Uninstall the extension from the Extensions panel.
6. Done. Original behavior restored.

> **What happens if I skip the revert?** The patches continue to work even without the extension installed. This is harmless but means you keep the modified behavior. To clean up later, reinstall Supersmooth, run Remove Cleanly, then uninstall again.

You can also run **Supersmooth: Disable Supersmooth** to keep the extension installed but inactive. Once disabled, the extension stays quiet and does not re-patch on launch.

## Commands

Available via the Command Palette (Ctrl+Shift+P):

| Command | What it does |
|---------|--------------|
| **Supersmooth: Show Status** | Guided wizard: offers **Enable Now** / **Later** for new installs, **Re-enable** / **Dismiss** for disabled installs, and health actions for active installs |
| **Supersmooth: Enable Supersmooth** | Patches the local Antigravity files and marks Supersmooth as enabled |
| **Supersmooth: Disable Supersmooth** | Restores the original files and marks Supersmooth as disabled |
| **Supersmooth: Remove Cleanly** | Disables Supersmooth, restores original files, and offers to open the Extensions panel for uninstall |
| **Supersmooth: Verify Installation** | Checks patch integrity and checksum state |

## Safety

Supersmooth is designed to fail closed:

- Creates manifest-backed backups before any changes
- Validates all modifications with a syntax gate before writing
- Updates only the touched integrity checksums
- Atomic rollback on any error during patch application
- Detects incompatible or pre-existing patches and refuses to overwrite

Two practical notes:

- A full quit and reopen is safer than Reload Window after patch changes.
- Uninstalling the extension is not the cleanup step; running **Remove Cleanly** is the cleanup step.

## Packaging

To build a fresh VSIX from this folder:

```bash
npx @vscode/vsce package
```

## License

MIT

---

## 简体中文

Supersmooth 让你的 Antigravity 工作流程更顺畅。它自动修补安装文件, 移除不必要的确认弹窗, 自动展开审批区域, 让你专注于编码而非点击。

### 功能

- **移除终端自动运行确认弹窗** (当策略为 "Always run" 时)
- **自动展开审批提示** ("Steps Require Input" 不再隐藏)
- **自动点击审批按钮** (Allow, Always Allow, Accept, Run 等权限对话框, 浏览器URL提示, 文件访问提示)。优先选择持久选项如 "Always Allow"
- **代理面板自动滚动** (生成时自动滚动, 手动上滑时暂停)
- **自动关闭 "安装已损坏" 警告**
- **安全可逆** (完整备份, 一键还原)
- **自动检测更新** (Antigravity 更新覆盖文件后自动重新应用)

### 安装

#### 方式 A: 扩展面板 (推荐)

1. 在 Antigravity 中打开扩展面板 (Ctrl+Shift+X)。
2. 搜索 **Supersmooth**。
3. 点击 **Install**。
4. 几秒后弹出模态对话框, 询问是否立即启用。
5. 点击 **Enable Now**。
6. 完全退出并重新打开 Antigravity。仅重新加载窗口是不够的。
7. 完成。补丁已激活。

如果你点击了 **Later**, 可以随时通过以下方式启用:

- 点击状态栏的 `Supersmooth: Enable` 操作
- 从命令面板 (Ctrl+Shift+P) 运行 `Supersmooth: Show Status`

#### 方式 B: 从 Open VSX 下载

1. 前往 [Supersmooth 在 Open VSX 的页面](https://open-vsx.org/extension/curlymolelabs/supersmooth)。
2. 在页面右侧找到 **Download** 链接。
3. 下载 `.vsix` 文件。
4. 在 Antigravity 中打开命令面板 (Ctrl+Shift+P)。
5. 输入 **Extensions: Install from VSIX...** 并回车。
6. 选择下载的 `.vsix` 文件。
7. 几秒后弹出模态对话框, 询问是否立即启用。
8. 点击 **Enable Now**。
9. 完全退出并重新打开 Antigravity。仅重新加载窗口是不够的。
10. 完成。补丁已激活。

### 日常使用

启用后, Supersmooth 会记住你的选择。

- Antigravity 启动时如果补丁文件仍然存在, Supersmooth 保持静默。
- 如果 Antigravity 更新替换了补丁文件, Supersmooth 会自动重新应用并提示退出重启。
- 如果你禁用了 Supersmooth, 它会保持禁用状态, 不会在下次启动时静默重新打补丁。

### 干净禁用和卸载

1. 打开命令面板 (Ctrl+Shift+P)。
2. 运行 **Supersmooth: Remove Cleanly**。
3. 在模态对话框中确认。Supersmooth 会恢复原始文件。
4. 完全退出并重新打开 Antigravity。
5. 在扩展面板中卸载扩展。
6. 完成。原始行为已恢复。

> **如果跳过还原会怎样?** 补丁会继续工作。这不会造成危害, 但意味着修改后的行为会保留。如需清理, 重新安装 Supersmooth, 运行 Remove Cleanly, 然后卸载。

### 命令

通过命令面板 (Ctrl+Shift+P) 使用:

| 命令 | 功能 |
|------|------|
| **Supersmooth: Show Status** | 引导向导: 新安装显示 **Enable Now** / **Later**, 已禁用显示 **Re-enable** / **Dismiss** |
| **Supersmooth: Enable Supersmooth** | 修补本地 Antigravity 文件并标记为已启用 |
| **Supersmooth: Disable Supersmooth** | 恢复原始文件并标记为已禁用 |
| **Supersmooth: Remove Cleanly** | 禁用 Supersmooth, 恢复原始文件, 并提供打开扩展面板的选项 |
| **Supersmooth: Verify Installation** | 检查补丁状态和校验完整性 |

---

## 日本語

Supersmooth は Antigravity のワークフローをスムーズにします。不要な確認プロンプトを自動的に削除し、承認セクションを自動展開するので、クリックではなくコーディングに集中できます。

### 機能

- **ターミナル自動実行確認の削除** (ポリシーが "Always run" の場合)
- **承認プロンプトの自動展開** ("Steps Require Input" を常に表示)
- **承認ボタンの自動クリック** (Allow, Always Allow, Accept, Run など、権限ダイアログ、ブラウザURLプロンプト、ファイルアクセスプロンプト)。"Always Allow" などの永続オプションを優先
- **エージェントパネルの自動スクロール** (生成中に自動スクロール、手動スクロールで一時停止)
- **「インストールが破損」警告の自動非表示**
- **安全に元に戻せる** (完全バックアップ、ワンクリックで復元)
- **更新の自動検出** (Antigravity の更新でファイルが置き換えられた場合、自動的に再適用)

### インストール

#### 方法 A: 拡張機能パネル (推奨)

1. Antigravity の拡張機能パネルを開く (Ctrl+Shift+X)。
2. **Supersmooth** を検索。
3. **Install** をクリック。
4. 数秒後にモーダルダイアログが表示され、今すぐ有効にするか尋ねられます。
5. **Enable Now** をクリック。
6. Antigravity を完全に終了して再度開く。ウィンドウのリロードだけでは不十分です。
7. 完了。パッチが有効になりました。

**Later** をクリックした場合、いつでも以下の方法で有効にできます:

- ステータスバーの `Supersmooth: Enable` アクションをクリック
- コマンドパレット (Ctrl+Shift+P) から `Supersmooth: Show Status` を実行

#### 方法 B: Open VSX からダウンロード

1. [Open VSX の Supersmooth ページ](https://open-vsx.org/extension/curlymolelabs/supersmooth)へ。
2. ページ右側の **Download** リンクを見つける。
3. `.vsix` ファイルをダウンロード。
4. コマンドパレットを開く (Ctrl+Shift+P)。
5. **Extensions: Install from VSIX...** と入力して Enter。
6. ダウンロードした `.vsix` ファイルを選択。
7. 数秒後にモーダルダイアログが表示され、今すぐ有効にするか尋ねられます。
8. **Enable Now** をクリック。
9. Antigravity を完全に終了して再度開く。ウィンドウのリロードだけでは不十分です。
10. 完了。パッチが有効になりました。

### 日常の使い方

有効にすると、拡張機能はその選択を記憶します。

- パッチ済みファイルが存在する状態で起動した場合、Supersmooth は何もしません。
- Antigravity が更新されてファイルが置き換えられた場合、自動的に再適用して終了、再起動を促します。
- 無効にした場合、無効のまま維持され、次回起動時に再パッチされません。

### クリーンな無効化とアンインストール

1. コマンドパレットを開く (Ctrl+Shift+P)。
2. **Supersmooth: Remove Cleanly** を実行。
3. モーダルダイアログで確認。Supersmooth が元のファイルを復元します。
4. Antigravity を完全に終了して再度開く。
5. 拡張機能パネルからアンインストール。
6. 完了。元の動作が復元されました。

> **元に戻さずにアンインストールしたら?** パッチはそのまま動作し続けます。害はありませんが、変更された動作が残ります。後でクリーンアップする場合は、Supersmooth を再インストールし、Remove Cleanly を実行してからアンインストールしてください。

### コマンド

コマンドパレット (Ctrl+Shift+P) で使用:

| コマンド | 機能 |
|----------|------|
| **Supersmooth: Show Status** | ガイド付きウィザード: 新規は **Enable Now** / **Later**、無効時は **Re-enable** / **Dismiss** |
| **Supersmooth: Enable Supersmooth** | ローカル Antigravity ファイルにパッチを適用し有効としてマーク |
| **Supersmooth: Disable Supersmooth** | 元のファイルを復元し無効としてマーク |
| **Supersmooth: Remove Cleanly** | Supersmooth を無効化し、元のファイルを復元、拡張機能パネルを開くオプションを提供 |
| **Supersmooth: Verify Installation** | パッチ状態とチェックサムの整合性を確認 |

---

## 한국어

Supersmooth는 Antigravity 워크플로우를 매끄럽게 만듭니다. 불필요한 확인 프롬프트를 자동으로 제거하고 승인 섹션을 자동 확장하여 클릭 대신 코딩에 집중할 수 있습니다.

### 기능

- **터미널 자동 실행 확인 제거** (정책이 "Always run"인 경우)
- **승인 프롬프트 자동 확장** ("Steps Require Input" 항상 표시)
- **승인 버튼 자동 클릭** (Allow, Always Allow, Accept, Run 등 권한 대화 상자, 브라우저 URL 프롬프트, 파일 접근 프롬프트). "Always Allow" 같은 영구 옵션 우선 선택
- **에이전트 패널 자동 스크롤** (생성 중 자동 스크롤, 수동 스크롤 시 일시 중지)
- **"설치가 손상됨" 경고 자동 해제**
- **안전하게 되돌리기 가능** (전체 백업, 원클릭 복원)
- **업데이트 자동 감지** (Antigravity 업데이트로 파일이 교체되면 자동 재적용)

### 설치

#### 방법 A: 확장 프로그램 패널 (권장)

1. Antigravity에서 확장 프로그램 패널을 엽니다 (Ctrl+Shift+X).
2. **Supersmooth**를 검색합니다.
3. **Install**을 클릭합니다.
4. 몇 초 후 모달 대화 상자가 나타나 지금 활성화할지 묻습니다.
5. **Enable Now**를 클릭합니다.
6. Antigravity를 완전히 종료하고 다시 엽니다. 창 새로고침만으로는 충분하지 않습니다.
7. 완료. 패치가 활성화되었습니다.

**Later**를 클릭한 경우, 언제든지 다음 방법으로 활성화할 수 있습니다:

- 상태 표시줄의 `Supersmooth: Enable` 작업 클릭
- 명령 팔레트 (Ctrl+Shift+P) 에서 `Supersmooth: Show Status` 실행

#### 방법 B: Open VSX에서 다운로드

1. [Open VSX의 Supersmooth 페이지](https://open-vsx.org/extension/curlymolelabs/supersmooth)를 방문합니다.
2. 페이지 오른쪽에서 **Download** 링크를 찾습니다.
3. `.vsix` 파일을 다운로드합니다.
4. 명령 팔레트를 엽니다 (Ctrl+Shift+P).
5. **Extensions: Install from VSIX...** 를 입력하고 Enter를 누릅니다.
6. 다운로드한 `.vsix` 파일을 선택합니다.
7. 몇 초 후 모달 대화 상자가 나타나 지금 활성화할지 묻습니다.
8. **Enable Now**를 클릭합니다.
9. Antigravity를 완전히 종료하고 다시 엽니다. 창 새로고침만으로는 충분하지 않습니다.
10. 완료. 패치가 활성화되었습니다.

### 일상적인 사용

활성화하면 Supersmooth가 선택을 기억합니다.

- 패치된 파일이 있는 상태로 시작되면 Supersmooth는 조용히 유지됩니다.
- Antigravity가 업데이트되어 파일이 교체되면 자동으로 재적용하고 종료 후 재시작을 안내합니다.
- 비활성화하면 비활성 상태를 유지하며 다음 시작 시 자동 패치하지 않습니다.

### 깨끗한 비활성화 및 제거

1. 명령 팔레트를 엽니다 (Ctrl+Shift+P).
2. **Supersmooth: Remove Cleanly**를 실행합니다.
3. 모달 대화 상자에서 확인합니다. Supersmooth가 원본 파일을 복원합니다.
4. Antigravity를 완전히 종료하고 다시 엽니다.
5. 확장 프로그램 패널에서 제거합니다.
6. 완료. 원래 동작이 복원되었습니다.

> **되돌리기 없이 제거하면?** 패치는 계속 작동합니다. 해롭지는 않지만 수정된 동작이 유지됩니다. 나중에 정리하려면 Supersmooth를 다시 설치하고 Remove Cleanly를 실행한 후 제거하세요.

### 명령어

명령 팔레트 (Ctrl+Shift+P) 에서 사용:

| 명령어 | 기능 |
|--------|------|
| **Supersmooth: Show Status** | 안내 마법사: 신규 설치 시 **Enable Now** / **Later**, 비활성 시 **Re-enable** / **Dismiss** |
| **Supersmooth: Enable Supersmooth** | 로컬 Antigravity 파일을 패치하고 활성으로 표시 |
| **Supersmooth: Disable Supersmooth** | 원본 파일을 복원하고 비활성으로 표시 |
| **Supersmooth: Remove Cleanly** | Supersmooth를 비활성화하고 원본 파일을 복원하며 확장 프로그램 패널 열기 옵션 제공 |
| **Supersmooth: Verify Installation** | 패치 상태 및 체크섬 무결성 확인 |
