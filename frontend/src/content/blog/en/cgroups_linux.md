---
title: 'Control Groups (cgroups) in Linux'
date: '2026-06-09'
category: 'TECH'
tags: ['linux', 'cgroups', 'kernel', 'containers', 'systemd', 'docker', 'kubernetes']
---

# cgroups - Control Groups in Linux

## Table of Contents

1. [What Are cgroups?](#what-are-cgroups)
2. [A Brief History](#a-brief-history)
3. [Core Concepts and Terminology](#core-concepts-and-terminology)
4. [cgroups v1 Architecture](#cgroups-v1-architecture)
5. [cgroups v2 Architecture](#cgroups-v2-architecture)
6. [v1 vs v2: Key Differences](#v1-vs-v2-key-differences)
7. [The cgroup Filesystem (cgroupfs)](#the-cgroup-filesystem-cgroupfs)
8. [Subsystems / Controllers](#subsystems--controllers)
   - [cpu](#cpu-controller)
   - [cpuacct](#cpuacct-controller)
   - [cpuset](#cpuset-controller)
   - [memory](#memory-controller)
   - [blkio / io](#blkio--io-controller)
   - [net_cls and net_prio](#net_cls-and-net_prio-controllers)
   - [devices](#devices-controller)
   - [freezer](#freezer-controller)
   - [pids](#pids-controller)
   - [hugetlb](#hugetlb-controller)
   - [perf_event](#perf_event-controller)
   - [rdma](#rdma-controller)
9. [Process Membership and Inheritance](#process-membership-and-inheritance)
10. [Notifications and Events](#notifications-and-events)
11. [Practical Usage: Manual cgroupfs Interaction](#practical-usage-manual-cgroupfs-interaction)
12. [systemd and cgroups](#systemd-and-cgroups)
13. [cgroups in Containers (Docker, containerd, Kubernetes)](#cgroups-in-containers)
14. [Resource Accounting Internals](#resource-accounting-internals)
15. [Kernel Implementation Overview](#kernel-implementation-overview)
16. [Debugging and Observability](#debugging-and-observability)
17. [Security Considerations](#security-considerations)
18. [Common Pitfalls](#common-pitfalls)

---

## What Are cgroups?

**Control Groups** (hereinafter cgroups) are a Linux kernel feature that organises processes into hierarchical groups and applies resource policies — limits, accounting, and isolation — to each group as a unit. The kernel enforces these policies at runtime, making cgroups the foundational mechanism behind:

- Container runtimes (Docker, Podman, containerd, LXC)
- Systemd's service and slice management
- Hypervisor-level resource partitioning
- Any workload scheduler that needs hard resource boundaries

At their core, cgroups answer two questions:

1. **How much** of a resource can a group of processes use? (limiting)
2. **How much** has a group of processes actually used? (accounting)

They can also answer a third question in some subsystems: **which** resources can a group access at all? (isolation, as in `cpuset` or `devices`).

A critical mental model: cgroups do **not** operate on individual processes in isolation. A cgroup is a named bucket. You drop PIDs into that bucket, and the kernel applies the bucket's policy to every process inside it. The hierarchy is a tree of such buckets, with resource limits potentially cascading downward.

---

## A Brief History

| Year    | Event                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------- |
| 2006    | Paul Menage and Rohit Seth at Google begin development of "process containers"                        |
| 2007    | Renamed to "control groups" to avoid confusion with Linux Containers (LXC); merged into kernel 2.6.24 |
| 2008    | v1 subsystems gradually merged: `cpuset`, `memory`, `blkio`, `freezer`                                |
| 2012    | `net_cls`, `net_prio`, `hugetlb`, `perf_event` added                                                  |
| 2013    | `pids` controller added                                                                               |
| 2013    | Tejun Heo begins designing cgroups v2 to address v1's architectural inconsistencies                   |
| 2016    | cgroups v2 merged into kernel 4.5 as an official (though incomplete) replacement                      |
| 2018    | systemd 233+ starts defaulting to unified hierarchy (v2) when available                               |
| 2021    | RHEL 9 / Fedora 31+ ship with cgroups v2 as default                                                   |
| 2022    | Kubernetes 1.25 adds stable support for cgroup v2                                                     |
| Present | v2 is the clear future; most distributions ship v2 by default                                         |

Google ran cgroups in production at massive scale — the motivation was enforcing resource isolation across their internal workload scheduler (Borg, the predecessor to Kubernetes).

---

## Core Concepts and Terminology

**cgroup**: A named set of processes that share a set of resource parameters. Implemented as a directory in the cgroupfs virtual filesystem.

**hierarchy**: A tree of cgroups. In v1, each controller could have its own independent tree. In v2, there is a single unified tree.

**controller** (also called **subsystem**): A kernel module that hooks into the cgroup infrastructure to enforce a specific class of resource policy (CPU, memory, I/O, etc.).

**tasks file**: (v1 only) The file listing thread IDs belonging to a cgroup. In v2 this was replaced by `cgroup.threads`.

**cgroup.procs**: A file in every cgroup directory; writing a PID here moves the entire process (all its threads) into the cgroup.

**root cgroup**: The top of the hierarchy. All processes on the system live here by default; all other cgroups are subdirectories.

**leaf cgroup**: A cgroup with no children. In v2, only leaf cgroups (and the root) can directly contain processes — internal nodes may not have processes and may not have controllers enabled simultaneously (the **no internal process constraint**).

**delegation**: The mechanism by which an administrator grants a user or service ownership of a sub-tree, allowing them to create child cgroups and move processes within their subtree without needing root privileges for the whole system.

---

## cgroups v1 Architecture

In v1, each controller is mounted as a **separate filesystem** (or co-mounted with others). A typical `/proc/mounts` excerpt:

```
cgroup /sys/fs/cgroup/memory cgroup rw,nosuid,nodev,noexec,relatime,memory 0 0
cgroup /sys/fs/cgroup/cpu,cpuacct cgroup rw,nosuid,nodev,noexec,relatime,cpu,cpuacct 0 0
cgroup /sys/fs/cgroup/blkio cgroup rw,nosuid,nodev,noexec,relatime,blkio 0 0
cgroup /sys/fs/cgroup/pids cgroup rw,nosuid,nodev,noexec,relatime,pids 0 0
```

Each mounted hierarchy is independent. A process can be in `/sys/fs/cgroup/memory/batch/jobA` and simultaneously in `/sys/fs/cgroup/cpu/interactive/frontend`. There is **no coordination** between hierarchies at the kernel level — this is both v1's power and its main design flaw.

### v1 Directory Structure

```
/sys/fs/cgroup/
├── memory/               ← hierarchy for memory controller
│   ├── cgroup.procs
│   ├── memory.limit_in_bytes
│   ├── memory.usage_in_bytes
│   └── webserver/        ← child cgroup
│       ├── cgroup.procs
│       └── memory.limit_in_bytes
├── cpu,cpuacct/          ← cpu and cpuacct co-mounted
│   ├── cpu.shares
│   ├── cpu.cfs_period_us
│   ├── cpu.cfs_quota_us
│   └── webserver/
│       └── cpu.shares
└── blkio/
    ├── blkio.weight
    └── webserver/
        └── blkio.weight
```

### v1 Problems

- **Incoherent hierarchy**: The memory hierarchy and CPU hierarchy can have completely different trees. `systemd` ends up fighting with `Docker` for ownership of certain subtrees.
- **Inconsistent interfaces**: Each controller has its own file naming conventions and semantics.
- **Thread vs process confusion**: Some controllers operated at thread granularity, causing subtle bugs.
- **No composition**: Hard to reason about nested limits because there is no unified accounting.
- **Notification mechanism**: `release_agent` and event files are crude and unreliable.

---

## cgroups v2 Architecture

v2 introduces a **single, unified hierarchy** mounted at `/sys/fs/cgroup` (type `cgroup2`):

```
tmpfs /sys/fs/cgroup tmpfs ...         ← v1 mounts live here (if hybrid mode)
cgroup2 /sys/fs/cgroup cgroup2 ...    ← pure v2
```

All controllers share the same tree. A process belongs to exactly one cgroup in the unified hierarchy.

### The Unified Hierarchy

```
/sys/fs/cgroup/
├── cgroup.controllers        ← available controllers on this system
├── cgroup.subtree_control    ← which controllers are active for children
├── cgroup.procs              ← PIDs in root cgroup
├── memory.current
├── cpu.stat
├── system.slice/
│   ├── cgroup.procs
│   ├── cgroup.subtree_control
│   ├── nginx.service/
│   │   ├── cgroup.procs
│   │   ├── memory.max
│   │   └── cpu.max
│   └── postgres.service/
│       ├── cgroup.procs
│       └── memory.max
└── user.slice/
    └── user-1000.slice/
        └── session-1.scope/
            └── cgroup.procs
```

### Top-Down Enablement

In v2, controllers must be explicitly enabled at each level of the tree using `cgroup.subtree_control`. Writing `+memory +cpu` to a cgroup's `cgroup.subtree_control` enables those controllers for its **children** — not for itself.

```bash
# Enable memory and cpu controllers for children of system.slice
echo "+memory +cpu" > /sys/fs/cgroup/system.slice/cgroup.subtree_control
```

If a controller is not listed in the parent's `cgroup.subtree_control`, child cgroups cannot use it. This enforces strict accountability: every resource-limited group has a clear lineage.

### No Internal Process Constraint

A v2 cgroup cannot simultaneously:

- Contain processes directly (have entries in `cgroup.procs`)
- Have controller-specific resource files active (i.e., be an intermediate node with children)

If you want to limit a group, that group must be a **leaf** or the root. This prevents the ambiguous "thread-level vs cgroup-level" accounting that plagued v1.

> **Exception**: The root cgroup is exempt — it can have both processes and subtree controls enabled.

---

## v1 vs v2: Key Differences

| Aspect                           | v1                                   | v2                                                             |
| -------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| Hierarchy                        | Multiple, per-controller             | Single unified                                                 |
| Process placement                | Per-controller, independently        | One location for all controllers                               |
| Thread granularity               | Some controllers operated per-thread | Process-level by default; opt-in thread mode                   |
| Controller enablement            | Mount-time                           | Runtime via `cgroup.subtree_control`                           |
| Memory accounting                | `memory.limit_in_bytes`, etc.        | `memory.max`, `memory.high`, `memory.min`, `memory.low`        |
| CPU scheduling                   | `cpu.shares`, `cpu.cfs_quota_us`     | `cpu.weight`, `cpu.max`                                        |
| I/O controller                   | `blkio`                              | `io` (more consistent, includes latency)                       |
| PSI (Pressure Stall Information) | Not available                        | Available via `memory.pressure`, `cpu.pressure`, `io.pressure` |
| Delegation                       | Ad hoc                               | First-class with `cgroup.delegate`                             |
| Notification                     | `cgroup.event_control`               | inotify on cgroup files                                        |

---

## The cgroup Filesystem (cgroupfs)

cgroupfs is a **pseudo-filesystem** — it exists only in kernel memory. Nothing is written to disk. It is mounted like any other filesystem:

```bash
# v2
mount -t cgroup2 none /sys/fs/cgroup

# v1 (example: memory controller)
mount -t cgroup -o memory cgroup /sys/fs/cgroup/memory
```

**Creating a cgroup** is as simple as creating a directory:

```bash
mkdir /sys/fs/cgroup/system.slice/myapp.service
```

The kernel automatically populates the new directory with all the appropriate interface files for the active controllers.

**Destroying a cgroup** requires the directory to have no processes and no children:

```bash
rmdir /sys/fs/cgroup/system.slice/myapp.service
```

You cannot `rm -rf` a cgroup directory — you must first move all processes out and remove children bottom-up.

### Interface Files

Every cgroup directory contains:

| File                     | Description                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `cgroup.procs`           | PIDs of all processes in this cgroup (one per line). Write a PID to move that process here. |
| `cgroup.threads`         | (v2) Thread IDs. Like `cgroup.procs` but for individual threads.                            |
| `cgroup.controllers`     | (v2) Controllers available at this node.                                                    |
| `cgroup.subtree_control` | (v2) Controllers enabled for children of this node.                                         |
| `cgroup.events`          | (v2) Notifications: `populated` flag (whether cgroup has live processes).                   |
| `cgroup.max.descendants` | (v2) Maximum number of descendant cgroups allowed.                                          |
| `cgroup.max.depth`       | (v2) Maximum depth below this cgroup.                                                       |
| `cgroup.stat`            | (v2) Statistics: number of dying descendants, etc.                                          |
| `notify_on_release`      | (v1) Trigger `release_agent` when cgroup becomes empty.                                     |
| `tasks`                  | (v1) Thread IDs. Deprecated in v2.                                                          |

---

## Subsystems / Controllers

### cpu Controller

Controls how much CPU time a cgroup can consume.

#### v1

**Shares (relative weight)**:

```
cpu.shares   (default: 1024)
```

Shares are **relative** — if cgroup A has 1024 shares and cgroup B has 512, A gets ~2× the CPU time when both are busy. Shares only matter when CPUs are **contended**; a cgroup with low shares can use 100% CPU if others are idle.

**CFS bandwidth control (hard limits)**:

```
cpu.cfs_period_us    (default: 100000 = 100ms)
cpu.cfs_quota_us     (default: -1 = unlimited)
```

To limit a cgroup to 50% of one CPU:

```bash
echo 100000 > cpu.cfs_period_us
echo  50000 > cpu.cfs_quota_us
```

To allow use of 2 full CPUs (200% on a multi-core system):

```bash
echo 200000 > cpu.cfs_quota_us
```

**RT scheduling** (real-time tasks):

```
cpu.rt_period_us
cpu.rt_runtime_us
```

#### v2

```
cpu.weight       (range: 1–10000, default: 100; replaces shares)
cpu.weight.nice  (maps weight to nice values for convenience)
cpu.max          FORMAT: "quota period", e.g. "50000 100000" = 50% of one CPU
cpu.stat         (accounting: usage_usec, user_usec, system_usec, etc.)
cpu.pressure     (PSI: pressure stall information)
```

```bash
# Limit to 1.5 CPUs in v2
echo "150000 100000" > /sys/fs/cgroup/myapp/cpu.max

# Set relative weight
echo 200 > /sys/fs/cgroup/myapp/cpu.weight
```

**How CFS bandwidth works internally**: The kernel uses a token-bucket mechanism. Each cgroup has a quota pool. During each scheduling period, processes in the cgroup consume tokens. When the pool is exhausted, all runnable tasks in the cgroup are throttled (put into a wait queue) until the next period begins.

---

### cpuacct Controller

(v1 only; merged into `cpu.stat` in v2)

Pure accounting — no enforcement.

```
cpuacct.usage          total CPU time in nanoseconds
cpuacct.usage_percpu   per-CPU breakdown
cpuacct.stat           user and system time in USER_HZ units
```

---

### cpuset Controller

Pins a cgroup to specific **CPUs** and **NUMA memory nodes**. Used for latency-sensitive workloads (HPC, real-time audio, database NUMA affinity).

```
cpuset.cpus          e.g. "0-3,8-11"
cpuset.mems          e.g. "0,1"
cpuset.cpu_exclusive  prevent other cgroups from using these CPUs
cpuset.mem_exclusive  prevent other cgroups from using these nodes
cpuset.sched_load_balance  enable/disable load balancing within set
```

```bash
# Pin a cgroup to CPUs 0 and 1, NUMA node 0
echo "0-1" > /sys/fs/cgroup/cpuset/realtime/cpuset.cpus
echo "0"   > /sys/fs/cgroup/cpuset/realtime/cpuset.mems
```

In v2:

```
cpuset.cpus
cpuset.mems
cpuset.cpus.effective   (actual CPUs after inheriting from parent)
cpuset.mems.effective
cpuset.cpus.partition   (root | member | isolated) — for CPU isolation domains
```

The `cpuset.cpus.partition` file in v2 allows creating isolated CPU partitions that are entirely excluded from the system scheduler domain — useful for zero-jitter RT workloads.

---

### memory Controller

The most complex and consequential controller. Tracks and limits memory usage including anonymous pages, page cache, swap, kernel memory, and tmpfs.

#### v1 Key Files

```
memory.limit_in_bytes        hard limit; OOM kill if exceeded
memory.soft_limit_in_bytes   soft limit; reclaim pressure kicks in earlier
memory.memsw.limit_in_bytes  limit for memory + swap combined
memory.usage_in_bytes        current RSS + page cache
memory.memsw.usage_in_bytes  current memory + swap
memory.failcnt               number of times limit was hit
memory.oom_control           disable/tune OOM killer
memory.swappiness            per-cgroup swap tendency (0–100)
memory.stat                  detailed breakdown (cache, rss, pgfault, etc.)
memory.kmem.limit_in_bytes   kernel memory limit (deprecated)
memory.move_charge_at_immigrate  whether to carry charges when moving tasks
```

Setting a 512 MiB hard limit in v1:

```bash
echo $((512 * 1024 * 1024)) > memory.limit_in_bytes
```

#### v2 Key Files

v2 introduces a more nuanced model with four levels:

```
memory.min    hard protection; kernel will not reclaim below this
memory.low    soft protection; reclaim only under pressure
memory.high   soft limit; throttle allocation above this (no OOM)
memory.max    hard limit; OOM kill if exceeded
memory.current         current usage
memory.swap.current    current swap usage
memory.swap.max        swap limit
memory.stat            detailed counters
memory.events          counts: low, high, max, oom, oom_kill
memory.pressure        PSI metrics
```

The four-level model allows expressing both **guarantees** (min/low) and **limits** (high/max):

```
memory.min  = "never take this memory away from me"
memory.low  = "try not to take this memory, but ok under global pressure"
memory.high = "start throttling above this, but don't OOM yet"
memory.max  = "hard ceiling; OOM at this point"
```

#### OOM Behavior

When a cgroup exceeds `memory.max` (v2) or `memory.limit_in_bytes` (v1), the kernel invokes the OOM killer. By default it selects the process with the worst `oom_score` within the cgroup and kills it. You can disable OOM killing (`memory.oom_control` in v1 / `memory.oom.group` in v2), causing processes to block on allocation instead.

In v2, `memory.oom.group = 1` causes all processes in the cgroup to be killed together when OOM is triggered — useful for containerised workloads where partial kills leave zombies.

#### Charging Model

Memory "charges" are assigned to the cgroup that first faults in a page. Anonymous memory is straightforward. Page cache is trickier — a file read by process A in cgroup X charges cgroup X, even if process B in cgroup Y also reads the same file (shared page cache pages are charged to the first accessor in v1; v2 uses a more proportional model).

---

### blkio / io Controller

#### v1 (blkio)

Controls block I/O bandwidth and IOPS for processes. Works with CFQ (legacy) and BFQ I/O schedulers.

```
blkio.weight                  default weight (10–1000)
blkio.weight_device           per-device weight override
blkio.throttle.read_bps_device    read bytes/sec limit
blkio.throttle.write_bps_device   write bytes/sec limit
blkio.throttle.read_iops_device   read IOPS limit
blkio.throttle.write_iops_device  write IOPS limit
blkio.io_service_bytes        bytes read/written per device
blkio.io_serviced             I/O operations per device
blkio.io_wait_time            time spent waiting for I/O
blkio.io_merged               number of BIOs merged
```

Device specification uses `major:minor` notation from `/proc/diskstats`:

```bash
# Limit cgroup to 10 MB/s reads on sda (8:0)
echo "8:0 10485760" > blkio.throttle.read_bps_device
```

#### v2 (io)

The `io` controller in v2 unifies weight-based (BFQ) and throttle-based controls:

```
io.weight        "default WEIGHT" or "MAJ:MIN WEIGHT"
io.max           "MAJ:MIN rbps=BYTES wbps=BYTES riops=IOPS wiops=IOPS"
io.stat          per-device: rbytes, wbytes, rios, wios, dbytes, dios
io.pressure      PSI metrics
io.latency       latency-targeting (set a target latency, kernel throttles others)
```

```bash
# v2: limit reads to 50MB/s, writes to 20MB/s on device 8:0
echo "8:0 rbps=52428800 wbps=20971520" > io.max
```

`io.latency` is a v2-only feature that allows specifying a target I/O latency for a cgroup; the kernel throttles competing cgroups to protect the latency target. This is used in production by systemd to protect interactive workloads from I/O storms caused by background jobs.

---

### net_cls and net_prio Controllers

These are v1-only; v2 does not include network controllers in the cgroup hierarchy (network namespaces + tc qdisc are used instead).

**net_cls**: Tags outgoing network packets with a class ID (`classid`). Used with `tc` (traffic control) to apply qdiscs and filters:

```bash
echo 0x10001 > net_cls.classid
# Then use tc to handle class 1:1
tc filter add dev eth0 parent 1: handle 1: cgroup
```

**net_prio**: Sets the priority of network traffic per interface:

```bash
# Set priority 5 on eth0 for this cgroup
echo "eth0 5" > net_prio.ifpriomap
```

---

### devices Controller

Controls which device nodes (character and block) processes in a cgroup can open. Uses an access control list (ACL) approach.

```
devices.allow    add allowed device rule
devices.deny     add denied device rule
devices.list     current ACL
```

Rule format: `TYPE MAJOR:MINOR ACCESS`

- TYPE: `c` (char), `b` (block), `a` (all)
- MAJOR:MINOR: device numbers or `*` wildcard
- ACCESS: `r` (read), `w` (write), `m` (mknod)

```bash
# Deny all devices, then allow only /dev/null and /dev/zero
echo "a *:* rwm" > devices.deny
echo "c 1:3 rwm" > devices.allow   # /dev/null
echo "c 1:5 rwm" > devices.allow   # /dev/zero
```

Docker uses this controller to give containers a minimal safe device list. Note: in v2, device access control moved to eBPF programs attached to `BPF_CGROUP_DEVICE`, offering more flexibility.

---

### freezer Controller

Allows suspending and resuming all processes in a cgroup atomically — equivalent to sending `SIGSTOP` to all tasks but more reliable (catches processes that block SIGSTOP, handles fork races).

```
freezer.state    write FROZEN to suspend, THAWED to resume
                 read to get current state: THAWED, FREEZING, FROZEN
```

```bash
echo FROZEN > /sys/fs/cgroup/freezer/batch/freezer.state
# ... do checkpoint, snapshot, migration ...
echo THAWED > /sys/fs/cgroup/freezer/batch/freezer.state
```

The FREEZING intermediate state indicates the kernel is in progress of freezing all tasks (some may still be running).

Used by: container live migration (CRIU), batch schedulers, checkpoint/restore systems.

In v2: `cgroup.freeze` (write `1` to freeze, `0` to thaw).

---

### pids Controller

Limits the number of processes (and threads) in a cgroup. This is a critical security control — without it, a fork bomb inside a container can exhaust the system's PID space.

```
pids.max      limit (integer or "max" for unlimited)
pids.current  current count
```

```bash
echo 100 > pids.max
```

If a process tries to fork and the limit is reached, `fork()` returns `EAGAIN`.

In v2, same interface with identical semantics. Kubernetes uses this via the `--pid-limit` flag.

---

### hugetlb Controller

Controls allocation of huge pages (2MB, 1GB pages).

```
hugetlb.2MB.limit_in_bytes
hugetlb.2MB.usage_in_bytes
hugetlb.2MB.failcnt
hugetlb.2MB.max_usage_in_bytes
```

```bash
# Limit a cgroup to 4 huge pages of 2MB = 8MB
echo $((4 * 2 * 1024 * 1024)) > hugetlb.2MB.limit_in_bytes
```

Used for database workloads (PostgreSQL, Oracle) that rely on huge pages for shared memory performance.

---

### perf_event Controller

Does not enforce limits — purely for grouping. Allows `perf` to collect performance counter data scoped to a cgroup:

```bash
perf stat -G myapp -- sleep 10
```

Enables per-cgroup profiling in production without interfering with other workloads.

---

### rdma Controller

(v2 only) Limits RDMA (Remote Direct Memory Access) resources — MR (memory regions) and HCA handles — for workloads using InfiniBand or RoCE.

```
rdma.max      "mlx5_0 hca_handle=2 hca_object=2000"
rdma.current
```

---

## Process Membership and Inheritance

When a process calls `fork()`, the child inherits the parent's cgroup membership. When a process calls `exec()`, cgroup membership does **not** change (it stays in the same cgroup).

To move a process to a different cgroup:

```bash
echo <PID> > /sys/fs/cgroup/target-cgroup/cgroup.procs
```

This requires write permission on the target `cgroup.procs` file and (in v2) the source cgroup's `cgroup.procs` as well.

### Thread-Level Granularity (v2)

By default in v2, all threads of a process must be in the same cgroup (process-level granularity). To enable per-thread placement, a cgroup must be in **threaded mode**:

```bash
echo threaded > cgroup.type
```

A threaded cgroup can be part of a **threaded subtree**, where individual threads can be assigned to different leaf cgroups. The root of a threaded subtree (a **thread-root**) does the actual resource accounting. This is used for workloads like web servers where different thread pools need different CPU priorities.

---

## Notifications and Events

### v1: cgroup.event_control

Crude mechanism: write a file descriptor and a threshold to `cgroup.event_control` and receive `poll()` notifications when the threshold is crossed.

```c
// Example: notify when memory usage crosses 100MB
int event_fd = eventfd(0, EFD_CLOEXEC);
int cgroup_fd = open("memory.usage_in_bytes", O_RDONLY);
write(event_control_fd, sprintf("%d %d %llu", event_fd, cgroup_fd, threshold));
// poll event_fd for POLLIN
```

Rarely used directly; systemd wraps it.

### v2: inotify + cgroup.events

Much cleaner. Watch `cgroup.events` with inotify:

```
populated 0   ← cgroup has no live processes
populated 1   ← cgroup has live processes
frozen 0
frozen 1
```

systemd uses `cgroup.events` to detect when a service's cgroup becomes empty (all processes exited), triggering service stop logic.

### Pressure Stall Information (PSI)

v2 introduced PSI — a metric from Meta/Facebook measuring the percentage of time tasks are stalled waiting for a resource:

```
some avg10=0.12 avg60=0.08 avg300=0.03 total=123456
full avg10=0.00 avg60=0.00 avg300=0.00 total=0
```

- `some`: at least one task is stalled
- `full`: all runnable tasks are stalled (resource fully saturated)
- `avg10/60/300`: exponential moving averages over 10s, 60s, 5min windows

PSI files: `memory.pressure`, `cpu.pressure`, `io.pressure`

You can also register threshold-based notifications on PSI files using `poll()` — the kernel wakes up the watcher when the pressure average crosses a configured threshold. This is used by `systemd-oomd` and Facebook's `oomd` daemon to preemptively kill memory-hungry cgroups before the OOM killer fires.

---

## Practical Usage: Manual cgroupfs Interaction

### Creating a cgroup v2 hierarchy manually

```bash
# Verify v2 is mounted
mount | grep cgroup2
# cgroup2 on /sys/fs/cgroup type cgroup2 (rw,nosuid,nodev,noexec,relatime,nsdelegate,memory_recursiveprot)

# Check available controllers
cat /sys/fs/cgroup/cgroup.controllers
# cpuset cpu io memory hugetlb pids rdma misc

# Enable memory and cpu for children of root
echo "+cpu +memory +pids" > /sys/fs/cgroup/cgroup.subtree_control

# Create a cgroup for a workload
mkdir /sys/fs/cgroup/myapp

# Set limits
echo "512M" > /sys/fs/cgroup/myapp/memory.max
echo "256M" > /sys/fs/cgroup/myapp/memory.high
echo "50000 100000" > /sys/fs/cgroup/myapp/cpu.max   # 50% of 1 CPU
echo "200" > /sys/fs/cgroup/myapp/pids.max

# Move current shell into the cgroup
echo $$ > /sys/fs/cgroup/myapp/cgroup.procs

# Verify
cat /proc/$$/cgroup
# 0::/myapp

# Run a process in the cgroup
# (it inherits from shell, so spawned processes land in myapp)
python3 my_workload.py &

# Check memory usage
cat /sys/fs/cgroup/myapp/memory.current

# Clean up (must move processes out first)
echo $$ > /sys/fs/cgroup/cgroup.procs
rmdir /sys/fs/cgroup/myapp
```

### Running a process in a new cgroup with cgexec (v1)

```bash
# Using libcgroup tools
cgcreate -g memory,cpu:/batch/job1
cgset -r memory.limit_in_bytes=256M batch/job1
cgset -r cpu.shares=512 batch/job1
cgexec -g memory,cpu:batch/job1 python3 workload.py
```

### Using systemd-run

The cleanest way to run a process with cgroup limits on a systemd system:

```bash
systemd-run --scope \
  -p MemoryMax=512M \
  -p CPUQuota=50% \
  -p TasksMax=100 \
  python3 workload.py
```

Under the hood, systemd-run creates a transient `.scope` unit with the specified resource properties and runs the command in it.

---

## systemd and cgroups

systemd is the primary cgroup manager on modern Linux systems. It uses cgroups pervasively:

### Slice/Unit Hierarchy

systemd models the cgroup tree as:

```
-.slice                  ← root slice (root cgroup)
├── system.slice         ← system services
│   ├── nginx.service
│   ├── postgresql.service
│   └── docker.service
├── user.slice
│   └── user-1000.slice
│       ├── session-1.scope    ← login session
│       └── user@1000.service  ← user service manager
└── machine.slice        ← VMs and containers (systemd-nspawn)
```

**Units** (`.service`, `.scope`, `.slice`) map directly to cgroups. A service unit's cgroup lives at a predictable path like `/sys/fs/cgroup/system.slice/nginx.service`.

### Resource Properties in Unit Files

```ini
[Service]
MemoryMax=1G
MemoryHigh=800M
CPUQuota=200%
CPUWeight=50
IOWeight=20
TasksMax=512
```

These translate directly to cgroup interface files when the service starts.

### Delegation

systemd supports safe delegation of cgroup subtrees:

```ini
[Service]
Delegate=yes
DelegateControllers=cpu memory pids
```

With `Delegate=yes`, systemd cedes control of the service's cgroup subtree to the service itself (typically a container runtime). Docker, Podman, and containerd rely on this to create their own sub-hierarchies without conflicting with systemd's cgroup management.

### systemd-oomd

systemd includes a userspace OOM daemon that monitors PSI metrics and proactively kills cgroups under memory pressure — before the kernel OOM killer fires. It prefers killing by:

1. Cgroups with the highest memory usage
2. Cgroups with the highest PSI `full` metric

Configuration in `/etc/systemd/oomd.conf`.

---

## cgroups in Containers

Containers are fundamentally a combination of:

- **namespaces** (isolation: PID, net, mnt, uts, ipc, user)
- **cgroups** (resource control)
- **seccomp + capabilities + LSM** (security)

### Docker

Docker uses containerd as its runtime, which uses runc to create containers. runc uses libcontainer to set up cgroups.

When you run:

```bash
docker run --memory=512m --cpus=1.5 --pids-limit=100 nginx
```

Docker translates these flags into cgroup settings:

```
/sys/fs/cgroup/system.slice/docker-<id>.scope/memory.max    = 536870912
/sys/fs/cgroup/system.slice/docker-<id>.scope/cpu.max       = 150000 100000
/sys/fs/cgroup/system.slice/docker-<id>.scope/pids.max      = 100
```

The exact path depends on the cgroup driver (`cgroupfs` driver puts them under `/sys/fs/cgroup/docker/`, while the `systemd` driver uses systemd slices). The systemd driver is strongly recommended for production as it avoids conflicts with systemd's cgroup management.

### Kubernetes

Kubernetes assigns cgroups per Pod and per container within a Pod:

```
/sys/fs/cgroup/
└── kubepods.slice/
    ├── kubepods-burstable.slice/
    │   └── kubepods-burstable-pod<uid>.slice/
    │       ├── cri-containerd-<containerID>.scope/   ← container cgroup
    │       └── cri-containerd-<containerID>.scope/
    └── kubepods-besteffort.slice/
```

QoS classes map to cgroup hierarchy:

- **Guaranteed** (requests == limits): `/kubepods.slice/kubepods-pod<uid>.slice/`
- **Burstable** (requests &lt; limits): `/kubepods.slice/kubepods-burstable.slice/...`
- **BestEffort** (no requests/limits): `/kubepods.slice/kubepods-besteffort.slice/...`

Resource requests → `cpu.weight` and `memory.min` (guarantees).
Resource limits → `cpu.max` and `memory.max` (hard caps).

#### cgroup v2 and Kubernetes

Since Kubernetes 1.25, cgroup v2 support is stable. Key differences from v1:

- Memory limits use `memory.max`; memory requests translate to `memory.min` (protection)
- CPU limits use `cpu.max`; CPU requests translate to `cpu.weight`
- Swap is now controllable via `memory.swap.max`
- PSI-based eviction becomes available

### cgroup namespaces

Introduced in kernel 4.6, a cgroup namespace virtualises the view of the cgroup hierarchy. A containerised process sees its own cgroup as the root, not the actual root. Created with `unshare(CLONE_NEWCGROUP)` or `clone()` with `CLONE_NEWCGROUP`.

```
# From inside a container with its own cgroup namespace:
cat /proc/self/cgroup
0::/         ← looks like root to the container

# From the host:
cat /proc/<container-pid>/cgroup
0::/system.slice/docker-abc123.scope    ← actual path
```

---

## Resource Accounting Internals

### Kernel Data Structures

In the kernel source (`kernel/cgroup/`), the main structures are:

- `struct cgroup`: represents a single cgroup directory; contains list of `cgroup_subsys_state` pointers, one per active controller.
- `struct cgroup_subsys_state` (CSS): per-cgroup state for one controller. Controllers embed their own state structure that contains a CSS.
- `struct css_set`: a set of CSS pointers — one per active controller — representing the unique combination of cgroups a process belongs to. Processes with identical cgroup memberships share a `css_set`.
- `struct task_struct`: the process descriptor. Contains a pointer to its `css_set`.

The indirection through `css_set` is a performance optimisation: rather than iterating all controllers on every fork, the kernel hashes `css_set`s and reuses them.

### Walking the cgroup Hierarchy

The kernel exposes a reference-counted walk of the cgroup tree via `cgroup_for_each_descendant_pre()` and related macros. Controllers register callbacks (`css_alloc`, `css_online`, `css_offline`, `css_free`) that are invoked on these walks when cgroups are created or destroyed.

### Charging Memory Pages

When a process faults in a page, `mem_cgroup_charge()` is called. It finds the process's memory cgroup, checks the limit, increments the usage counter, and if the limit would be exceeded, either reclaims memory or triggers OOM. The page is then tagged with the cgroup that charged it.

When the page is freed, `mem_cgroup_uncharge()` is called to decrement the counter. If the page is shared (page cache), the charge remains with the original charging cgroup until the page is evicted.

---

## Debugging and Observability

### /proc/<pid>/cgroup

Shows which cgroup a process belongs to:

```bash
cat /proc/1234/cgroup
# v2:
0::/system.slice/nginx.service
# v1:
12:memory:/system.slice/nginx.service
11:cpu,cpuacct:/system.slice/nginx.service
10:blkio:/system.slice/nginx.service
```

### systemctl status

```bash
systemctl status nginx
# Shows: CGroup: /system.slice/nginx.service
#                 └─1234 nginx: master process
```

### systemd-cgls

Displays the entire cgroup tree:

```bash
systemd-cgls
# Or for a subtree:
systemd-cgls /system.slice/nginx.service
```

### systemd-cgtop

Like `top` but for cgroups — shows CPU, memory, I/O, tasks per cgroup in real time:

```bash
systemd-cgtop
```

### cat /sys/fs/cgroup/.../memory.stat

Detailed memory breakdown:

```
anon 4096000
file 8192000
kernel 1024000
pgfault 12345
pgmajfault 3
inactive_anon 0
active_anon 4096000
...
```

### Checking PSI

```bash
cat /sys/fs/cgroup/system.slice/nginx.service/memory.pressure
some avg10=0.00 avg60=0.01 avg300=0.00 total=45231
full avg10=0.00 avg60=0.00 avg300=0.00 total=0
```

### bpftrace / eBPF

Trace cgroup events with BPF:

```bash
# Trace all OOM kills, show which cgroup
bpftrace -e 'tracepoint:oom:mark_victim { printf("OOM kill: pid=%d comm=%s\n", args->pid, args->comm); }'

# Trace cgroup migrations
bpftrace -e 'kprobe:cgroup_migrate { printf("migrate: pid=%d\n", ((struct task_struct*)arg1)->pid); }'
```

### cgget / cgroupsv2 tooling

```bash
# v1
cgget -g memory:/

# systemd properties
systemctl show nginx.service | grep -E '^(Memory|CPU|Tasks|IO)'
```

---

## Security Considerations

### Privilege Requirements

- Creating a cgroup: requires write on the parent directory → typically root or delegated user
- Moving a process to a cgroup: requires write on `cgroup.procs` in the target; in v2 also requires write on `cgroup.procs` in the source (to prevent privilege escalation via cgroup migration)
- Setting resource limits: requires write on the cgroup's controller files

### Delegation Safety

When delegating a cgroup subtree (e.g., to Docker or a user), the kernel in v2 enforces:

- A non-privileged process can only move processes it has `ptrace`-level authority over into a cgroup it owns
- The `nsdelegate` mount option (default on modern kernels) prevents processes in cgroup namespaces from escaping their subtree

### Namespace + cgroup Interaction

Without a cgroup namespace, a containerised process can read its actual host cgroup path from `/proc/self/cgroup`, revealing information about the host's cgroup structure. Proper container runtimes always create a cgroup namespace.

### Resource Exhaustion Attacks

Without cgroup limits, a compromised container can:

- Fork-bomb the host (`pids.max` prevents this)
- Consume all memory and trigger host OOM (`memory.max` prevents this)
- Saturate disk I/O starving other workloads (`io.max` / `blkio.throttle` prevents this)

The defence-in-depth principle: always set at minimum `pids.max`, `memory.max`, and `cpu.max` for any untrusted workload.

### eBPF-based device control (v2)

In v2, the `devices` controller was replaced by attaching eBPF programs to the `BPF_CGROUP_DEVICE` hook. This allows more complex, programmable access control logic than the simple ACL of v1. Container runtimes like containerd attach BPF programs at container creation time.

---

## Common Pitfalls

**1. OOM in containerised JVMs**  
JVMs read `/proc/meminfo` to determine heap size. Inside a container, this shows host memory, so the JVM allocates a heap larger than the cgroup limit and gets OOM-killed. Fix: use `-XX:+UseContainerSupport` (JDK 10+), which reads cgroup limits instead.

**2. Forgetting to enable controllers in v2**  
Creating a directory under a cgroup and writing limits to it does nothing if the parent hasn't enabled the controller in `cgroup.subtree_control`. Controllers must be explicitly propagated down the tree.

**3. Internal process constraint violation**  
In v2, trying to have processes in a non-leaf cgroup fails silently or errors depending on the tool. Ensure intermediate cgroups are empty of processes before creating children.

**4. Double cgroup management (systemd + runtime)**  
Running Docker with the `cgroupfs` driver alongside systemd means two separate processes manage the cgroup tree — systemd doesn't know about Docker's cgroups and vice versa. Under memory pressure, systemd may kill Docker's cgroups. Always use the `systemd` cgroup driver with Docker on systemd systems.

**5. memory.limit_in_bytes = -1 in v1**  
Writing `-1` to `memory.limit_in_bytes` should remove the limit, but on some kernel versions this silently sets it to a very large value rather than "unlimited". Read the value back to verify.

**6. CPU shares are relative, not absolute**  
`cpu.shares = 1024` doesn't mean "use up to 1 CPU." It means "relative to other cgroups, this one gets proportional share." If only one cgroup is running, it gets 100% CPU regardless of shares. Use CFS quota (`cpu.max` in v2) for hard limits.

**7. Swap accounting in v2**  
`memory.max` in v2 limits **anonymous memory + file-backed memory** but not swap by default. To limit swap use, also set `memory.swap.max`. Setting `memory.swap.max=0` disables swap for the cgroup entirely.

**8. Release agents in v1**  
The `release_agent` mechanism (runs a script when a cgroup becomes empty) is asynchronous and racy. It's been deprecated. Use `cgroup.events` in v2 with inotify instead.

---

## Summary

cgroups are the kernel's answer to the question: _"How do we share a machine among multiple workloads without them interfering with each other?"_

They evolved from a pragmatic Google solution (v1) into a coherent kernel subsystem (v2) that now underpins every major container runtime and workload scheduler in production Linux. Understanding cgroups at this level — from the cgroupfs interface files down to page charging and PSI — is essential for anyone operating containers at scale, tuning Linux performance, or building infrastructure tools.

The single most important mental shift: **a cgroup is not a wall, it's a policy**. Limits are enforced by the kernel's schedulers and allocators, not by userspace. When you write to `memory.max`, you're configuring kernel behaviour, not building a sandbox. The kernel does the actual work.

---

_Kernel version references: Linux 5.10+ (LTS), 6.x where noted. Interface files and semantics may differ slightly on older kernels. Always consult `Documentation/admin-guide/cgroup-v2.rst` in the kernel source for authoritative detail._
