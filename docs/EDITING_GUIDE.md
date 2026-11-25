# Editing and publishing the workshop package

## Edit PowerPoint content

The file `slides/PQC_Quantum_Security_PTIT_2026.pptx` can be opened in Microsoft PowerPoint. Most layout elements, text, arrows, cards and the three-circle map are native editable PowerPoint shapes. The equations are inserted as high-resolution transparent images, because native Office Math support varies by PPT generation library. **Edit the matching `.tex` file, rerun `python figures/make_equations.py`, and rebuild the PPTX** to update a formula without quality loss. The `.pdf` images of each equation are vector outputs.

The main editable slide source is `slides/build_deck.js`. There are 40 slides; the global `base()` function controls margins and standard branding, `notes()` writes presenter notes and citations, and `fitimg()` supports a portable rebuild without special local authoring tools.

## Edit charts and results

Never change a chart image without preserving its underlying source. To regenerate from new measurements, run `python run_all.py`. Raw CSV goes under `results/raw/`; vector SVG and PNG go under `results/figures/`. Slide images reference these paths. `docs/FIGURE_INDEX.md` maps each figure to its raw input and slide number.

Toy quantum sampling is seeded, but real key-generation and timing samples will vary between runs. When updating the slide numbers, update `docs/OBSERVED_RESULTS.md` using `python figures/write_results_report.py` before rebuilding slides.

## GitHub publication

Suggested project name: `ptit-pqc-quantum-threats-workshop-2026`. The source archive is designed to be extracted into a GitHub repository directly. Review institution logo usage and choose a license (e.g., MIT, Apache-2.0, or another preferred license) before making the project public. Never add private `.pem`, `.key`, `.p12`, `.pfx` or live business/customer data.

The synthetic record is not an enterprise asset. The toy attacks are isolated numerical demonstrations. Production TLS, FIPS 140 module certification, full ECC/RSA cryptanalysis, AES quantum-circuit cryptanalysis, and side-channel security are beyond this repository.

## Slide verification and assets

- `results/logs/slides_test.txt` records the PowerPoint canvas overflow check.
- `slides/preview_montage.png` gives a visual QA overview of all 40 pages.
- `docs/PRESENTER_NOTES.md` contains all 40 speaker notes extracted from the PPTX.
- Slides include footers, PTIT and club logos extracted from the uploaded original, and a date of 29 November 2026.

## Updating academic/technical sources

Read the official NIST FIPS/IR pages linked in README rather than relying on older article summaries. As of November 2026, FN-DSA/FIPS 206 is not a finalized FIPS, and HQC was selected for future standardization; do not label either finalized unless the status changes. Distinguish NIST federal migration timelines from binding requirements in other jurisdictions.
