# GitHub Copilot Agents

This directory contains specialized GitHub Copilot agents for different areas of the CS2 2D Demo Viewer codebase. Each agent provides expert guidance, commands, and best practices for their specific domain.

## Available Agents

### 1. Agent Writer Specialist (`agent-writer-specialist.md`)
**Expertise**: Agent design, prompt engineering, documentation structure

This meta agent helps you:
- Create new GitHub Copilot agents tailored to specific areas of the codebase
- Update and maintain agent definitions as the repository evolves
- Ensure agent quality, consistency, and usefulness
- Follow best practices for agent structure and documentation
- Design agents that provide valuable, actionable guidance

**Example tasks**:
- "Create a new agent specialized in documentation"
- "Update all agents after a major refactor"
- "Review agent quality and consistency"

### 2. Go Parser Specialist (`go-parser-specialist.md`)
**Expertise**: Go programming, WebAssembly, CS2 demo parsing, Protocol Buffers

Use this agent for:
- Working with the parser component in `parser/` directory
- Building and optimizing WebAssembly modules
- Integrating with demoinfocs-golang library
- Debugging WASM issues in the browser
- Adding new event types or parsing features

**Example tasks**:
- "Add support for a new game event in the parser"
- "Optimize WASM bundle size"
- "Fix parser failing on specific demo file"
- "Debug WASM loading issue in browser"

### 3. Frontend Specialist (`frontend-specialist.md`)
**Expertise**: Preact/React, JavaScript, Vite, 2D visualization, WASM integration

Use this agent for:
- Working with the web frontend in `web/` directory
- Building UI components and map visualizations
- Integrating with the WASM parser
- Optimizing rendering performance
- Adding new player controls or features

**Example tasks**:
- "Add a new map component for displaying grenades"
- "Optimize canvas rendering performance"
- "Fix WASM integration issue"
- "Add new player control feature"
- "Update UI component styling"

### 4. Server Specialist (`server-specialist.md`)
**Expertise**: Go HTTP server, reverse proxying, security, static file serving

Use this agent for:
- Working with the server component in `server/` directory
- Adding or modifying HTTP endpoints
- Improving security and input validation
- Configuring CORS and proxy settings
- Optimizing server performance

**Example tasks**:
- "Add rate limiting to demo download endpoint"
- "Improve URL validation for security"
- "Add new API endpoint"
- "Fix CORS issues in development mode"
- "Optimize static file serving"

### 5. Build & CI Specialist (`build-ci-specialist.md`)
**Expertise**: Make, GitHub Actions, Docker, build automation, dependency management

Use this agent for:
- Modifying build processes and Makefile
- Updating GitHub Actions workflows
- Maintaining Docker builds
- Managing dependencies (npm, Go modules)
- Configuring linters and CI checks

**Example tasks**:
- "Add new GitHub Actions workflow for testing"
- "Optimize Docker build for faster CI"
- "Update Go version across all workflows"
- "Add new Makefile target"
- "Configure new linter rules"

## How to Use These Agents

### In GitHub Copilot Chat

Reference agents when working on specific areas of the codebase:

```
@workspace /agent go-parser-specialist
I need to add support for a new game event in the parser
```

```
@workspace /agent frontend-specialist
Help me optimize the map rendering performance
```

```
@workspace /agent server-specialist
Add rate limiting to the download endpoint
```

```
@workspace /agent build-ci-specialist
Update the GitHub Actions workflow to use Go 1.26
```

### Choosing the Right Agent

- **Parser work** (Go, WASM, demo parsing) → Use `go-parser-specialist`
- **Frontend work** (UI, components, visualization) → Use `frontend-specialist`
- **Server work** (HTTP, proxying, security) → Use `server-specialist`
- **Build/CI work** (workflows, Docker, dependencies) → Use `build-ci-specialist`
- **Creating new agents** → Use `agent-writer-specialist`

### Agent Capabilities

Each specialized agent provides:
- ✅ **Expert knowledge** in their domain
- ✅ **Specific commands** for common tasks
- ✅ **Best practices** and code standards
- ✅ **Troubleshooting guides** for common issues
- ✅ **Integration points** with other components
- ✅ **Security considerations** for their domain

## Best Practices

1. **Be Specific**: Tell the agent exactly what you need
2. **Provide Context**: Include relevant error messages or code snippets
3. **Ask for Examples**: Request code examples when needed
4. **Iterate**: Refine your request based on the agent's response
5. **Combine Agents**: Use multiple agents for cross-cutting tasks

## Repository Structure Overview

For reference, here's how the agents map to the repository structure:

```
csgo-2d-demo-viewer/
├── parser/              → go-parser-specialist
├── server/              → server-specialist
├── web/                 → frontend-specialist
├── .github/
│   ├── workflows/       → build-ci-specialist
│   └── agents/          → agent-writer-specialist
├── Makefile             → build-ci-specialist
├── Dockerfile           → build-ci-specialist
└── browserplugin/       → (Use frontend-specialist or create dedicated agent)
```

## When to Create New Agents

The `agent-writer-specialist` can help you create new agents when:
- You have a distinct component with unique tools and processes
- The area is complex enough to warrant dedicated guidance
- You need consistent, reusable expertise for that domain
- The component is stable enough to document patterns

Consider creating agents for:
- Browser plugin development
- Protocol buffer management
- Database or storage layer (if added)
- API client libraries
- Documentation maintenance

## Maintaining Agents

Agents should be updated when:
- Build processes change
- New tools are introduced
- Major refactoring occurs
- Dependencies are updated significantly
- New best practices emerge

Use the `agent-writer-specialist` to help maintain consistency when updating agents.

---

For general repository information and guidelines, see [copilot-instructions.md](../copilot-instructions.md).
For the meta agent itself, see [agent-writer-specialist.md](agent-writer-specialist.md).
