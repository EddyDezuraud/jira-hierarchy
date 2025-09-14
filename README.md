# Jira Hierarchy Plugin

![CI/CD Status](https://github.com/EddyDezuraud/jira-hierarchy/workflows/CI/CD%20Pipeline/badge.svg)

An Atlassian Forge plugin that enables Jira Cloud administrators to define up to 3 new hierarchical levels above Epics and visualize them in Roadmap views.

## Overview

By default, Jira Cloud supports this hierarchy:
```
Epic → Story/Task → Sub-task
```

This plugin extends it to support:
```
Level 3 → Level 2 → Level 1 → Epic → Story/Task → Sub-task
```

**Example hierarchy:**
```
Initiative → Capability → Program → Epic → Story → Sub-task
```

## Features

### ✅ Core Functionality
- **1-3 Hierarchical Levels**: Create up to 3 new issue types above Epic level
- **Automatic Issue Type Creation**: Uses Jira REST API to create standard issue types
- **Project Integration**: Automatically adds new types to selected project schemes
- **Duplicate Prevention**: Checks for existing issue types before creation
- **Smart Rollback**: Complete cleanup with one-click rollback functionality

### ✅ Jira Edition Support
- **Premium/Enterprise**: Full native integration with Advanced Roadmaps
- **Standard**: Custom roadmap visualization with tree and timeline views
- **Automatic Detection**: Identifies your Jira edition and adapts features accordingly

### ✅ User Experience
- **Step-by-Step Wizard**: Guided setup process with clear instructions
- **Real-time Validation**: Immediate feedback on configuration issues
- **Comprehensive Diagnostics**: Project-by-project health monitoring
- **Responsive Design**: Works on desktop and mobile devices

## Installation & Setup

### Prerequisites
- Jira Cloud instance (Standard, Premium, or Enterprise)
- Administrative privileges in Jira
- Forge CLI installed (for deployment)

### Installation Steps

1. **Install Forge CLI**
   ```bash
   npm install -g @forge/cli
   ```

2. **Clone and Setup**
   ```bash
   git clone https://github.com/EddyDezuraud/jira-hierarchy.git
   cd jira-hierarchy/app
   npm install
   ```

3. **Configure Forge**
   ```bash
   forge login
   forge create
   ```

4. **Deploy the Plugin**
   ```bash
   npm run build
   forge deploy
   forge install --product jira
   ```

### Required Permissions

The plugin requires these Forge scopes:

```yaml
permissions:
  scopes:
    - read:jira-work          # Read issues and projects
    - write:jira-work         # Create and modify issues
    - manage:jira-configuration # Manage issue types and schemes
    - read:issue-type:jira    # Read issue type information
    - manage:jira-project     # Modify project configurations
    - read:me                 # User context information
```

**Justification:**
- `manage:jira-configuration`: Required to create issue types and modify schemes
- `write:jira-work`: Needed for issue type creation via REST API
- `manage:jira-project`: Essential for updating project issue type schemes
- `read:*` permissions: For validation and diagnostics functionality

## Usage Guide

### Step 1: Access the Plugin

1. Navigate to any Jira project
2. Go to **Project settings** → **Hierarchy Management**
3. The plugin interface will open

### Step 2: Prerequisites Check

The plugin automatically detects:
- Your Jira edition (Standard/Premium/Enterprise)
- Available features and limitations
- Compatibility with Advanced Roadmaps

### Step 3: Configure Hierarchy Levels

1. **Choose number of levels** (1-3)
2. **Name your levels** (default suggestions provided):
   - Level 1: Program
   - Level 2: Capability  
   - Level 3: Initiative
3. **Preview hierarchy** before creation
4. **Create issue types** with one click

### Step 4: Project Mapping

1. **Select projects** where hierarchy should be enabled
2. **Review impact** on existing issue type schemes
3. **Apply configuration** to update project schemes
4. **Monitor progress** as each project is updated

### Step 5: Hierarchy Placement

#### For Jira Premium/Enterprise:
1. **Follow guided instructions** to access Jira settings
2. **Configure hierarchy** in Issue Type Hierarchy settings
3. **Verify configuration** using the built-in checker
4. **Access native Roadmaps** with full hierarchy support

#### For Jira Standard:
1. **Manual configuration** instructions provided
2. **Skip verification** (API limitations)
3. **Use custom roadmap** view for visualization

### Step 6: Visualization

#### Premium/Enterprise Users:
- Access native Advanced Roadmaps
- Full hierarchy support automatically enabled
- All existing Roadmap features work with new levels

#### Standard Users:
- Custom roadmap view with two modes:
  - **Tree View**: Hierarchical structure visualization
  - **Timeline View**: Gantt-style project timeline
- Drag & drop functionality for relationship management

## API Endpoints Used

The plugin integrates with these Jira REST API endpoints:

### Issue Type Management
```
POST /rest/api/3/issuetype
GET  /rest/api/3/issuetype
DELETE /rest/api/3/issuetype/{id}
```

### Issue Type Schemes
```
GET  /rest/api/3/issuetypescheme/{id}
PUT  /rest/api/3/issuetypescheme/{id}
```

### Project Hierarchy
```
GET  /rest/api/3/project/{projectId}/hierarchy
```

### Projects
```
GET  /rest/api/3/project
GET  /rest/api/3/project/{projectId}/statuses
```

## Diagnostics & Troubleshooting

### Built-in Diagnostics

The plugin provides comprehensive diagnostics showing:

- **Project Status**: Configuration state per project
- **Issue Type Creation**: Success/failure status for each level
- **Scheme Integration**: Verification of scheme updates
- **Hierarchy Configuration**: Confirmation of proper placement
- **Roadmap Compatibility**: Native vs. custom view availability

### Common Issues

#### ❌ "Issue type already exists"
**Solution**: Choose different names for your hierarchy levels

#### ❌ "Failed to update issue type scheme"
**Solution**: Verify admin permissions and try again

#### ❌ "Hierarchy not properly configured"
**Solution**: Complete manual configuration in Jira settings (Premium/Enterprise)

#### ❌ "Projects not visible in roadmap"
**Solution**: Check project permissions and scheme associations

### Rollback Process

If you need to remove the hierarchy configuration:

1. **Access Diagnostics** page in the plugin
2. **Review current state** to understand impact
3. **Execute rollback** - this will:
   - Remove hierarchy levels from all project schemes
   - Delete the created issue types
   - Restore original project configurations
4. **Verify cleanup** using diagnostics

⚠️ **Warning**: Rollback cannot be undone. Any issues created with the hierarchy levels will need manual cleanup.

## Development

### Local Development

```bash
# Install dependencies
cd app && npm install

# Run linting
npm run lint

# Run tests
npm run test

# Build application
npm run build

# Start development tunnel
forge tunnel
```

### Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Run tests in watch mode
npm run test:watch
```

### Architecture

```
app/
├── src/
│   ├── index.ts          # Forge resolver entry point
│   ├── jiraApi.ts        # Jira REST API service
│   ├── types.ts          # TypeScript type definitions
│   ├── roadmapView.tsx   # Custom roadmap component
│   └── ui/               # React UI components
│       ├── index.tsx     # React app entry point
│       ├── HierarchyManager.tsx
│       ├── HierarchySetup.tsx
│       ├── ProjectMapping.tsx
│       ├── HierarchyPlacement.tsx
│       ├── Diagnostics.tsx
│       └── styles.css
├── manifest.yml          # Forge app configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Limitations & Considerations

### Known Limitations

1. **Jira Standard Hierarchy**: No API available for configuring hierarchy above Epic level
2. **Manual Configuration**: Premium/Enterprise users must manually configure hierarchy in Jira settings
3. **Project Scheme Dependency**: Projects must have issue type schemes configured
4. **Permission Requirements**: Full administrative access needed for configuration

### Performance Considerations

- **Batch Operations**: API calls are made sequentially to avoid rate limiting
- **Caching**: Project and scheme data cached during setup process
- **Error Handling**: Graceful degradation when API calls fail

### Security Notes

- **Scope Minimization**: Only essential permissions requested
- **Input Validation**: All user inputs validated before API calls
- **Error Sanitization**: Sensitive information filtered from error messages

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** and ensure tests pass
4. **Submit pull request** with clear description

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with React rules
- **Testing**: Jest with React Testing Library
- **Coverage**: Minimum 80% test coverage required

## Support & Resources

### Documentation
- [Atlassian Forge Documentation](https://developer.atlassian.com/platform/forge/)
- [Jira REST API Reference](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Advanced Roadmaps Documentation](https://confluence.atlassian.com/jiracloud/advanced-roadmaps-991143715.html)

### Getting Help
- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Community support and questions
- **Wiki**: Detailed setup guides and troubleshooting

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0 (Initial Release)
- ✅ Hierarchy level creation (1-3 levels)
- ✅ Project mapping and scheme integration
- ✅ Premium/Enterprise native roadmap support
- ✅ Standard edition custom roadmap view
- ✅ Comprehensive diagnostics and rollback
- ✅ Step-by-step setup wizard
- ✅ Responsive UI design
- ✅ Full CI/CD pipeline

---

**Made with ❤️ for the Jira community**