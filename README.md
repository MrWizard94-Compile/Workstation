# Workstation (Hell Forge)

Workstation is a browser-local prototype for chatting with an MLC/WebLLM model
and managing downloaded models. It does **not** execute model-requested tools,
provide cloud sync, or grant the model filesystem, database, or web access.
The original [AI Studio project](https://ai.studio/apps/8cc7e0f5-14bc-4be3-9b13-7928f5c5247e)
remains a historical design reference; this Git repository owns the code.

## Start here

Read [AGENTS.md](AGENTS.md) for project instructions. Cross-project agent law
has one editable source: the accepted `main` of the
[WPAI Constitution](https://github.com/MrWizard94-Compile/Agents-Constitution).
The in-app character persona is a browser-local preference, not a copy or
override of that law.

## Run and verify

Use Node.js 22 (the CI baseline) and npm. The npm lockfile is the sole active
dependency graph; the old unused Bun lockfile remains recoverable in Git
history. Then run:

```powershell
npm ci
npm run lint
npm test
npm run build
npm run dev
```

The application stores chat data and preferences in the browser. On upgrade,
an existing `soul_config` draft is retained but no longer sent to the model.
The dashboard offers explicit export and clear controls for that legacy data.
It does not automatically convert a former Constitution into a persona; create
and save a new persona if desired. The original tracked SOUL v2 file remains
in Git history:

Historical recovery (not active law): `git show ce8abaea43eabe8392b9663239c73d4ba5400b39:public/SOULv2.0.0.md`

Passing source checks does not establish that a model downloads or performs
well on a particular browser or device. Verify those flows separately before
calling this prototype deployment-ready.

The installed WebLLM 0.2.84 package is a single roughly 6 MB JavaScript
module. The build isolates that vendor chunk and applies an explicit 6.1 MB
cap to it while failing any other JavaScript chunk above 500 kB. This is a
narrow third-party size exception, not evidence that first-load performance is
acceptable on every device. Revisit it when upgrading WebLLM or changing the
model catalog.

CI freezes an accepted WPAI Constitution commit, validates that source, and
runs its read-only adoption check against this project before the Node quality
gates. Update the pinned commit only after accepting and validating a newer
canonical `main`; do not point CI at a floating branch.
