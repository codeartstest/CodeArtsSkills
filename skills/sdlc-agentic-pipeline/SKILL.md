---
name: sdlc-agentic-pipeline
description: >-
  Orchestrate a complete multi-agent Software Development Life Cycle (SDLC) pipeline
  powered by Huawei Cloud CodeArts Agent. Coordinates 7 specialized agents (PM, Backend,
  Frontend, Code Reviewer, Tester, DevOps, Design-Architecture) across 10 steps from
  requirement breakdown through deployment and sprint retrospective. Integrates GitHub,
  Jira, SonarCloud, Semgrep, JFrog Artifactory, Playwright, and Huawei Cloud ECS.
  Trigger when the user asks to start an agentic flow, SDLC pipeline, agentic DevOps
  pipeline, multi-agent development workflow, or any prompt related to initiating the
  end-to-end agentic software delivery lifecycle.
---

# SDLC Agentic Pipeline

A multi-agent SDLC orchestration skill that drives an entire software delivery
lifecycle — from requirements to deployment — using **Huawei Cloud CodeArts Agent**.
Seven agents collaborate asynchronously through Jira comments as a message bus,
enforcing quality gates, error throwback, and human-in-the-loop checkpoints.

## Architecture at a Glance

```
+---------------------------------------------------------------------------+
|                    SDLC AGENTIC PIPELINE - 7 AGENTS                       |
+---------------------------------------------------------------------------+
|                                                                           |
|  +-------------+   +--------------+   +---------------+                   |
|  | PM Agent    |   | Backend Agent|   | Frontend Agent|                   |
|  | (orchestr.) |   | (server code)|   | (UI code)     |                   |
|  | READ-ONLY   |   | GIT WRITE    |   | GIT WRITE     |                   |
|  | repo access |   | owns clone,  |   | owns clone,   |                   |
|  | (minimal    |   | commit,push, |   | commit,push,  |                   |
|  |  GitHub MCP)|   | branch, PR,  |   | branch, PR    |                   |
|  | NEVER git   |   | create_repo, |   |               |                   |
|  |             |   | PR MERGE     |   | PR MERGE      |                   |
|  |             |   | (primary     |   | (when sole    |                   |
|  |             |   |  when both)  |   |  developer)   |                   |
|  +------+------+   +------+-------+   +-------+-------+                   |
|         |                 |                   |                           |
|         |   Jira comments = inter-agent message bus                        |
|         |                 |                   |                           |
|  +------v------+   +------v-------+   +-------v-------+                   |
|  | Code        |   | Tester Agent |   | DevOps Agent  |                   |
|  | Reviewer    |   | (Playwright) |   | (CI/CD+JFrog) |                   |
|  | (PR Review) |   +--------------+   | GIT WRITE     |                   |
|  +-------------+                      | (infra only)  |                   |
|                                       | NO PR create  |                   |
|                                       | NO PR merge   |                   |
|                                       | Read-only GH: |                   |
|                                       | branch list,  |                   |
|                                       | code search,  |                   |
|                                       | PR read       |                   |
|                                       | Steps 6,7,9:  |                   |
|                                       | CI/CD, JFrog, |                   |
|                                       | deployment    |                   |
|                                       +---------------+                   |
|                                                                           |
|  +-------------------+                                                    |
|  | Design-Architecture|  (Step 0.DA, conditional)                        |
|  | (DDD/SDD/TDD)     |  Task classification, methodology execution        |
|  +-------------------+  Curated handoff to implementation                 |
|                                                                           |
+---------------------------------------------------------------------------+
```

### PR Operation Routing

The DevOps Agent does NOT create or merge PRs. PR operations are routed to
developer agents based on which developer(s) are active:

| Scenario | PR Operations Owner | PR Ops |
|----------|---------------------|--------|
| Only Frontend Agent active | Frontend Agent | `create_pull_request`, `merge_pull_request` |
| Only Backend Agent active | Backend Agent | `create_pull_request`, `merge_pull_request` |
| Both Frontend + Backend active | Backend Agent (primary) | `create_pull_request`, `merge_pull_request` |

