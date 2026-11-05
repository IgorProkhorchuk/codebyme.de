---
title: 'GNU AWK Time Functions Cheatsheet'
description: 'GNU AWK time functions'
date: '2026-11-03'
lang: en
category: TECH
tags: [linux, awk, gawk, cheatsheet, datetime, timezones]
---

A reference for parsing, formatting, comparing and aggregating dates with GNU AWK. Examples use `gawk` explicitly: these time functions are outside POSIX AWK, although other implementations may provide some of them.

Related cheatsheets: [AWK fundamentals](/blog/awk-cheatsheet), [advanced AWK](/blog/awk-cheatsheet-advanced), and [time one-liners](/blog/awkTimeOneLiners-cheatsheet).

## Quick Reference and Execution

| Function                                 | Result                                           | Time zone                                        |
| ---------------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `systime()`                              | Current Unix timestamp in seconds                | An instant; independent of display zone          |
| `mktime(datespec [, utc])`               | Calendar components converted to a timestamp     | Process zone by default; UTC when utc is nonzero |
| `strftime(format [, timestamp [, utc]])` | Formatted timestamp; omitted timestamp means now | Process zone by default; UTC when utc is nonzero |

Save an `awk` block as `example.awk`, then run it with an explicit zone when interpreting local dates:

```bash
TZ=Europe/Berlin gawk -f example.awk input.txt
# BEGIN-only examples need no input file
TZ=UTC0 gawk -f example.awk
```

- A Unix timestamp identifies an instant. A calendar string without an offset needs a time zone to identify an instant.
- `TZ` sets interpretation and display rules; `LC_TIME` affects language and formatting. Set locale variables before starting AWK.
- Numeric examples assume Unix/POSIX seconds and trusted, well-formed input unless validation is shown. They do not implement leap-second-aware elapsed time.
- Examples using IANA names require installed time-zone data. `Europe/Berlin` and `America/New_York` include historical/DST rules; `UTC0` is a fixed UTC zone.

## Getting Current Time

### Unix Timestamp (Seconds since January 1, 1970 UTC)

```awk
BEGIN {
    current_time = systime()
    print "Current timestamp:", current_time
}
```

### Formatted Current Date and Time

```awk
BEGIN {
    current_time = systime()
    print strftime("%Y-%m-%d", current_time)           # YYYY-MM-DD
    print strftime("%m/%d/%Y", current_time)           # MM/DD/YYYY
    print strftime("%A, %B %d, %Y", current_time)      # Localized names
    print strftime("%I:%M:%S %p", current_time)        # 12-hour clock
    print strftime("%H:%M:%S", current_time)           # 24-hour clock
    print strftime("%Y-%m-%d %H:%M:%S %z", current_time)
    print strftime("%Y-%m-%dT%H:%M:%SZ", current_time, 1) # Explicit UTC
}
```

Only append a literal `Z` when formatting in UTC. Including `%z` makes local timestamps distinguishable during a repeated DST hour.

## Creating Timestamps from Date/Time Values

`mktime()` expects `YYYY MM DD HH MM SS [DST]`, not an ISO string. Months are 1–12. The optional DST field and UTC argument serve different purposes:

| Setting                 | Meaning                                                     |
| ----------------------- | ----------------------------------------------------------- |
| DST omitted or negative | Let the system infer DST for this local date                |
| DST = 0                 | Interpret as standard time                                  |
| DST > 0                 | Interpret as daylight-saving time                           |
| Second argument = 1     | Interpret components as UTC; local DST rules are irrelevant |

```awk
BEGIN {
    timestamp = mktime("2023 12 31 23 59 59")
    print "New Year's Eve, local:", timestamp

    year = 2023; month = 12; day = 25
    christmas = mktime(sprintf("%d %d %d 00 00 00", year, month, day))
    print "Christmas, local:", christmas

    utc_timestamp = mktime("2023 12 31 23 59 59", 1)
    print strftime("%Y-%m-%dT%H:%M:%SZ", utc_timestamp, 1)
}
```

`mktime()` normalizes out-of-range components: February 30 can become a March date. A return value of -1 reports failure, but checking only -1 does not validate a date. On systems supporting pre-epoch dates, -1 also denotes the instant immediately before the epoch; validation recipes below deliberately accept years 1970–9999 only.

## Date/Time Arithmetic

