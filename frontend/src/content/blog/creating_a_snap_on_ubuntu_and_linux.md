---
lang: en
title: 'Creating a Snap Package on Ubuntu and Linux'
date: '2026-06-10'
category: 'TECH'
tags: ['snap', 'snapcraft', 'packaging', 'ubuntu', 'linux', 'loop', 'lsblk']
---

## What is a snap?

A snap is a compressed SquashFS image containing your application, its bundled dependencies, and metadata that tells snapd how to launch it and what resources it can access.

The image is mounted read-only by `snapd`, the background service that manages snaps. Your app never installs files into `/usr/bin` or `/etc`. Instead it runs from `/snap/<name>/current/`, and anything it needs to write goes into dedicated directories that snapd creates for it (`$SNAP_DATA`, `$SNAP_COMMON`, `$SNAP_USER_DATA`). This is why snaps update atomically and roll back cleanly: an update swaps one image for another, and the old one stays on disk until you no longer need it.

**Base.** A snap does not bundle an entire operating system. It declares a *base* snap (`core22`, `core24`, and so on), a minimal Ubuntu root filesystem, and runs on top of it. The base fixes which glibc and which system libraries your binaries see, independent of the host distro. That is how one snap can run the same way on Ubuntu, Fedora, Arch or Debian.

**Confinement.** By default a snap runs in a sandbox (AppArmor, seccomp, cgroups, mount namespaces). It can only reach the network, your home directory, audio, cameras and so on if it declares an *interface* for it and the system connects that interface. Snaps that genuinely need full system access can ask for *classic* confinement, but the Snap Store reviews those requests manually.

Snaps are a good fit when you want one build to work across many distributions, need automatic background updates, or are shipping a server or CLI tool and want staged rollouts through release *channels* (`stable`, `candidate`, `beta`, `edge`). They are a weaker fit for software that needs deep integration with the host, such as kernel modules or tools that manage other system packages. In those cases a `.deb` or an RPM is usually less painful.

## Setting up your build machine

You need three things: `snapd` (to install and run snaps), `snapcraft` (the build tool), and a container backend where the build happens. Snapcraft deliberately does not build on your host. It starts a clean Ubuntu container or VM that matches your chosen base, builds inside it, and throws it away afterwards. That keeps your host free of build dependencies and makes the result reproducible, so the snap you build on a laptop is the same one you would get in CI.

### 1. snapd

On Ubuntu it is already installed. On other distributions:

```bash
# Debian / Linux Mint
sudo apt install snapd

# Fedora
sudo dnf install snapd
sudo ln -s /var/lib/snapd/snap /snap   # enables classic snaps like snapcraft

# Arch (from the AUR), openSUSE (add the snappy repo) and others:
# see https://snapcraft.io/docs/installing-snapd
```

Log out and back in (or reboot) afterwards so `/snap/bin` is on your `PATH`.

### 2. snapcraft

```bash
sudo snap install snapcraft --classic
snapcraft --version
```

It is installed with `--classic` because it has to drive containers and read your project directory freely.

### 3. LXD (the build container)

```bash
sudo snap install lxd
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
newgrp lxd          # or log out and in, so the group change applies
```

The `--auto` flag accepts sensible defaults (a local storage pool and a bridge network), which is all a build needs. If you prefer VMs, Multipass works as an alternative backend (`sudo snap install multipass`), and snapcraft will pick whichever it finds.

`snapcraft pack --destructive-mode` builds directly on the host and installs build dependencies there. Use it in a disposable CI runner that runs the Ubuntu release matching your base, such as Ubuntu 26.04 for `core26`.

## Your first snap: the project file

Start with a three-line shell script. Create the following files.

```text
hello-snap/
├── snap/
│   └── snapcraft.yaml
└── src/
    └── hello-snap
```

The script, `src/hello-snap`:

```bash
#!/bin/sh
echo "Hello from snap!"
echo "My files live in: $SNAP"
echo "I am running as user: $(id -un)"
```

Make it executable (`chmod +x src/hello-snap`); snapcraft copies permissions as they are, and a script without the executable bit is the most common reason a freshly built snap fails to start. Now the project file, `snap/snapcraft.yaml`:

```yaml
name: hello-snap
base: core26
version: '0.1'
summary: A tiny example snap
description: |
  Prints a greeting and a few facts about the snap
  environment it runs in. Built to learn snap packaging.

grade: devel
confinement: strict

apps:
  hello-snap:
    command: hello-snap

parts:
  hello:
    plugin: dump
    source: src
```

