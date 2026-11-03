---
title: 'AWK Cheatsheet'
description: 'A practical AWK reference'
date: '2026-11-03'
lang: en
category: TECH
tags: [linux, awk, cheatsheet, text-processing]
---

## Introduction

AWK is a powerful text processing language used for data extraction and reporting.

Most recipes use POSIX AWK. Extensions are explicitly marked **GNU AWK** and use `gawk`; the command `awk` may select a different implementation on your system. Shell commands use single quotes to protect AWK's dollar signs from shell expansion.

Related references: [advanced AWK](/blog/awk-cheatsheet-advanced), [time functions and time zones](/blog/awk-timeFunctions-cheatsheet), and [time one-liners](/blog/awkTimeOneLiners-cheatsheet).

## Basic Syntax

```bash
awk 'pattern {action}' filename
```

## Command Structure

- **Pattern**: Condition to match (optional)
- **Action**: Commands to execute when pattern matches (optional)
- If pattern is omitted, action applies to all input records
- If action is omitted, print the entire record

A record is normally a line; changing `RS` changes the record boundary. Fields are numbered from 1. With the default `FS=" "`, runs of spaces and tabs separate fields and leading/trailing whitespace is ignored.

## Special Variables

| Variable        | Description                                            |
| --------------- | ------------------------------------------------------ |
| `$0`            | The entire current line                                |
| `$1`, `$2`, ... | The 1st, 2nd, etc. field in current line               |
| `NF`            | Number of fields in current line                       |
| `$NF`           | The last field in the current line                     |
| `NR`            | Current line number (cumulative across multiple files) |
| `FNR`           | Current line number in current file                    |
| `FS`            | Field separator (default: whitespace)                  |
| `RS`            | Record separator (default: newline)                    |
| `OFS`           | Output field separator (default: space)                |
| `ORS`           | Output record separator (default: newline)             |
| `FILENAME`      | Current input filename                                 |
| `ARGC`          | Number of command-line arguments                       |
| `ARGV`          | Array of command-line arguments                        |

## Common Patterns

| Pattern                                     | Description                               |
| ------------------------------------------- | ----------------------------------------- |
| `/regex/`                                   | Lines matching the regular expression     |
| `!/regex/`                                  | Lines NOT matching the regular expression |
| `pattern1 && pattern2`                      | Lines matching both patterns              |
| <code>pattern1 &#124;&#124; pattern2</code> | Lines matching either pattern             |
| `NR==n`                                     | Only line number n                        |
| `NR>=n && NR<=m`                            | Lines from n to m                         |
| `$n ~ /regex/`                              | Lines where field n matches regex         |
| `$n == "string"`                            | Lines where field n equals string         |
| `length($0) > n`                            | Lines longer than n characters            |
| `BEGIN`                                     | Execute before processing any input       |
| `END`                                       | Execute after processing all input        |

## Operators

### Arithmetic Operators

- `+` (addition)
- `-` (subtraction)
- `*` (multiplication)
- `/` (division)
- `%` (modulo)
- `^` (exponentiation); `**` is a non-POSIX spelling accepted by GNU AWK

### Comparison Operators

- `==` (equal to)
- `!=` (not equal to)
- `<` (less than)
- `<=` (less than or equal to)
- `>` (greater than)
- `>=` (greater than or equal to)
- `~` (matches regex)
- `!~` (does not match regex)

### Logical Operators

- `&&` (AND)
- `||` (OR)
- `!` (NOT)

## Control Structures

The following control-flow and array snippets belong inside an AWK action, such as `BEGIN { ... }` or a per-record `{ ... }` block. Names such as `condition` and `action` are placeholders.

### Conditional Statements

```awk
if (condition) {
    action1
} else if (condition2) {
    action2
} else {
    action3
}
```

### Loops