This applies to ALL PR operations: Step 5 (auto-merge feature PRs),
Step 7 (release merge), Step 9 (report push), Option A Step 3 (infra PRs).

## Trigger

Activate this skill when the user asks to start an agentic flow, SDLC pipeline,
agentic DevOps pipeline, multi-agent development workflow, or any prompt related
to initiating the end-to-end agentic software delivery lifecycle.

## Prerequisites

Before the pipeline can run, **Step 0 (Service Onboarding)** must be completed.
Step 0 auto-provisions the 7 agent definition files (from `references/agents/`
to `.codeartsdoer/agents/`), runs the **multi-tool selection** (Step 0.0.5),
and then walks the user through setting up only the **selected** services and
generating config files. Methodology tools (SDD/TDD/DDD) are set up in
**Step 0.8**. See `references/setup/service-onboarding.md` for the full guide.

### Step 0.0.5 - Multi-Tool Selection

After auto-provisioning agent files, the PM Agent presents a multiselect screen
where the user picks any combination of MCP servers, services, and methodology
skills. The selection is persisted to `.codeartsdoer/tool-selections.json` and
drives all downstream behavior. See `references/setup/multi-tool-selection-plan.md`.

The 7 agent files bundled in the skill at `references/agents/`:
- `pm-agent.md`, `backend-agent.md`, `frontend-agent.md`,
  `code-reviewer-agent.md`, `tester-agent.md`, `devops-agent.md`,
  `design-architecture-agent.md`
- Auto-copied to `.codeartsdoer/agents/` during Step 0.0
- Idempotent: re-running overwrites with the latest version

The `playwright-cli` skill (used by the Tester Agent in Step 5) is
**auto-provisioned** during Step 0 onboarding.

> **WARNING:** Before any CI/CD pipeline runs, the user MUST disable
> SonarCloud Automatic Analysis. See
> `references/setup/critical-warnings.md#WARN-SONAR-AUTO`.

## The Pipeline (9 Steps + Design Phase)

> **Conditional steps:** Each step checks `.codeartsdoer/tool-selections.json`
> and degrades gracefully. See `references/pipeline.md` for per-step details.

```
+---------------------------------------------------------------------------+
|  STEP  AGENT(S)            ACTION                                         |
+---------------------------------------------------------------------------+
|   0    PM + Frontend/Backend/DevOps  Onboarding: auto-provision agents,   |
|                                       Opt A (existing repo) or Opt B (new)  |
| 0.DA  Design-Architecture  Design phase: classify task, DDD/SDD/TDD      |
|   1    PM                  Requirement breakdown, PRD, batch Jira tasks  |
|  1b    Frontend/Backend    Requirement review (PARALLEL via Jira async)   |
|   2    PM + Developer      Sprint start + SDD setup                       |
|   3    Frontend/Backend    Code dev (PARALLEL), Semgrep pre-scan, PR     |
|   4    Code Reviewer       PR review (batch), secret scanning, approval  |
|   5    Tester + PM + Dev   E2E testing + auto-merge feature PRs         |
|   6    DevOps              CI/CD (auto-triggered) + JFrog + SonarCloud   |
|   7    PM + Developer      Release review + merge (dev -> main)          |
|   8    PM + DevOps         Deploy auth + execution (Huawei Cloud ECS)    |
|   9    PM + Developer      Sprint close, retro, HTML report              |
+---------------------------------------------------------------------------+
```

### Key Performance Optimizations

1. **Parallel dispatch via Jira async**: Backend + Frontend agents work
   simultaneously (Steps 0, 1b, 3).
2. **Batch Jira operations**: Bulk create API for tasks (Step 1).
3. **PR-based flow for docs/reports**: Docs branch + PR targeting `dev`.
4. **Auto-trigger CI/CD**: `on: push` to `dev` branch (Step 5->6).
5. **Cached builds**: pip, node_modules, Docker layers (Step 6).
6. **Combined CI/CD + verification**: JFrog + SonarCloud QG in pipeline
   stages (Step 6).
