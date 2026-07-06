#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAME = 'playwright-cli';
const NPM_PACKAGE = '@playwright/cli';
const SKILLS_SOURCE = 'https://github.com/microsoft/playwright-cli';
const BROWSER = 'chromium';

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

function runCapture(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
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

function getSkillsDir(scope, root) {
  if (scope === 'user') return path.join(os.homedir(), '.codeartsdoer', 'skills');
  return path.join(root, '.codeartsdoer', 'skills');
}

function installSkillFiles(scope, root) {
  console.log('\n==> Step 1: Installing skill files...');
  const globalFlag = scope === 'user' ? '-g' : '';
  const cmd = [
    'npx', '-y', 'skills', 'add', SKILLS_SOURCE,
    '--skill', SKILL_NAME,
    '-a', 'codearts-agent',
    '--copy',
    '-y',
    globalFlag,
  ].filter(Boolean).join(' ');
  const opts = scope === 'project' ? { cwd: root } : {};
  run(cmd, opts);
}

function installCli() {
  console.log(`\n==> Step 2: Installing ${NPM_PACKAGE} globally...`);
  run(`npm install -g ${NPM_PACKAGE}@latest`);
}

function installBrowser() {
  console.log(`\n==> Step 3: Installing ${BROWSER} browser...`);
  run(`playwright-cli install-browser ${BROWSER}`);
}

function dryRunCheck() {
  console.log('\n==> Step 4: Dry-run check...');

  console.log('  Verifying browser installation...');
  const dryRun = runCapture('playwright-cli install-browser --dry-run 2>&1');
  if (!dryRun || !dryRun.includes('chromium')) {
    console.log('    Browser verification FAILED.');
    return false;
  }
  console.log('    Browser verification PASSED.');

  console.log('  Running functional test (open/close)...');
  const tmpDir = path.join(os.tmpdir(), `pwcli-dryrun-${process.pid}`);
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  try {
    execSync('playwright-cli open https://example.com', {
      stdio: 'pipe', cwd: tmpDir, timeout: 30000,
    });
    execSync('playwright-cli close', {
      stdio: 'pipe', cwd: tmpDir, timeout: 10000,
    });
    console.log('    Functional test PASSED.');
    return true;
  } catch (e) {
    const msg = (e.stderr || e.message || '').toString().split('\n')[0];
    console.log('    Functional test FAILED.');
    if (msg) console.log(`    ${msg}`);
    return false;
  } finally {
    rmDir(path.join(tmpDir, '.playwright-cli'));
    rmDir(tmpDir);
  }
}

function cmdInit(scope, root) {
  const skillsDir = getSkillsDir(scope, root);
  console.log(`\nPlaywright-CLI Installer — Init (${scope} scope)\n`);
  console.log(`  Skills dir   : ${skillsDir}`);
  console.log(`  CLI package  : ${NPM_PACKAGE}`);
  console.log(`  Browser      : ${BROWSER}\n`);

  if (fs.existsSync(path.join(skillsDir, SKILL_NAME, 'SKILL.md'))) {
    console.log('==> Existing install detected — use "update" to refresh.\n');
  }

  installSkillFiles(scope, root);

  const existingVersion = runCapture('playwright-cli --version');
  if (existingVersion) {
    console.log(`\n==> ${NPM_PACKAGE} already installed (${existingVersion}).`);
  } else {
    installCli();
  }

  installBrowser();

  const passed = dryRunCheck();

  if (passed) {
    console.log('\n==> Done! playwright-cli installed successfully.');
    console.log('    Restart CodeArts to load the skill.');
  } else {
    console.log('\n==> Installation completed with warnings.');
    console.log('    The dry-run check failed. Check the output above.');
  }
}

function cmdUpdate(scope, root) {
  console.log(`\nPlaywright-CLI Installer — Update (${scope} scope)\n`);

  const skillsDir = getSkillsDir(scope, root);
  if (!fs.existsSync(path.join(skillsDir, SKILL_NAME, 'SKILL.md'))) {
    console.error('Error: playwright-cli skill is not installed. Run "init" first.');
    process.exit(1);
  }

  installSkillFiles(scope, root);
  installCli();
  installBrowser();

  const passed = dryRunCheck();

  if (passed) {
    console.log('\n==> Done! playwright-cli updated successfully.');
  } else {
    console.log('\n==> Update completed with warnings.');
  }
}

function cmdDelete(scope, root) {
  console.log(`\nPlaywright-CLI Installer — Delete (${scope} scope)\n`);

  console.log('==> Removing skill files...');
  const globalFlag = scope === 'user' ? '-g' : '';
  const cmd = [
    'npx', '-y', 'skills', 'remove', SKILL_NAME,
    '-a', 'codearts-agent',
    '-y',
    globalFlag,
  ].filter(Boolean).join(' ');
  const opts = scope === 'project' ? { cwd: root } : {};
  try {
    run(cmd, opts);
  } catch {
    console.log('    Warning: skills remove failed. Cleaning up manually...');
    rmDir(path.join(getSkillsDir(scope, root), SKILL_NAME));
  }

  console.log('\n==> Done! playwright-cli skill files removed.');
  console.log(`    Note: ${NPM_PACKAGE} and ${BROWSER} browser are global and were NOT removed.`);
  console.log('    To remove them manually:');
  console.log(`      npm uninstall -g ${NPM_PACKAGE}`);
}

function cmdStatus(scope, root) {
  const skillsDir = getSkillsDir(scope, root);
  console.log(`\nPlaywright-CLI Installer — Status (${scope} scope)\n`);

  const skillDir = path.join(skillsDir, SKILL_NAME);
  const skillOk = fs.existsSync(path.join(skillDir, 'SKILL.md'));
  console.log(`  Skill files  : ${skillOk ? 'installed' : 'NOT installed'}`);
  if (skillOk) {
    console.log(`    Path       : ${skillDir}`);
    const refsDir = path.join(skillDir, 'references');
    if (fs.existsSync(refsDir)) {
      const refCount = fs.readdirSync(refsDir).length;
      console.log(`    References : ${refCount} files`);
    }
  }

  const cliVersion = runCapture('playwright-cli --version');
  console.log(`  CLI binary   : ${cliVersion ? `installed (${cliVersion})` : 'NOT installed'}`);

  const browserList = runCapture('playwright-cli install-browser --list 2>&1');
  const browserOk = browserList && browserList.includes('chromium');
  console.log(`  Chromium     : ${browserOk ? 'installed' : 'NOT installed'}`);

  const healthy = skillOk && cliVersion && browserOk;
  console.log(`\n  Overall      : ${healthy ? 'HEALTHY' : 'INCOMPLETE'}\n`);
  process.exit(healthy ? 0 : 1);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !['init', 'update', 'delete', 'status'].includes(command)) {
    console.error('Usage: node installer.js <init|update|delete|status> [--project|--user]');
    console.error('');
    console.error('  init    Install playwright-cli skill + CLI + chromium browser');
    console.error('  update  Update all components to latest');
    console.error('  delete  Remove playwright-cli skill files');
    console.error('  status  Show installation status');
    console.error('');
    console.error('  --project  Install to current project (default if .codeartsdoer/ exists)');
    console.error('  --user     Install to user directory (~/.codeartsdoer/)');
    process.exit(1);
  }

  const hasProject = args.includes('--project');
  const hasUser = args.includes('--user');

  if (hasProject && hasUser) {
    console.error('Error: --project and --user are mutually exclusive.');
    process.exit(1);
  }

  const cwd = process.env.INIT_CWD || process.cwd();
  let scope, root;

  if (hasUser) {
    scope = 'user';
    root = null;
  } else if (hasProject) {
    scope = 'project';
    root = findProjectRoot(cwd);
    if (!root) {
      console.error('Error: not inside a CodeArts project (no .codeartsdoer/ found).');
      process.exit(1);
    }
  } else {
    root = findProjectRoot(cwd);
    scope = root ? 'project' : 'user';
  }

  switch (command) {
    case 'init':   cmdInit(scope, root); break;
    case 'update': cmdUpdate(scope, root); break;
    case 'delete': cmdDelete(scope, root); break;
    case 'status': cmdStatus(scope, root); break;
  }
}

main();