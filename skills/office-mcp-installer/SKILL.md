---
name: office-mcp-installer
description: "One-click installer for the office-mcp MCP server (39 Office document tools: Word/Excel/PPT/PDF/OCR) into the current CodeArts project. Project-scope only — installs the MCP server, registers it in the project MCP config, and installs the office-mcp skill definition. Use when the user wants to install, update, or uninstall office-mcp for a CodeArts project. Triggers on: install office-mcp, setup office-mcp, add office mcp, 一键安装office-mcp, 安装office文档工具, office文档MCP."
---

# Office-MCP Installer

One-click installer for the [office-mcp](https://github.com/claude-office-skills/skills/tree/main/mcp-servers/office-mcp) MCP server — 39 tools for Word, Excel, PowerPoint, PDF, and OCR operations.

Installs to the **current project only** (project-scope). No user-level/global option.

## Quick Start

```bash
node scripts/installer.js init     # Install office-mcp into this project
node scripts/installer.js update   # Rebuild from latest source
node scripts/installer.js delete   # Completely uninstall office-mcp
node scripts/installer.js status   # Show current install state
```

The script requires only Node.js and git — both already required by CodeArts. Works on Windows, Linux, and macOS.

## Commands

### `init` — Install

Performs the full one-click install into the current project:

1. Clones the `claude-office-skills/skills` repo to a temp directory
2. Builds the MCP server (`npm install && npm run build`)
3. Copies the built server to `<project>/.codeartsdoer/mcp/office-mcp/`
4. Removes non-essential files (keeps only `dist/`, `node_modules/`, `package.json`)
5. Installs the `office-mcp` SKILL.md into `<project>/.codeartsdoer/skills/office-mcp/`
6. Registers the skill in `ProjectSkillStatus.txt`
7. Registers the MCP server in `<project>/.codeartsdoer/mcp/mcp_settings.json`

```bash
node scripts/installer.js init
```

### `update` — Update to Latest

Re-clones the latest source, rebuilds the server, overwrites the installed files, and refreshes the SKILL.md. Preserves the MCP config registration.

```bash
node scripts/installer.js update
```

### `delete` — Uninstall

Removes the MCP server directory, deletes the `office-mcp` entry from `mcp_settings.json`, removes the installed skill directory, and clears its entry from `ProjectSkillStatus.txt`. Leaves a 100% clean project.

```bash
node scripts/installer.js delete
```

### `status` — Show State

Reports whether office-mcp is installed, the server path, whether the MCP config entry exists, and the build version.

```bash
node scripts/installer.js status
```

## Project Scope Only

This installer operates exclusively on the current project. It locates the project root by walking up from the current directory until it finds a `.codeartsdoer/` folder. If none is found, it errors out — there is no `--user` fallback.

| Artifact | Project Path |
|----------|--------------|
| MCP server | `<project>/.codeartsdoer/mcp/office-mcp/` |
| MCP config | `<project>/.codeartsdoer/mcp/mcp_settings.json` |
| Skill definition | `<project>/.codeartsdoer/skills/office-mcp/SKILL.md` |
| Skill status | `<project>/.codeartsdoer/skills/ProjectSkillStatus.txt` |

## What Gets Installed

The MCP server directory keeps only runtime-essential files after install:

- `dist/` — compiled JavaScript (the MCP entrypoint)
- `node_modules/` — runtime dependencies (~350 MB)
- `package.json` — package manifest

Source files, docs, test fixtures, lockfiles, and TypeScript config are removed.

## After Installation

Restart CodeArts. The 39 Office tools become available:

- **PDF (10):** extract text/tables, merge, split, compress, watermark, forms, OCR
- **Spreadsheet (7):** read/create Excel, analyze, formulas, charts, pivot tables
- **Document (6):** create/edit Word, templates, merge
- **Conversion (9):** xlsx⇔csv, docx⇔md, json→xlsx, batch convert
- **Presentation (7):** create PPT, extract, Markdown→slides, HTML export

Verify by asking: "Read the Excel file at ./data.xlsx" or "Create a PowerPoint with 5 slides".