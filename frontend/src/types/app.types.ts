export type ModuleKey = 'target' | 'branding' | 'audio' | 'lyrics' | 'spectrum' | 'overlay' | 'queue' | 'loop' | 'help'

export type Job = {
  id: string
  title: string
  status: string
  progress: number
  speed?: string
  output?: string
  outputDir?: string
  error?: string
  input?: Record<string, string>
  startedAt?: string
  finishedAt?: string
  updatedAt?: string
  createdAt?: string
  elapsedSeconds?: number
  etaSeconds?: number
  renderedSeconds?: number
  durationSeconds?: number
  outputSize?: number
}

export type Preset = { id: string; name: string; config: any }
export type Project = { id: string; name: string; config: any }
export type AppState = { activeProjectId: string; projects: Project[]; presets: Preset[]; jobs: Job[]; logs: string[] }
export type PathKind = 'file' | 'directory' | 'save'
export type PathFilter = 'media' | 'visual' | 'video' | 'audio' | 'image' | 'lyrics'

export type PathInfo = {
  ok?: boolean
  exists?: boolean
  empty?: boolean
  path?: string
  name?: string
  dir?: string
  type?: string
  expectedOk?: boolean
  warning?: string
  size?: number
  isFile?: boolean
  isDirectory?: boolean
  parentExists?: boolean
}
