---
title: 'sed Cheatsheet'
description: 'A practical sed reference with tested examples'
date: '2026-11-03'
lang: en
category: TECH
tags: [linux, sed, bash, cheatsheet, text-processing]
---

All examples target **GNU sed on Linux** unless a recipe is explicitly described as portable or BSD/macOS-specific. Shell blocks use Bash; `sed` blocks contain scripts to save and run with `sed -f`.

Related: [AWK fundamentals](/blog/awk-cheatsheet), [advanced AWK](/blog/awk-cheatsheet-advanced).

## Execution Model: Pattern Space and Hold Space

| Concept                 | What happens                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Pattern space           | The current working buffer; initially one input line without its trailing newline                                     |
| Hold space              | A separate persistent buffer, initially empty; explicitly managed with `h/H/g/G/x`                                    |
| Cycle                   | Read a line, run applicable commands in order, then automatically print unless `-n` or a control command changes this |
| Address                 | Selects which input lines or pattern spaces a command applies to                                                      |
| Multiline pattern space | Created with commands such as `N` or `G`; it contains embedded newlines                                               |

```bash
printf 'old old\nkeep\n' | sed 's/old/new/'
# new old
# keep
```

```bash
printf 'old old\nkeep\n' | sed -n 's/old/new/p'
# new old
```

`-n` suppresses automatic printing, and the substitution's `p` flag prints only after a match. Without `-n`, `p` normally produces an additional copy. A pattern normally sees only the current buffer, not the entire file.

## Basic Syntax

```text
sed [options] 'command' file(s)
sed [options] -e 'command1' -e 'command2' file(s)
sed [options] -f script-file file(s)
```

## Common Options

| Option              | Description                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| `-e script`         | Add commands in 'script' to the set of commands to be executed                |
| `-f script-file`    | Add commands from 'script-file' to the set of commands to be executed         |
| `-n`                | Suppress automatic printing of pattern space                                  |
| `-i[suffix]`        | GNU: edit files in place; optional attached suffix makes a backup             |
| `-E` / `-r`         | Extended regular expressions; prefer `-E` across modern GNU/BSD systems       |
| `-s`                | GNU: restart numbering/ranges for each input file                             |
| `--follow-symlinks` | GNU: edit a symlink target with `-i` instead of replacing the link            |
| `-l N`              | GNU: wrapping width of the `l` command's diagnostic output                    |
| `-z`                | GNU: NUL-delimited records instead of newline-delimited lines                 |
| `-u`                | GNU: minimize input/output buffering for pipelines                            |
| `--debug`           | GNU: display parsed commands and execution trace                              |
| `--sandbox`         | GNU: reject execution and file I/O commands (`e`, `r`, `w` and related forms) |
| `--posix`           | GNU: disable GNU extensions for compatibility checks                          |

## Basic Commands

### Substitution (Most Common Use)

```text
s/pattern/replacement/[flags]
```

#### Substitution Flags

| Flag                      | Description                                                   |
| ------------------------- | ------------------------------------------------------------- |
| `g`                       | Global replacement (replace all occurrences)                  |
| `p`                       | Print the pattern space if substitution was made              |
| `3` (any positive number) | Replace that numbered occurrence only                         |
| `w file`                  | Write the result to a file if substitution was made           |
| `i` / `I`                 | GNU: case-insensitive matching                                |
| `3g`                      | GNU: replace the third and all later matches                  |
| `e`                       | GNU: execute the substituted pattern space as a shell command |
| `m` / `M`                 | GNU: multiline anchor mode; see the multiline examples        |

The `g` flag applies within each pattern space. A numbered substitution is not a line number. In GNU sed, combining a number with `g` skips earlier matches and replaces the rest; other implementations need not use the same semantics. The `e` flag executes data as code: use it only for deliberately constructed, trusted commands (examples below).

### Printing Commands

| Command | Description                                                |
| ------- | ---------------------------------------------------------- |
| `p`     | Print the current pattern space                            |
| `=`     | Print the current line number                              |
| `l`     | Print escaped/unambiguous pattern space; `$` marks the end |
| `P`     | Print only up to the first embedded newline                |
| `F`     | GNU: print the current input filename                      |

### Delete Commands

| Command | Description                                                                                                                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `d`     | Delete the pattern space; start next cycle                                                                                        |
| `D`     | Remove the first line from a multiline buffer and restart the script without reading input; if no newline exists, behave like `d` |
| `z`     | GNU: empty the pattern space; unlike `d`, continue the current cycle                                                              |

## Address Ranges

| Address           | Matches                                                                         |
| ----------------- | ------------------------------------------------------------------------------- |
| `n`               | Line number n                                                                   |
| `$`               | Last line                                                                       |
| `/pattern/`       | Lines matching pattern                                                          |
| `addr1,addr2`     | Range from addr1 to addr2                                                       |
| `addr1,+n`        | GNU: addr1 and the next n lines                                                 |
| `addr1,~n`        | GNU: from addr1 through the next following line whose number is a multiple of n |
| `first~step`      | GNU: every step-th line beginning with first                                    |
| `0,/pattern/`     | GNU: from start through the first match, including a match on line 1            |
| `address!command` | Apply command everywhere except the addressed lines/range                       |

