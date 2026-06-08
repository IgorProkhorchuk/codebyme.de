---
title: 'Entropy in Computer Science: From Shannon''s Theory to Neural Networks'
date: '2024-11-23'
category: 'TECH'
tags: ['linux', 'security', 'entropy']
---

## 1. What is entropy and where did it come from in IT

The word "entropy" came into computer science from physics — and it's no coincidence. In 1865, Rudolf Clausius introduced the term to describe the degree of "disorder" of a thermodynamic system. The greater the entropy, the greater the disorder, the less we know about the state of each individual particle.

In 1948, Claude Shannon — an American mathematician and engineer at Bell Labs — published the paper _"A Mathematical Theory of Communication"_, which laid the foundations of all modern information theory. Shannon consciously borrowed the term "entropy": he noticed that his formula is mathematically identical to Boltzmann's formula from physics. John von Neumann even advised him to use exactly this word — "because nobody knows what entropy really is, so in a debate you will always have the advantage."

But in computer science, entropy has acquired a specific, measurable meaning: **the amount of uncertainty (or information) in a message**.

---

## 2. Shannon's Information Entropy — the heart of the theory

### 2.1 Intuition

Imagine a coin. If the coin is fair (50/50), the result of a flip is maximally unpredictable — entropy is maximum. If the coin always lands on heads — there is no uncertainty, entropy is zero.

Now imagine an alphabet. In English, the letter `e` occurs ~13% of the time, and `z` — ~0.07%. If you see `z`, it's a more "surprising" event — it carries more information.

Shannon formalized this principle: **information from an event is inversely proportional to its probability**.

### 2.2 Formula

For a discrete source with $n$ possible states with probabilities $p_1, p_2, \ldots, p_n$, Shannon's entropy is defined as:

$$
H(X) = -\sum_{i=1}^{n} p_i \log_2 p_i
$$

The unit of measurement is the **bit** (if the logarithm is base 2). Each term $-p_i \log_2 p_i$ is the "contribution" of event $i$ to the total uncertainty.

A few edge cases:

- If $p_i = 1$ for some single event, then $H = 0$ (absolute certainty)
- If all $p_i$ are equal ($p_i = 1/n$), then $H = \log_2 n$ — maximum
- Convention: $0 \cdot \log_2 0 = 0$ (limit)

For example, for 8 equally probable symbols: $H = \log_2 8 = 3$ bits — meaning we need exactly 3 bits to encode one symbol. Move the slider — and you will see how entropy reaches its maximum with equally probable events and drops to zero when one of them becomes dominant.

---

## 3. Entropy and Data Compression

This is the first and most important practical application of Shannon's theory.

### 3.1 Source Coding Theorem

Shannon proved a fundamental theorem: **no lossless compression algorithm can compress data below its entropy**. This is a theoretical lower bound — the information "limit of compressibility".

If a text has an entropy of 4 bits per symbol, you will never compress it to less than 4 bits per symbol without losing information — with no algorithm, no supercomputer.

### 3.2 Huffman Code

The Huffman algorithm (1952) is one of the most elegant ways to approach this limit. The idea: symbols with higher probability are assigned shorter codes, rare ones — longer.

Example for a text of four symbols:

| Symbol | Probability | Huffman Code | Length |
| ------ | ----------- | ------------ | ------- |
| A      | 0.50        | `0`          | 1 bit   |
| B      | 0.25        | `10`         | 2 bits  |
| C      | 0.125       | `110`        | 3 bits  |
| D      | 0.125       | `111`        | 3 bits  |

Average code length: $0.5 \times 1 + 0.25 \times 2 + 0.125 \times 3 + 0.125 \times 3 = 1.75$ bits.
Entropy: $H = -(0.5 \log_2 0.5 + 0.25 \log_2 0.25 + 2 \times 0.125 \log_2 0.125) = 1.75$ bits.

The match is exact — Huffman achieved the theoretical minimum for this distribution.

In practice, modern algorithms — **Deflate** (PNG, ZIP), **Brotli**, **Zstandard** — combine several methods: first they find repeating strings (LZ77/LZ78), and then apply entropy coding (Huffman or arithmetic coding). Arithmetic coding approaches the theoretical limit even more accurately, but is more complex to implement.

### 3.3 Entropy of Different Data Types

| Data Type         | Typical Entropy | Compression Ratio      |
| ----------------- | --------------- | ---------------------- |
| Random bytes      | ~8 bits/byte    | ~1.0× (incompressible) |
| Executable file   | ~6–7 bits/byte  | ~1.3–1.5×              |
| English text      | ~4–5 bits/symbol| ~1.5–2×                |
| HTML              | ~3–4 bits/symbol| ~2–3×                  |
| Database (JSON)   | ~2–3 bits/symbol| ~3–5×                  |

