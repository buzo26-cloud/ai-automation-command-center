# GitHub Public Setup

Yeh project static website hai. GitHub Pages par free public ho sakta hai.

## Step 1: New Repository

1. Open: https://github.com/new
2. Repository name:

```text
ai-automation-command-center
```

3. Visibility: `Public`
4. Do not add README, license, or gitignore from GitHub.
5. Click `Create repository`.

## Step 2: Upload Files

Upload these files from this folder:

```text
index.html
styles.css
app.js
README.md
.gitignore
GITHUB_SETUP.md
```

Important: Upload the files at the repository root, not inside another folder.

## Step 3: Enable GitHub Pages

1. Open your repository.
2. Go to `Settings`.
3. Go to `Pages`.
4. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Click `Save`.

After a minute, GitHub will show a live URL like:

```text
https://buzo26-cloud.github.io/ai-automation-command-center/
```

## Step 4: Give Codex Access

After the repository exists, allow the GitHub/Codex app access to this repo. Then tell Codex:

```text
buzo26-cloud/ai-automation-command-center
```

After that Codex can inspect the repository, publish changes, and help manage future updates.
