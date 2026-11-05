---
title: 'grep Cheatsheet'
description: 'A practical grep reference with examples'
date: '2026-11-03'
lang: en
category: TECH
tags: [linux, grep, bash, cheatsheet, text-processing]
---

grep is a fundamental console tool: it selects lines that match a pattern, making it useful both interactively and inside scripts. This cheatsheet covers literal text, regular expressions, files, standard input, directory trees and combinations with other shell tools.

Examples target **GNU grep on Linux**; GNU-specific options and PCRE examples are identified below. Bash blocks use Bash syntax. macOS/BSD grep supports many common short options, but PCRE, long options and NUL handling vary: check the local manual before reusing GNU-specific recipes.

Related references: [sed editing and Bash recipes](/blog/sed-cheatsheet), [AWK text processing](/blog/awk-cheatsheet). The [ripgrep cheatsheet](/blog/ripgrep-cheatsheet) covers project-oriented search and its different defaults.

## Basic Syntax

```text
grep [options] pattern [file...]
grep [options] -e pattern [-e another-pattern...] [--] [file...]
grep [options] -f patterns.txt [--] [file...]
```

- grep normally prints the **entire matching line**, not just the matched substring.
- With no file operands, it reads standard input. GNU recursive mode with no file operand searches the working directory.
- Matching is case-sensitive by default. A pattern is a basic regular expression unless `-F`, `-E` or `-P` selects another mode.
- Single quotes keep Bash from expanding regex characters such as `$`, `*` and backslashes. Double quotes are useful when intentionally expanding a variable.
- grep selects data; it does not edit the input files. Redirection can save its output to a separate file.

### A Small Fixture for the Examples

