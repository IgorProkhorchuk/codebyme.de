# Caffeine: A Deep Dive into Java's High-Performance In-Memory Cache

## What Is Caffeine?

Caffeine is a high-performance, near-optimal in-memory caching library for Java, developed by Ben Manes. It is the de-facto standard cache implementation in the Java ecosystem, having replaced Guava Cache as the recommended choice in Spring Framework 5+, and serving as the default cache provider in Spring Boot's auto-configuration.

The library is built on top of a decade of research in cache eviction algorithms and takes full advantage of modern JVM capabilities. Its headline feature is an implementation of the **W-TinyLFU** (Window Tiny Least Frequently Used) eviction policy, which delivers near-optimal hit rates across a wide variety of real-world access patterns — something no classical algorithm (LRU, LFU, FIFO) can claim on its own.

Caffeine targets Java 11+ and is available under the Apache 2.0 license.

---

## Why Not Guava Cache?

Guava Cache, Google's earlier caching solution, was the go-to for years. Caffeine is its spiritual successor and improves on it in nearly every dimension:

| Dimension | Guava Cache | Caffeine |
|---|---|---|
| Eviction algorithm | LRU segment-based | W-TinyLFU |
| Concurrency model | Segmented locking | Lock-free + ring buffers |
| Hit rate (typical) | Good | Near-optimal |
| Write throughput | Moderate | Very high |
| API compatibility | Own API | Guava-compatible adapter |
| Async loading | No | Yes (native) |

Caffeine ships a `GuavaCompatibility` adapter so migration from Guava Cache is largely mechanical. Spring Framework internally replaced Guava Cache with Caffeine as a backed in version 5, and Guava Cache was subsequently deprecated for caching use.

---

## Core Concepts

### The Cache Interface Hierarchy

Caffeine exposes three primary cache types, each building on the previous:

**`Cache<K, V>`** — the base, manual cache. You explicitly call `put()` and `getIfPresent()`. No automatic loading.

**`LoadingCache<K, V>`** — extends `Cache`. You supply a `CacheLoader` at build time; calling `get(key)` triggers automatic loading on a miss.

**`AsyncCache<K, V>`** and **`AsyncLoadingCache<K, V>`** — asynchronous variants that return `CompletableFuture<V>` instead of `V`, enabling non-blocking cache interactions.

### Eviction Policies

Three orthogonal eviction strategies can be combined:

**Size-based** eviction removes entries when the cache exceeds a configured maximum. Size can be defined as either entry count (`maximumSize`) or a custom weight (`maximumWeight` + `weigher`).

**Time-based** eviction supports two independent timers:
- `expireAfterWrite(duration)` — entry expires a fixed time after it was written.
- `expireAfterAccess(duration)` — entry expires if not accessed within the duration (sliding window).
- `expireAfter(Expiry)` — fully custom per-entry expiration logic via the `Expiry` interface.

**Reference-based** eviction uses JVM garbage collection semantics:
- `weakKeys()` — keys held by weak references; entries removed when key is GC'd.
- `weakValues()` — same for values.
- `softValues()` — values held by soft references; JVM evicts them under memory pressure.

These can be combined: a cache can simultaneously have a maximum size, a write expiry, and soft values.

---

## The W-TinyLFU Algorithm

This is Caffeine's most important differentiator and deserves a proper explanation.

### Why Pure LRU Falls Short

Least Recently Used (LRU) eviction is intuitive and cheap to implement, but it fails badly under one very common real-world pattern: **scan pollution**. A single full-table scan or batch job that touches thousands of cold keys in sequence will evict all hot, frequently-accessed entries from the cache, only to have those entries be reloaded immediately. The scan items, accessed exactly once, will never be needed again.

Pure LFU (Least Frequently Used) avoids scan pollution but has its own problem: it is biased toward historical frequency. An entry accessed ten thousand times last week will never be evicted even if it has been cold for days, blocking newer, hotter items.

### TinyLFU

TinyLFU is a frequency-based admission policy. Instead of evicting the least-recently-used item when the cache is full, it asks: "Is the incoming item more popular than the item I would evict?" If yes, swap; if no, reject the incoming item.

Frequency is tracked using a probabilistic data structure called a **Count-Min Sketch** — a compact 2D array of counters. This lets Caffeine approximate access frequency for every key ever seen, using only a few bytes per entry, without keeping a full frequency map in memory. Periodically, all counters are halved (the "aging" or "decay" step), which prevents old items from permanently dominating the frequency table.