Ranges include both endpoints. In an ordinary two-address range beginning at an input line, a regex second address is first checked on the line **after** the start match. The GNU `0,/pattern/` form is the special first-line case shown above. Thus `/start/,/end/` does not end on the same line it starts, even if that line contains both words. An unmatched end extends the range to EOF. Ranges can start again later.

```bash
seq 1 8 | sed -n '3,+2p'    # 3, 4, 5 (GNU)
seq 1 8 | sed -n '3,~4p'    # 3, 4 (GNU)
seq 1 8 | sed -n '2~3p'     # 2, 5, 8 (GNU)
printf 'foo\nfoo\n' | sed '0,/foo/s/foo/bar/' # Change only first foo (GNU)
```

## Common Patterns and Operations

### Basic Text Manipulation

```bash
# Replace first occurrence of 'old' with 'new' on each line
sed 's/old/new/' file
```

```bash
# Replace all occurrences of 'old' with 'new' on each line
sed 's/old/new/g' file
```

```bash
# Replace the 3rd occurrence of 'old' with 'new' on each line
sed 's/old/new/3' file
```

```bash
# Case-insensitive replacement
sed 's/old/new/gi' file
```

```bash
# Delete lines containing 'pattern'
sed '/pattern/d' file
```

```bash
# Delete blank lines
sed '/^$/d' file
```

```bash
# Delete leading whitespace (spaces, tabs)
sed 's/^[[:blank:]]*//' file
```

```bash
# Delete trailing whitespace
sed 's/[[:blank:]]*$//' file
```

```bash
# Remove comments (lines starting with #)
sed '/^#/d' file
```

```bash
# Delete both leading and trailing whitespace
sed 's/^[[:blank:]]*//;s/[[:blank:]]*$//' file
```

`/^$/` removes only completely empty lines. Use `/^[[:space:]]*$/d` to remove whitespace-only lines too. `[[:blank:]]` matches horizontal blanks (typically spaces/tabs); `[[:space:]]` also includes other whitespace. These classes are locale-sensitive.

### Line Operations

```bash
# Print only lines 1 to 5
sed -n '1,5p' file
```

```bash
# Print line 52
sed -n '52p' file
```

```bash
# Print from line with 'start' to line with 'end'
sed -n '/start/,/end/p' file
```

```bash
# Print every 3rd line starting from line 1
sed -n '1~3p' file
```

```bash
# Insert text before line 3
sed '3i\New text before line 3' file
```

```bash
# Append text after line 3
sed '3a\New text after line 3' file
```

```bash
# Replace the content of line 3
sed '3c\New content for line 3' file
```

```bash
# Delete lines from 3 to 7
sed '3,7d' file
```

The one-line `i\text`, `a\text`, and `c\text` forms above are GNU-friendly. For portable scripts, put a backslash and a literal newline before the text, as shown in the script-file example near the end. `i` and `a` insert text; they do not create a nonexistent addressed input line in an empty file.

### Multiple Commands

```bash
# Multiple commands with -e
sed -e 's/old/new/g' -e '/pattern/d' file
```

```bash
# Multiple commands with semicolons
sed 's/old/new/g; /pattern/d' file
```

```bash
# Using a command script from a file
sed -f commands.sed file
```

### Working with Multiple Files

```bash
# Edit file in-place without backup
sed -i 's/old/new/g' file
```

```bash
# Edit file in-place with backup extension .bak
sed -i.bak 's/old/new/g' file
```

```bash
# Process multiple files
sed 's/old/new/g' file1 file2 file3
```

## Advanced Commands and Techniques

### Hold Space Operations

| Command | Description                           |
| ------- | ------------------------------------- |
| `h`     | Copy pattern space to hold space      |
| `H`     | Append pattern space to hold space    |
| `g`     | Copy hold space to pattern space      |
| `G`     | Append hold space to pattern space    |
| `x`     | Exchange pattern space and hold space |

### Flow Control

| Command      | Description                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `n`          | Print pattern space if auto-print is enabled, then read the next line                                 |
| `N`          | Append the next input line to pattern space with an embedded newline                                  |
| `b label`    | Branch to label; if label is omitted, branch to end of script                                         |
| `t label`    | Branch after a successful substitution since the last input read or `t`/`T` test; reset the test flag |
| `T label`    | GNU: branch when there has been no such successful substitution                                       |
| `q`          | Quit; automatically print current buffer unless `-n`                                                  |
| `Q`          | GNU: quit without printing current buffer                                                             |
| `q N`, `Q N` | GNU: quit with exit status N                                                                          |
| `:label`     | Specify the location of label for `b` and `t` commands                                                |

### Examples Using the Hold Space

```bash
# Reverse the order of lines
sed -n '1!G;h;$p' file
```

```bash
# Duplicate each line
sed 'p' file
```

```bash
# Double-space a file
sed 'G' file
```

```bash
# Triple-space a file
sed 'G;G' file
```

```bash
# Print matching line AND the next line; consumed context is not re-tested
sed -n '/pattern/{p;n;p}' file
```

```bash
# Join pairs of lines
sed '$!N;s/\n/ /' file
```

