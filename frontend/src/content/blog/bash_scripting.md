---
lang: en
title: 'Bash Scripting Cheatsheet'
date: '2026-10-14'
category: 'TECH'
tags: ['bash', 'scripting', 'linux', 'shell', 'cheatsheet']
---

_targets bash 4 and newer_

## 1. Script anatomy and strict mode

A bash script is a text file of commands the shell reads top to bottom. What separates a reliable script from a fragile one is three things: the shebang line, execute permission, and how it reacts to failure. This sheet targets bash 4+ (bash 5.x on current distros); features that need bash rather than POSIX sh are called out.

```bash
#!/usr/bin/env bash
# backup.sh - one line on what this does
set -euo pipefail
IFS=$'\n\t'

echo "Hello, $USER"
```

**Running a script**

```bash
chmod +x script.sh      # give it the execute bit (once)
./script.sh             # run as a program (uses the shebang)
bash script.sh          # run without the execute bit
source script.sh        # run inside the CURRENT shell (same as: . script.sh)
bash -n script.sh       # syntax check only, runs nothing
bash -x script.sh       # run with a trace of every command
```

`source` matters because variables, functions and `cd` calls made by the script persist afterwards. A normal run happens in a child process, and its changes vanish when it ends.

**Shebang choices**

| Shebang | Meaning | Use when |
| --- | --- | --- |
| `#!/bin/bash` | Fixed path to bash | Target systems are all Linux |
| `#!/usr/bin/env bash` | Finds bash on `PATH` | Portability (macOS, BSD, NixOS, custom installs) |
| `#!/bin/sh` | POSIX shell (often dash) | You want strict portability; no arrays, no `[[ ]]`, no `local` guarantees |

**Strict mode, and what each flag really does**

| Setting | Effect | Catch |
| --- | --- | --- |
| `set -e` | Exit when a simple command returns non-zero | Ignored inside `if`/`while` conditions, `&&`/`\|\|` lists (except the last) and `!` negations. Do not rely on it as your only error handling |
| `set -u` | Using an unset variable is an error | Use `${var:-}` when an empty value is acceptable |
| `set -o pipefail` | A pipeline fails if any stage fails, not just the last | `grep` returning 1 on no match will now abort the script; guard with `\|\| true` |
| `IFS=$'\n\t'` | Word splitting only on newline and tab, not space | Still quote your variables; this is a safety net, not a replacement |
| `set -E` | ERR trap is inherited by functions and subshells | Pair with `trap ... ERR` |

A compact version you will see everywhere: `set -Eeuo pipefail`.

**Exit codes**

```bash
exit 0          # success
exit 1          # generic failure
cmd; echo $?    # $? holds the last command's exit code
```

| Code | Convention |
| --- | --- |
| 0 | Success |
| 1 | General error |
| 2 | Misuse of a shell builtin / bad usage |
| 126 | Command found but not executable |
| 127 | Command not found |
| 128+N | Killed by signal N (130 = Ctrl-C, 137 = SIGKILL, 143 = SIGTERM) |

**Comments**

```bash
# single-line comment
: <<'COMMENT'
multi-line comment: this heredoc is fed to the no-op ':' command
COMMENT
```

## 2. Variables and quoting

Most bash bugs are quoting bugs. Bash expands a variable first and then splits the result on whitespace and expands globs, so an unquoted value containing a space or a `*` turns into several arguments. The habit that prevents almost all of it: quote every expansion unless you have a specific reason not to.

```bash
name="Igor"             # NO spaces around '='
count=5
files=$(ls)             # command substitution
echo "$name"            # use
echo "${name}_backup"   # braces when the next char could belong to the name
unset name              # remove
```

**Scope and attributes**

```bash
export PATH="$HOME/bin:$PATH"   # visible to child processes
readonly PI=3.14159              # cannot be changed or unset
declare -i n=5                   # integer attribute: n=n+1 works arithmetically
declare -r CONST=1               # readonly
declare -x VAR=1                 # exported
declare -l lower="ABC"           # stored lowercase  -> abc
declare -u upper="abc"           # stored uppercase  -> ABC
declare -p VAR                   # print how VAR is declared
local x=1                        # inside a function only (function-scoped)
```

Variables are global by default, even when set inside a function. Use `local` inside functions every time. A child process receives only exported variables, and changes it makes never flow back to the parent.

**The three kinds of quotes**

| Form | Behaviour | Example |
| --- | --- | --- |
| `"double"` | Expands `$var`, `$(cmd)`, `$((math))`, backslash escapes \`$ " \\ \`\`; prevents splitting and globbing | `"Hello $USER"` |
| `'single'` | Everything literal, no expansion at all | `'$HOME stays literal'` |
| `$'ansi-c'` | Interprets `\n \t \x41 \u00e9` escapes | `$'line1\nline2'` |

A single quote cannot appear inside single quotes. Close, escape, reopen: `'it'\''s'`, or use double quotes.

**Quoting rules worth memorizing**

```bash
file="my report.txt"
rm $file            # WRONG: runs rm my report.txt (two args)
rm "$file"          # right
rm -- "$file"       # best: -- stops a leading dash being read as an option

cmd "$@"            # forward every argument intact
cmd "${arr[@]}"     # forward every array element intact
```

Three places where you may leave quotes off: the right side of a plain assignment (`x=$y`), inside `[[ ]]` on the left of `==`, and inside `$(( ))`. Quoting there is harmless, so when unsure, quote.

**Environment variables you will use constantly**

| Variable | Meaning |
| --- | --- |
| `$HOME`, `$USER`, `$HOSTNAME` | Home directory, user name, host name |
| `$PWD`, `$OLDPWD` | Current and previous directory |
| `$PATH` | Where commands are searched |
| `$SHELL` | The user's login shell (not necessarily the running one) |
| `$BASH_VERSION` | Version of the running bash |
| `$RANDOM` | Random integer 0-32767 |
| `$SECONDS` | Seconds since the shell started (assignable, useful as a timer) |
| `$LINENO` | Current line number, good in error messages |
| `$BASH_SOURCE` | Path of the current script file (works when sourced) |
| `$IFS` | Field separator for word splitting and `read` |
| `$UID`, `$EUID` | Real and effective user id (0 means root) |

**Environment for a single command**

```bash
LC_ALL=C sort file.txt          # variable set only for this command
env -i PATH=/usr/bin cmd        # run with a clean environment
printenv HOME                   # print one environment variable
```

**Script directory idiom** (resolves the folder the script lives in, regardless of where you call it from)

```bash
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
```

## 3. Parameter expansion

Parameter expansion lets bash do string work on variables without spawning `sed`, `cut` or `basename`. It is faster, avoids extra processes, and handles most everyday trimming and defaults in one line. The mnemonic for trimming: `#` removes from the front (the `#` key sits left of `$` on a keyboard), `%` removes from the back.

**Defaults and checks**

| Syntax | Result |
| --- | --- |
| `${var:-default}` | Value of `var`, or `default` if unset or empty |
| `${var-default}` | `default` only if `var` is unset (empty counts as set) |
| `${var:=default}` | Like `:-` but also assigns the default to `var` |
| `${var:+alt}` | `alt` if `var` is set and non-empty, otherwise empty |
| `${var:?message}` | Abort with `message` if `var` is unset or empty |

```bash
out_dir="${1:-/tmp/out}"                 # optional argument with a default
: "${API_KEY:?API_KEY must be set}"      # fail early with a clear message
flag="${DEBUG:+--verbose}"               # add a flag only if DEBUG is set
```

**Length and slicing**

```bash
s="hello world"
echo "${#s}"          # 11         length
echo "${s:6}"         # world      from offset 6
echo "${s:0:5}"       # hello      offset 0, length 5
echo "${s: -5}"       # world      last 5 (note the space before the minus)
echo "${s:2:-2}"      # llo wor    drop 2 from each end
```

**Trimming and replacing**

| Syntax | Meaning | Example (`f="/a/b/photo.tar.gz"`) |
| --- | --- | --- |
| `${f#pattern}` | Remove shortest match from the front | `${f#*/}` gives `a/b/photo.tar.gz` |
| `${f##pattern}` | Remove longest match from the front | `${f##*/}` gives `photo.tar.gz` (basename) |
| `${f%pattern}` | Remove shortest match from the back | `${f%.*}` gives `/a/b/photo.tar` |
| `${f%%pattern}` | Remove longest match from the back | `${f%%.*}` gives `/a/b/photo` |
| `${f/old/new}` | Replace first match | `${f/a/X}` gives `/X/b/photo.tar.gz` |
| `${f//old/new}` | Replace all matches | `${f//\//_}` gives `_a_b_photo.tar.gz` |
| `${f/#old/new}` | Replace only at the start | `${f/#\/a/ROOT}` gives `ROOT/b/photo.tar.gz` |
| `${f/%old/new}` | Replace only at the end | `${f/%.gz/.zst}` gives `/a/b/photo.tar.zst` |
| `${f/old}` | Delete first match | `${f//\/}` removes every slash |

Common idioms built from these:

```bash
base="${path##*/}"          # basename
dir="${path%/*}"            # dirname
ext="${file##*.}"           # extension (last one)
stem="${file%.*}"           # name without the last extension
trimmed="${s#"${s%%[![:space:]]*}"}"   # strip leading whitespace
```

**Case conversion** (bash 4+)

```bash
s="Hello World"
echo "${s^^}"     # HELLO WORLD
echo "${s,,}"     # hello world
echo "${s^}"      # Hello World  (first char upper)
echo "${s,}"      # hello World  (first char lower)
```

**Indirection, names and prefixes**

```bash
name="HOME"
echo "${!name}"            # value of the variable whose NAME is stored in $name
echo "${!BASH_*}"          # names of all variables starting with BASH_
declare -n ref="name"      # nameref: ref becomes an alias for the variable 'name'
```

A nameref (`declare -n`, bash 4.3+) is the clean way for a function to write into a variable chosen by the caller.

**Transformations** (bash 4.4+)

```bash
v='it is "ok"'
echo "${v@Q}"      # shell-quoted form, safe to paste back into a script
echo "${v@U}"      # upper-case
echo "${v@L}"      # lower-case
echo "${v@a}"      # attribute flags of the variable
```

