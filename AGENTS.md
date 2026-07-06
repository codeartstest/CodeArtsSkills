# AGENTS.md

## 1. Project Overview

A collection of custom skills for the Huawei Cloud CodeArts Agent coding assistant. Skills are consumed at runtime by the CodeArts plugin — there is no build, test, or lint pipeline at the repo level. Skills fall into two categories:

- **Installer skills** — bootstrap third-party frameworks or MCP servers into a CodeArts project/user scope (`superpowers-installer`, `office-mcp-installer`).
- **Evaluation skills** — score and compare code-agent implementations (`codearena-cn`, `codearena-en`).

Per-skill usage, commands, and installation instructions live in `README.md`. This file describes repo-level conventions and contributor process only.

## 2. Goals

1. **Reusable, self-contained skills** — each skill carries its own `scripts/`, `references/`, and `assets/` with no cross-skill runtime dependencies.
2. **Cross-platform by default** — every skill must work on Windows, Linux, and macOS.
3. **Every installer supports install, update, and delete** — `init`, `update`, `delete` are mandatory; clean uninstall must leave no residue.
4. **Zero-dependency installers** — installer scripts use only Node.js built-ins (`fs`, `path`, `os`, `child_process`, `crypto`); no npm dependencies.

## 3. Architecture

Each skill lives under `skills/<skill-name>/` and follows this convention:

```
skills/<skill-name>/
├── SKILL.md          # YAML frontmatter + Markdown instructions (required entrypoint)
├── scripts/          # Executable logic (Node.js .js/.mjs, shell .sh)
├── references/       # Reference docs consumed by the skill at runtime
└── assets/           # Static assets (manifests, templates)
```

- SKILL.md is the runtime entrypoint — its YAML frontmatter must include `name` and `description`.
- Installer skills expose a `scripts/installer.js` entrypoint with a `init|update|delete` command interface.
- Installers track installed files via a manifest so `delete` can cleanly reverse `init`.
- Skills are self-contained: a skill's scripts/references/assets must not import from another skill.

## 4. Repository Layout

```
CodeArtsSkills/
├── AGENTS.md              # This file — repo conventions & contributor process
├── README.md              # User-facing skill docs (per-skill usage/commands)
├── skills-lock.json       # Lock file for externally-sourced skills
├── LICENSE                # MIT
├── skills/                # All skill sources (self-contained)
│   ├── superpowers-installer/
│   ├── office-mcp-installer/
│   ├── codearena-cn/
│   └── codearena-en/
└── .codeartsdoer/         # CodeArts runtime config (gitignored; do not restructure)
    ├── rule/metadata.properties
    ├── skills/ProjectSkillStatus.txt
    ├── mcp/mcp_settings.json
    └── package.json
```

`.codeartsdoer/` is CodeArts runtime config — never restructure it. Its `.gitignore` ignores all contents (`*`), so it appears empty in git by design.

## 5. Development Workflow

- **Branch per change** — create a feature branch, open a PR to merge.
- **codearena-cn / codearena-en are localized mirrors** — they share file layout but differ in localized text (UI selectors, button regexes, all `references/*.md`, `SKILL.md`). Mirror *structural/mechanic* changes across both; never overwrite localized text.
- **Manually test installers on all three platforms** (Windows, Linux, macOS) before merge.
- **Update `README.md`** for any user-facing change (new skill, new command, changed flags).
- **Keep skills self-contained** — do not introduce imports between skills.

## 6. Coding Rules

- **kebab-case** for skill names and filenames (e.g., `office-mcp-installer`).
- **Node.js first** for installer logic — pure Node.js (CommonJS or ESM) using only built-ins; never shell-only installers.
- **Shell scripts (`.sh`)** are permitted for tooling helpers but must use `#!/usr/bin/env bash` and stay POSIX-portable; note any platform limitations in the skill.
- **Cross-platform paths** — always use `path.join()`, `os.homedir()`, `os.tmpdir()`; normalize `\r\n` and convert to POSIX paths when writing config files (e.g., `mcp_settings.json`).
- **No comments** unless explaining a non-obvious decision.
- **No secrets** in source — installed config may contain machine-specific absolute paths but never credentials.

## 7. Technology Constraints

- **No repo-level build/test/lint pipeline** — there is no root `package.json`, no CI config, no eslint/jest config.
- **Node.js ≥ 18** required (CodeArts already requires Node.js and git).
- **Installer scripts**: zero npm dependencies; Node built-ins only.
- **Installed artifacts** (e.g., the office-mcp MCP server) may carry their own runtime dependencies under `.codeartsdoer/` — those belong to the upstream package, not this repo.
- If scripts depend on externally-installed tools (semgrep, dependency-cruiser, eslint, jscpd, license-checker, cloc, Playwright) that should be auto-installed at runtime.

