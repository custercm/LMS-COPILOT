# CLEANUP_PLAN.md

## LMS Copilot Extension Cleanup Plan

This document outlines a step-by-step plan to clean up the LMS Copilot project before continuing development. Follow each step to ensure your codebase is organized, maintainable, and ready for future work.

---

### 1. Remove Unused and Obsolete Files

- Review all files and folders for unused scripts, markdown notes, and test artifacts.
- Delete any files related to deprecated features or old debugging attempts.
- Remove backup files (e.g., `backup-before-wiring-fix`).

---

### 2. Organize Project Structure

- Move documentation files (guides, instructions, changelogs) into a `/docs` folder.
- Ensure all source code is under `/src`.
- Place all tests in a dedicated `__tests__` or `/tests` directory.
- Group configuration files (e.g., `.github`, `.vscode`, `.env`) appropriately.

---

### 3. Update Documentation

- Review and update `README.md` to reflect the current state and usage.
- Ensure all guides (e.g., `PERSONAL_USE_GUIDE.md`, `LAUNCH_INSTRUCTIONS.md`) are accurate.
- Document any new cleanup steps or changes in `CHANGELOG.md`.

---

### 4. Clean Up Codebase

- Remove commented-out code and unnecessary console logs.
- Run a linter and formatter across all files for consistent style.
- Refactor any duplicated or messy code blocks.
- Ensure all functions and modules have clear, concise comments.

---

### 5. Review Dependencies

- Check `package.json` for unused dependencies and devDependencies.
- Remove any packages that are no longer required.
- Run `npm install` or `yarn install` to update the lock file.

---

### 6. Update .gitignore

- Ensure `.gitignore` covers build artifacts, logs, and sensitive files.
- Add any new files or folders that should not be tracked.

---

### 7. Validate Configuration Files

- Review all config files (`tsconfig.json`, `jest.config.js`, `webpack.config.js`, etc.) for unused or outdated settings.
- Remove or update settings as needed.

---

### 8. Test After Cleanup

- Run all unit and integration tests to confirm nothing is broken.
- Manually test the extension in VS Code to verify:
  - Chat interface works and matches the theme.
  - File operations function correctly.
  - Code completion and streaming responses are operational.
  - Model switching works as expected.
- Check for any errors or warnings in the output and terminal.

---

### 9. Final Review

- Commit all changes with a clear message (e.g., "Project cleanup and reorganization").
- Push to your repository and verify CI/CD (if set up) passes.
- Share the updated state with collaborators if applicable.

---

**After completing these steps, your LMS Copilot project will be clean, organized, and