### W-TinyLFU

TinyLFU alone still struggles with one scenario: a completely new entry, never seen before, has a frequency of zero and would always be rejected. This hurts workloads where new items immediately become hot (e.g., a product launch, a trending topic).

W-TinyLFU solves this by splitting the cache into two regions:

- **Window cache** (default ~1% of capacity): operates as a pure LRU. New items are admitted here unconditionally.
- **Main cache** (~99% of capacity): split further into a protected LRU segment and a probationary LRU segment. Items graduate from window → probationary → protected based on access frequency, competing via the TinyLFU frequency sketch.

An item evicted from the window cache competes against the least-popular item in the probationary segment. The frequency sketch decides the winner. This gives new items a fair trial period while preventing scan pollution from displacing genuinely popular entries.

The result: Caffeine's hit rate on real-world workloads (search traces, DB access logs, CDN logs) is within 1–3% of Bélády's optimal offline algorithm — the theoretical ceiling.

---

## Concurrency Architecture

Hit rate is one half of the performance story. The other half is throughput under high concurrency.

### The Read Buffer Problem

When a cache records an access (to update LRU order, for example), it needs to write to some shared structure — which means contention under concurrent reads. Guava's solution was to segment the cache and use per-segment locks, which helps but still serializes reads within a segment.

Caffeine takes a different approach: **reads are nearly free**.

For reads, Caffeine uses a **striped ring buffer** (one per CPU/thread stripe). A cache hit appends the accessed key to the ring buffer in a lock-free manner. A background **maintenance** task drains these buffers periodically to update the eviction policy state. This means the hot path for a cache read is: array lookup + CAS write to a ring buffer — no locks at all.

### Write Buffering

Writes (puts, invalidations) go into a **bounded MPSC (multi-producer, single-consumer) queue**. The maintenance task also drains this queue. If the write queue fills up, the caller performs a synchronous drain — a graceful backpressure mechanism.

### The Maintenance Task

The maintenance task runs:
- On every write (to drain write queue)
- After a configurable number of reads (to drain read buffers)
- When explicitly triggered

This amortizes the cost of bookkeeping across many operations, keeping per-operation overhead minimal.

---

## Getting Started

### Dependency

```xml
<!-- Maven -->
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
    <version>3.1.8</version>
</dependency>
```

```kotlin
// Gradle (Kotlin DSL)
implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")
```

### Building a Cache

```java
Cache<String, User> cache = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofMinutes(5))
    .recordStats()
    .build();
```

### Manual Cache Usage

```java
// Write
cache.put("user:42", user);

// Read (returns null on miss)
User user = cache.getIfPresent("user:42");

// Read with fallback (atomic: only one loader runs per key)
User user = cache.get("user:42", key -> userRepository.findById(42));

// Invalidate
cache.invalidate("user:42");
cache.invalidateAll();
```

### Loading Cache

```java
LoadingCache<Long, User> userCache = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofMinutes(10))
    .build(userId -> userRepository.findById(userId));  // CacheLoader

// get() auto-loads on miss, never returns null (throws on loader exception)
User user = userCache.get(42L);

// Bulk loading (uses getAll internally, calls loadAll if defined)
Map<Long, User> users = userCache.getAll(List.of(1L, 2L, 3L));
```

### Async Loading Cache

```java
AsyncLoadingCache<Long, User> asyncCache = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofMinutes(5))
    .buildAsync(userId ->
        CompletableFuture.supplyAsync(() -> userRepository.findById(userId))
    );

// Returns CompletableFuture<User>
CompletableFuture<User> future = asyncCache.get(42L);
User user = future.join();
```

---

## Expiry Strategies in Depth

### Fixed Write Expiry

```java
Caffeine.newBuilder()
    .expireAfterWrite(Duration.ofSeconds(30))
    .build();
```

Ideal for caches where the source of truth changes at a known maximum rate.

### Sliding Access Expiry

```java
Caffeine.newBuilder()
    .expireAfterAccess(Duration.ofMinutes(5))
    .build();
```

Keeps hot entries alive indefinitely, evicts cold ones. Good for session caches.

### Custom Per-Entry Expiry

