---
title: 'ripgrep Cheatsheet'
description: 'A practical ripgrep reference'
date: '2026-11-03'
lang: en
category: TECH
tags: [linux, ripgrep, rg, bash, cheatsheet, text-processing]
---

ripgrep (`rg`) searches file contents recursively and filters the search space using ignore rules, hidden-file detection and binary detection. It is useful for finding code, configuration values and log records across a project, as well as for filtering a stream in the console.

This cheatsheet uses **Bash on Linux**. Examples were checked with **ripgrep 15.2.0**, including PCRE2 support. Most common options also exist in earlier releases; check `rg --help` for the installed version. Optional tools such as `jq`, `gzip`, `sed` and `find` are identified where used.

Related: [grep fundamentals and Bash recipes](/blog/grep-cheatsheet), [sed editing](/blog/sed-cheatsheet), and [AWK text processing](/blog/awk-cheatsheet).

## Quick Start

```bash
rg --version
```

```bash
rg -h              # Short option summary
# rg --help        # Full explanations
```

```bash
# Search the current directory recursively
rg -n -F 'TODO' .
```

```bash
# Search selected paths, rather than the whole working directory
rg -n 'timeout' ./src ./config
```

```bash
# Search one file
rg -n 'ERROR' app.log
```

```bash
# Filter standard input
printf 'alpha\nbeta\nalphabet\n' | rg 'alpha'
# alpha
# alphabet
```

With no explicit paths, rg normally searches the working directory when stdin is a terminal; when stdin is a pipe or redirected file, it searches that input instead. Give `.` explicitly when a directory search is intended regardless of stdin. A pattern is a regex by default; use `-F` for literal text.

Interactive output can include colors, headings and line numbers. Redirected output has different defaults. Examples below explicitly set output options where exact formatting matters and assume no custom `RIPGREP_CONFIG_PATH` configuration. Use `--no-config` to disable that configuration for a reproducible command.

### A Reusable Log Fixture

Save as `app.log`:

```text
INFO service started
WARN retry user=alice
ERROR timeout user=bob code=504
INFO user=alice request_id=req-17
ERROR disk full user=alice code=507
DEBUG healthcheck
error lowercase
```

```bash
rg -n 'ERROR' app.log
# 3:ERROR timeout user=bob code=504
# 5:ERROR disk full user=alice code=507
```

```bash
rg -i -n 'error' app.log
# Also includes 7:error lowercase
```

## Defaults That Affect Results

| Default                          | Consequence                              | Change it with                              |
| -------------------------------- | ---------------------------------------- | ------------------------------------------- |
| Recursive directory search       | No `-r` is needed                        | Pass explicit files or limit depth          |
| Case-sensitive regex             | Case and metacharacters matter           | `-i`, `-S`, `-F`                            |
| Ignore rules are respected       | Generated/vendor files may be absent     | `--no-ignore`, selective ignore flags       |
| Hidden paths are skipped         | Dotfiles are normally absent             | `--hidden`                                  |
| Binary detection is active       | NUL-containing content may be suppressed | `--binary` or `-a`, with different effects  |
| Encountered symlinks are skipped | Linked directories are not traversed     | `-L` / `--follow`                           |
| Parallel search                  | File order is not guaranteed             | `--sort path`                               |
| Human-oriented terminal output   | Output changes with the destination      | `--no-heading`, `--color never`, `-n`, `-H` |

An explicitly supplied file can bypass automatic hidden/ignore filtering. A command-line glob can override ignore decisions too. Thus `rg pattern ignored-file.txt` is not equivalent to discovering that file by recursively searching its directory. A missing result is a reason to inspect the scope, not proof that the bytes are absent everywhere.

## Common Options

