---
name: sdlc-agentic-pipeline
description: >-
  Orchestrate a complete multi-agent Software Development Life Cycle (SDLC) pipeline
  powered by Huawei Cloud CodeArts Agent. Coordinates 6 specialized agents (PM, Backend,
  Frontend, Code Reviewer, Tester, DevOps) across 10 steps from requirement breakdown
  through deployment and sprint retrospective. Integrates GitHub, Jira, SonarCloud,
  Semgrep, JFrog Artifactory, Playwright, and Huawei Cloud ECS. Trigger when the user
  asks to start an agentic flow, SDLC pipeline, agentic DevOps pipeline, multi-agent
  development workflow, or any prompt related to initiating the end-to-end agentic
  software delivery lifecycle.
---

# SDLC Agentic Pipeline

A multi-agent SDLC orchestration skill that drives an entire software delivery
lifecycle — from requirements to deployment — using **Huawei Cloud CodeArts Agent**.
Six agents collaborate asynchronously through Jira comments as a message bus,
enforcing quality gates, error throwback, and human-in-the-loop checkpoints.

## Architecture at a Glance

```
+---------------------------------------------------------------------------+
|                    SDLC AGENTIC PIPELINE - 6 AGENTS                       |
+---------------------------------------------------------------------------+
|                                                                           |
|  +-------------+   +--------------+   +---------------+                   |
|  | PM Agent    |   | Backend Agent|   | Frontend Agent|                   |
|  | (orchestr.) |   | (server code)|   | (UI code)     |                   |
|  +------+------+   +------+-------+   +-------+-------+                   |
|         |                 |                   |                           |
|         |   Jira comments = inter-agent message bus                        |
|         |                 |                   |                           |
|  +------v------+   +------v-------+   +-------v-------+                   |
|  | Code        |   | Tester Agent |   | DevOps Agent  |                   |
|  | Reviewer    |   | (Playwright) |   | (CI/CD+JFrog) |                   |
|  | (Semgrep)   |   +--------------+   +---------------+                   |
|  +-------------+                                                           |
|                                                                           |
+---------------------------------------------------------------------------+
```

## Trigger

Activate this skill when the user asks to start an agentic flow, SDLC pipeline,
agentic DevOps pipeline, multi-agent development workflow, or any prompt related
to initiating the end-to-end agentic software delivery lifecycle.

## Prerequisites

Before the pipeline can run, **Step 0 (Service Onboarding)** must be completed.
Walk the user through setting up all 7 services and generating config files.
See `references/setup/service-onboarding.md` for the full onboarding guide.

The `playwright-cli` skill (used by the Tester Agent in Step 5) is **auto-provisioned**
during Step 0 onboarding - no manual installation is required.

> [!WARNING]
> **Critical setup conflict:** Before any CI/CD pipeline runs, the user MUST
> disable **SonarCloud Automatic Analysis** (Project Dashboard > Administration >
> Analysis Method > OFF). If both Automatic Analysis and the GitHub Actions
> SonarCloud scan are enabled, the CI/CD workflow crashes with:
> `"You are running CI analysis while Automatic Analysis is enabled"`.
> Surface this warning proactively to the user before collecting SonarCloud
> credentials.

## MCP Servers Required

The pipeline depends on the following MCP servers configured in
`.codeartsdoer/mcp/mcp_settings.json`:

| MCP Server | Purpose | Auth |
|------------|---------|------|
| `atlassian-rovo-mcp` | Jira tasks, sprints, comments, transitions | Basic (Base64 `email:token`) |
| `github` | Repos, branches, PRs, reviews, workflow dispatch | Bearer PAT |
| `sonarqube` | Quality gate, issues, coverage, hotspots | Bearer token |
| `semgrep` | Local static analysis, security scanning | App token env |
| `jfrog` | Artifactory build/artifact verification | Bearer access token |

See `references/templates/mcp-settings.json` for the template.

## The 10-Step Pipeline