## 4. Special variables and positional parameters

Bash fills in a set of read-only variables for you. The pair that trips people up is `"$@"` versus `"$*"`: the first keeps each argument as its own word, the second glues them into one string. Nearly always you want `"$@"`.

| Variable | Meaning |
| --- | --- |
| `$0` | Name of the script (or shell) as invoked |
| `$1` ... `$9`, `${10}` | Positional arguments; braces required from the tenth on |
| `$#` | Number of arguments |
| `"$@"` | All arguments, each as a separate quoted word |
| `"$*"` | All arguments joined into one word, separated by the first character of `IFS` |
| `$?` | Exit status of the last command |
| `$$` | PID of the current shell |
| `$!` | PID of the last background job |
| `$_` | Last argument of the previous command |
| `$-` | Current shell option flags (e.g. `himBHs`) |
| `${PIPESTATUS[@]}` | Array of exit codes of every stage of the last pipeline |
| `$BASHPID` | PID of the current bash process (differs from `$$` inside subshells) |

```bash
#!/usr/bin/env bash
echo "script: $0, args: $#"
for a in "$@"; do echo "arg: $a"; done

set -- one two three      # replace the positional parameters
shift                     # drop $1: now $1=two $2=three
shift 2                   # drop two at once
```

**Difference between `$@` and `$*` in practice**

```bash
set -- "a b" c
for x in "$@"; do echo "[$x]"; done   # [a b]   [c]   -> 2 items, correct
for x in "$*"; do echo "[$x]"; done   # [a b c]       -> 1 item
for x in $@;   do echo "[$x]"; done   # [a] [b] [c]   -> 3 items, broken
```

**Checking argument count**

```bash
if (( $# < 2 )); then
    echo "Usage: ${0##*/} SOURCE DEST" >&2
    exit 2
fi
```

**Pipeline exit codes**

```bash
false | true
echo "${PIPESTATUS[@]}"   # 1 0   (read it immediately; the next command overwrites it)
```

Print errors to standard error (`>&2`) and keep standard output for real data, so that scripts compose cleanly in pipelines.

## 5. Arrays

Bash has two array types: indexed (numbered from 0) and associative (string keys, bash 4+). Whenever you are tempted to keep a list in a space-separated string, use an array instead. Strings break on filenames with spaces; arrays do not.

**Indexed arrays**

```bash
fruits=(apple banana "dragon fruit")   # note the quoted element with a space
fruits[3]="elderberry"                 # set by index
fruits+=("fig" "grape")                # append one or more

echo "${fruits[0]}"        # apple
echo "${fruits[-1]}"       # grape  (last element, bash 4.3+)
echo "${fruits[@]}"        # all elements (quote it when passing on)
echo "${#fruits[@]}"       # number of elements
echo "${!fruits[@]}"       # list of indices: 0 1 2 3 4 5
echo "${fruits[@]:1:2}"    # slice: 2 elements from index 1

unset 'fruits[1]'          # remove one element (leaves a gap in indices)
unset fruits               # remove the whole array
```

**Iterating**

```bash
for f in "${fruits[@]}"; do echo "$f"; done          # values
for i in "${!fruits[@]}"; do echo "$i: ${fruits[$i]}"; done   # index and value
```

**Associative arrays** (must be declared)

```bash
declare -A color=([apple]=red [banana]=yellow)
color[grape]=purple

echo "${color[apple]}"      # red
echo "${!color[@]}"         # keys (order is not guaranteed)
echo "${color[@]}"          # values
echo "${#color[@]}"         # number of keys

[[ -v color[kiwi] ]] && echo "kiwi is set"   # test whether a key exists
unset 'color[apple]'                          # delete one key

for k in "${!color[@]}"; do echo "$k -> ${color[$k]}"; done
```

**Filling arrays from commands and files**

```bash
mapfile -t lines < file.txt                 # one element per line, newlines stripped (alias: readarray)
mapfile -t files < <(find . -name '*.log')  # from a command via process substitution
read -ra words <<< "$line"                  # split a string on IFS into an array
IFS=: read -ra parts <<< "$PATH"            # split on a custom delimiter
files=(*.txt)                               # glob into an array (safe with spaces)
mapfile -d '' -t names < <(find . -print0)  # NUL-delimited: safe for any filename
```

**Useful array operations**

```bash
# Join with a separator
join_by() { local IFS="$1"; shift; echo "$*"; }
join_by , "${fruits[@]}"

# Copy an array
copy=("${fruits[@]}")

# Test membership
contains() { local x; for x in "${@:2}"; do [[ "$x" == "$1" ]] && return 0; done; return 1; }
contains banana "${fruits[@]}" && echo yes

# Sort an array
IFS=$'\n' sorted=($(sort <<< "${fruits[*]}"))   # fine for simple values

# Remove duplicates while keeping order
mapfile -t uniq < <(printf '%s\n' "${fruits[@]}" | awk '!seen[$0]++')
```

**Passing arrays to functions**

```bash
print_all() { local item; for item in "$@"; do echo "- $item"; done; }
print_all "${fruits[@]}"                # pass elements as separate arguments

fill() { local -n out=$1; out=(a b c); } # pass by name using a nameref
fill result; echo "${result[@]}"
```

Two gotchas: bash cannot nest arrays (no array of arrays), and `"${arr[*]}"` joins everything into one string while `"${arr[@]}"` keeps elements separate.

## 6. Arithmetic and operators

Bash does integer math natively and nothing else. For decimals you hand the work to `bc`, `awk` or `python`. Inside `(( ))` and `$(( ))` you can write variables without the `$`, and the usual C operators apply.

```bash
a=7; b=3
echo $(( a + b ))         # 10   arithmetic expansion: yields the value
echo $(( a / b ))         # 2    integer division truncates
echo $(( a % b ))         # 1    modulo
echo $(( a ** b ))        # 343  power

(( a++ ))                 # arithmetic command: modifies a, exit status 0 if result non-zero
(( a += 5 ))
let "c = a * 2"           # older style, still works
declare -i d=a*2          # integer attribute evaluates on assignment
```

**Operators**

| Group | Operators |
| --- | --- |
| Arithmetic | `+ - * / % **` |
| Increment | `x++ ++x x-- --x` |
| Assignment | `= += -= *= /= %= <<= >>= &= ^= \|=` |
| Comparison | `< <= > >= == !=` (inside `(( ))`) |
| Logical | `&& \|\| !` (inside `(( ))`) |
| Bitwise | `& \| ^ ~ << >>` |
| Ternary | `cond ? x : y` |
| Comma | `(( a=1, b=2 ))` |

```bash
echo $(( 5 > 3 ? 100 : 200 ))     # 100
echo $(( 1 << 4 ))                # 16
echo $(( 0xFF ))                  # 255  hex
echo $(( 2#1010 ))                # 10   binary (base#number)
echo $(( 010 ))                  # 8    leading zero means OCTAL
echo $(( 10#08 ))                # 8    force base 10 when parsing zero-padded input
```

The octal trap is real: `08` and `09` are errors in arithmetic. Use `10#$n` for values like month or day numbers read from text.

**Using the result as a condition**

```bash
if (( count > 10 && errors == 0 )); then echo ok; fi
while (( i < 5 )); do (( i++ )); done
```

A gotcha under `set -e`: `(( i++ ))` returns exit status 1 when the expression evaluates to 0, which is the case for `i++` when `i` is 0. Write `(( ++i ))`, `i=$(( i + 1 ))` or `(( i++ )) || true`.

**Floating point**

```bash
echo "scale=3; 10/3" | bc            # 3.333
awk 'BEGIN { printf "%.2f\n", 10/3 }' # 3.33
awk -v x=3.5 'BEGIN { print (x > 3) }'   # compare floats: prints 1
```

**Random numbers, ranges and sequences**

```bash
echo $(( RANDOM % 100 ))        # 0-99
seq 1 5                          # 1 2 3 4 5
seq 0 5 20                       # 0 5 10 15 20  (start step end)
echo {1..5}                      # brace range, no external command
echo {01..10}                    # zero-padded: 01 02 ... 10
```

**Formatted output** (`printf` is more predictable than `echo`)

```bash
printf '%s is %d years old\n' "Ann" 30
printf '%05.1f\n' 3.14159          # 003.1
printf '%-10s|%10s|\n' left right  # padding
printf '%x %o %e\n' 255 8 12345    # hex, octal, scientific
printf '%q\n' "a b\$c"             # shell-quoted output
```

## 7. Conditionals

In bash, `if` tests the exit status of a command: zero means true, anything else means false. The bracket forms are just commands that happen to return those statuses. Prefer `[[ ]]` for strings and files, and `(( ))` for numbers, in bash scripts.

```bash
if command; then
    ...
elif other_command; then
    ...
else
    ...
fi

if grep -q error log.txt; then echo "found"; fi     # test a command directly
```

**Which bracket?**

| Form | What it is | Notes |
| --- | --- | --- |
| `[ ... ]` / `test` | POSIX command | Needs quotes around variables, `-a`/`-o` are fragile, `<` and `>` need escaping |
| `[[ ... ]]` | Bash keyword | No word splitting or globbing inside, supports `&&`, `\|\|`, `==` patterns and `=~` regex |
| `(( ... ))` | Arithmetic | Numbers only, C-style comparison operators |

**File tests**

| Test | True when |
| --- | --- |
| `-e f` | exists (any type) |
| `-f f` | regular file |
| `-d f` | directory |
| `-L f` | symbolic link |
| `-r f` `-w f` `-x f` | readable, writable, executable by you |
| `-s f` | exists and size greater than zero |
| `-N f` | modified since last read |
| `-p f` `-S f` `-b f` `-c f` | pipe, socket, block device, character device |
| `f1 -nt f2` | f1 is newer than f2 |
| `f1 -ot f2` | f1 is older than f2 |
| `f1 -ef f2` | same file (same device and inode) |
| `-O f` `-G f` | owned by your user / your group |
| `-t 1` | file descriptor 1 is a terminal (is output going to a TTY?) |