| Option                          | Purpose                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `-F`                            | Fixed-string patterns instead of regex                             |
| `-i`, `-s`, `-S`                | Ignore case, force case-sensitive, smart case                      |
| `-w`, `-x`                      | Whole-word / whole-line matches                                    |
| `-e PATTERN`, `-f FILE`         | Additional OR patterns / a pattern file                            |
| `-v`                            | Select lines not matching the patterns                             |
| `-n`, `-N`                      | Enable / suppress line numbers                                     |
| `-H`, `-I`                      | Enable / suppress filename prefixes                                |
| `--no-heading`                  | Put filename prefixes on result lines instead of separate headings |
| `--column`                      | Add a 1-based byte column for the first match on a line            |
| `-o`                            | Output only matched parts                                          |
| `-c`, `--count-matches`         | Matching lines / individual matches per file                       |
| `--include-zero`                | Include files with zero counts in count output                     |
| `-l`, `--files-without-match`   | Filenames with matches / with zero matches                         |
| `--files`                       | List discoverable files without searching their contents           |
| `-g GLOB`, `--iglob GLOB`       | Include/exclude paths with a glob; second form ignores glob case   |
| `-t TYPE`, `-T TYPE`            | Include / exclude a file type                                      |
| `--hidden`, `--no-ignore`       | Change hidden-path and ignore-file filtering independently         |
| `-L`                            | Follow symlinks                                                    |
| `-m N`                          | Limit matching lines per file                                      |
| `-A N`, `-B N`, `-C N`          | After / before / surrounding context                               |
| `-U`, `--multiline-dotall`      | Permit multiline matches / let dot include newline                 |
| `-P`, `--engine auto`           | PCRE2 / automatic engine selection                                 |
| `-r TEXT`                       | Replace matches in printed output; no file editing                 |
| `--passthru`                    | Include nonmatching lines in output too                            |
| `-0`, `--null`                  | NUL after filenames in filename output                             |
| `--null-data`                   | Use NUL as the input/output record delimiter                       |
| `-z`, `--search-zip`            | Search supported compressed content via external decompressors     |
| `--json`                        | Structured search events as JSON Lines                             |
| `-q`                            | Quiet existence check                                              |
| `--line-buffered`               | Flush output promptly in a pipeline                                |
| `--debug`, `--trace`, `--stats` | Explain search decisions / extra tracing / statistics              |
| `--no-config`                   | Ignore `RIPGREP_CONFIG_PATH`                                       |

Several short flags differ from grep. In rg, **`-r` is replacement, `-L` follows links, `-I` hides filenames, and `-z` searches compressed files**. See the comparison near the end before porting a grep command.

## Literal Text, Case and Boundaries

### Literal Strings versus Regex

```bash
printf 'a.b\naXb\n' | rg -N 'a.b'
# a.b
# aXb
```

```bash
printf 'a.b\naXb\n' | rg -NF 'a.b'
# a.b
```

```bash
# Quote shell data, use -F for literal content, and -e for a leading hyphen
needle='user=alice'
rg -nF -e "$needle" -- app.log
# Lines 2, 4 and 5
```

```bash
printf '%s\n' '-Ddebug' 'normal' | rg -NF -e '-Ddebug'
# -Ddebug
```

`--` ends option parsing before paths. A path beginning with `-` can also be written as `./-notes.txt`. As with grep, the special operand `-` means stdin; `./-` refers to a file literally named `-`.

### Smart Case

```bash
# Lowercase pattern: smart case searches case-insensitively
printf 'error\nERROR\nError\n' | rg -NS 'error'
# All three lines
```

```bash
# Uppercase in the pattern makes smart case case-sensitive
printf 'error\nERROR\nError\n' | rg -NS 'Error'
# Error
```

```bash
# Explicit overrides when case behavior must not depend on the pattern
rg -ni 'ERROR' app.log
```

```bash
rg -ns 'ERROR' app.log
```

Smart case is opt-in via `-S` unless enabled in configuration. It is based on the pattern, not the contents of the files.

### Words and Whole Lines

```bash
printf 'cat\nconcatenate\ncat_1\ncat-like\n' | rg -Nw 'cat'
# cat
# cat-like
```

```bash
printf 'cat\ncat-like\n' | rg -NFx 'cat'
# cat
```

Word boundaries use Unicode-aware word semantics by default, including underscore. They do not mean “space-delimited token.” Whole-line literal matching with `-Fx` is useful for exact identifiers or line-based list membership.

## Regular Expressions and PCRE2

### Default Regex Reference

The default engine supports ERE-like syntax plus Unicode features; there is no need for a grep-style `-E` switch. In fact, **rg `-E` means encoding**, not extended regex.

| Pattern                      | Meaning                                                    |
| ---------------------------- | ---------------------------------------------------------- |
| `.` / `.*` / `.+`            | Any non-newline character / zero or more / one or more     |
| `^text`, `text$`             | Start / end of a line                                      |
| <code>ERROR&#124;WARN</code> | Alternatives                                               |
| `(ab)+`, `(?:ab)+`           | Capturing / noncapturing group                             |
| `[abc]`, `[^abc]`            | Character set / negation                                   |
| `[0-9]{3}`, `[0-9]{2,}`      | Exact / minimum repetition                                 |
| `\bword\b`                   | Word-boundary assertions                                   |
| `\d`, `\w`, `\s`             | Unicode-aware digit, word and whitespace classes           |
| `\p{Greek}`                  | Unicode property, here Greek script                        |
| `(?i)error`                  | Inline case-insensitive flag                               |
| `(?P<name>...)`              | Named capture                                              |
| `.*?`                        | Lazy repetition; especially useful with multiline matching |

```bash
printf 'req-17\nreq-001\nrequest-7\n' | rg -N '^req-[0-9]{2,3}$'
# req-17
# req-001
```

```bash
printf 'code=504\ncode=oops\n' | rg -No 'code=[0-9]+'
# code=504
```

