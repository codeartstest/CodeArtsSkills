# Implementation Plan: Multi-Tool Selection (Step 0 Enhancement)

> **Status:** Ready for implementation
> **Affects:** `service-onboarding.md`, `mcp-settings.json` template, `ci-cd.yml` template, all 7 agent definition files (including `design-architecture-agent.md`), `SKILL.md`, `pipeline.md`, `skill-registry.json`
> **Principle:** The user has total freedom to select any subset of MCPs, services, and **methodology skills**. No item is mandatory. Built-in utility skills (doc-expert, pptx, data-analysis, frontend-design, i18n-integration, prd, ide-tool) are **always on** and are **never** part of the selection list. The pipeline degrades gracefully — steps that depend on unselected tools are skipped, not errored.

---

## 0. Objective

> **Methodology-first approach:** Methodology skills are grouped by methodology
> (SDD, TDD, DDD). The user selects one or more methodologies, then picks tools
> within each. This drives the **design-architecture agent** (Step 0.DA), which
> classifies tasks, executes the selected methodologies (DDD -> SDD -> TDD), and
> hands off curated context to the implementation pipeline. See
> `references/agents/design-architecture-agent.md`.

Today, Step 0 walks every user through **all 7 onboarding steps (0.1–0.7)** sequentially and unconditionally. This plan adds a **multiselect tool-selection screen** that runs *before* any service onboarding. The user picks any combination of MCPs, services, and methodology skills — including non-contiguous selections (e.g., only items 4, 7, and 15, or 3 through 5, or only item 8, or skip items 1–3 and start from 4). Everything downstream — onboarding questions, config file generation, agent permissions, and pipeline step execution — is conditional on the user's selections.

### Scope Boundary: Built-in vs Selectable

| Category | Examples | Selectable? | Permission Handling |
|----------|----------|-------------|---------------------|
| **Built-in utility skills** | `ide-tool`, `doc-expert`, `pptx`, `data-analysis`, `prd`, `frontend-design`, `i18n-integration` | **No** — always on | Static in agent frontmatter, never touched by this feature |
| **MCP servers** | GitHub, Jira, SonarCloud, Semgrep, JFrog | **Yes** | Conditional in `mcp_settings.json` |
| **Services** | Huawei ECS | **Yes** | Conditional in `.env` |
| **Methodology skills** | Playwright CLI, SDD Toolkit, OpenSpec*, SpecKit*, Postman, Newman, Jest, Pytest, JUnit, Vitest, Context Mapper, EventStorming, Structurizr | **Yes** | Dynamically granted/revoked in agent frontmatter |

*Items marked with * are planned and not yet available — they appear as greyed-out / "coming soon" in the selection list and are included in the catalog for forward-compatibility.*

> **Rule:** The selection list only contains items the user has a real choice about. Built-in utility skills are infrastructure — they're always available to every agent. The user chooses which **methodologies and integrations** they want.

---

## 1. Tool Catalog (The Multiselect List)

This is the definitive list of selectable items. Each item has a **stable ID** (used in the selection persistence file) and a **display number** (shown to the user). The display number never changes; the stable ID is used in code/config.

> **The catalog is extensible.** New methodology skills are added by appending to Group C and updating the skill registry in §8. The selection UI and config generation pick up new entries automatically — no structural changes needed.

### Group A — MCP Servers (require credential collection)

| # | Display Name | Stable ID | Type | Onboarding Step | Config Outputs | Pipeline Steps That Use It |
|---|--------------|-----------|------|-----------------|-----------------|---------------------------|
| 1 | GitHub | `github` | MCP | 0.1 (includes Option A/B) | `mcp_settings.json` → `github`, `.env` → `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_PAT` | 0(B), 1, 3, 4, 5, 6, 7, 9 |
| 2 | Jira (Atlassian) | `jira` | MCP | 0.2 | `mcp_settings.json` → `atlassian-rovo-mcp`, `.env` → `JIRA_*` | 1, 1b, 2, 3, 4, 5, 6, 7, 8, 9 |
| 3 | SonarCloud | `sonarcloud` | MCP | 0.3 | `mcp_settings.json` → `sonarqube`, `sonar-project.properties`, `.env` → `SONAR_*`, GitHub secret `SONAR_TOKEN` | 6 (QG check), 7 |
| 4 | Semgrep | `semgrep` | MCP | 0.4 | `mcp_settings.json` → `semgrep`, `.env` → `SEMGREP_*` | 3 (pre-scan), 4 (optional re-verify) |
| 5 | JFrog Artifactory | `jfrog` | Service (REST API) | 0.5 | `.env` → `JFROG_*`, GitHub secrets/vars | 6 (artifact upload + verify), 8 (docker pull) |

### Group B — Services (config only, no MCP server)

| # | Display Name | Stable ID | Type | Onboarding Step | Config Outputs | Pipeline Steps That Use It |
|---|--------------|-----------|------|-----------------|-----------------|---------------------------|
| 6 | Huawei Cloud ECS | `huawei-ecs` | Service (SSH) | 0.6 | `.env` → `HUAWEI_ECS_*`, `add_ssh_key.py` | 8 (deployment) |

### Group C — Methodology Skills (selectable, extensible)

These are skills that represent a **workflow or methodology choice**. The user decides which methodology to adopt. Built-in utility skills (doc-expert, pptx, etc.) are excluded — they are always available.

| # | Display Name | Stable ID | Methodology | Test Layer | Status | Frontmatter Keys Granted | Pipeline Steps | Granted To Agents |
|---|--------------|-----------|-------------|------------|--------|--------------------------|----------------|-------------------|
| 7 | Playwright CLI | `playwright` | TDD | E2E | ✅ Available | `playwright-cli` | 5 (E2E), 0.DA | Tester |
| 8 | SDD Toolkit (Huawei Built-in) | `sdd` | SDD | - | ✅ Available | `creating-sdd-directory`, `managing-spec-document`, `managing-design-document`, `managing-tasks-document` | 2 (SDD), 0.DA | PM, Backend, Frontend, Design-Architecture |
| 9 | OpenSpec | `openspec` | SDD | - | 🔜 Planned | `openspec` | 2, 0.DA | PM, Backend, Frontend, Design-Architecture |