Why does an executable file compress poorly? Because machine code is constructed so that each byte carries maximum information. It is almost a uniform distribution of bytes — high entropy.

---

## 4. Entropy in Cryptography

Cryptography and information theory are inextricably linked — Shannon personally wrote the paper _"Communication Theory of Secrecy Systems"_ in 1949.

### 4.1 Key Entropy

In cryptography, entropy means **key unpredictability** — and this is a matter of security, not academia.

A 128-bit key generated by a true random number generator (TRNG) has 128 bits of entropy. A brute-force attack requires an average of $2^{127}$ attempts — practically unfeasible.

But if a "128-bit" key is generated with a bad PRNG that effectively yields only 20 different values — it only has $\log_2 20 \approx 4.3$ bits of entropy. Such a key is cracked in microseconds.

This is why proper entropy generation is one of the most important tasks in cryptography. Used for this are:

- Hardware sources: thermal noise, photon noise, radioactive decay
- In Linux: `/dev/random` and `/dev/urandom` collect entropy from interrupts, network, mouse movement
- CSPRNG (Cryptographically Secure PRNG): ChaCha20, Fortuna

### 4.2 Perfect Cipher and One-Time Pad

Shannon proved that **the only theoretically unbreakable cipher** is the one-time pad: the key is as long as the message, random, and used only once. Under these conditions, the ciphertext carries no information about the plaintext — the conditional entropy $H(\text{plaintext} | \text{ciphertext}) = H(\text{plaintext})$.

### 4.3 Password Entropy

A popular formula for evaluating passwords:

$$
H_{\text{pass}} = L \cdot \log_2 N
$$

where $L$ is password length, $N$ is alphabet size. But this is an "upper" bound — if the password is not a truly random sequence, the real entropy is lower. Dictionary passwords like `password123` have almost zero entropy in terms of security, even though they look "long".

---

## 5. Entropy in Machine Learning

This is arguably the most active modern application of entropy concepts.

### 5.1 Cross-Entropy as a Loss Function

**Cross-entropy** ($H(p, q)$) measures the difference between two probability distributions — the "true" $p$ and the "predicted" $q$:

$$
H(p, q) = -\sum_{i} p_i \log q_i
$$

In classification tasks, the true distribution $p$ is a one-hot vector (1 for the correct class, 0 for the rest), and $q$ is the vector of predicted probabilities by the model. Then the formula simplifies:

$$
\mathcal{L} = -\log q_{\text{correct}}
$$

That is: **we penalize the model more, the lower the probability it assigned to the correct class**. This is Binary Cross-Entropy (BCE) or Categorical Cross-Entropy (CCE) — standard loss functions for neural networks.

### 5.2 Kullback–Leibler Divergence (KL-divergence)

$$
D_{KL}(p \| q) = \sum_i p_i \log \frac{p_i}{q_i} = H(p, q) - H(p)
$$

KL-divergence is the "distance" from distribution $q$ to $p$ (asymmetric!). It is widely used in:

- **VAE (Variational Autoencoder)**: the regularization term $D_{KL}(q(z|x) \| p(z))$ "penalizes" the latent space for deviating from the standard normal distribution
- **RL with Reinforcement (RLHF)**: PPO and derivative algorithms bound $D_{KL}$ between the new and old policy to make training stable
- **Knowledge Distillation**: KL between "teacher" and "student" distributions

### 5.3 Entropy in Decision Trees

The classic **ID3** algorithm and its descendants (C4.5, CART) use entropy to select a feature for splitting.

**Information Gain** for feature $A$:

$$
\text{IG}(S, A) = H(S) - \sum_{v \in \text{values}(A)} \frac{|S_v|}{|S|} H(S_v)
$$

where $H(S)$ is the entropy of the current dataset, $S_v$ is the subset of examples where feature $A$ has value $v$.

The algorithm greedily chooses the feature with maximum $\text{IG}$ — meaning the one that most reduces uncertainty in the data. This is a direct translation of the physical idea into a learning algorithm: we want each split to bring maximum "order" to the classification. Note: when a model gives the correct class only 10% probability — the loss explodes. This is why gradient descent so painfully punishes "overconfident mistakes".

---

## 6. Entropy and Entropy Coding in Practice

### 6.1 ANS (Asymmetric Numeral Systems)

The modern de facto standard is the **ANS** algorithm, developed by Jarek Duda in 2007–2013. It combines the speed of Huffman tables with the accuracy of arithmetic coding.

ANS is used in:

- **Zstandard (zstd)** — Facebook, 2016, currently a standard in the Linux kernel
- **Apple LZFSE** — compression in macOS/iOS
- **Facebook/Meta WebP-like** formats

The idea of ANS: we encode a sequence of symbols as one large integer $x$. Each new symbol "expands" $x$ by a number of bits equal to $\log_2(1/p_i)$ — exactly as much information as this symbol carries. The entropy efficiency is about 0.001 bits from the theoretical minimum.