```bash
# Add line numbers to a file
sed = file | sed 'N;s/\n/\t/'
```

The guarded pair join preserves an odd final line. Reversing via hold space stores the whole file and repeatedly copies it; `tac` is often more efficient for large files. The next section explains how `N/P/D` form a sliding window.

### Multi-line Processing

```bash
# Replace a pattern that spans multiple lines
sed ':a;$!{N;ba};s/pattern\n[^\n]*another/replacement/g' file
```

```bash
# Delete a block of text between two patterns
sed '/start/,/end/d' file
```

```bash
# Print paragraphs containing 'pattern'
sed -n '/./{H;$!d;};x;/pattern/{s/^\n//;p;}' file
```

The whole-file loop guards `N` at EOF so a one-line input still reaches the replacement. It holds the entire file in memory. The paragraph recipe treats empty lines as separators, prints matching paragraphs without the accumulator's leading blank line, and handles a final paragraph without a blank separator.

### Using Regular Expressions

```bash
# Using basic regular expressions
sed 's/[0-9]\{3\}/number/g' file
```

```bash
# Using extended regular expressions
sed -E 's/[0-9]{3}/number/g' file
```

```bash
# GNU word operators: replace words starting with pre
sed -E 's/\bpre\w+/WORD/g' file
```

```bash
# GNU word boundaries: replace whole words only
sed -E 's/\bword\b/WORD/g' file
```

```bash
# GNU NUL-delimited mode: with no NUL bytes, the entire file is one record
# Dot can then match the embedded newlines (without M mode)
sed -z 's/pattern.*/replacement/' file
```

```bash
# Capture groups
sed -E 's/(prefix)-(suffix)/\1_\2/' file
```

## Special Characters and Escaping

### Pattern Characters: BRE versus ERE

Single-quoted shell arguments below pass backslashes directly to sed. Do not add another shell escaping layer unless using double quotes.

| Meaning                              | BRE (default)                       | ERE (`-E`)                                   |
| ------------------------------------ | ----------------------------------- | -------------------------------------------- |
| Any character                        | `.`                                 | `.`                                          |
| Start / end of pattern space         | `^` / `$`                           | `^` / `$`                                    |
| Zero or more                         | `*`                                 | `*`                                          |
| One or more                          | `\{1,\}` (portable); `\+` (GNU)     | `+`                                          |
| Optional                             | `\{0,1\}` (portable); `\?` (GNU)    | `?`                                          |
| Exactly / at least / bounded repeats | `\{3\}` / `\{3,\}` / `\{3,5\}`      | `{3}` / `{3,}` / `{3,5}`                     |
| Capturing group                      | `\(text\)`                          | `(text)`                                     |
| Alternative                          | GNU: <code>foo&#92;&#124;bar</code> | <code>foo&#124;bar</code>                    |
| Backreference to captured group      | `\1` through `\9`                   | `\1` through `\9` (supported by GNU/BSD sed) |
| Character class / negation           | `[abc]` / `[^abc]`                  | `[abc]` / `[^abc]`                           |
| Literal dot, star, bracket           | `[.]` / `[*]` / `[[]`               | `[.]` / `[*]` / `[[]`                        |
| Literal parentheses                  | `()`                                | `\(\)`                                       |
| Literal backslash                    | `\\`                                | `\\`                                         |

`&` is ordinary in the **pattern**, but special in the **replacement**. `\n` is a newline escape, not a numbered backreference. A normal line cycle removes the record's trailing newline, so `\n` can match only an embedded newline introduced by multiline processing (or present inside a NUL-delimited record).

### Replacement Special Characters

| Syntax              | Meaning                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `&`                 | Entire matched text                                                                                               |
| `\1`, `\2`, …, `\9` | Captured group, with the same numbering in BRE and ERE                                                            |
| `\&`                | Literal ampersand                                                                                                 |
| `\\`                | Literal backslash                                                                                                 |
| `\/`                | Literal `/` when `/` is the command delimiter                                                                     |
| `\n`, `\t`          | GNU replacement escapes for newline and tab; use a backslash plus literal newline for a portable inserted newline |
| `\L`, `\U`, `\E`    | GNU: lowercase/uppercase following text; stop case conversion                                                     |
| `\l`, `\u`          | GNU: lowercase/uppercase next character                                                                           |

```bash
printf 'price=12\n' | sed 's/[0-9][0-9]*/[&]/'
# price=[12]
printf 'alice:admin\n' | sed -E 's/^([^:]+):(.+)$/user=\1 role=\2/'
# user=alice role=admin
printf 'A&B\n' | sed 's/A\&B/C\&D/'
# C&D
printf '/srv/old/app\n' | sed 's|/srv/old/|/srv/new/|'
# /srv/new/app
printf 'Alice SMITH\n' | sed -E 's/^([^ ]+) (.*)$/\L\1\E \L\2/'
# alice smith (GNU)
```

A different delimiter avoids escaping path slashes, but that delimiter still needs escaping when it occurs in the regex or replacement. Use `[$]` for a literal dollar sign, `\^` for a literal caret, and `[[]` for a literal opening bracket. `[^]` is not a valid example of a negated character class. For example, `sed 's/[$]/USD/g'` replaces literal dollar signs.