7. **Simplified conflict resolution**: Default "prefer dev" strategy.
8. **Node.js 22 LTS** + `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`.
9. `sonarcloud-github-action@master` (not `sonarqube-scan-action`).

### Detailed End-to-End Flow

> See `references/pipeline.md` for the full per-step orchestration reference,
> including the flow diagram, conditional behavior, and idempotency checklist.

## Agent Reference

Each agent has a dedicated role definition bundled in `references/agents/` and
auto-copied to `.codeartsdoer/agents/` during Step 0.0. The PM Agent
is the orchestrator (`mode: all`); all others run as subagents (`mode: subagent`).

| Agent | File | Steps | Key Responsibility |
|-------|------|-------|--------------------|
| PM | `pm-agent.md` | 0, 1, 1b, 2, 5, 7, 8, 9 | Orchestration, PRD, batch Jira ops, sprint mgmt, release auth, retro |
| Backend | `backend-agent.md` | 0, 1b, 2, 3, 5, 7, 9 | Server code, APIs, DB, PR operations (primary when both active) |
| Frontend | `frontend-agent.md` | 0, 1b, 2, 3, 5, 7, 9 | UI code, components, PR operations (when sole developer) |
| Code Reviewer | `code-reviewer-agent.md` | 4 | Batch PR review, secret scanning, approval sign-off |
| Tester | `tester-agent.md` | 5 | Playwright E2E, bug reporting, coverage |
| DevOps | `devops-agent.md` | 0, 6, 8 | CI/CD, JFrog verify, SonarCloud QG, deployment (NO PR operations) |
| Design-Architecture | `design-architecture-agent.md` | 0.DA | Task classification, DDD/SDD/TDD methodology execution, curated handoff |

> **Shared developer behavior** (git ops, SDD setup, Semgrep scan, PR routing,
> Steps 5/7/9) is defined in `references/agents/shared/developer-agent-base.md`.
> Each developer agent overrides only its domain-specific sections.

## MCP Servers Required

> **Conditional:** MCP servers are configured only for selected tools.
> See `references/config-reference.md` for the full table.

## Methodology Skills (Multi-Tool Selection)

During Step 0.0.5, the PM Agent presents **4 grouped multiselect questions**.
The user selects which tools to enable. Everything downstream is conditional.

### Question 1 — MCP Servers & Services

| Tool | Description | Config Output |
|------|-------------|---------------|
| GitHub | Repo access, branches, PRs | `mcp_settings.json`, `.env` |
| Jira (Atlassian) | Task tracking, sprints, messaging | `mcp_settings.json`, `.env` |
| SonarCloud | Code quality gate, coverage | `mcp_settings.json`, `sonar-project.properties`, `.env` |
| Semgrep | Local static analysis, security | `mcp_settings.json`, `.env` |
| JFrog Artifactory | Docker image storage, artifact verify | `.env`, GitHub secrets |
| Huawei Cloud ECS | Deployment target (SSH, Docker) | `.env`, `add_ssh_key.py` |

### Question 2 — SDD (Spec-Driven Development)

| Tool | Status | Description | Granted To |
|------|--------|-------------|------------|
| SDD Toolkit (Huawei Built-in) | Available | Spec, design, tasks docs | PM, Backend, Frontend, Design-Architecture |
| OpenSpec | Available | Alternative spec methodology | PM, Backend, Frontend, Design-Architecture |

> First selected = PRIMARY; others = SUPPLEMENTARY.

### Question 3 — TDD (Test-Driven Development)

| Tool | Status | Layer | Description | Granted To |
|------|--------|-------|-------------|------------|
| Playwright CLI | Available | E2E | Browser testing | Tester |
| Postman Skill | Available | API | API testing via MCP | Backend, Design-Architecture |
| Newman | Available | API | Postman collections via CLI/CI | Backend |
| Jest | Available | Unit | JavaScript/TypeScript | Backend, Frontend |
| Pytest | Available | Unit | Python | Backend |
| JUnit | Available | Unit | Java (JUnit 5) | Backend |
| Vitest | Available | Unit | JS/TS (Vite-based) | Backend, Frontend |

