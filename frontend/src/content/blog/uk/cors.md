---
title: 'Що таке CORS'
date: '2025-04-10'
category: 'TECH'
tags: ['cors', 'web', 'security', 'spring-boot']
---

### Що таке "origin" і звідки взагалі взялася проблема CORS

Коли ви тільки починаєте писати клієнт-серверні додатки і намагаєтесь зробити перший запит з фронтенду до бекенду, вірогідніше за все ви побачите першу помилку в консолі: **CORS error**. Щоб зрозуміти її суть, спочатку треба розібратися з базовим правилом безпеки браузера — **Same-Origin Policy (SOP)**.

Це правило з'явилося ще у 90-х роках. Його логіка проста: JavaScript-код, що виконується на певній сторінці, має право читати відповіді сервера лише в тому випадку, якщо сервер належить до того ж самого **origin** (джерела), що й сама сторінка.

Що таке цей origin? Це комбінація трьох елементів: `схема + хост + порт`. Якщо хоча б один із них відрізняється, для браузера це вже зовсім інший origin.

Ось кілька прикладів для сторінки, яка завантажена з `https://site.com`:

| URL                      | Той самий origin? | Чому так?                                |
| ------------------------ | ----------------- | ---------------------------------------- |
| `https://site.com/api`   | ✓                 | Усе збігається                           |
| `http://site.com/api`    | ✗                 | Інша схема (http замість https)          |
| `https://api.site.com/`  | ✗                 | Інший хост (піддомен api)                |
| `https://site.com:8080/` | ✗                 | Інший порт (8080 замість дефолтного 443) |

Чому Same-Origin Policy настільки важливе? Уявіть, що ви залогінені у своєму банку (наприклад, `bank.com`), а потім випадково заходите на якийсь шкідливий сайт `evil.com`. Якби не SOP, JavaScript на сайті зловмисника міг би відправити фоновий запит до вашого банку. Оскільки браузер автоматично додає ваші куки до таких запитів, банк подумав би, що це ви. Зловмисник міг би прочитати ваші дані або зробити переказ. SOP блокує можливість прочитати відповідь такого "чужого" запиту.

Проблема в тому, що сучасний веб працює інакше. Фронтенд у нас часто лежить на одному домені (скажімо, `app.myproject.com`), а бекенд API — на іншому (`api.myproject.com`). Це різні origin. І тут на допомогу приходить **CORS (Cross-Origin Resource Sharing)**. Це механізм, який дозволяє серверу "відкрити двері" і явно сказати браузеру: "Я знаю цей фронтенд, він мій, дозволь йому читати мої відповіді".

```mermaid
flowchart LR
  B[JS fetch()]
  S[API 200 OK<br/>Access-Control-Allow-Origin: *]
  P[OPTIONS preflight<br/>204 No Content]
  X[Помилка CORS<br/>Браузер блокує відповідь]

  B -->|GET /data<br/>Origin: frontend.example.com| S
  S -->|Дозволено| B

  B -->|DELETE /resource<br/>OPTIONS preflight| P
  P -->|Дозволено| B

  B -->|GET /blocked<br/>Origin: frontend.example.com| X
```

_Схема взаємодії браузера та сервера під час CORS-запиту._

---

### Як працює механізм CORS і що саме він блокує

Найголовніше, що треба запам'ятати: **CORS — це не механізм захисту вашого бекенду**. Багато розробників помилково вважають, що налаштування CORS врятує їх від небажаних запитів.

Насправді, браузер майже завжди **відправляє** ваш запит до сервера. Сервер отримує цей запит, обробляє його (змінює дані в базі, якщо це POST чи DELETE) і повертає відповідь. Робота CORS зводиться лише до одного: браузер дивиться на заголовки відповіді і вирішує, чи **віддавати цю відповідь вашому JavaScript-коду**, чи просто кинути помилку в консоль.

#### Прості запити (Simple Requests)

