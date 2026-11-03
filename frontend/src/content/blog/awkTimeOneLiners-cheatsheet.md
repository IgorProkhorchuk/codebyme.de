---
title: 'GNU AWK Time One-Liners Cheatsheet'
description: 'Copyable GNU AWK recipes for date conversions, log filtering, Apache reports, CSV timestamps, time zones and calendar calculations.'
date: '2026-11-03'
lang: en
category: TECH
tags: [linux, awk, gawk, cheatsheet, datetime, logs]
---

Practical GNU AWK commands for the terminal. This recipe collection complements the [time functions, time zones and DST reference](/blog/awk-timeFunctions-cheatsheet); it stays separate so frequently used commands remain easy to find and copy.

## Assumptions and Quick Navigation

- Use `gawk` explicitly; these recipes use functions/extensions outside POSIX AWK. Shell examples target Bash; `<<<` is a Bash here-string.
- Unless overridden with `TZ=...` or a UTC function argument, calendar strings and formatted output use the process time zone. Choose that zone to match the source data.
- Inputs are valid and have no header unless stated otherwise. Date-only input is `YYYY-MM-DD`; local log input is `YYYY-MM-DD HH:MM:SS message`; epoch input uses numeric Unix seconds. Recipes specify exceptions near the command.
- These short recipes assume trusted input. For strict validation and offset-bearing ISO timestamps, use the round-trip and `parse_offset()` helpers in the [time functions cheatsheet](/blog/awk-timeFunctions-cheatsheet#parsing-dates-from-input).

Related: [AWK fundamentals](/blog/awk-cheatsheet), [advanced AWK](/blog/awk-cheatsheet-advanced).

## Current Date and Time

```bash
# Current date: YYYY-MM-DD
gawk 'BEGIN {print strftime("%Y-%m-%d")}'

# Current local date/time, with offset
gawk 'BEGIN {print strftime("%Y-%m-%d %H:%M:%S %z")}'

# Current Unix timestamp (seconds since 1970-01-01 UTC)
gawk 'BEGIN {print systime()}'

# Weekday and month names (localized)
gawk 'BEGIN {print strftime("%A")}'
gawk 'BEGIN {print strftime("%B")}'

# ISO week number, then ISO week-year + week (use %G, not %Y)
gawk 'BEGIN {print strftime("%V"); print strftime("%G-W%V")}'

# Day of year (001-366)
gawk 'BEGIN {print strftime("%j")}'
```

## Date Conversion

```bash
# Unix timestamp to local date/time
gawk 'BEGIN {print strftime("%Y-%m-%d %H:%M:%S %z", 1672531200)}'

# The same timestamp in UTC
gawk 'BEGIN {print strftime("%Y-%m-%dT%H:%M:%SZ", 1672531200, 1)}'
# Output: 2023-01-01T00:00:00Z

# YYYY-MM-DD to timestamp at local midnight
gawk 'BEGIN {split("2023-07-15",d,"-"); print mktime(d[1]" "d[2]" "d[3]" 0 0 0")}'

# The same date at UTC midnight
gawk 'BEGIN {print mktime("2023 07 15 00 00 00", 1)}'
# Output: 1689379200

# MM/DD/YYYY to YYYY-MM-DD (one valid date per line)
gawk -F/ '{printf "%04d-%02d-%02d\n", $3, $1, $2}' dates.txt

# YYYY-MM-DD to DD/MM/YYYY
gawk -F- '{printf "%02d/%02d/%04d\n", $3, $2, $1}' dates.txt
```

## Time Calculations

```bash
# Date after exactly 24 elapsed hours; local display may cross DST
gawk 'BEGIN {print strftime("%Y-%m-%d", systime()+86400)}'

# Date exactly 168 elapsed hours ago
gawk 'BEGIN {print strftime("%Y-%m-%d", systime()-7*86400)}'

# Tomorrow's local calendar date: increment the day component
gawk 'BEGIN {split(strftime("%Y %m %d"),d); print strftime("%F",mktime(d[1]" "d[2]" "(d[3]+1)" 12 0 0"))}'

# Yesterday's local calendar date
gawk 'BEGIN {split(strftime("%Y %m %d"),d); print strftime("%F",mktime(d[1]" "d[2]" "(d[3]-1)" 12 0 0"))}'

# Date exactly 30*24 elapsed hours ago
gawk 'BEGIN {print strftime("%Y-%m-%d", systime()-30*86400)}'

# Calendar date 30 days ago
gawk 'BEGIN {split(strftime("%Y %m %d"),d); print strftime("%F",mktime(d[1]" "d[2]" "(d[3]-30)" 12 0 0"))}'
```

The calendar-date recipes use noon to avoid usual midnight DST boundaries. Exceptional historical zone changes can skip an entire date; inspect the round trip if that matters. Adding a calendar month needs an overflow policy: see the [normalize/clamp examples](/blog/awk-timeFunctions-cheatsheet#add-one-month-normalize-or-clamp).

## Log File Time Processing

Apache examples assume Common/Combined Log Format, for example:

```text
127.0.0.1 - - [15/Jul/2023:14:30:45 +0000] "GET / HTTP/1.1" 200 1024
```

```bash
# Apache: filter a specific date in the timestamp field
gawk '$4 ~ /^\[15\/Jul\/2023:/' access.log

# Apache: count by date, hour and recorded offset (keeps DST folds distinct)
gawk '{split($4,t,":"); key=substr(t[1],2)":"t[2]" "substr($5,1,length($5)-1); count[key]++} END {for(h in count) print h,count[h]}' access.log
# For the sample: 15/Jul/2023:14 +0000 1

# Local log: render YYYY-MM-DD HH:MM:SS as a readable date, retaining the record
LC_ALL=C gawk '{text=$1" "$2; gsub(/[-:]/," ",text); ts=mktime(text); if(ts != -1) print strftime("%a %b %d %Y",ts),$0}' logfile.txt

# Local log: entries in [now-3600, now], preserving the original record
gawk 'BEGIN {now=systime()} {text=$1" "$2; gsub(/[-:]/," ",text); ts=mktime(text); if(ts != -1 && ts>=now-3600 && ts<=now) print}' logfile.txt
```

Set `TZ` to the local log's zone, for example `TZ=Europe/Berlin gawk ...`. The Apache grouping uses the recorded label/offset directly; it does not reinterpret the date in the machine's zone. It sorts neither dates nor hours automatically.

## Time Extraction and Filtering

```bash
# HH:MM:SS in field 2: extract the hour
gawk '{split($2,t,":"); print t[1]}' logfile.txt

# HH:MM:SS in field 1: [09:00:00, 17:00:00), across all input dates
gawk '$1 ~ /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/ && $1>="09:00:00" && $1<"17:00:00"' times.log

# YYYY-MM-DD in field 1: count by date
gawk '{count[$1]++} END {for(d in count) print d,count[d]}' logfile.txt

# Two HH:MM:SS fields on the SAME day: elapsed seconds
gawk '{split($1,a,":"); split($2,b,":"); print (b[1]*3600+b[2]*60+b[3])-(a[1]*3600+a[2]*60+a[3])}' times.txt
```

The clock-only difference can be negative across midnight. If the contract guarantees an end within the next 24 hours, add 86400 to a negative result. For actual dates or DST transitions, parse full timestamps and subtract epochs instead.

## Date Comparisons

```bash
# Date-only entries strictly after the specified date
gawk '$1 > "2023-07-15"' dates.txt

# The same comparison using local-midnight timestamps
gawk 'BEGIN {target=mktime("2023 07 15 00 00 00")} {split($1,d,"-"); ts=mktime(d[1]" "d[2]" "d[3]" 0 0 0"); if(ts != -1 && ts>target) print}' dates.txt

# Weekend in the process time zone (ISO Monday=1)
gawk 'BEGIN {print (strftime("%u")+0>5 ? "Weekend" : "Weekday")}'

# Date-only entries before today; today itself is excluded
gawk 'BEGIN {today=strftime("%F")} $1<today {print "Past date:",$0}' dates.txt

# Date-only entries after today
gawk 'BEGIN {today=strftime("%F")} $1>today {print "Future date:",$0}' dates.txt
```

Lexicographic comparison is appropriate here because inputs are valid, zero-padded dates in the same calendar. It does not work for arbitrary date formats or differently offset timestamps.

## Advanced Time Applications

Input contracts: `people.txt` contains `Name YYYY-MM-DD`; `timestamps.txt` contains two numeric epochs with end ≥ start; `response_times.txt` contains `HH:MM:SS duration_ms`.

```bash
# Age by calendar birthday, not by dividing seconds by 365 days
gawk 'BEGIN {split(strftime("%Y %m %d"),t)} {split($2,b,"-"); age=t[1]-b[1]; if(t[2]+0<b[2]+0 || (t[2]+0==b[2]+0 && t[3]+0<b[3]+0)) age--; print $1,"is",age,"years old"}' people.txt

# Nonnegative duration as cumulative HH:MM:SS
gawk '{diff=$2-$1; if(diff<0) next; printf "%02d:%02d:%02d\n",int(diff/3600),int(diff%3600/60),diff%60}' timestamps.txt

# Batch snapshot of local log entries within the last minute; rerun to refresh
gawk 'BEGIN {now=systime()} {text=$1" "$2; gsub(/[-:]/," ",text); ts=mktime(text); if(ts != -1 && ts>=now-60 && ts<=now) print}' logfile.txt

# Mean response time by clock hour, combining all dates
gawk '{split($1,t,":"); h=t[1]; sum[h]+=$2; count[h]++} END {for(h in sum) printf "Hour %s: avg %.2f ms\n",h,sum[h]/count[h]}' response_times.txt
```

The February 29 age convention above uses March 1 in non-leap years. The one-minute recipe reads the current file once; it does not follow appended records. For a live stream with epoch seconds in field 1:

```bash
tail -n 0 -F events.log | gawk '{now=systime(); if($1>=now-60 && $1<=now) {print; fflush()}}'
```

## Working with Different Time Zones

```bash
# UTC without changing the process zone
gawk 'BEGIN {print strftime("%Y-%m-%dT%H:%M:%SZ",systime(),1)}'

# New York regional time: EST or EDT depending on the date
TZ=America/New_York gawk 'BEGIN {print strftime("%F %T %Z %z")}'

# Same instant in UTC and the process's original local zone
gawk -v ts=1672531200 'BEGIN {print "UTC:",strftime("%F %T",ts,1); print "Local:",strftime("%F %T %Z %z",ts)}'

# Interpret Berlin wall-clock input, then display UTC
TZ=Europe/Berlin gawk 'BEGIN {ts=mktime("2023 07 15 14 30 00"); print strftime("%Y-%m-%dT%H:%M:%SZ",ts,1)}'
# Output: 2023-07-15T12:30:00Z
```

Do not use `ENVIRON["TZ"]=""` to restore the original zone. Preserve the original value/unset state if switching zones inside a script; the complete recipe is in the [time-zone reference](/blog/awk-timeFunctions-cheatsheet#switch-zones-and-restore-the-original-environment).

## Time-Based Report Generation

```bash
# Apache CLF/Combined: requests and mean bytes per date/hour/offset
# $10 is body bytes; Apache '-' is treated as 0
gawk '{split($4,t,":"); h=substr(t[1],2)":"t[2]" "substr($5,1,length($5)-1); bytes[h]+=($10=="-"?0:$10); count[h]++} END {for(h in count) printf "%s: %d requests, %.2f KiB avg\n",h,count[h],bytes[h]/count[h]/1024}' access.log

# Daily error counts: YYYY-MM-DD in field 1
gawk '/ERROR/ {errors[$1]++} END {for(d in errors) print d,errors[d],"errors"}' app.log

# Events per second: YYYY-MM-DD HH:MM:SS message (do not merge every :30)
gawk '{count[$1" "$2]++} END {for(s in count) print s,count[s],"events"}' highload.log

# Whole seven-day periods elapsed since the epoch, not ISO calendar weeks
gawk 'BEGIN {print "Seven-day bucket since Unix epoch:",int(systime()/604800)}'
```

For chronological report ordering, use numeric epoch keys or an unambiguous sortable format. Apache `DD/Mon/YYYY` labels are not lexicographically chronological. For ISO-like labels in GNU AWK, `PROCINFO["sorted_in"]="@ind_str_asc"` sorts subsequent array loops by key.

## Processing Timestamps in CSV Files

These recipes use **simple comma-delimited input**: no quoted input fields, embedded commas or newlines, and no header. `-F,` is not a complete CSV parser. For general CSV, use a CSV-aware tool or GNU AWK 5.3+ `--csv`; output still needs CSV escaping.

```bash
# Four fields; field 3 is YYYY-MM-DDTHH:MM:SS without an offset
# Format its date portion in English and quote the generated field containing a comma
LC_ALL=C TZ=UTC0 gawk -F, '{split($3,dt,"T"); gsub(/-/," ",dt[1]); ts=mktime(dt[1]" 0 0 0",1); printf "%s,%s,\"%s\",%s\n",$1,$2,strftime("%B %d, %Y",ts,1),$4}' data.csv

# Field 1: YYYY-MM-DD HH:MM:SS, ordered chronologically in one process zone
# Average gap between consecutive events; needs at least two valid events
gawk -F, '{text=$1; gsub(/[-:]/," ",text); ts=mktime(text); if(ts == -1) next; if(have) {sum+=ts-prev; count++} prev=ts; have=1} END {if(count) print "Average time between events:",sum/count,"seconds"; else print "Need at least two events"}' events.csv

# Field 2: valid birthdate YYYY-MM-DD; append calendar age
# Same February 29 convention as the age recipe above
gawk -F, 'BEGIN {OFS=","; split(strftime("%Y %m %d"),t)} {split($2,b,"-"); age=t[1]-b[1]; if(t[2]+0<b[2]+0 || (t[2]+0==b[2]+0 && t[3]+0<b[3]+0)) age--; print $0,age}' people.csv
```

Example conversion: `42,alice,2023-07-15T14:30:00,ok` becomes `42,alice,"July 15, 2023",ok`. The first recipe intentionally uses only the date portion; it does not convert a timestamp with `Z` or a numeric offset to another zone.

## Quick Time/Date Format Conversions

```bash
# Seconds to cumulative HH:MM:SS
gawk -v s=3661 'BEGIN {printf "%02d:%02d:%02d\n",int(s/3600),int(s%3600/60),s%60}'
# Output: 01:01:01

# YYYY-MM-DD to timestamp and weekday (Bash here-string)
LC_ALL=C gawk -F- '{ts=mktime($1" "$2" "$3" 0 0 0",1); print ts; print strftime("%A",ts,1)}' <<< '2023-07-15'
# Output: 1689379200, then Saturday

# Nonnegative Unix milliseconds to UTC; preserve milliseconds explicitly
gawk -v ms=1626345600123 'BEGIN {printf "%s.%03dZ\n",strftime("%Y-%m-%dT%H:%M:%S",int(ms/1000),1),ms%1000}'
# Output: 2021-07-15T10:40:00.123Z

# 24-hour HH:MM to 12-hour HH:MM AM/PM (valid hours 00-23)
gawk -F: '{printf "%02d:%s %s\n",($1%12 ? $1%12 : 12),$2,($1+0>=12 ? "PM" : "AM")}' <<< '12:30'
# Output: 12:30 PM; 00:30 becomes 12:30 AM

# 12-hour HH:MM AM/PM to 24-hour time (valid hours 01-12)
gawk -F'[: ]+' '{printf "%02d:%02d\n",$1%12+(toupper($3)=="PM" ? 12 : 0),$2}' <<< '12:30 AM'
# Output: 00:30
```

## Timezone and DST Handling

```bash
# Zone abbreviation and numeric offset NOW
gawk 'BEGIN {print strftime("%Z"); print strftime("%z")}'

# Compare January and July offsets in a named zone (minutes, including half-hours)
TZ=Australia/Lord_Howe gawk 'function minutes(z) {return (substr(z,1,1)=="-"?-1:1)*(substr(z,2,2)*60+substr(z,4,2))} BEGIN {jan=mktime("2023 01 01 12 0 0"); jul=mktime("2023 07 01 12 0 0"); print "July minus January offset (minutes):",minutes(strftime("%z",jul))-minutes(strftime("%z",jan))}'
# Output: July minus January offset (minutes): -30

# Length of a local DST-transition day
TZ=Europe/Berlin gawk 'BEGIN {print (mktime("2026 03 30 0 0 0")-mktime("2026 03 29 0 0 0"))/3600}'
# Output: 23

# Choose the two occurrences of a repeated local time explicitly
TZ=Europe/Berlin gawk 'BEGIN {a=mktime("2026 10 25 2 30 0 1"); b=mktime("2026 10 25 2 30 0 0"); print strftime("%F %T %z",a); print strftime("%F %T %z",b); print b-a}'
# Output: 02:30 at +0200 and +0100 on the same date, 3600 seconds apart
```

Subtracting `%z` values as decimal numbers and dividing by 100 fails for fractional-hour offsets. Seasonal offset differences do not universally identify whether DST is active now: regions can have different seasons, unusual transitions or political offset changes. A local time in a DST gap should be rejected or normalized according to an explicit policy; see the strict parser in the companion reference.

## Performance Timing One-Liners

```bash
# Coarse wall-clock timing (one-second resolution)
time_start=$(gawk 'BEGIN {print systime()}'); sleep 2; gawk -v s="$time_start" 'BEGIN {print "Execution time:",systime()-s,"seconds"}'

# Coarse benchmark: a fast run may report 0 seconds
gawk 'BEGIN {start=systime(); for(i=0;i<1000000;i++) x=sqrt(i); print "Time taken:",systime()-start,"seconds"}'

# Shell timing for a real AWK workload (reports to stderr)
time gawk '{sum+=$1} END {print sum+0}' numbers.txt

# GNU date alternative: obtain an epoch once before AWK starts
gawk -v now="$(date +%s)" '$1>=now-60 && $1<=now' epoch.log
```

The clock can jump during wall-clock measurements. Use a monotonic clock in a suitable benchmarking tool when precise elapsed durations matter. Keep external date commands outside per-record loops.

## Caveats

- `mktime()` normalizes invalid dates. A result other than -1 does not guarantee valid original input; validate and round-trip when needed.
- Batch windows capture now once; stream windows need a moving cutoff. Exclude future records if the window means recent past activity.
- Calendar days/months/years and fixed elapsed seconds have different semantics. Account for month ends, leap years and DST.
- Clock-only times cannot identify a date, zone or repeated DST occurrence.
- The system's time-zone database, supported timestamp range and `strftime()` formats affect results.
- Most short examples assume valid input rather than embedding a full parser in every command. The companion [time functions cheatsheet](/blog/awk-timeFunctions-cheatsheet) contains strict local and offset-aware parsers.

## Further Reading

- [GNU AWK time functions](https://www.gnu.org/software/gawk/manual/html_node/Time-Functions.html)
- [GNU AWK CSV support](https://www.gnu.org/software/gawk/manual/html_node/Comma-Separated-Fields.html)
