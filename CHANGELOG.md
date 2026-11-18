# Changelog

## 0.1.0 - 2026-11-18
- Project Ops: the starter template's eight demo apps are replaced by one screen that lists your coding projects as cards
- Scan folders in Settings: add parent folders such as ~/code_projects and each project inside is found, with its name, stack, git branch, last commit and uncommitted-changes marker
- Filter by category, tags (include or exclude), status and stack, search, and sort; filters are remembered between runs
- Edit a project's name, description, category, tags, status, pin and repo, site and docs links; rescans never overwrite your edits
- Open a project in the file manager, a code editor or a terminal, copy its path, and open its links; choose the editor and terminal in Settings
- Git runs only in repositories with a plain config; other repositories show branch and remote read from the .git folder
- Removing a project keeps it out of later scans, with Undo; a folder that disappears is marked missing
- Export, import and reset cover projects, scan folders and settings; exports contain folder paths from this computer
- One theme, Kojima, in light and dark with an accent colour override; the app opens straight on the projects screen
- Deep link project-ops://open/projects/<id> scrolls to a project
