---
title: 'Prometheus: how to set it up over a cup of coffee'
date: '2025-06-05'
category: 'TECH'
tags: ['devops', 'prometheus', 'monitoring']
---

Prometheus won't save you from crashes, but it will make sure you learn about the problem _before the client does_.

In this article, I will try to describe three ways to run Prometheus: on a regular Linux server, in a Docker container, and connecting it to a Spring Boot application via Actuator.

---

## What is Prometheus and how does it even work?

[Prometheus](<https://en.wikipedia.org/wiki/Prometheus_(software)>) is an open-source monitoring system developed at SoundCloud back in 2012. Today it is the de-facto standard in the world of Kubernetes and cloud infrastructures.

The main idea that distinguishes Prometheus from older systems like Nagios: it **goes and collects metrics itself** from services, i.e. it uses a _pull_ approach, rather than waiting for services to send it data. Each application or server simply exposes an HTTP endpoint with metrics in text format — for example `/metrics` or `/actuator/prometheus` — and Prometheus visits it every N seconds and fetches the data into its database.

This approach offers several advantages. First, if the application crashes, Prometheus will immediately notice, because the next request will simply fail. Second, the configuration is centralized in one place: in Prometheus itself, rather than scattered across dozens of services. Third, metrics are easily readable by humans — they are just strings like `http_requests_total{method="GET",status="200"} 1234`.

Prometheus stores data in its own time-series database (TSDB), and the PromQL language is used for queries and graphing. Most often, **Grafana** is placed on top of Prometheus for beautiful dashboards.

---

## Part 1. Prometheus on a Linux server

Prometheus is available in the repositories of most distributions, but it's usually an older version. The recommended way is to download the binary directly from [prometheus.io/download](https://prometheus.io/download/), unpack it, and configure it as a systemd service. It looks like slightly more work than `apt/dnf install`, but you get a fresh version and full control over the configuration.

Prometheus itself is a single binary without dependencies. Unpack it, put it in `/usr/local/bin/`, write a systemd unit — and everything works.

### Configuration: the heart of Prometheus

The most important file is `prometheus.yml`. This is where you describe **where** Prometheus will collect metrics from. The basic structure looks like this:

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

`scrape_interval: 15s` means that every 15 seconds Prometheus will visit each target and fetch new metrics. For most tasks, this is a reasonable balance between granularity and load.

Each block in `scrape_configs` is a separate _job_, i.e., a logical group of targets. For example, one job for Prometheus itself (yes, it also monitors itself), another for the server's system metrics.

### System metrics: Node Exporter

Prometheus itself does not know how much RAM is occupied on the server or what the disk load is. For this, there is a separate daemon — **Node Exporter**. It runs on the server, reads metrics from `/proc` and `/sys`, and exposes them on port `9100`. Prometheus then simply comes there and picks up the data.

This idea — a small separate process that "knows" about one specific system and can respond to Prometheus — is called an _exporter_. For databases, message queues, nginx, redis — there are exporters for everything. It is a very extensible architecture.

### Systemd and running in production

For Prometheus and Node Exporter to start automatically after a reboot and restart after crashes, they are configured as systemd unit files. The key point here is to run them under a separate system user without a shell and without a home directory. This is a simple security practice: if someone hacks Prometheus, they won't get access to the rest of the system.

After setup, the Prometheus Web UI is available at `http://your-server:9090`. There you can enter PromQL queries, view the status of targets, and check if all services are being scraped successfully.

---

## Part 2. Prometheus in a Docker container

If the infrastructure is already built on containers, running Prometheus separately "on bare metal" looks weird. Docker Compose allows you to bring up the entire monitoring stack — Prometheus, Grafana, exporters — with a single command and keep the configuration next to the code in git.

The principal difference from the Linux variant is just one: the network. In docker compose, all services see each other by **service name**, not by `localhost`. So if the application is named `app` in `docker-compose.yml`, then in the Prometheus configuration you need to specify `targets: ["app:8080"]`, not `localhost:8080`. This is a common mistake for those configuring prometheus for the first time.

### Volumes, so as not to lose data after restart

By default, a container saves nothing after it stops. For Prometheus, this is critical — you can lose the entire history of metrics on every `docker compose down`. Therefore, be sure to mount a volume for the `/prometheus` directory where the TSDB is stored.

The config (`prometheus.yml`) is also mounted from the outside as a read-only file. Thanks to this, you can edit the config in a git repository without entering the container.

### Hot-reload without restart

Prometheus supports reloading configuration without stopping the process — it is enough to send a POST request to `/-/reload`. This is convenient in production when adding a new service to monitoring and you don't want to interrupt metric collection. For this feature to be available, you must pass the `--web.enable-lifecycle` flag at startup.

### Typical docker-compose stack

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

Note the `restart: unless-stopped` — containers will automatically come up after a server reboot, unless they were specifically stopped.

---

## Part 3. Metrics from Spring Boot via Actuator

### How it works on the inside

Spring Boot Actuator is a built-in mechanism for application "observability". It exposes a set of HTTP endpoints: `/actuator/health`, `/actuator/info`, `/actuator/metrics`, etc. By itself, Actuator returns metrics in its own JSON format, which Prometheus does not understand.

Here **Micrometer** enters the scene — a facade library for collecting metrics in Java/Kotlin applications. Think of it as SLF4J, but for metrics: the code is written once, and Micrometer itself "translates" the data into the format of the required system — Prometheus, Datadog, InfluxDB, etc. It is enough to add the `micrometer-registry-prometheus` dependency, and Actuator automatically starts serving metrics in Prometheus format at `/actuator/prometheus`.

### Adding dependencies

For Gradle:

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("io.micrometer:micrometer-registry-prometheus")
}
```

For Maven:

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

Nothing else is needed — Spring Boot autoconfiguration will pick up the Prometheus registry itself.

### Exposing the necessary endpoints

By default, Actuator in Spring Boot 3.x exposes only `/actuator/health` to the outside. All other endpoints must be explicitly allowed in the configuration:

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

The line `application: ${spring.application.name}` adds the `application` label to **every** metric of the application. When there are several microservices in Grafana, you can immediately filter graphs by a specific application — without this label, you'd have to guess whose metric is whose.

After startup, go to `http://localhost:8080/actuator/prometheus` — you will see hundreds of lines with JVM metrics, thread pool, HTTP requests, DB connections, etc. Spring Boot collects all this automatically.

