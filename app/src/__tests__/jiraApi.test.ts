import { JiraApiService } from '../jiraApi';

// Mock the Forge API
jest.mock('@forge/api', () => ({
  route: jest.fn((template, ...values) => template),
  default: {
    asApp: () => ({
      requestJira: jest.fn()
    })
  }
}));

describe('JiraApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectJiraInstanceType', () => {
    it('should detect Jira instance type', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ version: '1000.0.0' })
      };

      const api = require('@forge/api').default;
      api.asApp().requestJira.mockResolvedValue(mockResponse);

      const result = await JiraApiService.detectJiraInstanceType();

      expect(result.success).toBe(true);
      expect(['standard', 'premium', 'enterprise']).toContain(result.data);
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ errorMessages: ['API Error'] })
      };

      const api = require('@forge/api').default;
      api.asApp().requestJira.mockResolvedValue(mockResponse);

      const result = await JiraApiService.detectJiraInstanceType();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to detect Jira instance type');
    });
  });

  describe('checkIssueTypeExists', () => {
    it('should return true when issue type exists', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          { id: '1', name: 'Program' },
          { id: '2', name: 'Epic' }
        ])
      };

      const api = require('@forge/api').default;
      api.asApp().requestJira.mockResolvedValue(mockResponse);

      const result = await JiraApiService.checkIssueTypeExists('Program');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when issue type does not exist', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          { id: '1', name: 'Epic' },
          { id: '2', name: 'Story' }
        ])
      };

      const api = require('@forge/api').default;
      api.asApp().requestJira.mockResolvedValue(mockResponse);

      const result = await JiraApiService.checkIssueTypeExists('Program');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('createIssueType', () => {
    it('should create issue type successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: '123',
          name: 'Program',
          description: 'Program level',
          subtask: false
        })
      };

      const api = require('@forge/api').default;
      api.asApp().requestJira.mockResolvedValue(mockResponse);

      const result = await JiraApiService.createIssueType({
        name: 'Program',
        description: 'Program level',
        type: 'standard'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: '123',
        name: 'Program',
        description: 'Program level',
        subtask: false
      });
    });

    it('should handle creation errors', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          errorMessages: ['Issue type name already exists']
        })
      };

      const api = require('@forge/api').default;
      api.asApp().requestJira.mockResolvedValue(mockResponse);

      const result = await JiraApiService.createIssueType({
        name: 'Program',
        description: 'Program level',
        type: 'standard'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Issue type name already exists');
    });
  });
});