# Mimo Playground

A web-based IDE for the [Mimo](https://github.com/anomalyco/mimo) programming language.

## Features

- **Multi-file workspace** with IndexedDB persistence
- **Tabbed editor** with CodeMirror (syntax highlighting, autocompletion)
- **File explorer** with create/rename/delete
- **AST visualization** with expandable tree view
- **Terminal panel** with command history
- **Output/Error/Warning** tabs with copy and clear
- **Resizable panels** (4-way split)
- **Theme switching** (system/light/dark)
- **Share functionality** (base64 URL encoding, ZIP download)
- **Web Worker execution** for non-blocking code runs

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## Project Structure

```
src/lib/
├── components/playground/  # UI components
├── editor/                 # CodeMirror config (language, theme)
├── runtime/                # Worker, filesystem, ZIP
├── stores/                 # State management (Svelte 5 runes)
└── utils/                  # AST, share, workspace utilities

src/routes/
├── +page.svelte            # Landing page
└── playground/+page.svelte # Main IDE
```

## Technology Stack

| Technology | Purpose |
|------------|---------|
| SvelteKit 2.x | Framework with static adapter |
| Svelte 5 | UI with runes reactivity |
| TailwindCSS 4.x | Styling |
| CodeMirror 6 | Code editor |
| ZenFS | Virtual filesystem with IndexedDB |
| Lucide Icons | Icon library |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (bundles Mimo first) |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run check` | Type checking with svelte-check |
| `bun run lint` | Lint with ESLint & Prettier |
| `bun run format` | Format code |
| `bun run bundles` | Create Mimo interpreter bundle |

## Configuration

### Editor Settings

Access via Settings button in the header:
- Theme: system / light / dark
- Font size: 10-24px
- Tab size: 2 or 4 spaces
- Auto-save: on/off

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Run code |
| `Ctrl/Cmd + S` | Save file |

## Architecture

### Execution Flow

```
User clicks Run
      ↓
Code + files → Web Worker
      ↓
Worker creates virtual filesystem
      ↓
Mimo interpreter executes code
      ↓
Results → Main thread
      ↓
UI updates
```

### State Management

Centralized store using Svelte 5 runes:
- `$state` for reactive state
- `$derived` for computed values
- `$effect` for side effects
- Context API for component access

See [AGENTS.md](./AGENTS.md) for detailed architecture documentation.

## Development

### Adding Editor Features

Edit `src/lib/editor/mimo-language.js`:
- Keywords → `completionKeywords`
- Operators → `completionOperators`
- Snippets → `snippetCompletion()`

### Adding Terminal Commands

Edit `src/lib/stores/playground.svelte.js`:
```js
function runCommand(command) {
  if (command === 'your-command') {
    // Handle command
  }
}
```

### Modifying Theme

Edit `src/lib/editor/mimo-theme.js` for syntax colors.
Edit `src/routes/layout.css` for UI colors (CSS variables).

## Related

- [Mimo Language](../) - Main project
- [VS Code Extension](../extensions/mimo-vscode/) - Editor support
- [Syntax Guide](../docs/syntax-guide.md) - Language reference

## License

MIT
