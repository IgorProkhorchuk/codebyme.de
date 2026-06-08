---
title: '`update-alternatives` in Linux'
date: '2025-07-16'
category: 'TECH'
tags: ['linux']
---

> Managing multiple versions of the same tool — the right way.

---

## Table of Contents

1. [What Is `update-alternatives`?](#what-is-update-alternatives)
2. [How It Works Under the Hood](#how-it-works-under-the-hood)
3. [Core Concepts](#core-concepts)
4. [Command Reference](#command-reference)
5. [Working with Java: A Real-World Walkthrough](#working-with-java-a-real-world-walkthrough)
   - [Installing Multiple Java Versions](#installing-multiple-java-versions)
   - [Registering Alternatives](#registering-alternatives)
   - [Listing and Inspecting Alternatives](#listing-and-inspecting-alternatives)
   - [Selecting a Version Manually](#selecting-a-version-manually)
   - [Automatic Mode and Priorities](#automatic-mode-and-priorities)
   - [Managing Related Binaries with Slave Links](#managing-related-binaries-with-slave-links)
   - [Removing an Alternative](#removing-an-alternative)
6. [openSUSE vs. Debian/Ubuntu Differences](#opensuse-vs-debianubuntu-differences)
7. [Advanced Patterns](#advanced-patterns)
8. [Troubleshooting](#troubleshooting)
9. [Quick Reference Cheatsheet](#quick-reference-cheatsheet)

---

## What Is `update-alternatives`?

`update-alternatives` is a Linux utility that manages **symbolic links** for commands that can be fulfilled by multiple installed programs. It is part of the `dpkg` toolchain on Debian/Ubuntu systems and is also available on openSUSE (via the `update-alternatives` package in `zypper`).

The classic problem it solves: you have OpenJDK 21, OpenJDK 25, and GraalVM 25 all installed simultaneously. When you type `java` in the terminal, which one runs? `update-alternatives` gives you a clean, system-wide answer to that question — without manually juggling `$PATH` entries or symlinks.

Without `update-alternatives`:

```
/usr/bin/java  ->  ??? (last one installed wins, unpredictably)
```

With `update-alternatives`:

```
/usr/bin/java  ->  /etc/alternatives/java  ->  /usr/lib/jvm/java-25-openjdk/bin/java
```

The indirection layer at `/etc/alternatives/` is the key: you change one symlink there, and every dependent link updates automatically.

---

## How It Works Under the Hood

The system maintains a database, typically stored in `/var/lib/dpkg/alternatives/` (Debian/Ubuntu) or `/var/lib/alternatives/` (openSUSE/RPM-based). Each **alternative group** has its own file there, e.g., `/var/lib/dpkg/alternatives/java`.

The symlink chain works like this:

```
User calls:   java
              │
              ▼
/usr/bin/java  (generic symlink — never touch this manually)
              │
              ▼
/etc/alternatives/java  (the "master" symlink — update-alternatives manages this)
              │
              ▼
/usr/lib/jvm/temurin-21/bin/java  (the actual binary)
```

This two-level indirection means:

- `/usr/bin/java` never needs to change.
- You only ever redirect `/etc/alternatives/java`.
- Applications and scripts that hardcode `/usr/bin/java` keep working.

---

## Core Concepts

### Alternative Group (Name)

A logical name for a capability, e.g., `java`, `javac`, `javaws`. This is what you refer to in all commands.

### Link

The path that ends up in `$PATH`, e.g., `/usr/bin/java`. This is the **generic** path users and scripts call.

### Alternative (Path)

The actual binary being pointed to, e.g., `/usr/lib/jvm/java-21-openjdk-amd64/bin/java`.

### Priority

An integer. In **auto** mode, the alternative with the **highest priority** wins. A higher number = preferred. This lets package managers express "this is a newer, better version" without forcing your hand.

### Mode: Auto vs. Manual

- **Auto**: the system picks the highest-priority alternative automatically. Changing priorities or installing new alternatives can silently switch what `java` points to.
- **Manual**: you've explicitly chosen a version with `--set` or `--config`. The system will **not** override your choice when new alternatives are installed — until you switch back to auto.

### Master and Slave Links

A **master link** is the primary command (`java`). **Slave links** are related commands that switch together with the master — e.g., `javac`, `javadoc`, `jar`. This ensures that all tools of a given JDK version are always in sync.

---

## Command Reference

All commands require `sudo` unless you are root.

### `--install` — Register a new alternative

```bash
sudo update-alternatives --install <link> <name> <path> <priority> \
  [--slave <link> <name> <path>] ...
```

| Argument     | Meaning                                            |
| ------------ | -------------------------------------------------- |
| `<link>`     | Symlink in `$PATH`, e.g. `/usr/bin/java`           |
| `<name>`     | Alternative group name, e.g. `java`                |
| `<path>`     | Real binary path, e.g. `/usr/lib/jvm/.../bin/java` |
| `<priority>` | Integer; higher = preferred in auto mode           |

### `--config` — Interactively select a version

```bash
sudo update-alternatives --config java
```

Presents a numbered menu; you pick one.

### `--set` — Non-interactively select a specific path

```bash
sudo update-alternatives --set java /usr/lib/jvm/java-25-openjdk-amd64/bin/java
```

Puts the group in **manual** mode.

### `--auto` — Revert to automatic mode

```bash
sudo update-alternatives --auto java
```

Lets the system re-elect the highest-priority alternative.

### `--display` — Show full group details

```bash
sudo update-alternatives --display java
```

Shows current mode, current link, and all registered alternatives with their priorities.

### `--list` — Show just the paths

```bash
sudo update-alternatives --list java
```

### `--query` — Machine-readable display

```bash
sudo update-alternatives --query java
```

Useful in scripts; outputs a structured block.

### `--remove` — Remove one alternative from a group

```bash
sudo update-alternatives --remove java /usr/lib/jvm/java-21-openjdk-amd64/bin/java
```

### `--remove-all` — Remove the entire group

```bash
sudo update-alternatives --remove-all java
```

---

## Working with Java: A Real-World Walkthrough

In this walkthrough we manage three Java distributions side-by-side:

| Distribution          | Version | Binary path (example, amd64)                  |
| --------------------- | ------- | --------------------------------------------- |
| OpenJDK (Temurin/APT) | 21      | `/usr/lib/jvm/java-21-openjdk-amd64/bin/java` |
| OpenJDK               | 25      | `/usr/lib/jvm/java-25-openjdk-amd64/bin/java` |
| GraalVM CE            | 25      | `/usr/lib/jvm/graalvm-ce-java25/bin/java`     |

> **Note on paths:** Paths vary by distro and how you install (APT, SDKMAN, manual tarball, RPM). Adjust to match your actual installation. Use `ls /usr/lib/jvm/` to see what you have.

---

### Installing Multiple Java Versions

#### Debian/Ubuntu (APT)

```bash
# OpenJDK 21
sudo apt install openjdk-21-jdk

# OpenJDK 25 (if available in your repos or via PPA)
sudo apt install openjdk-25-jdk

# GraalVM CE 25 — typically installed manually or via SDKMAN
# Manual tarball approach:
sudo mkdir -p /usr/lib/jvm
sudo tar -xzf graalvm-community-jdk-25_linux-x64.tar.gz -C /usr/lib/jvm/
sudo mv /usr/lib/jvm/graalvm-community-openjdk-25* /usr/lib/jvm/graalvm-ce-java25
```

#### openSUSE Tumbleweed (Zypper)

```bash
# OpenJDK 21
sudo zypper install java-21-openjdk java-21-openjdk-devel

# OpenJDK 25
sudo zypper install java-25-openjdk java-25-openjdk-devel

# GraalVM — manual tarball (same as above)
sudo tar -xzf graalvm-community-jdk-25_linux-x64.tar.gz -C /usr/lib/jvm/
```

On openSUSE, APT-installed JDKs often register themselves automatically. For manually installed ones, you must register them yourself.

---

### Registering Alternatives

When you install via APT or zypper, alternatives are often registered automatically. For manual installations (GraalVM, custom builds), you must register them yourself.

#### Register OpenJDK 21 (priority 2100)

```bash
sudo update-alternatives --install /usr/bin/java java \
    /usr/lib/jvm/java-21-openjdk-amd64/bin/java 2100
```

#### Register OpenJDK 25 (priority 2500 — higher, so it wins in auto mode)

```bash
sudo update-alternatives --install /usr/bin/java java \
    /usr/lib/jvm/java-25-openjdk-amd64/bin/java 2500
```

#### Register GraalVM CE 25 (priority 2490 — slightly below plain OpenJDK 25)

```bash
sudo update-alternatives --install /usr/bin/java java \
    /usr/lib/jvm/graalvm-ce-java25/bin/java 2490
```

After these three registrations, `java` in auto mode will point to **OpenJDK 25** (priority 2500, the highest).

---

### Listing and Inspecting Alternatives

#### Quick list of registered paths

```bash
sudo update-alternatives --list java
```

Output:

```
/usr/lib/jvm/java-21-openjdk-amd64/bin/java
/usr/lib/jvm/java-25-openjdk-amd64/bin/java
/usr/lib/jvm/graalvm-ce-java25/bin/java
```

#### Full details with priorities and current selection

```bash
sudo update-alternatives --display java
```

Output:

```
java - auto mode
  link best version is /usr/lib/jvm/java-25-openjdk-amd64/bin/java
  link currently points to /usr/lib/jvm/java-25-openjdk-amd64/bin/java
  link java is /usr/bin/java
/usr/lib/jvm/java-21-openjdk-amd64/bin/java - priority 2100
/usr/lib/jvm/java-25-openjdk-amd64/bin/java - priority 2500
/usr/lib/jvm/graalvm-ce-java25/bin/java - priority 2490
```

The first line tells you the current mode (`auto`), the best candidate, and what the symlink actually points to right now.

#### Machine-readable query (useful in scripts and CI)

```bash
update-alternatives --query java
```

Output:

```
Name: java
Link: /usr/bin/java
Status: auto
Best: /usr/lib/jvm/java-25-openjdk-amd64/bin/java
Value: /usr/lib/jvm/java-25-openjdk-amd64/bin/java

Alternative: /usr/lib/jvm/java-21-openjdk-amd64/bin/java
Priority: 2100

Alternative: /usr/lib/jvm/java-25-openjdk-amd64/bin/java
Priority: 2500

Alternative: /usr/lib/jvm/graalvm-ce-java25/bin/java
Priority: 2490
```

#### Verify what java is actually running

```bash
java -version
readlink -f /usr/bin/java
```

---

### Selecting a Version Manually

#### Interactive selection with a menu

```bash
sudo update-alternatives --config java
```

Output:

```
There are 3 choices for the alternative java (providing /usr/bin/java).

  Selection    Path                                              Priority   Status
------------------------------------------------------------
* 0            /usr/lib/jvm/java-25-openjdk-amd64/bin/java      2500      auto mode
  1            /usr/lib/jvm/java-21-openjdk-amd64/bin/java      2100      manual mode
  2            /usr/lib/jvm/java-25-openjdk-amd64/bin/java      2500      manual mode
  3            /usr/lib/jvm/graalvm-ce-java25/bin/java          2490      manual mode

Press <enter> to keep the current choice[*], or type selection number:
```

Type `3` and press Enter to switch to GraalVM CE 25. The group is now in **manual** mode.

#### Non-interactive (scripting-friendly)

```bash
# Switch to GraalVM CE 25
sudo update-alternatives --set java /usr/lib/jvm/graalvm-ce-java25/bin/java

# Verify
java -version
# graalvm ce java 25 ...

# Switch to OpenJDK 21
sudo update-alternatives --set java /usr/lib/jvm/java-21-openjdk-amd64/bin/java

java -version
# openjdk version "21.x.x" ...
```

#### Revert to automatic mode (highest priority wins)

```bash
sudo update-alternatives --auto java

java -version
# openjdk version "25.x.x" ...  (priority 2500 wins again)
```

---

### Automatic Mode and Priorities

Priority integers are arbitrary — what matters is their **relative order**. A common convention:

```
Priority = MajorVersion * 100
```

So Java 21 → 2100, Java 25 → 2500. This automatically makes newer versions win.

If you want to keep an older version as the system default while newer ones are installed, give the older one a _higher_ priority:

```bash
# Force Java 21 to win in auto mode despite Java 25 being installed
sudo update-alternatives --install /usr/bin/java java \
    /usr/lib/jvm/java-21-openjdk-amd64/bin/java 9999
```

Now `update-alternatives --auto java` will select Java 21. This is useful in CI/CD environments where you want stable, reproducible builds regardless of what gets installed later.

---

### Managing Related Binaries with Slave Links

A JDK is not just `java` — it also includes `javac`, `javadoc`, `jar`, `jshell`, etc. Without slave links, you could end up with `java` pointing to GraalVM but `javac` still pointing to OpenJDK 21 — a recipe for confusing build errors.

Slave links ensure all tools of a JDK version switch together.

#### Re-register alternatives with slave links

When you add slaves, you must **remove** the existing registration first, then re-register with slaves:

```bash
# Remove existing registrations
sudo update-alternatives --remove java /usr/lib/jvm/java-25-openjdk-amd64/bin/java
sudo update-alternatives --remove java /usr/lib/jvm/java-21-openjdk-amd64/bin/java
sudo update-alternatives --remove java /usr/lib/jvm/graalvm-ce-java25/bin/java

# Or remove-all and start fresh
sudo update-alternatives --remove-all java
sudo update-alternatives --remove-all javac
sudo update-alternatives --remove-all jar
```

Now register each JDK with its slave links:

```bash
# --- OpenJDK 21 ---
JDK21=/usr/lib/jvm/java-21-openjdk-amd64
sudo update-alternatives --install /usr/bin/java java $JDK21/bin/java 2100 \
  --slave /usr/bin/javac       javac       $JDK21/bin/javac       \
  --slave /usr/bin/javadoc     javadoc     $JDK21/bin/javadoc     \
  --slave /usr/bin/jar         jar         $JDK21/bin/jar         \
  --slave /usr/bin/jshell      jshell      $JDK21/bin/jshell      \
  --slave /usr/bin/jlink       jlink       $JDK21/bin/jlink       \
  --slave /usr/bin/jpackage    jpackage    $JDK21/bin/jpackage    \
  --slave /usr/share/man/man1/java.1.gz java.1.gz \
          $JDK21/man/man1/java.1.gz

# --- OpenJDK 25 ---
JDK25=/usr/lib/jvm/java-25-openjdk-amd64
sudo update-alternatives --install /usr/bin/java java $JDK25/bin/java 2500 \
  --slave /usr/bin/javac       javac       $JDK25/bin/javac       \
  --slave /usr/bin/javadoc     javadoc     $JDK25/bin/javadoc     \
  --slave /usr/bin/jar         jar         $JDK25/bin/jar         \
  --slave /usr/bin/jshell      jshell      $JDK25/bin/jshell      \
  --slave /usr/bin/jlink       jlink       $JDK25/bin/jlink       \
  --slave /usr/bin/jpackage    jpackage    $JDK25/bin/jpackage    \
  --slave /usr/share/man/man1/java.1.gz java.1.gz \
          $JDK25/man/man1/java.1.gz

# --- GraalVM CE 25 ---
GRAAL=/usr/lib/jvm/graalvm-ce-java25
sudo update-alternatives --install /usr/bin/java java $GRAAL/bin/java 2490 \
  --slave /usr/bin/javac       javac       $GRAAL/bin/javac       \
  --slave /usr/bin/javadoc     javadoc     $GRAAL/bin/javadoc     \
  --slave /usr/bin/jar         jar         $GRAAL/bin/jar         \
  --slave /usr/bin/jshell      jshell      $GRAAL/bin/jshell      \
  --slave /usr/bin/jlink       jlink       $GRAAL/bin/jlink       \
  --slave /usr/bin/jpackage    jpackage    $GRAAL/bin/jpackage    \
  --slave /usr/bin/native-image native-image $GRAAL/bin/native-image \
  --slave /usr/share/man/man1/java.1.gz java.1.gz \
          $GRAAL/man/man1/java.1.gz
```

Note that GraalVM gets an extra slave `native-image` — a GraalVM-specific tool. When another JDK is active, `native-image` won't be in `$PATH` at all (or rather, the symlink won't exist unless it's also registered elsewhere), cleanly preventing confusion.

Now switching `java` with `--config` or `--set` atomically switches `javac`, `jar`, `jshell`, and all other registered slaves at the same time:

```bash
sudo update-alternatives --config java
# Select GraalVM → javac, jar, jshell, native-image all switch to GraalVM versions

which javac && javac -version
# /usr/bin/javac
# javac 25 (GraalVM CE)
```

---

### Removing an Alternative

#### Remove a single alternative (keep others)

```bash
# Remove only GraalVM from the java group
sudo update-alternatives --remove java /usr/lib/jvm/graalvm-ce-java25/bin/java
```

If GraalVM was the currently selected alternative (manual mode), the system automatically switches to the highest-priority remaining option.

#### Remove the entire group

```bash
sudo update-alternatives --remove-all java
```

This removes the group entirely including `/usr/bin/java`. After this, the command won't exist until you register at least one alternative again.

---

## openSUSE vs. Debian/Ubuntu Differences

| Aspect                        | Debian / Ubuntu               | openSUSE Tumbleweed                      |
| ----------------------------- | ----------------------------- | ---------------------------------------- |
| Database location             | `/var/lib/dpkg/alternatives/` | `/var/lib/alternatives/`                 |
| Package providing the tool    | `dpkg` (built-in)             | `update-alternatives` (separate package) |
| Auto-registration on install  | Yes (via `postinst` scripts)  | Yes (for zypper packages)                |
| Default java alternative name | `java`                        | `java` (same)                            |
| Man page slave name           | `java.1.gz`                   | `java.1.gz` (same)                       |
| JVM base directory            | `/usr/lib/jvm/`               | `/usr/lib64/jvm/` (on 64-bit)            |

On openSUSE, the commands are **identical** — the difference is only in where things live on disk.

```bash
# openSUSE: check your actual JVM paths
ls /usr/lib64/jvm/
# java-21-openjdk  java-25-openjdk  ...

# Adjust registration accordingly
JDK25=/usr/lib64/jvm/java-25-openjdk
sudo update-alternatives --install /usr/bin/java java $JDK25/bin/java 2500 \
  --slave /usr/bin/javac javac $JDK25/bin/javac
```

---

## Advanced Patterns

### Scripted JDK switcher function

Add to your `~/.bashrc` or `~/.zshrc` for convenient per-session switching (does **not** affect other users or other terminals):

```bash
use-java() {
    local version="$1"
    local jvm_path

    case "$version" in
        21)     jvm_path="/usr/lib/jvm/java-21-openjdk-amd64" ;;
        25)     jvm_path="/usr/lib/jvm/java-25-openjdk-amd64" ;;
        graal)  jvm_path="/usr/lib/jvm/graalvm-ce-java25"     ;;
        *)      echo "Unknown version: $version"; return 1    ;;
    esac

    export JAVA_HOME="$jvm_path"
    export PATH="$JAVA_HOME/bin:$PATH"
    echo "Switched to: $(java -version 2>&1 | head -1)"
}

# Usage:
# use-java 21
# use-java graal
```

This approach changes only the current shell session. It does not touch `update-alternatives` at all — useful for per-project work without needing `sudo`.

### Setting JAVA_HOME after switching system-wide

`update-alternatives` manages `/usr/bin/java` but **not** `$JAVA_HOME`. You need to set that separately. A clean way:

```bash
# After switching with update-alternatives:
export JAVA_HOME=$(dirname $(dirname $(readlink -f /usr/bin/java)))
echo $JAVA_HOME
# /usr/lib/jvm/java-25-openjdk-amd64
```

Put this in a script or shell profile if build tools (Maven, Gradle) rely on `$JAVA_HOME`.

### Using `--query` in CI/CD scripts

```bash
#!/bin/bash
# Print current java alternative info in CI logs
update-alternatives --query java | grep -E '^(Name|Value|Status|Best):'
```

Output in CI log:

```
Name: java
Status: auto
Best: /usr/lib/jvm/java-25-openjdk-amd64/bin/java
Value: /usr/lib/jvm/java-25-openjdk-amd64/bin/java
```

### Detecting whether an alternative is registered

```bash
if update-alternatives --list java 2>/dev/null | grep -q "graalvm"; then
    echo "GraalVM is registered"
else
    echo "GraalVM is NOT registered — registering now..."
    sudo update-alternatives --install /usr/bin/java java \
        /usr/lib/jvm/graalvm-ce-java25/bin/java 2490
fi
```

### Managing `javaws` and `jcontrol` (legacy, Java 8)

If you also maintain a Java 8 installation for legacy apps:

```bash
JDK8=/usr/lib/jvm/java-8-openjdk-amd64
sudo update-alternatives --install /usr/bin/java java $JDK8/jre/bin/java 800 \
  --slave /usr/bin/javac   javac   $JDK8/bin/javac    \
  --slave /usr/bin/javaws  javaws  $JDK8/jre/bin/javaws
```

Java 8 gets priority 800 — it will never win in auto mode over Java 21 (2100) or Java 25 (2500), but it's always available via `--config` or `--set`.

---

## Troubleshooting

### "update-alternatives: error: alternative path ... doesn't exist"

The path you're trying to register doesn't exist on disk. Double-check:

```bash
ls -la /usr/lib/jvm/graalvm-ce-java25/bin/java
```

If the file is missing, your installation is incomplete or the path is wrong.

### Symlink points to wrong version despite `--set`

The `java` in your PATH might be a hardcoded path, not the alternatives symlink:

```bash
which java          # Should be /usr/bin/java
type -a java        # Shows all matches — shell functions, aliases, PATH entries
readlink -f $(which java)   # Follow the full chain
```

If `which java` returns something like `/usr/local/bin/java` or `~/.sdkman/...`, that installation is overriding `update-alternatives` via `$PATH` order. Check your shell profile.

### After `--config`, `javac` is still the old version

You haven't registered `javac` as a slave link. Either:

- Register `javac` separately as its own group, **or**
- Re-register `java` with `--slave /usr/bin/javac javac ...` as shown in the slave links section.

### Slave links not switching

Slaves only switch when you switch the **master**. If you run `update-alternatives --config javac` directly on a slave group, you'll get an error like:

```
update-alternatives: error: alternative javac can't be master: it is a slave of java
```

This is correct behaviour. Manage the master (`java`) only.

### Group is in manual mode but I want auto

```bash
sudo update-alternatives --auto java
```

Verify mode changed:

```bash
update-alternatives --display java | head -1
# java - auto mode
```

---

## Quick Reference Cheatsheet

```
# Register a new alternative
sudo update-alternatives --install <link> <name> <path> <priority>

# Register with slave links
sudo update-alternatives --install /usr/bin/java java /path/to/java 2500 \
  --slave /usr/bin/javac javac /path/to/javac

# Interactive menu selection
sudo update-alternatives --config java

# Non-interactive selection (goes to manual mode)
sudo update-alternatives --set java /path/to/specific/java

# Return to auto mode (highest priority wins)
sudo update-alternatives --auto java

# Display current state + all registered alternatives
sudo update-alternatives --display java

# List only paths
sudo update-alternatives --list java

# Machine-readable output (for scripts)
update-alternatives --query java

# Remove one specific alternative
sudo update-alternatives --remove java /path/to/java

# Remove the entire group
sudo update-alternatives --remove-all java

# Resolve the full symlink chain
readlink -f /usr/bin/java

# Set JAVA_HOME from current alternatives selection
export JAVA_HOME=$(dirname $(dirname $(readlink -f /usr/bin/java)))
```

---

## Summary

`update-alternatives` is a small tool with an outsized impact on system manageability. For Java in particular — where you routinely juggle LTS releases, preview builds, and specialized runtimes like GraalVM — it provides a single, consistent control point. The key habits to build:

- Always register slave links (`javac`, `jar`, `jshell`, `jlink`) together with the master `java` entry to keep the entire toolchain in sync.
- Use priorities that reflect your preference order so that `auto` mode just works.
- Use `--set` or `--config` for deliberate overrides, and `--auto` to return to policy-driven defaults.
- Use `readlink -f /usr/bin/java` and `$JAVA_HOME` resolution to verify what is actually running — especially in CI/CD pipelines.

Once the alternatives are registered, switching the entire active JDK is a single command.
