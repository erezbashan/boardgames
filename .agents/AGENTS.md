- Always read and follow the instructions in all files under .agents/rules/

- just to be clear: there should be no game specific logics (for any of the games under the games folder) in the framework (under the boardgame-core folder).

- **Vite Caching Issue:** If you make changes to UI components in the workspace packages (`boardgame-core`, `king-of-tokyo`, etc) and the user does not see them after a browser refresh, Vite has cached the old `dist` files. You MUST:
  1. Rebuild the packages: `npm run build --workspaces`
  2. Clear Vite cache and restart: `rm -rf deployments/portal/node_modules/.vite && rm -rf node_modules/.vite && npm run dev --workspace=deployments/portal -- --force` (or tell the user to restart their own dev server with `--force`).
- **Card Architecture Strict Rule**: Any logic of a card MUST be limited entirely to the card's code file (e.g. `someCard.ts`). The generic game engine code (`reducer.ts`, `KotBoard.tsx`, etc.) MUST NOT contain any hardcoded references, variable checks, or logic tied to specific cards (e.g. no `includes('giant_brain')`). The engine should instead provide generic hooks, state properties, or contexts that cards can modify using their `onEvent` handlers.