```bash
# Default regex digit class includes non-ASCII Unicode digits
printf '123\n١٢٣\n' | rg -N '^\d+$'
# Both lines
```

```bash
printf '123\n١٢٣\n' | rg -N '^[0-9]+$'
# 123
```

The default engine does not support lookaround or backreferences. Unlike GNU grep BRE, `\+` matches a literal plus rather than activating repetition. Choose the syntax deliberately instead of copying escapes between engines. Use ASCII classes such as `[0-9]` when the input contract is ASCII; `--no-unicode` changes regex semantics more broadly and is not just a performance flag.

### Lookarounds and Backreferences with PCRE2

```bash
rg --pcre2-version
```

```bash
# Extract values without user=
rg -NoP '(?<=user=)[[:alnum:]_]+' app.log
# alice, bob, alice, alice (one per line)
```

```bash
printf 'cat cat\ncat dog\n' | rg -NP '^(\w+) \1$'
# cat cat
```

```bash
# Automatic engine choice uses PCRE2 when the pattern requires it
printf 'prefixpattern7\n' | rg -No --engine auto '(?<=prefix)pattern(?=[0-9])'
# pattern
```

PCRE2 is optional build functionality. Default-engine Unicode classes and PCRE2 classes are not interchangeable in every detail; test the actual engine for non-ASCII data. If the default engine rejects lookaround, `-P` is the relevant change, not `-E`.

## OR, AND, NOT and Pattern Files

```bash
# OR with regex alternatives
rg -n 'ERROR|WARN' app.log
```

```bash
# OR with two literal strings
rg -nF -e 'ERROR' -e 'WARN' app.log
```

```bash
# AND on one line in any order; suppress prefixes before the second search
rg -NI -F 'ERROR' app.log | rg -NF 'user=alice'
# ERROR disk full user=alice code=507
```

```bash
# NOT: discard lines containing either literal term
rg -NvF -e 'DEBUG' -e 'healthcheck' app.log
```

```bash
# PCRE2 alternative for same-line AND while preserving rg's original prefixes
rg -nP '^(?=.*ERROR)(?=.*user=alice).*$' app.log
# 5:ERROR disk full user=alice code=507
```

Repeated `-e` means OR, not AND. A two-stage text pipeline must not let filenames or line-number prefixes satisfy the second condition accidentally; `-NI` removes those prefixes from the first stage. With PCRE2, lookaheads apply to the same line unless multiline/dotall flags deliberately change that scope.

### A File of Search Terms

```bash
printf 'ERROR\nWARN\n' > terms.txt
rg -nF -f terms.txt app.log
# Lines 2, 3 and 5
```

Each pattern-file line is a pattern; comments are not interpreted. An empty file supplies no patterns, so it selects nothing. A blank pattern matches every line unless `-x` limits it to empty lines. A variable containing a newline similarly supplies multiple patterns; Bash variables cannot contain NUL bytes.

### Compare Line-Based Lists

```bash
printf 'alice\nbob\ncarol\n' > users.txt
printf 'bob\ncarol\n' > allowed.txt
rg -NFxf allowed.txt users.txt
# bob
# carol
rg -NFvxf allowed.txt users.txt
# alice
```

These commands preserve input order and duplicates from `users.txt`. They are exact line-membership filters, not sorted/deduplicated mathematical set operations.

## Ignore Rules, Hidden Paths and Missing Results

### Controlled Ignore-Rule Example

Run in a scratch directory; this creates only the `demo/` fixture:

```bash
mkdir -p demo/src demo/build
printf 'TODO source\n' > demo/src/app.txt
printf 'TODO generated\n' > demo/build/output.txt
printf 'TODO hidden\n' > demo/.settings
printf 'build/\n' > demo/.gitignore

# No Git metadata is needed for this fixture because of --no-require-git
rg --no-require-git --sort path -nF 'TODO' demo
# demo/src/app.txt:1:TODO source
```

```bash
# Add hidden paths, while retaining ignore rules
rg --no-require-git --hidden --sort path -nF 'TODO' demo
# Also finds demo/.settings; build/output.txt is still excluded
```

```bash
# Disable automatic ignore rules, but hidden paths are still excluded
rg --no-ignore --sort path -nF 'TODO' demo
# Finds build/output.txt and src/app.txt
```

```bash
# Include both ignored and hidden paths; deliberately exclude Git metadata
rg --hidden --no-ignore -g '!**/.git/**' --sort path -nF 'TODO' demo
# Finds all three TODO lines
```

By default, Git ignore rules are applied when a repository is detected. `--no-require-git` also applies them outside repositories, which is useful for source snapshots without `.git` metadata. `.ignore` and `.rgignore` are rg-aware filters independent of that Git-repository requirement.

### Ignore Sources and Overrides

