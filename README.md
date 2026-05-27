# RenderMD

A distraction-free **Markdown editor** with live preview, built for developers and writers. Everything saves automatically to your browser — no account, no server, no setup required.

![RenderMD](src/assets/hero.png)

---

## Features

### ✍️ Editor
- **CodeMirror 6** editor with line numbers and syntax highlighting
- Writing-focused theme — markdown punctuation fades out so you focus on words
- **Keyboard shortcuts** — `Ctrl+B` bold, `Ctrl+I` italic, `Ctrl+K` link, `Ctrl+`` inline code, `Ctrl+Shift+K` code block
- `Tab` indents, `Shift+Tab` outdents
- **Find & Replace** (`Ctrl+F`) with case-sensitive matching and replace all
- **Vim keybindings** toggle
- Adjustable font size (10–24px)
- Focus mode — hides all chrome, just the writing surface
- Autosave indicator in the status bar

### 👁️ Live Preview
- GitHub-style rendering with **react-markdown**
- Syntax-highlighted code blocks for 50+ languages via **react-syntax-highlighter**
- Tables, task lists, strikethrough, emoji shortcodes (`:rocket:` → 🚀)
- Export rendered output as a standalone **HTML** file

### 🗂️ Notes
- Create, rename, duplicate, and delete notes
- Search across note titles and content
- Import existing `.md` files from your computer
- Export any note as a `.md` file
- All notes persist in **localStorage** — no data leaves your browser

### 🕐 Version History
- Auto-snapshots every 5 minutes while editing
- Browse and restore any previous version with one click
- Up to 10 snapshots per note

### 📋 Table of Contents
- Auto-generated from headings in the current note
- Click any heading to jump to it in the editor

### 🖥️ Layouts
10 layout modes to match your workflow:

| Layout | Description |
| :--- | :--- |
| 3-Column Left | Sidebar + Editor + Preview (sidebar on left) |
| 3-Column Right | Sidebar + Editor + Preview (sidebar on right) |
| Tabs Left | Sidebar with Write/Preview tabs |
| Tabs Right | Sidebar on right with Write/Preview tabs |
| Zen Split | Editor + Preview, no sidebar |
| Zen Tabs | Write/Preview tabs, no sidebar |
| Zen Editor | Editor only, no sidebar |
| Zen Preview | Preview only, no sidebar |
| Editor Focus | Editor pane only |
| Preview Focus | Preview pane only |

### ☁️ GitHub Gist Sync
- Sync all notes to a private GitHub Gist
- Paste a personal access token with `gist` scope in Settings
- Manual sync with one click

### ⚙️ Settings
- Editor font size slider
- Character limit with status bar warning
- Word count goal with progress bar
- Vim keybindings toggle
- GitHub Gist sync configuration

---

## Tech Stack

| Layer | Library |
| :--- | :--- |
| Framework | React 19 + Vite 8 |
| Editor | CodeMirror 6 via `@uiw/react-codemirror` |
| Markdown | `react-markdown` + `remark-gfm` + `remark-gemoji` |
| Syntax Highlighting | `react-syntax-highlighter` (Prism) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (radix-nova) |
| Icons | Lucide React |
| Persistence | localStorage |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/alvindemesadev/render-md.git
cd render-md

# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+K` | Link |
| `Ctrl+`` ` | Inline code |
| `Ctrl+Shift+K` | Code block |
| `Ctrl+F` | Find & Replace |
| `Tab` | Indent |
| `Shift+Tab` | Outdent |
| `Esc` | Exit focus mode |

---

## License

MIT
