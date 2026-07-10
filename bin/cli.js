#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const PKG_ROOT = path.join(__dirname, '..');
const SKILL_DIR = path.join(PKG_ROOT, 'skills', 'fluke-motion');
const SKILL_NAME = 'fluke-motion';

const VALID_TARGETS = ['claude', 'cursor', 'copilot', 'windsurf', 'agents', 'all'];

function printHelp() {
  console.log(`
Fluke Motion — install the fluke-motion agent skill

Usage:
  npx fluke-motion install [options]

Options:
  --target <name>   claude | cursor | copilot | windsurf | agents | all  (default: claude)
  --global          Install for Claude Code at ~/.claude/skills (Claude only, default for claude target)
  --project         Install into the current project instead of globally
  --dir <path>      Project root to install into (default: current directory)
  --help            Show this help

Examples:
  npx fluke-motion install                          # Claude Code, global (~/.claude/skills)
  npx fluke-motion install --target claude --project # Claude Code, this project only
  npx fluke-motion install --target cursor           # Cursor rules, this project
  npx fluke-motion install --target all              # every supported agent, this project
`);
}

function parseArgs(argv) {
  const args = { command: argv[0], target: 'claude', scope: null, dir: process.cwd(), help: false };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--global') args.scope = 'global';
    else if (a === '--project') args.scope = 'project';
    else if (a === '--target') args.target = argv[++i];
    else if (a === '--dir') args.dir = path.resolve(argv[++i]);
  }
  return args;
}

function readSkillMd() {
  const raw = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('SKILL.md is missing YAML frontmatter');
  const frontmatter = match[1];
  const body = match[2].trim();
  const descMatch = frontmatter.match(/description:\s*([\s\S]*?)(?:\n\w+:|\n?$)/);
  const description = descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, '') : SKILL_NAME;
  return { description, body };
}

function readReferences() {
  const refDir = path.join(SKILL_DIR, 'references');
  const files = fs.readdirSync(refDir).filter((f) => f.endsWith('.md')).sort();
  return files.map((f) => ({
    name: f,
    content: fs.readFileSync(path.join(refDir, f), 'utf8').trim(),
  }));
}

// Non-Claude targets don't support progressive disclosure (multi-file, load-on-demand),
// so we flatten everything into one document each of them can ingest directly.
function buildFlattenedContent() {
  const { body } = readSkillMd();
  const refs = readReferences();
  let out = body + '\n\n---\n\n# Reference material\n\n';
  out += 'The sections below are the full reference material this skill draws on. ';
  out += 'Consult the relevant section for the request at hand rather than treating all of it as always-relevant.\n\n';
  for (const ref of refs) {
    out += `\n\n## Reference: ${ref.name.replace(/\.md$/, '')}\n\n${ref.content}\n`;
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function installClaude(scope, projectDir) {
  const targetRoot = scope === 'project'
    ? path.join(projectDir, '.claude', 'skills')
    : path.join(os.homedir(), '.claude', 'skills');
  const dest = path.join(targetRoot, SKILL_NAME);
  ensureDir(targetRoot);
  fs.cpSync(SKILL_DIR, dest, { recursive: true });
  console.log(`[claude] installed -> ${dest}`);
}

function installCursor(projectDir) {
  const { description } = readSkillMd();
  const content = buildFlattenedContent();
  const dest = path.join(projectDir, '.cursor', 'rules', `${SKILL_NAME}.mdc`);
  ensureDir(path.dirname(dest));
  const frontmatter = `---\ndescription: ${description.replace(/\n/g, ' ')}\nalwaysApply: false\n---\n\n`;
  fs.writeFileSync(dest, frontmatter + content, 'utf8');
  console.log(`[cursor] installed -> ${dest}`);
}

function installCopilot(projectDir) {
  const content = buildFlattenedContent();
  const dest = path.join(projectDir, '.github', 'instructions', `${SKILL_NAME}.instructions.md`);
  ensureDir(path.dirname(dest));
  const frontmatter = `---\napplyTo: "**"\n---\n\n`;
  fs.writeFileSync(dest, frontmatter + content, 'utf8');
  console.log(`[copilot] installed -> ${dest}`);
}

function installWindsurf(projectDir) {
  const content = buildFlattenedContent();
  const dest = path.join(projectDir, '.windsurf', 'rules', `${SKILL_NAME}.md`);
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`[windsurf] installed -> ${dest}`);
}

function installAgentsMd(projectDir) {
  const content = buildFlattenedContent();
  const dest = path.join(projectDir, 'AGENTS.md');
  const section = `\n\n<!-- fluke-motion:${SKILL_NAME} start -->\n${content}\n<!-- fluke-motion:${SKILL_NAME} end -->\n`;
  if (fs.existsSync(dest)) {
    const existing = fs.readFileSync(dest, 'utf8');
    const markerRe = new RegExp(`<!-- fluke-motion:${SKILL_NAME} start -->[\\s\\S]*?<!-- fluke-motion:${SKILL_NAME} end -->\\n?`);
    const updated = markerRe.test(existing) ? existing.replace(markerRe, section.trim() + '\n') : existing + section;
    fs.writeFileSync(dest, updated, 'utf8');
    console.log(`[agents] updated -> ${dest}`);
  } else {
    fs.writeFileSync(dest, `# Agent instructions\n${section}`, 'utf8');
    console.log(`[agents] created -> ${dest}`);
  }
}

function run() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.command !== 'install') {
    printHelp();
    process.exit(args.command === 'install' ? 0 : 1);
  }

  if (!VALID_TARGETS.includes(args.target)) {
    console.error(`Unknown target "${args.target}". Valid: ${VALID_TARGETS.join(', ')}`);
    process.exit(1);
  }

  const targets = args.target === 'all'
    ? ['claude', 'cursor', 'copilot', 'windsurf', 'agents']
    : [args.target];

  for (const t of targets) {
    if (t === 'claude') {
      const scope = args.scope || 'global';
      installClaude(scope, args.dir);
    } else {
      if (args.scope === 'global') {
        console.warn(`[${t}] has no global convention — installing into project at ${args.dir} instead.`);
      }
      if (t === 'cursor') installCursor(args.dir);
      else if (t === 'copilot') installCopilot(args.dir);
      else if (t === 'windsurf') installWindsurf(args.dir);
      else if (t === 'agents') installAgentsMd(args.dir);
    }
  }

  console.log('\nDone.');
}

run();
