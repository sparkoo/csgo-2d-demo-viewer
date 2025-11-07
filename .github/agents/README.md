# GitHub Copilot Agents

This directory contains the Agent Writer Specialist, a meta agent that helps you create and maintain custom GitHub Copilot agents for the CS2 2D Demo Viewer repository.

## Available Agent

### Agent Writer Specialist (`agent-writer-specialist.md`)
**Expertise**: Agent design, prompt engineering, documentation structure

This meta agent helps you:
- Create new GitHub Copilot agents tailored to specific areas of the codebase
- Update and maintain agent definitions as the repository evolves
- Ensure agent quality, consistency, and usefulness
- Follow best practices for agent structure and documentation
- Design agents that provide valuable, actionable guidance

**Example use cases**:
- "Create a new agent specialized in Go parser development"
- "Create an agent for frontend/Preact work"
- "Design an agent to help with CI/CD and GitHub Actions"
- "Update existing agents after major repository changes"
- "Create a documentation specialist agent"

## How to Use the Agent Writer Specialist

### Creating Custom Agents

When you need specialized help for a specific area of the codebase, use the Agent Writer Specialist to create a custom agent:

```
@workspace I need to create a GitHub Copilot agent for Go parser work. 
Use the agent-writer-specialist to help me design an agent that specializes in:
- Go programming and WebAssembly
- CS2 demo parsing with demoinfocs-golang
- Protocol buffer integration
- WASM build process
```

### In GitHub Copilot Chat

Reference the agent when you need to create or maintain agents:

```
@workspace /agent agent-writer-specialist
I need to create a new agent for frontend development
```

### Why a Meta Agent Approach?

Instead of maintaining pre-built agents for every domain, the Agent Writer Specialist:
- ✅ **Adapts to change**: Create agents as needed when the codebase evolves
- ✅ **Stays current**: New agents reflect the current state of the repository
- ✅ **Provides flexibility**: Design agents tailored to specific, emerging needs
- ✅ **Reduces maintenance**: One meta agent instead of many domain agents to keep updated
- ✅ **Ensures consistency**: All agents follow the same proven template and standards

## Agent Writer Capabilities

The Agent Writer Specialist provides:
- ✅ **Complete templates** for creating well-structured agents
- ✅ **Step-by-step guidance** for agent design and creation
- ✅ **Quality checklists** to ensure agents are useful and actionable
- ✅ **Best practices** for prompt engineering and documentation
- ✅ **Common pitfalls** to avoid when designing agents
- ✅ **Maintenance guidelines** for keeping agents current

## When to Create New Agents

Consider creating a specialized agent when:
- You have a distinct component or domain (parser, frontend, backend, etc.)
- The area has its own build/test procedures and conventions
- There's sufficient complexity to warrant dedicated guidance
- You need consistent, reusable expertise for that domain
- The component is stable enough to document patterns

## Repository Context

The Agent Writer Specialist works with the general repository instructions in `.github/copilot-instructions.md` and can help you create agents that provide specialized knowledge on top of that foundation.

## Getting Started

1. **Review the agent-writer-specialist.md** to understand agent structure and best practices
2. **Identify a need** for specialized guidance in a specific area
3. **Use the Agent Writer Specialist** to design and create your custom agent
4. **Test the agent** to ensure it provides useful, actionable guidance
5. **Maintain the agent** as the codebase evolves

---

For general repository information and guidelines, see [copilot-instructions.md](../copilot-instructions.md).
For the meta agent itself, see [agent-writer-specialist.md](agent-writer-specialist.md).