### Elapsed Time versus Calendar Time

```awk
BEGIN {
    now = systime()
    print "24 hours later:", strftime("%Y-%m-%d %H:%M:%S %z", now + 86400)
    print "168 hours earlier:", strftime("%Y-%m-%d %H:%M:%S %z", now - 7*86400)

    # Next local calendar date, keeping the same wall-clock components
    split(strftime("%Y %m %d %H %M %S", now), p)
    tomorrow = mktime(sprintf("%d %d %d %d %d %d -1",
        p[1], p[2], p[3]+1, p[4], p[5], p[6]))
    print "Next calendar day:", strftime("%Y-%m-%d %H:%M:%S %z", tomorrow)

    # Calendar-day difference for date-only values: interpret BOTH dates in UTC
    date1 = mktime("2023 01 01 00 00 00", 1)
    date2 = mktime("2023 12 31 00 00 00", 1)
    print "Calendar days between dates:", (date2-date1)/86400 # 364
}
```

A local day can contain 23 or 25 hours at DST transitions. Keeping wall-clock components can also land in a gap or fold; define a policy for those cases (see DST below). UTC midnight arithmetic is suitable for counting calendar dates, not for measuring local-day duration.

### Add One Month: Normalize or Clamp

```awk
# UTC makes the month-end policy independent of local DST
function next_month_clamped(ts,    p, last, day) {
    split(strftime("%Y %m %d %H %M %S", ts, 1), p)
    # Day zero of the month after the target gives the target month's last day
    last = mktime(sprintf("%d %d 0 00 00 00", p[1], p[2]+2), 1)
    day = strftime("%d", last, 1) + 0
    if (p[3]+0 < day) day = p[3]+0
    return mktime(sprintf("%d %d %d %d %d %d",
        p[1], p[2]+1, day, p[4], p[5], p[6]), 1)
}
BEGIN {
    ts = mktime("2023 01 31 12 00 00", 1)
    normalized = mktime("2023 02 31 12 00 00", 1)
    print strftime("%F", normalized, 1)              # 2023-03-03
    print strftime("%F", next_month_clamped(ts), 1) # 2023-02-28
}
```

Normalization carries overflow into March; clamping keeps the last valid day in February. For recurring schedules, retain the original intended day separately: repeatedly clamping January 31 → February 28 → March 28 loses the original month-end intent.

## Parsing Dates from Input

### Known Formats (Trusted Input)

```awk
BEGIN {
    date_str = "2023-07-15"
    split(date_str, parts, "-")
    timestamp = mktime(parts[1] " " parts[2] " " parts[3] " 00 00 00")
    print "Parsed timestamp:", timestamp
    print strftime("%Y-%m-%d", timestamp)

    date_str = "07/15/2023"
    split(date_str, parts, "/")
    timestamp = mktime(parts[3] " " parts[1] " " parts[2] " 00 00 00")
    print "MM/DD/YYYY timestamp:", timestamp

    datetime_str = "2023-07-15 14:30:00"
    gsub(/[-:]/, " ", datetime_str)
    print "Local datetime timestamp:", mktime(datetime_str)
}
```

The third argument of `gsub()` must be a variable or field, not a concatenated expression. Copy `$1 " " $2` to a variable first; this also preserves the original log record.

### Strict Date/Time Validation with a Round Trip

Save as `parse-local.awk`. Input: `YYYY-MM-DD HH:MM:SS message`. Supports years 1970–9999, nonnegative resulting epochs and whole seconds 00–59. The returned -1 is an invalid-input sentinel for this restricted range.

```awk
function parse_local(text,    p, ts) {
    if (text !~ /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/)
        return -1
    split(text, p, /[- :]/)
    if (p[1]+0 < 1970 || p[2]+0 < 1 || p[2]+0 > 12 ||
        p[3]+0 < 1 || p[3]+0 > 31 || p[4]+0 > 23 ||
        p[5]+0 > 59 || p[6]+0 > 59) return -1
    ts = mktime(sprintf("%d %d %d %d %d %d -1",
        p[1], p[2], p[3], p[4], p[5], p[6]))
    if (ts < 0 || strftime("%Y-%m-%d %H:%M:%S", ts) != text)
        return -1
    return ts
}
{
    ts = parse_local($1 " " $2)
    if (ts == -1) {
        print "Invalid local datetime at record", NR > "/dev/stderr"
        next
    }
    print ts, $0
}
```

