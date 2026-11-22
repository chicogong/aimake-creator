import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface HostDefinition {
  id: string;
  name: string;
  region: 'global' | 'cn';
  baseDir: string;
  skillsSubdir: string;
}

export interface DetectedHost extends HostDefinition {
  detected: boolean;
  targetSkillPath: string;
}

export function getSkillSourceDir(): string {
  const fromDist = path.resolve(__dirname, '../skills/aimake');
  const fromSrc = path.resolve(__dirname, '../../skills/aimake');
  return __dirname.endsWith('dist') ? fromDist : fromSrc;
}

export function getSupportedHostMatrix(homeDir = os.homedir()): HostDefinition[] {
  return [
    { id: 'antigravity', name: 'Google Antigravity (AGY)', region: 'global', baseDir: path.join(homeDir, '.agents'), skillsSubdir: 'skills' },
    { id: 'gemini-cli', name: 'Gemini CLI', region: 'global', baseDir: path.join(homeDir, '.gemini'), skillsSubdir: 'skills' },
    { id: 'codex', name: 'OpenAI Codex', region: 'global', baseDir: path.join(homeDir, '.codex'), skillsSubdir: 'skills' },
    { id: 'claude-code', name: 'Claude Code', region: 'global', baseDir: path.join(homeDir, '.claude'), skillsSubdir: 'skills' },
    { id: 'cursor', name: 'Cursor IDE', region: 'global', baseDir: path.join(homeDir, '.cursor'), skillsSubdir: 'skills' },
    { id: 'windsurf', name: 'Windsurf IDE', region: 'global', baseDir: path.join(homeDir, '.windsurf'), skillsSubdir: 'skills' },
    { id: 'cline', name: 'Cline / Roo Code', region: 'global', baseDir: path.join(homeDir, '.cline'), skillsSubdir: 'skills' },
    { id: 'goose', name: 'Block Goose', region: 'global', baseDir: path.join(homeDir, '.config', 'goose'), skillsSubdir: 'skills' },
    { id: 'opencode', name: 'OpenCode CLI', region: 'global', baseDir: path.join(homeDir, '.config', 'opencode'), skillsSubdir: 'skills' },
    { id: 'copilot', name: 'GitHub Copilot Agent', region: 'global', baseDir: path.join(homeDir, '.copilot'), skillsSubdir: 'skills' },
    { id: 'workbuddy', name: 'Tencent WorkBuddy', region: 'cn', baseDir: path.join(homeDir, '.workbuddy'), skillsSubdir: 'skills' },
    { id: 'codebuddy', name: 'Tencent CodeBuddy', region: 'cn', baseDir: path.join(homeDir, '.codebuddy'), skillsSubdir: 'skills' },
    { id: 'openclaw', name: 'OpenClaw / SkillHub', region: 'cn', baseDir: path.join(homeDir, '.openclaw'), skillsSubdir: 'skills' },
    { id: 'trae', name: 'ByteDance Trae', region: 'cn', baseDir: path.join(homeDir, '.trae'), skillsSubdir: 'skills' },
    { id: 'qoder', name: 'Alibaba Qoder', region: 'cn', baseDir: path.join(homeDir, '.qoder'), skillsSubdir: 'skills' },
    { id: 'dsh', name: 'DeepSeek Harness (dsh)', region: 'cn', baseDir: path.join(homeDir, '.dsh'), skillsSubdir: 'skills' },
  ];
}

export async function detectLocalHosts(homeDir = os.homedir()): Promise<DetectedHost[]> {
  const defs = getSupportedHostMatrix(homeDir);
  const results: DetectedHost[] = [];

  for (const def of defs) {
    let detected = false;
    try {
      const st = await fs.stat(def.baseDir);
      detected = st.isDirectory();
    } catch {
      detected = false;
    }
    results.push({
      ...def,
      detected,
      targetSkillPath: path.join(def.baseDir, def.skillsSubdir, 'aimake'),
    });
  }

  return results;
}

export interface InstallAction {
  hostId: string;
  hostName: string;
  targetPath: string;
  status: 'linked' | 'already-linked' | 'skipped-existing' | 'planned';
}

export async function installAimakeSkill(options?: {
  homeDir?: string;
  onlyHosts?: string[];
  dryRun?: boolean;
}): Promise<InstallAction[]> {
  const sourceDir = getSkillSourceDir();
  const detected = await detectLocalHosts(options?.homeDir);
  const targets = detected.filter(
    (h) => h.detected && (!options?.onlyHosts || options.onlyHosts.includes(h.id))
  );

  const actions: InstallAction[] = [];
  for (const host of targets) {
    if (options?.dryRun) {
      actions.push({
        hostId: host.id,
        hostName: host.name,
        targetPath: host.targetSkillPath,
        status: 'planned',
      });
      continue;
    }

    await fs.mkdir(path.dirname(host.targetSkillPath), { recursive: true });
    try {
      const stat = await fs.lstat(host.targetSkillPath);
      if (stat.isSymbolicLink()) {
        const real = await fs.readlink(host.targetSkillPath);
        if (path.resolve(path.dirname(host.targetSkillPath), real) === sourceDir) {
          actions.push({
            hostId: host.id,
            hostName: host.name,
            targetPath: host.targetSkillPath,
            status: 'already-linked',
          });
          continue;
        }
      }
      // Never overwrite non-matching existing user directory silently
      actions.push({
        hostId: host.id,
        hostName: host.name,
        targetPath: host.targetSkillPath,
        status: 'skipped-existing',
      });
    } catch {
      await fs.symlink(sourceDir, host.targetSkillPath, 'dir');
      actions.push({
        hostId: host.id,
        hostName: host.name,
        targetPath: host.targetSkillPath,
        status: 'linked',
      });
    }
  }

  return actions;
}
