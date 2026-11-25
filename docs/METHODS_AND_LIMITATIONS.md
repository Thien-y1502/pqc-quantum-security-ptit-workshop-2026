# Methods, scientific validity and threat-model boundaries

This document is part of the teaching material. Please read aloud the most important caveats in front of the benchmark charts. **Toy quantum simulation, real cryptographic software execution and production system assurance are three different forms of evidence.**

## A. Shor RSA order-finding model

- Parameters: `N=15`, `a=2`, counting register `t=6`, 64 possible `x`, 1,024 shots, RNG seed 20261123.
- Prepare the normalized basis state `sum_x |x>|2^x mod 15> / sqrt(64)` using an ideal reversible modular-exponentiation oracle. This is prepared directly as a state vector rather than synthesized gate by gate.
- Apply an inverse-QFT Fourier transform on the counting register (`numpy.fft.fft(..., norm='ortho')`). Sample the marginal probability distribution of the counting register.
- Read periodic peaks at outcomes 0,16,32,48, corresponding to order `r=4`.
- Classical post-processing: reconstruct candidate orders by rational approximation, check `a^r mod N=1`, compute `gcd(a^(r/2) +/- 1,N)` to recover 3 and 5. Use the recovered factors to derive a trivial RSA decryption key and decrypt an integer example.
- **Not established:** gate count, circuit depth, fault-tolerant resource requirement or any success against RSA-2048. `N=15` is explicitly a toy.

## B. Elliptic-curve discrete logarithm QFT model

- Curve: `E: y^2=x^3+2x+2 (mod 17)`, generator `(5,1)` with cyclic prime group order `r=19`.
- Public `Q=[d]P`, private `d=7`. Oracle mapping `|a,b,0> -> |a,b,aP+bQ>` constructed explicitly with elliptic-curve point operations over the small group.
- Prepare uniform a,b registers, apply inverse QFT on both registers, and sample pairs `(u,v)`. The character orthogonality relation gives `v = d*u (mod 19)` for nonzero-probability outcomes. For `u != 0`, reconstruct `d = v/u (mod 19)`.
- **Not established:** any attack on deployed secp256r1/P-256; gate synthesis and hardware costs are not modeled. The group order 19 was selected for educational tractability.

## C. Grover search model

- `n=8` qubits, `N=256` candidates, one ideal marked item at index 173, up to 15 oracle/diffusion rounds, 1,024 measurement shots per iteration, seed 20261123.
- A phase oracle flips the target amplitude; diffusion applies reflection around the mean. Plot ideal `sin^2((2t+1)asin(1/sqrt(N)))`, sampled state-vector probabilities, and the classical `(t+1)/N` success probability for distinct guesses.
- **Not established:** a reversible AES circuit, full AES key schedule, quantum hardware depth, cryptanalysis of AES-128/AES-256, or realistic query costs.

## D. Partial-information AES-128-GCM key recovery

- AES-GCM is executed using real Python cryptography. A synthetic key has 116 bits intentionally revealed and **only 12 unknown bits**.
- A fixed traversal tests 4,096 candidate suffixes using decryption and AEAD tag verification. The correct suffix is `0x6C5`, giving 1,734 attempts in this order.
- This demonstrates the consequences of key information exposure and limits of a toy search space; it is not a flaw in AES-128 or GCM. A full 128-bit unknown key would require a completely different search scale.

## E. HNDL scenario

- Uses the same toy EC group and a deliberately simplified point-to-HKDF derivation for a synthetic AES-GCM message.
- Attacker records public points plus ciphertext, then recovers the toy EC private scalar from the ideal Fourier model, computes the old shared point, re-derives the symmetric key and decrypts the stored message.
- This illustrates *conditional future risk* if classical public-key cryptography becomes tractable. It is not a TLS implementation or a realistic intercepted production connection.

## F. Standardized PQC, signatures and hybrid illustration

