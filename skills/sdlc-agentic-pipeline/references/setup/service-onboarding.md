# Step 0 - Service Onboarding Guide

Before any agentic flow begins, walk the user through each platform setup one by one.
Ask the questions below, collect answers, and fill the templates at the end.

> **Do you want to start with an existing GitHub repository or create a new one
> from a prompt and then push to GitHub?**

---

## 0.1 - GitHub

### Setup Instructions

1. Create a GitHub account at https://github.com/ (or sign in with Gmail)
2. Create a Personal Access Token:
   - Go to **Settings > Developer settings > Personal access tokens > Tokens (classic) > Generate new token (classic)**
   - Select scopes: `repo`, `workflow`, `admin:org` (as needed)
   - Copy the token - you won't see it again

### Option A: Existing Repository

Ask the user:

1. **GitHub Owner** - e.g., `agentman3334`
2. **GitHub Repo** - e.g., `my-project`
3. **Default Branch** - e.g., `main`
4. **GitHub PAT** - the personal access token from step 2

### Option B: New Repository from Prompt

Ask the user:

1. **GitHub Owner** - e.g., `agentman3334`
2. **New Repo Name** - e.g., `my-new-project`
3. **Visibility** - public or private
4. **Project Prompt** - description of what to build
5. **GitHub PAT** - the personal access token from step 2

Then:
- Create the repo on GitHub
- Generate the project from the prompt
- Push initial code to the repo

### Fills into `mcp_settings.json`

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
8. **Convert token to Base64** (PowerShell):
   ```powershell
   [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("<JIRA_EMAIL>:<JIRA_API_TOKEN>"))
   ```
   Use the result as the `Authorization: Basic <result>` in MCP config

### Ask the user

1. **Jira Cloud ID** - e.g., `demo-account.atlassian.net`
2. **Jira Email** - e.g., `user@example.com`
3. **Jira API Token** - from step 7
4. **Jira Project Key** - from step 4 (e.g., `SCRUM`)
5. **Jira MCP Auth (Base64)** - the result from step 8

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

> [!WARNING]
> **CRITICAL WARNING:** Before collecting SonarCloud credentials below, the user
> MUST confirm they have disabled Automatic Analysis in SonarCloud. If this is
> not done, the GitHub Actions CI/CD pipeline will crash during the SonarCloud
> scan stage. Surface this warning proactively to the user.

### Ask the user

1. **Sonar Project Key** - e.g., `agentman3334-key` (auto-generated from org import)
2. **Sonar Organization** - e.g., `agentman3334`
3. **Sonar Token** - from step 3

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

---

## 0.4 - Semgrep

### Setup Instructions

1. Go to https://semgrep.dev/ - click **Try for free**
2. **Continue with GitHub** -> Authorize
3. **Create new organization**
4. In **Scan your code with Semgrep** section, choose **CLI**
5. **Install Semgrep locally**:
   - Windows: https://docs.semgrep.dev/getting-started/quickstart/#windows-beta
   - After install, find the executable path (e.g., `C:\Users\<user>\AppData\Local\Programs\Python\Python314\Scripts\semgrep.exe`)
6. **Create CLI token**:
   - Run: `semgrep login` - this will generate a `SEMGREP_APP_TOKEN`
   - Or generate from Semgrep App > Settings > API Tokens

### Ask the user

1. **Semgrep App Token** - from step 6
2. **Semgrep Executable Path** - from step 5 (Windows only)

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

### Setup Instructions

