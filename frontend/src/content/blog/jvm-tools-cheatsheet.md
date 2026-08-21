---
title: 'JVM Tools Cheatsheet: javap, jimage та інструменти моніторингу'
date: '2026-08-14'
category: 'TECH'
tags: ['java', 'jvm', 'javatools']
---

Усі команди йдуть у складі JDK (`$JAVA_HOME/bin`). Версії наведені для сучасних JDK (11+), деякі ключі можуть відрізнятись між версіями.

---

## javap — дизасемблер класів

Показує сигнатури, байт-код або структуру скомпільованих `.class` файлів. Корисно, коли треба зрозуміти, що саме згенерував компілятор (bridge-методи, generics erasure, synthetic-поля тощо).

```bash
javap [опції] ім'я.класу
javap [опції] шлях/до/файлу.class
```

| Ключ                   | Що робить                                                                |
| ---------------------- | ------------------------------------------------------------------------ |
| `-c`                   | Показати дизасембльований байт-код (JVM instructions)                    |
| `-p` / `-private`      | Показати всі члени класу, включно з `private`                            |
| `-public`              | Тільки `public` члени (за замовчуванням)                                 |
| `-protected`           | `protected` і вище                                                       |
| `-package`             | `package`-private і вище (default access)                                |
| `-v` / `-verbose`      | Повний вивід: constant pool, stack size, args size, exceptions, атрибути |
| `-l`                   | Номери рядків і таблиця локальних змінних (потребує компіляції з `-g`)   |
| `-s`                   | Внутрішні сигнатури типів (type signatures)                              |
| `-sysinfo`             | Інформація про системний ресурс класу (шлях, дата, MD5)                  |
| `-classpath <path>`    | Вказати classpath для пошуку класу                                       |
| `--module-path <path>` | Вказати шлях до модулів (JPMS)                                           |
| `-m <module>`          | Вказати конкретний модуль                                                |

**Приклади:**

```bash
javap -c -p com.example.MyClass          # весь байт-код, включно з private
javap -v com.example.MyClass             # повна інформація + constant pool
javap -l -p target/classes/com/example/MyClass.class
```

---

## jimage — робота з модульними образами JDK (`lib/modules`)

З'явився разом із Project Jigsaw (JDK 9+). Дозволяє заглянути всередину модульного runtime-образу (`jrt:/`), який замінив `rt.jar`.

```bash
jimage <підкоманда> [опції] шлях/до/образу
```

| Підкоманда | Що робить                                  |
| ---------- | ------------------------------------------ |
| `list`     | Список усіх ресурсів (класів) у образі     |
| `extract`  | Розпакувати вміст образу у файлову систему |
| `verify`   | Перевірити цілісність образу               |
| `info`     | Метадані про образ                         |

| Ключ                  | Що робить                        |
| --------------------- | -------------------------------- |
| `--dir <path>`        | Куди екстрактити (для `extract`) |
| `--include <pattern>` | Фільтр ресурсів за glob-патерном |
| `--verbose`           | Детальний вивід                  |

**Приклади:**

```bash
jimage list $JAVA_HOME/lib/modules | less
jimage list --include "java.base/*" $JAVA_HOME/lib/modules
jimage extract --dir out $JAVA_HOME/lib/modules
jimage verify $JAVA_HOME/lib/modules
```

> Практично корисно: подивитись, чи модуль присутній у runtime, або дістати `.class` файл системного класу, щоб прогнати його через `javap`.

---

## Інструменти моніторингу JVM

### jps — список Java-процесів (аналог `ps` для JVM)

```bash
jps [опції] [hostid]
```

| Ключ | Що робить                         |
| ---- | --------------------------------- |
| `-l` | Повний шлях до main-класу або jar |
| `-m` | Аргументи, передані в `main()`    |
| `-v` | JVM-опції запуску (flags)         |
| `-q` | Тільки PID, без назв              |

```bash
jps -lvm
```

---

### jstat — статистика JVM у реальному часі (GC, класи, JIT)

```bash
jstat -<опція> [-t] [-h<рядків>] <pid> [interval_ms [count]]
```

| Опція         | Що показує                                                          |
| ------------- | ------------------------------------------------------------------- |
| `-gc`         | Статистика heap по всіх поколіннях (Eden, Survivor, Old, Metaspace) |
| `-gcutil`     | Те саме, але у % заповненості                                       |
| `-gccapacity` | Розміри поколінь і capacity                                         |
| `-gccause`    | `-gcutil` + причина останнього GC                                   |
| `-class`      | Статистика завантаження класів                                      |
| `-compiler`   | Статистика JIT-компіляції                                           |

```bash
jstat -gcutil 12345 1000 10     # кожну секунду, 10 разів
jstat -gccause 12345 2000       # кожні 2с, безкінечно
```

---

### jstack — дампи стеків потоків (thread dump)

Головний інструмент для діагностики зависань, дедлоків, high CPU.

```bash
jstack [опції] <pid>
```

