import type { AspectRatio, DeckDocument, SupportedLocale, WikiIngestResult } from '../schema/types.js';

export type WorkspaceScenarioPreset =
  | 'creator-growth'
  | 'executive-ppt'
  | 'product-launch'
  | 'educator-course';

export type AgentHostId =
  | 'opencode'
  | 'workbuddy'
  | 'codebuddy'
  | 'codex'
  | 'agy'
  | 'claude'
  | 'cursor'
  | 'claude-desktop';

export type AgentLaunchMode = 'gui-app' | 'terminal-cli';

export type TerminalAppId =
  | 'ghostty'
  | 'warp'
  | 'iterm'
  | 'cmux'
  | 'wezterm'
  | 'kitty'
  | 'terminal';

export interface DetectedTerminalApp {
  id: TerminalAppId;
  name: string;
  displayName: string;
  installed: boolean;
  appPath?: string;
  descriptionZh: string;
}

export interface BeginnerTaskRecipe {
  id: string;
  titleZh: string;
  subtitleZh: string;
  badgeZh: string;
  promptZh: string;
  recommendedTemplate: string;
}

export interface WorkspaceBrandKit {
  brandName: string;
  author: string;
  handle: string;
  voiceTone: string;
  primaryColor: string;
  favoriteTemplates: string[];
  defaultLocale: SupportedLocale;
  watermark: boolean;
}

export interface WorkspaceConfig {
  schemaVersion: string;
  id: string;
  name: string;
  scenario: WorkspaceScenarioPreset;
  locale: SupportedLocale;
  defaultTemplate: string;
  createdAt: string;
  updatedAt: string;
  presetSkillVersion: string;
  includeClaudeSkills: boolean;
  activeDeckRel?: string;
}

export interface SkillManifestEntry {
  relativePath: string;
  sha256: string;
  version: string;
  updatedAt: string;
  skillName: string;
  targetRoot: '.agents/skills' | '.claude/skills' | 'root';
}

export interface SkillManifest {
  schemaVersion: string;
  presetVersion: string;
  updatedAt: string;
  files: Record<string, SkillManifestEntry>;
}

export type SkillSyncStatus = 'synced' | 'customized' | 'missing' | 'outdated';

export interface PresetSkillFile {
  relativePath: string;
  absolutePath: string;
  sha256: string;
  size: number;
}

export interface PresetSkillDefinition {
  name: string;
  description: string;
  sourceDir: string;
  files: PresetSkillFile[];
}

export interface WorkspaceSkillStatusItem {
  name: string;
  description: string;
  status: SkillSyncStatus;
  agentsPath: string;
  claudePath?: string;
  fileCount: number;
  customizedFiles: string[];
  missingFiles: string[];
  outdatedFiles: string[];
  hasSymlink: boolean;
}

export interface WorkspaceSkillInspection {
  workspaceDir: string;
  presetVersion: string;
  totalPresetSkills: number;
  allSynced: boolean;
  zeroSymlinks: boolean;
  skills: WorkspaceSkillStatusItem[];
}

export interface MaterializeSkillsOptions {
  includeClaude?: boolean;
  force?: boolean;
  scenario?: WorkspaceScenarioPreset;
  workspaceName?: string;
}

export interface MaterializeResult {
  workspaceDir: string;
  presetVersion: string;
  skillNames: string[];
  writtenFiles: string[];
  skippedUnchanged: string[];
  preservedCustomFiles: string[];
  generatedRootFiles: string[];
  manifestPath: string;
  includeClaude: boolean;
}

export type PipelineStageId =
  | 'intake'
  | 'author'
  | 'stage'
  | 'deliver'
  | 'distill'
  | 'create'
  | 'publish';

export type FlywheelStageId = 'intake' | 'distill' | 'create' | 'publish';
export type PipelineStageStatus = 'empty' | 'active' | 'ready';

export interface WorkspacePipelineStage {
  id: PipelineStageId;
  name?: string;
  nameZh?: string;
  count: number;
  status: PipelineStageStatus;
  detail: string;
}

export interface WorkspacePipelineState {
  currentStage: PipelineStageId;
  flywheelStage?: FlywheelStageId;
  intake: WorkspacePipelineStage;
  author: WorkspacePipelineStage;
  stage: WorkspacePipelineStage;
  deliver: WorkspacePipelineStage;
  distill?: WorkspacePipelineStage;
  create?: WorkspacePipelineStage;
  publish?: WorkspacePipelineStage;
  flywheel?: WorkspacePipelineStage[];
}

