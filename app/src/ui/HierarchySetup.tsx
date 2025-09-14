import React, { useState } from 'react';
import { HierarchyLevel } from '../types';
import { JiraApiService } from '../jiraApi';

interface HierarchySetupProps {
  onLevelsConfigured: (levels: HierarchyLevel[]) => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export const HierarchySetup: React.FC<HierarchySetupProps> = ({ 
  onLevelsConfigured, 
  onError, 
  onSuccess 
}) => {
  const [numberOfLevels, setNumberOfLevels] = useState<1 | 2 | 3>(1);
  const [levels, setLevels] = useState<HierarchyLevel[]>([
    { id: 'level1', name: 'Program', position: 1, created: false },
    { id: 'level2', name: 'Capability', position: 2, created: false },
    { id: 'level3', name: 'Initiative', position: 3, created: false }
  ]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateLevels = (): boolean => {
    const errors: string[] = [];
    const activeLevels = levels.slice(0, numberOfLevels);

    // Check for empty names
    activeLevels.forEach((level, index) => {
      if (!level.name.trim()) {
        errors.push(`Level ${index + 1} name cannot be empty`);
      }
    });

    // Check for duplicate names
    const names = activeLevels.map(l => l.name.trim().toLowerCase());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push('Level names must be unique');
    }

    // Check name length
    activeLevels.forEach((level, index) => {
      if (level.name.trim().length > 50) {
        errors.push(`Level ${index + 1} name is too long (max 50 characters)`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleLevelNameChange = (index: number, name: string) => {
    const updatedLevels = [...levels];
    updatedLevels[index] = { ...updatedLevels[index], name };
    setLevels(updatedLevels);
    setValidationErrors([]); // Clear validation errors when user types
  };

  const createIssueTypes = async (): Promise<boolean> => {
    const activeLevels = levels.slice(0, numberOfLevels);
    let allCreated = true;

    for (const level of activeLevels) {
      try {
        // Check if issue type already exists
        const existsResult = await JiraApiService.checkIssueTypeExists(level.name);
        if (!existsResult.success) {
          onError(`Failed to check if issue type '${level.name}' exists: ${existsResult.error}`);
          allCreated = false;
          continue;
        }

        if (existsResult.data) {
          onError(`Issue type '${level.name}' already exists. Please choose a different name.`);
          allCreated = false;
          continue;
        }

        // Create the issue type
        const createResult = await JiraApiService.createIssueType({
          name: level.name,
          description: `Hierarchical level ${level.position} - ${level.name}`,
          type: 'standard'
        });

        if (createResult.success && createResult.data) {
          level.issueTypeId = createResult.data.id;
          level.created = true;
          onSuccess(`Created issue type: ${level.name}`);
        } else {
          onError(`Failed to create issue type '${level.name}': ${createResult.error}`);
          allCreated = false;
        }
      } catch (error) {
        onError(`Error creating issue type '${level.name}': ${error}`);
        allCreated = false;
      }
    }

    return allCreated;
  };

  const handleCreateLevels = async () => {
    if (!validateLevels()) {
      return;
    }

    setLoading(true);
    try {
      const success = await createIssueTypes();
      if (success) {
        const activeLevels = levels.slice(0, numberOfLevels);
        onLevelsConfigured(activeLevels);
        onSuccess(`Successfully created ${numberOfLevels} hierarchical level(s)`);
      }
    } catch (error) {
      onError(`Unexpected error during level creation: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hierarchy-setup">
      <h2>Setup Hierarchical Levels</h2>
      <p>Define 1 to 3 hierarchical levels above Epics in your Jira instance.</p>

      <div className="level-count-selector">
        <label htmlFor="levelCount">Number of levels to create:</label>
        <select 
          id="levelCount"
          value={numberOfLevels} 
          onChange={(e) => setNumberOfLevels(Number(e.target.value) as 1 | 2 | 3)}
          disabled={loading}
        >
          <option value={1}>1 Level</option>
          <option value={2}>2 Levels</option>
          <option value={3}>3 Levels</option>
        </select>
      </div>

      <div className="levels-configuration">
        <h3>Configure Level Names</h3>
        <div className="hierarchy-preview">
          {levels.slice(0, numberOfLevels).map((level, index) => (
            <div key={level.id} className="level-config">
              <div className="level-info">
                <label>Level {level.position} (closest to Epic):</label>
                <span className="level-description">
                  Will be positioned between {level.position === 1 ? 'Epic' : `Level ${level.position - 1}`} and {level.position === 3 ? 'Top' : `Level ${level.position + 1}`}
                </span>
              </div>
              <input
                type="text"
                value={level.name}
                onChange={(e) => handleLevelNameChange(index, e.target.value)}
                placeholder={`Enter name for Level ${level.position}`}
                disabled={loading}
                className={validationErrors.some(e => e.includes(`Level ${index + 1}`)) ? 'error' : ''}
              />
            </div>
          ))}
        </div>

        <div className="hierarchy-visualization">
          <h4>Resulting Hierarchy:</h4>
          <div className="hierarchy-tree">
            {numberOfLevels >= 3 && (
              <div className="hierarchy-level level-3">
                {levels[2].name || 'Level 3'}
              </div>
            )}
            {numberOfLevels >= 2 && (
              <div className="hierarchy-level level-2">
                {levels[1].name || 'Level 2'}
              </div>
            )}
            <div className="hierarchy-level level-1">
              {levels[0].name || 'Level 1'}
            </div>
            <div className="hierarchy-level epic">Epic</div>
            <div className="hierarchy-level story">Story/Task</div>
            <div className="hierarchy-level subtask">Sub-task</div>
          </div>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h4>Please fix the following errors:</h4>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index} className="error">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="actions">
        <button
          className="primary-button"
          onClick={handleCreateLevels}
          disabled={loading || validationErrors.length > 0}
        >
          {loading ? 'Creating Issue Types...' : 'Create Hierarchical Levels'}
        </button>
      </div>

      {loading && (
        <div className="progress-info">
          <p>Creating issue types in Jira...</p>
          <p>This may take a few moments.</p>
        </div>
      )}
    </div>
  );
};