## Platform-specific Notes

### GNU sed vs BSD sed (macOS)

- GNU sed (Linux) accepts `-i` without a suffix; an attached suffix such as `-i.bak` creates a backup
- BSD sed (macOS) takes a suffix argument with `-i`, even if empty: `-i ''`
- GNU sed has more extensions (e.g., `-z` for null data processing)
- Use `gsed` on macOS after installing GNU sed via Homebrew

`-i` is not a POSIX option. GNU-specific recipes using `-z`, `-s`, `T`, `Q`, `z`, `R`, `W`, `F`, case-conversion escapes, `e`, or GNU regex operators should be run with `gsed` on macOS unless the local manual explicitly confirms support. Modern GNU/BSD sed both support `-E`; escape conventions and optional command arguments still vary.

### Common Tricks for Cross-platform Compatibility

```bash
# Bash: branch for the system sed commonly supplied by Linux/macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' 's/old/new/g' file  # macOS
else
  sed -i 's/old/new/g' file     # Linux/GNU
fi
```

```bash
# Or use separate extension everywhere
sed -i.bak 's/old/new/g' file
```

## Tips and Tricks

### Performance Considerations

- Sed streams ordinary line-by-line edits with small buffers; whole-file or reverse-order recipes require much more memory. Compare `awk`, `tac`, or other tools when the task fits them better.
- Use `-E` for readable patterns; it is not inherently faster.
- GNU `-s` restarts numbering/ranges per file; `-i` implies separate-file processing.
- Addresses can avoid unnecessary substitutions. Use `q` after a known final line when later input is not needed.

### Debugging sed Scripts

```bash
# Show what sed is doing
sed --debug 's/old/new/g' file  # GNU sed only
```

```bash
# Print the pattern space at each step
sed -n 'l' file
```

```bash
# Inspect the literal script, and use Bash xtrace when diagnosing expansion
printf '%s\n' 's/old/new/g'
# Enable temporarily around the command being diagnosed: set -x; ...; set +x
```

### Creative Uses

The following newline and escape recipes use GNU sed. The CRLF conversion assumes line-oriented text; appending `\r` directly to existing CRLF input would double the carriage return. See the idempotent normalization recipe below.

```bash
# Convert Windows/DOS newlines to Unix
sed 's/\r$//' file
```

```bash
# Convert Unix newlines to Windows/DOS
sed 's/$/\r/' file
```

```bash
# Extract trailing hash bars: each input line must end with at least one #
sed -nE 's/^(.*[^#])?(#+)$/\2/p' file | sed 's/^/|/'
```

```bash
# Remove ANSI SGR color/style sequences (GNU escapes; not every ANSI sequence)
sed 's/\x1b\[[0-9;]*m//g' file
```

```bash
# Caesar cipher (rotate by 13)
sed 'y/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ/nopqrstuvwxyzabcdefghijklmNOPQRSTUVWXYZABCDEFGHIJKLM/' file
```

## Common One-liners

```bash
# Insert line numbers
sed = file | sed 'N;s/\n/\t/'
```

```bash
# Double-space a file
sed G file
```

```bash
# Delete trailing whitespace
sed 's/[[:blank:]]*$//' file
```

```bash
# Insert 5 blank lines before line 23 (hold space is initially empty here)
sed '23{x;p;p;p;p;p;x}' file
```

```bash
# Reverse order of lines (GNU sed)
sed '1!G;h;$!d' file
```

```bash
# Center each line in 80 columns: Bash, printf, wc and sed
# ASCII/byte-width text; long lines are preserved without padding
while IFS= read -r line || [[ -n "$line" ]]; do
  bytes=$(LC_ALL=C printf '%s' "$line" | wc -c)
  padding=$(( (80 - bytes) / 2 ))
  (( padding > 0 )) || padding=0
  printf '%*s%s\n' "$padding" '' "$line"
done < file | sed 's/[[:blank:]]*$//'
```

```bash
# Find duplicate lines globally: sort + count + sed formatting
# sed retains counts > 1; blank lines are valid data too
LC_ALL=C sort file | uniq -c | sed -n '/^[[:blank:]]*1[[:blank:]]/!{s/^[[:blank:]]*//;p;}'
```

```bash
```

## Example sed Script (save as commands.sed)

```sed
# Remove comments and blank lines
/^#/d
/^$/d

# Replace 'foo' with 'bar'
s/foo/bar/g

# Insert a line before any line containing 'INSERT_POINT'
/INSERT_POINT/i\
This line will be inserted before the INSERT_POINT line

# Append a line after any line containing 'APPEND_POINT'
/APPEND_POINT/a\
This line will be appended after the APPEND_POINT line

# Replace any line containing 'REPLACE_ME' completely
/REPLACE_ME/c\
This line replaces the entire line containing REPLACE_ME

# Explicit output for IMPORTANT lines; do not combine with default printing
/IMPORTANT/p
```

Run `sed -n -f commands.sed file` to print only the selected `IMPORTANT` lines plus text explicitly emitted by `i`/`a`/`c`. Those commands emit their own text even with `-n`. With normal auto-printing, the final `/IMPORTANT/p` would duplicate matching lines; remove it when the intent is to print the entire edited stream.

