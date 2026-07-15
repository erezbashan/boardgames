# Project Rules

- Do not wait for user approval on implementation plans - just go ahead and execute them automatically. Unless there are major open questions.
- After making any changes: push everything to git, make sure localhost version is updated and running, and deploy to prod. Let me know in your response that you did all these three (if you did ...)
- Get rid of files in the project which are remains of old code/architecture/config and are not needed any more.
- Try and make changes as reusable as possible and try to avoid implementing ad-hoc logics in case reuse can be achieved. If new features/changes come in which are similar to existing code, try and refactor for reusability and simplicity of code. Try and let me know of such refactoring, and ask me if changes are big and you want my approval.
- When fixing a bug, try to find other similar entities (objects, functions, GUI elements, etc) and see if the same bug appears there as well. If so, fix those other places as well, and let me know - this could be another example of refactoring for reuse.
