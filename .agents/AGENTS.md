# Project Rules

- Always prepare an implementation plan and wait for my approval. After each change show me the diffs to the changed files.
- After making any changes: commit (add a "By Antigravity: " preffix to the commit message) and push everything to git, make sure localhost version is updated and running. Let me know in your response that you did all these three (if you did ...)
- Get rid of files in the project which are remains of old code/architecture/config and are not needed any more. (exception is the legacy folder, which we will leave as is)
- Try and make changes as reusable as possible and try to avoid implementing ad-hoc logics in case reuse can be achieved. If new features/changes come in which are similar to existing code, try and refactor for reusability and simplicity of code. Try and let me know of such refactoring, and ask me if changes are big and you want my approval.
- When fixing a bug, try to find other similar entities (objects, functions, GUI elements, etc) and see if the same bug appears there as well. If so, fix those other places as well, and let me know - this could be another example of refactoring for reuse.