| Source / flag                          | Use                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| `.gitignore`, Git exclude/global rules | VCS-related filtering when applicable                                               |
| `.ignore`                              | Ignore rules shared with compatible search tools                                    |
| `.rgignore`                            | ripgrep-specific ignore rules; takes precedence over `.ignore` and Git ignore rules |
| `--ignore-file FILE`                   | Add an explicit ignore file                                                         |
| `--no-ignore-vcs`                      | Disable VCS ignore rules while retaining dot-ignore rules                           |
| `--no-ignore-dot`                      | Disable `.ignore` / `.rgignore`; not hidden-file detection                          |
| `--no-ignore-parent`                   | Do not load ignore rules from parent directories                                    |
| `--no-ignore-global`                   | Disable global ignore sources                                                       |
| `--no-ignore`                          | Disable automatic ignore-file filtering; hidden/binary filtering remains            |
| `--hidden`                             | Add hidden paths; ignore rules still apply                                          |

Rules in more deeply nested ignore files can refine parent decisions, and `!` negates a rule. A child cannot always be re-included if its parent directory was completely excluded from traversal; keep the parent traversable when writing exceptions. Command-line `-g` filters override ignore logic. Explicitly supplied `--ignore-file` rules can still apply with `--no-ignore`; use `--no-ignore-files` when intentionally disabling those too.

### -u, -uu and -uuu

| Shorthand | ripgrep 15.2 behavior           |
| --------- | ------------------------------- |
| `-u`      | `--no-ignore`                   |
| `-uu`     | `--no-ignore --hidden`          |
| `-uuu`    | `--no-ignore --hidden --binary` |

In this version, `-uuu` enables binary **search**, not unrestricted binary-text output. To print matches from binary content as text, use `-a` explicitly. Symlink traversal still needs `-L`. Older versions have differed in the third `-u` behavior, so named flags make scripts easier to audit across installations.

### Diagnose Scope before Changing the Pattern

```bash
# List the paths that discovery would consider
rg --files --sort path ./project
```

```bash
# Compare with a wider scope
rg --files --hidden --no-ignore -g '!**/.git/**' --sort path ./project
```

```bash
# Reasons for filtering and other decisions go to stderr
rg --debug -nF 'needle' ./project > matches.txt 2> search-debug.log
# --trace provides additional detail when --debug is insufficient
```

`--files` lists candidates without reading their contents, so it does not prove they contain a match or will survive content-based binary detection. Give a known skipped file directly to isolate discovery from matching: `rg -nF 'needle' ./project/path/to/file.txt`.

## Globs, File Types and Search Scope

### Globs Are Path Filters, Not Content Regexes

```bash
# Quote globs so Bash does not expand them
rg -nF 'TODO' ./project -g '*.java' -g '*.kt'
```

```bash
# Brace alternatives are handled by rg, not Bash (quotes prevent expansion)
rg -nF 'TODO' ./project -g '*.{js,ts,svelte}'
```

```bash
# Exclude tests and generated output
rg -nF 'TODO' ./project -g '!*.test.ts' -g '!**/build/**' -g '!**/vendor/**'
```

```bash
# Search a specific subtree: passing the path is often clearest
rg -nF 'TODO' ./project/src
```

```bash
# Case-insensitive filename selection, independent of content case
rg -nF 'TODO' ./project --iglob '*.md'
```

Positive globs select candidate paths; repeated positive file globs can include several suffixes. A leading `!` excludes. If several command-line glob rules match, the later rule wins. Globs can override ignore exclusions, so adding `-g` can change more than the filename suffix filter. The `!**/build/**` form excludes build directories at any depth, including `project/build` when searching from its parent. A slash-containing pattern such as `!build/**` is path-relative and does not cover every nested build directory. Prefer an explicit subtree operand when that expresses the task directly; `-g 'src'` does not mean “all content under src.”

### Built-In and Custom File Types

```bash
# Inspect available names and their glob definitions
rg --type-list | rg '^(java|kotlin|js):'
```

```bash
rg -n -t java -F 'TODO' ./project
```

```bash
rg -n -t java -t kotlin -F 'TODO' ./project
```

```bash
rg -n -T markdown -F 'TODO' ./project
```

```bash
# A custom type for this invocation only
rg --type-add 'jvm:*.{java,kt,kts}' -t jvm -nF 'TODO' ./project
```

Type filters are filename/glob definitions, not language parsers. `-T` excludes a type; it does not mean “invert content matches.” Custom definitions disappear after the process unless repeated in configuration.

### Bound Depth and File Size

```bash
# Only direct children of project, not nested subdirectories
rg --max-depth 1 -nF 'TODO' ./project
```

```bash
# Skip large files; search statistics explain the work done
rg --max-filesize 2M --stats -nF 'TODO' ./project
```

```bash
# Follow encountered links when that scope is intentional
rg -L -nF 'TODO' ./project
```

