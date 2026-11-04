---
title: 'Advanced AWK Cheatsheet'
description: 'Advanced AWK recipes'
date: '2026-11-03'
lang: en
category: TECH
tags: [linux, awk, gawk, cheatsheet, text-processing]
---

A companion to the [AWK fundamentals cheatsheet](/blog/awk-cheatsheet). Portable recipes use `awk`; GNU extensions use `gawk`. Shell commands are in `bash` blocks; standalone AWK source is in `awk` blocks.

Time references: [functions, UTC, time zones and DST](/blog/awk-timeFunctions-cheatsheet) and [copyable time one-liners](/blog/awkTimeOneLiners-cheatsheet).

## User-Defined Variables

```bash
# Assign variables
awk 'BEGIN {count=0} {count++} END {print count}' file.txt
```

```bash
# Pre-set variables via command line
awk -v name="John" '{print name, $1}' file.txt
```

```bash
# Multiple variables
awk -v var1="hello" -v var2="world" 'BEGIN {print var1, var2}'
```

## User-Defined Functions

```bash
# Function definition and usage
awk '
function square(x) {
    return x * x
}
{
    print $1, square($1)
}' numbers.txt
```

## Advanced Array Techniques

```bash
# Arrays of arrays (GNU AWK)
gawk '{
    data[$1][$2] = $3

    # Access later with:
    # print data["key1"]["key2"]
}'
```

```bash
# Array sorting (GNU AWK)
gawk '
{
    count[$1]++
}
END {
    PROCINFO["sorted_in"] = "@val_num_desc"  # Sort by value numerically descending
    for (word in count)
        print word, count[word]
}' file.txt
```

```bash
# Array functions
awk '
BEGIN {
    n = split("one two three", arr)  # Creates arr[1]="one", arr[2]="two", etc.

    # Join array elements
    str = arr[1]
    for (i=2; i<=n; i++)
        str = str " + " arr[i]
    print str
}'
```

## Output Redirection

```bash
# Write to different files based on content
awk '{
    if ($3 > 100)
        print > "high_values.txt"
    else
        print > "low_values.txt"
}' data.txt
```

```bash
# Append to files
awk '{print >> "output.txt"}' data.txt
```

```bash
# Execute a fixed shell command once; inspect its status
awk 'BEGIN {status = system("date -u"); if (status != 0) exit 1}'
```

```bash
# For printing input data, use AWK directly
awk '{print $1}' file.txt
```

`>` truncates a destination when it is first opened in that AWK process, then keeps writing to the open stream. `>>` appends. Closing and reopening a `>` stream truncates it again. Input-derived shell commands passed to `system()` or a pipe require shell quoting; prefer fixed commands and pass data through standard input.

## Process Management

```bash
# Pipe output to another command
awk '{print $1 | "sort"} END {close("sort")}' file.txt
```

```bash
# Read command output
awk '
BEGIN {
    cmd = "date"
    result = (cmd | getline current_date)
    close(cmd)
    if (result > 0) print "Today is", current_date
    else exit 1
}'
```

## Regular Expression Extensions

```bash
# Capture groups with GAWK
gawk 'match($0, /([0-9]+)-([0-9]+)/, arr) {
    print "First number:", arr[1]
    print "Second number:", arr[2]
}' file.txt
```

```bash
# Case-insensitive matching
awk 'tolower($0) ~ /pattern/' file.txt
```

## Bit Manipulation (GNU AWK)

```bash
# Bitwise operations
gawk 'BEGIN {
    a = 5      # 101 in binary
    b = 3      # 011 in binary

    print "AND:", and(a, b)      # 1 (001)
    print "OR:", or(a, b)        # 7 (111)
    print "XOR:", xor(a, b)      # 6 (110)
    print "Complement:", compl(a) # Bitwise NOT
    print "Left shift:", lshift(a, 1)  # 10 (1010)
    print "Right shift:", rshift(a, 1) # 2 (010)
}'
```

## Time Functions (GNU AWK)

`mktime()` uses the process time zone unless its second argument is nonzero (UTC). Unix timestamps themselves identify instants independently of a time zone.

