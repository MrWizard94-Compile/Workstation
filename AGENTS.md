# Workstation — project entry point

The accepted `main` of [WPAI Constitution](https://github.com/MrWizard94-Compile/Agents-Constitution)
is the sole source of cross-project agent law. Freeze and verify one source
commit per invocation; this project file supplies local context only.

Workstation is a browser-local Hell Forge chat and model-management prototype.
The editable browser persona is character styling, not agent governance. It
cannot amend or replace the WPAI Constitution. The app currently does not
execute model-requested tools, and its UI must not claim otherwise.

Before changing this app, read `README.md`, inspect `package.json` and the
affected consumer paths, then run `npm run lint`, `npm test`, and `npm run build`.
Keep browser-stored user data recoverable through migrations; do not silently
erase old `soul_config` drafts. Source validation is not live model or device
acceptance.