| 12 | Postman Skill | `postman` | TDD | API | ✅ Available | `postman` | 3 (API tests), 0.DA | Backend, Design-Architecture |
| 13 | Newman | `newman` | TDD | API | ✅ Available | `newman` | 3, 6 (CI) | Backend |
| 14 | Jest | `jest` | TDD | Unit | ✅ Available | `jest` | 3 (unit tests) | Backend, Frontend |
| 15 | Pytest | `pytest` | TDD | Unit | ✅ Available | `pytest` | 3 (unit tests) | Backend |
| 16 | JUnit | `junit` | TDD | Unit | ✅ Available | `junit` | 3 (unit tests) | Backend |
| 17 | Vitest | `vitest` | TDD | Unit | ✅ Available | `vitest` | 3 (unit tests) | Backend, Frontend |
| 18 | Context Mapper | `context-mapper` | DDD | - | ✅ Available | `context-mapper` | 0.DA | Design-Architecture |
| 19 | EventStorming | `eventstorming` | DDD | - | ✅ Available | `eventstorming` | 0.DA | Design-Architecture |
| 20 | Structurizr | `structurizr` | DDD | - | ✅ Available | `structurizr` | 0.DA | Design-Architecture |

#### Methodology grouping and multi-tool rules

Tools are grouped by methodology. The user may select multiple tools within a
methodology. The rules differ per methodology:

| Methodology | Multi-tool rule | Primary vs Supplementary |
|-------------|----------------|--------------------------|
| **SDD** (items 8, 9, 11) | First selected tool = PRIMARY (drives the workflow); others = SUPPLEMENTARY | Supplementary tools produce artifacts FROM the primary tool's approved output, never a second independent workflow |
| **TDD** (items 7, 12-17) | NO primary/supplementary - each tool owns its OWN test layer | All selected layers must pass. Never swap tools across layers or languages |
| **DDD** (items 18-20) | First selected tool = PRIMARY (approval artifact); others = SUPPLEMENTARY | Design the domain model ONCE, then re-express in each supplementary format |

**TDD layer mapping:**

| Test layer | Tools (any one or more) | Owner agent | Pipeline step |
|------------|------------------------|-------------|---------------|
| Unit | Jest (14), Vitest (17), Pytest (15), JUnit (16) | Backend / Frontend | Step 3 |
| API | Postman Skill (12), Newman (13) | Backend | Step 3 (+ CI in Step 6) |
| E2E | Playwright CLI (7) | Tester | Step 5 |

> If both Postman and Newman are selected, Newman runs the SAME collection
> (exported from Postman), never a separate one.

> **Planned items (9)** are shown in the selection list as "Coming soon" and cannot be selected yet. It is pre-registered so that when the skill becomes available, it only needs to be flipped from `planned` → `available` in the skill registry (§8) — no structural changes required.

> **Extensibility:** To add a new methodology skill, see §8 (Skill Registry). > **Planned item (9):** OpenSpec
> are shown in the selection list as "Coming soon" and cannot be selected yet.
> All other methodology tools (7, 8, 11 through 19) are available now. Planned
> items are pre-registered so that when a skill becomes available, it only needs
> to be flipped from `planned` to `available` in the skill registry (section 8).

> **Extensibility:** To add a new methodology skill, see section 8 (Skill
> Registry). The selection UI, config generation, and agent permission logic
> all read from the registry, so adding an entry there is the only change
> needed.

---

## 2. Selection Flow (When & How)

### Insertion Point

The tool selection runs as **new sub-step 0.0.5**, inserted into the existing onboarding sequence:

```
0.0   Auto-provision agent definition files (7 agents)  (existing + design-architecture)

0.0.5 MULTI-TOOL SELECTION                              (methodology-grouped)
0.1   GitHub onboarding (if selected)                 (conditional)
0.2   Jira onboarding (if selected)                   (conditional)
0.3   SonarCloud onboarding (if selected)             (conditional)
0.4   Semgrep onboarding (if selected)                (conditional)
0.5   JFrog onboarding (if selected)                  (conditional)
0.6   Huawei ECS onboarding (if selected)             (conditional)
0.7   Playwright install (if selected)                (conditional)
0.8   Methodology tool setup (SDD/TDD/DDD tools)      (conditional, NEW)
---   Conditional config generation                   (conditional)
0.DA  Design-architecture agent (classify + research  (conditional, NEW)
      + methodology execution + handoff)
---   Proceed to pipeline                             (conditional steps)
```

### Questions to Present

Present **four grouped multiselect questions** via the `question` tool (keeping each list scannable). All use `multiple: true`.

> The implementer MAY collapse Questions 2-4 into a single question if the platform UI handles it well. Three separate questions are recommended for readability and clear methodology grouping.

**Question 1 — MCP Servers & Services:**

```
header: "Select Integrations"
question: "Which MCP servers and services do you want to configure? Select any combination. Unselected items will be skipped — the pipeline adapts automatically."
multiple: true
options:
  - label: "GitHub"
    description: "Repo access, branches, PRs. Needed for code steps."
  - label: "Jira (Atlassian)"
    description: "Task tracking, sprints, inter-agent messaging."
  - label: "SonarCloud"
    description: "Code quality gate, coverage, security ratings."
  - label: "Semgrep"
    description: "Local static analysis and security scanning."
  - label: "JFrog Artifactory"
    description: "Docker image storage and artifact verification."
  - label: "Huawei Cloud ECS"
    description: "Deployment target (SSH-based, Docker runtime)."
```

**Question 2 — SDD (Spec-Driven Development):**