> Each tool owns its own test layer. All selected layers must pass.

### Question 4 — DDD (Domain-Driven Design)

| Tool | Status | Description | Granted To |
|------|--------|-------------|------------|
| Context Mapper | Available | Bounded contexts DSL | Design-Architecture |
| EventStorming | Available | Domain discovery workshop | Design-Architecture |
| Structurizr | Available | C4-model architecture DSL | Design-Architecture |

> First selected = PRIMARY (approval artifact); others = SUPPLEMENTARY.
> Domain model designed ONCE, then re-expressed in each supplementary format.

### Built-in Utility Skills (always on, not selectable)

`ide-tool`, `doc-expert`, `pptx`, `data-analysis`, `prd`, `frontend-design`,
`i18n-integration`

## Permission Setup (Deterministic Configuration)

All agents use a **deny-by-default** permission model. Only explicitly allowed
skills can be invoked.

```yaml
permission:
  skill:
    '*': deny
    ide-tool: allow
```

Additional skills are granted per-agent based on their role:

| Agent | Additional Allowed Skills (beyond `ide-tool`) |
|-------|-----------------------------------------------|
| PM | `creating-sdd-directory`, `data-analysis`, `doc-expert`, `managing-design-document`, `managing-spec-document`, `managing-tasks-document`, `openspec`, `pptx`, `prd` |
| Backend | `creating-sdd-directory`, `managing-spec-document`, `managing-design-document`, `managing-tasks-document`, `openspec` |
| Frontend | `creating-sdd-directory`, `frontend-design`, `i18n-integration`, `managing-spec-document`, `managing-design-document`, `managing-tasks-document`, `openspec` |
| Code Reviewer | _(none)_ |
| Tester | `playwright-cli` |
| DevOps | _(none)_ |
| Design-Architecture | `creating-sdd-directory`, `managing-spec-document`, `managing-design-document`, `managing-tasks-document` + TDD/DDD tool permissions (dynamically granted) |

> **Built-in vs Selectable:** Built-in utility skills are always on. Methodology
> skills are dynamically granted/revoked at onboarding by the
> `apply-tool-selections` script based on `.codeartsdoer/tool-selections.json`
> and `references/skill-registry.json`.

## Directory Structure

```
sdlc-agentic-pipeline/
|-- SKILL.md                              # Skill entry point + pipeline overview
`-- references/
    |-- setup/
    |   |-- service-onboarding.md         # Step 0: service + methodology tool onboarding
    |   |-- multi-tool-selection-plan.md   # Step 0.0.5: multi-tool selection plan
    |   `-- critical-warnings.md           # All critical warnings (single source)
    |-- agents/
    |   |-- pm-agent.md                   # Orchestrator, PRD, sprint mgmt, release auth
    |   |-- backend-agent.md              # Server code, APIs, DB, PR operations (primary)
    |   |-- frontend-agent.md             # UI code, components, PR operations (sole dev)
    |   |-- code-reviewer-agent.md        # Batch PR review, secret scanning, approval
    |   |-- tester-agent.md               # Playwright E2E, bug reporting, coverage
    |   |-- devops-agent.md               # CI/CD, JFrog, SonarCloud, deployment
    |   |-- design-architecture-agent.md   # Step 0.DA: DDD/SDD/TDD methodology execution
    |   `-- shared/
    |       `-- developer-agent-base.md   # Shared developer behavior (git, SDD, PR, etc.)
    |-- pipeline.md                       # Per-step orchestration reference
    |-- branch-strategy.md                # Branch naming, PR merge gate, Jira lifecycle
    |-- report-spec.md                    # Step 9 HTML report specification
    |-- config-reference.md               # Config templates + runtime files reference
    |-- skill-registry.json               # Methodology skill registry (v2)
    `-- templates/
        |-- mcp-settings.json             # MCP server config (conditional)
        |-- ci-cd.yml                     # GitHub Actions workflow template
        |-- sonar-project.properties      # SonarCloud project config
        |-- env-template.env              # Environment variables template
        |-- set-secrets.js                # GitHub Actions secrets/variables setup
        |-- add_ssh_key.py                # Add SSH key to Huawei Cloud ECS
        |-- SKILL.md                      # Postman MCP skill definition (TDD: API layer)
        |-- apply-tool-selections.ps1     # Windows: update agent permissions
        |-- apply-tool-selections.sh      # macOS/Linux: same as above
        `-- sprint-scripts/
            |-- sprint-start.ps1          # Windows: create/start Jira sprint
            |-- sprint-start.sh           # macOS/Linux: same as above
            |-- sprint-close.ps1          # Windows: close Jira sprint
            |-- sprint-close.sh           # macOS/Linux: same as above
            `-- README.md                 # Sprint scripts usage guide
