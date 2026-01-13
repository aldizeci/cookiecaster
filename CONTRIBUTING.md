# Contributing to CookieCaster 3.0

CookieCaster 3.0 is an open-source project and thrives on community involvement. Contributions of all kinds are welcome — whether you’re improving documentation, reporting bugs, suggesting new features, or writing code.

This guide explains **how to contribute**, **how branching works**, and **how releases are handled**, so that contributions stay consistent and easy to review.

---

## Table of Contents

- [Introduction](#introduction)
- [Branching Concept](#branching-concept)
  - [Important Branches](#important-branches)
  - [Branch Naming](#branch-naming)
- [CI/CD](#cicd)
  - [Developing](#developing)
  - [Releasing](#releasing)
- [How to Review](#how-to-review)
- [Merging to Main](#merging-to-main)
- [Merging Releases](#merging-releases)

---

## Introduction

To keep CookieCaster 3.0 maintainable and stable, this project follows a clear branching and release strategy.  
All contributors are expected to follow this concept to ensure clean pull requests and predictable releases.

Before you start working on something new, please:

- Check the [open issues](https://github.com/fhnw-makerverse/cookiecaster/issues)
- Look for issues labeled **`help wanted`** or **`good first issue`** if you’re new to the project

### Contribution Workflow (High-Level)

1. Create a branch from `development`
2. Implement your changes
3. Write tests if you add new functionality
4. Commit with clear, descriptive messages
5. Open a pull request back to `development`
6. Address review feedback if needed

---

## Branching Concept

### Important Branches

#### `main`
- Contains **production-ready code**
- Runs on **GitHub Pages**
- ❌ No direct pushes allowed
- Only updated via merges from `development`

#### `gh-pages`
- Contains only the generated files required for GitHub Pages
- Automatically updated via CI/CD
- ❌ No manual changes allowed
- Generated using `yarn deploy`

#### `development`
- Main working branch for ongoing development
- Always ahead of `main`
- All features, fixes, and improvements are merged here first
- Release branches are created from this branch

---

### Branch Naming

All contribution branches must be created **from `development`** and follow this naming convention:

| Branch Prefix   | Purpose                               | Example                  |
|-----------------|----------------------------------------|--------------------------|
| `feature/*`     | New features                           | `feature/share`          |
| `fix/*`         | Bug fixes                              | `fix/drawing-curves`     |
| `docs/*`        | Documentation changes                  | `docs/metrics`           |
| `chore/*`       | Maintenance or CI/CD changes           | `chore/add-ci-tests`     |
| `release/*`     | Prepare a new production release       | `release/v1.0.3`         |

---

## CI/CD

CookieCaster uses GitHub Actions to ensure code quality and stability.

### Developing

On every **pull request** to `development` or `main`:

- All tests are executed
- Code style and quality checks run
- Coverage reports are generated
- Coverage badges are updated in the README

❗ A pull request can only be merged if **all checks are green**.

---

### Releasing

The release process is fully automated using CI/CD.

1. A `release/vx.y.z` branch is created from `development`
2. `VERSION.md` is updated with the new version number
3. The update to `VERSION.md` triggers a GitHub Action which:
   - Updates the version in `package.json`
4. A pull request is opened to `development`
5. **Before merging the pull request**, verify that:
   - The GitHub Action has successfully updated `package.json`
   - All tests and checks have passed
6. The pull request is merged into `development`
7. `development` is merged into `main`
8. A Git tag and GitHub Release are created automatically
9. GitHub Pages are deployed automatically

---

## How to Review

Before merging a pull request, reviewers should:

- Ensure all CI pipelines are green
- Clone the branch locally
- Run `yarn run dev`
- Verify the application works as expected
- Check adherence to the branching concept
- Review commit messages for clear changelog entries

If all checks pass, the pull request may be merged.

---

## Merging to Main

### `development` → `main`

- Only merges from `development` to `main` are allowed
- If `VERSION.md` **is not changed**:
  - No new release is created
- If `VERSION.md` **is changed**:
  - A new release and deployment are triggered

---

## Merging Releases

### `release/*` → `development`

Use release branches **only** when publishing a new version.

Steps:
1. Create a branch: `release/vx.y.z` from `development`
2. Update `VERSION.md` with the new version number
3. Open a pull request to `development`
4. **Before merging**, verify that the GitHub Action has correctly updated the version in `package.json`
5. If the version update and all checks are successful, merge the pull request into `development`
6. Afterward, proceed with merging `development` into `main`

---

## React project structure

This section will describe how the project structure is constructed, so you will understand better, where to programm. 

### Directory structure

Directory structure in the `src` folder

| Path | Purpose |
| ------- | ------- |
| `business-logic`  | Every JavaScript stored which delivers functional abilities to the product |
| `business-logic/graph-operations` | Functions bound to drawing |
| `business-logic/handlers` | Handlers of cutter forms |
| `business-logic/mesh-operations` | Functions bound to mesh |
| `business-logic/modes` | Stores all drawing modes |
| `business-logic/services` |  Stores services like validation |
| `entities` | All entity classes |
| `entities/graph` | All entites for graph or drawboard |
| `entities/graph` | All entites for mesh |
| `templates` | Every template you find in the gallery |
| `translations` | German and english dictionaries to support both languages |
| `ui` | UI / React objects. Everything frontend related |
| `ui/components` | All general components not for one specific page |
| `ui/pages` | All react components and hooks for a specific page |
| `utils` | All utiliy Java Scripts like File Export and Import |


### React Components

This graph will show you how the components inside the `ui`folder are structured, so you can add new ones.

![project structur](docs/images/project_structure.svg)

Every `pages` sub directory contains the components files inside a `component` directory related to that page. If hooks are needed they are stored in the `hooks` directory in the respectice page directory. 

Inside the `components` folder are all components stores, that are used by more then one page. 

In the `App.jsx` you can find the routes to the pages. CookieCaster 3.0 uses Hash Routes, so routing works as GitHub Pages.




Thank you for contributing to CookieCaster 3.0 🚀  
Your help makes the project better for everyone.
