# Changelog

## 0.2.0 - 2026-11-22
- Project dossier page: open a project from its card name, a dashboard tile or a deep link to see its details laid out as one page, with its folder, git state, stack, links and a timeline
- Site details on each project: client, hosting, launch date, services used and notes, edited in the project dialog; notes are plain text and are not encrypted, so keep secrets out of them
- Search also finds projects by client, hosting or services
- "All projects" on the dossier returns to the grid with that project's card selected; the command palette has "Back to all projects"
- Deep link project-ops://open/projects/<id> now opens the project's dossier page instead of only scrolling to its card
- Project cards: the footer buttons are now in the order editor, terminal, folder
- Tags read in sentence case everywhere (the project page and the edit dialog), as typed
- A selected row in lists shows a 2 px accent bar
- The Editor button's accessible name now starts with "Editor"
- Status colours, toasts, the title block and the project stamp share one set of tones
- Form fields in the project and link dialogs can show an error message under the field
- Development builds have a Styleguide screen (Ctrl/Cmd+3) that catalogues every colour, component and pattern in dark and light; release builds do not include it

## 0.1.0 - 2026-11-18
- Project Ops: the starter template's eight demo apps are replaced by one screen that lists your coding projects as cards
- Scan folders in Settings: add parent folders such as ~/code_projects and each project inside is found, with its name, stack, git branch, last commit and uncommitted-changes marker
- Filter by category, tags (include or exclude), status and stack, search, and sort; filters are remembered between runs
- Edit a project's name, description, category, tags, status, pin and repo, site and docs links; rescans never overwrite your edits
- Open a project in the file manager, a code editor or a terminal, copy its path, and open its links; choose the editor and terminal in Settings
- Git runs only in repositories with a plain config, pinned to that folder; other repositories show branch and remote read from the .git folder
- Removing a project keeps it out of later scans, with Undo; a folder that disappears is marked missing
- Export, import and reset cover projects, scan folders and settings; exports contain folder paths from this computer
- Dashboard home screen: pinned projects and the projects you opened most recently as compact tiles, each one click from your editor, terminal or file manager
- Resource links on the dashboard: keep https links to hosting, domains and other tools under group headings; they are part of export, import and reset
- A Dashboard / Projects switch in the title bar
- One theme, Kojima, in light and dark with an accent colour override; the app opens on the dashboard
- Deep link project-ops://open/projects/<id> scrolls to a project