| Ключ | Що робить                                             |
| ---- | ----------------------------------------------------- |
| `-l` | Додатково інформація про lock (ownable synchronizers) |
| `-F` | Форсувати дамп, якщо процес не відповідає             |
| `-m` | Показати також native (C/C++) стек-фрейми             |

```bash
jstack -l 12345 > threaddump.txt
jstack -l 12345 | grep -A5 "BLOCKED"   # шукати дедлоки
```

---

### jmap — дампи heap і статистика пам'яті

```bash
jmap [опції] <pid>
```

| Ключ                                  | Що робить                                                       |
| ------------------------------------- | --------------------------------------------------------------- |
| `-heap`                               | Загальна конфігурація і статистика heap                         |
| `-histo[:live]`                       | Гістограма об'єктів у heap (`:live` — тільки живі, викликає GC) |
| `-dump:live,format=b,file=heap.hprof` | Зробити повний heap dump (`live` = тільки reachable об'єкти)    |
| `-clstats`                            | Статистика classloader'ів                                       |

```bash
jmap -histo:live 12345 | head -30
jmap -dump:live,format=b,file=heap.hprof 12345
```

> На сучасних JDK частину цих команд краще виконувати через `jcmd` (нижче) — `jmap` поступово застарілий.

---

### jcmd — універсальний "швейцарський ніж" для діагностики

Замінює багато окремих утиліт одним інтерфейсом.

```bash
jcmd <pid|main-class> <команда> [аргументи]
jcmd -l                          # список усіх запущених JVM
```

| Команда                            | Що робить                                        |
| ---------------------------------- | ------------------------------------------------ |
| `help`                             | Список усіх доступних команд для конкретного PID |
| `Thread.print`                     | Thread dump (аналог `jstack`)                    |
| `GC.heap_info`                     | Інформація про heap                              |
| `GC.class_histogram`               | Гістограма об'єктів (аналог `jmap -histo`)       |
| `GC.run`                           | Форсувати повний GC                              |
| `GC.heap_dump filename=heap.hprof` | Heap dump (аналог `jmap -dump`)                  |
| `VM.flags`                         | Активні JVM-опції запуску                        |
| `VM.system_properties`             | System properties                                |
| `VM.uptime`                        | Час роботи JVM                                   |
| `VM.version`                       | Версія JVM                                       |

```bash
jcmd 12345 help
jcmd 12345 Thread.print
jcmd 12345 GC.heap_dump filename=heap.hprof
jcmd 12345 VM.flags
```

---

### jinfo — перегляд і зміна конфігурації JVM у реальному часі

```bash
jinfo [опції] <pid>
```

| Ключ                | Що робить                                                 |
| ------------------- | --------------------------------------------------------- |
| `-flags`            | Усі явно задані JVM flags                                 |
| `-sysprops`         | System properties                                         |
| `-flag <name>`      | Значення конкретного flag                                 |
| `-flag [+/-]<name>` | Увімкнути/вимкнути manageable flag (наприклад `+PrintGC`) |

```bash
jinfo -flags 12345
jinfo -flag MaxHeapSize 12345
```

---

### jconsole / jvisualvm — GUI-моніторинг

Не CLI, а графічні інструменти для live-моніторингу heap, threads, MBeans, CPU.

```bash
jconsole [pid|host:port]
jvisualvm    # у новіших JDK окремий download (Visual VM), не входить у комплект
```

---

### jhsdb — post-mortem аналіз (заміна старого `jstack`/`jmap` для мертвих процесів або core dump)

```bash
jhsdb <режим> --pid <pid>
jhsdb <режим> --core <core-file> --exe <java-binary>
```

| Режим    | Що робить                                                |
| -------- | -------------------------------------------------------- |
| `jstack` | Thread dump з живого процесу або core dump               |
| `jmap`   | Heap dump / histogram з core dump                        |
| `clhsdb` | Інтерактивна командна оболонка для low-level дослідження |
| `hsdb`   | GUI-версія clhsdb                                        |

```bash
jhsdb jstack --pid 12345
jhsdb jmap --pid 12345 --heap
```

---

## Швидка шпаргалка "яка проблема → який інструмент"

| Симптом                                          | Інструмент                              |
| ------------------------------------------------ | --------------------------------------- |
| Не знаю, які Java-процеси запущені               | `jps -lvm`                              |
| JVM зависла / high CPU на потоці                 | `jstack -l` або `jcmd Thread.print`     |
| OutOfMemoryError / підозра на memory leak        | `jmap -histo:live`, `jcmd GC.heap_dump` |
| Часті GC-паузи                                   | `jstat -gcutil`                         |
| Треба зрозуміти байт-код методу                  | `javap -c -p`                           |
| Клас не знайдено в модулі / шукаю системний клас | `jimage list`                           |
| Треба подивитись/змінити runtime-flag            | `jinfo`, `jcmd VM.flags`                |
| Аналіз core dump після краху                     | `jhsdb`                                 |
