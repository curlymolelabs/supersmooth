# Supersmooth

Supersmooth makes your Antigravity workflow truly seamless. It automatically patches your installation to remove unnecessary terminal confirmation prompts and auto-expand approval sections, so you can focus on building instead of clicking.

## What It Does

- **Removes terminal autorun confirmations** when your saved policy is "Always run"
- **Auto-expands approval prompts** so "Steps Require Input" sections are never hidden
- **Auto-clicks approval buttons** (Allow, Accept, Run) in permission dialogs
- **Auto-scrolls the chat panel** during agent generation, pauses when you scroll up
- **Dismisses "corrupt installation" warnings** automatically after patching
- **Safely reversible** with full backup and one-click revert
- **Auto-detects updates** and re-applies when Antigravity overwrites patched files

## Platform Support

| Platform | Status |
|----------|--------|
| **Windows** | Optimized and verified |
| macOS | Beta (not yet verified) |
| Linux | Beta (not yet verified) |

Requires Antigravity 1.20.5 or above.

## Installation

There are three ways to install Supersmooth. All three result in the same outcome.

### Option A: Extensions Panel (Recommended)

The simplest method if Supersmooth is published to Open VSX.

1. Open Extensions panel (Ctrl+Shift+X)
2. Search for **Supersmooth**
3. Click **Install**
4. Supersmooth applies the patch and reloads automatically
5. Done. Patches are active.

### Option B: Download from Open VSX

If you prefer to download manually from the marketplace.

