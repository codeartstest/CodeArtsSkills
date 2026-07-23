# Step 0 - Service Onboarding Guide

Before any agentic flow begins, walk the user through each platform setup one by one.
Ask the questions below, collect answers, and fill the templates at the end.

> **Communication style:** Keep ALL user-facing messages, questions, and option
> descriptions short and concise. Do NOT expose internal agent roles, pipeline
> implementation details, or lengthy explanations to the user. The user only
> needs to understand what they're choosing, not how the pipeline works internally.

---

## 0.0 - Auto-Provision Agent Definition Files (Runs First)

The 7 agent definition files are bundled inside the skill at
`references/agents/`. They must be copied to `.codeartsdoer/agents/` so the
CodeArts Agent platform can discover and invoke them. This step runs
automatically before any service onboarding - **no user action needed**.

### Agent Files

| File | Agent | Steps |
|------|-------|-------|
| `pm-agent.md` | PM Agent (orchestrator) | 0, 1, 1b, 2, 5, 7, 8, 9 |
| `backend-agent.md` | Backend Agent | 0, 1b, 2, 3, 5, 7, 9 |
| `frontend-agent.md` | Frontend Agent | 0, 1b, 2, 3, 5, 7, 9 |
| `code-reviewer-agent.md` | Code Reviewer Agent | 4 |
| `tester-agent.md` | Tester Agent | 5 |
| `devops-agent.md` | DevOps Agent | 0, 6, 8 |
| `design-architecture-agent.md` | Design-Architecture Agent | 0.DA |

### Auto-Copy Procedure (run via bash)

1. **Create target directory** if it doesn't exist:

   **Windows (PowerShell):**
   ```powershell
   $targetDir = ".codeartsdoer/agents"
   if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force }
   ```

   **macOS/Linux (Bash):**
   ```bash
   mkdir -p .codeartsdoer/agents
   ```

2. **Copy all 7 agent files** from the skill bundle to `.codeartsdoer/agents/`:

   **Windows (PowerShell):**
   ```powershell
   $sourceDir = ".codeartsdoer/skills/sdlc-agentic-pipeline/references/agents"
   $agentFiles = @("pm-agent.md", "backend-agent.md", "frontend-agent.md", "code-reviewer-agent.md", "tester-agent.md", "devops-agent.md", "design-architecture-agent.md")
   foreach ($file in $agentFiles) {
       $src = Join-Path $sourceDir $file
       $dst = Join-Path $targetDir $file
       if (Test-Path $src) {
           Copy-Item $src $dst -Force
           Write-Output "Copied: $file"
       } else {
           Write-Warning "MISSING: $file not found in skill bundle"
       }
   }
   ```

   **macOS/Linux (Bash):**
   ```bash
   sourceDir=".codeartsdoer/skills/sdlc-agentic-pipeline/references/agents"
   targetDir=".codeartsdoer/agents"
   for file in pm-agent.md backend-agent.md frontend-agent.md code-reviewer-agent.md tester-agent.md devops-agent.md design-architecture-agent.md; do
       if [ -f "$sourceDir/$file" ]; then
           cp "$sourceDir/$file" "$targetDir/$file"
           echo "Copied: $file"
       else
           echo "WARNING: MISSING $file not found in skill bundle"
       fi
   done
   ```

3. **Verify** all 6 files exist in `.codeartsdoer/agents/`:

   **Windows (PowerShell):**
   ```powershell
   $expected = @("pm-agent.md", "backend-agent.md", "frontend-agent.md", "code-reviewer-agent.md", "tester-agent.md", "devops-agent.md", "design-architecture-agent.md")
   $missing = $expected | Where-Object { -not (Test-Path ".codeartsdoer/agents/$_") }
   if ($missing.Count -eq 0) { Write-Output "All 7 agent files verified" }
   else { Write-Error "MISSING agent files: $($missing -join ', ')" }
   ```

   **macOS/Linux (Bash):**
   ```bash
   missing=""
   for file in pm-agent.md backend-agent.md frontend-agent.md code-reviewer-agent.md tester-agent.md devops-agent.md design-architecture-agent.md; do
       [ ! -f ".codeartsdoer/agents/$file" ] && missing="$missing $file"
   done
   if [ -z "$missing" ]; then echo "All 7 agent files verified"; else echo "ERROR: MISSING agent files:$missing"; fi
   ```

4. If any files are missing, report the error to the user and do not proceed
   to service onboarding until resolved.

> This step is idempotent - running it multiple times overwrites the files with
> the latest version from the skill bundle. No user interaction required.

---

## 0.0.5 - Multi-Tool Selection (Runs Before Any Service Onboarding)

After the agent files are auto-provisioned (Step 0.0), the PM Agent presents a
**multiselect tool-selection screen**. The user picks any combination of MCP
servers, services, and methodology skills - including non-contiguous selections
(e.g., only items 4 and 7, or 3 through 5, or only item 8). Everything
downstream - onboarding questions, config file generation, agent permissions,
and pipeline step execution - is conditional on the user's selections.

### Built-in vs Selectable

Not everything is selectable. The distinction:

| Category | Examples | Selectable? | Handling |
|----------|----------|-------------|----------|
| **Built-in utility skills** | `ide-tool`, `doc-expert`, `pptx`, `data-analysis`, `prd`, `frontend-design`, `i18n-integration` | **No** - always on | Static in agent frontmatter, never touched by selection |
| **MCP servers** | GitHub, Jira, SonarCloud, Semgrep | **Yes** | Conditional in `mcp_settings.json` |
| **Services** | Huawei ECS | **Yes** | Conditional in `.env` |
| **Methodology skills** | Playwright CLI, SDD Toolkit, OpenSpec*, SpecKit*, Postman, Newman, Jest, Pytest, JUnit, Vitest, Context Mapper, EventStorming, Structurizr | **Yes** | Dynamically granted/revoked in agent frontmatter |

*\*Items marked with \* are planned and not yet available - they appear as "coming soon" in the selection list.*

> **Rule:** The selection list only contains items the user has a real choice
> about. Built-in utility skills are infrastructure - always available to every
> agent. Do NOT ask the user about doc-expert, pptx, data-analysis, prd,
> frontend-design, i18n-integration, or ide-tool.

### Tool Catalog

The definitive list of selectable items. Each has a **stable ID** (used in the
persistence file) and a **display number** (shown to the user). The catalog is
extensible - see the skill registry at
`references/skill-registry.json`.

**Group A - MCP Servers (require credential collection):**

| # | Display Name | Stable ID | Onboarding Step |
|---|--------------|-----------|-----------------|
| 1 | GitHub | `github` | 0.1 |
| 2 | Jira (Atlassian) | `jira` | 0.2 |
| 3 | SonarCloud | `sonarcloud` | 0.3 |
| 4 | Semgrep | `semgrep` | 0.4 |


**Group B - Services (config only, no MCP server):**

| # | Display Name | Stable ID | Onboarding Step |
|---|--------------|-----------|-----------------|
| 5 | JFrog Artifactory | `jfrog` | 0.5 |
| 6 | Huawei Cloud ECS | `huawei-ecs` | 0.6 |

**Group C - Methodology Skills (selectable, extensible):**

| # | Display Name | Stable ID | Methodology | Status | Granted To |
|---|--------------|-----------|-------------|--------|------------|
| 7 | Playwright CLI | `playwright` | TDD (E2E) | Available | Tester |
| 8 | SDD Toolkit (Huawei Built-in) | `sdd` | SDD | Available | PM, Backend, Frontend, Design-Architecture |
| 9 | OpenSpec | `openspec` | SDD | Coming soon | PM, Backend, Frontend, Design-Architecture |

| 12 | Postman Skill | `postman` | TDD (API) | Available | Backend, Design-Architecture |
| 13 | Newman | `newman` | TDD (API) | Available | Backend |
| 14 | Jest | `jest` | TDD (Unit) | Available | Backend, Frontend |
| 15 | Pytest | `pytest` | TDD (Unit) | Available | Backend |
| 16 | JUnit | `junit` | TDD (Unit) | Available | Backend |
| 17 | Vitest | `vitest` | TDD (Unit) | Available | Backend, Frontend |
| 18 | Context Mapper | `context-mapper` | DDD | Available | Design-Architecture |
| 19 | EventStorming | `eventstorming` | DDD | Available | Design-Architecture |
| 20 | Structurizr | `structurizr` | DDD | Available | Design-Architecture |

### Questions to Present

Present **two grouped multiselect questions** via the `question` tool. Both use
`multiple: true` and `custom: false` (disables "Type your own answer"). Keep
option descriptions short.

> The implementer MAY collapse these into a single question if the platform UI
> handles it well. Two questions are recommended for readability.

**Question 1 — MCP Servers & Services:**

```
header: "Select Integrations"
question: "Which MCP servers and services do you want to configure? Select any combination. Unselected items will be skipped - the pipeline adapts automatically."
multiple: true
custom: false
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
    description: "Docker image storage and artifact verification (credentials for CI/CD, no MCP)."
  - label: "Huawei Cloud ECS"
    description: "Deployment target (SSH-based, Docker runtime)."
  - label: "None"
    description: "No MCP servers or services. Pipeline runs in local-only mode."
```

**Question 2 — SDD (Spec-Driven Development):**

```
header: "SDD — Spec-Driven Development"
question: "Which SDD tools do you want enabled? SDD defines how requirements and design are specified before implementation. First selected tool becomes PRIMARY; others are SUPPLEMENTARY. Built-in utility skills are always available - no need to select them."
multiple: true
custom: false
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
question: "Which TDD tools do you want enabled? Each tool owns its own test layer (E2E, API, Unit). All selected layers must pass. Built-in utility skills are always available - no need to select them."
multiple: true
custom: false
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
  - label: "None"
    description: "No TDD tools. Built-in utility skills remain active."
```

**Question 4 — DDD (Domain-Driven Design):**

```
header: "DDD — Domain-Driven Design"
question: "Which DDD tools do you want enabled? First selected tool becomes PRIMARY (approval artifact); others are SUPPLEMENTARY. The domain model is designed ONCE, then re-expressed in each supplementary format. Built-in utility skills are always available - no need to select them."
multiple: true
custom: false
options:
  - label: "Context Mapper"
    description: "DSL for bounded contexts, context maps, aggregates."
  - label: "EventStorming"
    description: "Workshop-style domain discovery on a timeline board."
  - label: "Structurizr"
    description: "C4-model architecture DSL with diagram views."
  - label: "None"
    description: "No DDD tools. Built-in utility skills remain active."
```

> **Planned items:** If the user attempts to select a "coming soon" item, the
> agent responds: "OpenSpec is not yet available. It will be selectable once
> the skill is released. Please choose from available skills."

### Selection Rules

1. **No defaults / no pre-selection.** Every item starts unchecked. The user
   must actively choose.
2. **No mandatory items.** Even GitHub is optional. If the user selects "None"
   or nothing, the agent proceeds with zero external tools (local-only mode)
   and tells the user which pipeline steps are inactive.
3. **Non-contiguous selection is valid.** The user may pick only item 4, or
   items 3-5, or only item 8, or skip 1-3 and select 4-11. Any subset is
   accepted.
4. **"None" option.** Both questions include a "None" option. If the user
   selects "None", no items from that group are selected. If "None" is selected
   alongside other items, "None" takes precedence (no items from that group).
   The `custom: false` parameter disables "Type your own answer" - these are
   pure pick-lists.
5. **Built-in utility skills are not mentioned** in the selection. They are
   always on.

### Post-Selection Summary

Immediately after the user confirms, the PM Agent prints a summary table and
**dependency warnings** (see below). Example (user selected only Semgrep + Playwright):

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
  • Steps 1, 1b, 2 (Jira sprint/tasks) - SKIPPED (no Jira)
  • Step 2 (SDD setup) - SKIPPED (no SDD Toolkit)
  • Step 3 (Dev + Semgrep pre-scan) - partial (Semgrep only, no GitHub PRs)
  • Step 4 (Code Review) - SKIPPED (no GitHub)
  • Step 5 (E2E) - active (Playwright selected)
  • Steps 6-8 (CI/CD, Release, Deploy) - SKIPPED
  • Step 9 (Report) - active (doc-expert always on; no Jira metrics)

  ⚠ Playwright E2E normally checks out a feature branch from GitHub.
    Without GitHub, the Tester Agent will run tests against the local
    working directory only.
```

The user is then asked for confirmation via the `question` tool:

```
header: "Confirm Selection"
question: "Proceed with these selections?"
custom: false
options:
  - label: "Yes, proceed"
    description: "Proceed with the selected tools. All others skipped."
  - label: "No, re-select"
    description: "Go back and change your selections."
