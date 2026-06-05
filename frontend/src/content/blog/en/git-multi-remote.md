---
title: 'Multi-Remote Git'
date: '2025-02-11'
category: 'TECH'
---

# How to Set Up Git to Pull from One Repository but Push to Two Simultaneously

A common need for developers is mirroring their work across multiple hosting platforms — for example, keeping a primary remote on GitHub while simultaneously pushing to GitLab as a backup or for CI/CD purposes. Git supports this natively, and there are several ways to achieve it depending on your workflow.

---

## How Git Remotes Work

Every Git repository can have multiple **remotes** — named references to external repositories. By default, when you clone a repository, Git creates a remote called `origin` that points to the source URL. Both `fetch` (pull) and `push` operations are configured per-remote.

The key insight is that a single remote name can hold **one fetch URL** but **multiple push URLs**. This is exactly what we need.

---

## Prerequisites

- Git installed (version 1.8.3+ recommended)
- An existing repository on GitHub (your primary remote)
- An existing empty (or mirrored) repository on GitLab
- SSH keys or HTTPS credentials configured for both platforms

---

## Method 1: Multiple Push URLs on a Single Remote (Recommended)

This is the cleanest approach. You keep a single `origin` remote, pull only from GitHub, but push to both GitHub and GitLab simultaneously.

### Step 1: Clone your repository (or use an existing one)

```bash
git clone git@github.com:your-username/your-repo.git
cd your-repo
```

### Step 2: Verify the current remote configuration

```bash
git remote -v
```

Output:

```
origin  git@github.com:your-username/your-repo.git (fetch)
origin  git@github.com:your-username/your-repo.git (push)
```

### Step 3: Add the GitLab push URL to the `origin` remote

```bash
git remote set-url --add --push origin git@github.com:your-username/your-repo.git
git remote set-url --add --push origin git@gitlab.com:your-username/your-repo.git
```

> **Important:** When you use `--add --push` for the first time, Git replaces the default push URL. This means you must add **both** URLs — the GitHub one first, then the GitLab one. If you only add GitLab, GitHub will no longer receive pushes.

### Step 4: Verify the configuration

```bash
git remote -v
```

Expected output:

```
origin  git@github.com:your-username/your-repo.git (fetch)
origin  git@github.com:your-username/your-repo.git (push)
origin  git@gitlab.com:your-username/your-repo.git (push)
```

Now `git pull` fetches only from GitHub, while `git push` sends to both GitHub and GitLab.

### Step 5: Test it

```bash
git push origin main
```

You will see two separate push operations in the output — one for each configured push URL.

---

## Method 2: Separate Named Remotes

If you want explicit control — pushing to GitHub and GitLab independently — you can define two separate named remotes and use a helper alias or push manually.

### Step 1: Add a second remote for GitLab

```bash
git remote add gitlab git@gitlab.com:your-username/your-repo.git
```

### Step 2: Verify

```bash
git remote -v
```

Output:

```
origin  git@github.com:your-username/your-repo.git (fetch)
origin  git@github.com:your-username/your-repo.git (push)
gitlab  git@gitlab.com:your-username/your-repo.git (fetch)
gitlab  git@gitlab.com:your-username/your-repo.git (push)
```

### Step 3: Push to both manually

```bash
git push origin main
git push gitlab main
```

### Step 4 (Optional): Create a Git alias to push to both at once

```bash
git config alias.pushall '!git push origin main && git push gitlab main'
```

Then use:

```bash
git pushall
```

> This approach is more verbose but gives you fine-grained control. For example, you can push only to GitLab when needed without touching GitHub.

---

## Method 3: Using `.git/config` Directly

All remote configuration is stored in `.git/config`. You can edit it directly for full transparency and reproducibility.

Open the file:

```bash
nano .git/config
```

A standard single-remote config looks like this:

```ini
[remote "origin"]
    url = git@github.com:your-username/your-repo.git
    fetch = +refs/heads/*:refs/remotes/origin/*
```

To add a second push target, add a `pushurl` line for each destination:

