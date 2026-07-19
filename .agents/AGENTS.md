# Project Rules

- After making any changes: commit (add a "By Antigravity: " preffix to the commit message) and push everything to git, make sure localhost version is updated and running. Let me know in your response that you did all these three (if you did ...)
- Get rid of files in the project which are remains of old code/architecture/config and are not needed any more. (exception is the legacy folder, which we will leave as is)
- Try and make changes as reusable as possible and try to avoid implementing ad-hoc logics in case reuse can be achieved. If new features/changes come in which are similar to existing code, try and refactor for reusability and simplicity of code. Try and let me know of such refactoring, and ask me if changes are big and you want my approval.
- When fixing a bug, try to find other similar entities (objects, functions, GUI elements, etc) and see if the same bug appears there as well. If so, fix those other places as well, and let me know - this could be another example of refactoring for reuse.
- just to be clear: there should be no game specific logics (for any of the games under the games folder) in the framework (under the boardgame-core folder).
- **Vite Caching Issue:** If you make changes to UI components in the workspace packages (`boardgame-core`, `king-of-tokyo`, etc) and the user does not see them after a browser refresh, Vite has cached the old `dist` files. You MUST:
  1. Rebuild the packages: `npm run build --workspaces`
  2. Clear Vite cache and restart: `rm -rf deployments/portal/node_modules/.vite && rm -rf node_modules/.vite && npm run dev --workspace=deployments/portal -- --force` (or tell the user to restart their own dev server with `--force`).
- **Laser Focus**: When fixing a bug or adding a specific feature, do NOT change unrelated code or UI labels (e.g. changing button texts) unless specifically requested. Always keep the changes strictly scoped to the exact problem being solved.
