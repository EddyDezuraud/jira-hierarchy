import React, { useState, useEffect } from 'react';
import { HierarchyConfig, JiraProject } from '../types';

interface RoadmapViewProps {
  config: HierarchyConfig;
  projects: JiraProject[];
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  onBack: () => void;
  onViewDiagnostics: () => void;
}

interface HierarchyNode {
  id: string;
  title: string;
  type: string;
  level: number;
  children: HierarchyNode[];
  parentId?: string;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  config,
  projects,
  onError,
  onSuccess,
  onBack,
  onViewDiagnostics
}) => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'timeline'>('tree');

  const isPremiumOrEnterprise = config.jiraInstance === 'premium' || config.jiraInstance === 'enterprise';
  const selectedProjects = projects.filter(p => config.selectedProjects.includes(p.id));

  useEffect(() => {
    if (selectedProject) {
      loadHierarchyData(selectedProject);
    }
  }, [selectedProject]);

  const loadHierarchyData = async (projectId: string) => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch actual issue data
      // For now, we'll create mock data to demonstrate the hierarchy
      const mockData = generateMockHierarchyData(projectId);
      setHierarchyData(mockData);
      onSuccess('Hierarchy data loaded successfully');
    } catch (error) {
      onError(`Failed to load hierarchy data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const generateMockHierarchyData = (projectId: string): HierarchyNode[] => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];

    // Generate mock hierarchy based on configured levels
    const mockData: HierarchyNode[] = [];
    
    config.levels.sort((a, b) => b.position - a.position).forEach((level, levelIndex) => {
      for (let i = 1; i <= 2; i++) { // Create 2 items per level for demo
        const node: HierarchyNode = {
          id: `${level.id}-${i}`,
          title: `${level.name} ${i}`,
          type: level.name,
          level: level.position,
          children: []
        };

        // Add child nodes (next level down)
        if (level.position === 1) {
          // Level 1 connects to Epics
          for (let j = 1; j <= 3; j++) {
            node.children.push({
              id: `epic-${i}-${j}`,
              title: `Epic ${i}.${j}`,
              type: 'Epic',
              level: 0,
              children: [],
              parentId: node.id
            });
          }
        }

        mockData.push(node);
      }
    });

    return mockData;
  };

  const generateNativeRoadmapUrl = () => {
    if (!selectedProject) return '#';
    // This would generate the actual Jira Roadmap URL for the selected project
    return `/secure/RapidBoard.jspa?rapidView=${selectedProject}&view=planning`;
  };

  const renderPremiumRoadmapView = () => (
    <div className="premium-roadmap">
      <div className="native-roadmap-section">
        <h3>Native Jira Roadmap</h3>
        <p>
          Your Jira {config.jiraInstance.charAt(0).toUpperCase() + config.jiraInstance.slice(1)} instance 
          supports Advanced Roadmaps with the configured hierarchy levels.
        </p>
        
        <div className="roadmap-access">
          <div className="project-selector">
            <label htmlFor="projectSelect">Select project to view roadmap:</label>
            <select 
              id="projectSelect"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">Choose a project...</option>
              {selectedProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div className="roadmap-link">
              <a 
                href={generateNativeRoadmapUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="roadmap-button primary-button"
              >
                Open {projects.find(p => p.id === selectedProject)?.name} Roadmap →
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="hierarchy-summary">
        <h4>Configured Hierarchy Levels:</h4>
        <div className="levels-list">
          {config.levels.sort((a, b) => b.position - a.position).map(level => (
            <div key={level.id} className="level-summary">
              <span className="level-name">{level.name}</span>
              <span className="level-position">Level {level.position}</span>
              <span className="level-status">
                {level.created ? '✅ Active' : '⚠️ Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCustomRoadmapView = () => (
    <div className="custom-roadmap">
      <h3>Custom Hierarchy Roadmap</h3>
      <p>
        Since you're using Jira Standard, this custom view displays your hierarchical structure.
      </p>

      <div className="view-controls">
        <div className="project-selector">
          <label htmlFor="customProjectSelect">Select project:</label>
          <select 
            id="customProjectSelect"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Choose a project...</option>
            {selectedProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.key})
              </option>
            ))}
          </select>
        </div>

        <div className="view-mode-selector">
          <label>View mode:</label>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
            >
              Tree View
            </button>
            <button 
              className={`mode-button ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              Timeline View
            </button>
          </div>
        </div>
      </div>

      {selectedProject && !loading && (
        <div className="roadmap-visualization">
          {viewMode === 'tree' ? renderTreeView() : renderTimelineView()}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <p>Loading hierarchy data...</p>
        </div>
      )}
    </div>
  );

  const renderTreeView = () => (
    <div className="tree-view">
      <div className="tree-container">
        {hierarchyData.map(node => renderTreeNode(node, 0))}
      </div>
    </div>
  );

  const renderTreeNode = (node: HierarchyNode, depth: number): React.ReactNode => (
    <div key={node.id} className={`tree-node level-${node.level}`} style={{ marginLeft: depth * 20 }}>
      <div className="node-content">
        <span className="node-icon">📋</span>
        <span className="node-title">{node.title}</span>
        <span className="node-type">{node.type}</span>
      </div>
      {node.children.length > 0 && (
        <div className="node-children">
          {node.children.map(child => renderTreeNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  const renderTimelineView = () => (
    <div className="timeline-view">
      <div className="timeline-header">
        <div className="timeline-months">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="timeline-month">
              {new Date(2024, i).toLocaleDateString('en', { month: 'short' })}
            </div>
          ))}
        </div>
      </div>
      <div className="timeline-content">
        {hierarchyData.map(node => (
          <div key={node.id} className={`timeline-row level-${node.level}`}>
            <div className="row-label">
              <span className="node-title">{node.title}</span>
              <span className="node-type">{node.type}</span>
            </div>
            <div className="timeline-bar">
              <div 
                className="bar" 
                style={{ 
                  left: `${Math.random() * 20}%`, 
                  width: `${30 + Math.random() * 40}%` 
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="roadmap-view">
      <h2>Roadmap View</h2>

      {isPremiumOrEnterprise ? renderPremiumRoadmapView() : renderCustomRoadmapView()}

      <div className="additional-actions">
        <div className="action-section">
          <h3>Additional Tools</h3>
          <div className="action-buttons">
            <button 
              className="secondary-button"
              onClick={onViewDiagnostics}
            >
              View Diagnostics
            </button>
            <button 
              className="secondary-button"
              onClick={() => window.open('/plugins/servlet/jira-hierarchy/help', '_blank')}
            >
              Help & Documentation
            </button>
          </div>
        </div>

        <div className="success-summary">
          <h3>🎉 Setup Complete!</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-number">{config.levels.length}</span>
              <span className="stat-label">Hierarchy Levels</span>
            </div>
            <div className="stat">
              <span className="stat-number">{config.selectedProjects.length}</span>
              <span className="stat-label">Projects Configured</span>
            </div>
            <div className="stat">
              <span className="stat-number">{isPremiumOrEnterprise ? 'Native' : 'Custom'}</span>
              <span className="stat-label">Roadmap Type</span>
            </div>
          </div>
          <p>
            Your Jira hierarchy has been successfully configured. 
            {isPremiumOrEnterprise 
              ? ' You can now use the native Advanced Roadmaps to visualize your hierarchical structure.'
              : ' You can now use the custom roadmap view to visualize your hierarchical structure.'
            }
          </p>
        </div>
      </div>

      <div className="actions">
        <button className="secondary-button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
};