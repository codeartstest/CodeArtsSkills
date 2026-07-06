---
name: playwright-cli-installer
description: "One-click installer for the playwright-cli browser automation skill into CodeArts. Installs the skill files (SKILL.md + 10 references) via npx skills add, the @playwright/cli npm package globally, and the chromium browser — then runs a dry-run verification. Use when the user wants to install, update, or uninstall playwright-cli for CodeArts. Triggers on: install playwright-cli, setup playwright-cli, add playwright cli, browser automation skill, 一键安装playwright-cli, 安装浏览器自动化工具."
---

# Playwright-CLI Installer

One-click installer for the [playwright-cli](https://github.com/microsoft/playwright-cli) skill — 40+ CLI commands for browser automation, web testing, and Playwright test management.

Installs three components:
1. **Skill files** — `SKILL.md` + 10 reference guides, installed via `npx skills add` into `.codeartsdoer/skills/playwright-cli/`
2. **CLI binary** — `@playwright/cli` npm package (provides the `playwright-cli` command)
3. **Chromium browser** — the browser engine required for automation

## Quick Start

```bash
node skills/playwright-cli-installer/scripts/installer.js init     # Install everything
node skills/playwright-cli-installer/scripts/installer.js update   # Update to latest
node skills/playwright-cli-installer/scripts/installer.js delete   # Remove skill files
node skills/playwright-cli-installer/scripts/installer.js status   # Show install state
```

The script requires only Node.js, npm, and git — all already required by CodeArts. Works on Windows, Linux, and macOS.

## Commands

### `init` — Install

Performs the full one-click install:

1. **Skill files**: `npx skills add https://github.com/microsoft/playwright-cli --skill playwright-cli -a codearts-agent --copy -y`
2. **CLI binary**: `npm install -g @playwright/cli@latest` (skipped if already installed)
3. **Chromium browser**: `playwright-cli install-browser chromium`
4. **Dry-run check**: verifies browser installation + functional open/close test

```bash
node scripts/installer.js init              # auto-detect scope (project or user)
node scripts/installer.js init --project    # install to current project
node scripts/installer.js init --user       # install to ~/.codeartsdoer/
```

### `update` — Update to Latest

Re-installs skill files, upgrades the CLI, reinstalls the browser, and re-runs the dry-run check.

```bash
node scripts/installer.js update
```

### `delete` — Uninstall Skill Files

Removes the skill files via `npx skills remove`. The `@playwright/cli` package and chromium browser are global and are **not** removed (they may be used by other projects).

```bash
node scripts/installer.js delete
```

### `status` — Show State

Reports whether skill files, CLI binary, and chromium browser are installed.

```bash
node scripts/installer.js status
```

## Scope Selection

| Flag | Scope | Skills Path |
|------|-------|-------------|
| `--project` | Single project | `<project>/.codeartsdoer/skills/` |
| `--user` | All projects | `~/.codeartsdoer/skills/` |
| _(omit)_ | Auto-detect | Project if `.codeartsdoer/` exists in cwd, else user |

## What Gets Installed

| Component | Location | Global? |
|-----------|----------|---------|
| Skill files | `<scope>/.codeartsdoer/skills/playwright-cli/` | No (per-scope) |
| CLI binary | npm global bin (`playwright-cli` command) | Yes |
| Chromium browser | `~/Library/Caches/ms-playwright/` (macOS) / `~/.cache/ms-playwright/` (Linux) / `%LOCALAPPDATA%\ms-playwright\` (Windows) | Yes |

## Important Notes

- **Browser version**: `playwright-cli` bundles its own `playwright-core`. Always install browsers via `playwright-cli install-browser chromium`, **not** `npx playwright install chromium` — the versions may differ.
- **Windows PATH**: After `npm install -g`, if `playwright-cli` is not found, open a new terminal or use `npx playwright-cli` as a fallback.
- **Dry-run check**: The installer runs `playwright-cli install-browser --dry-run` and a functional open/close test to verify the installation.
- **ALSO, YOU CAN USE NATURAL LANGUAGE TO LET THIS SKILL TO INSTALL/UPDATE/DELETE playwright-cli for you.**

## After Installation

Restart CodeArts. Verify by asking: "Open https://example.com with playwright-cli and take a snapshot".