1. Go to https://jfrog.com/ - click **Try JFrog free trial**
2. **Login with company email** (use https://temp-mail.org/ for disposable email if needed) - verify code sent to mail
3. **Edit Hostname** - e.g., `https://codeartsagentjfrog.jfrog.io` - this becomes your `JFROG_PLATFORM_URL`
4. **Create a password** - this is only for platform login
5. **Generate Admin Access Token**:
   - In JFrog Platform UI, go to **Administration > User Management > Access Tokens**
   - Generate a token with admin privileges - copy the token value
6. **Create a project** - specify name and key
7. **Create a repository**:
   - **Local Repository > Docker** - specify repository key (e.g., `docker-dev-local`)
   - Do NOT disable XRay
   - Note the Docker URL shown (e.g., `https://codeartsagentjfrog.jfrog.io/artifactory/api/docker/<repo-key>`)
8. **Set up Docker client**:
   - Generate token -> Write your platform password -> Click **Generate Token & Create Instructions**
   - Run: `docker login <JFROG_DOCKER_REGISTRY>`
   - Note the auth config shown

### Ask the user

1. **JFrog Platform URL** - e.g., `https://demoartifacthw.jfrog.io/`
2. **JFrog Docker Registry** - e.g., `demoartifacthw.jfrog.io`
3. **JFrog Repo Key** - Docker repo key (e.g., `docker-dev-local`)
4. **JFrog Username** - the email used for login
5. **JFrog Password/Access Token** - from step 5
6. **JFrog Project Key** - from step 6

> **NOTE - Manual Auth Required:** The user must add JFrog credentials as GitHub Secrets (see GitHub Secrets Template below).

### Fills into `mcp_settings.json`

```json
"jfrog": {
  "url": "<JFROG_PLATFORM_URL>/mcp",
  "headers": {
    "Authorization": "Bearer <JFROG_ACCESS_TOKEN>"
  }
}
```

---

## 0.6 - Huawei Cloud ECS (Deployment)

### Setup Instructions

1. Provision an ECS instance on Huawei Cloud
2. **Add SSH key** to ECS instance (`~/.ssh/authorized_keys`)
3. **Install Docker** on the ECS instance and ensure it's running
4. **Configure Docker login** for JFrog registry on ECS: `docker login <JFROG_DOCKER_REGISTRY>`
5. **Ensure security group/firewall** allows SSH (port 22) and app port access

### Ask the user

1. **ECS Host IP** - e.g., `119.8.185.52`
2. **ECS User** - e.g., `root`
3. **SSH Key Path** - e.g., `~/.ssh/id_rsa`
4. **App Directory** - e.g., `/app`
5. **ECS Docker Registry** - e.g., `demoartifacthw.jfrog.io`

> **NOTE - Manual Auth Required:** The user must manually set up ECS access (steps 2-5).

---

## 0.7 - Playwright CLI (E2E Testing Skill) - Auto-Provisioned

The `playwright-cli` skill is required by the Tester Agent (Step 5). The PM Agent
auto-installs it during onboarding - **no manual user action is needed**.

### Auto-Install Procedure (run via bash)

1. **Idempotency check**: if `.codeartsdoer/skills/playwright-cli/SKILL.md` already
   exists, skip installation - the skill is already available.
2. **Install** the skill from Microsoft's repository:
   ```bash
   npx skills add https://github.com/microsoft/playwright-cli --skill playwright-cli
   ```
3. **Move** the installed skill into the project skills directory. The source path
   varies by OS - locate the `playwright-cli` folder (commonly
   `~/.agents/skills/playwright-cli`) and move it:
   - PowerShell (Windows): `Move-Item ~/.agents/skills/playwright-cli ./.codeartsdoer/skills/playwright-cli`
   - Bash (Linux/macOS): `mv ~/.agents/skills/playwright-cli ./.codeartsdoer/skills/playwright-cli`
   If the folder is elsewhere, search for it first and move from the found location.
4. **Verify** the skill landed:
   ```powershell
   Test-Path ./.codeartsdoer/skills/playwright-cli/SKILL.md
   ```
   If verification fails, re-run the install and report the error to the user.
5. **Register** the skill as enabled by appending to
   `.codeartsdoer/skills/ProjectSkillStatus.txt`:
   ```
   playwright-cli=true
   ```

> The Tester Agent declares `playwright-cli: allow` in its skill permissions, so once
> installed it is automatically invocable from Step 5.

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
| `JIRA_API_TOKEN` | Step 0.2 | `ATATT3xFfGF0...` |
| `JIRA_PROJECT_KEY` | Step 0.2 | `SCRUM` |
| `JIRA_MCP_AUTH` | Step 0.2 | Base64 of `email:token` |
| `SONAR_PROJECT_KEY` | Step 0.3 | `agentman3334-key` |
| `SONAR_ORGANIZATION` | Step 0.3 | `agentman3334` |
| `SONAR_TOKEN` | Step 0.3 | `1c4347fc0303...` |
| `SEMGREP_APP_TOKEN` | Step 0.4 | `666342569a3d...` |
| `SEMGREP_EXECUTABLE_PATH` | Step 0.4 | `C:\...\semgrep.exe` |
| `JFROG_PLATFORM_URL` | Step 0.5 | `https://demoartifacthw.jfrog.io/` |
| `JFROG_DOCKER_REGISTRY` | Step 0.5 | `demoartifacthw.jfrog.io` |
| `JFROG_REPO_KEY` | Step 0.5 | `docker-dev-local` |
| `JFROG_USERNAME` | Step 0.5 | `user@example.com` |
| `JFROG_PASSWORD` | Step 0.5 | Access token |
| `JFROG_PROJECT` | Step 0.5 | Project key |
| `HUAWEI_ECS_HOST` | Step 0.6 | `119.8.185.52` |
| `HUAWEI_ECS_USER` | Step 0.6 | `root` |
| `HUAWEI_ECS_SSH_KEY_PATH` | Step 0.6 | `~/.ssh/id_rsa` |
| `HUAWEI_ECS_APP_DIR` | Step 0.6 | `/app` |
| `HUAWEI_ECS_DOCKER_REGISTRY` | Step 0.6 | `demoartifacthw.jfrog.io` |

---

## GitHub Secrets Template

Remind user to configure these in **GitHub Repo > Settings > Secrets and variables > Actions**:

| Secret | Source |
|--------|--------|
| `JFROG_PLATFORM_URL` | From JFrog setup |
| `JFROG_DOCKER_REGISTRY` | From JFrog setup |
| `JFROG_USERNAME` | From JFrog setup |
| `JFROG_PASSWORD` | From JFrog setup |
| `JFROG_PROJECT` | From JFrog setup |
| `SONAR_TOKEN` | From SonarCloud setup |
| `GITHUB_TOKEN` | Auto-provided by GitHub |

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
1. Generate `mcp_settings.json` from template (see `references/templates/mcp-settings.json`)
2. Generate `ci-cd.yml` from template (see `references/templates/ci-cd.yml`)
3. Generate `sonar-project.properties` from template (see `references/templates/sonar-project.properties`)
4. Generate `.env` from template (see `references/templates/env-template.env`)
5. Remind user to set GitHub Secrets
6. Proceed to PM Agent to begin the 10-step agentic SDLC pipeline

---

## Onboarding Flow Diagram

```
  User asks to start agentic flow
              |
              v
  +----------------------------------+     Option A: Existing repo
  |  Step 0.1: Ask GitHub            | --> owner, repo, branch, PAT
  |  Existing repo or new from prompt|     Option B: New repo
  |                                  | --> owner, name, vis, prompt, PAT
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.2: Walk through Jira     |
  |  --> cloud_id, email, token, key |
  |  --> Generate Base64 auth for MCP|
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.3: Walk through          |
  |  SonarCloud setup                |
  |  --> project_key, org, token     |
  |  --> DISABLE Automatic Analysis! |
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.4: Walk through          |
  |  Semgrep setup                   |
  |  --> app_token, exe_path         |
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.5: Walk through          |
  |  JFrog setup                     |
  |  --> url, registry, repo_key,    |
  |    username, password, project   |
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.6: Walk through          |
  |  Huawei ECS setup                |
  |  --> host, user, ssh_key, dir    |
  +---------------+------------------+
                  |
                  v
  +----------------------------------+
  |  Step 0.7: Auto-install          |
  |  Playwright CLI skill            |
  +----------------------------------+
  |  Generate all templates:         |
  |  - mcp_settings.json             |
  |  - ci-cd.yml                     |
  |  - sonar-project.properties      |
  |  - .env                          |
  |  Remind: GitHub Secrets          |
  +---------------+------------------+
                  |
                  v
        Proceed to PM Agent
        (10-step agentic flow)
```