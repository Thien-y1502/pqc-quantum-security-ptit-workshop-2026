# Observed results - actual local execution

Source: `python run_all.py --trials 12 --aes-trials 30` on the environment recorded below.

> Not portable performance numbers: all OpenSSL key/signature timing includes subprocess startup, file I/O and key parsing. AES throughput is in-process and belongs to a separate timing harness.

## Verified synthetic demos

- RSA toy N=15: factors `[3, 5]`, order `r=4`; RSA integer decrypted successfully.
- ECC toy r=19: recovered secret `7`, recoverable shot fraction `0.9512`.
- Grover N=256: ideal peak at iteration `12`, probability `0.999947`.
- AES-128-GCM: search limited to 12 unknown bits; `1734` attempts, elapsed `3.404 ms` on this host.
- ML-KEM-768: ciphertext `1088` bytes, shared secret `32` bytes; successful AES-GCM roundtrip and AEAD tamper rejection.
- ML-DSA-65 and SLH-DSA-SHA2-128s: valid signatures accepted and modified signed messages rejected.
- Hybrid educational composition: X25519+ML-KEM, HKDF, AES-GCM roundtrip; not real TLS.

## Observed primitive latencies (milliseconds)

| family | algorithm | operation | trials | median_ms | p95_ms |
| --- | --- | --- | --- | --- | --- |
| key_establishment | ML-KEM-768 | decapsulate | 12 | 6.17457 | 8.77248 |
| key_establishment | ML-KEM-768 | encapsulate | 12 | 6.72348 | 11.46176 |
| key_establishment | X25519 | derive | 12 | 6.02969 | 10.15977 |
| signature | ECDSA-P256 | sign | 12 | 6.80316 | 9.13468 |
| signature | ECDSA-P256 | verify | 12 | 6.83998 | 8.05043 |
| signature | ML-DSA-65 | sign | 12 | 7.95465 | 9.61233 |
| signature | ML-DSA-65 | verify | 12 | 6.49775 | 11.34426 |
| signature | RSA-PSS-2048 | sign | 12 | 7.41595 | 9.39645 |
| signature | RSA-PSS-2048 | verify | 12 | 6.29846 | 8.62774 |
| signature | SLH-DSA-SHA2-128s | sign | 12 | 393.73004 | 557.49311 |
| signature | SLH-DSA-SHA2-128s | verify | 12 | 6.71916 | 15.74819 |

## Serialized artifacts (bytes)

| family | algorithm | size_type | bytes |
| --- | --- | --- | --- |
| signature | RSA-PSS-2048 | public_key_SPKI_DER | 294 |
| signature | RSA-PSS-2048 | signature | 256 |
| signature | ECDSA-P256 | public_key_SPKI_DER | 91 |
| signature | ECDSA-P256 | signature | 72 |
| signature | ML-DSA-65 | public_key_SPKI_DER | 1974 |
| signature | ML-DSA-65 | signature | 3309 |
| signature | SLH-DSA-SHA2-128s | public_key_SPKI_DER | 50 |
| signature | SLH-DSA-SHA2-128s | signature | 7856 |
| key_establishment | X25519 | public_key_SPKI_DER | 44 |
| key_establishment | ML-KEM-768 | public_key_SPKI_DER | 1206 |
| key_establishment | X25519 | secret_bytes | 32 |
| key_establishment | ML-KEM-768 | ciphertext | 1088 |
| key_establishment | ML-KEM-768 | secret_bytes | 32 |

## AES-GCM throughput (MiB/s)

| algorithm | operation | trials | median_mib_s | p5_mib_s | p95_mib_s |
| --- | --- | --- | --- | --- | --- |
| AES-128-GCM | encrypt | 30 | 9183.54 | 1323.78 | 9709.15 |
| AES-128-GCM | decrypt | 30 | 9328.61 | 3422.34 | 9786.73 |
| AES-256-GCM | encrypt | 30 | 7708.34 | 3423.78 | 8501.11 |
| AES-256-GCM | decrypt | 30 | 8412.64 | 4477.52 | 8820.23 |

## Local runtime metadata

```json
{
  "openssl_version": "OpenSSL 3.5.5 27 Jan 2026 (Library: OpenSSL 3.5.5 27 Jan 2026)",
  "platform": "Linux-6.18.57-x86_64-with-glibc2.41",
  "python": "3.13.5",
  "machine": "x86_64",
  "processor": "",
  "trials_per_primitive": 12,
  "aes_trials": 30,
  "timing_method": "wall clock ns / subprocess for key and signatures, AES Python binding in-process",
  "limitations": [
    "Not a controlled cross-implementation cryptographic benchmark",
    "OpenSSL CLI results include process startup, PEM parse, disk I/O",
    "AES-GCM uses Python binding, compared only within AES variants",
    "No networking/real TLS or side channels measured",
    "Single-host non-isolated exploratory benchmark; performance can vary by run"
  ]
}
```

## Scientific interpretation

No cryptanalytically relevant quantum hardware was used; Shor/ECC/Grover are ideal small-register models and only validate toy mathematics. The AES attack assumes 116 of 128 key bits are known. Production secure-channel behavior, cryptographic code audit, fault tolerance, FIPS 140 validation and real-world TLS overhead were not tested.
