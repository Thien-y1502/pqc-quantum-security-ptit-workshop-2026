# Public-release audit

Release date: 25 November 2026  
Workshop: PTIT HCMC technical workshop, 29 November 2026  
Presenter: Bùi Phi Hùng

## Included

- The owner-supplied workshop presentation: `slides/PQC_Quantum_Security_PTIT_Workshop_2026.pptx`.
- The reproducible Python, OpenSSL, JavaScript and LaTeX source tree from `PQC_Workshop_2026_GitHub`.
- Existing local figures, measured CSV files, logs, methods, limitations and presenter notes supplied with the archive.
- No website source, private profile archive, personal document, recovery code, or unrelated local drive content.

## Checks performed before publication

- Archive expanded to a clean staging directory; no nested `.git` directory found.
- Secret/path scan over text and result files found no private-key blocks, GitHub tokens, API keys, or local `C:\Users`/`D:\` paths.
- `results/raw/environment.json` contains only the declared Linux/OpenSSL/Python environment and benchmark limitations.
- Source archive SHA-256: `5BDBCB333013E003B9F569D9C3655DC46BD492FE93AC466058115B9224B61E22`.
- Supplied workshop deck SHA-256: `18DF762DFA8A292D9028761751ECA5D9D71A71C9EED65C2402F71296ED3D7812`.

## Scientific boundary

The toy Shor, ECC, Grover, AES and HNDL examples are deliberately small and do not break real RSA-2048, P-256, or full-strength AES. OpenSSL demonstrations exercise the named ML-KEM, ML-DSA and SLH-DSA algorithms on the recorded environment, but that does not establish certification, production protocol security, or universal performance. Benchmark numbers are local wall-clock observations, not cross-platform claims.

## Verification status

The archive includes its own execution logs and test output. Re-running the full benchmark suite is environment-dependent: install the pinned-compatible Python packages and OpenSSL 3.5+ first. A future run should record fresh output rather than silently replacing the supplied observations.
