import api, { route } from '@forge/api';
import {
  JiraProject,
  IssueType,
  IssueTypeScheme,
  CreateIssueTypeRequest,
  UpdateSchemeRequest,
  ProjectHierarchy,
  JiraApiResponse,
  HierarchyLevel
} from './types';

export class JiraApiService {
  
  /**
   * Get all accessible projects
   */
  static async getProjects(): Promise<JiraApiResponse<JiraProject[]>> {
    try {
      const response = await api.asApp().requestJira(route`/rest/api/3/project`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.errorMessages?.join(', ') || 'Failed to fetch projects' };
      }

      const projects: JiraProject[] = data.map((project: any) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        issueTypeSchemeId: project.issueTypeScheme?.id
      }));

      return { success: true, data: projects };
    } catch (error) {
      return { success: false, error: `Error fetching projects: ${error}` };
    }
  }

  /**
   * Get issue types for a project
   */
  static async getProjectIssueTypes(projectId: string): Promise<JiraApiResponse<IssueType[]>> {
    try {
      const response = await api.asApp().requestJira(route`/rest/api/3/project/${projectId}/statuses`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.errorMessages?.join(', ') || 'Failed to fetch issue types' };
      }

      const issueTypes: IssueType[] = data.map((status: any) => ({
        id: status.id,
        name: status.name,
        description: status.description || '',
        subtask: status.subtask || false
      }));

      return { success: true, data: issueTypes };
    } catch (error) {
      return { success: false, error: `Error fetching issue types: ${error}` };
    }
  }

  /**
   * Create a new issue type
   */
  static async createIssueType(request: CreateIssueTypeRequest): Promise<JiraApiResponse<IssueType>> {
    try {
      const response = await api.asApp().requestJira(route`/rest/api/3/issuetype`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: request.name,
          description: request.description,
          type: request.type
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.errorMessages?.join(', ') || 'Failed to create issue type' };
      }

      const issueType: IssueType = {
        id: data.id,
        name: data.name,
        description: data.description,
        subtask: data.subtask
      };

      return { success: true, data: issueType };
    } catch (error) {
      return { success: false, error: `Error creating issue type: ${error}` };
    }
  }

  /**
   * Get issue type scheme details
   */
  static async getIssueTypeScheme(schemeId: string): Promise<JiraApiResponse<IssueTypeScheme>> {
    try {
      const response = await api.asApp().requestJira(route`/rest/api/3/issuetypescheme/${schemeId}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.errorMessages?.join(', ') || 'Failed to fetch issue type scheme' };
      }

      const scheme: IssueTypeScheme = {
        id: data.id,
        name: data.name,
        description: data.description,
        issueTypes: data.issueTypes?.map((it: any) => ({
          id: it.id,
          name: it.name,
          description: it.description,
          subtask: it.subtask
        })) || []
      };

      return { success: true, data: scheme };
    } catch (error) {
      return { success: false, error: `Error fetching issue type scheme: ${error}` };
    }
  }

  /**
   * Update issue type scheme with new issue types
   */
  static async updateIssueTypeScheme(request: UpdateSchemeRequest): Promise<JiraApiResponse<void>> {
    try {
      const response = await api.asApp().requestJira(route`/rest/api/3/issuetypescheme/${request.schemeId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          issueTypeIds: request.issueTypeIds
        })
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.errorMessages?.join(', ') || 'Failed to update issue type scheme' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Error updating issue type scheme: ${error}` };
    }
  }

  /**
   * Get project hierarchy configuration
   */
  static async getProjectHierarchy(projectId: string): Promise<JiraApiResponse<ProjectHierarchy>> {
    try {
      const response = await api.asApp().requestJira(route`/rest/api/3/project/${projectId}/hierarchy`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.errorMessages?.join(', ') || 'Failed to fetch project hierarchy' };
      }

      const hierarchy: ProjectHierarchy = {
        projectId,
        levels: data.levels?.map((level: any) => ({
          issueTypeId: level.issueTypeId,
          level: level.level
        })) || []
      };

      return { success: true, data: hierarchy };
    } catch (error) {
      return { success: false, error: `Error fetching project hierarchy: ${error}` };
    }
  }

  /**
   * Check if issue type already exists
   */
  static async checkIssueTypeExists(name: string): Promise<JiraApiResponse<boolean>> {
    try {
      const response = await api.asApp().requestJira(route`/rest/api/3/issuetype`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: 'Failed to check existing issue types' };
      }

      const exists = data.some((issueType: any) => 
        issueType.name.toLowerCase() === name.toLowerCase()
      );

      return { success: true, data: exists };
    } catch (error) {
      return { success: false, error: `Error checking issue type existence: ${error}` };
    }
  }

  /**
   * Delete an issue type
   */
  static async deleteIssueType(issueTypeId: string): Promise<JiraApiResponse<void>> {
    try {
      const response = await api.asApp().requestJira(route`/rest/api/3/issuetype/${issueTypeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.errorMessages?.join(', ') || 'Failed to delete issue type' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Error deleting issue type: ${error}` };
    }
  }

  /**
   * Detect Jira instance type (Standard, Premium, Enterprise)
   */
  static async detectJiraInstanceType(): Promise<JiraApiResponse<'standard' | 'premium' | 'enterprise'>> {
    try {
      // Check for Advanced Roadmaps capability (Premium/Enterprise feature)
      const response = await api.asApp().requestJira(route`/rest/api/3/applicationinfo`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: 'Failed to detect Jira instance type' };
      }

      // This is a simplified detection - in reality, you'd need to check for specific features
      // For now, we'll assume Premium if we can access certain endpoints
      try {
        const hierarchyResponse = await api.asApp().requestJira(route`/rest/api/3/project/hierarchy`);
        if (hierarchyResponse.ok) {
          return { success: true, data: 'premium' };
        }
      } catch (e) {
        // If hierarchy endpoint is not available, likely Standard
        return { success: true, data: 'standard' };
      }

      return { success: true, data: 'standard' };
    } catch (error) {
      return { success: false, error: `Error detecting Jira instance type: ${error}` };
    }
  }
}