**Package metadata.** The Snap Store identifies the package by `name`. Use lowercase letters, digits and hyphens, with at least one letter and no leading, trailing or doubled hyphens. Quote `version` so YAML keeps `0.10` as written instead of parsing it as the number `0.1`. The store displays the one-line `summary` (up to 78 characters) and the longer `description`.

**Runtime and confinement.** With `base: core26`, the snap uses the Ubuntu 26.04 runtime regardless of the host distribution. Use `core24` or `core22` if you need an older runtime. The store accepts `grade: devel` builds in the `edge` and `beta` channels. Set `grade: stable` when preparing a release for `candidate` or `stable`. With `confinement: strict`, snapd enforces the sandbox. During development, `devmode` lets you log sandbox violations while the app runs.

**Apps and parts.** `apps` defines the commands users can run. The app key matches the snap name in this example, so the command on the host is `hello-snap`. The `command` path is relative to the snap's root. Each entry in `parts` names a source, such as a directory, tarball or Git URL, and a plugin to process it. The `dump` plugin copies the source files, which is enough for this shell script.

Each part goes through `pull`, `build`, `stage` and `prime`. Snapcraft packs the primed files into the SquashFS image. Run `snapcraft prime` to stop at that step.

To derive the version from a Git tag or a program's `--version` output, declare `adopt-info: hello` at the top level and run `craftctl set version=...` in the `hello` part.

## Build, install and run it

From the project root (the directory that contains `snap/`):

```bash
cd hello-snap
snapcraft pack
```

The first run is slow because snapcraft has to create the build container and download the base image; later builds reuse it. When it finishes you will find `hello-snap_0.1_amd64.snap` next to your sources. By default snapcraft builds for the architecture of the machine you are on. On `core24` and newer you can state targets explicitly with a top-level `platforms:` key (for example `amd64:` and `arm64:`), and the Snap Store's build service can then produce each of them for you.

Install the local build with `--dangerous`. This flag allows snapd to install the file without a Snap Store signature.

```bash
sudo snap install --dangerous ./hello-snap_0.1_amd64.snap
hello-snap
```

You should see the greeting, and `$SNAP` will point to something like `/snap/hello-snap/x1`. The `x1` is the revision number that locally installed snaps get. To inspect what you installed:

```bash
snap list hello-snap        # installed revision and version
snap info hello-snap        # metadata, apps, confinement
unsquashfs -l hello-snap_0.1_amd64.snap   # list the files inside the image
```

`unsquashfs` (from `squashfs-tools`) is underrated. Half of all packaging bugs are "the file I expected is not in the image," and looking inside the image answers that in seconds.

### When the build or the app misbehaves

Choose where to open a shell based on which build step you need to inspect.

- `snapcraft pack --debug` drops you into a shell inside the container at the moment a step fails, with the broken state still on disk.
- `snapcraft pack --shell-after` pauses after a successful build so you can poke around in the finished tree before it is packed.
- `snapcraft pack --shell` stops before the build step, handy for running the failing command by hand.
- `snap run --shell hello-snap` opens a shell inside the *installed* snap's sandbox, so you can test what the app really sees at runtime.
- `snapcraft clean` throws away the container and all cached parts when you suspect stale state; `snapcraft clean <part>` does it for one part.

When you are done experimenting, `sudo snap remove hello-snap` uninstalls it. Add `--purge` to skip the automatic data snapshot that snapd takes on removal.

## Confinement, interfaces and services

Under `strict` confinement, an app uses interfaces to access resources outside its sandbox, such as the network or removable drives. The app declares a plug in `plugs`. Snapd or the user connects it to a compatible slot, often provided by the system.

```yaml
apps:
  my-tool:
    command: bin/my-tool
    plugs:
      - network          # outgoing connections
      - home             # non-hidden files in the user's home
      - removable-media  # /media and /mnt (not auto-connected)
```

Some interfaces, such as `network` and `network-bind`, connect automatically at install time. Others, like `removable-media`, need the user to opt in, and you should tell them how:

```bash
snap connections my-tool                       # what is connected, what is not
sudo snap connect my-tool:removable-media      # grant it by hand
```

Inside a strictly confined snap, `$HOME` points to `~/snap/<name>/<revision>`. The `home` interface grants access to non-hidden files in the user's regular home directory. Store per-user settings in `$SNAP_USER_DATA`. For system-wide data shared by all revisions, use the root-owned `$SNAP_COMMON`.

### Finding out what is being denied