```

## Quick Start

1. **Install the skill** — copy `sdlc-agentic-pipeline/` into your project's
   `.codeartsdoer/skills/` directory.
2. **Enable it** — append `sdlc-agentic-pipeline=true` to
   `.codeartsdoer/skills/ProjectSkillStatus.txt`.
3. **Run Step 0 (Service Onboarding)** — the PM Agent presents 4 multiselect
   questions, then walks you through configuring only the selected services.
4. **Start the pipeline** — say "start agentic flow" and the 9-step pipeline
   runs end-to-end.

## Reference Index

| Topic | File |
|-------|------|
| Per-step orchestration | `references/pipeline.md` |
| Branch strategy & PR merge gate | `references/branch-strategy.md` |
| HTML report specification | `references/report-spec.md` |
| Config templates & runtime files | `references/config-reference.md` |
| Critical warnings (all) | `references/setup/critical-warnings.md` |
| Service onboarding guide | `references/setup/service-onboarding.md` |
| Multi-tool selection plan | `references/setup/multi-tool-selection-plan.md` |
| Methodology skill registry | `references/skill-registry.json` |
| PM Agent definition | `references/agents/pm-agent.md` |
| Backend Agent definition | `references/agents/backend-agent.md` |
| Frontend Agent definition | `references/agents/frontend-agent.md` |
| Code Reviewer Agent definition | `references/agents/code-reviewer-agent.md` |
| Tester Agent definition | `references/agents/tester-agent.md` |
| DevOps Agent definition | `references/agents/devops-agent.md` |
| Design-Architecture Agent definition | `references/agents/design-architecture-agent.md` |
| Shared developer base | `references/agents/shared/developer-agent-base.md` |

## Execution Notes

> **Re-running the pipeline:** The PM Agent checks existing state (sprint,
> tasks, PRs, CI runs, artifacts, deployment) and skips already-completed
> steps. See `references/pipeline.md` for the full idempotency checklist.

- The PM Agent is the only agent that can authorize deployment and close sprints.
- **PM Agent is READ-ONLY** with the repository (minimal GitHub MCP: file
  reading, commit reading). All other GitHub operations delegated to developer
  agents. The PM Agent NEVER runs git commands.
- **DevOps Agent does NOT create or merge PRs.** PR operations routed to
  developer agents (Backend primary, Frontend if sole developer).
- **Existing artifacts are sacred (Option A).** Dockerfiles, docker-compose.yml,
  ci-cd.yml are NEVER modified without explicit user approval.
- Tester Agent exclusively owns E2E/Playwright tests; Frontend/Backend own
  unit and component tests.
- SonarCloud MCP only reads remote analysis results — use Semgrep MCP for
  local scanning.
- CI/CD is **auto-triggered** on push to `dev` (not manual).
- All SDD documents are pushed via a developer agent on a docs branch + PR
  targeting `dev` (GitHub branch protection applies to the whole branch).
- Pipeline degrades gracefully — steps that depend on unselected tools are
  skipped, not errored.

## Sharing This Skill

1. Copy the entire `sdlc-agentic-pipeline/` directory into the recipient's
   project `.codeartsdoer/skills/` directory.
2. Append `sdlc-agentic-pipeline=true` to their
   `.codeartsdoer/skills/ProjectSkillStatus.txt`.
3. The recipient should then run Step 0 (Service Onboarding) to configure
   their own service credentials before starting a pipeline run.