A root directory has depth 0. Size/depth limits deliberately omit content; do not interpret a limited search as exhaustive. Following links can traverse outside the named tree or report loops/broken links.

## Output, Context and Counting

### Stable Text Output for Tools

```bash
rg --no-config --no-heading --color never -nH --sort path -F 'ERROR' app.log
# app.log:3:ERROR timeout user=bob code=504
# app.log:5:ERROR disk full user=alice code=507
```

```bash
rg --no-heading --color never -nH --column 'ERROR' app.log
# app.log:3:1:ERROR timeout user=bob code=504
# app.log:5:1:ERROR disk full user=alice code=507
```

`--column` reports byte positions, not display columns for tabs or wide Unicode characters. Filename order is not guaranteed without sorting; `--sort path` orders paths and disables parallel search. Do not split human result lines on `:` to recover filenames: filenames can contain colons/newlines. Use NUL-delimited filename output or JSON instead.

### Context around Matches

```bash
rg -n -C 1 'ERROR' app.log
```

```bash
rg -n -B 2 -A 3 'ERROR' app.log
```

```bash
seq 1 9 | rg -n -C 1 --context-separator='====' '^[26]$'
# 1-1
# 2:2
# 3-3
# ====
# 5-5
# 6:6
# 7-7
```

Context lines are prefixed differently from matches, and overlapping windows merge. `--no-context-separator` removes separators between disconnected groups. Context output includes nonmatching data, which matters when piping it into a second filter.

### Lines, Matches and Zero Counts

```bash
printf 'ERROR ERROR\nOK\nERROR\n' > counts.log
rg -c 'ERROR' counts.log
# 2
rg --count-matches 'ERROR' counts.log
# 3
rg -o 'ERROR' counts.log
# ERROR, ERROR, ERROR (one per line)
```

```bash
# Include zero counts explicitly; this still exits 1 if no match exists
rg -c --include-zero 'MISSING' counts.log
# 0
```

By default, rg omits a file with zero matches from count output. `-c` counts matching lines, whereas `--count-matches` counts individual matches. Combining `-c` with `-o` also counts matches, a difference from assuming every `-c` invocation counts lines. Counts are per file, not a grand total. `-m N` limits matching lines per file; multiline mode counts one multiline match once toward that limit.

### Filenames with and without Matches

```bash
rg -l -F 'ERROR' ./logs
```

```bash
rg --files-without-match -F 'ERROR' ./logs
```

```bash
# Keep filenames containing whitespace/newlines intact
while IFS= read -r -d '' path; do
  printf 'matched file: %q\n' "$path"
done < <(rg -l0 -F 'ERROR' ./logs)
```

`--files-without-match` means zero matches in the file; `-vl` instead finds files with at least one **nonmatching** line. These differ for mixed-content files. In rg's filename-without-match mode, printing a selected filename counts as a successful result, unlike relying on GNU grep `-L`'s status semantics. The reporting loop above does not propagate process-substitution errors; see the scripting recipe for explicit status handling.

## Multiline Text, CRLF and NUL Records

### Match across Lines

```bash
printf 'BEGIN\nalpha\nbeta\nEND\n' > block.txt

# -U allows the explicit newline in the pattern
rg -UNo 'BEGIN\nalpha' block.txt
# BEGIN
# alpha
```

```bash
# -U alone does not make dot include newline
rg -UNo --multiline-dotall 'BEGIN.*?END' block.txt
# BEGIN
# alpha
# beta
# END
```

```bash
# Inline dotall expresses the same intent
rg -UNo '(?s)BEGIN.*?END' block.txt
```

`-U` permits newline-spanning matches; `--multiline-dotall` or `(?s)` changes dot behavior. Neither is the same as merely adding context. Lazy `.*?` stops at the next suitable END marker, but does not balance nested blocks. A multiline search may need to hold a whole file in memory; use streaming logic when that is inappropriate.

### CRLF and Encoding

```bash
printf 'ERROR\r\n' > windows.log
rg --crlf -n '^ERROR$' windows.log
# Matches despite the CRLF terminator
```

```bash
# Explicit decoding for a known legacy encoding
rg --encoding windows-1252 -n 'café' legacy.txt
```

The encoding name describes the **input** file. rg's automatic encoding mode recognizes BOM-marked UTF-16; it is not a general detector for arbitrary legacy encodings. `--crlf` changes line-boundary recognition; it does not rewrite line endings. Regex Unicode behavior and file decoding are separate decisions.

### NUL-Delimited Data versus NUL-Terminated Filenames

```bash
# NUL-separated input/output records; --null-data implies text mode
printf 'alpha\0beta\0' | rg --null-data -NF 'beta' | od -An -tx1
# 62 65 74 61 00
```

