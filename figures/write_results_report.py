"""Create a truthful markdown report from the saved CSV/JSON observations."""
from pathlib import Path
import csv
import json

root=Path(__file__).resolve().parents[1]
raw=root/'results'/'raw'

def rows(n):
    with (raw/n).open(newline='',encoding='utf8') as f:return list(csv.DictReader(f))

def table(rs,keys):
    out=['| '+' | '.join(keys)+' |','| '+' | '.join(['---']*len(keys))+' |']
    out.extend('| '+' | '.join(str(r.get(k,'')) for k in keys)+' |' for r in rs)
    return '\n'.join(out)

d=json.loads((raw/'verified_demos.json').read_text())
metadata=json.loads((raw/'environment.json').read_text())
summary=rows('primitive_summary.csv');sz=rows('sizes.csv');aes=rows('aes_summary.csv')
text=['# Observed results - actual local execution',
 '', 'Source: `python run_all.py --trials 12 --aes-trials 30` on the environment recorded below.',
 '', '> Not portable performance numbers: all OpenSSL key/signature timing includes subprocess startup, file I/O and key parsing. AES throughput is in-process and belongs to a separate timing harness.',
 '', '## Verified synthetic demos','',
 f"- RSA toy N=15: factors `{d['rsa_toy']['factors']}`, order `r={d['rsa_toy']['period']}`; RSA integer decrypted successfully.",
 f"- ECC toy r=19: recovered secret `{d['ecc_toy']['recovered_scalar']}`, recoverable shot fraction `{d['ecc_toy']['recoverable_shot_fraction']:.4f}`.",
 f"- Grover N=256: ideal peak at iteration `{d['grover']['optimal_iteration']}`, probability `{d['grover']['ideal_success']:.6f}`.",
 f"- AES-128-GCM: search limited to 12 unknown bits; `{d['aes_partial_key_exposure']['attempts']}` attempts, elapsed `{d['aes_partial_key_exposure']['elapsed_ms']:.3f} ms` on this host.",
 f"- ML-KEM-768: ciphertext `{d['mlkem']['ciphertext_bytes']}` bytes, shared secret `{d['mlkem']['shared_secret_bytes']}` bytes; successful AES-GCM roundtrip and AEAD tamper rejection.",
 '- ML-DSA-65 and SLH-DSA-SHA2-128s: valid signatures accepted and modified signed messages rejected.',
 '- Hybrid educational composition: X25519+ML-KEM, HKDF, AES-GCM roundtrip; not real TLS.',
 '', '## Observed primitive latencies (milliseconds)', '',
 table(summary,['family','algorithm','operation','trials','median_ms','p95_ms']),
 '', '## Serialized artifacts (bytes)', '',
 table(sz,['family','algorithm','size_type','bytes']),
 '', '## AES-GCM throughput (MiB/s)', '',
 table(aes,['algorithm','operation','trials','median_mib_s','p5_mib_s','p95_mib_s']),
 '', '## Local runtime metadata', '',
 '```json',json.dumps(metadata,indent=2),'```','',
 '## Scientific interpretation','',
 'No cryptanalytically relevant quantum hardware was used; Shor/ECC/Grover are ideal small-register models and only validate toy mathematics. The AES attack assumes 116 of 128 key bits are known. Production secure-channel behavior, cryptographic code audit, fault tolerance, FIPS 140 validation and real-world TLS overhead were not tested.','']
(root/'docs'/'OBSERVED_RESULTS.md').write_text('\n'.join(text),encoding='utf8')
print('Wrote docs/OBSERVED_RESULTS.md')