```bash
printf '2023-02-30 12:00:00 invalid\n2023-02-28 12:00:00 valid\n' | TZ=UTC0 gawk -f parse-local.awk
# stdout: 1677585600 2023-02-28 12:00:00 valid
# stderr: Invalid local datetime at record 1
```

The round trip rejects normalization and nonexistent local times. It cannot resolve a repeated local hour: both occurrences have the same wall-clock text. Require an explicit offset or DST policy for ambiguous input. For strict UTC parsing, use `mktime(..., 1)` and `strftime(..., ts, 1)` in the same helper.

### ISO 8601 / RFC 3339 with an Explicit Offset

This self-contained helper accepts exactly `YYYY-MM-DDTHH:MM:SSZ` or `YYYY-MM-DDTHH:MM:SS±HH:MM`, years 1970–9999. Fractional seconds and leap seconds are outside this recipe. Save as `parse-offset.awk`.

```awk
function parse_offset(text,    a, base, offset, sign) {
    if (!match(text, /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(Z|([+-])([0-9]{2}):([0-9]{2}))$/, a))
        return -1
    if (a[1]+0 < 1970 || a[2]+0 < 1 || a[2]+0 > 12 ||
        a[3]+0 < 1 || a[3]+0 > 31 || a[4]+0 > 23 ||
        a[5]+0 > 59 || a[6]+0 > 59) return -1
    base = mktime(sprintf("%d %d %d %d %d %d",
        a[1], a[2], a[3], a[4], a[5], a[6]), 1)
    if (base == -1 || strftime("%Y-%m-%dT%H:%M:%S", base, 1) != substr(text,1,19))
        return -1
    offset = 0
    if (a[7] != "Z") {
        if (a[9]+0 > 23 || a[10]+0 > 59) return -1
        sign = (a[8] == "+" ? 1 : -1)
        offset = sign * (a[9]*3600 + a[10]*60)
    }
    # Restrict the resulting instant to the supported post-epoch range too
    return base-offset >= 0 ? base-offset : -1
}
{
    ts = parse_offset($1)
    if (ts < 0) {print "Invalid offset timestamp:", $1 > "/dev/stderr"; next}
    print strftime("%Y-%m-%dT%H:%M:%SZ", ts, 1)
}
```

```bash
printf '%s\n' '2023-07-15T14:30:00+02:00' '2023-07-15T12:30:00Z' | gawk -f parse-offset.awk
# Both output: 2023-07-15T12:30:00Z
```

The offset is subtracted from the UTC interpretation of the calendar components. Do not remove the sign and feed the entire string to `mktime()`. This helper uses numeric offsets as supplied; it does not verify that an offset matches a named zone. RFC 3339 `-00:00` indicates an unknown local offset; the recipe produces the UTC instant but does not preserve that metadata.

## Processing Dates in Files

Input: trusted `YYYY-MM-DD HH:MM:SS message`, all in the process time zone. The half-open interval includes the target midnight and excludes the next calendar midnight.

```awk
BEGIN {
    target_date = mktime("2023 07 15 00 00 00")
    next_midnight = mktime("2023 07 16 00 00 00")
}
{
    date_str = $1 " " $2
    gsub(/[-:]/, " ", date_str)
    timestamp = mktime(date_str)
    if (timestamp != -1 && timestamp >= target_date && timestamp < next_midnight)
        print "Found log from target date:", $0
}
```

Calculate both calendar boundaries separately. `start + 86399` does not describe every local day, and inclusive end-of-day boundaries become awkward with fractional timestamps. For untrusted input, replace the parsing lines with `parse_local()` from the validation recipe.

## Time Comparisons

Input: `username unix_seconds action`. Capture now once for a consistent batch window; exclude future events.

```awk
BEGIN {
    now = systime()
    cutoff = mktime("2023 07 15 12 00 00")
}
$2 ~ /^[0-9]+$/ {
    ts = $2 + 0
    if (ts >= now-3600 && ts <= now)
        print "Recent activity (last hour):", $0
    if (ts < cutoff)
        print "Activity before noon on July 15:", $0
}
```

For a long-running stream, recompute `systime()` per record to maintain a moving window. A batch cutoff stays fixed throughout the file.

## Finding Time Differences