```

This gives a final confirmation gate before onboarding begins.

### Dependency Warnings (Soft, Non-Blocking)

Dependencies are **warnings only** - the user's freedom is absolute. After
selection, the PM Agent checks for these patterns and surfaces warnings in the
post-selection summary. The user can proceed anyway.

| User Selected | But NOT Selected | Warning |
|---------------|------------------|---------|
| SonarCloud | GitHub | "SonarCloud CI/CD stage needs GitHub Actions. Without GitHub, the SonarCloud scan won't run in CI. You can still use the SonarCloud MCP for manual QG checks." |
| JFrog | GitHub | "JFrog artifact upload happens in GitHub Actions. Without GitHub, Docker images won't be pushed to JFrog via CI. Manual `docker push` would be needed." |
| JFrog | Huawei ECS | "Deployment (Step 8) pulls Docker images from JFrog. Without JFrog, the ECS deployment has no image source. Select JFrog if you want automated deployment." |
| Huawei ECS | JFrog | "ECS deployment pulls from JFrog registry. Without JFrog, there's no Docker image to deploy. Deployment step will be skipped or require a manual image." |
| Playwright | GitHub | "E2E tests normally checkout a feature branch from GitHub. Without GitHub, tests run against the local working directory only - no branch isolation." |

| Jira | GitHub | "Jira tasks are linked to GitHub PRs/commits. Without GitHub, Jira-GitHub auto-linking won't work, but Jira task tracking still functions standalone." |
| SDD Toolkit | Jira | "SDD docs are tied to Jira tasks. Without Jira, SDD directories will be created from the PRD/project prompt directly, not linked to Jira issue keys." |

> These warnings are informational. The user can dismiss them and proceed. Do
> NOT block onboarding.

### Selection Persistence

After the user confirms, write `.codeartsdoer/tool-selections.json` immediately.
Every agent and every config-generation step reads this file.

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

**Reading conventions:**
- All agents read this file at the **start of their first step** to determine
  which tools are active. Helper: `isSelected(toolId)` returns `true`/`false`.
- If the file does not exist (e.g., onboarding was done before this feature),
  treat **all tools as selected** (backward-compatible default = full pipeline).
- This file is **local only** - add to `.gitignore`.

### Agent Frontmatter Post-Processing

After writing `tool-selections.json`, run the post-processing script to update
agent `permission.skill` blocks for methodology skills:

**Windows (PowerShell):**
```powershell
& .codeartsdoer/skills/sdlc-agentic-pipeline/references/templates/apply-tool-selections.ps1
```

**macOS/Linux (Bash):**
```bash
bash .codeartsdoer/skills/sdlc-agentic-pipeline/references/templates/apply-tool-selections.sh
```

This script:
- Reads `tool-selections.json` + `skill-registry.json`
- For each agent file in `.codeartsdoer/agents/`, grants selected methodology
  skill permissions and revokes unselected ones
- **Never touches** built-in utility skills (ide-tool, doc-expert, pptx, etc.)
- Is idempotent - safe to re-run after selection changes

---

## Conditional Onboarding (0.1 - 0.8)

After the selection is saved, the PM Agent walks through onboarding **only for
selected tools**, in catalog order (1 to 20). For each item:

| If Selected | Action |
|-------------|--------|
| Yes | Run the onboarding sub-step (0.1-0.8) as documented, collect credentials, write config |
| No | Skip the sub-step entirely - do NOT ask any questions, do NOT write any config for it |

> **Special case - GitHub (item 1):** If GitHub is NOT selected, skip 0.1
> entirely. The pipeline operates on the **local working directory** as the
> repo. No GitHub MCP is configured. The Option A/B question is skipped. All
> downstream agents use local file paths instead of GitHub MCP calls. The agent
> notes: "GitHub not selected - pipeline runs in local-only mode. No PRs, no
> remote branches, no GitHub Actions CI/CD."
>
> **Special case - SDD Toolkit (item 8):** No install needed - the SDD skills
> are built-in system skills. Selection means: grant the permission in agent
> frontmatter (done by the post-processing script above) and run SDD in Step 2.
> If NOT selected, Step 2 skips SDD directory creation and proceeds with a
> plain task list.
>
> **Special case - Playwright (item 7):** Run the 0.7 install procedure as-is
> (install skill via `npx skills add`, fix junctions, register in
> `ProjectSkillStatus.txt`). If NOT selected, the Tester Agent produces a "no
> E2E coverage" sign-off note in Step 5.
>
> **Special case - TDD tools (items 12 to 17):** Run Step 0.8 (methodology tool
> setup) for each selected TDD tool. Each tool is verified, installed, and
> smoke-tested. Postman (item 12) requires a Postman API key (PMAK) via the
> Credential handling procedure. If NOT selected, no test-first mandate for
> that layer - developer agents still write tests alongside code.
>
> **Special case - DDD tools (items 18 to 20):** Run Step 0.8 for each selected
> DDD tool. DDD tools produce text/DSL output with no installation required
> (optional rendering setup only). If NOT selected, no domain modeling phase
> runs in Step 0.DA.
>
> **Special case - Design-Architecture phase (Step 0.DA):** After onboarding
> (Steps 0.0 through 0.8), if ANY methodology tools are selected, the PM Agent
> invokes the design-architecture agent. It classifies the task, does research,
> executes the selected methodologies (DDD -> SDD -> TDD), and hands off curated
> context to the implementation pipeline. If NO methodology tools are selected,
> Step 0.DA is skipped entirely. See
> `references/agents/design-architecture-agent.md`.

---

## 0.1 - GitHub

> ▶ **IF SELECTED** (item 1, `github`). If NOT selected, skip this entire
> section. The pipeline runs in local-only mode with no PRs, no remote
> branches, no GitHub Actions CI/CD.

### GitHub Repo Mode Selection

Ask the user via the `question` tool:

```
header: "GitHub Repo Mode"
question: "Start with an existing GitHub repo or create a new one?"
custom: false
options:
  - label: "Existing repo"
    description: "Use a repo you already have."
  - label: "New repo"
    description: "Create a new repo from a prompt."
```

- **Question**: "Start with an existing GitHub repo or create a new one?"
- **Option A**: "Existing repo" - description: "Use a repo you already have"
- **Option B**: "New repo" - description: "Create a new repo from a prompt"

### Setup Instructions

1. Create a GitHub account at https://github.com/ (or sign in with Gmail)
2. Create a Personal Access Token:
   - Go to **Settings > Developer settings > Personal access tokens > Tokens (classic) > Generate new token (classic)**
   - Select scopes: `repo`, `workflow`, `admin:org` (as needed)
   - Copy the token - you won't see it again

### Option A: Existing Repository

> **IMPORTANT:**
> **PM Agent is READ-ONLY with the repository.** The PM Agent uses GitHub MCP
> tools (`github_get_file_contents`, `github_list_branches`, etc.) for read-only
> analysis. The PM Agent NEVER runs `git clone`, `git commit`, `git push`, or
> `git checkout`. All git write operations are delegated to developer agents
> (Backend, Frontend) who create branches, commit, push, and create/merge PRs.
> The DevOps Agent owns git write for infrastructure files only but does NOT
> create or merge PRs - all PR operations are routed to developer agents
> (Backend if both active, otherwise sole developer).
>
> **Existing artifacts are sacred.** If the repo already contains Dockerfiles,
> `docker-compose.yml`, `.github/workflows/ci-cd.yml`, or `sonar-project.properties`,
> the pipeline MUST NOT modify or overwrite them unless the user explicitly
> requests changes.
>
> **Branches are user-controlled.** The pipeline MUST NOT create, delete, or
> rename branches unless the user explicitly approves. The user's existing
> branch strategy is respected.

#### A.1 - Collect Existing Repo Info (PM Agent)

Ask the user via the `question` tool (all fields are free-text - use `custom: true`):

```
questions:
  - header: "GitHub Owner"
    question: "Enter your GitHub username or organization name (e.g., agentman3334)"
    options:
      - label: "Type your answer"
        description: "Select and type your GitHub owner name"
  - header: "GitHub Repo"
    question: "Enter the repository name (e.g., my-project)"
    options:
      - label: "Type your answer"
        description: "Select and type your repo name"
  - header: "Default Branch"
    question: "Enter the default branch name (e.g., main)"
    options:
      - label: "main"
        description: "Default branch is main"
      - label: "master"
        description: "Default branch is master"
  - header: "GitHub PAT"
    question: "Enter your GitHub Personal Access Token (scopes: repo, workflow)"
    options:
      - label: "Type your answer"
        description: "Select and paste your PAT (ghp_...)"
```

#### A.2 - Configure GitHub MCP Server (PM Agent)

Write the GitHub MCP configuration into `.codeartsdoer/mcp/mcp_settings.json`
using the user's PAT. This must happen FIRST so the GitHub MCP tools become
available for subsequent read-only analysis steps.

```json
"github": {
  "url": "https://api.githubcopilot.com/mcp/",
  "headers": {
    "Authorization": "Bearer <GITHUB_PAT>"
  }
}
```

If `mcp_settings.json` already exists, merge this block into the existing
`mcpServers` object rather than overwriting.

#### A.3 - Verify Repo Access (PM Agent, READ-ONLY)

Confirm the repo exists and is accessible using a lightweight read-only MCP call:

```
github_get_file_contents(owner="<GITHUB_OWNER>", repo="<GITHUB_REPO>", path="/")
```

- If the call **succeeds**, the repo is verified and accessible. Proceed to A.4.
- If the call **fails** with 404, the repo does not exist. Ask the user to verify
  the owner and repo name.
- If the call **fails** with 401/403, the PAT is invalid or lacks `repo` scope.
  Ask the user to regenerate the token with `repo`, `workflow` scopes.

> **Do NOT proceed to A.4 until repo access is verified.**

#### A.4 - Inventory Existing Artifacts (PM Agent, READ-ONLY)

The PM Agent scans the repo via GitHub MCP to build a complete inventory of
what already exists. This inventory determines what the pipeline can reuse
vs. what needs to be generated (only with user approval).

Check the following via `github_get_file_contents` and `github_list_branches`:

| Artifact | Check Path | Action |
|----------|-----------|--------|
| Backend Dockerfile | `backend/Dockerfile` or `Dockerfile` | Record: exists/missing |
| Frontend Dockerfile | `frontend/Dockerfile` | Record: exists/missing |
| docker-compose.yml | `docker-compose.yml` | Record: exists/missing |
| CI/CD workflow | `.github/workflows/ci-cd.yml` | Record: exists/missing |
| SonarCloud config | `sonar-project.properties` | Record: exists/missing |
| Backend deps | `requirements.txt` / `package.json` / `go.mod` | Parse: detect tech stack |
| Frontend deps | `frontend/package.json` / `index.html` | Parse: detect tech stack |
| Backend dir | `backend/` or `app/` | Record: exists/missing |
| Frontend dir | `frontend/` or `src/` | Record: exists/missing |
| Branches | `github_list_branches` | Record: all branch names |

> **Why inventory?** The PM needs to know what exists so it can (a) avoid
> touching existing files, (b) tell the user what's missing, and (c) scope
> Jira tasks accurately at Step 1.

#### A.5 - Ask User About Intent (PM Agent -> question tool)

The PM Agent presents the inventory to the user and asks what they want to
work on. This bridges onboarding (Step 0) and requirement breakdown (Step 1).

Present a summary like:

```
"I analyzed your repo 'my-project'. Here's what I found:

 EXISTING:
 - Backend: Python/FastAPI (requirements.txt detected)
 - Frontend: Vanilla HTML/CSS/JS (index.html detected)
 - Docker: backend/Dockerfile, frontend/Dockerfile
 - CI/CD: .github/workflows/ci-cd.yml (existing)
 - Docker Compose: docker-compose.yml (existing)
 - Branches: main, develop

 MISSING (pipeline may need):
 - sonar-project.properties (for SonarCloud integration)

 What would you like to work on?"
```

Offer options via the `question` tool (multiple selection allowed):

```
header: "Development Intent"
question: "What would you like to work on?"
multiple: true
options:
  - label: "New feature development"
    description: "Build new features"
  - label: "Bug fix"
    description: "Fix existing bugs"
  - label: "Refactoring"
    description: "Improve code structure"
  - label: "Add CI/CD pipeline"
    description: "If missing or needs update"
  - label: "Add Docker setup"
    description: "If missing or needs update"
  - label: "Security audit"
    description: "Review security posture"
  - label: "Performance optimization"
    description: "Improve performance"
```

> **Why ask?** This is the user's repo. The PM should not assume what work is
> needed. The user's answer directly shapes Step 1 (Jira task creation).

#### A.6 - Ask About Branch Strategy (PM Agent -> question tool)

The PM Agent asks the user what branch strategy the pipeline should follow:

```
header: "Branch Strategy"
question: "Your repo has these branches: main, develop. What branch strategy would you like the pipeline to use?"
custom: false
options:
  - label: "Use existing develop branch"
    description: "Use develop as integration branch"
  - label: "Create a dev branch (GitFlow)"
    description: "Create new dev branch for integration"
  - label: "Trunk-based"
    description: "PRs target main directly"