### 6.2 Entropy in Network Protocols

**HTTP/2 HPACK** and **HTTP/3 QPACK** use entropy coding for HTTP headers. Headers like `Content-Type: application/json` repeat in every request — the algorithm builds a static table of the most common headers and encodes them with a single byte instead of dozens.

---

## 7. Thermodynamic Entropy and Landauer's Principle

This is perhaps the most philosophical part — but with very real engineering consequences.

### 7.1 Landauer's Principle (1961)

Rolf Landauer of IBM proved: **erasing one bit of information physically requires expending at least $k_B T \ln 2$ of energy**, where $k_B$ is the Boltzmann constant, $T$ is the temperature in kelvins.

At room temperature (300 K):

$$
E_{\min} = 1.38 \times 10^{-23} \times 300 \times \ln 2 \approx 2.87 \times 10^{-21} \text{ Joules}
$$

A modern transistor consumes about $10^{-15}$ J per operation — millions of times more than Landauer's limit. But we are approaching it: according to Moore's law, transistor scaling has slowed down precisely due to thermal limits.

This means: **even a perfect computer of the future is bounded by physics**. Google DeepMind estimates show that if modern data centers approached Landauer's limit, energy consumption would be reduced by $10^8$ times.

### 7.2 Reversible Computing

From this grows the idea of **reversible computing**: if we never erase bits (Toffoli gate, Fredkin gate), we can theoretically compute without wasting heat. It is precisely on this principle that **quantum computers** are built — quantum operations are unitary (reversible).

---

## 8. Entropy in Systems and Software Architecture

### 8.1 "Code Entropy"

In engineering culture, the term "entropy" is used metaphorically: **codebase entropy** is the degree of its disorder. Over time, without refactoring, code accumulates "technical debt": coupling increases, coherence decreases, the number of edge cases grows.

The second law of thermodynamics in programming: a "closed system" (without refactoring) always moves towards greater disorder. Hence the task of architects is to design systems so that their "entropy" grows as slowly as possible.

### 8.2 Entropy in Distributed Systems

In the context of the CAP theorem and Eventual Consistency: the more "distributed" a system is (more nodes, larger network) — the greater the entropy of states. Consistency problems are essentially a fight against entropy: preserving an "ordered" global state in a system where parts change independently.

**Gossip protocols** (used in Cassandra, Redis Cluster) are entropy-resistant information dissemination algorithms: even with failures and delays, the system ultimately reaches a consistent state.

---

## 9. Common Table of Concepts---

## 10. Related Concepts to Know

### Mutual Information

$$
I(X; Y) = H(X) - H(X|Y) = H(X) + H(Y) - H(X,Y)
$$

Measures how much information about $X$ is contained in $Y$. Used in feature selection, analyzing correlations in neural networks, and — in a broader context — for analyzing the "information flow" through transformer layers.

### Differential Entropy

For continuous distributions, Shannon's standard formula is replaced by:

$$
h(X) = -\int_{-\infty}^{\infty} f(x) \log f(x) \, dx
$$

The highest differential entropy among all distributions with fixed variance is the **normal distribution** — which is why it occurs so often in nature and in ML (Central Limit Theorem). VAEs use exactly the normal distribution for the latent space.

### Algorithmic Complexity and Kolmogorov Entropy

Andrey Kolmogorov proposed another measure of complexity: the **algorithmic complexity** of a string $s$ is the length of the shortest program that generates $s$. It is related to Shannon's entropy but is a property of a specific string, not a distribution. The disadvantage is that it is **uncomputable** (halting problem), but it is theoretically important — particularly in studies of Minimum Description Length (MDL) and in PAC learning theory.

---

## 11. Practical Summary for a Developer

**Entropy is not an abstraction, but a tool.** Here is where it occurs in daily practice:

When working with data, you should know: if `gzip` compresses your JSON by only 5% — the data is already almost entropically saturated; if by 90% — there is high redundancy that can be eliminated at the schema level.

In security: never use `Math.random()` to generate tokens — in the browser it is not cryptographic. Use `crypto.getRandomValues()` (Web Crypto API) or `secrets.token_bytes()` in Python.

In ML: when your model outputs `cross_entropy_loss → 0`, check for overfitting — the model might have "memorized" answers rather than learned.

In decision trees: `Information Gain` and `Gini Impurity` are two different ways to measure the "disorder" of a subset. The first is based on Shannon's entropy, the second is an approximation — faster, but less theoretically precise.

---

Entropy is one of those concepts that is simultaneously a **fundamental law of nature** and a **concrete number** that can be measured in code. From the minimum size of a ZIP archive to the loss function of your transformer — behind everything is the same Shannon formula, written in 1948.
