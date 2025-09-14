import React, { useState, useEffect } from 'react';
import { JiraProject, HierarchyLevel, IssueTypeScheme } from '../types';
import { JiraApiService } from '../jiraApi';

interface ProjectMappingProps {
  projects: JiraProject[];
  levels: HierarchyLevel[];
  onProjectsSelected: (projectIds: string[]) => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  onBack: () => void;
}

export const ProjectMapping: React.FC<ProjectMappingProps> = ({
  projects,
  levels,
  onProjectsSelected,
  onError,
  onSuccess,
  onBack
}) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectSchemes, setProjectSchemes] = useState<Map<string, IssueTypeScheme>>(new Map());
  const [loading, setLoading] = useState(false);
  const [mappingProgress, setMappingProgress] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    loadProjectSchemes();
  }, [projects]);

  const loadProjectSchemes = async () => {
    setLoading(true);
    const schemes = new Map<string, IssueTypeScheme>();

    for (const project of projects) {
      if (project.issueTypeSchemeId) {
        try {
          const result = await JiraApiService.getIssueTypeScheme(project.issueTypeSchemeId);
          if (result.success && result.data) {
            schemes.set(project.id, result.data);
          }
        } catch (error) {
          console.warn(`Failed to load scheme for project ${project.key}:`, error);
        }
      }
    }

    setProjectSchemes(schemes);
    setLoading(false);
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProjects(projects.map(p => p.id));
  };

  const handleSelectNone = () => {
    setSelectedProjects([]);
  };

  const updateProjectSchemes = async (): Promise<boolean> => {
    let allUpdated = true;
    const progress = new Map<string, boolean>();

    for (const projectId of selectedProjects) {
      try {
        progress.set(projectId, false);
        setMappingProgress(new Map(progress));

        const scheme = projectSchemes.get(projectId);
        if (!scheme) {
          onError(`No issue type scheme found for project ${projectId}`);
          allUpdated = false;
          continue;
        }

        // Get current issue type IDs from the scheme
        const currentIssueTypeIds = scheme.issueTypes.map(it => it.id);
        
        // Add our new hierarchy level issue types
        const newIssueTypeIds = levels
          .filter(level => level.issueTypeId)
          .map(level => level.issueTypeId!);

        const updatedIssueTypeIds = [...currentIssueTypeIds, ...newIssueTypeIds];

        // Update the scheme
        const updateResult = await JiraApiService.updateIssueTypeScheme({
          schemeId: scheme.id,
          issueTypeIds: updatedIssueTypeIds
        });

        if (updateResult.success) {
          progress.set(projectId, true);
          setMappingProgress(new Map(progress));
          
          const project = projects.find(p => p.id === projectId);
          onSuccess(`Updated issue type scheme for project: ${project?.name || projectId}`);
        } else {
          onError(`Failed to update scheme for project ${projectId}: ${updateResult.error}`);
          allUpdated = false;
        }
      } catch (error) {
        onError(`Error updating project ${projectId}: ${error}`);
        allUpdated = false;
      }
    }

    return allUpdated;
  };

  const handleApplyMapping = async () => {
    if (selectedProjects.length === 0) {
      onError('Please select at least one project');
      return;
    }

    setLoading(true);
    try {
      const success = await updateProjectSchemes();
      if (success) {
        onProjectsSelected(selectedProjects);
        onSuccess(`Successfully mapped hierarchy levels to ${selectedProjects.length} project(s)`);
      }
    } catch (error) {
      onError(`Unexpected error during project mapping: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getProjectSchemeInfo = (project: JiraProject) => {
    const scheme = projectSchemes.get(project.id);
    if (!scheme) {
      return { schemeName: 'Unknown', issueTypeCount: 0 };
    }
    return {
      schemeName: scheme.name,
      issueTypeCount: scheme.issueTypes.length
    };
  };

  return (
    <div className="project-mapping">
      <h2>Project Mapping</h2>
      <p>Select the projects where you want to enable the new hierarchical levels.</p>

      <div className="level-summary">
        <h3>Levels to be added:</h3>
        <ul>
          {levels.map(level => (
            <li key={level.id} className="level-item">
              <span className="level-name">{level.name}</span>
              <span className="level-status">
                {level.created ? '✅ Created' : '⚠️ Not created'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="project-selection">
        <div className="selection-controls">
          <button onClick={handleSelectAll} disabled={loading}>Select All</button>
          <button onClick={handleSelectNone} disabled={loading}>Select None</button>
          <span className="selection-count">
            {selectedProjects.length} of {projects.length} projects selected
          </span>
        </div>

        <div className="project-list">
          {projects.map(project => {
            const schemeInfo = getProjectSchemeInfo(project);
            const isSelected = selectedProjects.includes(project.id);
            const isUpdating = mappingProgress.get(project.id) === false && loading;
            const isUpdated = mappingProgress.get(project.id) === true;

            return (
              <div key={project.id} className={`project-item ${isSelected ? 'selected' : ''}`}>
                <label className="project-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleProjectToggle(project.id)}
                    disabled={loading}
                  />
                  <div className="project-info">
                    <div className="project-header">
                      <span className="project-name">{project.name}</span>
                      <span className="project-key">({project.key})</span>
                      {isUpdating && <span className="status updating">Updating...</span>}
                      {isUpdated && <span className="status updated">✅ Updated</span>}
                    </div>
                    <div className="project-details">
                      <span className="scheme-name">Scheme: {schemeInfo.schemeName}</span>
                      <span className="issue-type-count">
                        {schemeInfo.issueTypeCount} issue types
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {selectedProjects.length > 0 && (
        <div className="mapping-preview">
          <h3>Mapping Preview</h3>
          <p>
            The following {levels.length} hierarchical level(s) will be added to the issue type schemes 
            of {selectedProjects.length} selected project(s):
          </p>
          <ul>
            {levels.map(level => (
              <li key={level.id}>
                <strong>{level.name}</strong> - Level {level.position}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="actions">
        <button className="secondary-button" onClick={onBack} disabled={loading}>
          Back
        </button>
        <button
          className="primary-button"
          onClick={handleApplyMapping}
          disabled={loading || selectedProjects.length === 0}
        >
          {loading ? 'Mapping Projects...' : 'Apply Project Mapping'}
        </button>
      </div>

      {loading && (
        <div className="progress-info">
          <p>Updating issue type schemes...</p>
          <p>This may take a few moments for each project.</p>
        </div>
      )}
    </div>
  );
};