## Practical Recipes: Input, Command and Result

### Update a Configuration Value and Keep Its Formatting

Create `service.env`:

```text
# PORT=3000
PORT = 3000  # local service
HOST=localhost
```

```bash
sed -E 's/^([[:blank:]]*PORT[[:blank:]]*=[[:blank:]]*)[0-9]+([[:blank:]]*(#.*)?)$/\18080\2/' service.env
```

Output:

```text
# PORT=3000
PORT = 8080  # local service
HOST=localhost
```

The anchored expression ignores the commented key, preserves spacing and the optional trailing comment, and requires a numeric value. `\1` is the first group; `8080` is literal replacement text. This is a recipe for this line-based format, not an interpreter for arbitrary shell assignments.

Preview first, then make the same edit with a backup:

```bash
sed -E -i.bak 's/^([[:blank:]]*PORT[[:blank:]]*=[[:blank:]]*)[0-9]+([[:blank:]]*(#.*)?)$/\18080\2/' service.env
diff -u service.env.bak service.env
# diff exits 1 when it finds changes; that is expected here
```

### Change a Key Only in One INI Section

Input `app.ini`:

```ini
[server]
port=3000
host=localhost
[metrics]
port=9090
```

```bash
sed '/^\[server\]$/,/^\[/{s/^[[:blank:]]*port[[:blank:]]*=.*/port=8080/;}' app.ini
```

Only the server port becomes `8080`; the metrics port stays `9090`. The range includes the following section header, but the anchored key substitution does not match that header. This recipe assumes exact, unindented section headers and intentionally replaces the whole matching value line, including any inline comment. Repeated `[server]` sections are all processed.

### Insert a Missing Key: Bash + grep + sed

Input `settings.env` contains simple `KEY=value` lines, with at most one active `TIMEOUT` key. A readable file and valid existing syntax are assumed.

```bash
if grep -q '^TIMEOUT=' settings.env; then
  sed -i.bak 's/^TIMEOUT=.*/TIMEOUT=30/' settings.env
else
  # GNU sed: append after the last input line
  # An empty input file has no last line, so handle that case in Bash
  if [[ -s settings.env ]]; then
    sed -i.bak '$a\TIMEOUT=30' settings.env
  else
    cp -- settings.env settings.env.bak
    printf '%s\n' 'TIMEOUT=30' > settings.env
  fi
fi
```

Existing keys are updated; missing keys are appended once. The `grep` check decides which edit to perform, and sed handles the textual update. GNU sed's `a` command supplies a separating newline even if the original final line had none.

### Extract or Replace a Marked Block

Input `report.txt`:

```text
before
BEGIN
alpha
beta
END
after
```

```bash
# Include delimiters
sed -n '/^BEGIN$/,/^END$/p' report.txt
```

```bash
# Exclude delimiters; output is alpha then beta
sed -n '/^BEGIN$/,/^END$/{/^BEGIN$/d; /^END$/d; p;}' report.txt
```

```bash
# Replace the whole block, including its markers (portable c syntax)
sed '/^BEGIN$/,/^END$/c\
REDACTED' report.txt
# before
# REDACTED
# after
```

These ranges are flat: they do not balance nested markers. If `END` is missing, the range extends to EOF. Use a parser or an explicit state machine when nesting is part of the input format.

### Keep Context before a Match: Hold Space in Practice

```bash
printf 'request A\nERROR timeout\nrequest B\nOK\n' |
  sed -n '/ERROR/{x;p;x;p;};h'
# request A
# ERROR timeout
```

At the end of each cycle `h` remembers the current line. On a match, `x;p;x;p` prints the saved previous line, restores the match, and prints it. A match on the very first line prints an empty previous buffer; omit that blank by guarding the first `p` with a nonempty test if needed. Consecutive errors can print overlapping context.

### Branch, Repeat or Fall Back with b, t and T

```bash
# Repeat until no adjacent commas remain; t branches only after a substitution
printf 'a,,,,b,,c\n' | sed ':again; s/,,/,/g; t again'
# a,b,c
```

```bash
# If the key conversion succeeds, skip the fallback prefix
printf 'name=alice\nunstructured\n' |
  sed -E 's/^name=(.*)$/user=\1/; t done; s/^/unparsed: /; :done'
# user=alice
# unparsed: unstructured
```

```bash
# GNU T takes the failure branch; b jumps unconditionally
printf 'id=42\nid=oops\n' |
  sed -E 's/^id=([0-9]+)$/ID:\1/; T unchanged; b done; :unchanged; s/^/INVALID: /; :done'
# ID:42
# INVALID: id=oops
```

A `t`/`T` test resets the substitution-success flag. A successful substitution counts even if its replacement text is identical to the match, so a loop such as `:a;s/x/x/;ta` does not terminate on a line containing `x`. Always make a repeating transformation progress toward a stopping condition.

### Remove Adjacent Duplicates with a Sliding Window

```bash
printf 'a\na\na\nb\nb\nc\n' | sed '$!N; /^\(.*\)\n\1$/!P; D'
# a
# b
# c
```

