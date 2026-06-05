---
title: 'Two-factor authentication for SSH access to the server'
date: '2026-03-05'
category: 'TECH'
---

Спробуємо налаштувати двохфакторну автентифікацію (2FA) для доступу до сервера по протоколу SSH.

Існує безліч програм для різних девайсів, як з відкритим кодом так і пропрієтарних.
Використаємо Google Authenticator до 2020 код якого був відкритий та розповсюджувався по ліцензії Apache 2.0. Наразі код GA закритий але використання самої утиліти не вимагає будь якого ліцензування як для приватних користувачів, так і для компаній.

Двохфакторна автентифікація (надалі 2FA) для сервера зазвичай означає, що після введення пароля (або використання ключа) потрібно ввести ще одноразовий код (TOTP - time-based one-time password), який генерується на телефоні чи іншому пристрої.

Найпростіше підключити 2FA для **SSH-доступу**. Ось як це зробити на Linux (Ubuntu/Debian/CentOS/Oracle Linux підходить однаково):

---

### Крок 1. Встановіть пакет для Google Authenticator

```bash
sudo apt install libpam-google-authenticator    # Ubuntu/Debian
# або
sudo yum install google-authenticator           # CentOS/Oracle Linux
```

---

### Крок 2. Згенеруйте секретний ключ для користувача

Запустіть:

```bash
google-authenticator
```

Він:

- згенерує QR-код (його можна відсканувати в Google Authenticator / Authy / FreeOTP),
- створить секретний ключ,
- збереже конфіг у `~/.google_authenticator`.

Відповідайте на запитання:

- `Do you want me to update your "~/.google_authenticator" file?` → **y**
- `Do you want disallow multiple uses of the same authentication token?` → **y**
- `Do you want me to enable rate-limiting (to protect against brute-force)?` → **y**

---

### Крок 3. Налаштуйте PAM

Відредагуйте файл:

```bash
sudo nano /etc/pam.d/sshd
```

Додайте рядок на початку (перед `@include common-auth` або подібними):

```
auth required pam_google_authenticator.so
```

---

### Крок 4. Відредагуйте SSH

Відкрийте:

```bash
sudo nano /etc/ssh/sshd_config
```

Знайдіть і виставіть:

```
ChallengeResponseAuthentication yes
```

Якщо хочете вимагати **і пароль, і код**:

```
AuthenticationMethods password,keyboard-interactive
```

Або якщо у вас SSH-ключі + код:

```
AuthenticationMethods publickey,keyboard-interactive
```

---

### Крок 5. Перезапустіть SSH

```bash
sudo systemctl restart sshd
```

---

### Перевірка

1. Відкрийте нову SSH-сесію (стару не закривайте, щоб не "відрізати" себе від сервера).
2. Введіть пароль → потім код з додатку (6 цифр).

---

Додатково:

- Якщо ви використовуєте **root-доступ**, краще створити окремого користувача з sudo і підключити 2FA саме йому.
- Для більшої безпеки можна ще підключити **U2F/FIDO2 ключі** (наприклад YubiKey), але це складніше.

---