```

> **Why ask?** Not all teams use GitFlow. Some use trunk-based development,
> some use GitHub Flow. The pipeline must adapt to the user's existing workflow,
> not impose its own. Branches are only created by developer agents, never by PM.

#### A.7 - Proceed to Service Onboarding (0.2 - 0.7)

From here, the flow is **identical to Option B**. Continue with:

- Step 0.2 - Jira
- Step 0.3 - SonarCloud
- Step 0.4 - Semgrep
- Step 0.5 - JFrog (credentials for CI/CD only, no MCP)
- Step 0.6 - Huawei ECS
- Step 0.7 - Playwright (auto-provisioned)

> **No code building, no repo creation, no branch creation** happens during
> Option A onboarding. The code and branches already exist. The pipeline only
> generates local config files (`mcp_settings.json`, `.env`,
> `sonar-project.properties` if missing) - none of which are pushed to the repo
> by the PM Agent.

### Option B: New Repository from Prompt

Ask the user via the `question` tool (free-text fields use `custom: true`):

```
questions:
  - header: "GitHub Owner"
    question: "Enter your GitHub username or organization name (e.g., agentman3334)"
    options:
      - label: "Type your answer"
        description: "Select and type your GitHub owner name"
  - header: "New Repo Name"
    question: "Enter a name for the new repository (e.g., my-new-project)"
    options:
      - label: "Type your answer"
        description: "Select and type the new repo name"
  - header: "Visibility"
    question: "Should the repository be public or private?"
    custom: false
    options:
      - label: "Private"
        description: "Only you and collaborators can see it"
      - label: "Public"
        description: "Anyone on the internet can see it"
  - header: "Project Prompt"
    question: "Describe what you want to build (e.g., 'basic to-do app with REST API')"
    options:
      - label: "Type your answer"
        description: "Select and type your project description"
  - header: "GitHub PAT"
    question: "Enter your GitHub Personal Access Token (scopes: repo, workflow)"
    options:
      - label: "Type your answer"
        description: "Select and paste your PAT (ghp_...)"
```

> **IMPORTANT:**
> **BLOCKING:** After collecting the answers above, you MUST execute the
> four steps below (B.1 Configure MCP, B.2 Verify MCP Health, B.3 Build &
> Push Initial Code, B.4 Verify) BEFORE proceeding to
> Step 0.2 (Jira). Do NOT ask any Step 0.2 questions until the repository is
> created, code is pushed, and verification passes. If any step fails, resolve
> the error before continuing.

#### B.1 - Configure the GitHub MCP Server

Write the GitHub MCP configuration into `.codeartsdoer/mcp/mcp_settings.json`
using the user's PAT. This must happen FIRST so the GitHub MCP tools become
available for subsequent steps.

```json
"github": {
  "url": "https://api.githubcopilot.com/mcp/",
  "headers": {
    "Authorization": "Bearer <GITHUB_PAT>"
  }
}
```

Replace `<GITHUB_PAT>` with the token collected above. If
`mcp_settings.json` already exists (e.g., from a prior partial onboarding),
merge this block into the existing `mcpServers` object rather than overwriting.

#### B.2 - Verify GitHub MCP Health

Before using the MCP to create the repo, confirm the GitHub MCP server is
healthy and the PAT is valid. Call a lightweight read-only MCP tool:

```
github_search_repositories(query="<GITHUB_OWNER>/<NEW_REPO_NAME>")
```

- If the call **succeeds** (returns a result, even an empty list), the MCP is
  healthy and the PAT is valid. Proceed to B.3.
- If the call **fails** with a 401/403 authentication error, the PAT is
  invalid or lacks the `repo` scope. Ask the user to regenerate the token
  with the correct scopes and update `mcp_settings.json`, then re-verify.
- If the call **fails** with a connection/timeout error, the MCP server may
  not be loaded yet. Wait a moment and retry. If it persists, check that
  `mcp_settings.json` was written to the correct path
  (`.codeartsdoer/mcp/mcp_settings.json`).

> **Do NOT proceed to B.3 until the MCP health check passes.**

#### B.3 - Build Project from Prompt & Push to GitHub

The PM Agent orchestrates this step but **delegates ALL repo creation, git operations,
and code building to developer agents.** The PM Agent NEVER creates repos, clones,
commits, or pushes. The Backend Agent creates the repo, clones it, and creates the
`dev` branch first. All agents push to the `dev` branch (not `main`).
DevOps Agent runs **last** so it can see both backend and frontend Dockerfiles
before writing `docker-compose.yml`:
- **PM Agent**: parses prompt, splits into backend/frontend scope (orchestration only, NO repo creation, NO git)
- **Backend Agent**: creates repo via GitHub MCP, clones repo, builds backend code, creates `dev` branch, commits & pushes to `dev`
- **Frontend Agent**: builds frontend code, commits & pushes to `dev`
- **DevOps Agent**: writes `docker-compose.yml` + shared docs (README, .gitignore), commits & pushes to `dev`

1. **Parse the Project Prompt** (PM Agent - orchestration only, NO repo creation, NO git):
   - Analyze the user's Project Prompt (collected in question 4)
   - Split the requirements into **backend scope** and **frontend scope**:
     - Backend: APIs, database models, server logic, auth, integrations
     - Frontend: UI components, pages, routing, state management, styling
   - Identify the tech stack for each (e.g., Python/FastAPI for backend,
     vanilla HTML/CSS/JS for frontend)

2. **Invoke Backend Agent** to create repo, clone, build, create `dev` branch & push (PM Agent -> Task tool):
   - Pass the backend scope, tech stack, project prompt, repo name, owner, visibility to the Backend Agent (do NOT pass the GitHub PAT — the Backend Agent uses its preconfigured GitHub MCP capability for repository creation)
   - The Backend Agent creates the repo via GitHub MCP (this is the ONLY agent that creates repos):
     ```
     github_create_repository(
       name="<NEW_REPO_NAME>",
       owner="<GITHUB_OWNER>",
       private=<true if VISIBILITY is "private", false otherwise>,
       auto_init=true
     )
     ```
     - If the MCP returns a **422** or "already exists" error, the Backend Agent
       reports back to the PM Agent, who asks the user for a different name and retries.
   - The Backend Agent clones the repo (this is the ONLY agent that clones):
     ```bash
     git clone "https://<GITHUB_PAT>@github.com/<GITHUB_OWNER>/<NEW_REPO_NAME>.git"
     ```
   - The Backend Agent generates:
     - Complete directory structure (`backend/app/`, `backend/tests/`)
     - Actual implementation code for all backend features
     - Configuration files (`requirements.txt`, backend `Dockerfile`)
     - Unit tests for API endpoints and business logic
   - The Backend Agent writes files into the cloned repo's `backend/` directory
   - The Backend Agent creates the `dev` branch from `main` (required by GitFlow
     strategy) and commits & pushes to `dev`:
     ```bash
     cd <NEW_REPO_NAME>
     git checkout -b dev
     git add backend/
     git commit -m "feat: initial backend build from prompt"
     git push origin dev
     ```

 3. **Frontend Agent builds concurrently with Backend** (PM dispatches via Jira async):
    - The Backend Agent has already created the repo, cloned it, and created the `dev` branch
    - Pass the frontend scope, tech stack, project prompt, AND the repository URL to the Frontend Agent
    - The Frontend Agent clones the repository from the URL provided by the Backend Agent
    - The Frontend Agent works on an isolated feature branch (not directly on `dev`):
      ```bash
      git clone "https://github.com/<GITHUB_OWNER>/<NEW_REPO_NAME>.git"
      cd <NEW_REPO_NAME>
      git checkout -b feature/frontend/initial-build dev
      ```
    - The Frontend Agent generates:
     - Complete directory structure (`frontend/src/`, `frontend/public/`)
     - Actual implementation code for all UI features
     - Configuration files (`package.json`, frontend `Dockerfile`)
     - Component-level tests
    - The Frontend Agent writes files into the cloned repo's `frontend/` directory
    - The Frontend Agent commits frontend code and pushes to its feature branch:
      ```bash
      git add frontend/
      git commit -m "feat: initial frontend build from prompt"
      git push origin feature/frontend/initial-build
      ```
    - After Backend Agent completes, the Frontend Agent (or Backend Agent if both active)
      creates a PR from `feature/frontend/initial-build` to `dev` and merges it

4. **Invoke DevOps Agent** (after BOTH Backend + Frontend complete) to write `docker-compose.yml`, shared docs, generate `ci-cd.yml` & push to `dev` (PM Agent -> Task tool):
   - Pass the project structure, tech stack, container requirements, AND the
     build info returned by Backend and Frontend agents (setup actions, install/build/test commands)
   - The DevOps Agent can now see both `backend/Dockerfile` and `frontend/Dockerfile`
   - The DevOps Agent generates:
     - `docker-compose.yml` (orchestrates backend + frontend containers)
     - `ci-cd.yml` (from `references/templates/ci-cd.yml`) with the **build section
       filled in** based on the backend and frontend build info:
       - sonar-scan job: test + coverage steps for both backend and frontend
       - build job: setup + install + build steps for both backend and frontend
     - Service-specific placeholders (`<JFROG_REPO_KEY>`, etc.) are left for the
       PM Agent to fill after all services are onboarded
    - The DevOps Agent commits `docker-compose.yml` + `ci-cd.yml` + shared docs
      (`README.md`, `.gitignore`, `.env.example` - written by DevOps Agent) and pushes to `dev`:
     ```bash
     cd <NEW_REPO_NAME>
     git add docker-compose.yml .github/workflows/ci-cd.yml README.md .gitignore .env.example
     git commit -m "infra: add docker-compose, ci-cd.yml + shared project files"
     git push origin dev
     ```

#### B.4 - Verify Repository Creation via GitHub MCP (PM Agent, READ-ONLY)

Confirm the repo exists and is accessible using `github_get_file_contents`
(PM Agent may use this for basic verification):

```
github_get_file_contents(owner="<GITHUB_OWNER>", repo="<NEW_REPO_NAME>", path="README.md")
```

- If the call **succeeds**, the repo is verified with initial code pushed.
- If the call **fails** with 404, the repo was not created or the push failed.
  Go back to B.3 and resolve the issue.

> **IMPORTANT:**
> **Only after B.1 through B.4 all succeed**, proceed to Step 0.2 (Jira).
> The GitHub repo must exist with initial code pushed before any subsequent
> service onboarding steps, because Jira, SonarCloud, Semgrep, and JFrog all
> require linking to an existing GitHub repository.

### Fills into `mcp_settings.json`

> **Note:** For Option B, the GitHub MCP config was already written in step B.1.
> For Option A, the GitHub MCP config was already written in step A.2.
> In both cases, this block is already in `mcp_settings.json` by this point.

```json
"github": {
  "url": "https://api.githubcopilot.com/mcp/",
  "headers": {
    "Authorization": "Bearer <GITHUB_PAT>"
  }
}
```

---

## 0.2 - Jira (Atlassian)

> ▶ **IF SELECTED** (item 2, `jira`). If NOT selected, skip this entire
> section. Requirement breakdown uses PRD (built-in, always on) instead of
> Jira tasks. No sprint management.

### Setup Instructions

1. Create a Jira account at https://www.atlassian.com/software/jira - sign in with Gmail
2. Create a site name - e.g., `codeartstest.atlassian.net`
3. Create a space - e.g., `CodeArts Agent Space`
4. Find the **Jira Space Key** from **Space Settings**
5. **Connect GitHub to Jira**:
   - Go to **Space Settings > Toolchain > Source Code Management > GitHub for Atlassian**
   - Click **Configure > Continue > Next**
   - Sign in to GitHub -> Authorize -> Select organization -> Select repositories -> Connected
6. **Enable Rovo MCP Server**:
   - Go to https://admin.atlassian.com/ -> Click **Rovo > Rovo MCP server > Authentication**
   - Enable **Allow API token authentication**
7. **Create API Token**:
   - Visit https://id.atlassian.com/manage-profile/security/api-tokens
   - Create API token with scopes - choose **Teamwork Graph app** for token scope (47 actions)
   - Copy the token - you won't see it again
8. **Convert token to Base64**:

   **Windows (PowerShell):**
   ```powershell
   [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("<JIRA_EMAIL>:<JIRA_API_TOKEN>"))
   ```

   **macOS/Linux (Bash):**
   ```bash
   echo -n "<JIRA_EMAIL>:<JIRA_API_TOKEN>" | base64
   ```

   Use the result as the `Authorization: Basic <result>` in MCP config

### Ask the user

> **Jira 'In Testing' status**: Must be manually added to the project workflow.
> The pipeline uses 'In Testing' during Step 5 (E2E testing). This status does NOT exist by default.
> Add via: Settings -> Work items -> Workflows -> Edit -> Add status ->
> Create 'In Testing' (category: In Progress) -> Enable 'Allow all statuses to transition to this one'.

Ask the user via the `question` tool (all fields are free-text - use `custom: true`):

```
questions:
  - header: "Jira Cloud ID"
    question: "Enter your Jira Cloud ID (e.g., demo-account.atlassian.net)"
    options:
      - label: "Type your answer"
        description: "Select and type your Jira site name"
  - header: "Jira Email"
    question: "Enter your Jira login email (e.g., user@example.com)"
    options:
      - label: "Type your answer"
        description: "Select and type your email"
  - header: "Jira API Token"
    question: "Enter your Jira API Token (from step 7 - https://id.atlassian.com/manage-profile/security/api-tokens)"
    options:
      - label: "Type your answer"
        description: "Select and paste your API token"
  - header: "Jira Project Key"
    question: "Enter your Jira Project Key (from step 4, e.g., SCRUM)"
    options:
      - label: "Type your answer"
        description: "Select and type your project key"
  - header: "Jira MCP Auth (Base64)"
    question: "Enter the Base64-encoded auth string from step 8 (email:token)"
    options:
      - label: "Type your answer"
        description: "Select and paste the Base64 result"