```bash
# Candidate filenames with a NUL separator, not newline
rg --files -0 ./project > candidate-files.nul
```

`-0` terminates printed filenames with NUL. `--null-data` changes the record delimiter for searching content. rg `-z` is a different option entirely: compressed-file search.

## Replacement Previews and Extraction

### Replace Matches in the Printed Output

```bash
printf 'user=alice code=504\n' |
  rg -N 'user=(\w+)' -r 'account=$1'
# account=alice code=504
```

```bash
# Named group; -o prints just the transformed matched part
printf 'user=alice code=504\n' |
  rg -No 'user=(?P<name>\w+)' -r '${name}'
# alice
```

```bash
# Braces separate the group name from immediately following digits/text
printf 'PORT=3000\n' | rg -N '^(PORT=)[0-9]+$' -r '${1}8080'
# PORT=8080
```

```bash
# $$ represents a literal dollar in the replacement syntax
printf 'amount=42\n' | rg -N 'amount=([0-9]+)' -r '$$${1}'
# $42
```

Single quotes keep Bash from expanding `$1` or `${name}` before rg sees them. rg replacement references use `$1`/`${name}`, unlike sed's `\1`; `$0` refers to the full match and `$$` gives a literal dollar. There is **no in-place editing flag**: `-r` changes output only.

### Keep Unmatched Lines in a Complete Output Preview

Input `service.env`:

```text
HOST=localhost
PORT=3000
MODE=dev
```

```bash
rg --no-config --color never --no-heading -NI --passthru \
  '^(PORT=)[0-9]+$' -r '${1}8080' service.env > service.updated.env
diff -u service.env service.updated.env
# Only PORT changes; diff exits 1 when it finds a difference
```

Without `--passthru`, nonmatching lines would be omitted. Even with passthrough, rg's search status is 1 when no actual match exists, despite printing the unchanged lines. Save to a different path and handle that normal status if wrapping the transformation in a strict script. Shell redirection to the input path would truncate it before the search starts. For actual reviewed file edits, use an editor or the [sed recipes](/blog/sed-cheatsheet).

## Practical Project and Console Recipes

### Locate Configuration References and Definition Shapes

```bash
rg -nF 'DATABASE_URL' ./project --hidden -g '!**/.git/**'
```

```bash
rg -n '(^|[[:space:]])timeout[[:space:]]*=' ./project -g '*.conf'
```

```bash
# A deliberately simple function-declaration shape, not a language parser
rg -n '^\s*(export\s+)?(async\s+)?function\s+\w+' ./project -g '*.{js,ts}'
```

```bash
# Include just one otherwise ignored file by naming it explicitly
rg -nF 'timeout' ./project/build/generated.conf
```

Hidden configuration files may still be ignored by rules even with `--hidden`. Regex-shaped definitions miss language constructs that use different syntax; use a syntax-aware tool when structural accuracy is required.

### Find TODOs and Rank Repeated Values

```bash
rg --no-heading --color never -nH 'TODO|FIXME|HACK' ./project -g '!**/vendor/**'
```

```bash
# Extract user values, then count/sort with standard console tools
rg -No 'user=(\w+)' -r '$1' app.log |
  LC_ALL=C sort | uniq -c | sort -nr
# alice has count 3; bob has count 1
```

The pipeline extracts the captured value, not the `user=` key. `sort` changes order and `uniq -c` counts adjacent equal values after sorting. For filenames, do not use newline-delimited text pipelines unless the pathname contract excludes newlines.

### Live Logs

```bash
# Runs until interrupted; tail starts at newly appended records
tail -n 0 -F app.log | rg --line-buffered 'ERROR|WARN'
```

```bash
# Every intermediate filter must flush promptly too
tail -n 0 -F app.log |
  rg --line-buffered -F 'ERROR' |
  rg --line-buffered -vF 'healthcheck'
```

Line buffering controls rg's output, not whether the producing application flushes. `tail -F` is responsible for following file rotation; rg filters the stream it receives.

### Compressed Files

```bash
# Requires gzip for this .gz fixture
printf 'INFO ready\nERROR archived\n' | gzip > archive.log.gz
rg -z -nF 'ERROR' archive.log.gz
# 2:ERROR archived
```

```bash
# Or explicitly decompress into stdin
gzip -cd -- archive.log.gz | rg -nF 'ERROR'
# 2:ERROR archived
```

rg uses external decompression programs for supported compressed formats. Compressed **archives with multiple members/files** are not a general archive-filesystem search interface; extract or enumerate entries with an archive-aware tool when needed. Check decompressor failures as well as match results in scripts.

### Binary Content and Byte Offsets

```bash
printf 'header\0ERROR payload\n' > payload.bin

# Treat as text deliberately; inspect bytes rather than render binary control data
rg -a -NF 'ERROR' payload.bin | od -An -tx1
```

