<p align="center">
  <img src="https://typesense.org/docs/images/typesense_logo.svg" alt="Typesense" width="200" />
</p>

<h1 align="center">Typesense UI</h1>

<p align="center">
  A powerful, AI-enhanced dashboard for managing Typesense clusters.<br/>
  Zero-install CLI &bull; Natural language queries &bull; Encrypted credentials
</p>

<p align="center">
  <a href="https://typesense.mothilal.dev"><strong>Live Demo &rarr; typesense.mothilal.dev</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/typesense-ui?color=blue&style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</p>

---

## Quick Start

```bash
npx typesense-ui
```

That's it. Opens the full dashboard at `http://localhost:3000`. No install needed.

> Custom port: `npx typesense-ui --port=4000`

### Local Development

```bash
git clone https://github.com/Mothilal-hire10x/typesense-ui.git
cd typesense-ui
npm install
npm run dev
```

---

## Features

### Connection & Security

- **Encrypted credential storage** — Typesense API keys and Gemini keys are AES-GCM encrypted in localStorage using the Web Crypto API (PBKDF2 key derivation, 100k iterations)
- **Server profiles** — save, name, and color-code multiple server connections; quick-switch from the header
- **Connection health monitor** — periodic pings display healthy / degraded / down status with latency

### Collection Management

- Sidebar lists all collections with live document counts and search filtering
- **Collection creator** — visual form with all 17 Typesense field types, per-field toggles (facet, sort, index, optional), default sorting field
- **Schema editor** — add/drop/modify fields on existing collections with color-coded type badges
- **AI schema generator** — paste sample JSON data and let Gemini infer the optimal Typesense schema
- **Schema migration tool** — connect to a remote Typesense instance, diff schemas field-by-field, see added/removed/changed properties

### Document Viewer

- **Virtual scrolling** — `@tanstack/react-virtual` renders only visible rows for smooth handling of large datasets
- **Resizable columns** — drag column header edges to resize; `table-layout: fixed` with `<colgroup>` for consistent widths
- **Column picker** — toggle visibility of individual fields (defaults to first 6)
- **Dynamic filters** — auto-generated per field type: text search, numeric min/max range, boolean dropdown
- **Sorting** — click any column header to sort ascending/descending
- **Full-text search** — debounced search across all query-by fields
- **Document JSON viewer** — collapsible tree with syntax highlighting and color-coded types
- **Inline CRUD** — create, edit (JSON editor with auto-generated templates), delete with undo toast
- **Skeleton loading** states for initial load

### Bulk Operations

- **Import** — JSON and JSONL file upload with drag-and-drop, create/upsert/update modes, document preview, per-row error reporting
- **Export** — download entire collections as JSON or JSONL

### Search Playground

- Advanced search testing panel with configurable `query_by`, sort field/order, per_page, page
- **Visual filter builder** — add filter rows with field, operator (7 operators), and value
- **Facet selection** and highlight field configuration
- Prefix search and exhaustive search toggles
- **Three result tabs** — Hits (with JSON viewer per hit), Raw JSON, Facets
- Copy raw response • performance timing display

### Synonyms & Curations

- **Synonyms manager** — create/delete multi-way and one-way synonyms with root word support
- **Curations editor** — pin documents to positions, hide documents, override filters/sort/query for specific search rules

### Query Diff Tool

- Side-by-side comparison of two search queries
- Shows common, unique-to-A, and unique-to-B document IDs
- Performance timing and result count comparison

### API Keys Manager

- Create scoped API keys with action presets (Search Only, Read Only, Read/Write, Admin)
- Per-collection scoping, expiration dates
- Show/hide and copy key values

### AI Chat (Gemini 2.0 Flash)

- **Natural language queries** — ask questions about your data in plain English
- **Function calling loop** — Gemini autonomously calls Typesense tools (search, get schema, count, CRUD) up to 5 iterations to answer complex questions
- **Schema-aware prompting** — the AI knows your collection schemas and currently selected collection
- **Write protection** — create, update, and delete operations require explicit user confirmation before executing
- **Inline result tables** — search results are rendered as interactive tables within chat messages
- **AI results view** — large result sets replace the main content area with a dedicated AI results table
- **Markdown rendering** with syntax highlighting via `react-markdown` + `remark-gfm`

### Natural Language Rules

- Describe a curation rule in plain English and Gemini generates the Typesense override JSON
- Preview the generated rule before applying to the collection

### Embeddable Search Widget

- Generate a standalone HTML/JS search widget for any collection
- Configure: placeholder, max results, query_by, theme (light/dark/auto), accent color, debounce, border radius
- **Three tabs** — live preview, generated code, configuration
- Copy to clipboard

### Visual Pipeline Builder

- Build multi-step workflows: Import → Transform → Index → Search
- Custom JavaScript transform functions
- Execute pipelines sequentially with per-step result/error display
- Named and saved pipelines

### Collaboration

- **Shared links** — create shareable links scoped to collections with configurable expiry
- **Audit log** — tracks all user actions locally with timestamps (up to 500 entries)

### Plugin System

- **Custom plugin framework** with hooks: `onSearch`, `onSearchResult`, `onDocumentRender`
- 3 built-in plugins: CSV Exporter, New Document Highlighter, Query Logger
- Create custom plugins with JavaScript, test execution in-browser

### Search Analytics

- Client-side analytics tracking (up to 2,000 entries)
- **Three views** — top queries, zero-result queries, latency analysis
- Time range filters: 1 hour, 24 hours, 7 days, all

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/⌘ + K` | Command palette / focus search |
| `Ctrl/⌘ + N` | New document |
| `Ctrl/⌘ + .` | Toggle AI chat panel |
| `Ctrl/⌘ + Shift + R` | Refresh collections |
| `Escape` | Close modals and panels |

### UX & Design

- **Dark / light mode** — persisted toggle with smooth transitions
- **Command palette** — VS Code–style `Ctrl+K` fuzzy search across collections, actions, and navigation
- **Toast notifications** — success, error, info, warning with auto-dismiss and undo support
- **Confetti effects** — sparkle, stars, and celebration bursts on key actions
- **Responsive layout** — collapsible sidebar, mobile-friendly design
- **Error boundary** — graceful error recovery with retry/reload

### Landing Page

- **Three.js particle scene** — 1,500 animated particles with mouse-reactive parallax and glowing core geometry
- **GSAP + ScrollTrigger** animations throughout — staggered text reveals, 3D tilt cards, scroll-scrub timeline
- **Lenis** smooth scrolling
- Respects `prefers-reduced-motion`

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS 3, Lucide React icons |
| **Data** | Typesense JS client, `@tanstack/react-virtual` |
| **AI** | Google Gemini 2.0 Flash (`@google/generative-ai`), `react-markdown` |
| **3D / Animation** | Three.js, React Three Fiber, GSAP, Lenis |
| **Security** | Web Crypto API (AES-GCM + PBKDF2) |
| **Effects** | `canvas-confetti` |
| **CLI** | Express (production), Vite (development) |
| **Testing** | Vitest, Testing Library |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run tests with Vitest |
| `npm run lint` | Lint with ESLint |

---

## Browser Support

Chrome, Edge, Firefox, and Safari (latest versions). Requires the Web Crypto API (all modern browsers).

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome — open an issue or submit a pull request.

## Acknowledgments

- [Typesense](https://typesense.org) — the search engine this dashboard is built for
- [Lucide](https://lucide.dev/) — icon library
- Design inspired by [Supabase](https://supabase.com) and [Vercel](https://vercel.com)