**String tests**

| Test | True when |
| --- | --- |
| `-z "$s"` | string is empty |
| `-n "$s"` | string is not empty |
| `"$a" == "$b"` | strings equal (`=` also works) |
| `"$a" != "$b"` | strings differ |
| `"$a" < "$b"` | sorts before (lexicographic, inside `[[ ]]`) |
| `"$s" == pat*` | glob pattern match (pattern unquoted, `[[ ]]` only) |
| `"$s" =~ regex` | extended regex match (regex unquoted, `[[ ]]` only) |
| `-v name` | variable is set (bash 4.2+) |

**Numeric tests** (inside `[ ]` or `[[ ]]`; inside `(( ))` use `< > ==` instead)

| Test | Meaning |
| --- | --- |
| `-eq` `-ne` | equal, not equal |
| `-lt` `-le` | less than, less or equal |
| `-gt` `-ge` | greater than, greater or equal |

```bash
if [[ -f "$file" && -r "$file" ]]; then echo "readable file"; fi
if [[ -z "${var:-}" ]]; then echo "var is empty or unset"; fi
if [[ $answer == [Yy]* ]]; then echo "yes"; fi
if (( age >= 18 )); then echo "adult"; fi
if [[ $n -gt 5 ]]; then echo "bigger than 5"; fi
```

**Regex matching and capture groups**

```bash
re='^([0-9]{4})-([0-9]{2})-([0-9]{2})$'
if [[ $date =~ $re ]]; then
    year=${BASH_REMATCH[1]}
    month=${BASH_REMATCH[2]}
    day=${BASH_REMATCH[3]}
fi
```

Put the regex in a variable. Quoting the right-hand side makes bash treat it as a literal string, and writing it inline invites escaping problems.

**Logical combinations and short circuits**

```bash
[[ -d $dir ]] || mkdir -p "$dir"          # create only if missing
[[ -n $x ]] && echo "x is set"            # run only if true
cmd1 && cmd2 || cmd3                       # careful: cmd3 also runs if cmd2 fails
! grep -q foo file && echo "no foo"        # negate a command
{ cmd1; cmd2; } || echo "one failed"       # group, then test the group
```

The `A && B || C` pattern is not a real if/else: if `B` fails, `C` runs too. Use `if` when it matters.

**case: pattern matching on one value**

```bash
case "$1" in
    start|begin)   echo "starting" ;;
    stop)          echo "stopping" ;;
    restart)       echo "restarting" ;;
    [0-9]*)        echo "starts with a digit" ;;
    -h|--help)     usage; exit 0 ;;
    *)             echo "unknown: $1" >&2; exit 1 ;;
esac
```

Each branch ends with `;;`. Bash 4 adds `;&` (fall through into the next branch) and `;;&` (keep testing further patterns). `case` is faster and clearer than a chain of `elif` comparing one variable.

**Testing whether a command exists**

```bash
if command -v docker >/dev/null 2>&1; then echo "docker found"; fi
```

Prefer `command -v` over `which`, which is an external program with inconsistent behavior.

## 8. Loops

Bash has four loop forms. Use `for` to walk a known list, `while` to repeat until a condition fails or to read input line by line, and `until` for the inverse. The most important loop pattern is reading a file safely, because the naive version breaks on spaces, backslashes and a missing final newline.

**for**

```bash
for name in alice bob carol; do echo "hi $name"; done

for f in *.txt; do echo "$f"; done           # glob: quotes not needed on the pattern itself
for i in {1..5}; do echo "$i"; done           # brace range
for i in $(seq 1 "$n"); do echo "$i"; done    # when the end is a variable (braces cannot expand variables)
for arg in "$@"; do echo "$arg"; done         # every argument
for arg; do echo "$arg"; done                 # shorthand: iterates over "$@"

for (( i = 0; i < 10; i++ )); do echo "$i"; done   # C-style
for (( ;; )); do break; done                        # infinite loop
```

If a glob matches nothing, the loop runs once with the literal pattern (`*.txt`). Guard with `[[ -e $f ]] || continue` or enable `shopt -s nullglob`, which makes the pattern expand to nothing.

**while and until**

```bash
i=0
while (( i < 5 )); do echo "$i"; (( ++i )); done

until ping -c1 -W1 example.com &>/dev/null; do
    echo "waiting for network..."; sleep 2
done

while true; do ...; done       # infinite; leave with break
while :; do ...; done          # same, ':' is a no-op that returns 0
```

**Reading a file line by line, the safe way**

```bash
while IFS= read -r line; do
    echo "line: $line"
done < input.txt

# Handle a last line that has no trailing newline:
while IFS= read -r line || [[ -n $line ]]; do
    echo "$line"
done < input.txt
```

The two guards matter: `IFS=` keeps leading and trailing whitespace, and `-r` stops backslashes being treated as escapes.

**Parsing delimited data**

```bash
while IFS=: read -r user _ uid gid _ home shell; do
    echo "$user uid=$uid home=$home"
done < /etc/passwd

while IFS=',' read -r id name email; do
    echo "$name <$email>"
done < <(tail -n +2 users.csv)          # skip the header line
```

Simple `read` splitting does not understand quoted CSV fields. For real CSV use a proper tool (`csvkit`, `python`, `mlr`).

**Loop over command output**

```bash
while IFS= read -r f; do echo "$f"; done < <(find . -type f -name '*.log')

# Filenames with newlines? Use NUL separators:
while IFS= read -r -d '' f; do echo "$f"; done < <(find . -type f -print0)
```

Feeding the loop with `< <(cmd)` instead of `cmd | while ...` keeps the loop in the current shell, so variables you set inside it survive (see the pipeline subshell trap in section 11).

**break, continue, and loop control**

```bash
for i in {1..10}; do
    (( i % 2 )) && continue      # skip odd numbers
    (( i > 8 )) && break         # stop the loop
    echo "$i"
done

break 2        # leave two nested loops
continue 2     # continue the outer loop
```

**select: a simple numbered menu**

```bash
PS3="Choose an option: "
select opt in start stop quit; do
    case $opt in
        start) echo "starting" ;;
        stop)  echo "stopping" ;;
        quit)  break ;;
        *)     echo "invalid: $REPLY" ;;
    esac
done
```

**Common loop patterns**

```bash
# Repeat a command N times
for _ in {1..3}; do curl -fsS "$url" && break; sleep 1; done

# Process files in parallel batches (see section 16 for more)
for f in *.png; do convert "$f" "${f%.png}.jpg" & done; wait

# Count lines matching a pattern without a pipe
count=0; while IFS= read -r l; do [[ $l == *ERROR* ]] && (( ++count )); done < log.txt
```

## 9. Functions

A bash function behaves like a small command: it receives arguments as `$1`, `$2`, `$@`, and it "returns" in two separate ways. Its exit status (0 to 255) signals success or failure, while anything it prints is its output, captured with `$(...)`. Mixing these up is the most common function mistake. `return` is for status, `echo`/`printf` is for data.

```bash
greet() {
    local name="${1:-world}"      # local: invisible outside the function
    echo "Hello, $name"
}

greet                  # Hello, world
greet Igor             # Hello, Igor
msg=$(greet Ann)       # capture the output
```

**Return status versus output**

```bash
is_even() { (( $1 % 2 == 0 )); }     # status of the last command is the function's status
if is_even 4; then echo "even"; fi

add() { echo $(( $1 + $2 )); }       # data goes to stdout
sum=$(add 2 3)                       # sum=5

die() { echo "error: $*" >&2; exit 1; }   # write to stderr, then stop the script
[[ -f $cfg ]] || die "missing config: $cfg"
```

`return` ends the function; `exit` ends the whole script (or the subshell it runs in). A value above 255 wraps around, so never use `return` for numbers or strings.

**Returning several values or large data**

```bash
# 1. Nameref (bash 4.3+): the caller picks the variable name
split_host() { local -n _h=$2 _p=$3; _h="${1%:*}"; _p="${1#*:}"; }
split_host example.com:8080 host port

# 2. Print in a parseable way and read it back
read -r host port < <(parse_url "$url")

# 3. Set a global variable on purpose (document it with a comment)
REPLY_RESULT=...
```

**Arguments, defaults and validation**

```bash
backup() {
    (( $# == 2 )) || { echo "usage: backup SRC DEST" >&2; return 2; }
    local src=$1 dest=$2
    [[ -d $src ]] || { echo "no such dir: $src" >&2; return 1; }
    cp -a -- "$src" "$dest"
}
```

**Scope rules**

| Behaviour | Detail |
| --- | --- |
| Variables are global by default | Even those first assigned inside a function. Use `local` |
| `local` is dynamic | A function called by another sees the caller's locals (unlike most languages) |
| `local x=$(cmd)` hides the exit code | The status is that of `local`, not `cmd`. Declare first: `local x; x=$(cmd)` |
| Functions are not exported to children by default | `export -f myfunc` shares one with child bash processes |

**Recursion**

```bash
fact() {
    local n=$1
    (( n <= 1 )) && { echo 1; return; }
    echo $(( n * $(fact $(( n - 1 )) ) ))
}
fact 5     # 120
```

**Reusable libraries**

```bash
# lib.sh defines functions only
# main.sh:
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

# Guard so a file can tell if it is being run or sourced:
if [[ ${BASH_SOURCE[0]} == "$0" ]]; then main "$@"; fi
```

**Introspection**

```bash
declare -F            # list all function names
declare -f greet      # print the definition of one function
unset -f greet        # delete a function
type greet            # shows whether a name is an alias, function, builtin or file
```

Bash also has `FUNCNAME` (call stack names), `BASH_LINENO` and `BASH_SOURCE` arrays, which are the basis of stack traces in error handlers (section 15).

## 10. Input, output and redirection

Every process starts with three open streams, called file descriptors: 0 is standard input, 1 is standard output, 2 is standard error. Redirection rewires these before the command runs. Order matters, because redirections are processed left to right.