### Scrape config for Prometheus

```yaml
scrape_configs:
  - job_name: 'gym-crm'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 10s
    static_configs:
      - targets: ['localhost:8080']
```

Note the `metrics_path`: by default, Prometheus looks for metrics at `/metrics`, but in Spring Boot they are at `/actuator/prometheus`. Without this parameter, the scrape will return 404.

### Custom metrics

Automatic metrics are great, but the real value of monitoring is business metrics: how many orders processed, how many entities registered, how many validation errors occurred. Micrometer provides a convenient API for this:

```kotlin
@Service
class TrainingService(private val registry: MeterRegistry) {

    // Counter — only grows, suitable for counting events
    private val trainingsCreated = Counter.builder("trainings.created")
        .description("Number of created trainings")
        .register(registry)

    // Timer — measures execution time
    private val trainingTimer = Timer.builder("trainings.fetch.duration")
        .description("Time to fetch trainings list")
        .register(registry)

    fun createTraining(training: Training) {
        // business logic...
        trainingsCreated.increment()
    }

    fun getTrainings(): List<Training> {
        return trainingTimer.recordCallable {
            // DB query...
            trainingRepository.findAll()
        }!!
    }
}
```

There are also convenient `@Timed` and `@Counted` annotations — but they require separate configuration of AOP aspects, so for a start it's better to use the direct API via `MeterRegistry`.

### Endpoint Security

In production, `/actuator/prometheus` should not be publicly accessible — it may contain information about internal names of methods, classes, DB tables. If you have Spring Security, the simplest solution is to close actuator endpoints behind Basic Auth and specify the login/password in the Prometheus configuration.

---

## What's Next

Prometheus + Grafana is a living organism that needs to evolve along with the application. A few next steps after the basic setup:

**Alerting.** Prometheus can evaluate rules and send alerts via **Alertmanager** — to Slack, Telegram, PagerDuty. Meaning, instead of looking at graphs, you get a message only when something goes wrong.

**Grafana dashboards.** You don't need to build them from scratch — on [grafana.com/grafana/dashboards](https://grafana.com/grafana/dashboards) there are thousands of ready-made dashboards. For JVM applications, **JVM Micrometer** (ID: 4701) is particularly useful — it immediately shows heap, GC pauses, threads, and HTTP traffic.

**Service Discovery.** When there are many services, writing each one manually in `prometheus.yml` becomes inconvenient. Prometheus can automatically find targets via Kubernetes, Consul, AWS EC2, and other systems.

Prometheus is not just a tool, it's a change in approach to work: from "something broke, going to figure it out" to "I see something is about to break, going to fix it preventively". Once you see how metrics show a problem 10 minutes before a real crash — you won't want to go back to working blind.