Input: `event_name start_unix_seconds end_unix_seconds`, with numeric seconds and nonnegative duration.

```awk
{
    duration = $3 - $2
    if (duration < 0) {print "End precedes start:", $1 > "/dev/stderr"; next}
    hours = int(duration / 3600)
    minutes = int((duration % 3600) / 60)
    seconds = duration % 60
    printf "Event %s took %02d:%02d:%02d\n", $1, hours, minutes, seconds
}
```

Hours are cumulative and can exceed 23. Do not use `strftime("%H:%M:%S", duration)` to format elapsed time: it formats an instant and wraps at calendar boundaries. Use `%.3f` on the original duration when milliseconds matter; `%d` formatting truncates fractions.

## Grouping Data by Time Periods

Input: `unix_seconds message`. This intentionally combines the same hour of day across all dates.

```awk
{
    hour = strftime("%H", $1)
    count_by_hour[hour]++
}
END {
    print "Events per hour of day:"
    for (hour = 0; hour <= 23; hour++) {
        hour_str = sprintf("%02d", hour)
        printf "%s:00 - %s:59: %d events\n", hour_str, hour_str, count_by_hour[hour_str]
    }
}
```

To keep dates and repeated DST hours distinct, group with `strftime("%Y-%m-%d %H %z", $1)`. For fixed elapsed-hour bins, use `int($1/3600)*3600` for nonnegative epochs, then format that bucket's start. Local clock hours and elapsed-hour bins can differ in zones with non-hour offsets or transitions.

## Working with Time Zones

### Select a Named Zone before Startup

```bash
TZ=Europe/Berlin gawk 'BEGIN {print strftime("%F %T %Z %z", 1689424200)}'
# 2023-07-15 14:30:00 CEST +0200
TZ=America/New_York gawk 'BEGIN {print strftime("%F %T %Z %z", 1689424200)}'
# 2023-07-15 08:30:00 EDT -0400
```

`EST` is a fixed standard-time label, whereas `America/New_York` selects regional rules and can display EST or EDT. Use IANA zone names when regional calendar rules matter. Time-zone data updates can change historical or future conversions.

### UTC and Local Display of the Same Instant

```bash
TZ=Europe/Berlin gawk -v ts=1689424200 'BEGIN {
    print "UTC:", strftime("%Y-%m-%d %H:%M:%S", ts, 1)
    print "Berlin:", strftime("%Y-%m-%d %H:%M:%S %z", ts)
}'
# UTC: 2023-07-15 12:30:00
# Berlin: 2023-07-15 14:30:00 +0200
```

No arithmetic shift is needed to display an epoch in another zone. Applying an offset to the epoch as well as selecting a zone applies the shift twice.

### Switch Zones and Restore the Original Environment

GNU AWK with a C library that observes changes to `TZ` (including GNU/Linux):

```awk
BEGIN {
    now = systime()
    had_tz = ("TZ" in ENVIRON)
    if (had_tz) original_tz = ENVIRON["TZ"]

    ENVIRON["TZ"] = "UTC0"
    print "UTC:", strftime("%F %T %Z %z", now)
    ENVIRON["TZ"] = "America/New_York"
    print "New York:", strftime("%F %T %Z %z", now)

    if (had_tz) ENVIRON["TZ"] = original_tz
    else delete ENVIRON["TZ"]
    print "Original zone:", strftime("%F %T %Z %z", now)
}
```

Preserve both the value and whether `TZ` existed. An empty `TZ` is not equivalent to an unset one; on GNU/Linux an empty value selects UTC, while an unset value uses the system zone. `date +%Z` returns an abbreviation and cannot recover the original IANA zone. For predictable behavior across platforms, prefer setting `TZ` before startup and using UTC flags inside the script.

### DST Gaps and Folds

| Situation                     | Berlin example      | Policy                                                |
| ----------------------------- | ------------------- | ----------------------------------------------------- |
| Gap: local time never occurs  | 2026-03-29 02:30:00 | Reject via round trip, or explicitly normalize        |
| Fold: local time occurs twice | 2026-10-25 02:30:00 | Require offset or choose standard/daylight occurrence |

