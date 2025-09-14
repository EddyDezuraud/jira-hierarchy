import React, { useState, useEffect } from 'react';
import { HierarchyConfig, JiraProject, DiagnosticResult, HierarchyLevel } from '../types';
import { JiraApiService } from '../jiraApi';

interface DiagnosticsProps {
  config: HierarchyConfig;
  projects: JiraProject[];
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  onBack: () => void;
}

export const Diagnostics: React.FC<DiagnosticsProps> = ({
  config,
  projects,
  onError,
  onSuccess,
  onBack
}) => {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: DiagnosticResult[] = [];
    const selectedProjects = projects.filter(p => config.selectedProjects.includes(p.id));

    for (const project of selectedProjects) {
      try {
        // Get project scheme information
        const schemeResult = project.issueTypeSchemeId 
          ? await JiraApiService.getIssueTypeScheme(project.issueTypeSchemeId)
          : null;

        // Check hierarchy configuration
        const hierarchyResult = await JiraApiService.getProjectHierarchy(project.id);

        // Analyze levels created
        const levelsCreated = config.levels.map(level => {
          if (!schemeResult?.success || !schemeResult.data) return false;
          return schemeResult.data.issueTypes.some(it => it.id === level.issueTypeId);
        });

        // Check if hierarchy is properly configured
        const hierarchyConfigured = hierarchyResult.success && 
          hierarchyResult.data && 
          config.levels.every(level => 
            hierarchyResult.data!.levels.some(hl => hl.issueTypeId === level.issueTypeId)
          );

        const result: DiagnosticResult = {
          projectId: project.id,
          projectName: project.name,
          schemeId: project.issueTypeSchemeId || 'Unknown',
          schemeName: schemeResult?.data?.name || 'Unknown',
          levelsCreated,
          hierarchyConfigured,
          roadmapCompatible: config.jiraInstance === 'premium' || config.jiraInstance === 'enterprise'
        };

        results.push(result);
      } catch (error) {
        // Create a failed result for this project
        const result: DiagnosticResult = {
          projectId: project.id,
          projectName: project.name,
          schemeId: 'Error',
          schemeName: 'Error',
          levelsCreated: config.levels.map(() => false),
          hierarchyConfigured: false,
          roadmapCompatible: false
        };
        results.push(result);
      }
    }

    setDiagnosticResults(results);
    setLoading(false);
  };

  const handleRollback = async () => {
    setRollbackLoading(true);
    let rollbackSuccess = true;

    try {
      // Remove issue types from schemes first
      for (const project of projects.filter(p => config.selectedProjects.includes(p.id))) {
        if (project.issueTypeSchemeId) {
          const schemeResult = await JiraApiService.getIssueTypeScheme(project.issueTypeSchemeId);
          if (schemeResult.success && schemeResult.data) {
            // Remove our hierarchy level issue types from the scheme
            const filteredIssueTypes = schemeResult.data.issueTypes.filter(it => 
              !config.levels.some(level => level.issueTypeId === it.id)
            );

            const updateResult = await JiraApiService.updateIssueTypeScheme({
              schemeId: project.issueTypeSchemeId,
              issueTypeIds: filteredIssueTypes.map(it => it.id)
            });

            if (!updateResult.success) {
              onError(`Failed to remove issue types from project ${project.name}: ${updateResult.error}`);
              rollbackSuccess = false;
            }
          }
        }
      }

      // Delete the issue types
      for (const level of config.levels) {
        if (level.issueTypeId) {
          const deleteResult = await JiraApiService.deleteIssueType(level.issueTypeId);
          if (!deleteResult.success) {
            onError(`Failed to delete issue type ${level.name}: ${deleteResult.error}`);
            rollbackSuccess = false;
          }
        }
      }

      if (rollbackSuccess) {
        onSuccess('Rollback completed successfully');
        // Refresh diagnostics
        await runDiagnostics();
      }
    } catch (error) {
      onError(`Error during rollback: ${error}`);
    } finally {
      setRollbackLoading(false);
      setShowRollbackConfirm(false);
    }
  };

  const getOverallStatus = () => {
    if (diagnosticResults.length === 0) return 'unknown';
    
    const allConfigured = diagnosticResults.every(result => 
      result.levelsCreated.every(created => created) && result.hierarchyConfigured
    );
    
    const someIssues = diagnosticResults.some(result => 
      !result.levelsCreated.every(created => created) || !result.hierarchyConfigured
    );

    if (allConfigured) return 'success';
    if (someIssues) return 'warning';
    return 'error';
  };

  const renderStatusIcon = (status: 'success' | 'warning' | 'error' | 'unknown') => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const renderProjectDiagnostic = (result: DiagnosticResult) => (
    <div key={result.projectId} className="project-diagnostic">
      <div className="project-header">
        <h4>{result.projectName}</h4>
        <span className="project-id">({result.projectId})</span>
      </div>

      <div className="diagnostic-details">
        <div className="detail-row">
          <span className="label">Issue Type Scheme:</span>
          <span className="value">{result.schemeName}</span>
        </div>

        <div className="detail-row">
          <span className="label">Hierarchy Levels:</span>
          <div className="levels-status">
            {config.levels.map((level, index) => (
              <div key={level.id} className="level-status">
                <span className={`status-icon ${result.levelsCreated[index] ? 'success' : 'error'}`}>
                  {renderStatusIcon(result.levelsCreated[index] ? 'success' : 'error')}
                </span>
                <span className="level-name">{level.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-row">
          <span className="label">Hierarchy Configured:</span>
          <span className={`status ${result.hierarchyConfigured ? 'success' : 'error'}`}>
            {renderStatusIcon(result.hierarchyConfigured ? 'success' : 'error')}
            {result.hierarchyConfigured ? 'Yes' : 'No'}
          </span>
        </div>

        <div className="detail-row">
          <span className="label">Roadmap Compatible:</span>
          <span className={`status ${result.roadmapCompatible ? 'success' : 'warning'}`}>
            {renderStatusIcon(result.roadmapCompatible ? 'success' : 'warning')}
            {result.roadmapCompatible ? 'Native Support' : 'Custom View Only'}
          </span>
        </div>
      </div>
    </div>
  );

  const renderRollbackSection = () => (
    <div className="rollback-section">
      <h3>Rollback Configuration</h3>
      <div className="rollback-warning">
        <h4>⚠️ Warning</h4>
        <p>
          This will completely remove all created hierarchy levels and revert your Jira configuration 
          to its previous state. This action cannot be undone.
        </p>
      </div>

      <div className="rollback-actions">
        {!showRollbackConfirm ? (
          <button 
            className="danger-button"
            onClick={() => setShowRollbackConfirm(true)}
            disabled={rollbackLoading}
          >
            Rollback Configuration
          </button>
        ) : (
          <div className="rollback-confirm">
            <p>Are you sure you want to rollback all changes?</p>
            <div className="confirm-buttons">
              <button 
                className="danger-button"
                onClick={handleRollback}
                disabled={rollbackLoading}
              >
                {rollbackLoading ? 'Rolling back...' : 'Yes, Rollback'}
              </button>
              <button 
                className="secondary-button"
                onClick={() => setShowRollbackConfirm(false)}
                disabled={rollbackLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="diagnostics">
      <h2>Configuration Diagnostics</h2>
      <p>Review the current state of your hierarchy configuration across all projects.</p>

      <div className="overall-status">
        <div className={`status-card ${getOverallStatus()}`}>
          <div className="status-icon">
            {renderStatusIcon(getOverallStatus() as any)}
          </div>
          <div className="status-content">
            <h3>Overall Status</h3>
            <p>
              {getOverallStatus() === 'success' && 'All configurations are working properly'}
              {getOverallStatus() === 'warning' && 'Some configurations need attention'}
              {getOverallStatus() === 'error' && 'Multiple configurations have issues'}
              {getOverallStatus() === 'unknown' && 'Status could not be determined'}
            </p>
          </div>
        </div>
      </div>

      <div className="configuration-summary">
        <h3>Configuration Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Jira Instance:</span>
            <span className="summary-value">{config.jiraInstance.toUpperCase()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Hierarchy Levels:</span>
            <span className="summary-value">{config.levels.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Configured Projects:</span>
            <span className="summary-value">{config.selectedProjects.length}</span>
          </div>
        </div>
      </div>

      <div className="project-diagnostics">
        <h3>Project-by-Project Analysis</h3>
        {loading ? (
          <div className="loading-state">
            <p>Running diagnostics...</p>
          </div>
        ) : (
          <div className="diagnostics-results">
            {diagnosticResults.map(renderProjectDiagnostic)}
          </div>
        )}
      </div>

      <div className="refresh-section">
        <button 
          className="secondary-button"
          onClick={runDiagnostics}
          disabled={loading}
        >
          {loading ? 'Running Diagnostics...' : 'Refresh Diagnostics'}
        </button>
      </div>

      {renderRollbackSection()}

      <div className="actions">
        <button className="secondary-button" onClick={onBack}>
          Back to Roadmap
        </button>
      </div>
    </div>
  );
};