| Syntax | Effect |
| --- | --- |
| `cmd > file` | stdout to file, overwrite |
| `cmd >> file` | stdout to file, append |
| `cmd < file` | stdin from file |
| `cmd 2> file` | stderr to file |
| `cmd 2>> file` | stderr appended |
| `cmd > file 2>&1` | stdout and stderr both to file |
| `cmd &> file` | same, shorthand (bash) |
| `cmd &>> file` | same, appending (bash 4+) |
| `cmd 2>&1 \| other` | stderr merged into the pipe (shorthand: `cmd \|& other`) |
| `cmd >&2` | stdout sent to stderr (how to print an error message) |
| `cmd > /dev/null` | discard stdout |
| `cmd > /dev/null 2>&1` | discard everything |
| `cmd <<< "text"` | here-string: text as stdin |
| `cmd >``\| file` | after `set -C`, `>` refuses to overwrite an existing file; `>\|` forces it |

The order trap: `cmd > file 2>&1` sends both to the file, but `cmd 2>&1 > file` sends stderr to the terminal and only stdout to the file, because `2>&1` was evaluated while stdout still pointed at the terminal.

**Pipes and tee**

```bash
cmd1 | cmd2 | cmd3                    # stdout of each feeds stdin of the next
ls | tee list.txt | wc -l             # save a copy AND keep processing
cmd | tee -a log.txt                  # append instead of overwrite
sudo sh -c 'echo x > /etc/f'          # redirect needs root: the shell does it, not sudo
echo x | sudo tee /etc/f >/dev/null   # usual fix for the line above
```

**Here-documents**

```bash
cat <<EOF
Hello $USER, today is $(date +%F)
EOF

cat <<'EOF'            # quoted delimiter: no expansion at all
Price: $5, path: $HOME
EOF

cat <<-EOF             # <<- strips leading TABS (not spaces), for indented scripts
	indented body
	EOF

cat > config.ini <<EOF   # write a file from a script
[main]
user=$USER
EOF
```

**Reading input**

```bash
read -p "Name: " name                    # prompt
read -r -s -p "Password: " pw; echo      # silent (no echo), then a newline
read -r -t 5 -n 1 -p "Continue? [y/N] " ans   # 5s timeout, one character
read -r -a words <<< "a b c"            # into an array
read -r -d '' blob < file                # read the whole file (delimiter = NUL)

# Default answer pattern
read -r -p "Proceed? [y/N] " ans
[[ ${ans,,} == y* ]] || exit 1
```

**Custom file descriptors**

```bash
exec 3> out.log           # open fd 3 for writing
echo "to log" >&3
exec 3>&-                 # close it

exec 4< input.txt         # open fd 4 for reading
read -r line <&4
exec 4<&-

exec > >(tee -a run.log) 2>&1   # send ALL of the script's output to the screen and a log
exec 2> errors.log              # redirect stderr for the rest of the script
```

**Printing helpers**

```bash
echo -n "no newline"          # -n suppresses newline; -e enables escapes
printf '%s\n' "$var"          # the safe way to print arbitrary text (echo may eat -n, -e)
printf '%s\n' "${arr[@]}"     # one array element per line
printf '=%.0s' {1..40}; echo  # draw a 40-character line
```

**Colors with tput** (check that output is a terminal first)

```bash
if [[ -t 1 ]]; then RED=$(tput setaf 1); BOLD=$(tput bold); RESET=$(tput sgr0); else RED=; BOLD=; RESET=; fi
echo "${RED}${BOLD}error${RESET}"
```

**stdout versus stderr in practice**

```bash
log()  { echo "[$(date +%T)] $*" >&2; }   # diagnostics to stderr, so stdout stays clean data
result=$(compute 2>/dev/null)             # capture stdout only, hide errors
errors=$(compute 2>&1 >/dev/null)         # capture stderr only
```

## 11. Substitution and subshells

A subshell is a child copy of the current shell. It sees all your variables but cannot change them for the parent. Command substitution, parentheses and pipelines all create subshells, and that single fact explains a large share of "why is my variable empty?" questions.

**Command substitution**

```bash
today=$(date +%F)                 # modern form, nestable
files=$(ls "$dir" | wc -l)
old=`date`                        # backticks: legacy, do not nest well, avoid

name=$(basename "$(dirname "$path")")      # nesting works cleanly with $( )
content=$(< file.txt)                        # read a file with no extra process
```

Command substitution strips all trailing newlines from the output. To keep them, append a sentinel: `out=$(cmd; echo x); out=${out%x}`.

**Process substitution** (bash, not POSIX sh)

```bash
diff <(sort a.txt) <(sort b.txt)          # treat command output as a file
comm -12 <(sort a) <(sort b)              # lines common to both
while read -r l; do ...; done < <(cmd)    # loop over output without a pipe subshell
tee >(gzip > out.gz) >(sha256sum > out.sha) < input > /dev/null   # fan out to several consumers
```

`<(cmd)` expands to a path such as `/dev/fd/63`, which is why it works for programs that insist on filenames.

**Subshell versus group**

| Form | Runs in | Effect on parent |
| --- | --- | --- |
| `( cmds )` | A subshell (child process) | `cd`, variable changes and `exit` stay inside |
| `{ cmds; }` | The current shell | Changes persist; needs a space after `{` and a `;` or newline before `}` |
| `$( cmds )` | A subshell, output captured | Only the output comes back |

```bash
( cd /tmp && rm -f stale.* )          # cd does not leak out: no need to cd back
{ echo header; cat body; } > out.txt  # redirect a group of commands together
```

**The pipeline subshell trap**

```bash
count=0
printf 'a\nb\nc\n' | while read -r l; do (( count++ )); done
echo "$count"        # prints 0! the loop ran in a subshell

count=0
while read -r l; do (( count++ )); done < <(printf 'a\nb\nc\n')
echo "$count"        # prints 3: process substitution keeps the loop in this shell

# Alternative: shopt -s lastpipe   (bash 4.2+, only works when job control is off, as in scripts)
```

**Capturing both output and exit status**

```bash
out=$(some_cmd 2>&1) || rc=$?             # rc set only on failure
out=$(some_cmd); rc=$?                    # works when 'local' is not on the same line
if ! out=$(some_cmd 2>&1); then echo "failed: $out" >&2; fi
```

**Evaluating strings as code**

```bash
eval "$string"      # executes text as bash: dangerous with any untrusted input
```

Almost every use of `eval` can be replaced by arrays (for building commands), namerefs (for variable names) or `printf -v name` (for assigning to a computed name). Reach for those first.

```bash
printf -v "$varname" '%s' "$value"        # assign to a variable whose name is in $varname
cmd=(grep -r "$pattern" "$dir"); "${cmd[@]}"   # build a command safely as an array
```

## 12. Globbing, brace expansion and expansion order

Before a command runs, bash rewrites its line in a fixed sequence of expansions. Knowing the sequence tells you why `echo {$a,$b}` works but `{1..$n}` does not, and why quoting stops some expansions but not others.

**Order of expansion**

1. Brace expansion: `{a,b}`, `{1..5}`
2. Tilde expansion: `~`, `~user`
3. Parameter, arithmetic and command substitution (left to right)
4. Word splitting (on unquoted results only)
5. Pathname expansion (globbing)
6. Quote removal

**Globs** (matched against file names, not regular expressions)

| Pattern | Matches |
| --- | --- |
| `*` | Any string, including empty (not a leading dot) |
| `?` | Exactly one character |
| `[abc]` `[a-z]` `[0-9]` | One character from a set or range |
| `[!abc]` or `[^abc]` | One character not in the set |
| `[[:digit:]]` `[[:alpha:]]` `[[:space:]]` `[[:upper:]]` `[[:alnum:]]` | POSIX character classes |
| `**` | Any depth of directories (needs `shopt -s globstar`) |

```bash
ls *.txt                  # all .txt files in this directory
ls file?.log              # file1.log, fileA.log (one char)
ls [A-Z]*.md              # starts with an uppercase letter
shopt -s globstar; ls **/*.py    # every .py below here, any depth
```

**Glob behaviour switches** (`shopt -s name` enables, `-u` disables)

| Option | Effect |
| --- | --- |
| `nullglob` | A pattern with no match expands to nothing (instead of the literal pattern) |
| `failglob` | A pattern with no match is an error |
| `dotglob` | `*` also matches names starting with a dot |
| `nocaseglob` | Case-insensitive matching |
| `globstar` | Enables `**` recursion |
| `extglob` | Enables the extended patterns below |

**Extended globs** (`shopt -s extglob`)

| Pattern | Meaning |
| --- | --- |
| `?(a\|b)` | Zero or one of the alternatives |
| `*(a\|b)` | Zero or more |
| `+(a\|b)` | One or more |
| `@(a\|b)` | Exactly one |
| `!(a\|b)` | Anything except these |

```bash
shopt -s extglob
ls !(*.bak)                  # everything that is not a .bak file
rm -- @(*.tmp|*.swp)         # delete either kind
[[ $f == +([0-9]).txt ]]     # digits-only name ending in .txt
```

**Brace expansion** (pure text generation, happens before everything else)

```bash
echo {a,b,c}                  # a b c
echo file{1..3}.txt           # file1.txt file2.txt file3.txt
echo {01..10..3}              # 01 04 07 10   (start..end..step)
echo {a..e}                   # a b c d e
mkdir -p project/{src,tests,docs}/{old,new}   # 6 directories at once
cp config.yml{,.bak}          # cp config.yml config.yml.bak (the classic backup trick)
mv name.{txt,md}              # rename name.txt to name.md
```

Braces cannot contain variables in a range (`{1..$n}` stays literal). Use `seq` or a C-style `for` loop.

**Tilde and special paths**

```bash
cd ~              # home directory of the current user
cd ~root          # home of another user
cd ~-             # previous directory (same as cd -)
pushd /tmp; popd  # directory stack
```

**Quoting and globs**

```bash
ls "*.txt"        # literal file named *.txt: quotes switch globbing off
ls *.txt          # glob expands
for f in "$dir"/*.txt; do ...; done   # quote the variable, leave the glob outside the quotes
```

Globs are for file names. To match text inside a variable, use `[[ $s == pattern ]]` (glob rules) or `[[ $s =~ regex ]]` (regex).

## 13. Text-processing toolbox

