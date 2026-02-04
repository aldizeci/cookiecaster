# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CookieCaster 3.0 is a client-side React application for designing 3D-printable cookie cutters. Users draw shapes on an SVG canvas using a graph-based editor with quadratic Bézier curves, then export designs as binary STL files for 3D printing. No backend — all persistence uses localStorage/sessionStorage.

## Commands

```bash
yarn dev              # Start Vite dev server
yarn build            # Production build (output: dist/)
yarn lint             # ESLint (flat config, ignores test/ and docs/)
yarn test             # Run all Jest tests (requires --experimental-vm-modules)
yarn coverage         # Run tests with coverage report

# Run a single test file:
node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js test/graph/Graph.test.js

# Run tests matching a pattern:
node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --testPathPattern="modes"
```

Package manager: **Yarn 4.9.1** (do not use npm).

## Architecture

### Layered Structure

```
src/
├── entities/          # Domain models (no React, no DOM)
├── business-logic/    # Core logic, handlers, modes, services
├── ui/                # React components and pages
├── utils/             # Import/export utilities
├── templates/         # Preset design JSON files
└── translations/      # i18n (de.json, en.json via react-intl)
```

### Key Architectural Patterns

**Service Container** (`src/business-logic/services/`):
- `ServiceContainer.js` — factory function `createServices()` that wires up all core objects (Graph, SvgHandler, SelectionHandler, Controller, Modes) with lazy cross-references to resolve circular dependencies.
- `ServicesProvider.jsx` — React context provider wrapping the service container. Access services in components via `useServices()` hook.

**State Pattern for Drawing Modes** (`src/business-logic/modes/`):
- `AbstractMode` defines the interface: `enable()`, `disable()`, `onMouseDown()`, `onMouseMove()`, `onMouseUp()`, `onEscape()`.
- Four concrete modes: `ModeDraw`, `ModeMove`, `ModeRotate`, `ModeSelect`.
- The `Controller` manages mode switching via `setModes()`.

**Graph as Core Data Structure** (`src/entities/graph/`):
- `Graph` holds `Map<id, Node>` and `Map<id, Edge>` with adjacency tracking.
- `Edge` stores a quadratic Bézier control point (`q`).
- `Graph.toJSON()`/`fromJSON()` for serialization; `fromSvg()` for SVG path parsing.
- `Validation.js` and `Analysis.js` in `graph-operations/` provide shape validation and printability analysis.

**SVG-DOM Bridge** (`src/business-logic/handlers/`):
- `SvgHandler` manages SVG element creation/removal using D3.js, keeping DOM in sync with the Graph model.
- `SelectionHandler` manages visual selection state.
- `Controller` orchestrates handlers and delegates mouse events to the active mode.

### Routing

Hash-based routing via `react-router-dom` (`HashRouter`). Routes defined in `App.jsx`:
- `/` — Home, `/start` — Drawing editor, `/export` — STL export, `/gallery` — Saved designs, `/ueber` — About, `/about` — Imprint.

### File Format

Custom `.cc3` format (JSON-based) for saving/loading designs, handled by `FileImport.js` and `FileExport.js`. STL export via `ExportToBinarySTL.js`.

## Tech Stack

- React 19, Vite 7, D3.js 7, React Bootstrap, react-intl, react-router-dom
- Jest 30 with ESM (`--experimental-vm-modules`), jsdom environment
- ESLint 9 flat config — `no-unused-vars` allows uppercase-prefixed identifiers
- Default locale is German (`de`), with English (`en`) support

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `checks.yml` — PR checks: build, test, lint (Node 24)
- `coverage.yml` — Coverage reporting on push to main
- `release_auto.yml` — Daily automatic patch releases at 19:00 UTC
- `release_manual.yml` — Manual release trigger