```
+---------------------------------------------------------------------------+
|  STEP  AGENT(S)            ACTION                                         |
+---------------------------------------------------------------------------+
|   0    PM (onboarding)     Gather all service info, generate configs      |
|   1    PM                  Requirement breakdown, PRD, Jira task creation |
|   2    PM                  Sprint start (Jira Agile API) + SDD setup      |
|   3    Frontend/Backend    Code dev, branching, PR, unit tests            |
|   4    Code Reviewer       Semgrep scan, security, GitHub PR review       |
|   5    Tester              Playwright E2E testing, bug reporting          |
|   6    DevOps              CI/CD pipeline via GitHub Actions (manual)     |
|   7    DevOps              JFrog Artifactory verify + SonarCloud QG       |
|   8    PM                  Release review (all sign-offs checked)         |
|   9    PM                  Deploy to Huawei Cloud ECS                     |
|  10    PM                  Sprint close, retrospective, next planning     |
+---------------------------------------------------------------------------+
```

### Detailed End-to-End Flow

```
  User: "start agentic flow"
            |
            v
+-------------------------+     references/setup/
| STEP 0: Service         | --> service-onboarding.md
| Onboarding              |     (7 services, config generation)
| GitHub, Jira, Sonar,    |
| Semgrep, JFrog, ECS,    |
| Playwright              |
+-----------+-------------+
            |  configs saved: mcp_settings.json, ci-cd.yml,
            |                 sonar-project.properties, .env
            v
+-------------------------+
| STEP 1: PM Agent        |
| Requirement Breakdown   |
| - Repo analysis (GitHub)|
| - PRD creation          |
| - Jira task creation    |
| - Req review by F/B     |
+-----------+-------------+
            |  all tasks approved by Frontend + Backend
            v
+-------------------------+
| STEP 2: PM Agent        |
| Sprint Start + SDD      |
| - Jira Agile REST API   |
| - Create/start sprint   |
| - SDD: spec/design/tasks|
| - Push SDD to GitHub    |
+-----------+-------------+
            |  sprint active, SDD docs pushed
            v
+-------------------------+
| STEP 3: Frontend +      |
| Backend Agents          |
| Code Development        |
| - Jira -> In Progress   |
| - Branch: feature/...   |
| - Write code + unit test|
| - PR created            |
| - Jira -> In Review     |
+-----------+-------------+
            |  PR ready
            v
+-------------------------+
| STEP 4: Code Reviewer   |
| Semgrep + Security Scan |
| - PR diff analysis      |
| - Local Semgrep scan    |
| - GitHub PR review      |
| - Secret scanning       |
+-----------+-------------+
            |  APPROVE or REQUEST_CHANGES (throwback)
            v
+-------------------------+
| STEP 5: Tester Agent    |
| E2E via Playwright      |
| - Test scenarios        |
| - Run E2E suite         |
| - Bug reporting (Jira)  |
| - Coverage monitoring   |
+-----------+-------------+
            |  E2E sign-off or bug throwback
            v
+-------------------------+
| STEP 6: DevOps Agent    |
| CI/CD Pipeline          |
| - Manual trigger (API)  |
| - Monitor run status    |
| - Detect failures       |
+-----------+-------------+
            |  CI green
            v
+-------------------------+
| STEP 7: DevOps Agent    |
| JFrog + SonarCloud      |
| - Verify JFrog artifacts|
| - SonarCloud QG check   |
| - Security hotspots     |
| - Coverage verify       |
+-----------+-------------+
            |  Quality Gate PASSES
            v
+-------------------------+
| STEP 8: PM Agent        |
| Release Review          |
| - All sign-offs checked |
| - SonarCloud QG green   |
| - Human approval        |
| - Jira tasks -> Done    |
+-----------+-------------+
            |  release approved
            v
+-------------------------+
| STEP 9: PM Agent        |
| Deploy to Huawei ECS    |
| - SSH + docker pull     |
| - docker-compose up     |
| - Health check          |
| - Rollback on failure   |
+-----------+-------------+
            |  deployment live
            v
+-------------------------+
| STEP 10: PM Agent       |
| Sprint Close + Retro    |
| - Close sprint (API)    |
| - Velocity metrics      |
| - Retrospective comment |
| - Next sprint planning  |
+-------------------------+
```

