# Releasing
This page explains how releasing is done for CookieCaster. 

Useful: Check [Branching](git-workflow.md), so the contributer knows how to work with git on this project and how branching works. 

## Release new Version
### 1. Create Release Branch
When decided to release new version create `release/vx.y.z` branch (see [Branching](git-workflow.md#branching))

### 2. Update VERSION.md
In the release branch update `VERSION.md`in the root of the directory with the new version. Push the changes to GitHub. GitHub Actions will be triggered and some things will tested (see [CI/CD](git-workflow.md#cicd)).

### 3. Pull request
Create a Pull Request to main and development so `VERSION.md`is correct in both branches. 

### 4. Review Pull Request
Choose a Reviewer (TBD), which reviews the Pull Request like described [here](git-workflow.md#how-to-review).

### 5. Merge to main
When everything okay, merge the release to main and development. 

### 6. Autodeploy
When merging from a release branch to main a GitHub Action will be triggered. This Action will Tag the main branch with the new version, create a CHANGELOG and deploy the changes to GitHub Pages in the `gh-pages` Branch. 

> ⚠️ **Caution:**  
> The autodeploy action will only trigger when merging from a `release/*` branch to main AND when the version in the `VERSION.md` isn't already tagged. 