Щоб зекономити час і не робити зайвих перевірок, браузер виділяє так звані "прості" запити. Вони відправляються одразу, без додаткових попереджувальних дій. Запит вважається простим, якщо:

- Це метод `GET`, `POST` або `HEAD`.
- Якщо це `POST`, то заголовок `Content-Type` може бути лише одним із цих: `application/x-www-form-urlencoded`, `multipart/form-data` або `text/plain` (зверніть увагу: `application/json` сюди не входить!).
- У запиті немає якихось специфічних кастомних заголовків.

Що відбувається під капотом? Браузер додає до запиту заголовок `Origin`, де вказує, звідки прийшов запит:

```http
GET /api/public-data HTTP/1.1
Origin: https://frontend.example.com
```

Сервер повинен додати до своєї відповіді спеціальний заголовок `Access-Control-Allow-Origin`. Якщо цей заголовок збігається з вашим origin (або там стоїть `*`), JavaScript отримає доступ до даних.

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://frontend.example.com
```

#### Preflight-запити (Попередні перевірки)

Оскільки `application/json` сьогодні є стандартом де-факто, більшість наших запитів уже не є "простими". Якщо ви використовуєте методи на зразок `PUT`, `PATCH`, `DELETE`, надсилаєте JSON або додаєте кастомні заголовки (як-от `Authorization: Bearer ...`), браузер вмикає режим підвищеної обережності.

Перед тим, як відправити основний запит, браузер автоматично робить попередній — так званий **preflight-запит** з методом `OPTIONS`. Його мета: запитати сервер, чи взагалі можна надсилати такий запит.

```http
OPTIONS /api/users/123 HTTP/1.1
Origin: https://frontend.example.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: Authorization
```

Якщо сервер налаштований правильно, він поверне відповідь (зазвичай 204 No Content), у якій перелічить усе, що він дозволяє:

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://frontend.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

Ось цей `Access-Control-Max-Age` — дуже корисна штука. Він каже браузеру закешувати ці дозволи на вказану кількість секунд, щоб не бомбардувати сервер OPTIONS-запитами щоразу.

---

### CORS-заголовки

**Відповідь сервера:**

| Заголовок                          | Призначення                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Access-Control-Allow-Origin`      | Вказує, кому дозволено читати відповідь (конкретний origin або `*`)                                        |
| `Access-Control-Allow-Methods`     | Які HTTP-методи дозволені для цього ендпоінту                                                              |
| `Access-Control-Allow-Headers`     | Які кастомні заголовки може надсилати клієнт                                                               |
| `Access-Control-Allow-Credentials` | Чи дозволено клієнту прикріплювати куки та HTTP-авторизацію                                                |
| `Access-Control-Max-Age`           | Скільки секунд браузер може не повторювати preflight-запити                                                |
| `Access-Control-Expose-Headers`    | Додаткові заголовки відповіді сервера, до яких JavaScript матиме доступ (за замовчуванням доступні не всі) |

**Що надсилає браузер (ви цього не робите руками):**

| Заголовок                        | Що містить                                                     |
| -------------------------------- | -------------------------------------------------------------- |
| `Origin`                         | URL вашого фронтенду, звідки полетів запит                     |
| `Access-Control-Request-Method`  | Який метод ви збираєтесь використати (передається в `OPTIONS`) |
| `Access-Control-Request-Headers` | Які кастомні заголовки ви додаєте (передається в `OPTIONS`)    |

---

### Credentials та зірочка (\*): класична пастка

Найпростіший спосіб налаштувати CORS — просто повернути `Access-Control-Allow-Origin: *`. І це нормально працює для публічних API, які не вимагають авторизації.

Але тут є один важливий нюанс. Якщо ви відправляєте запит і хочете, щоб браузер прикріпив до нього куки (наприклад, для перевірки сесії), ви маєте вказати `credentials: 'include'` у вашому `fetch` або axios.

```javascript
// На фронтенді
fetch('https://api.myapp.com/profile', {
	credentials: 'include' // надсилаємо куки авторизації
});
```

