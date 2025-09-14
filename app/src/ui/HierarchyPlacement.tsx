import React, { useState, useEffect } from 'react';
import { HierarchyConfig, ProjectHierarchy } from '../types';
import { JiraApiService } from '../jiraApi';

interface HierarchyPlacementProps {
  config: HierarchyConfig;
  onHierarchyPlaced: () => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  onBack: () => void;
}

export const HierarchyPlacement: React.FC<HierarchyPlacementProps> = ({
  config,
  onHierarchyPlaced,
  onError,
  onSuccess,
  onBack
}) => {
  const [verificationStatus, setVerificationStatus] = useState<Map<string, 'pending' | 'verified' | 'failed'>>(new Map());
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const isPremiumOrEnterprise = config.jiraInstance === 'premium' || config.jiraInstance === 'enterprise';

  const generateJiraSettingsUrl = () => {
    // This would need to be dynamically generated based on the actual Jira instance
    // For now, we'll provide a relative path
    return `/secure/admin/ViewIssueTypes.jspa`;
  };

  const verifyHierarchyConfiguration = async (): Promise<boolean> => {
    setLoading(true);
    let allConfigured = true;
    const status = new Map<string, 'pending' | 'verified' | 'failed'>();

    for (const projectId of config.selectedProjects) {
      try {
        status.set(projectId, 'pending');
        setVerificationStatus(new Map(status));

        const result = await JiraApiService.getProjectHierarchy(projectId);
        
        if (result.success && result.data) {
          // Check if our hierarchy levels are properly configured
          const hierarchyData = result.data;
          const configuredLevels = config.levels.filter(level => 
            hierarchyData.levels.some(hl => hl.issueTypeId === level.issueTypeId)
          );

          if (configuredLevels.length === config.levels.length) {
            status.set(projectId, 'verified');
            setVerificationStatus(new Map(status));
          } else {
            status.set(projectId, 'failed');
            setVerificationStatus(new Map(status));
            allConfigured = false;
          }
        } else {
          status.set(projectId, 'failed');
          setVerificationStatus(new Map(status));
          allConfigured = false;
        }
      } catch (error) {
        status.set(projectId, 'failed');
        setVerificationStatus(new Map(status));
        allConfigured = false;
      }
    }

    setLoading(false);
    return allConfigured;
  };

  const handleVerifyConfiguration = async () => {
    const isConfigured = await verifyHierarchyConfiguration();
    
    if (isConfigured) {
      onSuccess('Hierarchy configuration verified successfully!');
      onHierarchyPlaced();
    } else {
      onError('Hierarchy configuration incomplete. Please ensure all levels are properly placed in Jira settings.');
    }
  };

  const renderInstructionsForPremium = () => (
    <div className="instructions premium">
      <h3>Configure Hierarchy in Jira Settings</h3>
      <div className="step-by-step">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Access Issue Type Hierarchy Settings</h4>
            <p>Navigate to Jira Settings → Issues → Issue type hierarchy</p>
            <a 
              href={generateJiraSettingsUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="settings-link"
            >
              Open Jira Issue Type Settings →
            </a>
          </div>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Configure Hierarchy Levels</h4>
            <p>Drag and drop the newly created issue types to position them above Epic:</p>
            <div className="hierarchy-example">
              {config.levels.sort((a, b) => b.position - a.position).map(level => (
                <div key={level.id} className="hierarchy-item new">
                  📋 {level.name} <span className="new-badge">NEW</span>
                </div>
              ))}
              <div className="hierarchy-item existing">📊 Epic</div>
              <div className="hierarchy-item existing">📄 Story</div>
              <div className="hierarchy-item existing">📝 Sub-task</div>
            </div>
          </div>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Apply to Projects</h4>
            <p>Ensure the hierarchy is applied to your selected projects:</p>
            <ul>
              {config.selectedProjects.map(projectId => {
                // Find project name from the projects list (this would be passed as prop in real implementation)
                return <li key={projectId}>Project ID: {projectId}</li>;
              })}
            </ul>
          </div>
        </div>

        <div className="step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h4>Save Configuration</h4>
            <p>Save your changes in Jira and return here to verify the configuration.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInstructionsForStandard = () => (
    <div className="instructions standard">
      <h3>Jira Standard Limitations</h3>
      <div className="info-box warning">
        <h4>⚠️ Manual Configuration Required</h4>
        <p>
          Jira Standard does not provide an API for configuring issue type hierarchy above Epic level. 
          The issue types have been created and added to your projects, but you need to manually 
          configure the hierarchy relationships in Jira administration.
        </p>
      </div>

      <div className="manual-steps">
        <h4>Manual Configuration Steps:</h4>
        <ol>
          <li>Go to Jira Settings → Issues → Issue types</li>
          <li>Locate the newly created issue types: {config.levels.map(l => l.name).join(', ')}</li>
          <li>Configure parent-child relationships if supported by your Jira instance</li>
          <li>Test the hierarchy by creating test issues</li>
        </ol>
      </div>

      <div className="alternative-solution">
        <h4>Alternative: Custom Roadmap View</h4>
        <p>
          Since native hierarchy configuration is limited in Jira Standard, this plugin provides 
          a custom roadmap view that will visualize your hierarchical structure. You can proceed 
          to the next step to access this custom view.
        </p>
      </div>
    </div>
  );

  const renderVerificationSection = () => (
    <div className="verification-section">
      <h3>Verify Hierarchy Configuration</h3>
      <p>Click the button below to verify that the hierarchy has been properly configured in Jira.</p>

      <div className="verification-status">
        {config.selectedProjects.map(projectId => {
          const status = verificationStatus.get(projectId) || 'pending';
          return (
            <div key={projectId} className={`project-status ${status}`}>
              <span className="project-id">Project: {projectId}</span>
              <span className="status-indicator">
                {status === 'pending' && '⏳ Pending'}
                {status === 'verified' && '✅ Verified'}
                {status === 'failed' && '❌ Failed'}
              </span>
            </div>
          );
        })}
      </div>

      <button
        className="primary-button"
        onClick={handleVerifyConfiguration}
        disabled={loading}
      >
        {loading ? 'Verifying Configuration...' : 'Verify Hierarchy Configuration'}
      </button>
    </div>
  );

  return (
    <div className="hierarchy-placement">
      <h2>Hierarchy Placement</h2>
      
      {isPremiumOrEnterprise ? (
        <div className="premium-flow">
          <p>Configure the hierarchical placement of your new issue types in Jira settings.</p>
          
          {showInstructions && (
            <>
              {renderInstructionsForPremium()}
              <div className="instructions-toggle">
                <button 
                  className="secondary-button"
                  onClick={() => setShowInstructions(false)}
                >
                  I've completed the configuration
                </button>
              </div>
            </>
          )}

          {!showInstructions && renderVerificationSection()}
        </div>
      ) : (
        <div className="standard-flow">
          {renderInstructionsForStandard()}
          
          <div className="proceed-section">
            <p>Since automatic verification is not available for Jira Standard, you can proceed to the custom roadmap view.</p>
            <button
              className="primary-button"
              onClick={onHierarchyPlaced}
            >
              Proceed to Roadmap View
            </button>
          </div>
        </div>
      )}

      <div className="actions">
        <button className="secondary-button" onClick={onBack} disabled={loading}>
          Back
        </button>
      </div>
    </div>
  );
};