Most real scripts are glue around a handful of classic tools, each doing one job on a stream of text. The skill is knowing which one fits: `grep` filters lines, `sed` edits them, `awk` handles columns and arithmetic, `cut`/`sort`/`uniq`/`tr` do small focused jobs, `find` locates files, and `xargs` turns a list into command arguments. Examples use GNU versions, the default on Linux.

**grep: filter lines**

```bash
grep 'error' file              # lines containing error
grep -i 'error' file           # ignore case
grep -v 'debug' file           # invert: lines NOT matching
grep -n 'error' file           # show line numbers
grep -c 'error' file           # count matching lines
grep -r 'TODO' src/            # recurse into a directory
grep -rl 'TODO' src/           # list only file names
grep -w 'cat' file             # whole word only
grep -F 'a.b*c' file           # fixed string, no regex (fast, no escaping)
grep -E 'foo|bar' file         # extended regex (alternation, +, ?, {n})
grep -P '\d{3}-\d{4}' file     # Perl regex (GNU): \d, lookahead, non-greedy
grep -o '[0-9]\+' file         # print only the matching part
grep -A2 -B1 'error' file      # 2 lines after, 1 before; -C2 for both
grep -q 'x' file && echo yes   # quiet: just the exit status
grep --include='*.py' -rn 'import os' .
```

Exit status: 0 when something matched, 1 when nothing matched, 2 on error. Under `set -e` and `pipefail`, a non-match aborts the script unless handled with `|| true` or an `if`.

**sed: stream editor**

```bash
sed 's/old/new/' file          # replace first match on each line
sed 's/old/new/g' file         # replace all matches on each line
sed 's/old/new/2' file         # replace only the 2nd match
sed -n '5,10p' file            # print only lines 5 to 10
sed '5d' file                  # delete line 5
sed '/^#/d' file               # delete comment lines
sed '/^$/d' file               # delete empty lines
sed -E 's/([a-z]+)@([a-z]+)/\2 at \1/' file   # extended regex with groups
sed 's#/usr/local#/opt#g' file # use another delimiter when the text has slashes
sed '1i\header line' file      # insert before line 1
sed '$a\footer line' file      # append after the last line
sed -i 's/foo/bar/g' file      # EDIT IN PLACE (GNU)
sed -i.bak 's/foo/bar/g' file  # in place, keeping a .bak backup (works on GNU and BSD)
sed -e 's/a/b/' -e 's/c/d/' f  # several expressions
```

`&` in the replacement means the whole match: `sed 's/[0-9]\+/<&>/g'`. Special characters in a replacement coming from a variable need escaping, so for arbitrary text prefer `awk` or a small script.

**awk: columns, conditions, arithmetic**

```bash
awk '{ print $1 }' file                  # first whitespace-separated field
awk '{ print $NF }' file                 # last field; $(NF-1) second to last
awk -F: '{ print $1, $3 }' /etc/passwd   # custom field separator
awk -F, -v OFS=';' '{ $1=$1; print }' f # change the output separator
awk 'NR>1' file                          # skip the header line
awk 'NR==5' file                         # line 5 only
awk '$3 > 100' file                      # rows where column 3 exceeds 100
awk '/error/ { print NR": "$0 }' file    # regex match, with line numbers
awk '{ s += $2 } END { print s }' file   # sum a column
awk '{ s += $2 } END { print s/NR }' f   # average
awk '!seen[$0]++' file                   # remove duplicate lines, keep order
awk '{ c[$1]++ } END { for (k in c) print k, c[k] }' f   # count by key
awk 'length($0) > 80' file               # long lines
awk 'BEGIN { printf "%-10s %5s\n", "name", "qty" } { printf "%-10s %5d\n", $1, $2 }' f
```

Variables: `NR` (record number), `NF` (field count), `FS`/`OFS` (input/output separators), `$0` (whole line). Pass shell variables with `-v`: `awk -v n="$limit" '$2 > n' file`.

**cut, sort, uniq, tr, wc, head, tail, paste**

```bash
cut -d, -f1,3 file.csv            # fields 1 and 3, comma-delimited
cut -c1-10 file                   # first 10 characters
cut -d: -f1 /etc/passwd           # list user names

sort file                         # lexicographic
sort -n file                      # numeric
sort -nr file                     # numeric, reversed
sort -k2,2 -t, file               # sort by 2nd comma-separated field
sort -u file                      # sort and remove duplicates
sort -h file                      # human sizes (1K, 2M, 3G)
sort -V file                      # version order (1.2 before 1.10)

uniq file                         # remove ADJACENT duplicates (sort first)
sort file | uniq -c | sort -nr    # frequency table, most common first
sort file | uniq -d               # show only duplicated lines

tr 'a-z' 'A-Z' < file             # translate characters
tr -d '\r' < dos.txt > unix.txt   # delete characters
tr -s ' ' < file                  # squeeze repeated spaces
tr -cd '[:alnum:]\n' < file       # keep only letters, digits, newlines

wc -l file                        # lines (-w words, -c bytes, -m chars)
head -n 5 file                    # first 5 lines (head -n -2: all but last 2)
tail -n 5 file                    # last 5 lines (tail -n +2: from line 2 onward)
tail -f /var/log/syslog           # follow a growing file (-F survives log rotation)
paste a.txt b.txt                 # side-by-side columns
paste -sd, file                   # join all lines with commas
column -t -s, file.csv            # align columns for reading
```

**find: locate files**

```bash
find . -name '*.log'                      # by name (case-sensitive; -iname ignores case)
find . -type f -size +100M                # files over 100 MB
find . -type d -name node_modules -prune -o -type f -print   # skip a directory
find . -mtime -7                          # modified in the last 7 days (+7: older than 7)
find . -mmin -30                          # modified in the last 30 minutes
find . -user alice -perm -u+x             # by owner and permission
find . -empty -type f -delete             # delete empty files
find . -name '*.tmp' -exec rm {} +        # run a command on matches (batched)
find . -type f -print0 | xargs -0 sha256sum   # NUL-safe pipeline
find . -maxdepth 2 -type f                # limit depth
find . -newer reference.txt               # newer than another file
```

**xargs: build commands from input**

```bash
find . -name '*.txt' -print0 | xargs -0 grep -l 'needle'   # safe with odd file names
printf '%s\n' a b c | xargs -n1 echo item:                   # one argument per command
cat urls.txt | xargs -P4 -n1 curl -sO                       # 4 downloads in parallel
ls *.png | xargs -I{} convert {} {}.jpg                     # {} placeholder for each item
xargs -a list.txt -d '\n' -r rm                             # -r: do nothing if input is empty
```

**Handy one-liners**

```bash
ls -S | head                            # largest files first
du -sh * | sort -h | tail                # biggest directories
cat access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head   # top client IPs
ps aux --sort=-%mem | head              # top memory users
ss -tulpn                                # listening sockets (modern netstat)
jq -r '.items[].name' data.json          # JSON field extraction (install jq)
curl -fsSL https://example.com | less    # -f fail on HTTP errors, -sS quiet but show errors, -L follow redirects
watch -n2 'df -h /'                      # repeat a command every 2 seconds
```

## 14. Argument parsing

There are two practical approaches. `getopts` is a built-in that handles short options (`-v`, `-o file`) and is portable. A `while`/`case` loop over `$@` handles long options (`--output=file`) and mixed styles, at the cost of writing a little more yourself.

**getopts: short options**

```bash
usage() {
    cat <<EOF >&2
Usage: ${0##*/} [-v] [-o OUTFILE] [-n COUNT] INPUT...
  -v          verbose
  -o FILE     output file (default: out.txt)
  -n COUNT    repeat count
  -h          show this help
EOF
}

verbose=0; outfile=out.txt; count=1
while getopts ':vo:n:h' opt; do
    case $opt in
        v) verbose=1 ;;
        o) outfile=$OPTARG ;;
        n) count=$OPTARG ;;
        h) usage; exit 0 ;;
        :) echo "option -$OPTARG needs an argument" >&2; usage; exit 2 ;;
        \?) echo "unknown option: -$OPTARG" >&2; usage; exit 2 ;;
    esac
done
shift $(( OPTIND - 1 ))         # what remains are the positional arguments

(( $# >= 1 )) || { usage; exit 2; }
```

In the option string, a leading `:` enables silent error handling (you print your own messages), and a colon after a letter means that option takes a value. Options can be bundled (`-vn 3`).

**while/case: long options**

```bash
verbose=0; outfile=out.txt; args=()
while (( $# )); do
    case $1 in
        -v|--verbose)   verbose=1 ;;
        -o|--output)    outfile=${2:?--output needs a value}; shift ;;
        --output=*)     outfile=${1#*=} ;;
        -h|--help)      usage; exit 0 ;;
        --)             shift; args+=("$@"); break ;;     # everything after -- is positional
        -*)             echo "unknown option: $1" >&2; exit 2 ;;
        *)              args+=("$1") ;;
    esac
    shift
done
set -- "${args[@]}"          # restore positionals
```

The GNU `getopt` external command also supports long options with bundling, but its behavior differs across systems, so the explicit loop above is the more portable choice.

**Validation helpers**

```bash
die() { echo "error: $*" >&2; exit 1; }

[[ $count =~ ^[0-9]+$ ]]      || die "count must be a number"
[[ -r $input ]]               || die "cannot read $input"
[[ $mode == @(fast|slow) ]]   || die "mode must be fast or slow"   # needs: shopt -s extglob
command -v jq >/dev/null      || die "jq is required"
(( EUID == 0 ))               || die "run as root"
```

**Environment variables as configuration**

```bash
LOG_LEVEL="${LOG_LEVEL:-info}"          # override with: LOG_LEVEL=debug ./script.sh
: "${DB_HOST:?DB_HOST is required}"      # required variable

# Load a simple KEY=VALUE config file (trusted files only; it is executed as code)
[[ -f ~/.myapp.conf ]] && source ~/.myapp.conf
```

**Option conventions worth following**

