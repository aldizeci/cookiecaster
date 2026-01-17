# Releasing

This document explains the release process for **CookieCaster**.  
Releases are fully automated and follow a strict workflow to ensure stability and traceability.

Before creating a release, please make sure you are familiar with:
- The contribution workflow and branching strategy described in  
  [CONTRIBUTING.md](../CONTRIBUTING.md)
- The CI/CD process used in this project (See [Git Workflow Ilustrated](architecture.md))

---

## Releasing a New Version

### 1. Create a Release Branch

When you decide to publish a new version, create a release branch from `development`:

`release/vx.y.z`


The branching rules are described in detail here:  
[Branching Concept](../CONTRIBUTING.md#branching-concept)

---

### 2. Update `VERSION.md`

In the newly created release branch:

1. Update the `VERSION.md` file in the project root with the new version number
2. Commit and push the changes to GitHub

This push will automatically trigger GitHub Actions which will:
- Run all tests and quality checks (see [CI/CD](../CONTRIBUTING.md#cicd))
- Automatically update the version in `package.json`

> ⚠️ **Important:**  
> Do not manually edit `package.json`. The version is managed entirely by CI/CD.

---

### 3. Open a Pull Request

Create a pull request from the release branch to `development`.

---

### 4. Review the Pull Request

Select a reviewer and ensure the pull request is reviewed according to:
- [Pull Requests](../CONTRIBUTING.md#pull-requests)
- [How to Review](../CONTRIBUTING.md#how-to-review)

Before merging, verify that:
- All CI pipelines are green
- The version in `package.json` was updated correctly by GitHub Actions

---

### 5. Merge into `development`

Once the pull request is approved and all checks pass, merge the release branch into `development`.

---

### 6. Merge `development` into `main`

When the release is ready to go live, merge the `development` branch into `main`.

This step triggers the final release workflow.

---

### 7. Automatic Deployment

After merging `development` into `main`, GitHub Actions will automatically:

- Create a Git tag for the new version
- Generate or update the changelog
- Create a GitHub Release
- Deploy the application to GitHub Pages using the `gh-pages` branch

> ⚠️ **Caution:**  
> The automatic deployment only runs when:
> - The merge is from `development` into `main`, **and**
> - The version in `VERSION.md` has not already been released (tagged)

---

Thank you for helping release CookieCaster 3.0  
Your contributions ensure a reliable and transparent release process for everyone.