```java
Caffeine.newBuilder()
    .expireAfter(new Expiry<String, CachedResponse>() {
        @Override
        public long expireAfterCreate(String key, CachedResponse value, long currentTime) {
            // Use Cache-Control max-age from the HTTP response
            return TimeUnit.SECONDS.toNanos(value.maxAgeSeconds());
        }

        @Override
        public long expireAfterUpdate(String key, CachedResponse value,
                                       long currentTime, long currentDuration) {
            return currentDuration; // keep original TTL on update
        }

        @Override
        public long expireAfterRead(String key, CachedResponse value,
                                     long currentTime, long currentDuration) {
            return currentDuration; // reads don't extend TTL
        }
    })
    .build();
```

The `Expiry` interface gives you full control: different TTLs per key, per value content, or based on external metadata.

---

## Refresh vs. Expiry

Caffeine distinguishes between **expiration** (entry becomes invalid, next access triggers synchronous reload) and **refresh** (entry becomes stale, but the next access returns the old value while a background reload is triggered).

```java
LoadingCache<String, Config> configCache = Caffeine.newBuilder()
    .maximumSize(100)
    .refreshAfterWrite(Duration.ofMinutes(1))   // async refresh
    .expireAfterWrite(Duration.ofMinutes(5))    // hard expiry as safety net
    .build(key -> configService.load(key));
```

With `refreshAfterWrite`, the first access after the refresh interval triggers an asynchronous reload. The calling thread immediately receives the (potentially stale) old value — no blocking. When the reload completes, subsequent reads get the fresh value. This is the right choice for config caches, where serving a slightly stale value is fine but blocking every reader during reload is not.

---

## Weigher: Size by Weight, Not Count

When cached values have highly variable sizes (e.g., HTTP response bodies), counting entries is misleading. Caffeine supports weight-based sizing:

```java
Cache<String, byte[]> responseCache = Caffeine.newBuilder()
    .maximumWeight(100 * 1024 * 1024)  // 100 MB
    .weigher((String key, byte[] value) -> value.length)
    .build();
```

The weigher is called on every put. The cache evicts entries until total weight is below the maximum.

---

## Statistics and Monitoring

```java
Cache<String, User> cache = Caffeine.newBuilder()
    .maximumSize(1000)
    .recordStats()  // enables stats collection
    .build();

CacheStats stats = cache.stats();

System.out.printf("Hit rate:        %.2f%%%n", stats.hitRate() * 100);
System.out.printf("Hit count:       %d%n",   stats.hitCount());
System.out.printf("Miss count:      %d%n",   stats.missCount());
System.out.printf("Load success:    %d%n",   stats.loadSuccessCount());
System.out.printf("Load failure:    %d%n",   stats.loadFailureCount());
System.out.printf("Avg load time:   %.2f ms%n", stats.averageLoadPenalty() / 1e6);
System.out.printf("Eviction count:  %d%n",   stats.evictionCount());
System.out.printf("Eviction weight: %d%n",   stats.evictionWeight());
```

For production, plug stats into Micrometer:

```java
CaffeineCache caffeineCache = new CaffeineCache("users", cache);
new CaffeineCacheMetrics(caffeineCache, "users_cache", List.of())
    .bindTo(Metrics.globalRegistry);
```

---

## Spring Integration

### Spring Boot Auto-Configuration

Add `caffeine` to your classpath and configure via `application.yml`:

```yaml
spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=500,expireAfterWrite=10m
```

Enable caching in your application:

```java
@SpringBootApplication
@EnableCaching
public class Application { ... }
```

Use `@Cacheable`, `@CachePut`, `@CacheEvict` as usual:

```java
@Service
public class UserService {

    @Cacheable(value = "users", key = "#id")
    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow();
    }

    @CachePut(value = "users", key = "#user.id")
    public User update(User user) {
        return userRepository.save(user);
    }

    @CacheEvict(value = "users", key = "#id")
    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}
```

### Programmatic Spring Configuration (Multiple Caches)

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCacheNames(List.of("users", "products", "sessions"));

        // Default spec for all caches
        manager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(5))
            .recordStats());

        return manager;
    }
}
```

For per-cache configuration, construct individual `CaffeineCache` instances and wrap them in a `SimpleCacheManager`.

---

## Reference-Based Eviction

```java
// Keys evicted when no strong references exist outside the cache
Cache<Key, Value> weakKeyCache = Caffeine.newBuilder()
    .weakKeys()
    .build();