| Convention | Why |
| --- | --- |
| `-h` / `--help` prints usage to stdout and exits 0 | Users expect it |
| Wrong usage prints to stderr and exits 2 | Distinguishes misuse from runtime failure |
| `--` ends option parsing | Lets users pass file names that begin with a dash |
| Accept `-` as stdin where it makes sense | Fits into pipelines |
| Support `-n`/`--dry-run` for anything destructive | Safe to test |

## 15. Error handling and debugging

Bash does not stop on errors by default; it carries on to the next line. Reliable scripts decide explicitly what happens on failure: check the commands that matter, clean up on the way out, and report where things went wrong.

**Checking commands explicitly**

```bash
if ! cp "$src" "$dst"; then
    echo "copy failed" >&2
    exit 1
fi

cp "$src" "$dst" || { echo "copy failed" >&2; exit 1; }

mkdir -p "$dir" || exit                 # bare 'exit' reuses the failing status
grep -q pattern file || true            # tolerate a non-match under set -e
```

**trap: run code on signals and exit**

```bash
tmp=$(mktemp -d)
cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT                       # runs on normal exit, on error exit, and on most signals

trap 'echo "interrupted" >&2; exit 130' INT
trap 'echo "terminated" >&2; exit 143' TERM
trap - EXIT                              # remove a trap
trap -p                                  # list active traps
```

The `EXIT` trap is the single most useful one: put cleanup of temp files, locks and background jobs there and it runs no matter how the script ends. When a signal fires a trap, the handler's own `exit` decides the final status, so pass the right code deliberately (130 after Ctrl-C, 143 after SIGTERM).

**ERR trap with a location report**

```bash
set -Eeuo pipefail
trap 'echo "error: line $LINENO: command \"$BASH_COMMAND\" exited with $?" >&2' ERR
```

`-E` makes functions and subshells inherit the ERR trap. A fuller stack trace:

```bash
on_err() {
    local rc=$? i
    echo "error (exit $rc) in ${BASH_SOURCE[1]}:${BASH_LINENO[0]}" >&2
    for (( i = 1; i < ${#FUNCNAME[@]}; i++ )); do
        echo "  at ${FUNCNAME[i]}() ${BASH_SOURCE[i]}:${BASH_LINENO[i-1]}" >&2
    done
}
trap on_err ERR
```

**Where set -e does not help**

```bash
set -e
f() { false; echo "still runs"; }
if f; then :; fi            # inside an 'if' condition, set -e is disabled for the whole function
f || echo "failed"           # same for the left side of ||
local x=$(false)            # status of 'local' (0) hides the failure; split declaration and assignment
```

Treat `set -e` as a safety net for forgotten checks, and write explicit checks for anything where the failure path matters.

**Debugging tools**

```bash
bash -n script.sh            # parse only, find syntax errors
bash -x script.sh            # trace every command as it runs
bash -v script.sh            # echo each line as it is read
set -x; ...; set +x          # trace only a section

export PS4='+ ${BASH_SOURCE##*/}:${LINENO}:${FUNCNAME[0]:-main}: '   # richer trace prefix
BASH_XTRACEFD=5; exec 5> trace.log      # send the trace to a file instead of stderr

declare -p var arr           # dump exact variable contents, including hidden characters
printf '%q\n' "$var"         # show a value with all special characters escaped
cat -A file                  # show tabs (^I), line endings ($), and control characters
```

**Static analysis: shellcheck**

```bash
shellcheck script.sh                 # find quoting bugs, bad tests, portability issues
shellcheck -x script.sh              # also follow sourced files
# shellcheck disable=SC2034          # suppress one warning on the next line (add a reason)
```

Run `shellcheck` in your editor and in CI. It catches most of the mistakes listed in section 19 before they run.

**A simple debug switch**

```bash
debug() { [[ ${DEBUG:-0} == 1 ]] && echo "[debug] $*" >&2; return 0; }
[[ ${TRACE:-0} == 1 ]] && set -x
```

**Dry-run pattern for destructive scripts**

```bash
run() {
    if [[ ${DRY_RUN:-0} == 1 ]]; then echo "[dry-run] $*" >&2; else "$@"; fi
}
run rm -rf -- "$target"
```

## 16. Processes, jobs and signals

A script can start work in the background, wait for it, stop it, and react to signals. The basics are short; the care goes into making sure background work is waited for and cleaned up, and that two copies of a script do not collide.

**Background jobs**

```bash
long_task &                  # run in background
pid=$!                       # PID of that job
echo "started $pid"
wait "$pid"                  # wait for one job; its exit status becomes wait's status
wait                         # wait for ALL background jobs
wait -n                      # wait for the NEXT one to finish (bash 4.3+)

kill "$pid"                  # send SIGTERM
kill -0 "$pid" 2>/dev/null   # test whether a process exists (sends no signal)
kill -9 "$pid"               # SIGKILL: cannot be caught, last resort
```

**Interactive job control** (works in a terminal, not usually in scripts)

```bash
cmd &        # start in background
jobs         # list jobs
fg %1        # bring job 1 to the foreground
bg %1        # resume a stopped job in the background
Ctrl-Z       # suspend the foreground job
disown %1    # detach a job from the shell so it survives logout
nohup cmd > out.log 2>&1 &   # keep running after the terminal closes
```

**Run jobs in parallel with a concurrency limit**

```bash
# 1. xargs: simplest
printf '%s\n' "${urls[@]}" | xargs -P 4 -n 1 curl -fsSO

# 2. Pure bash: at most N jobs at once
max=4
for item in "${items[@]}"; do
    while (( $(jobs -rp | wc -l) >= max )); do wait -n; done
    process "$item" &
done
wait

# 3. GNU parallel, if installed
parallel -j4 gzip ::: *.log
```

**Signals**

| Signal | Number | Default / typical use |
| --- | --- | --- |
| `SIGHUP` | 1 | Terminal closed; daemons reload config |
| `SIGINT` | 2 | Ctrl-C |
| `SIGQUIT` | 3 | Ctrl-\\, quit with core dump |
| `SIGKILL` | 9 | Immediate kill, cannot be trapped |
| `SIGTERM` | 15 | Polite request to stop (the default of `kill`) |
| `SIGSTOP` | 19 | Pause, cannot be trapped |
| `SIGCONT` | 18 | Resume a stopped process |
| `SIGUSR1` `SIGUSR2` | 10, 12 | Application-defined |

```bash
trap 'echo "got SIGUSR1"' USR1
kill -USR1 $$                          # signal yourself

# Stop background children when the script exits
trap 'kill $(jobs -p) 2>/dev/null' EXIT
```

**Timeouts**

```bash
timeout 10 slow_command              # SIGTERM after 10 seconds; exit status 124 on timeout
timeout -k 5 30 cmd                  # then SIGKILL if it ignores TERM for 5 more seconds
read -t 5 -r answer                  # time-limited read
curl --max-time 10 "$url"            # tool-specific timeout
```

**Preventing two copies from running: flock**

```bash
exec 9> /var/lock/myscript.lock
flock -n 9 || { echo "already running" >&2; exit 1; }
# ... critical section; the lock is released when the script exits

# or wrap a single command
flock -n /var/lock/job.lock ./job.sh
```

A lock file made with `[[ -e lock ]] || touch lock` has a race between the test and the creation. `flock` is atomic and releases automatically when the process dies, so a crashed script cannot leave a stale lock.

**Inspecting processes**

```bash
ps aux | grep '[n]ginx'              # the [n] trick stops grep matching itself
pgrep -f 'my_script.sh'              # PIDs by pattern (pkill to signal them)
pidof nginx                          # PIDs by exact program name
lsof -i :8080                        # who is using a port
lsof -p "$pid"                       # files a process has open
nice -n 10 cmd                       # lower priority
setsid cmd                           # run in a new session
```

**Running a command as another user or with a clean sudo**

```bash
sudo -u postgres psql -c 'select 1'
sudo -n true 2>/dev/null || echo "sudo needs a password"     # check without prompting
```

## 17. Files, dates and system tasks

This section collects the everyday operations scripts perform on the filesystem and the clock, with the safe variant of each. The recurring theme: never build a path from an unchecked variable, and always use `--` and quotes with names you did not write yourself.

**Safe file handling**

```bash
tmpfile=$(mktemp)                       # unique temp file, mode 600
tmpdir=$(mktemp -d)                     # unique temp directory
tmpfile=$(mktemp "${TMPDIR:-/tmp}/myapp.XXXXXX")   # custom template
trap 'rm -rf "$tmpdir"' EXIT            # always clean up

mkdir -p "$dir"                         # create, no error if present, creates parents
rm -rf -- "${dir:?}/"*                  # ${dir:?} aborts if dir is empty, so you never run rm -rf /*
cp -a src/ dst/                         # archive copy: preserves permissions, times, symlinks
cp -n src dst                           # do not overwrite
mv -n src dst                           # do not overwrite
ln -s /real/path linkname               # symbolic link
rsync -a --delete src/ dst/             # mirror a directory (trailing slash on src matters)
install -m 644 -D file /dest/dir/file   # copy with mode, creating directories
```

**Atomic writes** (readers never see a half-written file)

```bash
tmp=$(mktemp "${target}.XXXXXX")
generate > "$tmp" && mv -f "$tmp" "$target"    # rename is atomic on the same filesystem
```

**Inspecting files**

```bash
stat -c '%s bytes, mode %a, owner %U, modified %y' file     # GNU stat
stat -c %s file                          # size in bytes only
wc -c < file                             # size, portable
du -sh dir                               # total size of a directory
df -h /                                  # free space on a filesystem
file image.bin                           # detect file type
sha256sum file > file.sha256            # checksum; verify with sha256sum -c file.sha256
readlink -f path                         # absolute path with symlinks resolved
realpath path                            # same idea
dirname "$p"; basename "$p" .txt        # path parts (or use parameter expansion)
```

**Permissions**

```bash
chmod 755 script.sh          # rwxr-xr-x
chmod u+x,go-w file          # symbolic form
chmod -R u=rwX,go=rX dir     # capital X: execute only on directories and already-executable files
chown user:group file
umask 027                    # new files are created without group-write and world access
```