```
header: "SDD — Spec-Driven Development"
question: "Which SDD tools do you want enabled? SDD defines how requirements and design are specified before implementation. First selected tool becomes PRIMARY; others are SUPPLEMENTARY. Built-in utility skills are always available — no need to select them."
multiple: true
options:
  - label: "SDD Toolkit (Huawei Built-in)"
    description: "Spec-driven dev: spec, design, tasks docs (Step 2 + 0.DA)."
  - label: "OpenSpec (coming soon)"
    description: "Alternative specification methodology. Not yet available."
  - label: "None"
    description: "No SDD tools. Built-in utility skills remain active."
```

**Question 3 — TDD (Test-Driven Development):**

```
header: "TDD — Test-Driven Development"
question: "Which TDD tools do you want enabled? Each tool owns its own test layer (E2E, API, Unit). All selected layers must pass. Built-in utility skills are always available — no need to select them."
multiple: true
options:
  - label: "Playwright CLI (E2E)"
    description: "E2E browser testing (Tester Agent, Step 5)."
  - label: "Postman Skill (API)"
    description: "API testing via Postman MCP (Backend Agent, Step 3). Monitors run from Postman cloud — cannot reach localhost APIs."
  - label: "Newman (API)"
    description: "API testing - Postman collections via CLI/CI. Required for testing localhost APIs and CI pipelines. Select WITH Postman for full coverage."
  - label: "Jest (Unit JS/TS)"
    description: "Unit testing for JavaScript/TypeScript."
  - label: "Pytest (Unit Python)"
    description: "Unit testing for Python."
  - label: "JUnit (Unit Java)"
    description: "Unit testing for Java (JUnit 5)."
  - label: "Vitest (Unit JS/TS Vite)"
    description: "Unit testing for Vite-based JS/TS projects."
```

**Question 4 — DDD (Domain-Driven Design):**

```
header: "DDD — Domain-Driven Design"
question: "Which DDD tools do you want enabled? First selected tool becomes PRIMARY (approval artifact); others are SUPPLEMENTARY. The domain model is designed ONCE, then re-expressed in each supplementary format. Built-in utility skills are always available — no need to select them."
multiple: true
options:
  - label: "Context Mapper"
    description: "DSL for bounded contexts, context maps, aggregates."
  - label: "EventStorming"
    description: "Workshop-style domain discovery on a timeline board."
  - label: "Structurizr"
    description: "C4-model architecture DSL with diagram views."
```

> **Planned items:** If the user attempts to select a "coming soon" item, the agent responds: "OpenSpec is not yet available. It will be selectable once the skill is released. Please choose from available skills."

### Selection Rules

1. **No defaults / no pre-selection.** Every item starts unchecked. The user must actively choose.
2. **No mandatory items.** Even GitHub is optional. If the user selects nothing, the agent proceeds with zero external tools (local-only mode) and tells the user which pipeline steps are inactive.
3. **Non-contiguous selection is valid.** The user may pick only item 4, or items 3 through 5, or only item 8, or skip 1 through 3 and select 4 through 20. Any subset is accepted.
4. **"Type your own answer" is ignored** for these questions — they are pure pick-lists. The implementer should validate that the user only selected from the offered options.
5. **Built-in utility skills are not mentioned** in the selection. They are always on. Do not ask the user about doc-expert, pptx, data-analysis, frontend-design, i18n-integration, prd, or ide-tool.

### Post-Selection Summary

Immediately after the user confirms, the PM agent prints a summary table and **dependency warnings** (see §5). Example:

```
SELECTED:
  ✅ 4. Semgrep
  ✅ 7. Playwright CLI

SKIPPED:
  ⬜ 1. GitHub, 2. Jira, 3. SonarCloud, 5. JFrog, 6. Huawei ECS
  ⬜ 8. SDD Toolkit (no methodology skill selected)

ALWAYS ON (not selectable):
  🔧 doc-expert, pptx, data-analysis, prd, frontend-design, i18n-integration, ide-tool

PIPELINE IMPACT:
  • Steps 1, 1b, 2 (Jira sprint/tasks) — SKIPPED (no Jira)
  • Step 2 (SDD setup) — SKIPPED (no SDD Toolkit)
  • Step 3 (Dev + Semgrep pre-scan) — partial (Semgrep only, no GitHub PRs)
  • Step 4 (Code Review) — SKIPPED (no GitHub)
  • Step 5 (E2E) — active (Playwright selected)
  • Steps 6–8 (CI/CD, Release, Deploy) — SKIPPED
  • Step 9 (Report) — active (doc-expert always on; no Jira metrics)

  ⚠ Playwright E2E normally checks out a feature branch from GitHub.
    Without GitHub, the Tester Agent will run tests against the local
    working directory only.

  ⚠ Postman monitors run from Postman's cloud — they CANNOT reach
    localhost or internal APIs. To test local backend APIs in Step 3,
    select Newman alongside Postman (Newman runs locally and in CI).
    Postman without Newman = cloud-only API testing.
```

The user is then asked: **"Proceed with these selections?"** (Yes / No — re-select). This gives a final confirmation gate before onboarding begins.

---

## 3. Selection Persistence

### File: `.codeartsdoer/tool-selections.json`

Write this file immediately after the user confirms. Every agent and every config-generation step reads it.

```json
{
  "selectedAt": "2026-07-21T10:30:00Z",
  "version": 2,
  "methodologies": {
    "sdd": true,
    "tdd": true,
    "ddd": false
  },
  "tools": {
    "github": false,
    "jira": false,
    "sonarcloud": false,
    "semgrep": true,
    "jfrog": false,
    "huawei-ecs": false,
    "playwright": true,
    "sdd": true,
    "openspec": false,

    "postman": false,
    "newman": false,
    "jest": false,
    "pytest": true,
    "junit": false,
    "vitest": false,
    "context-mapper": false,
    "eventstorming": false,
    "structurizr": false
  }
}
```