```bash
TZ=Europe/Berlin gawk 'BEGIN {
    summer = mktime("2026 10 25 02 30 00 1")
    standard = mktime("2026 10 25 02 30 00 0")
    print strftime("%F %T %Z %z", summer)
    print strftime("%F %T %Z %z", standard)
    print "Elapsed seconds:", standard-summer
}'
# 2026-10-25 02:30:00 CEST +0200
# 2026-10-25 02:30:00 CET +0100
# Elapsed seconds: 3600
```

The DST flag is an explicit choice for a known transition, not a universal time-zone offset. An omitted flag in a fold may choose either occurrence depending on the system. For a gap, normalization details are implementation-dependent; do not silently treat normalized output as the user's intended time.

```bash
TZ=Europe/Berlin gawk 'BEGIN {
    start = mktime("2026 10 25 00 00 00")
    finish = mktime("2026 10 26 00 00 00")
    print "Local day length in hours:", (finish-start)/3600
}'
# Output: Local day length in hours: 25
```

## Time-Based Data Filtering

Input: trusted `YYYY-MM-DD HH:MM:SS message` in one selected zone. Business hours below mean `[09:00:00, 17:00:00)`.

```awk
BEGIN {
    start_time = mktime("2023 07 15 09 00 00")
    end_time = mktime("2023 07 15 17 00 00")
}
{
    timestamp_str = $1 " " $2
    gsub(/[-:]/, " ", timestamp_str)
    log_time = mktime(timestamp_str)
    if (log_time != -1 && log_time >= start_time && log_time < end_time)
        print "Business hours log:", $0
}
```

For RFC 3339 log timestamps carrying different offsets, compare the epochs produced by `parse_offset()` instead of comparing the original strings lexicographically.

## Time Formats Reference

| Format     | Description                                      | Example              |
| ---------- | ------------------------------------------------ | -------------------- |
| `%Y`       | Calendar year                                    | 2023                 |
| `%y`       | Two-digit year                                   | 23                   |
| `%m`       | Month (01–12)                                    | 07                   |
| `%d`       | Day (01–31)                                      | 15                   |
| `%H`       | Hour (00–23)                                     | 14                   |
| `%I`       | Hour (01–12)                                     | 02                   |
| `%M`       | Minute (00–59)                                   | 30                   |
| `%S`       | Second (normally 00–59; system may represent 60) | 45                   |
| `%p`       | Localized AM/PM indicator                        | PM                   |
| `%A`, `%a` | Full/abbreviated weekday name                    | Monday, Mon          |
| `%B`, `%b` | Full/abbreviated month name                      | July, Jul            |
| `%j`       | Day of year (001–366)                            | 196                  |
| `%u`       | ISO weekday, Monday=1                            | 6                    |
| `%w`       | Weekday, Sunday=0                                | 6                    |
| `%U`       | Week number (00–53), Sunday first                | 28                   |
| `%W`       | Week number (00–53), Monday first                | 28                   |
| `%G`, `%V` | ISO week-year and week number                    | 2020-W53             |
| `%Z`       | Zone abbreviation                                | EDT                  |
| `%z`       | Numeric offset                                   | -0400                |
| `%F`, `%T` | Date/time shorthands                             | 2023-07-15, 14:30:45 |
| `%s`       | Epoch seconds (system extension)                 | 1689431445           |

Format support comes from the system's `strftime()` implementation. Prefer `systime()` or an existing numeric epoch to `%s`. Use `%G-W%V` for ISO weeks: near New Year, `%Y` and `%G` can differ. Set `LC_ALL=C` before startup for predictable English names and locale-independent examples.

## Performance Tips for Time Operations

### Cache Repeated Conversions

Input: trusted `YYYY-MM-DD message`. Cache only once per distinct date in the selected zone.

```awk
{
    key = $1
    if (!(key in date_timestamps)) {
        text = key
        gsub(/-/, " ", text)
        date_timestamps[key] = mktime(text " 00 00 00")
    }
    print date_timestamps[key], $0
}
```

Cache keys must include the time zone if it can vary. Memory grows with the number of unique keys; avoid unbounded caching for mostly unique timestamps.

### Pre-calculate Fixed Timestamps

```awk
BEGIN {
    now = systime()
    midnight_today = mktime(strftime("%Y %m %d 00 00 00", now))
}
$1 >= midnight_today && $1 <= now {print}
```

Input is `unix_seconds message`; this is a batch snapshot. Some regional transitions can occur at midnight; validate boundaries when operating in such zones.

