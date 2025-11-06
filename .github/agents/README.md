# GitHub Copilot Agents

This directory contains specialized GitHub Copilot agent definitions for the CS2 2D Demo Viewer repository. Each agent is an expert in a specific area of the codebase and can be invoked to help with tasks in their domain.

## Available Agents

### 1. Go Parser Specialist (`go-parser-specialist.md`)
**Expertise**: Go programming, WebAssembly, CS2 demo parsing

Use this agent for:
- Modifying parser logic in `parser/` directory
- Working with Go WASM compilation
- Updating protocol buffer message handling
- Parser performance optimization
- Adding new demo parsing features

**Example tasks**: "Update the parser to extract additional player statistics", "Fix WASM build issue", "Optimize memory usage in parser"

### 2. Go Server Specialist (`go-server-specialist.md`)
**Expertise**: Go HTTP servers, backend services, proxy handling

Use this agent for:
- Modifying server code in `server/` directory
- Adding new HTTP endpoints
- Updating CORS configuration
- URL validation and security
- Static file serving

**Example tasks**: "Add new API endpoint for demo metadata", "Fix CORS issue in dev mode", "Update URL validation logic"

### 3. Frontend Specialist (`frontend-specialist.md`)
**Expertise**: JavaScript, Preact, Vite, WebAssembly integration

Use this agent for:
- Modifying frontend code in `web/` directory
- Player component updates
- UI/UX improvements
- WASM integration
- Canvas rendering

**Example tasks**: "Add new player control button", "Fix demo playback issue", "Improve map rendering performance"

### 4. Documentation Specialist (`documentation-specialist.md`)
**Expertise**: Technical writing, Markdown, API documentation

Use this agent for:
- Updating README files
- Writing user guides
- API documentation
- Tutorial creation
- Keeping docs in sync with code

**Example tasks**: "Update README with new feature", "Document new API endpoint", "Create setup guide for contributors"

### 5. Build and DevOps Specialist (`build-devops-specialist.md`)
**Expertise**: Build systems, CI/CD, Docker, GitHub Actions

Use this agent for:
- Makefile updates
- GitHub Actions workflows
- Docker configuration
- Dependency management
- Build optimization

**Example tasks**: "Add new GitHub Actions workflow", "Optimize Docker build", "Update build dependencies"

## How to Use These Agents

### In GitHub Copilot Chat

When working on a task, you can reference the appropriate agent to get specialized help:

```
@workspace /agent go-parser-specialist
I need to add a new feature to extract headshot percentages from demo files
```

### Choosing the Right Agent

1. **Identify the component**: Determine which part of the codebase you're working on
2. **Match to agent**: Select the agent whose expertise aligns with your task
3. **Provide context**: Give the agent specific details about what you need
4. **Follow guidance**: Apply the agent's recommendations and best practices

### Agent Decision Tree

```
Is it about...
├─ Go parser code? → go-parser-specialist
├─ Go server code? → go-server-specialist  
├─ Frontend/UI code? → frontend-specialist
├─ Documentation? → documentation-specialist
├─ Builds/CI/CD? → build-devops-specialist
└─ Multiple areas? → Start with most relevant agent, then consult others
```

## Agent Capabilities

Each agent:
- ✅ Understands the repository structure
- ✅ Knows the build and test commands
- ✅ Follows code conventions and best practices
- ✅ Can guide you through common tasks
- ✅ Provides security and performance considerations
- ✅ Helps maintain consistency across the codebase

## Best Practices

### When Using Agents

1. **Be Specific**: Provide clear context about what you're trying to achieve
2. **One Agent at a Time**: Start with the most relevant agent for your task
3. **Follow Recommendations**: Agents know the codebase patterns and best practices
4. **Test Changes**: Always test changes as recommended by the agent
5. **Update Docs**: If an agent helps you add features, consult the documentation-specialist to update docs

### When Tasks Span Multiple Agents

Some tasks may require expertise from multiple agents:

1. **New Feature**: frontend-specialist + go-parser-specialist + documentation-specialist
2. **Build Pipeline**: build-devops-specialist + (component-specific specialist)
3. **Major Refactor**: (component-specific specialist) + documentation-specialist

Start with the primary agent, then consult others as needed.

## Maintaining Agents

These agent definitions should be updated when:
- Repository structure changes significantly
- New major features are added
- Build processes change
- Dependencies or tooling updates
- Best practices evolve

## Contributing

When updating agents:
1. Keep agent expertise focused and clear
2. Update code examples to match current codebase
3. Ensure commands are accurate and tested
4. Maintain consistent formatting across agents
5. Update this README if agent purposes change

## Repository Context

All agents have access to the general repository instructions in `.github/copilot-instructions.md`. They provide specialized knowledge on top of that foundation.

---

For general repository information and guidelines, see [copilot-instructions.md](../copilot-instructions.md).