```awk
# For loop
for (i=1; i<=10; i++) {
    print i
}

# While loop
while (condition) {
    action
}

# Do-while loop
do {
    action
} while (condition)

# For-in loop (array iteration)
for (key in array) {
    print key, array[key]
}
```

## Built-in Functions

### String Functions

- `length(s)`: Returns the length of string s
- `index(s, t)`: Returns position of string t in s, or 0 if not found
- `substr(s, p, n)`: Returns n-character substring of s starting at p
- `sub(r, s, t)`: Replaces the first match in variable t; returns the substitution count (0 or 1)
- `gsub(r, s, t)`: Replaces all matches in variable t; returns the substitution count. Omit t to modify `$0`
- `match(s, r)`: Returns the 1-based match position, or 0; sets `RSTART` and `RLENGTH`
- `split(s, a, fs)`: Splits s into array a on field separator fs
- `tolower(s)`: Converts s to lowercase
- `toupper(s)`: Converts s to uppercase

### Mathematical Functions

- `int(x)`: Truncates x to an integer
- `sqrt(x)`: Square root of x
- `exp(x)`: Exponential of x
- `log(x)`: Natural logarithm of x
- `sin(x)`, `cos(x)`, `atan2(y, x)`: Trigonometric functions (angles in radians)
- Tangent: `sin(x) / cos(x)` where the denominator is nonzero; there is no built-in `tan()`
- `rand()`: Pseudorandom number in `[0, 1)`
- `srand(seed)`: Sets the random seed; use `srand()` once to seed from the current time

## Arrays

```awk
# Define array
array[key] = value

# Composite subscripts (joined internally with SUBSEP)
array[i,j] = value

# Delete array element
delete array[key]

# Check if index exists
if (key in array) { print array[key] }
```

`for (key in array)` has no guaranteed order. `array[i,j]` uses a composite string key; GNU AWK also supports actual arrays of arrays (see the advanced cheatsheet). Choose keys that cannot collide with `SUBSEP`.

## Common Usage Examples

### Print specific fields

```bash
# Print first field of each line
awk '{print $1}' file.txt

# Print first and third fields
awk '{print $1, $3}' file.txt

# Print last field
awk 'NF {print $NF}' file.txt  # Skip records with no fields

# Print line number and first field
awk '{print NR, $1}' file.txt
```

### Filter lines

```bash
# Print lines containing "pattern"
awk '/pattern/' file.txt

# Print lines where the third field is greater than 10
awk '$3 > 10' file.txt

# Print lines that don't start with a #
awk '!/^#/' file.txt
```

### Field separators

```bash
# Use : as field separator
awk -F: '{print $1}' /etc/passwd

# Change output field separator
awk 'BEGIN {OFS=","} {print $1, $2}' file.txt
```

### Calculations

```bash
# Sum the values in the first column
awk '{sum += $1} END {print sum + 0}' file.txt

# Calculate average of first column
awk 'NF {sum += $1; count++} END {if (count) print sum/count; else print "No data"}' file.txt

# Find minimum and maximum values
awk 'NF {
         value = $1 + 0
         if (!count++ || value < min) min = value
         if (count == 1 || value > max) max = value
     }
     END {if (count) print "Min:", min, "Max:", max; else print "No data"}' file.txt
```

These calculations assume numeric values in column 1 and no header. `NF` skips blank records; it does not validate a number. Use a format check when the source is untrusted.

### Text processing

```bash
# Convert to uppercase
awk '{print toupper($0)}' file.txt

# Print line length
awk '{print length($0)}' file.txt

# Replace text
awk '{gsub(/foo/, "bar"); print}' file.txt
```

### Advanced examples

```bash
# Count occurrences of each word
awk '{for(i=1;i<=NF;i++) count[$i]++}
     END {for(word in count) print word, count[word]}' file.txt

# Print lines between "START" and "END" patterns
awk '/START/,/END/' file.txt

# Remove duplicate lines globally, keeping the first occurrence
# uniq only removes adjacent duplicates unless input has first been grouped
awk '!seen[$0]++' file.txt

# Print every Nth line
awk 'NR % 5 == 0' file.txt  # Every 5th line
```