## 8. Testing Strategy

There is no automated unit-test suite. Tests are implemented as **end-to-end install verification** using the real installation path:

1. Install the skill via `npx skills add https://github.com/codeartsagent/codeartsskills --skill <skill-name>`.
2. Run the installer's `init`, then `update`, then `delete` and verify each succeeds.
3. Confirm `delete` leaves no residue — no orphan files, no stale entries in `ProjectSkillStatus.txt` / `mcp_settings.json`.
4. Repeat on Windows, Linux, and macOS.

For installer skills that expose a `status` command (e.g., `office-mcp-installer`), verify it exits `0` after `init` and reports incomplete after `delete`.

The `codearena` `scripts/templates/` are per-round harness skeletons generated at evaluation runtime — they are not standalone tests.

## 9. Build & Commands

There is no build step. End users install skills with:

```bash
npx skills add https://github.com/codeartsagent/codeartsskills --skill <skill-name> [-a codearts-agent]
```

Restart CodeArts after installation.

Installer skills expose (run from the skill's `scripts/` dir):

```bash
node installer.js init    [--project|--user]   # install
node installer.js update  [--project|--user]   # update
node installer.js delete  [--project|--user]   # uninstall
```

- `--project` → `<cwd>/.codeartsdoer/skills/`
- `--user` → `~/.codeartsdoer/skills/`
- Omit flag → auto-detect (project if `.codeartsdoer/` exists in cwd, else user)

Some installers are project-scope only (e.g., `office-mcp-installer`) and do not accept `--user`. See `README.md` for each skill's exact command set and flags.

## 10. Definition of Done

A skill change is complete when:

- [ ] Installer runs on Windows, Linux, and macOS.
- [ ] `init`, `update`, and `delete` all work (plus `status` where applicable).
- [ ] `delete` leaves no residue — no orphan files, no stale status/config entries.
- [ ] SKILL.md frontmatter is valid (`name` + `description`).
- [ ] `README.md` is updated for any user-facing change.
- [ ] codearena-cn/en pair kept in structural parity (localized text preserved).
- [ ] Verified via the end-to-end install path (`npx skills add` → init/update/delete).

## 11. Safety Rules

- **Never restructure `.codeartsdoer/`** — it is CodeArts runtime config with a self-managed `.gitignore`.
- **Never commit secrets or credentials.** Installed config may hold machine-specific absolute paths but never auth tokens/keys.
- **Never force-push to `main`.**
- **Installer `delete` must be reversible-safe** — only remove files the installer itself tracked (via manifest); never delete user-created files.
- **Do not introduce runtime dependencies between skills** — each skill is self-contained.

## 12. Common Tasks

- **Add a new skill**: create `skills/<name>/` with `SKILL.md` (+ `scripts/`, `references/`, `assets/` as needed); add a section to `README.md`; if it's an installer, implement `init`/`update`/`delete`.
- **Update an installer**: edit `scripts/installer.js`; test init/update/delete on all platforms; keep manifest logic in sync.
- **Update codearena**: make the structural change in both `codearena-cn` and `codearena-en`; keep localized text distinct.
- **Document a skill**: edit `README.md`, not `AGENTS.md` (AGENTS.md is repo conventions only).

## 13. Decision Principles

- **Self-contained over shared** — prefer duplicating small helpers across skills over cross-skill imports.
- **Cross-platform first** — if a feature can't run on all three OSes, document the limitation explicitly rather than silently breaking.
- **Minimal dependencies** — Node built-ins before npm packages; npm packages only for installed runtime artifacts.
- **Reversibility** — every `init` must be cleanly reversible by `delete` (track via manifest).
- **README for users, AGENTS.md for contributors** — per-skill details live in README; repo conventions live here.

## 14. FAQ / Pitfalls

- **"codearena-cn and codearena-en are identical"** — No. They share file layout but differ in 8 files (localized UI selectors, button regexes, `tools-README.md`, all `references/*.md`, `SKILL.md`). Mirror structural changes only, never localized text.
- **office-mcp-installer is project-scope only** — it errors if no `.codeartsdoer/` is found in cwd; there is no `--user` fallback.
- **Shell scripts won't run on Windows** — `.sh` files need Git Bash or WSL. Prefer Node.js for cross-platform installer logic.
- **`mcp_settings.json` contains absolute paths** — machine-specific; never copy between machines. The installer regenerates it.
- **`.codeartsdoer/` looks empty in git** — its `.gitignore` ignores `*`; this is intentional, not a mistake.
- **office-mcp-installer must stay documented in README** — it was previously missing; always keep README in sync with installed skills.