`N` makes a two-line window, `P` emits its first line only when the pair differs, and `D` slides the window by one line. The final guard preserves a single trailing line. This removes **adjacent** duplicates only; it also handles empty input and repeated blank lines.

For duplicate counts across the entire file:

```bash
printf 'pear\napple\npear\napple\napple\nkiwi\n' |
  LC_ALL=C sort | uniq -c |
  sed -n '/^[[:blank:]]*1[[:blank:]]/!{s/^[[:blank:]]*//;p;}'
# 3 apple
# 2 pear
```

Here `sort` groups equal lines, `uniq -c` counts them, and sed filters/formats the counts. Sorting changes the original order. `LC_ALL=C` makes grouping byte-oriented; text containing NUL requires a consistently NUL-aware pipeline instead.

### Redact Tokens in Line-Based Logs

```bash
printf 'user=alice token=abc123 status=200\nuser=bob token=qwerty status=403\n' |
  sed -E 's/(token=)[^[:space:]]+/\1[REDACTED]/g'
# user=alice token=[REDACTED] status=200
# user=bob token=[REDACTED] status=403
```

The token contract here is `token=` followed by a nonempty whitespace-free value. Values with spaces, JSON escaping or other syntax need a pattern/parser suited to that format. Use a fixed replacement rather than interpreting log data with the `e` flag.

### Extract Structured Fields from a Known Log Format

```bash
printf '2026-11-03 INFO user=alice duration=42ms\n2026-11-03 DEBUG heartbeat\n' |
  sed -nE 's/^([0-9]{4}-[0-9]{2}-[0-9]{2}) (INFO|WARN|ERROR) user=([^ ]+) duration=([0-9]+)ms$/\1,\2,\3,\4/p'
# 2026-11-03,INFO,alice,42
```

`-n` plus `s///p` both extracts matching fields and drops unrelated lines. The date expression checks shape, not calendar validity. This output is safe as simple comma-delimited text only under the shown field restrictions.

### Turn Simple Markdown Links into Plain Text

```bash
printf 'Read [GNU sed](https://www.gnu.org/software/sed/) today.\n' |
  sed -E 's/\[([^]]+)\]\((https?:\/\/[^)]+)\)/\1 <\2>/g'
# Read GNU sed <https://www.gnu.org/software/sed/> today.
```

This handles simple inline links without nested brackets, parenthesized URLs, escapes or optional titles. It is a targeted text transformation, not a full Markdown parser.

### Normalize BOM, CRLF and Horizontal Whitespace

```bash
# GNU sed: remove a UTF-8 BOM only at the beginning, CR at line end, and trailing blanks
LC_ALL=C sed '1s/^\xEF\xBB\xBF//;s/\r$//;s/[[:blank:]]*$//' windows.txt
```

```bash
# Idempotent CRLF output: strip one existing CR before appending one
sed 's/\r$//;s/$/\r/' file > windows-output.txt
```

```bash
# Replace each tab with four spaces (does not align actual tab stops)
sed 's/\t/    /g' file
```

```bash
# Collapse every run of empty lines to one; GNU sed EOF behavior
sed '/^$/{N;/^\n$/D;}' file
```

Use `sed -n 'l'` to inspect carriage returns/tabs and `od -An -tx1` when checking exact output bytes. For tab-stop-aware expansion, combine `expand -t 4 file` with subsequent sed transformations instead of replacing every tab with a fixed number of spaces.

### Join Backslash-Continued Lines

Input `continued.txt`:

```text
command \
  --flag \
  value
standalone
```

```bash
sed ':join; /\\$/{ $!{s/\\$//; N; s/\n[[:blank:]]*/ /; b join;};}' continued.txt
# command  --flag  value
# standalone
```

This assumes a final backslash marks continuation and keeps preceding spaces, so the sample retains more than one space between words. A backslash on the last input line is preserved. This does not implement shell quoting rules; it joins a known continuation convention.

### Multiline Anchors: GNU M Mode

```bash
printf 'alpha\nbeta\n' | sed -z 's/^/> /gM'
# > alpha
# > beta
# >  (the final newline creates an empty line start; no final newline follows this marker)
```

```bash
# Same idea without a trailing newline in the input
printf 'alpha\nbeta' | sed -z 's/^/> /gM'
# > alpha
# > beta  (no final newline added)
```

```bash
# A dot matches embedded newline by default, but not with M
printf 'a\nb' | sed -z 's/a.b/X/'    # X
printf 'a\nb' | sed -z 's/a.b/X/M'   # a then b, unchanged
```

`M` makes `^`/`$` recognize boundaries inside the pattern space and prevents `.` from matching a newline. `-z` changes the input record delimiter; it does not itself mean multiline-anchor mode. On a newline-only file without NUL, `-z` buffers the whole input and can consume substantial memory.

## Additional Commands: Files, Transformations and Exit Status

| Command                 | Purpose                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| `y/source/destination/` | Transliterate characters one-to-one; sets must have equal length              |
| `r filename`            | Queue the whole file for output after the current line                        |
| `R filename`            | GNU: queue one next line from a file each time the command runs               |
| `w filename`            | Write the current pattern space to a file                                     |
| `W filename`            | GNU: write only the first line of the pattern space                           |
| `e command`             | GNU: execute a fixed shell command; without an argument execute pattern space |
| `v 4.0`                 | GNU: require GNU extensions and at least the specified version                |