## Agent Reference

Each agent has a dedicated role definition in `references/agents/`. The PM Agent
is the orchestrator (`mode: all`); all others run as subagents (`mode: subagent`).

| Agent | File | Steps | Key Responsibility |
|-------|------|-------|--------------------|
| PM | `pm-agent.md` | 0, 1, 2, 8, 9, 10 | Orchestration, PRD, sprint mgmt, release, deploy, retro |
| Backend | `backend-agent.md` | 1, 2, 3 | Server code, APIs, DB, API tests |
| Frontend | `frontend-agent.md` | 1, 2, 3 | UI code, components, unit tests |
| Code Reviewer | `code-reviewer-agent.md` | 4 | Semgrep scan, security, PR review |
| Tester | `tester-agent.md` | 5 | Playwright E2E, bug reporting, coverage |
| DevOps | `devops-agent.md` | 6, 7 | CI/CD, JFrog verify, SonarCloud QG |

## Jira Status Lifecycle

```
  To Do ---> In Progress ---> In Review ---> In Testing ---> Done
  (created)   (dev starts)    (PR ready)     (E2E testing)  (PM release)

  Error throwback transitions:
  +-------------------+-------------------+-----------------------------------+
  | From              | To                | Reason                            |
  +-------------------+-------------------+-----------------------------------+
  | In Review         | In Progress       | Code review found issues          |
  | In Testing        | In Progress       | E2E test found bugs               |
  | In Testing        | In Review         | Test environment issue (not code) |
  | Release Review    | In Progress       | Release gate failed               |
  +-------------------+-------------------+-----------------------------------+
```

## Agent Routing Labels

Jira labels (NOT assignee) route tasks to the correct agent:

| Label | Routes To |
|-------|-----------|
| `agent:frontend` | Frontend Agent |
| `agent:backend` | Backend Agent |
| `agent:code-reviewer` | Code Reviewer Agent |
| `agent:devops` | DevOps Agent |
| `agent:tester` | Tester Agent |
| `agent:pm` | PM Agent |

**Domain labels:** `frontend` `backend` `bug` `test` `security` `devops`
`release` `documentation` `feature` `refactor`

## Inter-Agent Messaging

All inter-agent communication happens via **Jira comments** using this format:

```
@agent:<target-agent> <message>
```

Examples:
- `@agent:backend Please review requirements - confirm feasibility, flag gaps`
- `@agent:code-reviewer PR #42 ready for review - backend implementation complete`
- `@agent:devops E2E sign-off complete - all tests passing, ready for CI/CD`

## Task Discovery (JQL)

| Agent | JQL |
|-------|-----|
| Frontend | `labels = agent:frontend AND status = "To Do"` |
| Backend | `labels = agent:backend AND status = "To Do"` |
| Code Reviewer | `labels = agent:code-reviewer AND status = "In Review"` |
| Tester | `labels = agent:tester AND status = "In Review"` |
| DevOps | `labels = agent:devops AND status = "In Review"` |
| PM | `labels = agent:pm AND status = "To Do"` |

## Branch Naming Convention

```
feature/<agent>/<short-description>   e.g. feature/backend/projects-tasks-api
fix/<agent>/<short-description>       e.g. fix/backend/sql-injection
```

## PR Merge Gate (Enforced by PM Agent)

A PR may only be merged when ALL of the following are satisfied:

1. All GitHub Check Runs pass (CI green)
2. SonarCloud Quality Gate passes
3. Code Reviewer Agent sign-off comment exists on Jira task
4. Tester Agent E2E sign-off comment exists on Jira task
5. Human approval (via PM Agent question tool)