// Values evicted under GC memory pressure
Cache<Key, Value> softValueCache = Caffeine.newBuilder()
    .softValues()
    .build();
```

A note on identity: `weakKeys()` forces key comparison by reference identity (`==`) rather than `equals()`. This can produce surprising behavior if your keys are `String` literals versus `new String("...")`. Use with care, and prefer time- or size-based eviction for predictability.

---

## Removal Listeners

Caffeine notifies you when entries are removed, along with the reason:

```java
Cache<String, Connection> connCache = Caffeine.newBuilder()
    .maximumSize(50)
    .expireAfterWrite(Duration.ofMinutes(1))
    .removalListener((String key, Connection conn, RemovalCause cause) -> {
        if (cause.wasEvicted()) {
            conn.close();  // release resource on eviction
        }
    })
    .build();
```

`RemovalCause` values: `EXPLICIT` (manual invalidation), `REPLACED` (put over existing key), `COLLECTED` (GC'd due to weak/soft reference), `EXPIRED`, `SIZE`.

For async notification (listener runs on a separate executor), use `evictionListener()` instead of `removalListener()`.

---

## Common Pitfalls

**Not calling `recordStats()` in development.** Stats add a small overhead, but they are the only way to know your hit rate. Always enable them during performance testing.

**Using `getIfPresent()` in a loading pattern.** A common mistake is writing `if (cache.getIfPresent(key) == null) { cache.put(key, load(key)); }`. This is not atomic: two threads can both see a miss and both load. Use `cache.get(key, loadingFunction)` or `LoadingCache` instead.

**Ignoring `expireAfterWrite` vs. `expireAfterAccess` semantics.** `expireAfterAccess` prevents eviction of frequently-accessed items, which sounds good — but it means a single rarely-missed key stays in cache indefinitely. For time-sensitive data (prices, auth tokens), always use `expireAfterWrite`.

**Storing `null` values.** Caffeine does not allow null keys or values (unlike `ConcurrentHashMap`). If your loader may return null (e.g., "user not found"), wrap the value in an `Optional<V>` or use a sentinel object.

**Misconfiguring weight.** If you use `maximumWeight`, you must also supply a `weigher`. Forgetting either throws at build time — but setting `maximumSize` when you meant `maximumWeight` silently does the wrong thing.

**Conflating cache size with memory.** `maximumSize(10_000)` limits the number of entries, not bytes. If each entry is 1 MB, you just allocated 10 GB. Use `maximumWeight` for size-aware caching.

---

## When to Use Caffeine

Caffeine is the right tool when:

- You need a **local, per-JVM cache** (not distributed).
- Your data fits in heap memory.
- You need **high read throughput** with minimal latency overhead.
- The cost of a cache miss (loading from DB, calling a remote service) is significantly higher than the cost of a hit.
- You need **fine-grained eviction control** (per-entry TTL, weight, refresh-ahead).

Caffeine is **not** the right tool when:

- You need data shared across multiple JVM instances — use Redis, Hazelcast, or similar.
- Your dataset is too large for heap memory — use an off-heap or disk-based store.
- You need strong consistency guarantees across nodes.

---

## Performance Numbers

Benchmarks from the Caffeine repository (JMH, 16-core machine, ~100K entries):

| Operation | Guava Cache | Caffeine |
|---|---|---|
| Read throughput | ~100M ops/sec | ~500M ops/sec |
| Write throughput | ~15M ops/sec | ~100M ops/sec |
| Hit rate (DB trace) | ~81% | ~95% |

These are representative numbers; your workload will differ. The throughput advantage comes from the lock-free read path. The hit rate advantage comes from W-TinyLFU.

---

## Summary

Caffeine earns its position as the default Java cache by solving the two problems that matter most in practice: **hit rate** and **concurrency throughput**. The W-TinyLFU algorithm handles the first by combining the adaptability of LRU with the accuracy of LFU and the noise resistance of frequency sketches. The ring-buffer concurrency model handles the second by making reads essentially contention-free.

For any Spring application doing repetitive reads against a database, a remote service, or an expensive computation, adding a Caffeine cache with a well-chosen TTL and a `recordStats()` call is one of the highest-return optimizations available. Start with `maximumSize` + `expireAfterWrite`, measure the hit rate, tune from there.
