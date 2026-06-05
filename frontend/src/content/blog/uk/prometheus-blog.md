---
title: 'Prometheus: як підключити за одну каву'
date: '2025-06-05'
category: 'TECH'
---

# Prometheus: спробуємо підключити за одну каву

Prometheus не врятує тебе від аварій, але зробить так, що ти дізнаєшся про проблему _раніше за клієнта_.

У цій статті я спробую описати три способи запустити Prometheus: на звичайному Linux-сервері, в Docker-контейнері та підключити до Spring Boot застосунку через Actuator.

---

## Що таке Prometheus і як він взагалі працює

[Prometheus](<https://en.wikipedia.org/wiki/Prometheus_(software)>) — це система моніторингу з відкритим кодом, яку розробили в SoundCloud ще у 2012 році. Сьогодні це де-факто стандарт у світі Kubernetes і хмарних інфраструктур.

Головна ідея, яка відрізняє Prometheus від старих систем на кшталт Nagios: він **сам ходить і збирає метрики** із сервісів, тобто використовує підхід _pull_, а не чекає, поки сервіси надішлють йому дані. Кожен застосунок або сервер просто виставляє HTTP-endpoint із метриками у текстовому форматі — наприклад `/metrics` або `/actuator/prometheus` — а Prometheus заходить туди кожні N секунд і забирає дані собі до бази.

Такий підхід дає кілька переваг. По-перше, якщо застосунок впав — Prometheus це одразу помітить, бо наступний запит просто не пройде. По-друге, конфігурація зосереджена в одному місці: у самому Prometheus, а не розкидана по десятках сервісів. По-третє, метрики легко читати людині — це просто рядки виду `http_requests_total{method="GET",status="200"} 1234`.

Зберігає Prometheus дані у власній часовій базі (TSDB), а для запитів і побудови графіків використовується мова PromQL. Найчастіше поверх Prometheus ставлять **Grafana** для красивих дашбордів.

---

## Частина 1. Prometheus на Linux-сервері

Prometheus є в репозиторіях більшості дистрибутивів, але зазвичай це стара версія. Рекомендований спосіб — завантажити бінарник напряму з [prometheus.io/download](https://prometheus.io/download/), розпакувати і налаштувати як systemd-сервіс. Виглядає трохи більше роботи, ніж `apt/dnf install`, але ти отримуєш свіжу версію і повний контроль над конфігурацією.

Сам Prometheus — це один бінарник без залежностей. Розпакував, поклав у `/usr/local/bin/`, написав systemd unit — і все працює.

### Конфігурація: серце Prometheus

Найважливіший файл — `prometheus.yml`. Саме тут описується, **звідки** Prometheus збиратиме метрики. Базова структура виглядає так:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

`scrape_interval: 15s` означає, що кожні 15 секунд Prometheus зайде на кожен target і забере нові метрики. Для більшості задач це розумний баланс між деталізацією та навантаженням.

Кожен блок у `scrape_configs` — це окремий _job_, тобто логічна група таргетів. Наприклад, один job для самого Prometheus (так, він також моніторить сам себе), інший — для системних метрик сервера.

### Системні метрики: Node Exporter

Prometheus сам по собі не знає, скільки у на сервері зайнято RAM або яке навантаження на диск. Для цього існує окремий демон — **Node Exporter**. Він запускається на сервері, читає метрики з `/proc` і `/sys` і виставляє їх на порт `9100`. Prometheus потім просто приходить туди і забирає дані.

Ця ідея — маленький окремий процес, який «знає» про одну конкретну систему і вміє відповідати Prometheus — називається _exporter_. Для баз даних, черг повідомлень, nginx, redis — для всього є свої exporters. Це дуже розширювана архітектура.

### Systemd і запуск у продакшені

Щоб Prometheus і Node Exporter автоматично стартували після перезавантаження і перезапускалися після збоїв — їх оформляють як systemd unit-файли. Ключовий момент тут — запускати їх від окремого системного користувача без shell і без домашньої директорії. Це проста практика безпеки: якщо хтось зламає Prometheus, він не отримає доступ до решти системи.

Після налаштування Web UI Prometheus доступний на `http://your-server:9090`. Там можна вводити PromQL-запити, дивитися стан targets і перевіряти, чи всі сервіси успішно скрейпляться.

---

## Частина 2. Prometheus у Docker-контейнері

Якщо інфраструктура вже побудована на контейнерах, запускати Prometheus окремо «на залізі» виглядає дивно. Docker Compose дозволяє підняти весь стек моніторингу — Prometheus, Grafana, exporters — одною командою і тримати конфігурацію поряд із кодом у git.

Принципова різниця від Linux-варіанту лише одна: мережа. У docker compose всі сервіси бачать один одного по **імені сервісу**, а не по `localhost`. Тобто якщо застосунок називається `app` у `docker-compose.yml`, то в конфігурації Prometheus треба вказати `targets: ["app:8080"]`, а не `localhost:8080`. Це часта помилка у тих, хто налаштовує prometheus вперше.

### Volumes, щоб не втратити дані після перезапуску

За замовчуванням контейнер не зберігає нічого після зупинки. Для Prometheus це критично — можна втратити всю історію метрик при кожному `docker compose down`. Тому обов'язково монтуйте volume для директорії `/prometheus` де зберігається TSDB.

Конфіг (`prometheus.yml`) теж монтується ззовні як read-only файл. Завдяки цьому можна редагувати конфіг у git-репозиторії, не заходячи всередину контейнера.

### Hot-reload без рестарту

Prometheus підтримує перезавантаження конфігурації без зупинки процесу — достатньо надіслати POST-запит на `/-/reload`. Це зручно в продакшені, коли додаєте новий сервіс до моніторингу і не хочеться переривати збір метрик. Щоб ця функція була доступна, при запуску треба передати прапор `--web.enable-lifecycle`.

### Типовий docker-compose стек

```yaml
version: '3.9'

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data: {}
  grafana_data: {}

services:
  prometheus:
    image: prom/prometheus:v2.52.0
    restart: unless-stopped
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:10.4.2
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    networks:
      - monitoring
```

Зверніть увагу на `restart: unless-stopped` — контейнери автоматично піднімуться після ребуту сервера, якщо їх спеціально не зупиняли.

---

## Частина 3. Метрики зі Spring Boot через Actuator

### Як це влаштовано зсередини

Spring Boot Actuator — це вбудований механізм для «спостережуваності» застосунку. Він виставляє набір HTTP-endpoints: `/actuator/health`, `/actuator/info`, `/actuator/metrics` тощо. Сам по собі Actuator повертає метрики у власному JSON-форматі, який Prometheus не розуміє.

Тут на сцену виходить **Micrometer** — бібліотека-фасад для збору метрик у Java/Kotlin застосунках. Думайте про неї як про SLF4J, але для метрик: код пишеться один раз, а Micrometer вже сам «перекладає» дані у формат потрібної системи — Prometheus, Datadog, InfluxDB тощо. Достатньо додати залежність `micrometer-registry-prometheus`, і Actuator автоматично починає віддавати метрики у Prometheus-форматі на `/actuator/prometheus`.

### Підключення залежностей

Для Gradle:

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("io.micrometer:micrometer-registry-prometheus")
}
```

Для Maven:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

Більше нічого не потрібно — Spring Boot автоконфігурація сама підхопить реєстр Prometheus.

### Відкриваємо потрібні endpoints

За замовчуванням Actuator у Spring Boot 3.x відкриває назовні тільки `/actuator/health`. Всі інші endpoint'и треба явно дозволити в конфігурації:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: 'health,info,prometheus,metrics'
  endpoint:
    prometheus:
      enabled: true
  metrics:
    tags:
      application: ${spring.application.name}
```

Рядок `application: ${spring.application.name}` додає лейбл `application` до **кожної** метрики застосунку. Коли у Grafana буде кілька мікросервісів, одразу можна фільтрувати графіки по конкретному застосунку — без цього лейблу доведеться гадати, чия метрика чия.

Після запуску зайдіть на `http://localhost:8080/actuator/prometheus` — побачите сотні рядків із метриками JVM, пулу потоків, HTTP-запитів, підключень до БД тощо. Все це Spring Boot збирає автоматично.

### Scrape config для Prometheus

```yaml
scrape_configs:
  - job_name: 'gym-crm'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 10s
    static_configs:
      - targets: ['localhost:8080']
```

Зверніть увагу на `metrics_path`: за замовчуванням Prometheus шукає метрики на `/metrics`, але у Spring Boot вони на `/actuator/prometheus`. Без цього параметра scrape буде повертати 404.

### Власні метрики

Автоматичні метрики — це чудово, але справжня цінність моніторингу — бізнесові метрики: скільки замовлень оброблено, скільки сутностей зареєстровано, скільки помилок валідації сталося. Micrometer дає зручне API для цього:

```kotlin
@Service
class TrainingService(private val registry: MeterRegistry) {

    // Counter — тільки зростає, підходить для підрахунку подій
    private val trainingsCreated = Counter.builder("trainings.created")
        .description("Кількість створених тренувань")
        .register(registry)

    // Timer — вимірює час виконання
    private val trainingTimer = Timer.builder("trainings.fetch.duration")
        .description("Час отримання списку тренувань")
        .register(registry)

    fun createTraining(training: Training) {
        // бізнес-логіка...
        trainingsCreated.increment()
    }

    fun getTrainings(): List<Training> {
        return trainingTimer.recordCallable {
            // запит до БД...
            trainingRepository.findAll()
        }!!
    }
}
```

Є також зручні анотації `@Timed` і `@Counted` — але вони потребують окремої конфігурації AOP-аспектів, тому для початку краще використовувати прямий API через `MeterRegistry`.

### Безпека endpoint'ів

У продакшені `/actuator/prometheus` не повинен бути доступний публічно — там може бути інформація про внутрішні назви методів, класів, таблиць БД. Якщо у вас є Spring Security, найпростіше рішення — закрити actuator endpoints за Basic Auth і вказати логін/пароль у конфігурації Prometheus.

---

## Що далі

Prometheus + Grafana — це живий організм, який потребує розвитку разом із застосунком. Кілька наступних кроків після базового налаштування:

**Alerting.** Prometheus вміє оцінювати правила і надсилати алерти через **Alertmanager** — в Slack, Telegram, PagerDuty. Тобто замість того щоб дивитися на графіки, отримуєте повідомлення тільки коли щось іде не так.

**Grafana дашборди.** Не треба будувати їх з нуля — на [grafana.com/grafana/dashboards](https://grafana.com/grafana/dashboards) тисячі готових дашбордів. Для JVM-застосунків особливо корисний **JVM Micrometer** (ID: 4701) — він одразу показує heap, GC паузи, потоки і HTTP-трафік.

**Service Discovery.** Коли сервісів стає багато, прописувати кожен вручну в `prometheus.yml` стає незручно. Prometheus вміє автоматично знаходити targets через Kubernetes, Consul, AWS EC2 та інші системи.

Prometheus — це не просто інструмент, це зміна підходу до роботи: від «щось зламалось, йду розбиратись» до «я бачу, що щось збирається зламатись, йду превентивно виправляти». Після того як ви одного разу побачите, як метрики показують проблему за 10 хвилин до реального збою — повернутися до роботи наосліп вже не захочеться.