## Running AWK Scripts from Files

```bash
# Save AWK commands in a script file
awk -f script.awk file.txt
```

Contents of script.awk:

```awk
BEGIN {
    print "Starting processing..."
}

/pattern/ {
    # actions for lines matching pattern
}

END {
    print "Processing complete."
}
```

## Common Options

- `-F fs`: Set field separator
- `-v var=value`: Set variable
- `-f file`: Read AWK program from file
- **GNU AWK** `--posix`: Run in POSIX compatibility mode
- **GNU AWK** `--traditional`: Run in compatibility mode with traditional Unix awk

## Implementation Variants

- **Original AWK**: The original Bell Labs AWK
- **NAWK (New AWK)**: Enhanced version by the original authors
- **GAWK (GNU AWK)**: GNU implementation with extensions
- **MAWK**: Fast AWK implementation by Mike Brennan

## Tips and Tricks

- Use `awk '1'` to print all lines (shorthand for `awk '{print}'`)
- Use `awk '0'` to print no lines
- Redirect output: `awk '{print > "output.txt"}'`
- AWK can handle multiple input files: `awk 'commands' file1 file2`
- Use `getline` to read input programmatically
- Set custom field separators with regex: `awk -F'[,:]'`
- Debug with `print` statements

## Practical Recipes with Input and Output

### Filter and total a column

Input `sales.txt` (whitespace-separated, no header):

```text
alice books 12
bob games 8
alice books 5
```

```bash
awk '$2 == "books" {total += $3} END {print total + 0}' sales.txt
# Output: 17

awk '{total[$1] += $3} END {for (name in total) print name, total[name]}' sales.txt
# alice 17 and bob 8 (iteration order is unspecified)
```

### Change fields and rebuild the record

```bash
printf 'alice:reader:active
' | awk 'BEGIN {FS=OFS=":"} {$2="admin"; print}'
# Output: alice:admin:active
```

Assigning a field rebuilds `$0` with `OFS`. Assigning `OFS` alone does not replace separators in an untouched `$0`.

### Skip headers, pass parameters, and join files

```bash
# Skip the first record of each input file
awk 'FNR > 1' first.txt second.txt

# Pass a threshold without embedding shell data in AWK source
awk -v threshold=10 '$3 + 0 > threshold' sales.txt

# First file: user_id name; second file: user_id amount (no headers)
# The FILENAME test also handles an empty first file
awk 'FILENAME == ARGV[1] {name[$1]=$2; next} $1 in name {print name[$1], $2}' users.txt amounts.txt
```

The shorter `NR == FNR` join idiom assumes the first file is not empty. `next` skips the remaining rules for the current record; `exit` stops input processing but still runs `END` actions.

### Validate decimal input and format output

```bash
# Optional sign, decimal fraction and exponent; dot is the decimal separator
awk '$1 ~ /^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$/ {
    printf "%8.2f\n", $1
}' numbers.txt
```

Use `LC_ALL=C awk ...` when byte-oriented processing and predictable locale behavior are desired. It changes character classification and string handling too.

### Paragraphs and delimited text

```bash
# Empty RS groups nonempty lines into paragraph records
awk 'BEGIN {RS=""; ORS="\n\n"} /ERROR/' report.txt

# Simple comma-delimited input without quoting or embedded commas/newlines
awk -F, 'BEGIN {OFS=","} {print $1, $3}' simple.csv
```

`-F,` is not a general CSV parser. For quoted CSV, use a CSV-aware tool or GNU AWK's `--csv` on versions that support it (5.3+).

## Further Reading

- [GNU AWK manual](https://www.gnu.org/software/gawk/manual/gawk.html)
- [POSIX awk specification](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/awk.html)