```bash
# Byte offset of an extracted match
printf 'xx ERROR\n' | rg -Nob 'ERROR'
# 3:ERROR
```

`--binary` allows detected binary files to be searched during traversal and may stop with a binary-match diagnostic. `-a` disables binary detection so text matches can be printed, including control bytes. Binary detection is heuristic, not a file-format decoder. A recursive search and an explicitly named binary file can therefore behave differently.

## JSON Output for Automation

Use JSON Lines instead of parsing human-oriented `path:line:column:text` output:

```bash
rg --json -F 'ERROR' app.log > matches.jsonl

# jq example for this UTF-8 fixture: one TSV record per matching line
jq -r 'select(.type == "match") |
  [.data.path.text, .data.line_number, (.data.lines.text | rtrimstr("\n"))] |
  @tsv' matches.jsonl
# app.log<TAB>3<TAB>ERROR timeout user=bob code=504
# app.log<TAB>5<TAB>ERROR disk full user=alice code=507
```

Events include `begin`, `match`, `context`, `end` and `summary`. Match events expose submatches with byte ranges, so one line can contain multiple individual matches. Non-UTF-8 paths/content use base64 `bytes` fields instead of `text`; a general consumer must handle both. The jq recipe above intentionally assumes UTF-8 text. JSON carries structure but not deterministic file ordering unless ordering is also requested.

`--json` is a search-output mode: it is incompatible with `--files`, filename-only modes and count modes. Human-output replacement/heading/color options do not redefine its schema. Use the structured event data for machine consumption.

## Reliable Bash Scripts

### Match, No Match and Error

| Status | Meaning for a normal search                                                   |
| ------ | ----------------------------------------------------------------------------- |
| 0      | A match/result was found and no error occurred, with the quiet-mode exception |
| 1      | No match/result, without an error                                             |
| 2      | Invalid regex, unreadable input or another search error                       |

`-q` can return 0 once a match is found even if an error occurred; it is not a complete scan guarantee. Output modes such as `--files` and `--files-without-match` define their own selected result, so do not assume that their status means a content match.

```bash
if rg -qF 'ERROR' app.log; then
  printf '%s\n' 'ERROR exists'
else
  status=$?
  case "$status" in
    1) printf '%s\n' 'No ERROR records' ;;
    *) printf 'Search error: %s\n' "$status" >&2 ;;
  esac
fi
```

For ordinary text files where reading all input is required, omit early-exit flags and discard output instead:

```bash
if rg -F 'ERROR' app.log > /dev/null; then
  printf '%s\n' 'Match found and scan completed'
else
  status=$?
  printf 'Scan status: %s\n' "$status"
fi
```

Capture `$?` in the `else` branch directly. With `if ! rg ...`, `$?` inside the branch is the status of the negation, not rg's original result. `--no-messages` hides some file diagnostics; it does not turn a failed read into success.

### Check a Filename Search before Using Its Results

```bash
if rg -l0 -F 'ERROR' ./logs > matched-files.nul; then
  while IFS= read -r -d '' path; do
    printf 'matched file: %q\n' "$path"
  done < matched-files.nul
else
  status=$?
  case "$status" in
    1) printf '%s\n' 'No matching files' ;;
    *) printf 'Search failed: %s\n' "$status" >&2 ;;
  esac
fi
```

Keep the filename list outside the tree being searched. `-l` can stop at the first match in each file, so this checks the filename-search operation rather than proving every byte of every selected file was read.

### pipefail and No-Match Status

```bash
(
  # A subshell keeps these diagnostic settings local
  set +e
  set +o pipefail
  printf 'INFO ready\n' | rg -F 'ERROR'
  statuses=("${PIPESTATUS[@]}")
  printf 'producer=%s rg=%s\n' "${statuses[0]}" "${statuses[1]}"
)
# producer=0 rg=1
```

A no-match status can stop a bare command under `set -e`; use `if` or explicit status handling where it is expected. With `pipefail`, a producer can receive SIGPIPE after an early consumer such as `rg -q`, `rg -m` or `head` closes the pipe, making the pipeline fail even when a match existed. Capture `PIPESTATUS` immediately, before another command overwrites it. Do not hide every failure with `|| true` when errors matter.

## Configuration and Repeatable Commands

### A Local Configuration File

Save as `ripgreprc`:

```text
# One argument per line; do not add surrounding shell quotes
--smart-case
--glob=!**/vendor/**
```

```bash
# Use this config for one command; no home-directory file is required
RIPGREP_CONFIG_PATH=./ripgreprc rg -n 'error' app.log
# Finds lowercase, uppercase and mixed-case error text
```

```bash
# Ignore the environment-specified config and state the needed case behavior
RIPGREP_CONFIG_PATH=./ripgreprc rg --no-config -ns 'ERROR' app.log
# Only the uppercase ERROR lines
```

