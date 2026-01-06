# KiCad Collab

Collaborative review tool for KiCad schematics - comment directly on components, sync via Git.

## What is KiCad Collab?

Hardware engineers using KiCad lack modern collaboration tools for design reviews. The current workflow involves exporting PDFs, sharing via email, and tracking feedback in separate Excel files. This leads to lost context, scattered feedback, and delays.

**KiCad Collab solves this** by providing:

- **Interactive snapshots** - Generate shareable views of your schematics with one click
- **Component-anchored comments** - Feedback attached directly to specific components
- **Git-native persistence** - All data stored in JSON files, version-controlled alongside your design
- **Zero-install review** - Reviewers open a link in their browser, no KiCad required

## Features

### MVP (Current)

- One-click snapshot generation from KiCad plugin
- SVG schematic export with component metadata
- Web viewer with pan/zoom navigation
- Component hover highlighting and selection
- Anchored and general comments
- Comment threading and status tracking
- JSON persistence for Git workflow

### Planned (V2+)

- PCB/board view support
- Visual diff between revisions
- 3D viewer (Three.js)
- Interactive BOM

## Quick Start

### Installation

**Plugin (KiCad):**

```bash
# Option 1: KiCad Plugin Manager (coming soon)
# Option 2: Manual installation
git clone <repository-url>
# Copy plugin/ folder to your KiCad plugins directory
```

**Viewer (Development):**

```bash
cd viewer
npm install
npm run dev
```

### Usage

1. Open your schematic in KiCad
2. Click **Tools > KiCad Collab > Generate Snapshot**
3. Share the `.kicad-collab/` folder (or push to Git)
4. Reviewers open `index.html` in their browser
5. Add comments, mark resolved, commit changes

## Project Structure

```
kicad-collab/
├── plugin/           # KiCad Python plugin
│   ├── __init__.py   # Plugin entry point
│   └── py.typed      # PEP 561 type hint marker
├── viewer/           # React web viewer (Vite + TypeScript)
├── shared/           # Shared definitions
│   └── schema/       # JSON schemas + TypeScript types
├── docs/             # Documentation
├── .github/          # GitHub Actions workflows
│   └── workflows/
├── README.md
├── LICENSE           # MIT License
└── .gitignore
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Plugin | Python (KiCad API) |
| Viewer | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Testing | Vitest + React Testing Library |
| Persistence | JSON files + Git |

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd kicad-collab

# Viewer development
cd viewer
npm install
npm run dev

# Plugin development
cd ../plugin
python -m pytest
```

### Code Style

- **TypeScript**: ESLint + Prettier, strict mode enabled
- **Python**: Ruff + type hints on all public functions
- **JSON fields**: Always camelCase

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- KiCad team for the excellent open-source EDA suite
- The hardware engineering community for feedback and inspiration