| Octal | Symbolic | Typical use |
| --- | --- | --- |
| 600 | rw------- | Private files, keys |
| 644 | rw-r--r-- | Regular files |
| 700 | rwx------ | Private directories and scripts |
| 755 | rwxr-xr-x | Public directories, executables |
| 1777 | rwxrwxrwt | Shared temp directories (sticky bit) |

**Dates and times**

```bash
date                              # now
date +%F                          # 2026-10-14
date +%T                          # 10:10:05
date +%Y%m%d_%H%M%S               # 20261014_101005  (good for file names)
date -u +%Y-%m-%dT%H:%M:%SZ       # ISO 8601 in UTC
date +%s                          # Unix timestamp
date -d @1700000000               # timestamp to date (GNU)
date -d 'yesterday' +%F           # relative dates (GNU)
date -d '2026-10-14 +30 days' +%F
printf '%(%F %T)T\n' -1           # current time with no external process (bash 4.2+)

start=$(date +%s); ...; echo "took $(( $(date +%s) - start ))s"
```

Common `date` format codes: `%Y` year, `%m` month, `%d` day, `%H` hour (24h), `%M` minute, `%S` second, `%A` weekday name, `%j` day of year, `%Z` time zone, `%z` numeric offset. The relative-date forms (`-d 'yesterday'`) are GNU-specific; macOS/BSD `date` uses `-v-1d`.

**Archives and compression**

```bash
tar -czf backup.tar.gz dir/          # create gzip archive
tar -xzf backup.tar.gz -C /dest      # extract into /dest
tar -tf backup.tar.gz                # list contents
tar --exclude='*.log' -czf b.tgz dir # exclude pattern
gzip -k file; gunzip file.gz         # compress (keep original with -k) / decompress
zstd -T0 file                        # fast, multi-threaded compression
zip -r out.zip dir/; unzip -l out.zip
```

**Network helpers**

```bash
curl -fsSL -o file.tgz "$url"                 # download, fail on HTTP error, follow redirects
curl -fsS -X POST -H 'Content-Type: application/json' -d '{"a":1}' "$url"
curl -s -o /dev/null -w '%{http_code}\n' "$url"   # just the HTTP status code
wget -q -O - "$url"
ping -c1 -W2 host &>/dev/null && echo up
nc -z -w2 host 22 && echo "port open"          # TCP port check
```

**Writing scripts that are safe under cron or systemd**

```bash
# cron has a minimal environment: set PATH, use absolute paths, log somewhere
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
cd "$(dirname "$(readlink -f "$0")")" || exit 1
exec >> /var/log/myjob.log 2>&1
echo "=== $(date -Is) start ==="
```

In a crontab, `%` has a special meaning and must be written `\%` inside the command. Add `flock` (section 16) so slow runs do not overlap.

## 18. Ready-to-use templates

These are the patterns that show up in most production scripts. Copy the skeleton, delete what you do not need, and keep the structure: a `main` function, small helpers, and cleanup in a trap.

**A robust script skeleton**

```bash
#!/usr/bin/env bash
#
# deploy.sh - short description of what this script does
#
# Usage: deploy.sh [-n] [-v] ENVIRONMENT

set -Eeuo pipefail
IFS=$'\n\t'

readonly SCRIPT_NAME="${0##*/}"
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# ---- defaults ----
dry_run=0
verbose=0

# ---- helpers ----
usage() {
    cat <<EOF
Usage: $SCRIPT_NAME [-n] [-v] ENVIRONMENT
  -n   dry run (print actions, change nothing)
  -v   verbose output
  -h   this help
EOF
}

log()  { printf '%s [%s] %s\n' "$(date +%T)" "$1" "${*:2}" >&2; }
info() { log INFO "$@"; }
warn() { log WARN "$@"; }
die()  { log ERROR "$@"; exit 1; }
debug(){ (( verbose )) && log DEBUG "$@" || true; }

run() {
    if (( dry_run )); then log DRY "$*"; else "$@"; fi
}

cleanup() {
    local rc=$?
    [[ -n ${tmpdir:-} ]] && rm -rf -- "$tmpdir"
    exit "$rc"
}
trap cleanup EXIT
trap 'die "failed at line $LINENO: $BASH_COMMAND"' ERR

parse_args() {
    local opt
    while getopts ':nvh' opt; do
        case $opt in
            n) dry_run=1 ;;
            v) verbose=1 ;;
            h) usage; exit 0 ;;
            *) usage >&2; exit 2 ;;
        esac
    done
    shift $(( OPTIND - 1 ))
    (( $# == 1 )) || { usage >&2; exit 2; }
    env_name=$1
}

main() {
    parse_args "$@"
    command -v rsync >/dev/null || die "rsync is required"
    tmpdir=$(mktemp -d)
    info "deploying to $env_name"
    run rsync -a build/ "deploy@$env_name:/srv/app/"
    info "done"
}

main "$@"
```

**Retry with backoff**

```bash
retry() {
    local max=$1 delay=$2; shift 2
    local n=1
    until "$@"; do
        if (( n >= max )); then
            echo "giving up after $n attempts: $*" >&2
            return 1
        fi
        echo "attempt $n failed; retrying in ${delay}s" >&2
        sleep "$delay"
        (( n++, delay *= 2 ))
    done
}
retry 5 1 curl -fsS "$url"          # up to 5 tries, delays 1s, 2s, 4s, 8s
```

**Confirmation prompt**

```bash
confirm() {
    local reply
    read -r -p "${1:-Are you sure?} [y/N] " reply
    [[ ${reply,,} == y || ${reply,,} == yes ]]
}
confirm "Delete all logs?" || exit 1
```

**Colored logging that respects pipes**

```bash
if [[ -t 2 ]]; then
    c_red=$'\e[31m'; c_yel=$'\e[33m'; c_grn=$'\e[32m'; c_off=$'\e[0m'
else
    c_red=; c_yel=; c_grn=; c_off=
fi
error() { echo "${c_red}ERROR${c_off} $*" >&2; }
warn()  { echo "${c_yel}WARN${c_off}  $*" >&2; }
ok()    { echo "${c_grn}OK${c_off}    $*" >&2; }
```

**Log to a file and the screen at once**

```bash
exec > >(tee -a "$logfile") 2>&1
```

**Progress bar and spinner**

```bash
progress() {      # progress CURRENT TOTAL
    local cur=$1 tot=$2 width=40 filled
    filled=$(( cur * width / tot ))
    printf '\r[%-*s] %3d%%' "$width" "$(printf '#%.0s' $(seq 1 "$filled"))" $(( cur * 100 / tot ))
}
for i in {1..20}; do progress "$i" 20; sleep 0.1; done; echo
```

**Menu with validation**

```bash
while true; do
    read -r -p "Pick a number 1-3: " n
    [[ $n =~ ^[1-3]$ ]] && break
    echo "invalid"
done
```

**Process every file in a directory tree, safely**

```bash
find "$root" -type f -name '*.log' -print0 |
while IFS= read -r -d '' f; do
    echo "processing: $f"
done
```

**Batch rename**

```bash
for f in *.JPG; do mv -n -- "$f" "${f%.JPG}.jpg"; done               # change extension
for f in *\ *; do mv -n -- "$f" "${f// /_}"; done                    # spaces to underscores
for f in IMG_*.jpg; do mv -n -- "$f" "2026-${f#IMG_}"; done          # add a prefix
```

**Wait until a service is ready**

```bash
wait_for_port() {      # wait_for_port HOST PORT [TIMEOUT]
    local host=$1 port=$2 timeout=${3:-30} i
    for (( i = 0; i < timeout; i++ )); do
        (exec 3<>"/dev/tcp/$host/$port") 2>/dev/null && return 0
        sleep 1
    done
    return 1
}
wait_for_port db.internal 5432 60 || die "database not reachable"
```

The `/dev/tcp/host/port` path is a bash feature (not a real file) that opens a TCP connection without needing `nc`.

**Config file in KEY=VALUE format, parsed without executing it**

```bash
declare -A cfg
while IFS='=' read -r key value; do
    [[ -z $key || $key == \#* ]] && continue      # skip blanks and comments
    cfg["$key"]=$value
done < settings.conf
echo "${cfg[host]}"
```

Unlike `source settings.conf`, this never runs code that appears in the file.

## 19. Pitfalls and best practices

These are the mistakes behind most bash incidents, each paired with the fix. If you only read one section twice, make it this one.

| Mistake | Why it bites | Fix |
| --- | --- | --- |
| `rm -rf $dir/*` | If `dir` is empty this becomes `rm -rf /*` | `rm -rf -- "${dir:?}"/*` |
| `for f in $(ls)` | Splits on spaces, breaks on odd names | `for f in *` or `find ... -print0` |
| `cat file \| while read` then using variables afterwards | The loop runs in a subshell, variables are lost | `while read ...; done < file` |
| `[ $x = foo ]` with `x` empty | Becomes `[ = foo ]`, a syntax error | `[[ $x == foo ]]` or `[ "$x" = foo ]` |
| `x = 5` | Runs a command named `x` | `x=5` with no spaces |
| `if [ $a -eq $b ]` with non-numbers | Error, comparison skipped | Validate first: `[[ $a =~ ^[0-9]+$ ]]` |
| `cd dir; rm *` | If `cd` fails you delete in the wrong place | `cd dir \|\| exit 1` or `( cd dir && rm * )` |
| `local v=$(cmd)` | The exit code of `cmd` is lost | `local v; v=$(cmd)` |
| `echo $var` | Splits and globs the value, `-n` and `-e` get eaten | `printf '%s\n' "$var"` |
| `cmd \| tee file` expecting `cmd`'s status | Status is `tee`'s unless `pipefail` is set | `set -o pipefail` or check `${PIPESTATUS[0]}` |
| `for i in {1..$n}` | Braces do not expand variables | `for (( i=1; i<=n; i++ ))` or `seq` |
| `[[ $s =~ "regex" ]]` | Quoted regex is matched literally | Store regex in a variable, use it unquoted |
| `ls \| grep` for file tests | Output parsing is fragile | Use globs, `find`, or `[[ -e ... ]]` |
| `$(( 08 + 1 ))` | Leading zero means octal, 08 is invalid | `$(( 10#08 + 1 ))` |
| `echo "$password"` in a process list | Arguments are visible in `ps` to other users | Pass secrets through stdin, files with mode 600, or environment |
| `eval "$user_input"` | Arbitrary command execution | Arrays, `printf -v`, namerefs, `case` allow-lists |
| Unquoted `$@` or `$*` | Arguments split and glob again | Always `"$@"` |
| Parsing `ls` or `ps` output | Format varies, breaks on spaces | `stat`, `find -printf`, `pgrep`, `ps -o` with explicit columns |
| `kill -9` first | Skips cleanup handlers | Send TERM, wait, then KILL |
| Temp file named `/tmp/myfile` | Predictable name: race conditions and symlink attacks | `mktemp` |