export interface WorkspaceFileEntry {
  name: string;
  relativePath: string;
  absolutePath: string;
  size: number;
  mtimeMs: number;
  updatedAt: string;
  kind: 'source' | 'wiki' | 'brief' | 'deck' | 'export';
  title?: string;
  template?: string;
  locale?: SupportedLocale;
  aspect?: AspectRatio;
  slideCount?: number;
  format?: string;
}

export interface WorkspaceSummary {
  workspaceDir: string;
  config: WorkspaceConfig;
  brandKit: WorkspaceBrandKit;
  pipeline: WorkspacePipelineState;
  decks: WorkspaceFileEntry[];
  sources: WorkspaceFileEntry[];
  wikiPages: WorkspaceFileEntry[];
  briefs: WorkspaceFileEntry[];
  exports: WorkspaceFileEntry[];
  skillsStatus: WorkspaceSkillInspection;
}

export interface DetectedAgentHost {
  id: AgentHostId;
  name: string;
  displayName: string;
  installed: boolean;
  binaryPath?: string;
  appPath?: string;
  skillDir: string;
  mcpConfigFile: string;
  priority: number;
  launchMode: AgentLaunchMode;
  beginnerHintZh: string;
}

export interface ConfigureWorkspaceAgentsOptions {
  cliPath?: string;
  hosts?: AgentHostId[];
  includeClaude?: boolean;
  cleanRoot?: boolean;
  force?: boolean;
  scenario?: WorkspaceScenarioPreset;
  workspaceName?: string;
}

export interface AgentConfigureResult {
  workspaceDir: string;
  cliPath: string;
  writtenConfigs: string[];
  materializedSkills: MaterializeResult;
  opencodePluginPath?: string;
}

export interface LaunchAgentOptions {
  terminal?: TerminalAppId;
  recipeId?: string;
  goal?: string;
  activeDeckRel?: string;
  dryRun?: boolean;
}

export interface AgentLaunchInfo {
  host: AgentHostId;
  hostName: string;
  workspaceDir: string;
  command: string;
  readyToRunCommand: string;
  terminalLaunchHint: string;
  starterPromptZh: string;
  starterPromptEn: string;
  richPromptContext?: string;
  launchMode: AgentLaunchMode;
  terminal?: TerminalAppId;
  recipeId?: string;
}

export interface AgentLaunchResult {
  launched: boolean;
  dryRun: boolean;
  info: AgentLaunchInfo;
  message: string;
  launchMode: AgentLaunchMode;
  terminalUsed?: TerminalAppId;
  copiedPrompt: boolean;
}

export interface RecentWorkspaceEntry {
  path: string;
  name: string;
  scenario?: WorkspaceScenarioPreset;
  lastOpenedAt: string;
}

export interface ScenarioPresetMetadata {
  id: WorkspaceScenarioPreset;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
  defaultTemplate: string;
  defaultAspect: AspectRatio;
  defaultLocale: SupportedLocale;
  recommendedTemplates: string[];
  primaryColor: string;
  brandVoiceHintZh: string;
  brandVoiceHintEn: string;
  starterDeckSlug: string;
  starterDeckTitleZh: string;
  starterDeckTitleEn: string;
}

export interface InitWorkspaceOptions {
  name?: string;
  scenario?: WorkspaceScenarioPreset;
  locale?: SupportedLocale;
  seedStarterDeck?: boolean;
  includeClaude?: boolean;
  includeClaudeSkills?: boolean;
  cleanRoot?: boolean;
  cliPath?: string;
  author?: string;
  handle?: string;
  registryPath?: string;
  registerRecent?: boolean;
}

export interface CreateWorkspaceDeckOptions {
  title: string;
  template?: string;
  locale?: SupportedLocale;
  aspect?: AspectRatio;
  slug?: string;
  author?: string;
  handle?: string;
}

export interface CreateWorkspaceDeckResult {
  deckPath: string;
  relativePath: string;
  slug: string;
  deck: DeckDocument;
}

export interface IngestWorkspaceSourceOptions {
  title: string;
  content: string;
  sourceUrl?: string;
  filename?: string;
  tags?: string[];
}

export interface IngestWorkspaceSourceResult {
  sourcePath: string;
  relativeSourcePath: string;
  wikiIngest: WikiIngestResult;
}
