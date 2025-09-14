import Resolver from '@forge/resolver';
import { JiraApiService } from './jiraApi';

const resolver = new Resolver();

// Jira API handler for backend operations
resolver.define('jira-api-handler', async (req) => {
  const { action, payload } = req.payload;

  try {
    switch (action) {
      case 'getProjects':
        return await JiraApiService.getProjects();
        
      case 'createIssueType':
        return await JiraApiService.createIssueType(payload);
        
      case 'updateIssueTypeScheme':
        return await JiraApiService.updateIssueTypeScheme(payload);
        
      case 'getProjectHierarchy':
        return await JiraApiService.getProjectHierarchy(payload.projectId);
        
      case 'checkIssueTypeExists':
        return await JiraApiService.checkIssueTypeExists(payload.name);
        
      case 'deleteIssueType':
        return await JiraApiService.deleteIssueType(payload.issueTypeId);
        
      case 'detectJiraInstanceType':
        return await JiraApiService.detectJiraInstanceType();
        
      case 'getIssueTypeScheme':
        return await JiraApiService.getIssueTypeScheme(payload.schemeId);
        
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  } catch (error) {
    console.error('Error in jira-api-handler:', error);
    return { success: false, error: `Server error: ${error}` };
  }
});

export const jiraApiHandler = resolver.getDefinitions();
export default resolver;