## Error Throwback Protocol

When any downstream step reports a failure, the PM Agent routes the task back:

```
+---------------------------------------------------------------------------+
|  FAILURE DETECTED                                                         |
|       |                                                                   |
|       v                                                                   |
|  PM Agent receives error via Jira comment                                 |
|  (e.g. @agent:pm E2E test failed on BUG-123)                             |
|       |                                                                   |
|       v                                                                   |
|  Identify failing step + owning agent                                     |
|       |                                                                   |
|       +--> Code issue        -> "In Progress", @agent:frontend/backend    |
|       +--> Code review issue -> "In Review",  @agent:code-reviewer        |
|       +--> CI/CD issue       -> "In Progress", @agent:devops              |
|       +--> Test issue        -> "In Review",  @agent:tester               |
|       |                                                                   |
|       v                                                                   |
|  PM Agent tracks re-work until resolved                                   |
|       |                                                                   |
|       v                                                                   |
|  Normal flow resumes from the fixed step onward                           |
+---------------------------------------------------------------------------+
```

## Human-in-the-Loop Checkpoints

The pipeline requires explicit human approval at these points:

| Checkpoint | Step | Tool |
|------------|------|------|
| SDD document review before pushing to GitHub | 2 | `question` tool |
| Release approval before deployment | 8 | `question` tool |
| Deployment authorization to Huawei ECS | 9 | `question` tool |

## Critical Setup Warnings (Surface Proactively)

> [!WARNING]
> 1. **SonarCloud Automatic Analysis conflict**: MUST be disabled before any
>    CI/CD run. If left enabled alongside the GitHub Actions scan, the pipeline
>    crashes. Requires Project Administrator permissions.
> 2. **Jira direct REST API 401**: Direct calls to `{site}.atlassian.net` with
>    Basic auth return 401. Must use the Atlassian API gateway
>    (`api.atlassian.com/ex/jira/{cloudUuid}/rest/...`). Discover the cloud UUID
>    by calling `atlassian-rovo-mcp_getVisibleJiraProjects` and extracting it
>    from the `self` URL in the response.
> 3. **Jira sprint name length**: Must be shorter than 30 characters or the API
>    returns 400.
> 4. **Sprint field value type**: `customfield_10020` (Sprint) must be a number,
>    NOT an array - e.g. `{ "customfield_10020": 34 }`.
> 5. **Manual integrations required**: GitHub<->Jira, GitHub<->SonarCloud, and
>    GitHub<->Semgrep links must be configured manually in each platform's UI.

## Config Templates

Ready-to-fill templates are in `references/templates/`:

| Template | Description |
|----------|-------------|
| `mcp-settings.json` | MCP server configuration for all 5 services |
| `ci-cd.yml` | GitHub Actions workflow (sonar-scan -> generic build -> deploy-to-jfrog) |
| `sonar-project.properties` | SonarCloud project configuration |
| `env-template.env` | Environment variables for all services |

## Execution Notes

- The PM Agent is the only agent that can authorize deployment and close sprints.
- Tester Agent exclusively owns E2E/Playwright tests; Frontend/Backend own unit
  and component tests. Do NOT cross this boundary.
- SonarCloud MCP only reads remote analysis results - it cannot perform local
  analysis. Use Semgrep MCP for local scanning.
- CI/CD is manually triggered (not on every push) to ensure only reviewed, tested
  code enters the pipeline.
- All SDD documents (`spec.md`, `design.md`, `tasks.md`) are pushed to GitHub so
  all agents can access them.

## Sharing This Skill

To share this skill with others:

1. Copy the entire `sdlc-agentic-pipeline/` directory into the recipient's
   project `.codeartsdoer/skills/` directory.
2. Append `sdlc-agentic-pipeline=true` to their
   `.codeartsdoer/skills/ProjectSkillStatus.txt`.
3. The recipient should then run Step 0 (Service Onboarding) to configure their
   own service credentials before starting a pipeline run.