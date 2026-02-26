# Guide for AI Agents - Mimo Playground

Welcome! This guide helps you navigate and understand the Mimo Playground codebase efficiently.

## Overview

The Mimo Playground is a web-based IDE for the Mimo programming language, built with:
- **SvelteKit 2.x** with Svelte 5 (runes)
- **TailwindCSS 4.x** for styling
- **CodeMirror 6** for the code editor
- **ZenFS** for virtual filesystem with IndexedDB persistence

## Project Structure

```
playground/
├── src/
│   ├── lib/
│   │   ├── components/playground/   # UI components (11 total)
│   │   │   ├── HeaderBar.svelte      # Top navigation bar
│   │   │   ├── SidebarExplorer.svelte # File tree explorer
│   │   │   ├── SidebarTreeNode.svelte # Recursive tree node
│   │   │   ├── EditorPanel.svelte    # CodeMirror editor with tabs
│   │   │   ├── TerminalPanel.svelte  # Command input & logs
│   │   │   ├── OutputPanel.svelte    # Output/Errors/Warnings tabs
│   │   │   ├── AstViewerPanel.svelte # AST tree visualization
│   │   │   ├── AstTreeNode.svelte    # Recursive AST node
│   │   │   ├── SplitPane.svelte      # Resizable split panels
│   │   │   ├── SettingsModal.svelte  # Theme & editor settings
│   │   │   └── ShareModal.svelte     # Share link & ZIP download
│   │   │
│   │   ├── editor/                   # CodeMirror configuration
│   │   │   ├── mimo-language.js      # Syntax highlighting & autocompletion
│   │   │   └── mimo-theme.js         # Dynamic theme using CSS variables
│   │   │
│   │   ├── runtime/                  # Execution & filesystem
│   │   │   ├── zenfs.js              # Virtual filesystem (IndexedDB)
│   │   │   ├── mimo-runner.worker.js # Web Worker for code execution
│   │   │   ├── runner.svelte.js      # Reactive worker management
│   │   │   └── zip.js                # ZIP creation for downloads
│   │   │
│   │   ├── stores/                   # State management
│   │   │   └── playground.svelte.js  # Centralized store using Svelte 5 runes
│   │   │
│   │   └── utils/                    # Utility functions
│   │       ├── ast.js                # AST normalization
│   │       ├── share.js              # Share link encoding
│   │       └── workspace.js          # File tree utilities
│   │
│   └── routes/
│       ├── +page.svelte              # Landing page
│       ├── +layout.svelte            # Root layout
│       ├── +layout.js                # SSR configuration
│       └── playground/
│           └── +page.svelte          # Main playground page
│
├── static/
│   └── mimo-web.bundle.js            # Bundled Mimo interpreter
│
├── scripts/
│   └── web-entry.js                  # Bundle entry point
│
└── routes/layout.css                 # Global styles & CSS variables
```

## Key Concepts

### State Management

The playground uses a centralized store pattern with Svelte 5 runes:

```js
// In playground.svelte.js
export function createPlaygroundStore() {
  let tree = $state([]);           // File explorer tree
  let tabs = $state([]);           // Editor tabs
  let activeCode = $derived(...);  // Derived active code
  
  $effect(() => { ... });          // Reactive effects
  
  return { /* state getters & methods */ };
}
```

Access via context:
```svelte
<script>
  import { createPlaygroundStore, setPlaygroundContext } from '$lib/stores/playground.svelte.js';
  
  const store = createPlaygroundStore();
  setPlaygroundContext(store);
</script>
```

### Execution Pipeline

```
User clicks Run
      ↓
Code + files sent to Web Worker
      ↓
Worker creates virtual filesystem (ZenFS)
      ↓
Worker imports mimo-web.bundle.js
      ↓
Mimo interprets code
      ↓
Results posted back to main thread
      ↓
UI updated with output/errors
```

### Theming

The editor uses CSS variables for dynamic theming. Colors are defined in `routes/layout.css`:

```css
--cm-bg: var(--color-slate-50);      /* Editor background */
--cm-fg: var(--color-slate-900);     /* Editor foreground */
--cm-gutter-bg: var(--color-slate-100); /* Line numbers background */
--cm-selection: var(--color-sky-100); /* Selection highlight */
```

## Common Tasks

### Adding a New Component

1. Create in `src/lib/components/playground/`
2. Import and use in `+page.svelte` or parent component
3. Use the playground store via `getPlaygroundContext()`

### Adding Editor Features

Edit `src/lib/editor/mimo-language.js`:
- Add keywords to `completionKeywords`
- Add operators to `completionOperators`
- Add snippets using `snippetCompletion()`
- Keep syntax support aligned with language phases:
  - decorators (`@name`, `@name(args)`)
  - pipe (`|>`), null coalescing (`??`), optional chaining (`?.`)
  - guard/match guards (`guard`, `when`) and inline `if ... then ... else ...`
  - `fn ... -> ...` shorthand

### Modifying Theme

Edit `src/lib/editor/mimo-theme.js`:
- UI colors use CSS variables (dynamic)
- Syntax colors use Catppuccin palette (hardcoded for syntax highlighting)

### Adding Terminal Commands

Edit `src/lib/stores/playground.svelte.js`:
```js
function runCommand(command) {
  // Add command handling here
  if (command === 'your-command') { ... }
}
```

## Development Commands

```bash
# Start dev server (bundles Mimo first)
bun run dev

# Build for production
bun run build

# Type checking
bun run check

# Lint & format
bun run lint
bun run format

# Create Mimo bundle only
bun run bundles
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@lucide/svelte` | Icon library |
| `@zenfs/core` | Virtual filesystem |
| `@zenfs/dom` | IndexedDB backend |
| `svelte-codemirror-editor` | Code editor wrapper |

## Debugging Tips

1. **Check worker errors**: Look in browser DevTools → Sources → Workers
2. **Inspect ZenFS**: `console.log(listWorkspaceEntries('/'))`
3. **State inspection**: Use `$inspect(store)` in components
4. **Build errors**: Run `bun run bundles` separately to see bundle errors

## Architecture Decisions

1. **Static adapter**: Playground is fully client-side, no server needed
2. **Web Worker**: Code execution doesn't block UI
3. **IndexedDB**: Files persist across sessions
4. **Svelte 5 runes**: Modern reactivity with `$state`, `$derived`, `$effect`
5. **Context API**: Store shared across components without prop drilling

## Known Limitations

1. No debugging support (breakpoints, step-through)
2. No multi-file search
3. No find & replace in editor
4. Errors shown in panel, not inline in editor
5. Terminal logs unbounded (no max limit)
6. No keyboard shortcuts panel

## Related Files

- Main project: `../AGENTS.md`
- Syntax guide: `../docs/syntax-guide.md`
- VS Code extension: `../extensions/mimo-vscode/`