Save as `app.log`, without the surrounding Markdown fence:

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
grep 'ERROR' app.log
# ERROR timeout user=bob code=504
# ERROR disk full user=alice code=507
```

```bash
grep -n 'ERROR' app.log
# 3:ERROR timeout user=bob code=504
# 5:ERROR disk full user=alice code=507
```

```bash
printf 'alpha\nbeta\nalphabet\n' | grep 'alpha'
# alpha
# alphabet
```

## Basic Usage

| Command                                  | Description                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `grep 'pattern' file`                    | Select matching lines from one file                                          |
| `grep 'pattern' file1 file2`             | Search several files; normally prefix each result with its filename          |
| <code>command &#124; grep pattern</code> | Filter the command's standard output                                         |
| `grep 'pattern' *`                       | Search shell-expanded nonhidden entries; directories can produce diagnostics |
| `grep 'pattern' directory/*`             | Search nonhidden immediate entries under directory; not recursive            |
| `grep -r 'pattern' directory`            | GNU: recursively search a tree                                               |
| `grep -F 'literal.text' file`            | Treat every pattern character literally                                      |
| `grep -nH 'pattern' file`                | Show line numbers and force the filename prefix                              |

`*` is expanded by Bash **before** grep starts. It usually omits dotfiles and can include directories, option-like names and binary files. Use an explicit directory for recursive searches, or `find -type f` to select files deliberately.

## Pattern Types

| Command                        | Meaning                                                                  |
| ------------------------------ | ------------------------------------------------------------------------ |
| `grep 'exact string' file`     | A regex containing spaces; not necessarily a literal or whole-line match |
| `grep -F 'exact.string' file`  | Literal substring search, including the dot                              |
| `grep -Fx 'exact string' file` | Literal whole-line equality                                              |
| `grep -w 'word' file`          | GNU: require word boundaries around the regex match                      |
| `grep -i 'string' file`        | Ignore case according to the current locale                              |
| `grep '^start' file`           | Lines beginning with start                                               |
| `grep 'end$' file`             | Lines ending with end                                                    |
| `grep '^$' file`               | Completely empty lines                                                   |
| `grep '^[[:space:]]*$' file`   | Empty or whitespace-only lines                                           |

```bash
printf 'a.b\naXb\n' | grep 'a.b'
# a.b
# aXb
```

```bash
printf 'a.b\naXb\n' | grep -F 'a.b'
# a.b
```

```bash
printf 'cat\nconcatenate\ncat_1\ncat-like\n' | grep -w 'cat'
# cat
# cat-like
```

```bash
printf 'cat\ncat-like\n' | grep -x 'cat'
# cat
```

GNU `-w` considers letters, digits and underscore word characters. A hyphen is a boundary, but underscore is not. It is not the same as splitting on whitespace, and `-w` still interprets the pattern as regex unless `-F` is also selected. Use `-x` when the entire line must match.

## Regular Expressions

### Choose the Matching Engine

| Mode           | Use                                                                                  |
| -------------- | ------------------------------------------------------------------------------------ |
| `-G` (default) | Basic regular expressions (BRE)                                                      |
| `-E`           | Extended regular expressions (ERE); convenient grouping, repetition and alternatives |
| `-F`           | Fixed strings; no regex metacharacters                                               |
| `-P`           | GNU builds with PCRE support: Perl-compatible regex features, including lookarounds  |

### BRE and ERE Reference

| Meaning                                | BRE (default)                       | ERE (`-E`)                                        |
| -------------------------------------- | ----------------------------------- | ------------------------------------------------- |
| Any character within a line            | `.`                                 | `.`                                               |
| Zero or more repetitions               | `*`                                 | `*`                                               |
| One or more repetitions                | `\{1,\}`; GNU also `\+`             | `+`                                               |
| Optional item                          | `\{0,1\}`; GNU also `\?`            | `?`                                               |
| Exactly / at least / bounded repeats   | `\{3\}` / `\{3,\}` / `\{3,5\}`      | `{3}` / `{3,}` / `{3,5}`                          |
| Capturing group                        | `\(ab\)`                            | `(ab)`                                            |
| Alternatives                           | GNU: <code>foo&#92;&#124;bar</code> | <code>foo&#124;bar</code>                         |
| Character set                          | `[abc]`                             | `[abc]`                                           |
| Negated set                            | `[^abc]`                            | `[^abc]`                                          |
| Start / end of line                    | `^` / `$`                           | `^` / `$`                                         |
| Literal dot / dollar / opening bracket | `[.]` / `[$]` / `[[]`               | `[.]` / `[$]` / `[[]`                             |
| Literal backslash                      | `\\`                                | `\\`                                              |
| Backreference                          | `\1` through `\9`                   | Supported by GNU grep; outside portable POSIX ERE |

Use actual characters inside bracket expressions: `[]` and `[^]` are not valid examples of a character class. A backslash changes the meaning of the following character; do not blindly escape punctuation, because escaping `+`, `?` or parentheses can **activate** operators in GNU BRE.

```bash
# ERE alternatives; no backslash before the pipe
printf 'ERROR\nWARN\nINFO\n' | grep -E 'ERROR|WARN'
# ERROR
# WARN
```

```bash
# Grouping, repetition, and a fully anchored shape check
printf 'req-17\nreq-001\nrequest-7\n' | grep -E '^req-[0-9]{2,3}$'
# req-17
# req-001
```

```bash
# GNU BRE alternative and ERE backreference examples
printf 'foo\nbar\nbaz\n' | grep 'foo\|bar'
printf 'cat cat\ncat dog\n' | grep -E '^(cat) \1$'
# The second command prints cat cat
```

### Character Classes and Locale

| Class                        | Meaning                                             |
| ---------------------------- | --------------------------------------------------- |
| `[[:digit:]]`                | Decimal digit                                       |
| `[[:alpha:]]`                | Alphabetic character                                |
| `[[:alnum:]_]`               | Alphanumeric character or underscore                |
| `[[:blank:]]`                | Horizontal blank, commonly space or tab             |
| `[[:space:]]`                | Whitespace including space, tab and carriage return |
| `[[:upper:]]`, `[[:lower:]]` | Uppercase / lowercase letters                       |
| `[[:xdigit:]]`               | Hexadecimal digit                                   |

```bash
printf 'user_17\nuser-name\n123\n' | LC_ALL=C grep -E '^[[:alpha:]_][[:alnum:]_]*$'
# user_17
```

```bash
# In the C locale, the range is an ASCII digit check
printf 'code=504\ncode=oops\n' | LC_ALL=C grep -E '^code=[0-9]{3}$'
# code=504
```

Locale affects character classes, ranges, case folding and handling of invalid encodings. `LC_ALL=C` can improve throughput for byte-oriented searches, but it changes semantics for non-ASCII text. BRE/ERE do not use PCRE's `\d` or lookarounds; use `[0-9]` or a POSIX class deliberately. GNU grep PCRE's `\d` and its POSIX digit class can have different Unicode behavior depending on the pattern/PCRE version.

## Common Options

| Option                             | Description                                                         |
| ---------------------------------- | ------------------------------------------------------------------- |
| `-i`                               | Ignore case                                                         |
| `-v`                               | Select lines that do **not** match any supplied pattern             |
| `-w`                               | GNU: whole-word match                                               |
| `-x`                               | Entire line must match                                              |
| `-n`                               | Prefix input line number                                            |
| `-H`, `-h`                         | GNU: always show / suppress filename prefixes                       |
| `-c`                               | Count selected lines **per file**, not occurrences                  |
| `-l`, `-L`                         | List filenames with / without matching lines (`-L` is GNU)          |
| `-o`                               | GNU: print only nonempty matched substrings, one per output record  |
| `-m N`                             | GNU: stop after N selected lines per file                           |
| `-r`, `-R`                         | GNU: recurse; follow explicitly named links / follow all links      |
| `-E`, `-F`, `-G`, `-P`             | Choose ERE, literal, BRE or PCRE mode                               |
| `-e pattern`                       | Add a pattern; repeat for OR                                        |
| `-f file`                          | Read newline-separated patterns from a file                         |
| `-q`                               | Quiet existence check; can stop early                               |
| `-s`                               | Suppress file-access diagnostics; does not turn errors into success |
| `-A N`, `-B N`, `-C N`             | GNU: after / before / surrounding context                           |
| `--color=auto`                     | GNU: color only when output is a terminal                           |
| `--include=GLOB`, `--exclude=GLOB` | GNU: filter filenames during a search                               |
| `--exclude-dir=GLOB`               | GNU: skip matching directory names during recursion                 |
| `-I`                               | GNU: treat detected binary files as having no matches               |
| `-a`                               | GNU: treat binary-looking input as text                             |
| `-b`                               | GNU: prefix byte offsets; with `-o`, offset of each match           |
| `-Z`                               | GNU: NUL after a printed filename; useful with `-l`/`-L`            |
| `-z`                               | GNU: NUL-delimited input/output records instead of lines            |
| `--line-buffered`                  | GNU: flush output on each output line                               |
| `--label=NAME`                     | GNU: filename label for standard input, combined with `-H`          |

There is **no GNU grep `--include-dir` option**. Choose the starting directories or use `find` when searching only selected subtrees.

## Advanced Usage Examples

### OR, AND and NOT

```bash
# OR: either severity (ERE)
grep -E 'ERROR|WARN' app.log
```

```bash
# OR without regex alternation; -F makes both patterns literal
grep -F -e 'ERROR' -e 'WARN' app.log
```

```bash
# AND: both literal strings on the SAME line, in any order
# -h keeps a filename prefix from accidentally satisfying the second filter
grep -hF 'ERROR' app.log | grep -F 'user=alice'
# ERROR disk full user=alice code=507
```

```bash
# NOT: discard lines containing either excluded string
grep -Fv -e 'DEBUG' -e 'healthcheck' app.log
```

```bash
# AND + NOT
grep -hF 'ERROR' app.log | grep -Fv 'timeout'
# ERROR disk full user=alice code=507
```

Repeated `-e` patterns mean OR, not AND. For multi-file AND searches, suppress prefixes with `-h` between grep stages or process each file separately. A regex like `ERROR.*alice` requires that order; it is not an order-independent AND.

### Print Only Matching Parts

```bash
grep -oE 'code=[0-9]+' app.log
# code=504
# code=507
```

```bash
# GNU PCRE: extract values without the key
grep -oP '(?<=user=)[[:alnum:]_]+' app.log
# alice
# bob
# alice
# alice
```

```bash
# GNU PCRE: fixed-length lookbehind plus a digit lookahead
printf 'prefixpattern7\nprefixother7\n' | grep -oP '(?<=prefix)pattern(?=[0-9])'
# pattern
```

`-o` prints nonoverlapping **nonempty** matches. It does not implement replacement or captured-group output; use sed/AWK when the transformation needs those. Context options are ignored with `-o`; use a separate search when surrounding lines are needed. `-P` is optional build functionality and differs from BRE/ERE; use `grep --version` and a small sample to check the available engine.

### Count Lines versus Occurrences

```bash
printf 'ERROR ERROR\nOK\nERROR\n' > counts.log
grep -c 'ERROR' counts.log
# 2
```

```bash
grep -o 'ERROR' counts.log | wc -l
# 3
```

```bash
# Count nonmatching lines instead
grep -vc 'ERROR' counts.log
# 1
```

```bash
# Stop after two selected lines in EACH input file
grep -m 2 'ERROR' app.log
```

`-c` outputs zero when no lines are selected, but still exits 1. `grep -c pattern a b` emits separate counts; it does not calculate a grand total. `-m` limits selected input lines, not the number of `-o` results or context lines.

### Context and Group Separators

```bash
grep -A 3 'ERROR' app.log   # Three lines after each match
```

```bash
grep -B 2 'ERROR' app.log   # Two before
```

```bash
grep -C 1 'ERROR' app.log   # One on each side
```

```bash
# Line-number prefixes: ':' for matches, '-' for context
seq 1 9 | grep -n -C 1 -E '^[26]$'
# 1-1
# 2:2
# 3-3
# --
# 5-5
# 6:6
# 7-7
```

```bash
# GNU: replace or suppress separators BETWEEN nonadjacent context groups
seq 1 9 | grep -C 1 --group-separator='====' -E '^[26]$'
seq 1 9 | grep -C 1 --no-group-separator -E '^[26]$'
```

Overlapping context windows are merged rather than printing the same line twice. Context output contains nonmatching lines too, so do not feed it into another filter expecting only matches without accounting for that.

## Recursive Search and File Selection

### Search a Project Tree

```bash
# GNU: line numbers, filenames, no detected binary files
grep -rInH -F 'TODO' ./project
```

```bash
# Restrict to Python files; quote the glob so Bash does not expand it
grep -rInH --include='*.py' 'function' ./project
```

```bash
# Several filename types; repeated --include filters select either suffix
grep -rInH --include='*.java' --include='*.kt' -F 'TODO' ./project
```

```bash
# Skip generated/vendor trees and logs
grep -rInH --exclude='*.log' --exclude-dir=.git \
  --exclude-dir=node_modules --exclude-dir=build -F 'TODO' ./project
```

```bash
# More than one explicit starting subtree
grep -rInH -F 'TODO' ./project/src ./project/scripts
```

GNU grep does not automatically respect `.gitignore`; hidden files/directories are searched during recursion unless excluded. Filename filters are shell-style **globs**, not regexes. When include/exclude rules conflict, GNU grep uses the last matching rule; keep ordering deliberate. `--exclude-dir` avoids entering matching directory names; it is not a general path-glob selector.

`-r` follows symlinks explicitly supplied as operands but skips links encountered while traversing a directory. `-R` follows encountered links too and can search outside the named tree or diagnose loops. Use `-r` for ordinary source-tree searches unless following linked trees is intended.

### Search Only Selected Directories with find

```bash
# Matching regular files anywhere below configs; names are passed as arguments
find ./configs -type f -name '*.conf' -exec grep -nH -F 'timeout=' {} +
```

```bash
# Select a subtree by path, rather than inventing --include-dir
find ./project -type f -path '*/src/*' -name '*.java' \
  -exec grep -nH -F 'TODO' {} +
```

```bash
# Prune an entire subtree before selecting regular files
find ./project -type d -name vendor -prune -o \
  -type f -name '*.txt' -exec grep -nH -F 'needle' {} +
```

`find -exec ... {} +` handles spaces/newlines in filenames without shell splitting and batches arguments. grep's status 1 means no selected lines; a GNU find `-exec ... +` invocation returning nonzero can make find itself return nonzero. Account for that if a no-match batch is normal in a script.

### Search Tracked Files with Git

```bash
# Run inside a Git repository; tracked working-tree files, with Git's own rules
git grep -n -F 'TODO'
git grep -n -F 'TODO' -- '*.java' '*.kt'
```

`git grep` is a separate tool. By default it searches tracked working-tree content and does not behave like GNU grep recursively traversing all files. It is useful when repository membership is the desired scope; consult `git grep --help` for its own options.

## Practical Console Recipes

### Search a Command's Output and Standard Error

```bash
# stdout only: stderr still goes to the terminal
printf 'ready\nERROR failed\n' | grep 'ERROR'
```

```bash
# Bash: combine stderr with stdout before filtering
{ printf 'ready\n'; printf 'ERROR failed\n' >&2; } 2>&1 | grep 'ERROR'
# ERROR failed
```

`command | grep ...` filters stdout only. Bash `command 2>&1 | grep ...` or `command |& grep ...` includes stderr. The final status of a normal pipeline is the final command's status unless `pipefail` changes that (see scripting below).

### Search a Live Log and Reduce Buffering

```bash
# Runs until interrupted; tail starts with newly appended lines
tail -n 0 -F app.log | grep --line-buffered -E 'ERROR|WARN'
```

```bash
# Two live filters: keep the FIRST grep line-buffered too
tail -n 0 -F app.log |
  grep --line-buffered -F 'ERROR' |
  grep --line-buffered -Fv 'healthcheck'
```

GNU `tail -F` follows the named file across log rotations. `--line-buffered` flushes grep's output promptly; it cannot force the producing application to flush its own writes. Use `-m` or a surrounding timeout when a finite capture is intended.

### Search Compressed Logs

```bash
# zgrep is a gzip companion wrapper, not GNU grep's built-in decompression
zgrep -n 'ERROR' archive.log.gz
```

```bash
# Decompress explicitly; label stdin so output still identifies the source
# GNU grep --label works with -H
gzip -cd -- archive.log.gz | grep -nH --label=archive.log -F 'ERROR'
```

```bash
# Stream a decompressed archive through several literal filters
gzip -cd -- archive.log.gz | grep -F 'ERROR' | grep -Fv 'healthcheck'
```

Check decompressor failures as well as grep's result when scripting. A successful match alone does not prove the compressed file was read successfully to EOF.

### Search Process, History and Kernel Output

```bash
# Interactive Bash history; history output depends on that shell session
history | grep -F 'docker'
```

```bash
# Search process arguments; the bracket trick avoids matching this grep command
ps aux | grep '[j]ava'
```

```bash
# A dedicated process query is often easier when PIDs are the goal
pgrep -af 'java'
```

```bash
# Kernel output: access depends on system policy
dmesg | grep -i 'error'
```

```bash
# journalctl can provide logs, then grep filters their text
journalctl -u example.service --no-pager | grep -i 'timeout'
```

`ps aux | grep process` can include the grep process itself; `[j]ava` matches `java` without that exact spelling in grep's own argument. These are text searches, not authoritative process identity checks. `pgrep` and `journalctl` have their own filtering options and permissions; adapt the unit/process name to the system.

### Extract and Rank Frequent Values

Using the `app.log` fixture:

```bash
# GNU grep extracts fields; sed removes the fixed key; sort/uniq aggregate
grep -oE 'user=[[:alnum:]_]+' app.log |
  sed 's/^user=//' |
  LC_ALL=C sort | uniq -c | sort -nr
# Counts: alice 3, bob 1 (uniq output includes padding)
```

```bash
# Extract IPv4-shaped text from an independent sample
printf 'client=192.0.2.10 backup=198.51.100.7\n' |
  grep -oE '([0-9]{1,3}[.]){3}[0-9]{1,3}'
# 192.0.2.10
# 198.51.100.7
```

The IPv4 regex extracts a **shape**, not a validated address: octets above 255 would match, as would an address-shaped substring inside a longer token. Use a networking library or stricter validation when validity matters. Similarly, `code=[0-9]+` does not establish the semantic meaning of a status code.

### Filter Blank Lines and Full-Line Comments

Input `settings.conf`:

```text
# service settings
  # another comment

HOST=localhost
PORT=8080
```

```bash
grep -Ev '^[[:space:]]*(#|$)' settings.conf
# HOST=localhost
# PORT=8080
```

This preserves inline comments and only removes blank/full-line-comment records. It is not a parser for shell quoting, nested formats or comments embedded in strings.

### Compare Line-Based Lists with Literal Whole-Line Matching

```bash
printf 'alice\nbob\ncarol\n' > users.txt
printf 'bob\ncarol\n' > allowed.txt

# Intersection: keep user records appearing anywhere in the allowed list
grep -Fxf allowed.txt users.txt
# bob
# carol
```

```bash
# Difference: user records absent from the allowed list
grep -Fvxf allowed.txt users.txt
# alice
```

`-F` treats list entries literally and `-x` prevents substring matches. The input order and duplicate records from `users.txt` are preserved; this is not a mathematical set deduplicator. An empty pattern file has no patterns: the intersection selects nothing, and the difference selects all input records. Blank entries are patterns for empty lines when combined with `-x`.

### Maintain Search Terms in a Pattern File

```bash
printf 'ERROR\nWARN\n' > terms.txt
grep -Fn -f terms.txt app.log
# 2:WARN retry user=alice
# 3:ERROR timeout user=bob code=504
# 5:ERROR disk full user=alice code=507
```

Pattern files contain patterns, not comments: a `#` line is a search pattern too. A blank pattern matches every line unless whole-line mode narrows it to empty lines. An **empty file** means zero patterns and matches nothing. Avoid accidentally adding a blank line when generating a pattern list.

## Filenames, Binary Input and NUL Delimiters

### List Filenames, Not Matching Lines

```bash
# GNU: filenames containing ERROR, or filenames with no ERROR line
grep -rlI -F 'ERROR' ./logs
```

```bash
grep -rLI -F 'ERROR' ./logs
```

```bash
# GNU: emit matching filenames followed by NUL, then read them safely in Bash
# The loop operates on filenames, not grep's colon-prefixed result text
while IFS= read -r -d '' path; do
  printf 'matched file: %q\n' "$path"
done < <(grep -rlIZ -F 'ERROR' ./logs)
```

Use `-l` when only a filename is needed; grep can stop scanning that file after a match. `-L` lists files with no matching lines, including an empty text file. Its **exit status still reflects whether a matching line was found**, not whether it printed a filename: GNU `grep -L 'x' file` can print a filename and exit 1. Do not use `-L`'s status as a test for a nonempty filename list.

The process-substitution loop above is an interactive reporting recipe; it does not propagate the producer's status to the loop. For strict scripting, capture/check grep separately as shown below.

### Handle Option-Like Patterns and Filenames

```bash
printf '%s\n' '-Ddebug' 'normal' > build.log
grep -n -e '-Ddebug' -- build.log
# 1:-Ddebug
```

```bash
# -- ends option parsing; ./ also makes the operand unambiguous
printf 'needle\n' > ./-notes.txt
grep -n -F -e 'needle' -- ./-notes.txt
# 1:needle
```

Use `-e "$pattern"` for a variable pattern that might begin with `-`. Use `--` before filenames. The special filename `-` still means stdin even after `--`; refer to a file literally named `-` as `./-`.

### Binary-Looking Input

```bash
printf 'header\0ERROR payload\n' > payload.bin

# GNU: force text treatment; inspect the bytes rather than rendering control data
grep -a -F 'ERROR' payload.bin | od -An -tx1
```

```bash
# GNU: skip detected binary files during a recursive text search
grep -rInH -F 'ERROR' ./logs
```

GNU grep may report a binary-file match instead of printing the matching line when it detects NUL or encoding problems. `-a` changes that policy; it does not decode a file format. `-I` treats binary-looking input as nonmatching, so it is a deliberate scope restriction rather than proof that no byte sequence exists.

### -Z versus -z

| Option | Changes                                 | Typical use                                                              |
| ------ | --------------------------------------- | ------------------------------------------------------------------------ |
| `-Z`   | Terminator after a printed **filename** | `grep -lZ` to pass names to NUL-aware consumers                          |
| `-z`   | Input/output **record** delimiter       | Search NUL-delimited records; embedded newlines remain inside one record |

```bash
# Two NUL-terminated records; output the one containing beta
printf 'alpha\0beta\0' | grep -zF 'beta' | od -An -tx1
# 62 65 74 61 00 (beta followed by NUL)
```

```bash
# GNU PCRE: match ACROSS an embedded newline in one NUL-delimited record
printf 'BEGIN\nsecret\nEND\n' | grep -zPo '(?s)BEGIN.*?END' | od -An -tc
# BEGIN, newline, secret, newline, END, then NUL
```

Without `-z`, grep processes one newline-delimited record at a time. `(?s)` makes dot include newline in the PCRE example. With no NUL in the input, GNU `-z` can buffer an entire file before processing; account for memory use on large files. `-Z` alone does not enable multiline searching.

## Exit Status and Reliable Bash Scripts

### The Three Basic Outcomes

| GNU grep status | Meaning                                                     |
| --------------- | ----------------------------------------------------------- |
| 0               | At least one line selected (subject to quiet-mode behavior) |
| 1               | No selected lines; a normal search result                   |
| 2               | Error, such as unreadable input or an invalid pattern       |

Other implementations can use an error status greater than 2. GNU `-q` returns 0 once a match is selected **even if an error occurred**, so quiet mode is an existence check, not a complete validation of every input file.

```bash
# For an ordinary existence decision
if grep -qF 'ERROR' app.log; then
  printf '%s\n' 'An ERROR line exists'
else
  status=$?
  case "$status" in
    1) printf '%s\n' 'No ERROR lines' ;;
    *) printf 'Search failed: %s\n' "$status" >&2 ;;
  esac
fi
```

Do not write `if ! grep ...; then status=$?`: inside that branch `$?` is the status of the negation, not grep's original result. Capture the status directly in `else` as above.

### Scan Completely and Preserve Real Errors

```bash
# No -q/-l/-m: scan all input, suppress the selected output with redirection
if grep -F -e 'ERROR' -- app.log > /dev/null; then
  printf '%s\n' 'Match found and scan completed'
else
  status=$?
  case "$status" in
    1) printf '%s\n' 'Scan completed without a match' ;;
    *) printf 'Read/search error: %s\n' "$status" >&2 ;;
  esac
fi
```

`-s` only hides file diagnostics; it does not make a failed read successful. Match/search failure handling belongs in the script, rather than indiscriminately appending `|| true`.

### set -e, pipefail and Early Consumers

```bash
# Run in Bash; grep's normal no-match status is handled explicitly
set -o pipefail
if printf 'INFO ready\n' | grep -F 'ERROR'; then
  printf '%s\n' 'Match found'
else
  status=$?
  printf 'Pipeline status: %s\n' "$status"
fi
# Pipeline status: 1
```

A bare no-match grep under `set -e` can stop a script; placing it in an `if` condition handles the result explicitly. With `pipefail`, a producer can fail or receive SIGPIPE when a downstream `grep -q`, `grep -m` or `head` stops reading early. Therefore `producer | grep -q ...` can have a failing pipeline status even when grep found a match. To validate a complete producer stream, let grep read to EOF and redirect output rather than using an early-exit option.

For detailed Bash pipeline diagnostics, capture `PIPESTATUS` **immediately** after the pipeline; an intervening command overwrites it:

```bash
# Enable neither automatic exit nor pipefail in this standalone diagnostic example
# (the set commands affect only a subshell)
(
  set +e
  set +o pipefail
  printf 'INFO ready\n' | grep -F 'ERROR'
  statuses=("${PIPESTATUS[@]}")
  printf 'producer=%s grep=%s\n' "${statuses[0]}" "${statuses[1]}"
)
# producer=0 grep=1
```

### Variable Patterns and Empty Strings

```bash
needle='user=alice'
grep -Fn -e "$needle" -- app.log
```

Double quotes preserve spaces/globs in the shell value, `-F` disables regex syntax, and `-e` handles leading hyphens. A value containing newline supplies multiple patterns, even with `-F`; it is not one pattern spanning several lines. Bash variables cannot contain NUL. An empty pattern matches every input line, so check `[[ -n "$needle" ]]` first if an empty search should instead be an error.

### Save Matching Filenames and Check the Search First

```bash
# GNU grep + Bash; write to a separate list so grep's status is visible
# The output lives outside the searched ./logs tree
if grep -rlIZ -F 'ERROR' ./logs > matched-files.nul; then
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

`-l` is appropriate here because the result is a filename list. The script checks the search status before consuming that list; it does not claim every matching file was scanned to EOF.

## Performance Tips

- Use `-F` for literal searches; it avoids regex interpretation and is often faster, especially with many fixed patterns.
- Use `-l`, `-q` or `-m` when their early-exit behavior matches the task. Avoid collecting full output only to discard it later.
- Restrict the tree and file types before searching; excluding vendor/generated content often helps more than tuning a regex.
- Use a pattern file (`-Ff`) for many literal OR terms instead of starting grep once per term.
- Consider `LC_ALL=C` for byte-oriented data, with the locale implications explained above.
- Backreferences and complex regexes can be much more expensive than fixed strings. Start with the simplest expression matching the input contract.
- Use `--color=auto` interactively. Machine-readable pipelines should use uncolored output; ANSI control sequences change the stream being processed.
- For source-tree searches with ignore-file behavior, see the ripgrep reference below. grep itself does not read `.gitignore`.

## Common Grep Errors and Solutions

| Symptom                                              | Explanation / action                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Binary file … matches`                              | Choose `-a` for deliberate text treatment, or `-I` to skip binary-looking files                                           |
| A literal dot/star matches extra text                | Use `-F`, or escape the intended regex metacharacter                                                                      |
| `+`, parentheses or alternatives behave unexpectedly | Check BRE versus `-E`; do not copy escaping between engines                                                               |
| A pattern beginning with `-` becomes an option       | Supply it with `-e`, then use `--` before filenames                                                                       |
| Spaces/globs in a variable split or expand           | Quote `"$pattern"`; choose `-F` for literal data                                                                          |
| A directory operand produces a diagnostic            | Select recursive mode, or pass only regular files                                                                         |
| Permission denied                                    | Check which files the search must access and use an account with the intended read access; `-s` only hides the diagnostic |
| End-of-line pattern misses Windows text              | CRLF leaves a carriage return before `$`; inspect or explicitly account for it                                            |
| No results cause a script to stop                    | Status 1 means no selected lines; handle it separately from errors                                                        |
| Counts seem too small                                | `-c` counts selected lines, not each occurrence                                                                           |
| Unwanted files are searched                          | Quote include/exclude globs and remember grep does not use `.gitignore`                                                   |
| Interactive color appears inside a saved file        | Use `--color=auto` or `--color=never`, not `--color=always`                                                               |
| A huge multiline search uses much memory             | `-z` without NUL boundaries can make the whole file one record                                                            |

```bash
# Diagnose CRLF using a byte/escape view
printf 'ERROR\r\n' > windows.log
sed -n 'l' windows.log
# ERROR\r$
```

```bash
# Literal whole-line matching including an optional final carriage return
# Bash ANSI-C quoting provides an actual CR to the regex
grep -nE $'^ERROR\r?$' windows.log
# 1:ERROR followed by the original carriage return
```

```bash
# A match limit is per file, not a global output limit
grep -m 1 -H 'ERROR' app.log counts.log
```

### Colorized Output in a Pager

```bash
# Interactive terminal; less -R renders ANSI color sequences
grep --color=always -n 'ERROR' app.log | less -R
```

This is an intentional exception to using automatic/no color in pipelines: the consumer is a color-aware pager, not another text filter.

## Alternative Grep Tools

- `egrep` and `fgrep` are historical names for `grep -E` and `grep -F`. They are obsolete in GNU grep and may warn; use the explicit grep options in new scripts.
- `git grep` searches Git-managed content and is useful when tracked files define the desired scope.
- `ripgrep` (`rg`) is another console search tool, particularly useful for project trees and ignore-file-aware searches. Its defaults differ from GNU grep; check them rather than assuming a drop-in replacement.
- `ag` (The Silver Searcher) and `ack` are other code-search tools, with their own file-selection and matching behavior.

## Next: ripgrep (rg)

[**ripgrep Cheatsheet: Project Search and Practical Console Recipes**](/blog/ripgrep-cheatsheet) covers rg's defaults, ignore files, hidden/binary content, globs, replacement previews and practical comparisons with grep.

## Resources for Further Learning

- `man grep` and `info grep`
- [GNU grep manual](https://www.gnu.org/software/grep/manual/grep.html)
- [GNU grep exit status](https://www.gnu.org/software/grep/manual/html_node/Exit-Status.html)
- [GNU grep output prefixes and NUL-terminated filenames](https://www.gnu.org/software/grep/manual/html_node/Output-Line-Prefix-Control.html)
- [POSIX grep specification](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/grep.html)
