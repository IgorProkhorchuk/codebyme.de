---
title: 'Two-factor authentication for SSH access to the server'
date: '2026-03-05'
category: 'TECH'
tags: ['security', '2fa']
---

Let's try to set up two-factor authentication (2FA) for SSH access to a server.

There are many applications for various devices, both open-source and proprietary. We will use Google Authenticator, whose code was open and distributed under the Apache 2.0 license until 2020. Currently, the GA code is closed, but using the utility itself does not require any licensing for either private users or companies.

Two-factor authentication (hereinafter 2FA) for a server usually means that after entering a password (or using a key), you need to enter a one-time code (TOTP - time-based one-time password), which is generated on a phone or other device.

The easiest way is to enable 2FA for **SSH access**. Here is how to do it on Linux (Ubuntu/Debian/CentOS/Oracle Linux are suitable):

---

### Step 1. Install the package for Google Authenticator

```bash
sudo apt install libpam-google-authenticator    # Ubuntu/Debian
# or
sudo yum install google-authenticator           # CentOS/Oracle Linux
```

---

### Step 2. Generate a secret key for the user

Run:

```bash
google-authenticator
```

It will:

- generate a QR code (which can be scanned in Google Authenticator / Authy / FreeOTP),
- create a secret key,
- save the config in `~/.google_authenticator`.

Answer the questions:

- `Do you want me to update your "~/.google_authenticator" file?` → **y**
- `Do you want disallow multiple uses of the same authentication token?` → **y**
- `Do you want me to enable rate-limiting (to protect against brute-force)?` → **y**

---

### Step 3. Configure PAM

Edit the file:

```bash
sudo nano /etc/pam.d/sshd
```

Add the line at the beginning (before `@include common-auth` or similar):

```
auth required pam_google_authenticator.so
```

---

### Step 4. Configure SSH

Open:

```bash
sudo nano /etc/ssh/sshd_config
```

Find and set:

```
ChallengeResponseAuthentication yes
```

If you want to require **both a password and a code**:

```
AuthenticationMethods password,keyboard-interactive
```

Or if you have SSH keys + a code:

```
AuthenticationMethods publickey,keyboard-interactive
```

---

### Step 5. Restart SSH

```bash
sudo systemctl restart sshd
```

---

### Verification

1. Open a new SSH session (do not close the old one, so as not to "cut" yourself off from the server).
2. Enter the password → then the code from the application (6 digits).

---

Additional tips:

- If you use **root access**, it is better to create a separate user with sudo and enable 2FA for them.
- For greater security, you can also use **U2F/FIDO2 keys** (e.g. YubiKey), but this is more complex.