> The `methodologies` block is a convenience summary derived from the tool
> selections. It is computed as: SDD active if any of `sdd`, `openspec` is true; TDD active if any of `playwright`, `postman`, `newman`,
> `jest`, `pytest`, `junit`, `vitest` is true; DDD active if any of
> `context-mapper`, `eventstorming`, `structurizr` is true. The
> design-architecture agent reads this to know which methodologies to execute.

### Reading Conventions

- All agents read this file at the **start of their first step** to determine which tools are active.
- Helper function (pseudocode): `isSelected(toolId)` returns `true`/`false`.
- If the file does not exist (e.g., onboarding was done before this feature), treat **all tools as selected** (backward-compatible default = full pipeline).
- This file is **local only** — it contains no secrets but reflects the user's intent. Add to `.gitignore`.

---

## 4. Conditional Onboarding (Only Configure Selected Tools)

After the selection is saved, the PM agent walks through onboarding **only for selected tools**, in catalog order (1 to 20). For each item: → 11). For each item:

| If Selected | Action |
|-------------|--------|
| Yes | Run the existing onboarding sub-step (0.1–0.7) as documented, collect credentials, write config |
| No | Skip the sub-step entirely — do NOT ask any questions, do NOT write any config for it |

### Special Case: GitHub (item 1)

The Option A/B question ("existing repo or new repo") is currently bundled into 0.1. Two scenarios:

- **GitHub IS selected:** Run 0.1 as-is (including Option A/B). The GitHub MCP is configured and the repo is accessed/created via MCP.
- **GitHub is NOT selected:** Skip 0.1 entirely. The pipeline operates on the **local working directory** as the repo. No GitHub MCP is configured. The Option A/B question is skipped (there is no remote repo). All downstream agents use local file paths instead of GitHub MCP calls. The agent notes: "GitHub not selected — pipeline runs in local-only mode. No PRs, no remote branches, no GitHub Actions CI/CD."

### Special Case: Methodology Skills (items 7 to 20)

- **Playwright (item 7) selected:** Run 0.7 install procedure as-is (install skill via `npx skills add`, fix junctions, register in `ProjectSkillStatus.txt`).
- **SDD Toolkit (item 8) selected:** No install needed - the SDD skills (`creating-sdd-directory`, `managing-spec/design/tasks-document`) are built-in system skills. Selection means: grant the permission in agent frontmatter (section 6.5) and run SDD in Step 2 and Step 0.DA.
- **SDD Toolkit NOT selected:** Strip the SDD skill permissions from agent frontmatter. Step 2 skips SDD directory creation and proceeds with a plain task list.
- **OpenSpec / SpecKit (items 9, 10):** Currently `planned` - cannot be selected. When they become `available`, the onboarding step for each is defined in the skill registry (section 8).
- **TDD tools (items 12 to 17) selected:** Run Step 0.8 (methodology tool setup) for each selected TDD tool. This verifies, installs, connects, and smoke-tests each tool. See `service-onboarding.md` Step 0.8 for the full procedure.
- **DDD tools (items 18 to 20) selected:** Run Step 0.8 for each selected DDD tool. DDD tools produce text/DSL output, so most require no installation. Optional rendering setup (Context Mapper VS Code extension, Structurizr CLI) is documented in Step 0.8.
- **Any methodology skill NOT selected:** Its permission is not granted in agent frontmatter. See section 6.5.

> **Built-in utility skills** (doc-expert, pptx, data-analysis, frontend-design, i18n-integration, prd) are **never installed/uninstalled or permission-toggled** by this feature. They remain as-is in every agent's frontmatter. The post-processing script (§6.5) only touches methodology skill entries, never built-in ones.

---

## 5. Dependency Warnings (Soft, Non-Blocking)

Dependencies are **warnings only** — the user's freedom is absolute. After selection, the PM agent checks for these patterns and surfaces warnings in the post-selection summary (§2). The user can proceed anyway.

| User Selected | But NOT Selected | Warning |
|---------------|------------------|---------|
| SonarCloud | GitHub | "SonarCloud CI/CD stage needs GitHub Actions. Without GitHub, the SonarCloud scan won't run in CI. You can still use the SonarCloud MCP for manual QG checks." |
| JFrog | GitHub | "JFrog artifact upload happens in GitHub Actions. Without GitHub, Docker images won't be pushed to JFrog via CI. Manual `docker push` would be needed." |
| JFrog | Huawei ECS | "Deployment (Step 8) pulls Docker images from JFrog. Without JFrog, the ECS deployment has no image source. Select JFrog if you want automated deployment." |
| Huawei ECS | JFrog | "ECS deployment pulls from JFrog registry. Without JFrog, there's no Docker image to deploy. Deployment step will be skipped or require a manual image." |
| Playwright | GitHub | "E2E tests normally checkout a feature branch from GitHub. Without GitHub, tests run against the local working directory only — no branch isolation." |
| Jira | GitHub | "Jira tasks are linked to GitHub PRs/commits. Without GitHub, Jira-GitHub auto-linking won't work, but Jira task tracking still functions standalone." |
| SDD Toolkit | Jira | "SDD docs are tied to Jira tasks. Without Jira, SDD directories will be created from the PRD/project prompt directly, not linked to Jira issue keys." |
| Postman Skill | Newman | "Postman monitors run from Postman's cloud — they CANNOT reach localhost APIs. Without Newman, the Backend Agent cannot test local backend APIs during Step 3 (only deployed/staging APIs). Newman also runs in CI/CD pipelines (Step 6). Select Newman alongside Postman for full local + CI API test coverage." |
| Newman | Postman Skill | "Newman runs Postman collection JSON files. Without the Postman Skill, you must manually export and maintain the collection JSON. Select Postman Skill for MCP-driven collection management." |
| DDD tools (18-20) | SDD Toolkit | "DDD domain models feed into the SDD spec. Without SDD, the domain model will be used directly for implementation without a formal spec document." |
| TDD unit tools (14-17) | SDD Toolkit | "TDD tests are planned from acceptance criteria. Without SDD, acceptance criteria come from the lightweight mini brief or PRD instead of a formal spec." |
| Any TDD tool | GitHub | "TDD test artifacts (spec files, collections, test results) are normally committed via PRs. Without GitHub, tests run locally but are not version-controlled or shared." |
| Structurizr | (rendering) | "Structurizr DSL output is text. To render diagrams, install structurizr-cli or use structurizr.com. Pushing to structurizr.com requires a workspace ID + API key/secret." |