When an app fails with "permission denied" only under snap, the kernel has usually logged an AppArmor denial. The `snappy-debug` tool turns those logs into a readable suggestion for which interface you are missing:

```bash
sudo snap install snappy-debug
sudo snappy-debug          # leave running in one terminal, then run your app in another
```

To check whether confinement is blocking an operation, test with `confinement: devmode` and inspect the violation logs. Restore `strict` before publishing.

### Running a background service

A snap can also ship a long-running service. Add `daemon` to an app and snapd generates and manages the systemd unit for you:

```yaml
apps:
  my-server:
    command: bin/my-server --port 8080
    daemon: simple
    restart-condition: on-failure
    plugs: [network-bind]
```

The service starts on install and on boot. Manage it with `snap start|stop|restart my-snap.my-server` and read its output with `snap logs -f my-snap.my-server`. Keep its state in `$SNAP_DATA`, which is tied to the revision and is copied on updates, or in `$SNAP_COMMON` when it must survive rollbacks unchanged.

### Classic confinement

`confinement: classic` turns the sandbox off: the app sees the host filesystem and can run host binaries. Compilers, IDEs and tools such as snapcraft itself need this. The catch is that users must install with `--classic`, and the Snap Store only allows publishing classic snaps after a manual review in the forum, where you justify why strict confinement is not enough. Start with `strict`, and ask for `classic` only when you can show that interfaces cannot cover your use case.

## Packaging real software

Choose a plugin for the project's build system and declare its build and runtime dependencies. Run `snapcraft list-plugins` to see the plugins your version supports.

| Plugin | Builds | Options you will use most |
| --- | --- | --- |
| `dump` | Nothing; copies files as they are | `source`, `organize`, `stage` |
| `python` | A Python project into a virtualenv | `python-requirements`, `python-packages` |
| `npm` | A Node.js application | `npm-include-node`, `npm-node-version` |
| `go` | A Go module | `go-buildtags`, `build-snaps: [go]` |
| `rust` | A Cargo project | `rust-features`, `rust-channel` |
| `cmake`, `make`, `autotools` | C and C++ projects | `cmake-parameters`, `autotools-configure-parameters` |

The example below builds a Python CLI from the local repository and a C project from an upstream Git tag.

```yaml
parts:
  myapp:
    plugin: python
    source: .
    python-requirements: [requirements.txt]
    build-packages:
      - libffi-dev          # needed only to compile dependencies
    stage-packages:
      - libffi8             # must exist at run time inside the snap

  upstream-tool:
    plugin: cmake
    source: https://github.com/example/tool.git
    source-tag: v2.4.1
    cmake-parameters:
      - -DCMAKE_BUILD_TYPE=Release
      - -DCMAKE_INSTALL_PREFIX=/usr
    after: [myapp]          # build this part after myapp
```

`build-packages` are installed in the build environment. `stage-packages` are downloaded as `.deb` files and unpacked into the snap. If the app works in the build container but fails after installation with `error while loading shared libraries`, check whether a runtime library needs to be added to `stage-packages`. Use `snapcraft pack --shell-after` and run `ldd` on the binary to see its dependencies.

- **`override-build`** replaces a part's build step with your own shell script. Call `craftctl default` inside it to run the plugin's normal behavior first, then tweak the result (copy extra files, patch a path, set the version).
- **`organize` and `prime`** let you move files around inside the snap and filter what ends up in the final image. Use `prime: [-usr/share/doc]` to drop things you do not need and keep the image small.

For graphical applications, do not wire up the desktop integration by hand. Add an *extension* to the app, for example `extensions: [gnome]` for GTK software or `extensions: [kde-neon-qt6]` for Qt. The extension pulls in the right runtime snap, sets the environment variables, and adds the plugs for the display server, themes and fonts. `snapcraft expand-extensions` prints the full file with everything the extension adds, which is the best way to see what it does for you.

## Publishing to the Snap Store

You can share a local `.snap` file for installation with `--dangerous`. Publishing through the Snap Store gives users signed installs, automatic updates and release channels.

**1. Get an account and log in.** Create a free account at snapcraft.io, then authenticate the command-line tool:

```bash
snapcraft login
```

This opens a browser window for the login. Your credentials are stored locally and reused until they expire.

**2. Reserve the name.** Names are global and first come, first served, so register yours before anything else:

```bash
snapcraft register my-unique-snap-name
```

If the name is taken, pick another, or open a name dispute through the forum if you hold a trademark or the upstream project. Then update `name:` in `snapcraft.yaml` to match.