**Defensive habits**

1. Start every script with `set -Eeuo pipefail` and a `trap ... EXIT` for cleanup.
2. Quote every expansion: `"$var"`, `"$@"`, `"${arr[@]}"`, `"$(cmd)"`.
3. Use `[[ ]]` for tests and `(( ))` for arithmetic in bash scripts.
4. Declare function variables with `local`, and separate declaration from command substitution.
5. Use `--` before file arguments that may begin with a dash: `rm -- "$f"`.
6. Use NUL-delimited streams (`-print0`, `read -d ''`, `xargs -0`) for file names.
7. Check that required commands, files and variables exist at the top, and fail with a clear message.
8. Send diagnostics to stderr, data to stdout, and set exit codes deliberately.
9. Never put secrets in command-line arguments; prefer environment variables, stdin or restricted-permission files.
10. Add a `--dry-run` option to anything that deletes or overwrites.
11. Run `shellcheck` and test with `bash -n` and `bash -x`.
12. When the script exceeds roughly 200 lines, needs real data structures, JSON handling or heavy string work, move to Python or Go.

**Style conventions**

| Topic | Common convention |
| --- | --- |
| Constants and exported variables | `UPPER_CASE` |
| Local and script variables | `lower_case` |
| Functions | `lower_case`, verbs: `parse_args`, `backup_db` |
| Indentation | 2 or 4 spaces, consistently (tabs are required only for `<<-` heredocs) |
| Line length | Around 80 to 100 columns, break long pipelines at `\|` and `&&` |
| Command substitution | `$(...)`, never backticks |
| Tests | `[[ ]]`, never `[ ]` with `-a`/`-o` |
| Comments | Explain why, not what; add a usage block at the top |
| Naming temp and lock files | Include the script name and use `mktemp` |

**Portability notes: bash versus POSIX sh**

| Feature | bash | POSIX sh (dash, ash) |
| --- | --- | --- |
| `[[ ]]`, `=~` | Yes | No, use `[ ]` and `case` |
| Arrays, associative arrays | Yes | No |
| `<(cmd)` process substitution | Yes | No |
| `local` | Yes | Widely supported but not in the standard |
| `$'...'` strings | Yes | No |
| `{1..5}` brace ranges | Yes | No, use `seq` |
| `function name { }` | Yes | No, use `name() { }` |
| `source file` | Yes | No, use `. file` |
| `echo -e`, `echo -n` | Works | Behavior varies, use `printf` |
| `&>` and `\|&` | Yes | No, use `> f 2>&1` |
| `set -o pipefail` | Yes | Added in POSIX 2024, not everywhere yet |

macOS ships bash 3.2 as `/bin/bash` (no associative arrays, no `mapfile`, no `${var,,}`) and BSD versions of `sed`, `date`, `stat` and `readlink`. If a script must run there, install a current bash or restrict yourself to the common subset.

## 20. Quick reference

A compressed lookup for when you know what you want and need the exact spelling. Details live in the sections above.

**One-line syntax recap**

| Task | Syntax |
| --- | --- |
| Variable | `x=5` · `"$x"` · `"${x}"` |
| Command output into variable | `x=$(cmd)` |
| Default value | `${x:-default}` |
| Required variable | `${x:?message}` |
| Length | `${#x}` · array: `${#a[@]}` |
| Substring | `${x:offset:length}` |
| Remove prefix / suffix | `${x#pat}` `${x##pat}` · `${x%pat}` `${x%%pat}` |
| Replace | `${x/old/new}` · all: `${x//old/new}` |
| Upper / lower case | `${x^^}` · `${x,,}` |
| Indexed array | `a=(x y z)` · `${a[1]}` · `"${a[@]}"` · `a+=(w)` |
| Associative array | `declare -A m; m[k]=v; "${m[k]}"; "${!m[@]}"` |
| Arithmetic | `$(( a + b ))` · `(( a++ ))` |
| If | `if cond; then ...; elif ...; else ...; fi` |
| Case | `case $x in a\|b) ...;; *) ...;; esac` |
| For | `for x in list; do ...; done` · `for (( i=0; i<n; i++ ))` |
| While | `while cond; do ...; done` |
| Read lines | `while IFS= read -r l; do ...; done < file` |
| Function | `name() { local a=$1; ...; }` |
| Redirect | `> >> < 2> 2>&1 &>` |
| Pipe | `a \| b` · `a \|& b` |
| Here-doc / here-string | `<<EOF ... EOF` · `<<< "text"` |
| Command substitution | `$(cmd)` |
| Process substitution | `<(cmd)` · `>(cmd)` |
| Background / wait | `cmd &` · `wait` |
| Logical AND / OR | `a && b` · `a \|\| b` |
| Group / subshell | `{ a; b; }` · `( a; b )` |
| Trap | `trap 'cmd' EXIT ERR INT TERM` |

**Special variables**

| Variable | Value |
| --- | --- |
| `$0` | script name |
| `$1`..`$9` | arguments |
| `$#` | argument count |
| `"$@"` | all arguments, separate |
| `$?` | last exit status |
| `$$` | shell PID |
| `$!` | last background PID |
| `$_` | last argument of previous command |
| `$LINENO` | current line |
| `$RANDOM` | random 0-32767 |
| `$SECONDS` | seconds since start |
| `$BASH_SOURCE` | script file path |
| `$PIPESTATUS` | array of statuses in the last pipeline |
| `$IFS` | field separator |
| `$REPLY` | default variable for `read` and `select` |

**Test operators at a glance**

| Category | Operators |
| --- | --- |
| File type | `-e -f -d -L -p -S -b -c` |
| File permission | `-r -w -x -u -g -k` |
| File properties | `-s` (non-empty), `-nt`, `-ot`, `-ef` |
| String | `-z -n == != < > =~` (regex) |
| Integer | `-eq -ne -lt -le -gt -ge` or `(( ))` |
| Variable state | `-v name` (set), `-R name` (nameref) |
| Logic in `[[ ]]` | `! && \|\|` and `( )` for grouping |

**File descriptor cheat table**

| Spelling | Meaning |
| --- | --- |
| `0` / `< file` | stdin |
| `1` / `> file` | stdout |
| `2` / `2> file` | stderr |
| `n>&m` | make fd n a copy of fd m |
| `n>&-` | close fd n |
| `n<> file` | open file read-write on fd n |
| `exec n> file` | keep fd n open for later commands |
| `/dev/null` | discards writes, reads empty |
| `/dev/stdin` `/dev/stdout` `/dev/stderr` | paths for fds 0, 1, 2 |
| `/dev/tcp/host/port` | bash TCP connection |

**Brace, tilde and glob summary**

| Form | Example | Result |
| --- | --- | --- |
| List | `{a,b}` | `a b` |
| Range | `{1..3}` | `1 2 3` |
| Step | `{0..10..5}` | `0 5 10` |
| Padded | `{01..03}` | `01 02 03` |
| Prefix/suffix | `f{1,2}.txt` | `f1.txt f2.txt` |
| Home | `~` | `/home/you` |
| Glob | `*.sh` | all matching names |

**Common exit codes**

| Code | Meaning |
| --- | --- |
| 0 | success |
| 1 | general error / grep: no match |
| 2 | misuse (bad arguments), grep: error |
| 124 | `timeout` expired |
| 126 | found but not executable |
| 127 | command not found |
| 130 | terminated by Ctrl-C (128 + 2) |
| 137 | killed by SIGKILL (128 + 9) |
| 143 | terminated by SIGTERM (128 + 15) |

**Useful `shopt` and `set` options**

| Option | Effect |
| --- | --- |
| `set -e` | exit on error |
| `set -u` | unset variable is an error |
| `set -o pipefail` | pipeline fails if any stage fails |
| `set -x` | trace commands |
| `set -f` | disable globbing |
| `set -C` | `>` refuses to overwrite existing files (`>\|` forces) |
| `shopt -s nullglob` | unmatched globs vanish |
| `shopt -s globstar` | enable `**` |
| `shopt -s extglob` | enable `?(...)`, `+(...)`, `!(...)` |
| `shopt -s dotglob` | `*` includes hidden files |
| `shopt -s lastpipe` | last pipeline stage runs in current shell |
| `shopt -s inherit_errexit` | command substitutions inherit `set -e` (bash 4.4+) |
| `shopt -s failglob` | unmatched glob is an error |

**Keyboard shortcuts in the interactive shell**

| Keys | Action |
| --- | --- |
| `Ctrl-R` | search history backwards |
| `Ctrl-A` / `Ctrl-E` | start / end of line |
| `Alt-B` / `Alt-F` | back / forward one word |
| `Ctrl-W` / `Alt-D` | delete word before / after cursor |
| `Ctrl-U` / `Ctrl-K` | delete to start / end of line |
| `Ctrl-L` | clear screen |
| `Ctrl-C` / `Ctrl-Z` | interrupt / suspend |
| `Ctrl-D` | end of input (exit shell on empty line) |
| `!!` | repeat last command (`sudo !!` to rerun with sudo) |
| `!$` | last argument of the previous command |
| `Alt-.` | insert last argument of the previous command |
| `Ctrl-X Ctrl-E` | edit the current line in `$EDITOR` |

**Learning and lookup**

```bash
help read           # documentation for a bash builtin
man bash            # the complete reference (search with /pattern)
type -a cmd         # every definition of cmd: alias, function, builtin, file
man 7 glob          # glob syntax
man 7 regex         # regular expression syntax
```