rg reads the path from `RIPGREP_CONFIG_PATH`; it does not automatically discover a project `.ripgreprc`. Each nonempty, noncomment config line is one argument. Do not add shell quotes around arguments or expect variable expansion. Use `--option=value` or put the option and value on separate lines. CLI arguments are applied after config arguments; use `--no-config` when ambient defaults must not affect a script.

### Inspect Performance without Changing Meaning Blindly

```bash
rg --no-config --stats -nF 'TODO' ./project
```

```bash
rg --no-config -j 1 -nF 'TODO' ./project
```

```bash
rg --no-config --sort path -nF 'TODO' ./project
```

Restricting the intended scope, using literal search where appropriate, and avoiding unnecessary output usually matter more than tuning thread counts. Sorting disables parallelism. Skipping hidden/ignored/binary files can make rg search less data than a broad grep invocation; compare equivalent scopes before attributing a timing difference entirely to the engine.

## grep versus rg: Translate Intent, Not Flags

| Intent                         | GNU grep                    | ripgrep                                           |
| ------------------------------ | --------------------------- | ------------------------------------------------- |
| Search a directory recursively | `grep -r PATTERN dir`       | `rg PATTERN dir`                                  |
| Literal string                 | `grep -F TEXT file`         | `rg -F TEXT file`                                 |
| Extended-style regex           | `grep -E REGEX file`        | `rg REGEX file` (different engine/syntax details) |
| Filename without a match       | `grep -L PATTERN dir/*`     | `rg --files-without-match PATTERN dir`            |
| Follow encountered links       | `grep -R PATTERN dir`       | `rg -L PATTERN dir`                               |
| Hide filename prefixes         | `grep -h PATTERN files...`  | `rg -I PATTERN files...`                          |
| Treat binary as text           | `grep -a PATTERN file`      | `rg -a PATTERN file`                              |
| NUL-terminated filenames       | `grep -lZ PATTERN files...` | `rg -l0 PATTERN paths...`                         |
| NUL-delimited content          | `grep -z PATTERN file`      | `rg --null-data PATTERN file`                     |
| Search compressed content      | `zgrep PATTERN file.gz`     | `rg -z PATTERN file.gz`                           |
| Replace printed matches        | Use sed/AWK after grep      | `rg PATTERN -r REPLACEMENT file`                  |

GNU grep is a useful baseline for standard shell filtering; rg adds project-oriented discovery, file types, replacement output and structured results. They have different default scopes and regex engines. Use the [grep cheatsheet](/blog/grep-cheatsheet) for its own semantics rather than treating either tool as an exact flag-compatible replacement.

## Troubleshooting

| Symptom                                              | Check                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| A known file is missing                              | `--files`, `--debug`, hidden/ignore filters, explicit path                |
| `.gitignore` seems inactive in an exported directory | Repository detection; try `--no-require-git`                              |
| `--hidden` still misses an ignored file              | Hidden and ignore rules are separate; choose the intended ignore override |
| A glob behaves like a shell wildcard unexpectedly    | Quote `-g` arguments; remember globs filter paths, not contents           |
| `-E` does not enable grouping                        | rg `-E` selects encoding; default regex already supports grouping         |
| Lookbehind/backreference is rejected                 | Check PCRE2 support and use `-P` or `--engine auto`                       |
| Unicode digits match more than expected              | Use an explicit ASCII `[0-9]` contract if appropriate                     |
| `-L` follows links instead of listing nonmatches     | Use `--files-without-match`                                               |
| `-r` did not edit the file                           | Replacement affects output only; use a file-editing tool                  |
| Zero counts are absent                               | Add `--include-zero`; status can still be 1                               |
| A multiline dot misses newline                       | Combine `-U` with dotall behavior                                         |
| CRLF anchors miss expected text                      | Use `--crlf` for the input's line endings                                 |
| Script output order changes                          | Add `--sort path` when deterministic path order matters                   |
| A file list breaks on spaces/newlines                | Use `-0` plus a NUL-aware consumer                                        |
| A no-match command stops a script                    | Handle status 1 independently from status 2                               |
| Printed output contains unwanted color/headings      | Set `--color never --no-heading` and explicit prefix flags                |
| Behavior changes on another machine                  | Inspect version, config, optional PCRE2, ignore sources and decoding      |

## Resources for Further Learning

- `rg -h`, `rg --help`, and `man rg` for the installed version
- [Official ripgrep repository and installation options](https://github.com/BurntSushi/ripgrep)
- [Official user guide](https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md)
- [Official FAQ](https://github.com/BurntSushi/ripgrep/blob/master/FAQ.md)
- [Default regex syntax](https://docs.rs/regex/latest/regex/#syntax)
- [Structured JSON output](https://docs.rs/grep-printer/latest/grep_printer/struct.JSON.html)