**3. Prepare the metadata and build.** Before the first real release, change `grade` to `stable`, make sure `summary` and `description` are good, and consider adding `title`, `license` (an SPDX identifier such as `MIT`), `contact`, `issues`, `source-code` and `website`. An `icon` (a PNG or SVG of at least 256×256 pixels) and screenshots can be added in the store's web dashboard. Rebuild with `snapcraft pack`.

**4. Upload and release.**

```bash
snapcraft upload --release=edge my-unique-snap-name_0.1_amd64.snap
snapcraft status my-unique-snap-name
```

The upload passes through automated checks, and snaps that request unusual interfaces may be held for manual review. Once it is accepted, the revision lands in the channel you named.

### Channels and risk levels

A channel is `track/risk/branch`, and in daily use you only deal with the risk part: `edge` (every build, no promises), `beta`, `candidate` and `stable`. Users who run `snap install my-snap` get `stable`. Those who want to test early run `snap install my-snap --channel=beta`. The normal habit is to upload to `edge`, test it, and then promote the same revision upward without rebuilding:

```bash
snapcraft release my-unique-snap-name 3 stable     # revision 3 → stable
```

Because the revision is identical, what you tested is exactly what your users receive. If a release turns out to be broken, `snapcraft release` with the previous good revision points the channel back at it, so devices move to it at their next refresh.

### Automating it

For continuous delivery, do not use your personal login. Export a restricted credential and give it to CI as a secret:

```bash
snapcraft export-login --snaps=my-unique-snap-name \
  --channels=edge --acls=package_upload creds.txt
```

The CI job sets `SNAPCRAFT_STORE_CREDENTIALS` to the file's contents, builds, and runs `snapcraft upload --release=edge`. If you need several architectures without owning the hardware, `snapcraft remote-build` sends your project to Launchpad's build farm and returns the finished snaps.

## Troubleshooting and cheat sheet

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Snapcraft cannot reach LXD, or reports a permission error on its socket | Your user is not in the `lxd` group, or LXD was never initialized | `sudo lxd init --auto`, `sudo usermod -aG lxd $USER`, then log in again |
| Build hangs on `apt` or cannot download anything | Docker's firewall rules block the LXD bridge network | Allow the bridge: `sudo iptables -I DOCKER-USER -i lxdbr0 -j ACCEPT` and `sudo iptables -I DOCKER-USER -o lxdbr0 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT` |
| `snap install` says it cannot find signatures with metadata | A locally built snap is unsigned | Add `--dangerous` |
| Installed app: command not found | `/snap/bin` is not on `PATH` yet | Log out and in, or add `/snap/bin` to `PATH` |
| App fails with `Permission denied` only inside the snap | A required interface is missing or not connected | Run `snappy-debug`, add the plug, check `snap connections` |
| `error while loading shared libraries` | The library is on your build machine but not inside the snap | Add the package to `stage-packages` |
| `exec format error` or `bad interpreter` | Script is missing the executable bit, or its interpreter does not exist in the base | `chmod +x`, or stage the interpreter, or use the matching plugin |
| Upload is refused for a `devel` snap | You are releasing to `stable` or `candidate` with `grade: devel` | Set `grade: stable` and rebuild |
| YAML error on pack | Indentation, an unquoted version, or a misspelled key | Fix the line named in the error; quote `version` |

### Command reference

| Command | What it does |
| --- | --- |
| `snapcraft pack` | Builds the snap in a clean container |
| `snapcraft pack --debug` | Opens a shell inside the container when a step fails |
| `snapcraft clean` | Discards the container and cached parts |
| `sudo snap install --dangerous ./x.snap` | Installs a local build |
| `snap run --shell <snap>` | Shell inside the installed snap's sandbox |
| `snap connections <snap>` | Shows which plugs are connected |
| `snap logs -f <snap>.<app>` | Follows a service's logs |
| `snapcraft login` and `snapcraft register <name>` | One-time store setup |
| `snapcraft upload --release=edge x.snap` | Publishes a build to a channel |
| `snapcraft release <name> <rev> stable` | Promotes a tested revision |

Snap tooling changes between releases, and new bases bring small schema changes. When something here does not match what your snapcraft reports, trust its error message and the official documentation: the [snapcraft documentation](https://documentation.ubuntu.com/snapcraft/latest/) covers every key in `snapcraft.yaml`, and the [Snap Store](https://snapcraft.io/core26) page for `core26` confirms the current base.