```bash
# Get current time
gawk 'BEGIN {
    current_time = systime()  # Unix timestamp
    print strftime("%Y-%m-%d %H:%M:%S", current_time)
}'
```

```bash
# Parse timestamps
gawk '
BEGIN {
    timestamp = mktime("2023 12 31 23 59 59")
    print timestamp
    print strftime("%A, %B %d, %Y", timestamp)
}'
```

## Network Programming (GNU AWK)

```bash
# Simple TCP client: requires a local HTTP server on port 8080
gawk 'BEGIN {
    Port = 8080
    Host = "localhost"
    Service = "/inet/tcp/0/" Host "/" Port

    printf "GET / HTTP/1.0\r\nHost: %s\r\nConnection: close\r\n\r\n", Host |& Service
    fflush(Service)

    while ((status = (Service |& getline)) > 0)
        print $0

    close(Service)
    if (status < 0) exit 1
}'
```

GNU AWK must be built with socket support. This is plain TCP/HTTP, without TLS. The peer must respond and close the connection; GNU AWK supports `PROCINFO[Service, "READ_TIMEOUT"] = 5000` to limit an individual read to 5 seconds. That does not bound the entire connection lifetime.

## Internationalization (GNU AWK)

```bash
# Select an installed locale before starting the process
LC_ALL=fr_FR.UTF-8 gawk 'BEGIN {print strftime("%A, %B %d, %Y")}'
```

```bash
# Inspect available locale names
locale -a
```

```bash
# gettext-style translation lookup (requires a matching message catalog)
gawk 'BEGIN {TEXTDOMAIN="myapp"; print dcgettext("Hello", TEXTDOMAIN)}'
```

Changing `ENVIRON["LC_ALL"]` after startup does not reinitialize AWK's locale. `LC_TIME` controls date names; `LC_ALL` overrides individual locale categories. Install the desired locale before using it. Translation lookup returns the original text when no translation is available.

## Profiling and Debugging

```bash
# Timing execution
gawk 'BEGIN {start=systime()}
     {total += $1}
     END {print "Total:", total + 0; print "Took", systime()-start, "seconds"}' numbers.txt
```

```bash
# Debug print statements
awk '{print "DEBUG: processing line " NR " with " NF " fields" > "/dev/stderr"; print $1}' file.txt
```

```bash
# GNU AWK execution counts and interactive debugger
gawk --profile=awkprof.out -f script.awk file.txt
```

```bash
gawk --debug -f script.awk file.txt
```

## Advanced String Manipulation

```bash
# Generate formatted output with printf
awk '{printf "%-15s %8.2f %10s\n", $1, $2, $3}' file.txt
```

```bash
# NUL-separated records (GNU AWK; e.g. filenames from find)
find . -type f -print0 | gawk 'BEGIN {RS=ORS="\0"} /[.]log$/ {print}'
```

```bash
# Fixed-width fields within each newline-separated record (GNU AWK)
gawk 'BEGIN {FIELDWIDTHS="5 10 15"} {print $1, $2, $3}' fixed.txt
```

```bash
# Fixed-length records: consume groups of 8 characters (GNU AWK, C locale)
LC_ALL=C gawk 'BEGIN {RS=".{8}"} {if (RT != "") print RT} END {if ($0 != "") print $0}' records.bin
```

`FIELDWIDTHS` controls field splitting, not record length. With regex `RS`, GNU AWK stores the matched record separator in `RT`; the fixed-length example emits each full chunk and any final short chunk. Keep `ORS="\0"` when forwarding arbitrary filenames. AWK is still a text-processing language: use a binary-aware tool for structured binary formats. In multibyte locales widths usually count characters; `LC_ALL=C` makes the chunk example byte-oriented.

`systime()` has one-second resolution and measures wall-clock time, which may jump. Use shell `time` for practical elapsed-time measurements; use a monotonic clock in another tool for precise benchmarking.

## AWKPATH and Libraries

