# Agent-Oriented TypeScript Project Setup

Follow these steps to set up your agent-oriented TypeScript project:

## 1. Prerequisites

- Node.js (LTS)
- npm or yarn
- TypeScript (`npm install -g typescript`)

## 2. Initialize Project

```sh
npm init -y
npm install typescript --save-dev
npx tsc --init
```

## 3. Directory Structure

- `src/agents/` – Agent implementations
- `src/environment/` – Environment models
- `src/messages/` – Communication types
- `tests/` – Test files

## 4. Linting & Formatting

```sh
npm install eslint prettier --save-dev
```

## 5. Scripts (package.json)

- `build`: `tsc`
- `start`: `node dist/index.js`
- `test`: `npm run test`

See `AGENT_WORKFLOW.md` for daily development steps.
