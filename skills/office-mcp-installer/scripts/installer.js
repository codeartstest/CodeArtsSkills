#!/usr/bin/env node
/**
 * Office-MCP Installer for CodeArts (project-scope only)
 *
 * Usage:
 *   node installer.js init      Install office-mcp into the current project
 *   node installer.js update    Rebuild office-mcp from latest source
 *   node installer.js delete    Completely uninstall office-mcp
 *   node installer.js status    Show current install state
 *
 * Project-scope only: locates the project root by walking up for a
 * `.codeartsdoer/` folder. No user-level fallback.
 *
 * Works on Windows, Linux, macOS — only dependency is Node.js (already
 * required by CodeArts) plus git and npm for the build step.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO = 'https://github.com/claude-office-skills/skills.git';
const MCP_NAME = 'office-mcp';
const SERVER_SUBDIR = path.join('mcp-servers', 'office-mcp');
const SKILL_SUBDIR = 'office-mcp';
const KEEP_FILES = new Set(['dist', 'node_modules', 'package.json']);

// ─── helpers ────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function cpDir(src, dest) {
  rmDir(dest);
  fs.cpSync(src, dest, { recursive: true });
}

function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, '.codeartsdoer'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

// ─── paths ──────────────────────────────────────────────────────────────────

function getPaths() {
  const cwd = process.env.INIT_CWD || process.cwd();
  const root = findProjectRoot(cwd);
  if (!root) {
    console.error('Error: not inside a CodeArts project (no .codeartsdoer/ found).');
    console.error('Run this script from within a CodeArts project directory.');
    process.exit(1);
  }
  const mcpDir = path.join(root, '.codeartsdoer', 'mcp');
  const serverDir = path.join(mcpDir, MCP_NAME);
  const mcpConfig = path.join(mcpDir, 'mcp_settings.json');
  const skillsDir = path.join(root, '.codeartsdoer', 'skills');
  const skillDir = path.join(skillsDir, MCP_NAME);
  const statusFile = path.join(skillsDir, 'ProjectSkillStatus.txt');
  return { root, mcpDir, serverDir, mcpConfig, skillsDir, skillDir, statusFile };
}

// ─── MCP config ─────────────────────────────────────────────────────────────

function readMcpConfig(mcpConfig) {
  if (!fs.existsSync(mcpConfig)) return { mcpServers: {} };
  try {
    const data = JSON.parse(fs.readFileSync(mcpConfig, 'utf-8'));
    if (!data.mcpServers || typeof data.mcpServers !== 'object') data.mcpServers = {};
    return data;
  } catch (e) {
    console.error(`Warning: ${mcpConfig} is malformed, resetting. (${e.message})`);
    return { mcpServers: {} };
  }
}

function writeMcpConfig(mcpConfig, config) {
  if (!fs.existsSync(path.dirname(mcpConfig))) {
    fs.mkdirSync(path.dirname(mcpConfig), { recursive: true });
  }
  fs.writeFileSync(mcpConfig, JSON.stringify(config, null, 2) + '\n');
}

function registerMcp(mcpConfig, serverDir) {
  const config = readMcpConfig(mcpConfig);
  const entrypoint = path.join(serverDir, 'dist', 'index.js');
  config.mcpServers[MCP_NAME] = {
    command: toPosix(process.execPath),
    args: [toPosix(entrypoint)]
  };
  writeMcpConfig(mcpConfig, config);
  console.log(`    Registered MCP server in ${path.basename(mcpConfig)}.`);
}

function unregisterMcp(mcpConfig) {
  const config = readMcpConfig(mcpConfig);
  if (config.mcpServers[MCP_NAME]) {
    delete config.mcpServers[MCP_NAME];
    writeMcpConfig(mcpConfig, config);
    console.log(`    Removed '${MCP_NAME}' from MCP config.`);
  } else {
    console.log(`    '${MCP_NAME}' not present in MCP config — skipping.`);
  }
}

// ─── status file ────────────────────────────────────────────────────────────

function updateStatusFile(statusFile, mode) {
  if (!fs.existsSync(statusFile)) {
    fs.writeFileSync(statusFile, '');
  }
  let content = fs.readFileSync(statusFile, 'utf-8').replace(/\r\n/g, '\n');

  if (mode === 'enable') {
    if (!content.split('\n').some(l => l.trim().startsWith(`${MCP_NAME}=`))) {
      content = (content.trim() + `\n${MCP_NAME}=true`).replace(/^\n/, '') + '\n';
      fs.writeFileSync(statusFile, content);
      console.log(`    Enabled '${MCP_NAME}' in ${path.basename(statusFile)}.`);
    } else {
      console.log(`    '${MCP_NAME}' already registered in status file.`);
    }
  } else if (mode === 'disable') {
    const lines = content.split('\n').filter(l => {
      const t = l.trim();
      return t && !t.startsWith(`${MCP_NAME}=`);
    });
    fs.writeFileSync(statusFile, lines.join('\n').trim() + '\n');
    console.log(`    Removed '${MCP_NAME}' from ${path.basename(statusFile)}.`);
  }
}

// ─── server dir cleanup ─────────────────────────────────────────────────────

function cleanServerDir(serverDir) {
  const entries = fs.readdirSync(serverDir, { withFileTypes: true });
  let removed = 0;
  for (const entry of entries) {
    if (KEEP_FILES.has(entry.name)) continue;
    rmDir(path.join(serverDir, entry.name));
    removed++;
  }
  console.log(`    Cleaned ${removed} non-essential item(s); kept dist/, node_modules/, package.json.`);
}

// ─── build ──────────────────────────────────────────────────────────────────

function cloneAndBuild(tmpDir) {
  console.log('==> Cloning repository...');
  rmDir(tmpDir);
  run(`git clone --depth 1 "${REPO}" "${tmpDir}"`);

  const srcServerDir = path.join(tmpDir, SERVER_SUBDIR);
  if (!fs.existsSync(srcServerDir)) {
    console.error(`Error: expected MCP server source at ${SERVER_SUBDIR} in the repo.`);
    process.exit(1);
  }

  console.log('\n==> Installing dependencies...');
  run('npm install --no-audit --no-fund', { cwd: srcServerDir });

  console.log('\n==> Building MCP server...');
  run('npm run build', { cwd: srcServerDir });

  const distEntry = path.join(srcServerDir, 'dist', 'index.js');
  if (!fs.existsSync(distEntry)) {
    console.error('Error: build did not produce dist/index.js.');
    process.exit(1);
  }
  return srcServerDir;
}

// ─── commands ───────────────────────────────────────────────────────────────

function cmdInit(paths) {
  const { root, mcpDir, serverDir, mcpConfig, skillsDir, skillDir, statusFile } = paths;
  console.log(`\nOffice-MCP Init — project: ${root}\n`);
  console.log(`  Server dir   : ${serverDir}`);
  console.log(`  MCP config   : ${mcpConfig}`);
  console.log(`  Skill dir    : ${skillDir}\n`);

  if (fs.existsSync(serverDir)) {
    console.log('==> Existing install detected — replacing. (Use "update" to refresh in place.)');
  }

  const tmpDir = path.join(os.tmpdir(), `office-mcp-init-${process.pid}`);
  const srcServerDir = cloneAndBuild(tmpDir);
  const srcSkillFile = path.join(tmpDir, SKILL_SUBDIR, 'SKILL.md');

  console.log('\n==> Installing MCP server...');
  cpDir(srcServerDir, serverDir);
  cleanServerDir(serverDir);

  console.log('\n==> Installing skill definition...');
  if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir, { recursive: true });
  if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });
  if (fs.existsSync(srcSkillFile)) {
    fs.copyFileSync(srcSkillFile, path.join(skillDir, 'SKILL.md'));
    console.log(`    Copied SKILL.md -> ${skillDir}`);
  } else {
    console.log('    Warning: SKILL.md not found in repo, skipping skill definition.');
  }

  console.log('\n==> Registering...');
  updateStatusFile(statusFile, 'enable');
  registerMcp(mcpConfig, serverDir);

  rmDir(tmpDir);
  console.log('\n==> Done! office-mcp installed. Restart CodeArts to load the 39 Office tools.');
}

function cmdUpdate(paths) {
  const { root, serverDir, mcpConfig, skillsDir, skillDir, statusFile } = paths;
  console.log(`\nOffice-MCP Update — project: ${root}\n`);
  if (!fs.existsSync(serverDir)) {
    console.error('Error: office-mcp is not installed. Run "init" first.');
    process.exit(1);
  }

  const tmpDir = path.join(os.tmpdir(), `office-mcp-update-${process.pid}`);
  const srcServerDir = cloneAndBuild(tmpDir);
  const srcSkillFile = path.join(tmpDir, SKILL_SUBDIR, 'SKILL.md');

  console.log('\n==> Updating MCP server...');
  cpDir(srcServerDir, serverDir);
  cleanServerDir(serverDir);

  console.log('\n==> Updating skill definition...');
  if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });
  if (fs.existsSync(srcSkillFile)) {
    fs.copyFileSync(srcSkillFile, path.join(skillDir, 'SKILL.md'));
    console.log(`    Refreshed SKILL.md -> ${skillDir}`);
  }

  console.log('\n==> Re-registering...');
  updateStatusFile(statusFile, 'enable');
  registerMcp(mcpConfig, serverDir);

  rmDir(tmpDir);
  console.log('\n==> Done! office-mcp updated. Restart CodeArts to apply.');
}

function cmdDelete(paths) {
  const { root, serverDir, mcpConfig, skillDir, statusFile } = paths;
  console.log(`\nOffice-MCP Delete — project: ${root}\n`);

  console.log('==> Removing MCP server...');
  if (fs.existsSync(serverDir)) {
    rmDir(serverDir);
    console.log(`    Removed ${serverDir}`);
  } else {
    console.log('    Server dir not found — skipping.');
  }

  console.log('\n==> Removing skill definition...');
  if (fs.existsSync(skillDir)) {
    rmDir(skillDir);
    console.log(`    Removed ${skillDir}`);
  } else {
    console.log('    Skill dir not found — skipping.');
  }

  console.log('\n==> Unregistering...');
  updateStatusFile(statusFile, 'disable');
  unregisterMcp(mcpConfig);

  console.log('\n==> Done! office-mcp fully uninstalled from this project.');
}

function cmdStatus(paths) {
  const { root, serverDir, mcpConfig, skillDir, statusFile } = paths;
  console.log(`\nOffice-MCP Status — project: ${root}\n`);

  const serverOk = fs.existsSync(path.join(serverDir, 'dist', 'index.js'));
  console.log(`  MCP server       : ${serverOk ? 'installed' : 'NOT installed'}`);
  if (serverOk) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(serverDir, 'package.json'), 'utf-8'));
      console.log(`  Server version   : ${pkg.version || 'unknown'}`);
    } catch (e) { /* ignore */ }
    console.log(`  Server path      : ${serverDir}`);
  }

  const config = readMcpConfig(mcpConfig);
  const cfgOk = !!config.mcpServers[MCP_NAME];
  console.log(`  MCP config entry : ${cfgOk ? 'registered' : 'NOT registered'}`);
  if (cfgOk) {
    console.log(`  Config path      : ${mcpConfig}`);
  }

  const skillOk = fs.existsSync(path.join(skillDir, 'SKILL.md'));
  console.log(`  Skill definition : ${skillOk ? 'installed' : 'NOT installed'}`);

  let statusOk = false;
  if (fs.existsSync(statusFile)) {
    const content = fs.readFileSync(statusFile, 'utf-8');
    statusOk = content.split('\n').some(l => l.trim().startsWith(`${MCP_NAME}=true`));
  }
  console.log(`  Status file      : ${statusOk ? 'enabled' : 'NOT enabled'}`);

  const healthy = serverOk && cfgOk && skillOk && statusOk;
  console.log(`\n  Overall          : ${healthy ? 'HEALTHY' : 'INCOMPLETE'}\n`);
  process.exit(healthy ? 0 : 1);
}

// ─── main ───────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command || !['init', 'update', 'delete', 'status'].includes(command)) {
    console.error('Usage: node installer.js <init|update|delete|status>');
    console.error('');
    console.error('  init    Install office-mcp into the current project');
    console.error('  update  Rebuild office-mcp from latest source');
    console.error('  delete  Completely uninstall office-mcp');
    console.error('  status  Show current install state');
    console.error('');
    console.error('Project-scope only. Run from within a CodeArts project.');
    process.exit(1);
  }

  const paths = getPaths();
  switch (command) {
    case 'init':    cmdInit(paths); break;
    case 'update':  cmdUpdate(paths); break;
    case 'delete':  cmdDelete(paths); break;
    case 'status':  cmdStatus(paths); break;
  }
}

main();