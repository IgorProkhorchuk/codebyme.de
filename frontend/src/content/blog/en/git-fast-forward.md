---
title: 'Fast-Forward Merge'
date: '2023-12-03'
category: 'TECH'
---

## Fast-Forward Merge

A **fast-forward** merge happens when Git can simply move the branch pointer forward because there's a direct linear path between the branches.

### Visual Example

**Before merge:**

```
git_2:      A---B---C
                     \
git_1:                D---E---F
```

If you're on `git_2` and merge `git_1`, Git sees that `git_2` hasn't diverged - it just hasn't caught up yet. So Git simply moves the `git_2` pointer forward to `F`:

**After fast-forward merge:**

```
git_2:      A---B---C---D---E---F
git_1:                          ↑
                           (both here)
```

No merge commit is created - the history stays linear.

### When Fast-Forward is NOT Possible

**Before merge:**

```
            A---B---C---D  (git_2)
                 \
                  E---F    (git_1)
```

Here both branches have diverged (both have new commits). Git **cannot** fast-forward, so it creates a merge commit:

**After regular merge:**

```
            A---B---C---D---M  (git_2)
                 \         /
                  E---F----    (git_1)
```

### The `--no-ff` Flag

Even when fast-forward is possible, `--no-ff` forces Git to create a merge commit, preserving the fact that work happened on a separate branch:

```
            A---B---C-------M  (git_2)
                     \     /
                      D---E    (git_1)
```

This is useful for maintaining clear branch history in your repository.
