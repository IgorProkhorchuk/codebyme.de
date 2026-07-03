---
title: 'How to Discover Files from Previous Commits in Git'
date: '2025-04-10'
category: 'TECH'
tags: ['git']
---

Git doesn't just track your current code — it holds the entire history of your project. Every commit is a snapshot you can inspect, compare, or restore from at any time. This post covers the most practical ways to navigate that history and work with files from the past.

---

## What Problem Are We Solving?

You've likely run into at least one of these scenarios:

- "I deleted a file two weeks ago and now I need it back."
- "What exactly changed between these two releases?"
- "What did this file look like before my colleague refactored it?"
- "When was this file added, and who touched it last?"

Git has tools for all of these. Let's go through them.

---

## Inspect a Single Commit

```bash
git show --name-only <commit_hash>
```

**What it does:** Shows the commit message, the diff, and the list of files that were touched in that commit. The `--name-only` flag suppresses the full diff and gives you just the filenames.

If you want only the filenames with no extra output at all:

```bash
git show --pretty="" --name-only <commit_hash>
```

This is the fastest way to answer "what did this commit actually touch?"

---

## Compare Two Commits

```bash
git diff --name-only <old_commit> <new_commit>
```

**What it does:** Instead of showing the content of the diff, `--name-only` lists only the files that differ between the two commits. Useful when you want a high-level picture of what changed over a range — for example, between a release tag and HEAD:

```bash
git diff --name-only v1.0.0 HEAD
```

---

## See the Full File Tree at a Past Commit

```bash
git ls-tree -r --name-only <commit_hash>
```

**What it does:** `ls-tree` lists the contents of a Git tree object. The `-r` flag makes it recursive (descends into subdirectories), and `--name-only` gives you clean paths. The result is a complete snapshot of every file that existed in the repository at that exact commit — including files that have since been deleted or renamed.

This is the command you want when you need to explore what the project looked like at a specific point in time.

---

## Read a File from a Past Commit Without Checking It Out

```bash
git show <commit_hash>:<path/to/file>
```

**What it does:** Git can print the content of any file at any commit directly to stdout — no branch switching, no working tree changes. The colon syntax tells Git to look inside a specific commit's tree for a specific path.

```bash
git show ae0d112:src/main/java/com/example/UserService.java
```

This is completely safe and non-destructive. Pipe it to a file or your editor if you want to work with the content.

---

## Trace a File's Entire History

```bash
git log -- <path/to/file>
```

**What it does:** Filters the commit log to only show commits that touched a specific file. The `--` separator is important — it tells Git that what follows is a file path, not a branch name or commit reference.

To follow renames across the file's history (Git tracks renames as a rename + content change):

```bash
git log --follow -- <path/to/file>
```

For a compact view:

```bash
git log --oneline -- <path/to/file>
```

---

## Find Deleted Files

```bash
git log --diff-filter=D --name-only
```

**What it does:** `--diff-filter` limits log output to commits where certain types of changes occurred. `D` stands for "deleted". This walks the entire history and prints only the commits where files were deleted, along with which files disappeared.

Once you find the commit hash where the file was deleted, use `git show <hash>^:<path>` on the parent commit (the `^` means "one commit before") to recover the content before it was removed.

---

## Find Who Wrote a Specific Line — and When

```bash
git blame <path/to/file>
```

**What it does:** Annotates every single line in a file with the commit hash, author name, and timestamp of the last modification to that line. It answers not just _what_ the code does, but _when_ and _by whom_ it was written.

```bash
git blame -L 10,20 src/main/java/App.java
```

The `-L` flag restricts output to a line range — useful for large files where you only care about a specific section.

---

## Search for a String Across All History (The "Pickaxe")

```bash
git log -S "search_term"
```

**What it does:** This is Git's "pickaxe" search. It scans the entire commit history and returns only the commits that **added or removed** the exact string you provide — not just commits where the file changed, but specifically commits where the count of that string in the codebase went up or down.

```bash
git log -S "calculateDiscount"
```

Invaluable when you deleted a function weeks ago and remember its name but not where it lived. Once you find the commit, use `git show <hash>:path/to/file` to read the old content.

