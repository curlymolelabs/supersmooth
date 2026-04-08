# Supersmooth

Supersmooth auto-approves browser URL prompts in Antigravity so the agent can open documentation, check APIs, and browse the web without interrupting your flow.

## Antigravity 1.22.2 Compatibility

Antigravity 1.22.2 (April 2026) introduced a native agent permission system that fixes most of the issues Supersmooth was originally built for:

| Issue | AG 1.22.2 | Supersmooth Still Needed? |
|-------|-----------|---------------------------|
| Terminal autorun confirmations | Fixed (Turbo mode + Allow/Deny lists) | No |
| Panel auto-expand | Fixed | No |
| Agent panel auto-scroll | Fixed | No |
| Auto-click terminal/file/MCP approvals | Fixed (Allow lists) | No |
| **Browser URL approval prompts** | **Not fixed** | **Yes** |
| Corrupt banner dismissal | N/A | Only if patching |

**If you can tolerate the occasional "Open URL in browser?" prompt:** you may not need Supersmooth anymore. Just update to AG 1.22.2 and uninstall Supersmooth (see [Clean Disable and Uninstall](#clean-disable-and-uninstall)).

**If you are on AG 1.22.2 or later:** Supersmooth 0.2.0 is compatible. It runs in DOM-only mode: only the browser URL auto-approval feature is active (all other features are native in AG 1.22.2).

**If you are on an older AG version (before 1.22.0):** Stay on Supersmooth 0.1.2, which was tested and verified for those versions.

## What It Does

On AG 1.22.2+, Supersmooth provides:

- **Auto-clicks browser URL approval buttons** ("Allow", "Allow for Workspace", "Allow Globally") when the agent wants to open a URL
- **Dismisses "corrupt installation" warnings** automatically after patching

On older AG versions, Supersmooth also provides these legacy features (now native in 1.22.2+):

- Removes terminal autorun confirmations
- Auto-expands approval prompts so "Steps Require Input" sections are never hidden
- Auto-clicks all approval buttons (terminal, file, MCP, and browser URL)
- Auto-scrolls the agent panel during generation
- Safely reversible with full backup and one-click revert
- Auto-detects updates and re-applies when Antigravity overwrites patched files

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

Supersmooth 自动审批 Antigravity 中的浏览器URL提示, 让代理可以打开文档, 检查API和浏览网页而不中断你的工作流程。

### Antigravity 1.22.2 兼容性

Antigravity 1.22.2 (2026年4月) 原生修复了 Supersmooth 的大部分功能。唯一未修复的是**浏览器URL审批自动点击**。

**如果你能接受偶尔出现的 "在浏览器中打开URL?" 提示:** 你可能不再需要 Supersmooth。更新到 AG 1.22.2 并卸载即可。

**AG 1.22.2 或更高版本:** Supersmooth 0.2.0 兼容。以 DOM-only 模式运行, 仅浏览器URL自动审批功能激活。

**旧版 AG (1.22.0 之前):** 请继续使用 Supersmooth 0.1.2, 该版本已在旧版本上测试验证。

### 功能

AG 1.22.2+ 上, Supersmooth 提供:

- **自动点击浏览器URL审批按钮** ("Allow", "Allow for Workspace", "Allow Globally")
- **自动关闭 "安装已损坏" 警告**

旧版 AG 上, Supersmooth 0.1.2 还提供以下功能 (已在 1.22.2+ 中原生支持):

- 移除终端自动运行确认弹窗
- 自动展开审批提示
- 自动点击所有审批按钮 (终端, 文件, MCP, 浏览器URL)
- 代理面板自动滚动
- 安全可逆, 完整备份一键还原
- 自动检测更新并重新应用

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

Supersmooth は Antigravity のブラウザURL承認プロンプトを自動承認し、エージェントがドキュメントの参照、APIの確認、ウェブブラウジングを中断なく行えるようにします。

### Antigravity 1.22.2 互換性

Antigravity 1.22.2 (2026年4月) はSupersmoothのほとんどの機能をネイティブに修正しました。唯一未修正なのは**ブラウザURL承認の自動クリック**です。

**「ブラウザでURLを開きますか?」のプロンプトを許容できる場合:** Supersmoothは不要かもしれません。AG 1.22.2に更新してアンインストールしてください。

**AG 1.22.2 以降:** Supersmooth 0.2.0 は互換性があります。DOM-onlyモードで動作し、ブラウザURL自動承認機能のみがアクティブです。

**旧バージョンのAG (1.22.0 以前):** Supersmooth 0.1.2 をご利用ください。旧バージョンでテスト検証済みです。

### 機能

AG 1.22.2+ では、Supersmoothは以下を提供:

- **ブラウザURL承認ボタンの自動クリック** ("Allow", "Allow for Workspace", "Allow Globally")
- **「インストールが破損」警告の自動非表示**

旧バージョンのAGでは、Supersmooth 0.1.2が以下も提供 (1.22.2+でネイティブ対応済み):

- ターミナル自動実行確認の削除
- 承認プロンプトの自動展開
- すべての承認ボタンの自動クリック (ターミナル、ファイル、MCP、ブラウザURL)
- エージェントパネルの自動スクロール
- 安全に元に戻せる (完全バックアップ、ワンクリック復元)
- 更新の自動検出と再適用

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

Supersmooth는 Antigravity의 브라우저 URL 승인 프롬프트를 자동 승인하여 에이전트가 문서 확인, API 체크, 웹 브라우징을 중단 없이 수행할 수 있게 합니다.

### Antigravity 1.22.2 호환성

Antigravity 1.22.2 (2026년 4월)는 Supersmooth의 대부분의 기능을 기본적으로 수정했습니다. 유일하게 수정되지 않은 것은 **브라우저 URL 승인 자동 클릭**입니다.

**가끔 나타나는 "브라우저에서 URL 열기?" 프롬프트를 허용할 수 있다면:** Supersmooth가 필요하지 않을 수 있습니다. AG 1.22.2로 업데이트하고 제거하세요.

**AG 1.22.2 이상:** Supersmooth 0.2.0은 호환됩니다. DOM-only 모드로 실행되며 브라우저 URL 자동 승인 기능만 활성화됩니다.

**이전 AG 버전 (1.22.0 이전):** Supersmooth 0.1.2를 사용하세요. 이전 버전에서 테스트 및 검증되었습니다.

### 기능

AG 1.22.2+에서 Supersmooth 제공 기능:

- **브라우저 URL 승인 버튼 자동 클릭** ("Allow", "Allow for Workspace", "Allow Globally")
- **"설치가 손상됨" 경고 자동 해제**

이전 AG 버전에서 Supersmooth 0.1.2 추가 기능 (1.22.2+에서 기본 지원됨):

- 터미널 자동 실행 확인 제거
- 승인 프롬프트 자동 확장
- 모든 승인 버튼 자동 클릭 (터미널, 파일, MCP, 브라우저 URL)
- 에이전트 패널 자동 스크롤
- 안전하게 되돌리기 가능 (전체 백업, 원클릭 복원)
- 업데이트 자동 감지 및 재적용

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