```bash
# Set path for modules
export AWKPATH=".:/usr/local/share/awk"

# Save as my_library.awk in one of those directories
# function library_function(x) { return x * x }

# Using modules (GNU AWK)
gawk '@include "my_library.awk"
     {
         # Now you can use functions from my_library.awk
         result = library_function($1)
         print result
     }' file.txt
```

Only load trusted libraries. Setting `AWKPATH` replaces the search path; include any installation-specific directories you still need.

## State Management Between AWK Runs

```bash
# Save state to a file and read it back later
awk 'BEGIN {printf "%s", "" > "state.txt"}
     {count[$1]++}
     END {
         for (word in count)
             print word, count[word] > "state.txt"
     }' file1.txt

# Later, in another run:
awk 'BEGIN {
         while ((status = (getline line < "state.txt")) > 0) {
             split(line, fields)
             saved[fields[1]] = fields[2]
         }
         close("state.txt")
         if (status < 0) {
             print "Cannot read state.txt" > "/dev/stderr"
             exit 1
         }
     }
     {
         # Now use the saved state
         print $1, "Previous count:", saved[$1]
     }' file2.txt
```

`getline` returns 1 for a record, 0 for EOF, and -1 for an error. Testing it merely as a Boolean treats -1 as true and can loop forever. The state format above assumes keys contain no whitespace; use an escaping format for arbitrary keys. The initial truncation also clears stale state when the new input is empty.

## More Array and I/O Recipes

### Local function variables and array parameters

```bash
# Variables after the extra spacing are local by convention, not special syntax
awk '
function average(values, n,    i, total) {
    for (i=1; i<=n; i++) total += values[i]
    return n ? total/n : 0
}
BEGIN {n=split("10 20 30", a); print average(a,n)}'
# Output: 20
```

Omitted scalar parameters start uninitialized and can serve as locals. Scalar arguments are passed by value; arrays by reference. Do not pass extra arguments into positions you intend to use as local variables.

### Sort values or keys (GNU AWK)

```bash
gawk 'BEGIN {
    a["bob"]=20; a["alice"]=10
    n=asorti(a, keys)
    for (i=1; i<=n; i++) print keys[i], a[keys[i]]
    n=asort(a, values)
    for (i=1; i<=n; i++) print values[i]
}'
# Keys: alice 10, bob 20; values: 10, 20
```

`asort()` sorts values; `asorti()` sorts indices. Both return a count and can write to a separate destination array. `PROCINFO["sorted_in"]` controls subsequent `for (key in array)` loops globally; delete that element to restore unspecified iteration order.

### Composite subscripts in portable AWK

```bash
printf 'eu web 3
eu api 7
' | awk '{n[$1,$2]+=$3} END {print n["eu","web"], n["eu","api"]}'
# Output: 3 7
```

### Close dynamic output streams

```bash
# Input: validated numeric group_id followed by other fields
awk '$1 ~ /^[0-9]+$/ {
    destination="group-" $1 ".txt"
    print >> destination
    close(destination)
}' groups.txt
```

Appending survives closing and reopening a stream. This bounds open files but preserves content from previous runs; use a fresh output directory when each run must produce a new report.

### Avoid field reconstruction when preserving formatting

```bash
# sub() modifies a copy of the complete record, preserving unrelated spacing
awk '{line=$0; sub(/pending/, "done", line); print line}' tasks.txt
```

```bash
# GNU AWK gensub() returns a string without changing its input
gawk '{print gensub(/([0-9]+)-([0-9]+)/, "\\2/\\1", "g", $0)}' codes.txt
```

The value from `compl()` depends on the integer width/precision used by the build. Bitwise examples assume nonnegative integers representable exactly; negative inputs are invalid for GNU AWK bitwise functions.

## Further Reading

- [GNU AWK manual](https://www.gnu.org/software/gawk/manual/gawk.html)
- [GNU AWK I/O functions](https://www.gnu.org/software/gawk/manual/html_node/I_002fO-Functions.html)
- [GNU AWK TCP/IP networking](https://www.gnu.org/software/gawk/manual/html_node/TCP_002fIP-Networking.html)