For regex-based search instead of an exact string:

```bash
git log -G "pattern.*here"
```

`-G` matches any commit where the diff contains a line matching the regex, which is broader than `-S`.

---

## Search Commit Messages for Keywords

```bash
git log --grep="search_term"
```

**What it does:** Filters the log to only commits whose message contains the given string. Useful when you remember writing something like "fix login bug" but don't remember when or what files were involved.

```bash
git log --grep="login" --oneline
```

---

## Browse History Visually in the Terminal

```bash
git log --oneline --graph --decorate --all
```

**What it does:** Combines several flags to give you a compact, readable history view:

- `--oneline` — one line per commit (hash + message)
- `--graph` — draws branch/merge topology as ASCII art
- `--decorate` — shows branch and tag names next to commits
- `--all` — includes all branches and remotes, not just the current one

Good for orienting yourself before drilling into a specific commit.

---

## Safely Explore an Old State (Detached HEAD)

```bash
git switch --detach <commit_hash>
```

**What it does:** Checks out the commit without creating or switching to a branch. You're now in "detached HEAD" state — your working tree reflects the project exactly as it was at that commit. You can look around, run the code, build it, whatever you need.

Nothing you do here affects your branches unless you explicitly create one. To return to where you were:

```bash
git switch main
```

Prefer `git switch --detach` over the older `git checkout <commit_hash>` — it's explicit about intent and won't accidentally trigger branch switching if you mistype a name.

---

## Restore a Specific File from a Past Commit

```bash
git checkout <commit_hash> -- path/to/file
```

**What it does:** Copies a single file from the specified commit directly into your working tree and staging area, without moving HEAD or touching any other files. This is how you recover a deleted or overwritten file — you get the old version back on your current branch, ready to commit.

```bash
git checkout ae0d112 -- README.md
```

After running this, `git status` will show the file as modified (staged). Review it, then commit.

---

## Compare a Single File Between Two Commits

```bash
git diff <old_commit> <new_commit> -- path/to/file
```

**What it does:** Scopes `git diff` to a single file instead of the whole tree. You get the line-by-line diff for that file between the two commits — nothing else. Great when you know exactly which file changed and want to understand how.

```bash
git diff HEAD~5 HEAD -- src/main/java/UserService.java
```

---

## Check If a File Was Ever Renamed

```bash
git log --follow --diff-filter=R --name-status -- path/to/file
```

**What it does:** The `--follow` flag enables rename tracking across history. `--diff-filter=R` filters to only rename events, and `--name-status` shows the old and new name side by side. This reveals the full rename chain of a file across its lifetime — useful in large codebases that have gone through refactoring.

---

## Quick Reference

| Goal                               | Command                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| What files did this commit touch?  | `git show --name-only <commit>`                          |
| What changed between two commits?  | `git diff --name-only <old> <new>`                       |
| Full file tree at a past commit    | `git ls-tree -r --name-only <commit>`                    |
| Read a file from the past          | `git show <commit>:path/to/file`                         |
| History of a single file           | `git log --follow -- path/to/file`                       |
| Find deleted files                 | `git log --diff-filter=D --name-only`                    |
| Who wrote this line?               | `git blame -L <from,to> path/to/file`                    |
| Search text across all history     | `git log -S "string"`                                    |
| Search commit messages             | `git log --grep="term" --oneline`                        |
| Explore old state safely           | `git switch --detach <commit>`                           |
| Restore a file to current branch   | `git checkout <commit> -- path/to/file`                  |
| Diff a single file between commits | `git diff <old> <new> -- path/to/file`                   |
| Find renames in history            | `git log --follow --diff-filter=R --name-status -- file` |

---

## The Mental Model

Think of Git as a filesystem with a built-in time dimension. Every commit is a complete snapshot — not a delta, not a diff. When you run `git show` or `git ls-tree`, you're not reconstructing history; you're reading a snapshot that has always been there. The commands above are just different lenses for viewing and extracting from those snapshots.

Once this clicks, Git stops feeling like a version control system and starts feeling like a database you can query.