`r`/`R` output is not inserted into pattern space, so later substitutions in the same cycle do not transform it. File arguments for `r`/`w` normally extend to the script's newline; use a separate `-e` or a literal newline rather than appending `; another-command` to the filename.

### Insert a File after a Marker

Create `template.txt` and `fragment.txt`:

```text
# template.txt
header
INCLUDE
footer
```

```text
# fragment.txt
first inserted line
second inserted line
```

The `# filename` labels above explain the fixtures; leave them out of the actual files.

```bash
sed '/^INCLUDE$/r fragment.txt' template.txt
# header
# INCLUDE
# first inserted line
# second inserted line
# footer
```

```bash
# Read the fragment, then remove the marker from normal output
sed -e '/^INCLUDE$/r fragment.txt' -e '/^INCLUDE$/d' template.txt
# header
# first inserted line
# second inserted line
# footer
```

GNU sed silently ignores a file it cannot open with `r`/`R`; check readability in the surrounding shell when missing fragments must be an error.

### Interleave Lines from Another File (GNU R)

```bash
printf 'A\nB\nC\n' > letters.txt
printf '1\n2\n' > digits.txt
sed 'R digits.txt' letters.txt
# A
# 1
# B
# 2
# C
```

Once the auxiliary file reaches EOF, `R` adds no more lines. GNU `-s` rewinds `R` files between main input files.

### Split Matching Records into a Separate File

```bash
printf 'INFO ready\nERROR failed\nWARN retry\nERROR timeout\n' > app.log
sed -n '/^ERROR/w errors.log' app.log
# stdout: empty
# errors.log contains the two ERROR lines
```

```bash
# Match + duplicate to file while printing the complete normal stream
sed '/^ERROR/w errors.log' app.log
```

A `w` destination is created/truncated before normal processing, even if no line matches. Use a distinct output file, never the input path. To retain existing destination content, append with shell redirection instead:

```bash
sed -n '/^ERROR/p' app.log >> errors-archive.log
```

To record only lines on which a particular substitution succeeded, use the substitution's `w` flag:

```bash
sed -n 's/^WARN /WARNING /w changed.log' app.log
# changed.log contains WARNING retry for the sample app.log
# Unchanged INFO/ERROR records are not written
```

### Write Only the First Line of a Multiline Buffer (GNU W)

```bash
printf 'a\nb\nc\nd\n' | sed -n -e 'N' -e 'W pair-heads.txt'
# pair-heads.txt: a then c
# P would print those first lines to stdout; W sends them to the file
```

### Transliteration, Case Conversion and Empty Buffers

```bash
printf 'a-b-c\n' | sed 'y/-/_/'
# a_b_c
```

```bash
# GNU: capitalize the first character of each whitespace-delimited word
printf 'alice bob\n' | sed -E 's/(^|[[:blank:]])([[:alpha:]])/\1\u\2/g'
# Alice Bob
```

```bash
# z clears the selected buffer but still permits subsequent commands
printf 'keep\nsecret\n' | sed '/secret/z'
# keep, followed by a blank line
# /secret/d would remove that line entirely
```

`y` transforms every character from its source set; it does not take regexes, ranges like `[a-z]`, or a `g` flag. Case conversion uses the current locale.

### Stop Early and Signal Whether a Match Was Found

```bash
# Print lines 1-5 and stop reading
sed '5q' file
```

```bash
# GNU: quit before printing a STOP marker
sed '/^STOP$/Q' file
```

```bash
# GNU: status 0 for READY, custom status 7 for no match in nonempty input
# Readability and empty-input checks are handled by Bash
if [[ ! -r file ]]; then
  printf '%s\n' 'Cannot read file' >&2
elif [[ ! -s file ]]; then
  printf '%s\n' 'No READY marker (empty input)'
elif sed -n '/^READY$/{q 0;};$q 7' file; then
  printf '%s\n' 'READY found'
else
  status=$?
  if (( status == 7 )); then
    printf '%s\n' 'No READY marker'
  else
    printf 'sed error: %s\n' "$status" >&2
  fi
fi
```

For simple presence checks, `grep -q` is usually clearer. This example demonstrates early termination and a custom exit status; the empty-file branch is needed because sed executes no commands on empty input. GNU sed normally uses 1 for invalid scripts, 2 for unreadable input files and 4 for fatal I/O/runtime errors. A custom status of 7 distinguishes the no-match case from those errors. The surrounding Bash snippet prints the outcome; it does not itself propagate that status as a script exit code.

### Execute a Deliberately Constructed Command (GNU e)

```bash
# Fixed trusted command; e writes its output, -n suppresses the original line
printf 'placeholder\n' | sed -n 'e date -u +%Y-%m-%d'
```

```bash
# Only a fixed numeric fixture is turned into a fixed-format command
printf '42\n' | sed -E 's/^[0-9]+$/printf "value=%s" &/e'
# value=42
```

```bash
# Refuse shell/file-I/O extensions when evaluating a transformation-only script
sed --sandbox 's/old/new/g' file
```

