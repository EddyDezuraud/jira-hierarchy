export interface HierarchyLevel {
  id: string;
  name: string;
  position: number; // 1, 2, or 3 (1 being closest to Epic)
  issueTypeId?: string;
  created: boolean;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  issueTypeSchemeId?: string;
}

export interface IssueType {
  id: string;
  name: string;
  description: string;
  subtask: boolean;
  hierarchyLevel?: number;
}

export interface IssueTypeScheme {
  id: string;
  name: string;
  description: string;
  issueTypes: IssueType[];
}

export interface HierarchyConfig {
  levels: HierarchyLevel[];
  selectedProjects: string[];
  isConfigured: boolean;
  jiraInstance: 'standard' | 'premium' | 'enterprise';
}

export interface ProjectHierarchy {
  projectId: string;
  levels: Array<{
    issueTypeId: string;
    level: number;
  }>;
}

export interface DiagnosticResult {
  projectId: string;
  projectName: string;
  schemeId: string;
  schemeName: string;
  levelsCreated: boolean[];
  hierarchyConfigured: boolean;
  roadmapCompatible: boolean;
}

export interface JiraApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface CreateIssueTypeRequest {
  name: string;
  description: string;
  type: 'standard' | 'subtask';
}

export interface UpdateSchemeRequest {
  schemeId: string;
  issueTypeIds: string[];
}