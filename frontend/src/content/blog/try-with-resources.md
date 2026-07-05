---
title: 'try-with-resources Java'
date: '2026-07-05'
category: 'TECH'
tags: ['oop', 'java']
---

# Java: `try` vs `try-with-resources`

У Java є звичайний `try`, а є `try-with-resources`.

На перший погляд вони виглядають майже однаково, і через це легко заплутатися. Але різниця дуже проста: у `try-with-resources` після слова `try` є круглі дужки `()`.

Саме в ці дужки ми кладемо ресурс, який Java має автоматично закрити після використання.

## Звичайний `try`

Звичайний `try-catch` використовується, коли у нас є код, який може впасти з помилкою:

```java
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("Помилка ділення");
}
```

Тут усе просто:

- код у `try` пробує виконатися;
- якщо сталася помилка, вона потрапляє в `catch`;
- у `catch` ми її обробляємо.

Тобто звичайний `try` — це про обробку помилок.

## То що не так із ресурсами?

У Java є обʼєкти, які після використання треба закривати. Наприклад:

```java
BufferedReader
FileInputStream
Connection
PreparedStatement
ResultSet
Socket
Scanner
```

Такі обʼєкти зазвичай мають метод:

```java
close()
```

Проблема в тому, що якщо ми відкрили файл або підключення до бази даних і не закрили його, ресурс може залишитися висіти відкритим.

Наприклад:

```java
try {
    BufferedReader reader = new BufferedReader(new FileReader("data.txt"));
    String line = reader.readLine();
    System.out.println(line);
} catch (IOException e) {
    e.printStackTrace();
}
```

На вигляд усе нормально. Але тут є нюанс: `reader` не закривається автоматично.

Тобто Java не викличе сама:

```java
reader.close();
```

## Старий підхід: `finally`

Раніше для цього часто використовували `finally`:

```java
BufferedReader reader = null;

try {
    reader = new BufferedReader(new FileReader("data.txt"));
    String line = reader.readLine();
    System.out.println(line);
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (reader != null) {
        try {
            reader.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

Працює, але виглядає страшнувато.

Багато коду тільки заради того, щоб нормально закрити ресурс.

## `try-with-resources`

Починаючи з Java 7, можна писати простіше:

```java
try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
    String line = reader.readLine();
    System.out.println(line);
} catch (IOException e) {
    e.printStackTrace();
}
```

Ось ця частина і є головна:

```java
try (BufferedReader reader = ...)
```

Ресурс створюється не всередині `{ }`, а в круглих дужках після `try`.

І це означає:

> Java сама закриє цей ресурс після завершення блоку `try`.

Причому неважливо, як саме завершився блок:

- успішно;
- з помилкою;
- через `return`;
- через exception.

Ресурс усе одно буде закритий.

## Головна різниця в коді

Звичайний `try`:

```java
try {
    BufferedReader reader = new BufferedReader(new FileReader("data.txt"));
    reader.readLine();
}
```

`try-with-resources`:

```java
try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
    reader.readLine();
}
```

Візуально різниця маленька:

```java
try {
```

проти:

```java
try (...) {
```

Але логічно різниця велика.

У першому випадку ресурс сам не закриється.

У другому випадку Java автоматично викличе `close()`.

## Що можна класти в дужки?

У дужки після `try` можна покласти обʼєкти, які реалізують `AutoCloseable` або `Closeable`.

Наприклад:

```java
try (Scanner scanner = new Scanner(System.in)) {
    String name = scanner.nextLine();
    System.out.println(name);
}
```

Або кілька ресурсів одразу:

```java
try (
    Connection connection = dataSource.getConnection();
    PreparedStatement statement = connection.prepareStatement("SELECT * FROM users");
    ResultSet resultSet = statement.executeQuery()
) {
    while (resultSet.next()) {
        System.out.println(resultSet.getString("name"));
    }
}
```

Java закриє ресурси автоматично у зворотному порядку:

```text
resultSet
statement
connection
```

Це логічно, бо спочатку треба закрити те, що залежить від іншого ресурсу.

## Просте правило

Якщо треба просто перехопити помилку — використовуємо звичайний `try-catch`.

```java
try {
    // небезпечний код
} catch (Exception e) {
    // обробка помилки
}
```

Якщо працюємо з ресурсом, який треба закрити, — використовуємо `try-with-resources`.

```java
try (Resource resource = new Resource()) {
    // робота з ресурсом
}
```

## Коротко

`try { ... }` — просто виконує код і дозволяє обробити помилку.

`try (...) { ... }` — виконує код і автоматично закриває ресурс із круглих дужок.

Тобто вся візуальна різниця — це круглі дужки після `try`.

А вся практична користь — у тому, що Java сама викликає `close()`.