> **Implementation note:** These warnings are informational. The user can dismiss them and proceed. Do NOT block onboarding.

---

## 6. Conditional Config Generation

After all selected tools are onboarded, generate config files **including only the entries for selected tools**.

### 6.1 `mcp_settings.json`

Build the `mcpServers` object by including **only** the MCP entries for selected MCP items (1–5). Use the existing template blocks, but omit unselected ones.

Example — user selected only Semgrep (4) and Playwright (7, a skill — no MCP entry):

```json
{
  "mcpServers": {
    "semgrep": {
      "command": "<SEMGREP_EXECUTABLE_PATH>",
      "args": ["mcp"],
      "env": {
        "SEMGREP_APP_TOKEN": "<SEMGREP_APP_TOKEN>",
        "PYTHONIOCODING": "utf-8"
      },
      "disabled": false,
      "timeout": 120000
    }
  }
}
```

> If NO MCP servers are selected, write `{"mcpServers": {}}` (empty object, valid JSON).

### 6.2 `.env`

Include **only** the environment variable blocks for selected services. Group by service and omit unselected groups entirely.

| Service | Env Vars (include only if selected) |
|---------|--------------------------------------|
| GitHub (1) | `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_PAT` |
| Jira (2) | `JIRA_CLOUD_ID`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`, `JIRA_MCP_AUTH` |
| SonarCloud (3) | `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`, `SONAR_TOKEN` |
| Semgrep (4) | `SEMGREP_APP_TOKEN`, `SEMGREP_EXECUTABLE_PATH` |
| JFrog (5) | `JFROG_PLATFORM_URL`, `JFROG_DOCKER_REGISTRY`, `JFROG_REPO_KEY`, `JFROG_USERNAME`, `JFROG_PASSWORD`, `JFROG_PROJECT` |
| Huawei ECS (6) | `HUAWEI_ECS_HOST`, `HUAWEI_ECS_USER`, `HUAWEI_ECS_SSH_KEY_PATH`, `HUAWEI_ECS_APP_DIR`, `HUAWEI_ECS_DOCKER_REGISTRY` |

### 6.3 `ci-cd.yml`

Generate the GitHub Actions workflow with **only the stages for selected tools**. The build stage is always included (if GitHub is selected, since CI/CD runs on GitHub Actions). Conditional stages:

| Stage | Included If Selected | Excluded If Not |
|-------|---------------------|-----------------|
| Build (install + compile) | Always (when GitHub selected) | Omitted entirely if GitHub not selected (no CI/CD) |
| Sonar scan (test + coverage) | SonarCloud (3) | Stage removed; no `sonar-project.properties` |
| SonarCloud QG check | SonarCloud (3) | Stage removed |
| Deploy to JFrog | JFrog (5) | Stage removed |
| Verify JFrog | JFrog (5) | Stage removed |

> If GitHub is not selected, **do not generate `ci-cd.yml` at all** — there is no GitHub Actions runtime.
> If SonarCloud is not selected, **do not generate `sonar-project.properties`**.

### 6.4 `set-secrets.js`

Only include secrets/variables for selected services:

| Secret/Variable | Included If Selected |
|-----------------|---------------------|
| `SONAR_TOKEN` (secret) | SonarCloud (3) |
| `JFROG_PASSWORD` (secret) | JFrog (5) |
| `JFROG_PLATFORM_URL` (var) | JFrog (5) |
| `JFROG_DOCKER_REGISTRY` (var) | JFrog (5) |
| `JFROG_USERNAME` (var) | JFrog (5) |
| `JFROG_PROJECT` (var) | JFrog (5) |

### 6.5 Agent Definition Files — Dynamic Permission Grants (Methodology Skills Only)

After the 6 agent files are copied to `.codeartsdoer/agents/` in step 0.0, run a **post-processing pass** that adjusts each agent's `permission.skill` block — but **only for methodology skills (Group C)**. Built-in utility skills are never touched.

**What stays untouched (always-on baseline):**

Every agent keeps these entries regardless of selection:

```yaml
permission:
  skill:
    '*': deny
    ide-tool: allow          # always
    doc-expert: allow        # always (PM)
    pptx: allow              # always (PM)
    data-analysis: allow     # always (PM)
    prd: allow               # always (PM)
    frontend-design: allow   # always (Frontend)
    i18n-integration: allow  # always (Frontend)