The substitution `e` flag invokes a shell after a successful substitution. It strips the command output's final newline, and ordinary auto-printing supplies the record terminator. Do not apply it to arbitrary log text or user-supplied commands. GNU `ep` and `pe` flags can print different stages because evaluation and printing occur in flag order.

## Bash Integration and Batch Editing

### Put Shell Data into a Replacement without Changing Its Meaning

This Bash recipe treats `@@VALUE@@` as a **fixed** placeholder and accepts a single-line replacement. It escapes the replacement's backslash, ampersand and chosen `|` delimiter; it does not turn an arbitrary search string into a literal regex.

```bash
value='A&B | C:\tmp\demo'
case "$value" in
  *$'\n'*) printf '%s\n' 'Expected a single-line replacement' >&2; exit 1 ;;
esac
escaped=$(printf '%s' "$value" | sed 's/[\&|]/\\&/g')
printf 'value=@@VALUE@@\n' | sed "s|@@VALUE@@|$escaped|g"
# value=A&B | C:\tmp\demo
```

Single quotes protect a literal sed script from Bash. Double quotes are needed above so `$escaped` expands. Parameter expansion does not re-run shell syntax embedded in the value; sed still interprets its own replacement syntax, which is why escaping is required. Environment variables and Bash strings cannot carry NUL bytes.

### Process Filenames with Spaces Using find -exec

```bash
# Preview: transformations are printed to stdout for matching .conf files
find ./configs -type f -name '*.conf' -exec sed 's/old[.]example/new.example/g' {} +
```

```bash
# GNU: edit each file in place with an attached backup suffix
find ./configs -type f -name '*.conf' -exec sed -i.bak 's/old[.]example/new.example/g' {} +
```

`find -exec ... {} +` passes filenames as arguments without splitting on spaces/newlines. The `./configs` prefix also prevents a filename from being mistaken for an option. Both commands use `old[.]example` to match the literal hostname; a bare dot in the regex would match any single character.

### Keep File Boundaries and Numbering Explicit (GNU -s and F)

```bash
printf 'a1\na2\n' > first.txt
printf 'b1\nb2\n' > second.txt

# Combined input stream: $ selects only b2
sed -n '$p' first.txt second.txt
```

```bash
# Separate files: $ selects a2 and b2
sed -s -n '$p' first.txt second.txt
```

```bash
# File name, per-file line number, and contents for each file's first line
sed -s -n '1{F;=;p;}' first.txt second.txt
# first.txt
# 1
# a1
# second.txt
# 1
# b1
```

Without `-s`, numbered addresses and ranges can span file boundaries. GNU `-i` already implies separate-file processing. `F` displays the filename; `=` displays the input line number, not an index within the multiline pattern space.

### Keep NUL-Delimited Filenames Intact (GNU -z)

```bash
# Remove only the leading ./ from each NUL-delimited pathname
find . -type f -print0 | sed -z 's|^\./||' > paths.nul
# GNU xargs -0 can consume the transformed records; never split them on newlines
```

Every record is a filename, even if it contains a newline. Output remains NUL-delimited. This example produces names, not edits to the files themselves.

### Live Logs with Line Buffering

```bash
tail -n 0 -F app.log | sed -u -n '/ERROR/{s/token=[^[:space:]]*/token=[REDACTED]/g;p;}'
```

`tail -F` follows the named file across rotations; GNU sed `-u` reduces buffering. The stream runs until interrupted. The token-format assumptions are the same as in the redaction recipe.

### Generate a Separate Output and Inspect the Difference

```bash
sed -E 's/[[:blank:]]+$//' input.txt > output.txt
diff -u input.txt output.txt
```

`-n` and `-i` together write only explicitly printed output: `sed -ni 's/old/new/' file` can therefore produce an empty file. Use `-i 's/old/new/'` for a complete edited stream, or explicitly print the intended records when filtering in place.

Do not redirect to the same file being read: the shell truncates it before sed starts. GNU `-i` edits through a temporary file and replacement rename; it is not an append operation and can change link behavior. Keep backup files until the edit has been reviewed; repeated `.bak` runs can replace an older backup.

## Ready-to-Run Cleanup Script

Create `cleanup.sed`:

```sed
# GNU sed: normalize CRLF, trim trailing horizontal blanks
s/\r$//
s/[[:blank:]]*$//

# Drop blank lines and full-line # comments, even if indented
/^[[:space:]]*$/d
/^[[:blank:]]*#/d

# Convert a deliberately simple legacy key
s/^legacy_host=/host=/
```

Input `legacy.conf`:

```text
  # deployment settings
legacy_host=localhost

port=8080
```

```bash
sed -f cleanup.sed legacy.conf
# host=localhost
# port=8080
```

Use `sed -i.bak -f cleanup.sed legacy.conf` for the same cleanup in place. Keep this script format-specific: for JSON/YAML/XML, use a parser when the intended edit depends on document structure rather than a known textual pattern.

## Resources for Further Learning

- `man sed` - The sed manual page
- `info sed` - GNU sed info documentation (more detailed)
- [GNU sed Manual](https://www.gnu.org/software/sed/manual/sed.html)
- [Regular Expressions Documentation](https://www.regular-expressions.info/)