У цьому випадку сервер **не може** відповісти зірочкою `*`. Це жорстке правило безпеки. Сервер зобов'язаний відповісти саме вашим конкретним origin і явно дозволити credentials.

```http
// На бекенді має бути так:
Access-Control-Allow-Origin: https://frontend.example.com
Access-Control-Allow-Credentials: true
```

Якщо сервер спробує схитрувати і віддасть `*` разом із `Allow-Credentials: true`, браузер миттєво забракує таку відповідь.

---

### Налаштування CORS у Spring Boot

У екосистемі Spring є кілька підходів до налаштування CORS.

**1. Анотація на конкретному контролері (точковий підхід):**
Якщо вам треба відкрити лише пару ендпоінтів, це чудовий варіант.

```java
@CrossOrigin(
    origins = "https://frontend.example.com",
    methods = {RequestMethod.GET, RequestMethod.POST}
)
@RestController
@RequestMapping("/api/public")
public class PublicDataController { ... }
```

**2. Глобальна конфігурація (best practice):**
Зазвичай зручніше налаштувати все в одному місці для всього API.

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("https://frontend.example.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type", "X-Custom-Header")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

**3. Інтеграція зі Spring Security:**

Якщо у вашому проєкті підключено Spring Security, стандартний фільтр CORS може просто не дочекатися запиту. Spring Security перехопить `OPTIONS`-запит на етапі перевірки авторизації і відкине його з помилкою `401 Unauthorized` або `403 Forbidden` (адже браузер у preflight-запиті не надсилає заголовки авторизації).

Щоб цього уникнути, потрібно подружити CORS зі Spring Security:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        // Вмикаємо інтеграцію CORS з Security
        .cors(Customizer.withDefaults())
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated()
        );

    return http.build();
}

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://frontend.example.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    // Застосовуємо ці правила до всіх маршрутів
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

### Як шукати проблеми з CORS

Коли ви бачите ту саму червону помилку в консолі накращий алгоритм дій наступний:

1. **Забудьте про консоль, йдіть у вкладку Network (Мережа)** у DevTools вашого браузера.
2. Знайдіть там ваш запит (або preflight-запит `OPTIONS`, який пішов перед ним).
3. Подивіться на **статус-код** і **тіло відповіді**.
   - Якщо статус 401 або 403 і це був `OPTIONS` — проблема на рівні конфігурації безпеки (наприклад, Spring Security), яка блокує preflight.
   - Якщо відповідь успішна (200), але немає заголовка `Access-Control-Allow-Origin`, отже ваш CORS на бекенді не налаштовано.
   - Якщо запит взагалі скасовано (failed), а сервер нічого не отримав — проблема скоріше за все з мережею (VPN, фаєрвол) або сервер просто лежить.
4. **Перевірте подвійні заголовки.** Якщо ви випадково налаштували CORS і через `@CrossOrigin`, і через глобальний фільтр, сервер може віддати два заголовки `Access-Control-Allow-Origin` одночасно. Браузер цього не зрозуміє і видасть помилку.
5. **Локальна розробка.** Пам'ятайте, що `http://localhost:3000` (фронт) і `http://localhost:8080` (бекенд) — це різні origin. Не забудьте додати порт 3000 у дозволені на вашому dev-сервері.

---

### Альтернатива для розробки: Proxy

На етапі локальної розробки часто набагато простіше обійти CORS взагалі, ніж налаштовувати його. Більшість інструментів (Vite, Webpack, Create React App) вміють проксувати запити.

Ви кажете своєму dev-серверу: "Усі запити, які починаються з `/api`, перенаправляй на `http://localhost:8080`". Тоді ваш фронтенд робить запит просто на `/api/users` (той самий origin!), а dev-сервер вже тихенько передає його на бекенд. Браузер навіть не підозрює, що бекенд знаходиться десь в іншому місці, тому CORS не задіюється взагалі.

Це добре працює для локальної розробки. У продакшені CORS все одно доведеться налаштовувати.