```

> These are the existing entries already present in each agent's frontmatter. The post-processing script **must not remove or modify them**.

**What is dynamically added/removed (methodology skills):**

| Skill (stable ID) | Frontmatter Key(s) | Granted To Agents | Added If Selected |
|-------------------|-------------------|-------------------|-------------------|
| `playwright` (7) | `playwright-cli` | Tester | Yes |
| `sdd` (8) | `creating-sdd-directory`, `managing-spec-document`, `managing-design-document`, `managing-tasks-document` | PM, Backend, Frontend | Yes |
| `openspec` (9) | `openspec` (TBD) | PM, Backend, Frontend | Yes (when available) |


**Mechanism:** For each agent file in `.codeartsdoer/agents/*.md`:

1. Parse the YAML frontmatter (between `---` markers).
2. Identify the agent type (PM, Backend, Frontend, Tester, etc.) from the file name.
3. Read `.codeartsdoer/tool-selections.json`.
4. For each **methodology skill** the user selected, and that is mapped to this agent type (see table above), ensure the corresponding frontmatter key(s) are present with `allow`.
5. For each **methodology skill** the user did NOT select, ensure the corresponding frontmatter key(s) are **absent** (deny-by-default covers them).
6. **Do not touch** any built-in utility skill entries (`ide-tool`, `doc-expert`, `pptx`, `data-analysis`, `prd`, `frontend-design`, `i18n-integration`). They remain exactly as written in the original agent file.
7. Write the file back with the updated frontmatter and unchanged body.

**Example — Tester agent frontmatter after processing (user selected Playwright):**

```yaml
permission:
  skill:
    '*': deny
    ide-tool: allow
    playwright-cli: allow      # added — user selected Playwright
```

**Example — PM agent frontmatter after processing (user did NOT select SDD, did select Playwright):**

```yaml
permission:
  skill:
    '*': deny
    ide-tool: allow
    creating-sdd-directory: allow      # — WAIT, this should be ABSENT if SDD not selected
    managing-design-document: allow    # — ABSENT
    managing-spec-document: allow      # — ABSENT
    managing-tasks-document: allow     # — ABSENT
    doc-expert: allow                  # always (untouched)
    pptx: allow                        # always (untouched)
    data-analysis: allow               # always (untouched)
    prd: allow                         # always (untouched)
```

Correction — the SDD keys would be **removed** (absent) because the user didn't select SDD:

```yaml
permission:
  skill:
    '*': deny
    ide-tool: allow
    doc-expert: allow                  # always (untouched)
    pptx: allow                        # always (untouched)
    data-analysis: allow               # always (untouched)
    prd: allow                         # always (untouched)
    # SDD keys ABSENT — user did not select SDD Toolkit
```

> Note: Playwright is only granted to the Tester agent, not PM — so PM's frontmatter wouldn't have `playwright-cli` regardless.

**Implementation approach:** Use a script (PowerShell on Windows, Bash on macOS/Linux) that:
1. Reads `.codeartsdoer/tool-selections.json`
2. Reads the skill registry (§8) to know which frontmatter keys belong to which methodology skill and which agents
3. For each agent file in `.codeartsdoer/agents/`:
   - Extracts the frontmatter (between `---` markers)
   - Removes any methodology skill keys that are NOT selected (but never touches built-in utility keys)
   - Adds any methodology skill keys that ARE selected and mapped to this agent
   - Writes the file back with the updated frontmatter and unchanged body

---

## 7. Conditional Pipeline Execution

After onboarding, the 9-step pipeline runs with **conditional step behavior**. Each step checks `isSelected(toolId)` and degrades gracefully.

### Step-by-Step Conditional Behavior

| Step | Owner | Conditional Logic |
|------|-------|-------------------|
| **0.DA** (Design) | Design-Architecture | If NO methodology tools selected -> skip entirely (no SDD/TDD/DDD). If SDD tools selected -> run spec creation with GATE. If TDD tools selected -> produce test layer mapping for acceptance criteria. If DDD tools selected -> produce domain model with GATE. Output: CURATED CONTEXT handoff block. See `references/agents/design-architecture-agent.md`. |
| **1** (Requirements) | PM | If `jira` NOT selected → skip Jira task creation; derive tasks from PRD/local only. If `github` NOT selected → skip repo analysis via MCP; analyze local working directory instead. `prd` skill is always available (built-in) — PRD generation always runs. |
| **1b** (Review) | FE/BE | If `jira` NOT selected → skip entirely (no Jira comments to dispatch review through). If `github` NOT selected → review happens via local file diff instead of PR review. |
| **2** (Sprint + SDD) | PM + Dev | If `jira` NOT selected → skip sprint creation (no Jira Agile API). If `sdd` NOT selected → skip SDD directory creation; proceed with plain task list. If a future alternative spec skill (OpenSpec/SpecKit) IS selected → run that methodology instead of SDD. |
| **3** (Dev) | FE/BE | If `github` NOT selected → no feature branches, no PRs; commit directly to local working directory. If `semgrep` NOT selected → skip local Semgrep pre-scan. If TDD unit tools (`jest`/`pytest`/`junit`/`vitest`) selected -> write failing tests first (red-green-refactor cycle). If TDD API tools (`postman`/`newman`) selected -> build API test collection from acceptance criteria. Use test layer mapping from Step 0.DA handoff if available. `frontend-design` and `i18n-integration` are always available (built-in). |
| **4** (Code Review) | Reviewer | If `github` NOT selected → skip entirely (no PRs to review). If `github` IS selected but `semgrep` is not → skip cross-referencing Semgrep pre-scan summary. |
| **5** (E2E) | Tester + PM + Dev | If `playwright` NOT selected → skip E2E testing; the Tester Agent produces a "no E2E coverage" sign-off note. If `github` NOT selected → run tests against local working directory (no branch checkout). PR merge gate: if no GitHub, skip merge step. |
| **6** (CI/CD) | DevOps | If `github` NOT selected → skip entirely (no GitHub Actions). If `sonarcloud` NOT selected → remove Sonar scan + QG stages from pipeline. If `jfrog` NOT selected → remove deploy-to-jfrog + verify-jfrog stages. |
| **7** (Release) | PM + Dev | If `github` NOT selected → skip `dev`→`main` merge (no remote branches). If `jira` NOT selected → skip task status transitions to "Done". |
| **8** (Deploy) | PM + DevOps | If `huawei-ecs` NOT selected → skip entirely (no deployment target). If `jfrog` NOT selected but `huawei-ecs` IS selected → warn that there's no Docker image source; deployment will require a manual image. |
| **9** (Close + Report) | PM + Dev | If `jira` NOT selected → skip sprint close. `doc-expert` and `pptx` are always available (built-in) — report generation always runs, with or without Jira metrics. |

### Human-in-the-Loop Checkpoints (Unchanged)

The existing checkpoints (SDD review in Step 2, release approval in Step 7, deploy authorization in Step 8) remain. The design-architecture agent (Step 0.DA) adds GATEs after the domain model (DDD) and after the spec (SDD) - the user must reply `continue` to advance. Steps that are skipped due to unselected tools simply don't reach their checkpoint.

---

## 8. Skill Registry (Extensibility)

The methodology skill catalog is driven by a **registry** — a single source of truth that the selection UI, config generation, and agent permission logic all read from. Adding a new methodology skill requires **only** updating this registry.

### Registry File: `references/skill-registry.json`

The registry is version 2 (see the actual file for the full JSON). Key changes
from version 1:

- **`methodology`** field added: groups tools as `"SDD"`, `"TDD"`, or `"DDD"`.
- **`testLayer`** field added for TDD tools: `"unit"`, `"api"`, or `"e2e"`.
- **Tool setup metadata** added: `verifyCommand`, `installCommand`, `smokeTest`,
  `credentialsNeeded`, `credentialName`, `credentialSource` - used by Step 0.8
  (methodology tool setup in `service-onboarding.md`).
- **`grantedToAgents`** expanded: `"design-architecture"` added to SDD, TDD-API,
  and DDD tool entries.
- **New tools** registered: Postman (12), Newman (13), Jest (14), Pytest (15),
  JUnit (16), Vitest (17), Context Mapper (18), EventStorming (19),
  Structurizr (20).
- **SDD Toolkit** renamed to "SDD Toolkit (Huawei Built-in)" for clarity.

### How to Register a New Methodology Skill

When a new methodology skill becomes available (e.g., OpenSpec is released):

1. **Add an entry** to `skill-registry.json` with:
   - `id`: stable identifier (e.g., `"openspec"`)
   - `displayNumber`: next available number
   - `displayName`: human-readable name
   - `status`: flip from `"planned"` → `"available"`
   - `type`: `"install"` (needs `npx skills add`) or `"permission"` (built-in, just grant permission)
   - `frontmatterKeys`: the YAML keys to add to agent frontmatter
   - `grantedToAgents`: which agent files get the permission
   - `pipelineSteps`: which pipeline steps use it
   - `onboardingStep`: the onboarding sub-step reference (or `null` if permission-only)
2. **Add `"openspec": false`** to the default `tool-selections.json` template.
3. **No other changes needed** — the selection UI reads the registry to build the question options, the config generator reads it to know which frontmatter keys to add, and the agent permission script reads it to know which agents to update.

> The selection question (§2, Question 2) is built dynamically: iterate `skill-registry.json`, filter `status === "available"` as selectable, `status === "planned"` as "coming soon" display-only.

---

## 9. Re-Onboarding & Selection Changes

If the user re-runs Step 0 (re-onboarding):

1. **Check for existing `tool-selections.json`.** If it exists, read current selections.
2. **Pre-populate the multiselect** with current selections (show which are currently active).
3. **Allow the user to change any selection** — add or remove tools/skills.
4. If a previously-selected **MCP/service** is **removed**: its MCP entry is deleted from `mcp_settings.json`, its env vars are removed from `.env`, its CI/CD stages are removed.
5. If a previously-selected **methodology skill** is **removed**: its frontmatter keys are stripped from agent files (built-in utility skills are never touched).
6. If a previously-unselected item is **added**: run its onboarding sub-step to collect credentials (MCPs/services) or grant permissions (methodology skills).
7. **Rewrite `tool-selections.json`** with the new selection and timestamp.
8. **Re-run agent frontmatter post-processing** (§6.5) — it is idempotent and reads the current selection file.

---

## 10. Files to Modify (Concrete Checklist)

| # | File | Change |
|---|------|--------|
| 1 | `references/setup/service-onboarding.md` | Insert section 0.0.5 (tool selection) after Q0 and before 0.1. Add conditional markers ("if selected") to each of 0.1–0.7. Add post-selection summary and dependency warnings. Add re-onboarding section. Document built-in skills as always-on (not selectable). |
| 2 | `references/templates/mcp-settings.json` | Add a comment block documenting that entries are conditional. The template stays as-is (reference), but the **generation logic** must filter by selection. |
| 3 | `references/templates/ci-cd.yml` | Add `# CONDITIONAL:` comments marking which stages are removable. Document the conditional stage inclusion rules. |
| 4 | `references/templates/env-template.env` | Group env vars by service with `# CONDITIONAL:` markers. |
| 5 | `references/templates/set-secrets.js` | Add conditional logic: only set secrets/vars for selected services. |
| 6 | `references/agents/pm-agent.md` | Document that methodology skill permissions are **dynamically generated** at onboarding time based on `tool-selections.json`. Built-in utility skills are always present and untouched. Add a "Conditional Step Behavior" section (mirror of section 7). |
| 7 | `references/agents/backend-agent.md` | Same conditional documentation. |
| 8 | `references/agents/frontend-agent.md` | Same conditional documentation. |
| 9 | `references/agents/code-reviewer-agent.md` | Document Step 4 skip-if-no-GitHub behavior. |
| 10 | `references/agents/tester-agent.md` | Document Step 5 skip-if-no-Playwright and local-directory fallback. |
| 11 | `references/agents/devops-agent.md` | Document Step 6/8 conditional stage logic. |
| 12 | **NEW** `references/agents/design-architecture-agent.md` | Create the design-architecture agent definition. Document methodology loading, task classification, research, DDD/SDD/TDD execution, and curated handoff. Reference `tool-selections.json` and `skill-registry.json`. |
| 13 | `SKILL.md` | Add "Step 0.0.5 — Tool Selection" to the onboarding prerequisites section. Update the pipeline overview to note conditional steps. Add `tool-selections.json` and `skill-registry.json` to the config files list. Document the built-in vs selectable skill distinction. |
| 13 | `references/pipeline.md` | Add conditional behavior notes to each step's detail section. |
| 14 | **NEW** `.codeartsdoer/tool-selections.json` | Created at runtime during onboarding (not a template — generated from user input). |
| 15 | **NEW** `references/skill-registry.json` | The methodology skill registry (§8). Single source of truth for selectable skills. |
| 16 | **NEW** `references/templates/apply-tool-selections.ps1` | Windows script: reads `tool-selections.json` + `skill-registry.json`, rewrites agent `permission.skill` blocks (methodology skills only, never touches built-in). |
| 17 | **NEW** `references/templates/apply-tool-selections.sh` | macOS/Linux equivalent of the above. |

---

## 11. Implementation Order (For the Implementing Agent)

Execute in this sequence:

1. **Create the skill registry** (`skill-registry.json`) per section 8. Include Playwright, SDD, Postman, Newman, Jest, Pytest, JUnit, Vitest, Context Mapper, EventStorming, Structurizr as `available`; OpenSpec, SpecKit as `planned`.
2. **Create the agent frontmatter post-processing script** (`apply-tool-selections.ps1` / `.sh`) per section 6.5. It must read both `tool-selections.json` and `skill-registry.json`. Test it on a sample agent file — verify it adds selected methodology keys and removes unselected ones while leaving built-in utility keys untouched.
3. **Create the design-architecture agent** (`design-architecture-agent.md`) - the new agent that runs Step 0.DA. It loads selections, classifies tasks, does research, executes DDD/SDD/TDD, and hands off curated context.
4. **Update `service-onboarding.md`** — insert section 0.0.5 (the two multiselect questions, post-selection summary, dependency warnings), add "if selected" conditional markers to 0.1 through 0.7, add section 0.8 (methodology tool setup with verify/install/connect/smoke-test), add re-onboarding section, document built-in skills as always-on.
5. **Update the template files** (`mcp-settings.json`, `ci-cd.yml`, `env-template.env`, `set-secrets.js`) — add conditional markers and document the filtering logic in comments.
6. **Update all 7 agent definition files** (including `design-architecture-agent.md`) — add a "Conditional Step Behavior" section referencing `tool-selections.json` and the per-step rules in section 7. Document which permissions are dynamic (methodology) vs static (built-in).
7. **Update `SKILL.md`** — add Step 0.0.5 and Step 0.DA to prerequisites, document `tool-selections.json` and `skill-registry.json`, note conditional pipeline, document the built-in vs selectable distinction and methodology-first approach.
8. **Update `pipeline.md`** — add the Step 0.DA design-architecture phase and conditional notes to each step detail.
9. **Verify** — walk through a test onboarding with a non-contiguous selection (e.g., only items 4, 7, and 15) and confirm: no questions asked for unselected tools, config files contain only selected entries, agent frontmatter has only selected methodology permissions (built-in untouched), Step 0.DA runs the selected methodologies, pipeline steps degrade correctly.

---

## 12. Edge Cases

| Scenario | Handling |
|-----------|----------|
| User selects nothing | Proceed in "local-only mode." All remote-dependent steps are skipped. The agent clearly states: "No tools selected — pipeline runs in local-only mode with no external integrations." Built-in utility skills remain active. |
| User selects only methodology skills (7–8), no MCPs | Valid. Methodology skills are permitted in agent frontmatter. No MCP servers configured. Pipeline runs locally with the selected methodology (e.g., SDD docs created locally, Playwright tests on local files). |
| User selects GitHub but NOT Jira | Valid. Code steps run (branches, PRs). Requirement breakdown uses PRD (built-in, always on) instead of Jira tasks. No sprint management. |
| User selects Huawei ECS but NOT JFrog | Warn (§5). Deployment step runs but has no Docker image to pull. The DevOps agent asks the user for a manual image reference or skips deployment. |
| `tool-selections.json` missing (old onboarding) | Backward-compatible: treat all tools as selected (full pipeline). Agent prints: "No tool selections file found — running full pipeline (all tools)." |
| User re-runs onboarding and removes a previously-configured tool/skill | Strip its config entries (MCP/env/CI stages) and/or its methodology skill permissions from agent frontmatter. Built-in utility skills are never removed. Warn that downstream pipeline steps will now be skipped. |
| User selects SonarCloud but Semgrep is not selected | Valid. SonarCloud runs in CI (remote). Semgrep local pre-scan is simply skipped in Step 3. No conflict. |
| User tries to select a "coming soon" skill (e.g., OpenSpec) | Agent responds: "OpenSpec is not yet available. It will be selectable once the skill is released." The skill cannot be added to `tool-selections.json` until its registry status flips to `available`. |
| New methodology skill released (e.g., OpenSpec becomes available) | Flip `status` from `"planned"` to `"available"` in `skill-registry.json`. It automatically appears in the next onboarding's selection list. No code changes needed. |
| User selects multiple TDD unit tools (e.g., Jest + Vitest) | Valid but unusual. Each tool covers the same layer (unit). The design-architecture agent assigns acceptance criteria to BOTH tools. Both must pass. Typically only one unit tool per language is needed. |
| User selects Postman but NOT Newman | Valid. API tests run interactively via Postman MCP. No CLI/CI API test runs. |
| User selects DDD tools but NOT SDD | Valid. The domain model is produced and approved, then fed directly into implementation without a formal spec document. |
| User selects SDD but NOT TDD | Valid. Specs are created with acceptance criteria, but no test-first mandate. Developer agents still write tests alongside code (target > 80% coverage). |
| User selects no methodology tools at all | Valid. Step 0.DA is skipped entirely. The pipeline runs without spec/domain-model/test-planning ceremony. Built-in utility skills remain active. |
| A methodology tool fails its smoke test in Step 0.8 | Follow the Failure rule: report the error, offer the closest alternative in the same layer/stack (API: Postman <-> Newman; Unit JS: Jest <-> Vitest). Never swap across layers. Update selection only after user approves. |
| User selects both Playwright (E2E) and Postman (API) | Valid and encouraged. Playwright covers E2E/UI layer, Postman covers API layer. Both must pass. Execution order per step: API tests before E2E tests. |