```

> **NOTE - Manual Auth Required:** The user must manually link GitHub <-> Jira integration (step 5).
> This enables Jira issue keys in PR titles/commits to auto-link to Jira issues.

### Fills into `mcp_settings.json`

```json
"atlassian-rovo-mcp": {
  "url": "https://mcp.atlassian.com/v1/mcp",
  "headers": {
    "Authorization": "Basic <JIRA_MCP_AUTH_BASE64>"
  }
}
```

---

## 0.3 - SonarCloud

> ▶ **IF SELECTED** (item 3, `sonarcloud`). If NOT selected, skip this entire
> section. No `sonar-project.properties` is generated. CI/CD Sonar scan + QG
> stages are removed from the pipeline.

### Setup Instructions

1. Go to https://sonarcloud.io/login - **Login with GitHub**
   - Enter the verification code sent to your Gmail
2. **Create Organization**:
   - Choose **Import an organization from GitHub** - the system automatically sets organization name & key
   - Choose **Free** plan
3. **Generate Access Token**:
   - Go to https://sonarcloud.io/account/access-tokens?tab=personal_tokens
   - Generate a token - copy it now, you won't see it again
4. **Link GitHub <-> SonarCloud** (manual):
   - Go to **SonarCloud > Administration > Organization Settings** and bind the GitHub organization
   - Go to **Administration > Pull Requests** and select GitHub as the ALM integration
   - This enables Quality Gate status checks on PRs and PR decoration
5. **Disable Automatic Analysis** (CRITICAL - must be done before any CI/CD pipeline run):
   - Go to **SonarCloud > Project Dashboard > Administration > Analysis Method**
   - Turn OFF the **SonarCloud Automatic Analysis** toggle
   - Requires **Project Administrator** permissions (org-level alone is insufficient)
   - If both Automatic Analysis and GitHub Actions scan are enabled, the CI/CD workflow crashes with: `"You are running CI analysis while Automatic Analysis is enabled"`

> **WARNING:**
> **CRITICAL WARNING:** Before collecting SonarCloud credentials below, the user
> MUST confirm they have disabled Automatic Analysis in SonarCloud. If this is
> not done, the GitHub Actions CI/CD pipeline will crash during the SonarCloud
> scan stage. Surface this warning proactively to the user.

### Ask the user

Ask the user via the `question` tool (all fields are free-text - use `custom: true`):

```
questions:
  - header: "Sonar Project Key"
    question: "Enter your SonarCloud Project Key (e.g., agentman3334-key - auto-generated from org import)"
    options:
      - label: "Type your answer"
        description: "Select and type your project key"
  - header: "Sonar Organization"
    question: "Enter your SonarCloud Organization (e.g., agentman3334)"
    options:
      - label: "Type your answer"
        description: "Select and type your org name"
  - header: "Sonar Token"
    question: "Enter your SonarCloud Token (from step 3)"
    options:
      - label: "Type your answer"
        description: "Select and paste your token (squ_...)"