### Compare Numeric Epochs and Avoid Per-Record Processes

```awk
# Input: start_unix_seconds end_unix_seconds
$2 >= $1 {print "Elapsed seconds:", $2-$1}
```

Parse once, compare numerically, and format only when needed for output. Prefer `strftime()` to launching `date` for every input line. `systime()` is a wall clock with one-second resolution; it is unsuitable for precise or monotonic benchmarking.

## Real-World Examples

### Calculate Response Times

Input: `request_id start_time end_time`, numeric epoch seconds (fractions allowed).

```awk
{
    response_time = $3-$2
    if (response_time < 0) {print "Negative response time:", $1 > "/dev/stderr"; next}
    total_time += response_time
    count++
    if (count == 1 || response_time > max_time) {
        max_time = response_time
        max_request = $1
    }
}
END {
    if (count) {
        printf "Average response time: %.3f seconds\n", total_time/count
        printf "Max response time: %.3f seconds (Request ID: %s)\n", max_time, max_request
    } else print "No valid requests"
}
```

### Time-Series Data Aggregation

Input: `unix_seconds user_id page`, whitespace-free IDs and paths. GNU AWK arrays of arrays track uniqueness. Date, hour and offset keep DST folds separate.

```awk
{
    hour = strftime("%Y-%m-%d %H %z", $1)
    visits_by_hour[hour]++
    unique_users[hour][$2] = 1
    pages_visited[hour][$3] = 1
}
END {
    print "Local hour with UTC offset, Visits, Unique Users, Unique Pages"
    PROCINFO["sorted_in"] = "@ind_str_asc"
    for (hour in visits_by_hour) {
        user_count = page_count = 0
        for (user in unique_users[hour]) user_count++
        for (page in pages_visited[hour]) page_count++
        printf "%s, %d, %d, %d\n", hour, visits_by_hour[hour], user_count, page_count
    }
}
```

This sorts local labels, not instants across a fold. For strict chronological ordering, use epoch-hour keys. Nested arrays consume memory proportional to the unique user/page combinations.

### Age Calculator

Input: `Name YYYY-MM-DD`, valid birthdates, no future dates. Calendar components avoid dividing by a fixed number of seconds per year.

```awk
BEGIN {
    split(strftime("%Y %m %d"), today)
}
{
    split($2, bd, "-")
    age = today[1]-bd[1]
    if (today[2]+0 < bd[2]+0 ||
        (today[2]+0 == bd[2]+0 && today[3]+0 < bd[3]+0)) age--
    print $1 " is " age " years old"
}
```

For a February 29 birthday this convention increments age on March 1 in a non-leap year. Legal or business rules may instead require February 28. Choose the reporting zone explicitly because the date can differ by zone at the same instant.

### Log Analysis by Time Period

Input: `unix_seconds status_code`. Counts each request and considers HTTP status 400+ an error.

```awk
BEGIN {
    periods["morning"] = "06 00 00,11 59 59"
    periods["afternoon"] = "12 00 00,17 59 59"
    periods["evening"] = "18 00 00,23 59 59"
    periods["night"] = "00 00 00,05 59 59"
}
{
    hour = strftime("%H", $1) + 0
    for (p in periods) {
        split(periods[p], time_range, ",")
        split(time_range[1], start, " ")
        split(time_range[2], finish, " ")
        if (hour >= start[1]+0 && hour <= finish[1]+0) {
            current_period = p
            break
        }
    }
    total_by_period[current_period]++
    if ($2 >= 400) errors_by_period[current_period]++
}
END {
    print "Time Period, Total Requests, Errors, Error Rate"
    PROCINFO["sorted_in"] = "@ind_str_asc"
    for (period in total_by_period) {
        error_rate = errors_by_period[period]/total_by_period[period]*100
        printf "%s, %d, %d, %.2f%%\n", period, total_by_period[period], errors_by_period[period], error_rate
    }
}
```

## Further Reading

- [GNU AWK time functions](https://www.gnu.org/software/gawk/manual/html_node/Time-Functions.html)
- [GNU AWK locale behavior](https://www.gnu.org/software/gawk/manual/html_node/Locales.html)
- [RFC 3339: timestamps and numeric offsets](https://www.rfc-editor.org/rfc/rfc3339)
- [IANA time-zone database](https://www.iana.org/time-zones)
