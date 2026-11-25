# Post-Quantum Cryptography: quantum threats, standards and experiments

**PTIT HCMC technical workshop | 29 November 2026**  
**Presenter:** Bui Phi Hung, President of Science & Technology Club; Quantum Intelligence Algorithms Laboratory, Department of Information Security, Faculty of Information Technology, PTIT.

This repository accompanies the supplied workshop deck and an editable, reproducible source tree. It explains **PQC, RSA/ECC/AES, Shor and Grover, harvest-now-decrypt-later, the mathematics behind lattice-based and hash-based schemes, NIST FIPS 203/204/205, migration, and reproducible demonstrations**.

## Start here

1. Open the supplied [`slides/PQC_Quantum_Security_PTIT_Workshop_2026.pptx`](slides/PQC_Quantum_Security_PTIT_Workshop_2026.pptx). This is the presentation for the PTIT workshop on 29 November 2026.
2. Read [`docs/PRESENTER_NOTES.md`](docs/PRESENTER_NOTES.md) and [`docs/METHODS_AND_LIMITATIONS.md`](docs/METHODS_AND_LIMITATIONS.md) before presenting any result.
3. Run `python run_all.py` to generate the demos, benchmark data and plots.
4. Rebuild the editable deck with `npm run slides`; the generated output is intentionally not committed by default so that the repository stays source-first.

The `slides/build_deck.js` source can produce a longer rebuilt deck from the included figures and notes. It is distinct from the supplied workshop deck above; keeping both paths explicit avoids confusing an editable rebuild with the presentation that was actually delivered.

## Website and QR entry point

- Bilingual landing page: <https://albuspotter.vercel.app/vi/resources/pqc-workshop>
- Recommended QR target: this repository URL, because it remains the stable entry point to both the source tree and the supplied deck.
- Direct deck page for a slide-only QR: <https://github.com/Thien-y1502/pqc-quantum-security-ptit-workshop-2026/blob/main/slides/PQC_Quantum_Security_PTIT_Workshop_2026.pptx>
- The post-report article and any new observations will be added only after the corresponding evidence is available; the current release keeps recorded, toy, and `NOT_RUN` states separate.

**The quantum demonstrations do not break real-world RSA-2048, ECC P-256 or full-strength AES-128/AES-256.** The RSA and ECC demos use deliberately tiny groups and ideal Fourier oracles. The Grover demo is an unstructured search oracle and is **not** a quantum AES oracle. The AES key-recovery demo exposes 116 of 128 key bits and searches only the remaining 12 unknown bits. The archive contains recorded executions of the standardized ML-KEM, ML-DSA and SLH-DSA CLI paths with OpenSSL 3.5.5 (see `results/raw/` and the environment manifest). Re-running those paths requires OpenSSL 3.5+ with the relevant provider; on a machine where `openssl.exe` is unavailable, the real-provider check is `NOT_RUN`, not a PASS.

## Requirements

- Python **3.11+**, packages in `requirements.txt` (numpy, matplotlib, cryptography).
- **OpenSSL 3.5+** on your system PATH, with the default provider supporting ML-KEM-768, ML-DSA-65 and SLH-DSA-SHA2-128s.
- Node.js **20+**, `pptxgenjs` **4.x** (`npm install`) for rebuilding the presentation. The PowerPoint is already supplied; Node is optional for viewing.
- Optional: `pdflatex` and `pdftocairo` to re-typeset the LaTeX equations; the rendered PNG assets and `.tex` sources are already included.
- PowerPoint/LibreOffice for viewing. The final deck was tested for slide bounds and rendered to PNG previews.

The source slides can be rebuilt on a normal machine without the authoring environment. `slides/build_deck.js` uses local slide-layout helpers if they exist, otherwise it uses a built-in portable PNG-fit routine. Set `PQC_FORCE_PORTABLE=1` to test the standalone path on Linux/macOS.

### Linux / macOS shell

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
openssl version
python -m unittest discover -s tests -v
python run_all.py --trials 12 --aes-trials 30
npm install
npm run slides
```

### Windows PowerShell

Make sure an OpenSSL 3.5+ `openssl.exe` is on your PATH and Python/Node are installed:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
openssl version
python -m unittest discover -s tests -v
python run_all.py --trials 12 --aes-trials 30
npm install
npm run slides
```

If PowerShell blocks local script activation, use `.venv\Scripts\python.exe` explicitly. The convenience files `run_linux.sh` and `run_windows.ps1` perform the standard sequence.

## Repository layout

