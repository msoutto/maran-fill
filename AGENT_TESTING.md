# Testing Agent-Oriented TypeScript Code

## 1. Unit Testing

- Test each agent's decision logic in isolation.
- Use frameworks like Jest or Mocha.

## 2. Integration Testing

- Test agent interactions and communication.
- Simulate environment scenarios.

## 3. Mocking

- Mock environment and other agents to isolate tests.

## 4. Example (Jest)

```typescript
test("Agent acts on goal", () => {
  const agent = new MyAgent();
  agent.perceive(mockEnv);
  agent.decide();
  expect(agent.action).toBe("expectedAction");
});
```

## 5. Automation

- Add tests to CI pipelines.

See `AGENT_COLLABORATION.md` for team practices.
