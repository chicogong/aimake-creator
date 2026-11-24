import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

async function main() {
  const skillPath = path.join(root, 'skills', 'aimake', 'SKILL.md');
  const skillText = await fs.readFile(skillPath, 'utf8');
  if (!skillText.startsWith('---\nname: aimake\ndescription:')) {
    throw new Error('SKILL.md missing required YAML frontmatter (name + description)');
  }

  const codexPlugin = JSON.parse(await fs.readFile(path.join(root, 'plugin.json'), 'utf8'));
  if (codexPlugin.name !== 'aimake') throw new Error('Invalid root plugin.json');

  const claudePlugin = JSON.parse(
    await fs.readFile(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8')
  );
  if (claudePlugin.name !== 'aimake') throw new Error('Invalid .claude-plugin/plugin.json');

  const wbMeta = JSON.parse(
    await fs.readFile(path.join(root, 'integrations', 'workbuddy', 'connector-meta.json'), 'utf8')
  );
  if (wbMeta.id !== 'aimake') throw new Error('Invalid WorkBuddy connector-meta.json');

  const tplRoot = path.join(root, 'templates');
  const entries = await fs.readdir(tplRoot, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const d = entry.name;
    const mp = path.join(tplRoot, d, 'manifest.json');
    const hp = path.join(tplRoot, d, 'template.html');
    const manifest = JSON.parse(await fs.readFile(mp, 'utf8'));
    const html = await fs.readFile(hp, 'utf8');
    if (
      !manifest.id ||
      !html.includes('window.renderDeck') ||
      !html.includes('data-editable') ||
      !html.includes('fitStage')
    ) {
      throw new Error(`Invalid template contract in ${d}`);
    }
    count++;
  }
  if (count < 22) {
    throw new Error(`Expected >= 22 flagship templates, found ${count}`);
  }

  const presetsDir = path.join(root, 'skills', 'workspace-presets');
  const presetsStat = await fs.stat(presetsDir).catch(() => null);
  let presetCount = 0;
  if (presetsStat && presetsStat.isDirectory()) {
    const entries = await fs.readdir(presetsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const presetSkillPath = path.join(presetsDir, entry.name, 'SKILL.md');
      let text;
      try {
        text = await fs.readFile(presetSkillPath, 'utf8');
      } catch {
        throw new Error(`Preset skill directory ${entry.name} is missing SKILL.md`);
      }
      const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fmMatch) {
        throw new Error(`Preset skill ${entry.name}/SKILL.md is missing YAML frontmatter`);
      }
      const frontmatter = fmMatch[1];
      const hasName = /^name:\s*\S+/m.test(frontmatter);
      const hasDescription = /^description:\s*\S+/m.test(frontmatter);
      if (!hasName || !hasDescription) {
        throw new Error(
          `Preset skill ${entry.name}/SKILL.md missing required YAML frontmatter (name + description)`
        );
      }
      presetCount++;
    }
    if (presetCount < 7) {
      throw new Error(
        `Expected >= 7 valid workspace preset skills in skills/workspace-presets/, found ${presetCount}`
      );
    }
  }

  const presetMsg = presetCount > 0 ? `, and ${presetCount} workspace preset skills` : '';
  console.log(
    `Validated SKILL.md, Codex/Claude/WorkBuddy manifests, ${count} templates${presetMsg}.`
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