- OpenSSL 3.5.5 default provider executes real ML-KEM-768 (FIPS 203), ML-DSA-65 (FIPS 204), and SLH-DSA-SHA2-128s (FIPS 205) algorithm APIs via the CLI.
- ML-KEM: private/public key generation, encapsulation, decapsulation, assert both 32-byte secrets identical; derive a 256-bit key using HKDF-SHA256 and encrypt/decrypt synthetic content using AES-256-GCM; tampering is rejected by AEAD.
- Signatures: create, sign, verify; mutate message and verify again. Original passes; mutated fails.
- Hybrid *illustration*: independently compute an X25519 secret and an ML-KEM secret, concatenate and feed them through HKDF-SHA256. This is **not** a complete RFC 10024 TLS 1.3 handshake, wire encoding, key schedule, transcript-binding or authentication mechanism.
- NIST FIPS specifies algorithms; **OpenSSL binary availability is NOT equivalent to NIST FIPS 140 provider/module validation.** No compliance claim is made.

## G. Benchmark design

- Machine: see `results/raw/environment.json`, which records local OS, architecture, Python and OpenSSL version.
- Key and signature operations: OpenSSL CLI called from Python `subprocess`, independently generated keys, two warmups and 12 timed trials per operation in the delivered run. `time.perf_counter_ns()` measures wall clock **including process launch, file reads/writes and key parsing**. No CPU pinning, process isolation, or internal EVP cycle timings. Median and p95 are descriptive statistics for this one host, **not uncertainty intervals for global performance**.
- Public keys serialized as SubjectPublicKeyInfo DER; signature bytes and KEM ciphertext measured as files emitted by OpenSSL. File format must be accounted for in any comparison. Data not packetized into TLS.
- AES-128-GCM vs AES-256-GCM throughput: 1 MiB random synthetic payload, 30 trials per variant; encrypt + decrypt with `cryptography`, fresh random nonce for each encryption. Median and p5/p95 are shown within the AES binding only. Throughput is not directly comparable to OpenSSL subprocess timing.
- Five caveats: parameters do not always share the same NIST security category; timings have process overhead; results vary by hardware; protocol network RTT/certificates are excluded; side-channel, implementation and code audits are beyond this demo.

## H. Equations and claims

PowerPoint formulas are compiled from `.tex` using `pdflatex` and exported as high-DPI transparent PNG (plus vector PDF). The simplified K-PKE equations are meant to show cancellation of `A` terms and retained small error: FIPS 203 specifies additional details including polynomial module structure, rounding/compression and the IND-CCA-secure KEM transform. The simplified ML-DSA equations show the role of a public relation, masking vector, hash challenge, response and rejection; FIPS 204 adds packing, hints, decomposition, context, bounds and more.

## I. Reproducing figures and integrity

`python run_all.py` writes the raw CSV and JSON under `results/raw/`. `figures/plot_all.py` reads those CSV files directly and produces both PNG and SVG. `docs/OBSERVED_RESULTS.md` can be refreshed from raw results. The deck only embeds these actual plots, without fabricated bars or uncertainty ranges. Verification: `python -m unittest discover -s tests -v`, `python run_all.py`, `node slides/build_deck.js`, and the separate slide-overflow checker from the slide-authoring environment.

## J. Key sources and context

- NIST FIPS 203/204/205 published 13 August 2024: https://csrc.nist.gov/Projects/post-quantum-cryptography/post-quantum-cryptography-standardization
- NIST SP 800-227 final, 18 September 2025: https://csrc.nist.gov/pubs/sp/800/227/final
- NIST IR 8547 final, 27 October 2026: https://csrc.nist.gov/pubs/ir/8547/final
- IETF RFC 9954, July 2026: https://www.rfc-editor.org/rfc/rfc9954.html
- IETF RFC 10024, August 2026: https://www.rfc-editor.org/rfc/rfc10024.html

The specific 2030/2031 accelerated milestones and 2035 broader timeline in NIST IR 8547 concern U.S. federal policy contexts; they are not automatic Vietnamese commercial legal deadlines.