```text
run_all.py                        Run all experiments and plots
demos/quantum_toy.py              Ideal small-register modular/EC QFT and Grover
demos/attack_and_defense.py       RSA, ECC, AES, HNDL, ML-KEM, signatures, hybrid
demos/openssl_pqc.py             Real OpenSSL 3.5+ PQC CLI operations
benchmarks/benchmark_suite.py    OpenSSL CLI/cryptography wall-clock benchmarks
figures/plot_all.py              Rebuild 9 plots from measured CSV only
figures/make_equations.py        Re-typeset 21 equations from LaTeX
results/raw/                     Verified demos, benchmark CSV and environment
results/figures/                 Figure PNG and vector SVG
results/logs/                    Execution, tests, slide QA
slides/build_deck.js             Editable PptxGenJS slide source
slides/assets/equations/         Editable LaTeX + PDF + high-DPI PNG
slides/PQC_Quantum_Security_PTIT_Workshop_2026.pptx  Supplied workshop deck
slides/preview_montage.png
docs/PRESENTER_NOTES.md           Every slide's speaker notes and sources
docs/METHODS_AND_LIMITATIONS.md   Exact scientific integrity boundaries
docs/FIGURE_INDEX.md             Figure->raw data->slide mapping
docs/OBSERVED_RESULTS.md         Verified observed local outcomes
tests/test_demos.py              Mathematical and cryptographic assertions
```

## What actually runs?

| Component | Method | Verification |
|---|---|---|
| RSA toy | `N=15`, ideal modular oracle + inverse QFT (NumPy state-vector model) | Recovered `3 x 5`, period 4; toy RSA roundtrip |
| ECC toy | EC group `y^2=x^3+2x+2 mod 17`, order 19, two-register inverse QFT | `Q=[7]P`; all recoverable Fourier samples give scalar 7 |
| Grover toy | 8-qubit ideal marked-state phase oracle + diffusion | State-vector result matches formula; theoretical peak near 12 iterations |
| AES partial key | AES-128-GCM, **116 known bits**, 12 unknown bits | 1,734 tested candidates until recovery |
| HNDL scenario | Recorded AES ciphertext under intentionally tiny toy-ECDH | Decrypts after recovering the toy EC scalar |
| ML-KEM | Real OpenSSL `ML-KEM-768` encapsulate/decapsulate | Shared 32-byte secret matches; AES-GCM decrypts |
| ML-DSA and SLH-DSA | Real OpenSSL digital signatures | Valid document accepted; modified document rejected |
| Hybrid illustration | X25519 + real ML-KEM secret combined through HKDF | Correct AES-GCM roundtrip; **not** TLS/RFC 10024 protocol |

## Benchmark interpretation

All key-establishment/signature times are **local observed wall-clock times of OpenSSL CLI calls**, including process startup, PEM parsing and file I/O. AES-GCM throughput uses an **in-process Python cryptography binding** and should only be compared *within the AES panels*. Results are pedagogical, machine-dependent, not controlled cycle-count comparisons, not measured TLS handshakes, and not production performance guarantees. Public-key dimensions are **DER-encoded SubjectPublicKeyInfo bytes**; they include serialization overhead.

The file `results/raw/primitive_summary.csv` contains actual medians/p95. `results/raw/sizes.csv` contains measured bytes. Toy distributions and 9 figures are directly generated from CSV. Neither error bars nor benchmark values are invented.

## Important distinction: standardized vs certified

The implemented algorithms have names defined by **NIST FIPS 203/204/205**, but this workshop makes **no claim of a FIPS 140-validated OpenSSL module**, compliance certification, or audited protocol security. Work with a validated provider and vetted protocol libraries when compliance or production assurance is required.

## Official references (checked for November 2026)

- [NIST FIPS 203 - ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST FIPS 204 - ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)
- [NIST FIPS 205 - SLH-DSA](https://csrc.nist.gov/pubs/fips/205/final)
- [NIST SP 800-227 - Recommendations for KEMs (September 2025)](https://csrc.nist.gov/pubs/sp/800/227/final)
- [NIST IR 8547 - Transition to PQC Standards (October 2026 final)](https://csrc.nist.gov/pubs/ir/8547/final)
- [IETF RFC 9954 - Hybrid key exchange in TLS 1.3 (July 2026)](https://www.rfc-editor.org/rfc/rfc9954.html)
- [IETF RFC 10024 - PQ/T Hybrid Key Agreement for TLS 1.3 (August 2026)](https://www.rfc-editor.org/rfc/rfc10024.html)
- [NIST HQC selection (March 2025)](https://www.nist.gov/news-events/news/2025/03/nist-pqc-standardization-process-hqc-announced-4th-round-selection)

## Data safety and publication notes

All business text is fictional and marked synthetic. No company customer data, real captured network payload, or production keys are used. The examples are not a secure production library. The institutional logo files were extracted from the presenter's original PowerPoint; their rights and permitted usage remain with the respective owners. This repository is public for workshop access and educational reproducibility; no open-source license or general redistribution permission is granted by this release. Verify institutional attribution requirements and the terms of every dependency and asset before reuse.