1. Go to the Supersmooth page on [Open VSX](https://open-vsx.org/)
2. Download the `.vsix` file
3. In Antigravity, open Command Palette (Ctrl+Shift+P)
4. Type **Extensions: Install from VSIX...**
5. Choose the downloaded `.vsix` file
6. Supersmooth applies the patch and reloads automatically
7. Done. Patches are active.

### Option C: CLI

Install directly from the terminal.

```bash
antigravity --install-extension supersmooth-0.1.0.vsix
```

Then reopen Antigravity. On next launch, Supersmooth activates automatically, applies the patch, and reloads the window.

## Uninstallation

Supersmooth patches files on disk. Uninstalling the extension alone does not remove these patches. To fully restore original Antigravity behavior:

1. Open the Command Palette (Ctrl+Shift+P)
2. Run **Supersmooth: Revert Patch**
3. Confirm "Revert" when prompted
4. Close Antigravity completely and reopen it
5. Uninstall the extension from the Extensions panel
6. Done. Original behavior restored.

> **What happens if I skip the revert?** The patches continue to work even without the extension installed. This is harmless but means you keep the modified behavior. To clean up later, reinstall Supersmooth, run Revert Patch, then uninstall again.

## Admin Commands (Command Palette)

Available via Ctrl+Shift+P for diagnostics and recovery:

| Command | Description |
|---------|-------------|
| **Supersmooth: Show Status** | Current patch state |
| **Supersmooth: Apply Patch** | Re-apply after an update |
| **Supersmooth: Revert Patch** | Restore original files from backup |
| **Supersmooth: Verify Installation** | Check patch integrity |

## CLI Reference

```bash
supersmooth status                    # Show current state
supersmooth apply                     # Apply the patch
supersmooth revert                    # Restore from backup
supersmooth verify                    # Check patch integrity
supersmooth watch                     # Apply + monitor for updates
supersmooth apply --force             # Bypass version check
```

### Watch Mode

When Antigravity auto-updates, it overwrites patched files. The `watch` command applies the patch, then monitors and re-patches automatically.

## Safety

Supersmooth is designed to fail closed:

- Creates manifest-backed backups before any changes
- Validates all modifications with a syntax gate before writing
- Updates only the touched integrity checksums
- Atomic rollback on any error during patch application
- Detects incompatible or pre-existing patches and refuses to overwrite

## License

MIT

---

# 中文说明

Supersmooth 让你的 Antigravity 工作流程更顺畅。它自动修补安装文件, 移除不必要的终端确认弹窗, 自动展开审批区域, 让你专注于编码而非点击。

## 功能

- **移除终端自动运行确认弹窗** (当策略为 "Always run" 时)
- **自动展开审批提示** ("Steps Require Input" 不再隐藏)
- **自动点击审批按钮** (Allow, Accept, Run 等权限对话框)
- **聊天面板自动滚动** (代理生成时自动滚动, 手动上滑时暂停)
- **自动关闭 "安装已损坏" 警告**
- **安全可逆** (完整备份, 一键还原)

## 安装

### 方式 A: 扩展面板 (推荐)

1. 打开扩展面板 (Ctrl+Shift+X)
2. 搜索 **Supersmooth**
3. 点击 **Install**
4. Supersmooth 自动修补并重新加载
5. 完成

### 方式 B: 从 Open VSX 下载

1. 前往 [Open VSX](https://open-vsx.org/) 的 Supersmooth 页面
2. 下载 `.vsix` 文件
3. 在 Antigravity 中打开命令面板 (Ctrl+Shift+P)
4. 输入 **Extensions: Install from VSIX...**
5. 选择下载的 `.vsix` 文件
6. Supersmooth 自动修补并重新加载
7. 完成

### 方式 C: 命令行

```bash
antigravity --install-extension supersmooth-0.1.0.vsix
```

重新打开 Antigravity 即可自动激活。

## 卸载

1. 打开命令面板 (Ctrl+Shift+P)
2. 运行 **Supersmooth: Revert Patch**
3. 确认 "Revert"
4. 关闭并重新打开 Antigravity
5. 从扩展面板卸载
6. 完成

---

# 日本語

Supersmooth は Antigravity のワークフローをスムーズにします。ターミナルの確認プロンプトを自動的に削除し、承認セクションを自動展開します。

## 機能

- **ターミナル自動実行確認の削除** (ポリシーが "Always run" の場合)
- **承認プロンプトの自動展開** ("Steps Require Input" を常に表示)
- **承認ボタンの自動クリック** (Allow, Accept, Run など)
- **チャットパネルの自動スクロール** (エージェント生成中に自動スクロール、手動スクロールで一時停止)
- **「インストールが破損」警告の自動非表示**
- **安全に元に戻せる** (完全バックアップ、ワンクリックで復元)

## インストール

### 方法 A: 拡張機能パネル (推奨)

1. 拡張機能パネルを開く (Ctrl+Shift+X)
2. **Supersmooth** を検索
3. **Install** をクリック
4. Supersmooth が自動的にパッチを適用し、リロードします
5. 完了

### 方法 B: Open VSX からダウンロード

1. [Open VSX](https://open-vsx.org/) の Supersmooth ページへ
2. `.vsix` ファイルをダウンロード
3. コマンドパレットを開く (Ctrl+Shift+P)
4. **Extensions: Install from VSIX...** と入力
5. ダウンロードした `.vsix` ファイルを選択
6. Supersmooth が自動的にパッチを適用し、リロードします
7. 完了

### 方法 C: CLI

```bash
antigravity --install-extension supersmooth-0.1.0.vsix
```

Antigravity を再起動すると自動的に有効になります。

## アンインストール

1. コマンドパレットを開く (Ctrl+Shift+P)
2. **Supersmooth: Revert Patch** を実行
3. "Revert" を確認
4. Antigravity を閉じて再度開く
5. 拡張機能パネルからアンインストール
6. 完了

---

# 한국어

Supersmooth는 Antigravity 워크플로우를 매끄럽게 만듭니다. 불필요한 터미널 확인 프롬프트를 자동으로 제거하고 승인 섹션을 자동 확장합니다.

## 기능

- **터미널 자동 실행 확인 제거** (정책이 "Always run"인 경우)
- **승인 프롬프트 자동 확장** ("Steps Require Input" 항상 표시)
- **승인 버튼 자동 클릭** (Allow, Accept, Run 등 권한 대화 상자)
- **채팅 패널 자동 스크롤** (에이전트 생성 중 자동 스크롤, 수동 스크롤 시 일시 중지)
- **"설치가 손상됨" 경고 자동 해제**
- **안전하게 되돌리기 가능** (전체 백업, 원클릭 복원)

## 설치

### 방법 A: 확장 패널 (권장)

1. 확장 패널 열기 (Ctrl+Shift+X)
2. **Supersmooth** 검색
3. **Install** 클릭
4. Supersmooth가 자동으로 패치를 적용하고 리로드합니다
5. 완료

### 방법 B: Open VSX에서 다운로드

1. [Open VSX](https://open-vsx.org/)의 Supersmooth 페이지 방문
2. `.vsix` 파일 다운로드
3. 명령 팔레트 열기 (Ctrl+Shift+P)
4. **Extensions: Install from VSIX...** 입력
5. 다운로드한 `.vsix` 파일 선택
6. Supersmooth가 자동으로 패치를 적용하고 리로드합니다
7. 완료

### 방법 C: CLI

```bash
antigravity --install-extension supersmooth-0.1.0.vsix
```

Antigravity를 다시 열면 자동으로 활성화됩니다.

## 제거

1. 명령 팔레트 열기 (Ctrl+Shift+P)
2. **Supersmooth: Revert Patch** 실행
3. "Revert" 확인
4. Antigravity를 닫고 다시 열기
5. 확장 패널에서 제거
6. 완료
