import React, { useState, useEffect } from 'react';
import { HierarchyLevel, JiraProject, HierarchyConfig, DiagnosticResult } from '../types';
import { JiraApiService } from '../jiraApi';
import { HierarchySetup } from './HierarchySetup';
import { ProjectMapping } from './ProjectMapping';
import { HierarchyPlacement } from './HierarchyPlacement';
import { RoadmapView } from './RoadmapView';
import { Diagnostics } from './Diagnostics';

interface HierarchyManagerProps {
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export const HierarchyManager: React.FC<HierarchyManagerProps> = ({ onError, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<'prerequisites' | 'setup' | 'mapping' | 'placement' | 'roadmap' | 'diagnostics'>('prerequisites');
  const [config, setConfig] = useState<HierarchyConfig>({
    levels: [],
    selectedProjects: [],
    isConfigured: false,
    jiraInstance: 'standard'
  });
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [prerequisites, setPrerequisites] = useState({
    instanceType: 'unknown' as 'unknown' | 'standard' | 'premium' | 'enterprise',
    hasAdvancedRoadmaps: false,
    isValid: false
  });

  useEffect(() => {
    checkPrerequisites();
    loadProjects();
  }, []);

  const checkPrerequisites = async () => {
    setLoading(true);
    try {
      const instanceResult = await JiraApiService.detectJiraInstanceType();
      if (instanceResult.success && instanceResult.data) {
        const instanceType = instanceResult.data;
        setPrerequisites({
          instanceType,
          hasAdvancedRoadmaps: instanceType === 'premium' || instanceType === 'enterprise',
          isValid: true
        });
        setConfig(prev => ({ ...prev, jiraInstance: instanceType }));
      } else {
        onError(instanceResult.error || 'Failed to detect Jira instance type');
      }
    } catch (error) {
      onError(`Error checking prerequisites: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    const result = await JiraApiService.getProjects();
    if (result.success && result.data) {
      setProjects(result.data);
    } else {
      onError(result.error || 'Failed to load projects');
    }
  };

  const handleLevelsConfigured = (levels: HierarchyLevel[]) => {
    setConfig(prev => ({ ...prev, levels }));
    setCurrentStep('mapping');
  };

  const handleProjectsSelected = (projectIds: string[]) => {
    setConfig(prev => ({ ...prev, selectedProjects: projectIds }));
    setCurrentStep('placement');
  };

  const handleHierarchyPlaced = () => {
    setConfig(prev => ({ ...prev, isConfigured: true }));
    setCurrentStep('roadmap');
  };

  const renderPrerequisites = () => (
    <div className="prerequisites-check">
      <h2>Prerequisites Check</h2>
      {loading ? (
        <div className="loading">Checking Jira instance configuration...</div>
      ) : (
        <div className="prerequisites-results">
          <div className={`prerequisite ${prerequisites.instanceType !== 'unknown' ? 'valid' : 'invalid'}`}>
            <span className="icon">{prerequisites.instanceType !== 'unknown' ? '✅' : '⚠️'}</span>
            <span>Instance Type: {prerequisites.instanceType.toUpperCase()}</span>
          </div>
          
          {prerequisites.instanceType === 'standard' && (
            <div className="info-box warning">
              <h3>Jira Standard Detected</h3>
              <p>Your Jira instance is Standard edition. You will be able to create hierarchical issue types, 
              but the native Roadmap view will have limited support. The plugin will provide a custom 
              roadmap view for visualization.</p>
            </div>
          )}
          
          {(prerequisites.instanceType === 'premium' || prerequisites.instanceType === 'enterprise') && (
            <div className="info-box success">
              <h3>Jira {prerequisites.instanceType.charAt(0).toUpperCase() + prerequisites.instanceType.slice(1)} Detected</h3>
              <p>Your Jira instance supports Advanced Roadmaps. Once configured, the hierarchical 
              levels will be automatically available in the native Roadmap view.</p>
            </div>
          )}
          
          {prerequisites.isValid && (
            <button 
              className="primary-button"
              onClick={() => setCurrentStep('setup')}
            >
              Continue to Setup
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep === 'prerequisites' ? 'active' : 'completed'}`}>
        1. Prerequisites
      </div>
      <div className={`step ${currentStep === 'setup' ? 'active' : currentStep === 'prerequisites' ? 'inactive' : 'completed'}`}>
        2. Setup Levels
      </div>
      <div className={`step ${currentStep === 'mapping' ? 'active' : ['prerequisites', 'setup'].includes(currentStep) ? 'inactive' : 'completed'}`}>
        3. Project Mapping
      </div>
      <div className={`step ${currentStep === 'placement' ? 'active' : ['prerequisites', 'setup', 'mapping'].includes(currentStep) ? 'inactive' : 'completed'}`}>
        4. Hierarchy Placement
      </div>
      <div className={`step ${currentStep === 'roadmap' ? 'active' : ['prerequisites', 'setup', 'mapping', 'placement'].includes(currentStep) ? 'inactive' : 'completed'}`}>
        5. Roadmap View
      </div>
    </div>
  );

  return (
    <div className="hierarchy-manager">
      <div className="header">
        <h1>Jira Hierarchy Management</h1>
        <p>Configure hierarchical issue types above Epics</p>
      </div>

      {currentStep !== 'prerequisites' && renderStepIndicator()}

      <div className="content">
        {currentStep === 'prerequisites' && renderPrerequisites()}
        
        {currentStep === 'setup' && (
          <HierarchySetup 
            onLevelsConfigured={handleLevelsConfigured}
            onError={onError}
            onSuccess={onSuccess}
          />
        )}
        
        {currentStep === 'mapping' && (
          <ProjectMapping
            projects={projects}
            levels={config.levels}
            onProjectsSelected={handleProjectsSelected}
            onError={onError}
            onSuccess={onSuccess}
            onBack={() => setCurrentStep('setup')}
          />
        )}
        
        {currentStep === 'placement' && (
          <HierarchyPlacement
            config={config}
            onHierarchyPlaced={handleHierarchyPlaced}
            onError={onError}
            onSuccess={onSuccess}
            onBack={() => setCurrentStep('mapping')}
          />
        )}
        
        {currentStep === 'roadmap' && (
          <RoadmapView
            config={config}
            projects={projects}
            onError={onError}
            onSuccess={onSuccess}
            onBack={() => setCurrentStep('placement')}
            onViewDiagnostics={() => setCurrentStep('diagnostics')}
          />
        )}
        
        {currentStep === 'diagnostics' && (
          <Diagnostics
            config={config}
            projects={projects}
            onError={onError}
            onSuccess={onSuccess}
            onBack={() => setCurrentStep('roadmap')}
          />
        )}
      </div>
    </div>
  );
};