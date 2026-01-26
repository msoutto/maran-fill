# Agent-Oriented Development Workflow

## 1. Define Agent Interfaces

- Specify agent capabilities, goals, and communication methods.

## 2. Implement Agents

- Place agent classes in `src/agents/`.
- Ensure each agent is autonomous and encapsulates its own logic.

## 3. Environment Modeling

- Model the environment in `src/environment/`.
- Provide interfaces for agents to perceive and interact with the environment.

## 4. Communication

- Use message/event types in `src/messages/`.
- Implement message passing or event systems for agent interaction.

## 5. Iterative Development

- Write unit tests for each agent and environment component.
- Refactor agents to improve autonomy and modularity.

## 6. Documentation

- Document agent behaviors and protocols in markdown files.

See `AGENT_TESTING.md` for testing strategies.