```ini
[remote "origin"]
    url = git@github.com:your-username/your-repo.git
    fetch = +refs/heads/*:refs/remotes/origin/*
    pushurl = git@github.com:your-username/your-repo.git
    pushurl = git@gitlab.com:your-username/your-repo.git
```

> **Note:** Once any `pushurl` is defined, the `url` field is no longer used for pushing — only the explicit `pushurl` entries are. This is why you must list GitHub explicitly as a `pushurl` as well.

Save and close. No additional commands needed — the configuration takes effect immediately.

---

## Verifying the Full Setup

Run a dry-run push to see what would happen without actually pushing:

```bash
git push --dry-run origin main
```

Check your `.git/config` at any time:

```bash
cat .git/config
```

List all remotes with their URLs:

```bash
git remote -v
```

---

## SSH vs HTTPS

Both SSH and HTTPS URLs work with this setup. You can even mix them:

```ini
[remote "origin"]
    url = git@github.com:your-username/your-repo.git
    fetch = +refs/heads/*:refs/remotes/origin/*
    pushurl = git@github.com:your-username/your-repo.git
    pushurl = https://gitlab.com/your-username/your-repo.git
```

SSH is generally preferred for automated workflows because it uses key-based authentication and avoids password/token prompts.

---

## Setting Up SSH Keys for Both Platforms

If you haven't configured SSH access for both GitHub and GitLab, here's how:

### Generate a key pair (if you don't have one)

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

### Add the public key to both platforms

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the output and add it to:

- **GitHub:** Settings → SSH and GPG keys → New SSH key
- **GitLab:** User Settings → SSH Keys → Add new key

### Test the connections

```bash
ssh -T git@github.com
ssh -T git@gitlab.com
```

Both should respond with a success message confirming your username.

### Using separate keys per platform (optional but recommended for security)

Generate two separate keys:

```bash
ssh-keygen -t ed25519 -C "github" -f ~/.ssh/id_ed25519_github
ssh-keygen -t ed25519 -C "gitlab" -f ~/.ssh/id_ed25519_gitlab
```

Add them to `~/.ssh/config`:

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github

Host gitlab.com
    HostName gitlab.com
    User git
    IdentityFile ~/.ssh/id_ed25519_gitlab
```

Add each public key to the corresponding platform, and SSH will automatically use the right key.

---

## Common Problems and How to Fix Them

### Push fails for one remote but not the other

Each platform authenticates independently. If GitLab fails:

- Check that your SSH key is added to GitLab
- Run `ssh -T git@gitlab.com` to diagnose the connection

### "remote: Repository not found"

The GitLab repository must exist before you push to it. Create it first via the GitLab UI (initialize it empty — do **not** add a README if your GitHub repo already has commits, to avoid diverging histories).

### Permission denied (publickey)

Your SSH agent may not have the key loaded:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### Only one repository receives the push

Double-check your `.git/config`. If there is no `pushurl` entry, only the `url` is used. If there is at least one `pushurl`, all push operations go exclusively to the `pushurl` entries — make sure you listed both.

---

## Quick Reference

| Goal                      | Command                                           |
| ------------------------- | ------------------------------------------------- |
| See all remotes           | `git remote -v`                                   |
| Add a push URL to origin  | `git remote set-url --add --push origin <url>`    |
| Add a new named remote    | `git remote add <name> <url>`                     |
| Remove a push URL         | `git remote set-url --delete --push origin <url>` |
| Edit config directly      | `nano .git/config`                                |
| Push to all push URLs     | `git push origin <branch>`                        |
| Push to a specific remote | `git push gitlab <branch>`                        |

---

## Summary

The cleanest and most maintainable approach is **Method 1** — adding multiple `pushurl` entries to your `origin` remote. It requires no scripting, no aliases, and integrates transparently with your normal `git push` workflow. Pull continues to come from a single source (GitHub), while every push automatically propagates to both GitHub and GitLab.

This setup is especially useful for:

- **Backup and redundancy** — your code survives if one platform has downtime
- **CI/CD diversity** — trigger pipelines on GitLab while keeping the canonical repo on GitHub
- **Open source mirroring** — maintain presence on multiple forges simultaneously