```

> **NOTE - Manual Auth Required:** The user must manually link GitHub <-> SonarCloud (step 4).

### Fills into `mcp_settings.json`

```json
"sonarqube": {
  "url": "https://api.sonarcloud.io/mcp",
  "headers": {
    "Authorization": "Bearer <SONAR_TOKEN>",
    "SONARQUBE_ORG": "<SONAR_ORGANIZATION_KEY>"
  }
}
```

### Fills into `sonar-project.properties`

```properties
sonar.projectKey=<GITHUB_OWNER>_<GITHUB_REPO>
sonar.organization=<SONAR_ORGANIZATION>
sonar.sources=backend/app,frontend/src
sonar.python.version=3.11
sonar.sourceEncoding=UTF-8
sonar.exclusions=**/node_modules/**,**/__pycache__/**,**/migrations/**
```

### Set GitHub Secrets and Variables (Automated)

Instead of manually clicking through the GitHub UI, use the `set-secrets.js`
template script to automatically set all required secrets and variables via
the GitHub REST API.

The SONAR_TOKEN is one of the values set by this script. See
[GitHub Secrets and Variables Setup](#github-secrets-and-variables-setup)
for full instructions.

> **Note:** The script is run **once** after all services (0.1-0.5) are
> onboarded, not after each individual service.

---

## 0.4 - Semgrep

> ▶ **IF SELECTED** (item 4, `semgrep`). If NOT selected, skip this entire
> section. Step 3 skips the local Semgrep pre-scan.

### Setup Instructions

1. Go to https://semgrep.dev/ - click **Try for free**
2. **Continue with GitHub** -> Authorize
3. **Create new organization**
4. In **Scan your code with Semgrep** section, choose **CLI**
5. **Install Semgrep automatically** (handled by the pipeline, not the user):
   - Run: `pip install semgrep`
   - Discover executable path automatically. The path MUST be correct or the
     Semgrep MCP server will fail to start. Try each method below in order
     until a working `semgrep` executable is found:

   **Windows (PowerShell):**
   ```powershell
   # Method 1: Direct lookup on PATH
   $semgrepPath = (Get-Command semgrep -ErrorAction SilentlyContinue).Source

   # Method 2: Use sysconfig to find the scripts directory (most reliable)
   if (-not $semgrepPath -or -not (Test-Path $semgrepPath)) {
     $pythonExe = "python"
     if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
       $pythonExe = "py -3"
     }
     $scriptsDir = & $pythonExe -c "import sysconfig; print(sysconfig.get_path('scripts'))" 2>$null
     if ($scriptsDir) {
       $candidate = Join-Path $scriptsDir.Trim() "semgrep.exe"
       if (Test-Path $candidate) { $semgrepPath = $candidate }
     }
   }

   # Method 3: Use pip show to find package install location
   if (-not $semgrepPath -or -not (Test-Path $semgrepPath)) {
     $pipOutput = & python -m pip show semgrep 2>$null
     if ($pipOutput -match "Location:\s*(.+)") {
       $sitePkgs = $matches[1].Trim()
       # Scripts dir is typically a sibling of site-packages' parent
       $pythonDir = Split-Path $sitePkgs -Parent
       $candidate = Join-Path $pythonDir "Scripts\semgrep.exe"
       if (Test-Path $candidate) { $semgrepPath = $candidate }
     }
   }

   # Method 4: Search common Python installation paths
   if (-not $semgrepPath -or -not (Test-Path $semgrepPath)) {
     $searchGlobs = @(
       "$env:LOCALAPPDATA\Programs\Python\Python3*\Scripts\semgrep.exe",
       "$env:APPDATA\Python\Python3*\Scripts\semgrep.exe"
     )
     foreach ($glob in $searchGlobs) {
       $found = Get-ChildItem $glob -ErrorAction SilentlyContinue | Select-Object -First 1
       if ($found) { $semgrepPath = $found.FullName; break }
     }
   }

   # Verify the executable actually works
   if ($semgrepPath -and (Test-Path $semgrepPath)) {
     $version = & $semgrepPath --version 2>&1
     Write-Output "Semgrep found at: $semgrepPath"
     Write-Output "Version: $version"
   } else {
     Write-Error "semgrep.exe not found. Run 'pip install semgrep' first."
   }
   ```

   **macOS/Linux (Bash):**
   ```bash
   # Method 1: Direct lookup on PATH
   semgrepPath=$(which semgrep 2>/dev/null)

   # Method 2: Use sysconfig to find scripts directory
   if [ -z "$semgrepPath" ] || [ ! -f "$semgrepPath" ]; then
     scriptsDir=$(python3 -c "import sysconfig; print(sysconfig.get_path('scripts'))" 2>/dev/null)
     if [ -n "$scriptsDir" ]; then
       candidate="$scriptsDir/semgrep"
       if [ -f "$candidate" ]; then semgrepPath="$candidate"; fi
     fi
   fi

   # Method 3: Use pip show to find package install location
   if [ -z "$semgrepPath" ] || [ ! -f "$semgrepPath" ]; then
     sitePkgs=$(pip3 show semgrep 2>/dev/null | grep "^Location:" | cut -d' ' -f2)
     if [ -n "$sitePkgs" ]; then
       pythonDir=$(dirname "$sitePkgs")
       candidate="$pythonDir/bin/semgrep"
       if [ -f "$candidate" ]; then semgrepPath="$candidate"; fi
     fi
   fi

   # Method 4: Search common paths
   if [ -z "$semgrepPath" ] || [ ! -f "$semgrepPath" ]; then
     for candidate in "/usr/local/bin/semgrep" "/usr/bin/semgrep" \
                      "$(python3 -m site --user-base 2>/dev/null)/bin/semgrep"; do
       if [ -f "$candidate" ]; then semgrepPath="$candidate"; break; fi
     done
   fi

   # Verify the executable actually works
   if [ -n "$semgrepPath" ] && [ -f "$semgrepPath" ]; then
     echo "Semgrep found at: $semgrepPath"
     $semgrepPath --version
   else
     echo "ERROR: semgrep not found. Run 'pip install semgrep' first." >&2
   fi
   ```

   - Typical path on Windows: `C:\Users\<user>\AppData\Local\Programs\Python\Python3XX\Scripts\semgrep.exe`
   - Typical path on macOS/Linux: `/usr/local/bin/semgrep` or `~/.local/bin/semgrep`
   - The discovered path MUST be written into `mcp_settings.json` as the
     `command` value for the `semgrep` MCP server entry. Do not leave
     `<SEMGREP_EXECUTABLE_PATH>` as a placeholder.
6. **Create CLI token**:
   - Run: `semgrep login` - this will generate a `SEMGREP_APP_TOKEN`
   - Or generate from Semgrep App > API Tokens > Settings

### Ask the user

1. **Semgrep App Token** - asked via question tool (see below).
   - **Semgrep Executable Path is handled automatically** - do not ask the user for this.

Ask the user via the `question` tool (free-text - use `custom: true`):

```r
questions:
  - header: "Semgrep App Token"
    question: "Enter your Semgrep App Token (run 'semgrep login' or go to Semgrep App > API Tokens > Settings)"
    options:
      - label: "Type your answer"
        description: "Select and paste your Semgrep app token"
```

> **NOTE - Manual Auth Required:** The user must manually link GitHub <-> Semgrep integration.
> Go to **Semgrep App > Settings > Integrations** and add the GitHub repository.

### Fills into `mcp_settings.json`

```json
"semgrep": {
  "command": "<SEMGREP_EXECUTABLE_PATH>",
  "args": ["mcp"],
  "env": {
    "SEMGREP_APP_TOKEN": "<SEMGREP_APP_TOKEN>",
    "PYTHONIOENCODING": "utf-8"
  },
  "disabled": false,
  "timeout": 120000
}
```

---

## 0.5 - JFrog Artifactory

> ▶ **IF SELECTED** (item 5, `jfrog`). If NOT selected, skip this entire
> section. CI/CD deploy-to-jfrog + verify-jfrog stages are removed. If Huawei
> ECS is selected without JFrog, deployment has no Docker image source.
> **NOTE:** JFrog is configured as a service (credentials for GitHub Actions
> secrets/variables only) — no MCP server is installed. Artifact verification
> in Step 7 uses the JFrog REST API directly.

### Setup Instructions

1. Go to https://jfrog.com/ 
2. **Login with company email** 
3. **Edit Hostname** (optional) - this becomes your `JFROG_PLATFORM_URL`
4. **Create a password** - this is only for platform login
5. **Generate Admin Access Token**:
   - In the **Administration** module, go to **User Management > Access Tokens**
   - In the **Token scope** field, select **Admin**
   - In the **User name** field, enter the name of the Admin user
   - In the **Service** field, select the **All** checkbox (or clear it and
     select specific services from the list)
   - In the **Expiration time** field, set the expiration time (use a preset
     option or set a custom expiration in hours)
   - Click **Generate** to generate the token
   - The Generate Token window displays: username, scope, audience, expiration,
     token ID, and the actual token
   - **Copy the token value** - you won't see it again
6. **Create a project**:
   - In the JFrog Platform UI, select **Administration > All Projects > + Create New**
   - The Create New Project dialog opens
   - In the **Configure Project** tab, configure:
     - **Project Name** - enter a name
     - **Project Key** - enter a unique key used to identify your Project resources
   - Click **Create Project**
7. **Create a repository**:
   - In the **Administration** module, select **Repositories**
   - Click **Create a Repository** and select **Local** from the list
   - Select the **Docker** package type
   - In the **Repository Key** field, type a meaningful name (e.g., `docker-dev-local`)
   - **WARNING:** Do NOT use underscores in the repository name. Due to subdomain/DNS/hostname
     limitations, Docker cannot communicate with registries that have underscores.
     Use hyphens instead (e.g., `docker-dev-local` or `docker.dev.local`, not `docker_dev_local`).
   - In the **Docker Settings** section, set the API version to **V2**
   - Set the **Max Unique Tags** and **Docker Tag Retention** values
   - Do NOT disable XRay
   - Note the Docker URL shown (e.g., `https://codeartsagentjfrog.jfrog.io/artifactory/api/docker/<repo-key>`)
 8. **Set up Docker client**:
   - Generate token -> Write your platform password -> Click **Generate Token & Create Instructions**
   - Note the auth config shown

### Ask the user

Ask the user via the `question` tool (all fields are free-text - use `custom: true`). Show the tips below in the question descriptions to help the user provide correct values:

```r
questions:
  - header: "JFrog Platform URL"
    question: "Enter your JFrog Platform URL (e.g., https://demoartifacthw.jfrog.io/). Copy the full base URL from your browser address bar - includes the scheme (https://)."
    options:
      - label: "Type your answer"
        description: "Select and paste your platform URL"
  - header: "JFrog Docker Registry"
    question: "Enter your JFrog Docker Registry hostname (e.g., demoartifacthw.jfrog.io). No underscores - use hyphens (DNS limitation)."
    options:
      - label: "Type your answer"
        description: "Select and type your registry hostname"
  - header: "JFrog Repo Key"
    question: "Enter your JFrog repository key (e.g., docker-dev-local-sdlc). Create in Administration > Repositories."
    options:
      - label: "Type your answer"
        description: "Select and type your repo key"
  - header: "JFrog Username"
    question: "Enter your JFrog login email (e.g., user@email.com)"
    options:
      - label: "Type your answer"
        description: "Select and type your email"
  - header: "JFrog Password/Access Token"
    question: "Enter your JFrog Access Token (Administration > User Management > Access Tokens > Generate Token)"
    options:
      - label: "Type your answer"
        description: "Select and paste your access token"
  - header: "JFrog Project Key"
    question: "Enter your JFrog Project Key (e.g., demo-sdlc-jfrog-key). Find in Administration > All Projects > Project Key column."
    options:
      - label: "Type your answer"
        description: "Select and type your project key"
```


### Set GitHub Secrets and Variables (Automated)

The JFrog credentials are set by the `set-secrets.js` script along with
SONAR_TOKEN. See
[GitHub Secrets and Variables Setup](#github-secrets-and-variables-setup)
for full instructions.

> **Note:** The script is run **once** after all services (0.1-0.5) are
> onboarded, not after each individual service.


---

## 0.6 - Huawei Cloud Compute (Deployment)

### Setup Instructions

> **Ask the user via the `question` tool — two questions:**
>
> **Q1: Compute target type?**
> - **ECS** (Elastic Cloud Server) — single VM, SSH + Docker deployment
> - **CCE** (Cloud Container Engine) — Kubernetes cluster, kubectl/helm deployment
> - **CCI** (Cloud Container Instance) — serverless containers, kubectl deployment
> - **BMS** (Bare Metal Server) — dedicated hardware, SSH + Docker deployment
>
> **Q2: Provisioning strategy?**
> - **Option A: Existing instance** — user already has the compute resource, provide connection details
> - **Option B: Create new with Terraform** — DevOps Agent provisions via Terraform MCP
>   (requires Huawei Cloud AK/SK credentials)

---

### Compute Target Reference

| Target | Terraform Resources | Deployment Method | Best For |
|--------|--------------------|-------------------|----------|
| **ECS** | `huaweicloud_compute_instance`, `huaweicloud_vpc`, `huaweicloud_vpc_subnet`, `huaweicloud_networking_secgroup`, `huaweicloud_vpc_eip` | SSH + docker pull + docker run | Single-instance apps, simple deployments |
| **CCE** | `huaweicloud_cce_cluster`, `huaweicloud_cce_node_pool`, `huaweicloud_vpc`, `huaweicloud_vpc_subnet` | kubectl apply / helm install | Microservices, auto-scaling, K8s workloads |
| **CCI** | `huaweicloud_cciv2_namespace`, `huaweicloud_cciv2_instance` | kubectl apply | Serverless containers, burst traffic |
| **BMS** | `huaweicloud_bms_instance`, `huaweicloud_vpc`, `huaweicloud_vpc_subnet` | SSH + docker pull + docker run | High-performance, dedicated hardware |

> The DevOps Agent uses Terraform MCP Registry tools to discover the exact resource
> arguments for the selected compute target before writing Terraform config.

---

### Option A: Existing Compute Instance

#### ECS / BMS (SSH-based)

1. User has already provisioned an ECS or BMS instance
2. **SSH Key Generation** (handled automatically by the pipeline):
   - Check if SSH key pair already exists:

     **Windows (PowerShell):**
     ```powershell
     $sshKey = "$env:USERPROFILE\.ssh\id_rsa"
     if (-not (Test-Path $sshKey)) {
       ssh-keygen -t rsa -b 4096 -f $sshKey -N '""'
       Write-Output "SSH key pair generated at ~/.ssh/id_rsa"
     }
     ```

     **macOS/Linux (Bash):**
     ```bash
     sshKey="$HOME/.ssh/id_rsa"
     if [ ! -f "$sshKey" ]; then
       ssh-keygen -t rsa -b 4096 -f "$sshKey" -N ""
       echo "SSH key pair generated at ~/.ssh/id_rsa"
     fi
     ```
3. **Add public key to instance** (handled automatically using `add_ssh_key.py` template):
   - Generate `add_ssh_key.py` from `references/templates/add_ssh_key.py` template
   - Run: `python add_ssh_key.py`
   - Verify: `ssh -i $sshKey -o BatchMode=yes <USER>@<HOST> "echo OK"`
4. **Install Docker** (handled automatically via SSH):
   ```bash
   ssh -i $sshKey <USER>@<HOST> "apt-get update && apt-get install -y docker.io && systemctl start docker && systemctl enable docker && docker --version"
   ```
5. **Configure Docker login to JFrog** (handled automatically via SSH):
   ```bash
   ssh -i $sshKey <USER>@<HOST> "echo '<JFROG_PASSWORD>' | docker login <JFROG_DOCKER_REGISTRY> -u '<JFROG_USERNAME>' --password-stdin"
   ```
6. **Ensure security group/firewall** allows SSH (port 22) and application ports.
   See "Application Port Discovery" below.

#### CCE / CCI (Kubernetes-based)

1. User has already provisioned a CCE cluster or CCI namespace
2. **Get kubeconfig** from Huawei Cloud console:
   - CCE: Console → CCE → cluster → Connection → kubeconfig
   - CCI: Console → CCI → namespace → kubeconfig
3. **Save kubeconfig** to `~/.kube/config` (or specify path)
4. **Verify cluster access**:
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```
5. **Configure container registry secret** for JFrog:
   ```bash
   kubectl create secret docker-registry jfrog-secret \
     --docker-server=<JFROG_DOCKER_REGISTRY> \
     --docker-username=<JFROG_USERNAME> \
     --docker-password=<JFROG_PASSWORD>
   ```
6. **Ensure security group/firewall** allows application ports.
   See "Application Port Discovery" below.

---

### Option B: Create New with Terraform

> **The DevOps Agent provisions the compute resource via Terraform using the
> Terraform MCP Server.** See `references/agents/devops-agent.md` →
> "Terraform MCP Server Configuration & Installation Prerequisites" section.

**Prerequisites (DevOps Agent installs these if missing):**
1. **Go** (>= 1.26) — `winget install GoLang.Go` (Windows) / `brew install go` (macOS)
2. **Terraform CLI** (>= 1.15) — `winget install Hashicorp.Terraform` (Windows) / `brew install hashicorp/tap/terraform` (macOS)
3. **Terraform MCP Server** — `go install github.com/hashicorp/terraform-mcp-server/cmd/terraform-mcp-server@latest`
4. **TFC credentials** — create `%APPDATA%\terraform.d\credentials.tfrc.json` (Windows) or `~/.terraform.d/credentials.tfrc.json` (macOS/Linux)
5. **MCP config** — add `terraform` entry to `.codeartsdoer/mcp/mcp_settings.json`:
   ```json
   "terraform": {
     "command": "<TERRAFORM_MCP_SERVER_PATH>",
     "args": ["stdio"],
     "disabled": false,
     "timeout": 120000
   }
   ```
   Where `<TERRAFORM_MCP_SERVER_PATH>` is the absolute path to the binary:
   - **Windows:** `%USERPROFILE%\go\bin\terraform-mcp-server.exe`
   - **macOS/Linux:** `~/go/bin/terraform-mcp-server`
6. **Health check** — after adding the MCP entry, verify the connection:
   - The `terraform` MCP server should appear as **connected** in the IDE's MCP server list
   - Quick validation: call `Terraform_Registry_listProviders` with query `huaweicloud` and confirm `huaweicloud/huaweicloud` appears in results
   - If not connected: ask the user to restart CodeArts Agent, then retry

**Provisioning flow (DevOps Agent executes):**
1. Use Terraform MCP Registry tools to discover the HuaweiCloud provider (`huaweicloud/huaweicloud`)
2. Use `Terraform_Registry_resourceArgumentDetails` to discover the resource schema for the selected compute target (e.g., `huaweicloud_cce_cluster` for CCE)
3. **Discover application ports** (see "Application Port Discovery" below)
4. Write Terraform config files (`main.tf`, `variables.tf`, `outputs.tf`, `terraform.tfvars`)
5. Validate resource arguments via `terraform providers schema -json`
6. Run `terraform init` → `terraform plan` → `terraform apply -auto-approve`
7. Capture outputs:
   - ECS/BMS: instance ID, public IP, private IP
   - CCE: cluster ID, node pool ID, kubeconfig
   - CCI: namespace, instance ID
8. Post-provisioning setup:
   - ECS/BMS: SSH + install Docker + JFrog login (same as Option A steps 4-5)
   - CCE/CCI: fetch kubeconfig + create JFrog registry secret (same as Option A steps 2-5)

**Terraform resource templates per compute target:**

<details>
<summary>ECS (click to expand)</summary>

```hcl
# VPC, subnet, security group, EIP, compute_instance
resource "huaweicloud_compute_instance" "this" {
  name              = "${var.name_prefix}-ecs"
  flavor_id         = var.flavor_id
  image_id          = data.huaweicloud_images_image.this.id
  security_groups   = [huaweicloud_networking_secgroup.this.name]
  admin_pass         = var.admin_pass
  # ...
}
```
</details>

<details>
<summary>CCE (click to expand)</summary>

```hcl
# VPC, subnet, cce_cluster, cce_node_pool
resource "huaweicloud_cce_cluster" "this" {
  name              = "${var.name_prefix}-cce"
  flavor_id         = var.cce_flavor_id
  vpc_id            = huaweicloud_vpc.this.id
  subnet_id         = huaweicloud_vpc_subnet.this.id
  container_network_type = "eni"
  # ...
}

resource "huaweicloud_cce_node_pool" "this" {
  cluster_id         = huaweicloud_cce_cluster.this.id
  name               = "${var.name_prefix}-nodepool"
  initial_node_count = var.node_count
  flavor_id          = var.node_flavor_id
  # ...
}
```
</details>

<details>
<summary>CCI (click to expand)</summary>

```hcl
# VPC, subnet, cciv2_namespace, cciv2_instance
resource "huaweicloud_cciv2_namespace" "this" {
  name = "${var.name_prefix}-cci"
  # ...
}

resource "huaweicloud_cciv2_instance" "this" {
  namespace = huaweicloud_cciv2_namespace.this.name
  name      = "${var.name_prefix}-app"
  # ...
}
```
</details>

<details>
<summary>BMS (click to expand)</summary>

```hcl
# VPC, subnet, bms_instance
resource "huaweicloud_bms_instance" "this" {
  name              = "${var.name_prefix}-bms"
  flavor_id         = var.bms_flavor_id
  image_id          = data.huaweicloud_images_image.this.id
  # ...
}
```
</details>

#### Ask User for Huawei Cloud Credentials (DevOps Agent -> question tool)

> **CRITICAL:** AK/SK MUST be collected via the `question` tool - never ask the
> user to type secrets into a chat message or hardcode them in any file that is
> not gitignored. The `question` tool keeps sensitive input out of the visible
> conversation transcript.

Offer options via the `question` tool:

```
question: [
  {
    "question": "Provide your Huawei Cloud Access Key ID (AK). You can find this in the Huawei Cloud console under My Credentials -> Access Keys.",
    "header": "Huawei Cloud AK",
    "options": [
      { "label": "Enter AK", "description": "Type your Access Key ID (starts with 'HPC' or similar prefix)" }
    ]
  },
  {
    "question": "Provide your Huawei Cloud Secret Access Key (SK). This is the secret key paired with your AK.",
    "header": "Huawei Cloud SK",
    "options": [
      { "label": "Enter SK", "description": "Type your Secret Access Key (40-character alphanumeric string)" }
    ]
  }
]
```

The user types their AK and SK via the `question` tool's custom answer field.
The DevOps Agent reads the returned values and writes them directly into
`terraform.tfvars`:

```hcl
access_key = "<HUAWEI_CLOUD_AK>"
secret_key = "<HUAWEI_CLOUD_SK>"
```

**Ask the user (Option B only) - remaining fields via question tool:**
1. **Huawei Cloud Access Key ID** (AK) -> collected via `question` tool above
2. **Huawei Cloud Secret Access Key** (SK) -> collected via `question` tool above
3. **Region** - default: `ap-southeast-3` (ask via `question` tool with the following options):
   - **Asia Pacific:** `ap-southeast-1` (Hong Kong), `ap-southeast-2` (Bangkok), `ap-southeast-3` (Singapore), `ap-southeast-4` (Jakarta), `ap-southeast-6` (Kuala Lumpur), `ap-southeast-7` (Manila)
   - **Chinese Mainland:** `cn-north-4` (Beijing 4), `cn-north-1` (Beijing 1), `cn-east-3` (Shanghai 1), `cn-east-2` (Shanghai 2), `cn-east-1` (Qingdao), `cn-south-1` (Guangzhou), `cn-southwest-2` (Guiyang 1)
   - **EMEA:** `tr-west-1` (Istanbul), `me-east-1` (Riyadh), `af-north-1` (Cairo), `af-south-1` (Johannesburg)
   - **LATAM:** `na-mexico-1` (Mexico City), `sa-brazil-1` (São Paulo), `sa-chile-1` (Santiago), `sa-argentina-1` (Buenos Aires), `sa-peru-1` (Lima)
4. **Compute target-specific config:**
   - ECS/BMS: flavor (ask via `question` tool, see options below), OS image (`Ubuntu 22.04 server 64bit`)
   - CCE: cluster flavor, node flavor, node count (`2`)
   - CCI: namespace name

   **ECS Flavor Options** (General Computing — [source](https://support.huaweicloud.com/intl/en-us/productdesc-ecs/ecs_01_0020.html)):

   | Series | Flavor | vCPUs | Memory (GiB) | vCPU:Memory | Best For |
   |--------|--------|-------|-------------|-------------|----------|
   | **X2** (FlexusX, QingTian) | `x2.1vcpu` | 1 | user-defined | flexible | Light workloads, dev/test |
   | | `x2.2vcpu` | 2 | user-defined | flexible | |
   | | `x2.4vcpu` | 4 | user-defined | flexible | |
   | | `x2.8vcpu` | 8 | user-defined | flexible | |
   | | `x2.12vcpu` | 12 | user-defined | flexible | Medium workloads |
   | | `x2.16vcpu` | 16 | user-defined | flexible | |
   | **X1** (FlexusX, KVM) | `x1.1vcpu` | 1 | user-defined | flexible | Light workloads, dev/test |
   | | `x1.2vcpu` | 2 | user-defined | flexible | |
   | | `x1.4vcpu` | 4 | user-defined | flexible | |
   | | `x1.8vcpu` | 8 | user-defined | flexible | Medium workloads |
   | | `x1.12vcpu` | 12 | user-defined | flexible | |
   | | `x1.16vcpu` | 16 | user-defined | flexible | |
   | **S7** (3rd Gen Intel) | `s7.small.1` | 1 | 1 | 1:1 | Cheapest, minimal |
   | | `s7.medium.2` | 1 | 2 | 1:2 | Light dev/test |
   | | `s7.medium.4` | 1 | 4 | 1:4 | Light dev/test |
   | | `s7.large.2` | 2 | 4 | 1:2 | Small web apps |
   | | `s7.large.4` | 2 | 8 | 1:4 | Small web apps |
   | | `s7.xlarge.2` | 4 | 8 | 1:2 | Medium web apps |
   | | `s7.xlarge.4` | 4 | 16 | 1:4 | Medium web apps |
   | | `s7.2xlarge.2` | 8 | 16 | 1:2 | Heavy workloads |
   | | `s7.2xlarge.4` | 8 | 32 | 1:4 | Heavy workloads |
   | **S6** (2nd Gen Intel) | `s6.small.1` | 1 | 1 | 1:1 | Cheapest, minimal |
   | | `s6.medium.2` | 1 | 2 | 1:2 | Light dev/test |
   | | `s6.medium.4` | 1 | 4 | 1:4 | Light dev/test |
   | | `s6.large.2` | 2 | 4 | 1:2 | Small web apps |
   | | `s6.large.4` | 2 | 8 | 1:4 | Small web apps |
   | | `s6.xlarge.2` | 4 | 8 | 1:2 | Medium web apps |
   | | `s6.xlarge.4` | 4 | 16 | 1:4 | Medium web apps |
   | | `s6.2xlarge.2` | 8 | 16 | 1:2 | Heavy workloads |
   | | `s6.2xlarge.4` | 8 | 32 | 1:4 | Heavy workloads |
   | **Sn3** (Intel Scalable) | `sn3.small.1` | 1 | 1 | 1:1 | Cheapest, minimal |
   | | `sn3.medium.2` | 1 | 2 | 1:2 | Light dev/test |
   | | `sn3.large.2` | 2 | 4 | 1:2 | Small web apps |
   | | `sn3.xlarge.2` | 4 | 8 | 1:2 | Medium web apps |
   | | `sn3.2xlarge.2` | 8 | 16 | 1:2 | Heavy workloads |
   | | `sn3.4xlarge.2` | 16 | 32 | 1:2 | Very heavy workloads |

   > **Default recommendation:** `s6.large.2` (2 vCPU, 4 GiB) — good balance for
   > dev/test and small web apps. Use `s6.small.1` for absolute cheapest.
   > X2/X1 (FlexusX) allow flexible memory sizing — ideal when you need custom
   > vCPU-to-memory ratios.

> **CRITICAL:** AK/SK are stored in `terraform.tfvars` (gitignored). NEVER commit
> secrets to version control. Mark credential variables as `sensitive = true`.
> AK/SK must ONLY be collected via the `question` tool - never as plain text in
> the conversation. After writing `terraform.tfvars`, the DevOps Agent should
> immediately verify the file is listed in `.gitignore`.

---

### Application Port Discovery (All Targets)

> **The DevOps Agent discovers which ports the application needs by analyzing the
> application artifacts — NOT by asking the user.** This applies to all compute
> targets and both provisioning options.

**Port discovery sources (check in order):**

| Source | Pattern | Example |
|--------|---------|---------|
| `Dockerfile` | `EXPOSE <port>` lines | `EXPOSE 80` → port 80 |
| `docker-compose.yml` | `ports:` under service definitions | `"8080:80"` → port 8080 (host) |
| `package.json` | `scripts.start` with `--port` flag | `vite --port 5173` → port 5173 |
| Backend config | Framework-specific default ports | FastAPI=8000, Express=3000, Django=8000 |
| `.env` / `.env.example` | `PORT=<n>` or `<SERVICE>_PORT=<n>` | `API_PORT=3000` → port 3000 |

**Discovery procedure:**
1. Read `Dockerfile` → extract all `EXPOSE` directives
2. Read `docker-compose.yml` → extract all `ports:` entries (use host port)
3. Read `package.json` (if Node.js) → check `scripts.start` for `--port`
4. Read `.env` / `.env.example` → check for `PORT` or `*_PORT` variables
5. Deduplicate and merge all discovered ports
6. **Option A**: open the discovered ports in the existing security group via Huawei Cloud console or API
7. **Option B**: write the `app_ports` variable in `terraform.tfvars`:
   ```hcl
   app_ports = [
     { port = 3000, cidr = "0.0.0.0/0" },
     { port = 8080, cidr = "0.0.0.0/0" }
   ]
   ```

> **CRITICAL:** Port 22 (SSH) is always added separately — never put 22 in
> `app_ports`. `app_ports` is for application ingress only.

---

### Ask the user

**Option A (Existing instance):**

ECS / BMS:
1. **Host IP** — Example: `114.119.182.219`
2. **User** — Example: `root`
3. **Password** — Example: `Admin123.`
4. **App Directory** — Default: `/app`
5. **Docker Registry** — Same as `JFROG_DOCKER_REGISTRY`
6. **SSH Key Path** — Default: `~/.ssh/id_rsa` (auto-detected)

CCE / CCI:
1. **Cluster/Namespace name** — Example: `my-cce-cluster`
2. **kubeconfig path** — Default: `~/.kube/config`
3. **Docker Registry** — Same as `JFROG_DOCKER_REGISTRY`

**Option B (Create with Terraform):**
1. **Huawei Cloud Access Key ID** (AK) -> via `question` tool (see "Ask User for Huawei Cloud Credentials" section above)
2. **Huawei Cloud Secret Access Key** (SK) -> via `question` tool (see "Ask User for Huawei Cloud Credentials" section above)
3. **Region** - Default: `ap-southeast-3` (via `question` tool — see region options in "Ask User for Huawei Cloud Credentials" section above)
4. **Compute target-specific config** (flavor — see ECS Flavor Options table above, image, node count, etc.)
5. **App Directory** - Default: `/app`
6. **Docker Registry** - Same as `JFROG_DOCKER_REGISTRY`

> **NOTE:** SSH key pair is generated automatically if it doesn't exist.
> Docker installation and JFrog Docker login are also automated during onboarding.

> **NOTE - Option A:** The user must manually set up instance access.
> **NOTE - Option B:** The DevOps Agent handles everything via Terraform + SSH/kubectl.

---

## 0.7 - Playwright CLI (E2E Testing Skill) - Auto-Provisioned

> ▶ **IF SELECTED** (item 7, `playwright`). If NOT selected, skip this entire
> section. Step 5 (E2E testing) is skipped; the Tester Agent produces a "no E2E
> coverage" sign-off note.

The `playwright-cli` skill is required by the Tester Agent (Step 5). The PM Agent
auto-installs it during onboarding - **no manual user action is needed**.

### Auto-Install Procedure (run via bash)

1. **Idempotency check**: if `.codeartsdoer/skills/playwright-cli/SKILL.md` already
   exists AND is not a junction/symlink, skip installation - the skill is already
   available.
   ```powershell
   # Windows (PowerShell)
   $p = ".codeartsdoer/skills/playwright-cli"
   if ((Test-Path "$p/SKILL.md") -and -not (Get-Item $p).LinkType) { Write-Output "Already installed" }
   ```
   ```bash
   # macOS/Linux (Bash)
   [ -f ./.codeartsdoer/skills/playwright-cli/SKILL.md ] && [ ! -L ./.codeartsdoer/skills/playwright-cli ] && echo "Already installed"
   ```
2. **Install** the skill from Microsoft's repository (use `--yes` for non-interactive):
   ```bash
   npx skills add https://github.com/microsoft/playwright-cli --skill playwright-cli --yes
   ```
3. **Check if a junction/symlink was created** at `.codeartsdoer/skills/playwright-cli`.
   The `npx skills add --yes` command may create a junction pointing to
   `.agents/skills/playwright-cli` instead of copying the real files. Junctions
   must be replaced with real files to avoid dependency on the `.agents/` directory.

   **Windows (PowerShell):**
   ```powershell
   $p = Get-Item ".codeartsdoer/skills/playwright-cli" -ErrorAction SilentlyContinue
   if ($p -and $p.LinkType) {
       # It's a junction - replace with real files
       $p.Delete()
       Copy-Item -Path ".agents/skills/playwright-cli" -Destination ".codeartsdoer/skills/playwright-cli" -Recurse -Force
       [System.IO.Directory]::Delete("$PWD/.agents", $true)
       Write-Output "Junction replaced with real files, .agents removed"
   } elseif (Test-Path ".agents/skills/playwright-cli") {
       # No junction but files are in .agents - move them
       Move-Item ".agents/skills/playwright-cli" ".codeartsdoer/skills/playwright-cli"
       [System.IO.Directory]::Delete("$PWD/.agents", $true)
       Write-Output "Files moved from .agents to .codeartsdoer/skills"
   }
   ```

   **macOS/Linux (Bash):**
   ```bash
   if [ -L ./.codeartsdoer/skills/playwright-cli ]; then
       rm ./.codeartsdoer/skills/playwright-cli
       mv ./.agents/skills/playwright-cli ./.codeartsdoer/skills/playwright-cli
       rm -rf ./.agents
       echo "Symlink replaced with real files, .agents removed"
   elif [ -d ./.agents/skills/playwright-cli ]; then
       mv ./.agents/skills/playwright-cli ./.codeartsdoer/skills/playwright-cli
       rm -rf ./.agents
       echo "Files moved from .agents to .codeartsdoer/skills"
   fi
   ```
4. **Verify** the skill landed as real files (not a junction):

   **Windows (PowerShell):**
   ```powershell
   $p = Get-Item ".codeartsdoer/skills/playwright-cli"
   Write-Output "Exists: $(Test-Path "$p/SKILL.md") | LinkType: $($p.LinkType)"
   # LinkType should be empty (real files, not junction)
   ```

   **macOS/Linux (Bash):**
   ```bash
   test -f ./.codeartsdoer/skills/playwright-cli/SKILL.md && [ ! -L ./.codeartsdoer/skills/playwright-cli ] && echo "OK" || echo "MISSING"
   ```

   If verification fails, re-run the install and report the error to the user.
5. **Register** the skill as enabled by appending to
   `.codeartsdoer/skills/ProjectSkillStatus.txt`:
   ```
   playwright-cli=true
   ```
6. **Verify `.agents/` directory is removed** (should not exist after step 3):
   ```powershell
   # Windows
   Test-Path .agents  # Should return False
   ```
   ```bash
   # macOS/Linux
   [ ! -d ./.agents ] && echo "OK" || echo ".agents still exists - remove manually"
   ```

> The Tester Agent declares `playwright-cli: allow` in its skill permissions, so once
> installed it is automatically invocable from Step 5.

---

## 0.8 - Methodology Tool Setup (SDD / TDD / DDD Tools)

> ▶ **IF SELECTED** (items 8 to 20). This step sets up methodology tools selected
> in Step 0.0.5. For each selected tool: VERIFY (existing-tool rule) -> INSTALL
> only if missing -> CONNECT if it needs a connection -> SMOKE TEST. Do not
> proceed until every selected tool passes its smoke test.
>
> **Playwright (item 7)** is already installed in Step 0.7 - skip it here.
> **SDD Toolkit (item 8)** needs no installation - it uses CodeArts Agent's
> native spec/design capability. Skip it here (permissions are handled by the
> `apply-tool-selections` script).

### Existing-Tool Rule (check FIRST, before any install)

For each selected methodology tool, check whether it ALREADY exists in the
environment - the CLI is on PATH, the MCP entry is present in
`.codeartsdoer/mcp/mcp_settings.json`, the dependency is in the project's
package/build file, or the corresponding skill is installed. If it exists and
its smoke test passes, USE the existing installation as-is - do NOT reinstall,
reconfigure, or duplicate it. Only run the install steps below for tools that
are genuinely missing or failing their smoke test.

### Credential Handling (applies to ANY tool that requires an API key/token)

Follow this exact procedure whenever a selected tool needs a credential:

1. **CHECK first**: look for an existing credential in the tool's own config
   location (e.g. the MCP settings file, a `.env` file, or an already-set
   environment variable). If found, skip to step 5.
2. **ASK the user** in one short message: which credential is needed, where to
   generate it (exact settings page), and the minimum scope/permission to grant.
3. **STORE it** in the correct place for that tool:
   - MCP-connected tools -> write the literal value into the MCP settings file
     (`.codeartsdoer/mcp/mcp_settings.json`); do not use environment-variable
     placeholders (unverified in CodeArts Agent).
   - CLI tools -> put the value in a `.env` file or export it as an environment
     variable; NEVER hardcode it into source files or test files.
   - Immediately ensure `.env` (and any file containing a secret) is listed in
     `.gitignore` BEFORE the value is written.
4. **NEVER print, echo, or log the credential value** back to the user, and
   never include it in commits, PRDs, or generated docs. Refer to it only by
   name (e.g. `POSTMAN_API_KEY`).
5. **VALIDATE** with the lightest possible authenticated call (the tool's smoke
   test below). On an auth failure (401/403): say the key is invalid or lacks
   scope, and repeat from step 2. Maximum 2 retries, then apply the Failure rule.

### SDD Tools

- **OpenSpec** (item 9, when available)
  - Verify: `openspec --version`
  - Install: `npm install -g @fission-ai/openspec@latest`
  - Initialize in the repo: `openspec init` (skip if the openspec directory
    already exists)
  - Smoke test: `openspec list`
  - Credentials: none.


### TDD Tools

- **Postman Skill** (item 12, API testing via Postman MCP)
  - **Install skill file**: copy the Postman skill template from
    `references/templates/SKILL.md` to `.codeartsdoer/skills/postman/SKILL.md`:
    ```powershell
    # Windows (PowerShell)
    New-Item -ItemType Directory -Path ".codeartsdoer/skills/postman" -Force
    Copy-Item "references/templates/SKILL.md" ".codeartsdoer/skills/postman/SKILL.md" -Force
    ```
    ```bash
    # macOS/Linux (Bash)
    mkdir -p .codeartsdoer/skills/postman
    cp references/templates/SKILL.md .codeartsdoer/skills/postman/SKILL.md
    ```
  - **Configure MCP**: add an entry to `.codeartsdoer/mcp/mcp_settings.json`:
    ```json
    "postman": {
      "type": "http",
      "url": "https://mcp.postman.com/minimal",
      "headers": {
        "Authorization": "Bearer <POSTMAN_API_KEY>"
      },
      "disabled": false
    }
    ```
    - Use the `/minimal` endpoint (40 tools, lowest token overhead). EU accounts
      use `mcp.eu.postman.com`.
    - Auth: API key ONLY. Never attempt OAuth - it does not work in CodeArts
      Agent.
    - Write the literal API key value into the config; environment-variable
      placeholders are unverified.
  - Credential: Postman API key (PMAK), collected via the Credential handling
    procedure above. Generate at Postman -> Settings -> API Keys.
  - Smoke test: call a lightweight MCP tool (e.g. list workspaces); on an auth
    error, re-run the Credential handling procedure.

- **Newman** (item 13, API testing via CLI)
  - Verify: `newman --version`
  - Install: `npm install -g newman`
  - Credentials: none for local collection JSON. For cloud collections:
    `newman run "https://api.getpostman.com/collections/<id>?apikey=$POSTMAN_API_KEY"`
    - key via environment variable only.
  - Smoke test: `newman run` against a trivial local collection.

- **Jest** (item 14, Unit testing JS/TS)
  - Verify: `npx jest --version`
  - Install: `npm i -D jest`
  - Smoke test: `npx jest --listTests`
  - Credentials: none.

- **Pytest** (item 15, Unit testing Python)
  - Verify: `pytest --version`
  - Install: `pip install pytest`
  - Smoke test: `pytest --collect-only`
  - Credentials: none.

- **JUnit** (item 16, Unit testing Java)
  - Verify: JUnit 5 dependency present in `pom.xml`/`build.gradle`
  - Install: add `org.junit.jupiter:junit-jupiter` (test scope) to the build file
  - Smoke test: `mvn test` or `gradle test` runs
  - Credentials: none.

- **Vitest** (item 17, Unit testing JS/TS Vite projects)
  - Verify: `npx vitest --version`
  - Install: `npm i -D vitest`
  - Smoke test: `npx vitest list`
  - Credentials: none.

### DDD Tools

These produce text/DSL output, so no installation and no credentials are
required to generate the model. Optional rendering setup:

- **Context Mapper** (item 18)
  - Output is `.cml` DSL text. No install required.
  - Optional rendering: Context Mapper VS Code extension, or
    `context-mapper-cli`.
  - Smoke test: not required (text output).

- **EventStorming** (item 19)
  - Output is structured board text. No install required.
  - The user pastes it into Miro/Excalidraw.
  - Smoke test: not required (text output).

- **Structurizr** (item 20)
  - Output is Structurizr DSL (`workspace.dsl`). No install required to generate.
  - Optional rendering: `structurizr-cli` or structurizr.com.
  - IF pushing to structurizr.com: ask for workspace ID + API key + API secret
    via the Credential handling procedure and pass them from environment
    variables:
    `structurizr.sh push -id $WORKSPACE_ID -key $STRUCTURIZR_KEY -secret $STRUCTURIZR_SECRET -workspace workspace.dsl`
  - Smoke test: not required (text output).

### Failure Rule

If a tool cannot be installed or connected after 2 attempts, report the exact
error to the user with the failing command/output.

- **SDD**: if other SDD tools were also selected, continue with those and mark
  the failed one as skipped (SDD Toolkit / Huawei Built-in always works - no
  install).
- **TDD**: offer the closest alternative in the SAME test layer and stack:
  - API: Postman <-> Newman
  - Unit JS/TS: Jest <-> Vitest
  - Never swap across layers or languages (e.g., never replace Playwright with
    Jest, or Pytest with JUnit).
- **DDD**: all DDD tools produce text output with no install, so failure is
  unlikely. If Structurizr push fails, skip the push (the DSL is still usable
  locally).

Update the saved selection only after the user approves a change.

---

## Collected Values Summary

After all questions are answered, the following values should be collected:

| Variable | Source | Example |
|----------|--------|---------|
| `GITHUB_OWNER` | Step 0.1 | `agentman3334` |
| `GITHUB_REPO` | Step 0.1 | `my-project` |
| `GITHUB_PAT` | Step 0.1 | `ghp_xxxx` |
| `JIRA_CLOUD_ID` | Step 0.2 | `demo-account.atlassian.net` |
| `JIRA_EMAIL` | Step 0.2 | `user@example.com` |
| `JIRA_API_TOKEN` | Step 0.2 | `ATATT3xFfGF0xxxx...` |
| `JIRA_PROJECT_KEY` | Step 0.2 | `SCRUM` |
| `JIRA_MCP_AUTH` | Step 0.2 | Base64 of `email:token` |
| `SONAR_PROJECT_KEY` | Step 0.3 | `agentman3334-key` |
| `SONAR_ORGANIZATION` | Step 0.3 | `agentman3334` |
| `SONAR_TOKEN` | Step 0.3 | `squ_xxxxxxxxxxxx` |
| `SEMGREP_APP_TOKEN` | Step 0.4 | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `SEMGREP_EXECUTABLE_PATH` | Step 0.4 | `C:\...\semgrep.exe` |
| `JFROG_PLATFORM_URL` | Step 0.5 | `https://<your-org>.jfrog.io/` |
| `JFROG_DOCKER_REGISTRY` | Step 0.5 | `<your-org>.jfrog.io` |
| `JFROG_REPO_KEY` | Step 0.5 | `docker-dev-local` |
| `JFROG_USERNAME` | Step 0.5 | `user@example.com` |
| `JFROG_PASSWORD` | Step 0.5 | `eyJ2ZXIi...` (access token) |
| `JFROG_PROJECT` | Step 0.5 | `demo-sdlc-key` |
| `HUAWEI_ECS_HOST` | Step 0.6 | `xxx.xxx.xxx.xxx` |
| `HUAWEI_ECS_USER` | Step 0.6 | `root` |
| `HUAWEI_ECS_SSH_KEY_PATH` | Step 0.6 | `~/.ssh/id_rsa` |
| `HUAWEI_ECS_APP_DIR` | Step 0.6 | `/app` |
| `HUAWEI_ECS_DOCKER_REGISTRY` | Step 0.6 | `<your-org>.jfrog.io` |

---

## GitHub Secrets and Variables Setup

The CI/CD pipeline requires GitHub Actions **secrets** (encrypted) and
**variables** (plain text). Instead of manually clicking through the GitHub UI,
use the `set-secrets.js` template script to set them all at once via the
GitHub REST API.

### What Gets Set

**Secrets** (encrypted - sensitive data):
| Secret | Source |
|--------|--------|
| `SONAR_TOKEN` | From SonarCloud setup (Step 0.3) |
| `JFROG_PASSWORD` | From JFrog setup (Step 0.5, access token) |
| `GITHUB_TOKEN` | Auto-provided by GitHub (no action needed) |

**Variables** (plain text - non-sensitive data):
| Variable | Source |
|----------|--------|
| `JFROG_PLATFORM_URL` | From JFrog setup (Step 0.5) |
| `JFROG_DOCKER_REGISTRY` | From JFrog setup (Step 0.5) |
| `JFROG_USERNAME` | From JFrog setup (Step 0.5) |
| `JFROG_PROJECT` | From JFrog setup (Step 0.5) |

### Automated Setup (Recommended)

Use the `set-secrets.js` template script
(see `references/templates/set-secrets.js`):

**Step 1:** Install the encryption dependency:
```bash
npm install libsodium-wrappers
```

**Step 2:** Copy the template and fill in your values:
```bash
cp .codeartsdoer/skills/sdlc-agentic-pipeline/references/templates/set-secrets.js .
```

**Step 3:** Edit `set-secrets.js` and replace all `<PLACEHOLDER>` values in the
`CONFIG` section with the actual values collected during onboarding
(Steps 0.1-0.5):
```javascript
const CONFIG = {
  GITHUB_OWNER: '<your-github-owner>',               // from Step 0.1
  GITHUB_REPO: '<your-github-repo>',                 // from Step 0.1
  GITHUB_PAT: 'ghp_xxxxxxxxxxxx',                     // from Step 0.1
  SECRETS: {
    SONAR_TOKEN: 'xxxxxxxxxxxxxxxxxxxxxxxx',          // from Step 0.3
    JFROG_PASSWORD: 'eyJ2ZXIi...',                    // from Step 0.5
  },
  VARIABLES: {
    JFROG_PLATFORM_URL: 'https://<your-org>.jfrog.io/',      // from Step 0.5
    JFROG_DOCKER_REGISTRY: '<your-org>.jfrog.io',            // from Step 0.5
    JFROG_USERNAME: '<your-jfrog-email>',                    // from Step 0.5
    JFROG_PROJECT: '<your-jfrog-project-key>',               // from Step 0.5
  },
};
```

**Step 4:** Run the script:
```bash
node set-secrets.js
```

Expected output:
```
Setting GitHub Actions secrets and variables for <your-github-owner>/<your-github-repo>

Variables (plain text):
  VARIABLE JFROG_PLATFORM_URL: OK
  VARIABLE JFROG_DOCKER_REGISTRY: OK
  VARIABLE JFROG_USERNAME: OK
  VARIABLE JFROG_PROJECT: OK

Secrets (encrypted):
  SECRET  SONAR_TOKEN: OK
  SECRET  JFROG_PASSWORD: OK

Done. Verify at: https://github.com/<owner>/<repo>/settings/secrets/actions
```

**Step 5:** Delete the script (it contains secrets in plain text):
```bash
rm set-secrets.js
```

> **IMPORTANT:** Never commit `set-secrets.js` with real values to the
> repository. The template in `references/templates/` uses generic placeholders
> and is safe to commit.

### Manual Setup (Fallback)

If the automated script fails, set them manually in **GitHub Repo > Settings >
Secrets and variables > Actions**:

1. **Secrets** tab > **New repository secret**:
   - `SONAR_TOKEN` = SonarCloud access token
   - `JFROG_PASSWORD` = JFrog access token

2. **Variables** tab > **New repository variable**:
   - `JFROG_PLATFORM_URL` = JFrog platform URL
   - `JFROG_DOCKER_REGISTRY` = JFrog Docker registry hostname
   - `JFROG_USERNAME` = JFrog username/email
   - `JFROG_PROJECT` = JFrog project key

---

## Service Info Usage

| Service | Where Used | Key Fields |
|---------|-----------|------------|
| **GitHub** | MCP, `.env`, CI/CD | `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_PAT` |
| **Jira** | MCP, `.env` | `JIRA_CLOUD_ID`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` |
| **SonarCloud** | MCP, `.env`, CI/CD | `SONAR_PROJECT_KEY`, `SONAR_TOKEN`, `SONAR_ORGANIZATION` |
| **Semgrep** | MCP, `.env` | `SEMGREP_APP_TOKEN` |
| **JFrog** | MCP, `.env`, CI/CD | `JFROG_PLATFORM_URL`, `JFROG_DOCKER_REGISTRY`, `JFROG_REPO_KEY` |
| **Huawei ECS** | `.env`, Deploy step | `HUAWEI_ECS_HOST`, `HUAWEI_ECS_USER`, `HUAWEI_ECS_SSH_KEY_PATH` |

---

## Flow After All Info Collected

Once all service info is confirmed and saved:

> **Conditional config generation:** All config files are generated **including
> only entries for selected tools**. Unselected tools are omitted entirely:
> - `mcp_settings.json` - only MCP entries for selected MCP items (1-5)
> - `.env` - only env var blocks for selected services
> - `ci-cd.yml` - only stages for selected tools (if GitHub selected; no file at all if GitHub not selected)
> - `sonar-project.properties` - only if SonarCloud (3) selected
> - `set-secrets.js` - only secrets/vars for selected services
> If NO MCP servers are selected, write `{"mcpServers": {}}` (empty object).

**For Option A (Existing Repo):**
1. Generate `mcp_settings.json` from template (see `references/templates/mcp-settings.json`)
   - **Local only** - contains secrets, do NOT commit to repo
2. Generate `.env` from template (see `references/templates/env-template.env`)
   - **Local only** - contains secrets, do NOT commit to repo
3. Generate `sonar-project.properties` **ONLY if missing** in the repo (detected during A.4 inventory)
   - **MUST be committed to the repo** - the SonarCloud scanner reads this file from the
     repository root during CI/CD. If it is not in the repo, the scan fails with:
     `ERROR You must define the following mandatory properties for 'Unknown': sonar.projectKey, sonar.organization`
    - Since the PM Agent is read-only, delegate the commit to the Backend Agent
      (or sole developer agent) via a feature branch and PR targeting `dev`:
     ```
     git checkout dev
     git checkout -b docs/sonar-config
     git add sonar-project.properties
     git commit -m "chore: add sonar-project.properties for CI/CD SonarCloud scan"
     git push origin docs/sonar-config
     # Create PR to dev, merge immediately (SDD docs PR - lightweight, no review gates)
     ```
4. **Do NOT generate `ci-cd.yml` or `docker-compose.yml`** - these already exist in the repo.
   If the user requested CI/CD or Docker changes in A.5, the DevOps Agent will handle this
   during Step 3 via a feature branch (git operations only). The developer agent creates
   and merges the PR on DevOps's behalf (NOT during onboarding).
5. Run `set-secrets.js` to set GitHub Secrets and Variables automatically
   (see `references/templates/set-secrets.js` and
   [GitHub Secrets and Variables Setup](#github-secrets-and-variables-setup))
6. Proceed to PM Agent to begin the 10-step agentic SDLC pipeline (see `references/pipeline.md`)

**For Option B (New Repo):**
1. Generate `mcp_settings.json` from template (see `references/templates/mcp-settings.json`)
   - **Local only** - contains secrets, do NOT commit to repo
2. **Fill remaining placeholders in `ci-cd.yml`** (already generated by DevOps Agent in
   Step 0.1.B.4 with build section filled). Replace service-specific placeholders:
   - `<JFROG_REPO_KEY>` with the JFrog repo key from Step 0.5
   - Verify `JFROG_PLATFORM_URL`, `JFROG_DOCKER_REGISTRY`, `JFROG_USERNAME`, `JFROG_PROJECT`
     env vars reference the correct GitHub Action variables
   - Verify `SONAR_TOKEN` secret reference is correct
3. Generate `sonar-project.properties` from template (see `references/templates/sonar-project.properties`)
   - **MUST be committed to the repo** - the SonarCloud scanner reads this file from the
     repository root during CI/CD. Without it, the scan fails.
   - The DevOps Agent should commit this alongside `ci-cd.yml` and `docker-compose.yml`
     when pushing the initial codebase to the `dev` branch in Step 0.1.B.4.
     - If not pushed during Step 0.1.B.4, delegate to the Backend Agent (or sole developer agent) - create a docs branch + PR targeting `dev`:
       ```
       git checkout dev
       git checkout -b docs/sonar-config
       git add sonar-project.properties
       git commit -m "chore: add sonar-project.properties for CI/CD SonarCloud scan"
       git push origin docs/sonar-config
       # Developer Agent creates PR and merges to dev
       ```
4. Generate `.env` from template (see `references/templates/env-template.env`)
   - **Local only** - contains secrets, do NOT commit to repo
5. Run `set-secrets.js` to set GitHub Secrets and Variables automatically
   (see `references/templates/set-secrets.js` and
   [GitHub Secrets and Variables Setup](#github-secrets-and-variables-setup))
6. Proceed to PM Agent to begin the 10-step agentic SDLC pipeline (see `references/pipeline.md`)

---

## Onboarding Flow Diagram

```
  User asks to start agentic flow
              |
              v
  +----------------------------------+
  |  Step 0.0: Auto-provision        |
  |  agent definition files          |
  |  (6 files -> .codeartsdoer/      |
  |   agents/)                       |
  +---------------+------------------+
                  |
                  v
  +==================================+
  ||  Step 0.0.5: MULTI-TOOL       ||
  ||  SELECTION (NEW)              ||
  ||  Q1: MCP servers & services   ||
  ||  Q2: Methodology skills       ||
  ||  -> Write tool-selections.json||
  ||  -> Run apply-tool-selections  ||
  ||    (update agent frontmatter)  ||
  ||  -> Post-selection summary     ||
  ||  -> Dependency warnings        ||
  ||  -> Confirm: Proceed?          ||
  +==================================+
                  |
        +---------+---------+
        |                   |
        v                   v
   GitHub selected    GitHub NOT selected
        |                   |
        v                   v
  +-----------+    +------------------+
  | Step 0.1: |    | Local-only mode  |
  | GitHub    |    | No GitHub MCP    |
  | Option A  |    | No PRs/branches  |
  | or B      |    | No CI/CD         |
  +-----+-----+    +--------+---------+
        |                   |
        +-------+-----------+
                |
                v
  +----------------------------------+
  |  Step 0.2: Jira (IF SELECTED)    |
  |  --> cloud_id, email, token, key |
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.3: SonarCloud            |
  |  (IF SELECTED)                   |
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.4: Semgrep (IF SELECTED) |
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.5: JFrog (IF SELECTED)   |
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.6: Huawei ECS            |
  |  (IF SELECTED)                   |
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.7: Playwright            |
  |  (IF SELECTED) - auto-install    |
  +----------------------------------+
  |  Generate configs (selected      |
  |  tools only):                    |
  |  - mcp_settings.json             |
  |  - .env                          |
  |  - ci-cd.yml (if GitHub)         |
  |  - sonar-project.properties      |
  |    (if SonarCloud)               |
  |  - set-secrets.js (if GitHub)    |
  +---------------+------------------+
                  |
                  v
        Proceed to PM Agent
        (10-step agentic flow)
        -> references/pipeline.md
```

---

## Re-Onboarding & Selection Changes

If the user re-runs Step 0 (re-onboarding):

1. **Check for existing `tool-selections.json`.** If it exists, read current
   selections and pre-populate the multiselect (show which are currently active).
2. **Allow the user to change any selection** - add or remove tools/skills.
3. If a previously-selected **MCP/service** is **removed**: its MCP entry is
   deleted from `mcp_settings.json`, its env vars are removed from `.env`, its
   CI/CD stages are removed.
4. If a previously-selected **methodology skill** is **removed**: its frontmatter
   keys are stripped from agent files (built-in utility skills are never touched).
5. If a previously-unselected item is **added**: run its onboarding sub-step to
   collect credentials (MCPs/services) or grant permissions (methodology skills).
6. **Rewrite `tool-selections.json`** with the new selection and timestamp.
7. **Re-run agent frontmatter post-processing** (`apply-tool-selections.ps1` /
   `.sh`) - it is idempotent and reads the current selection file.

> **Edge case - `tool-selections.json` missing (old onboarding):** Backward
> compatible - treat all tools as selected (full pipeline). Agent prints: "No
> tool selections file found - running full pipeline (all tools)."

> **Edge case - User selects nothing:** Proceed in "local-only mode." All
> remote-dependent steps are skipped. The agent clearly states: "No tools
> selected - pipeline runs in local-only mode with no external integrations."
> Built-in utility skills remain active.