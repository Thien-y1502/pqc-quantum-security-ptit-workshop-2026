"""Record checksums of scientific and presentation artifacts without secrets."""
from pathlib import Path
from hashlib import sha256
from datetime import datetime, timezone
import json

root=Path(__file__).resolve().parents[1]
selected=[]
for prefix in ['demos','benchmarks','figures','results/raw','results/figures','slides/assets','docs','tests']:
    for p in sorted((root/prefix).rglob('*')):
        if not p.is_file() or '__pycache__' in p.parts or p.suffix in {'.pyc','.log','.aux'}:continue
        selected.append(p)
for prefix in ['run_all.py','README.md','requirements.txt','package.json','slides/build_deck.js','slides/PQC_Quantum_Security_PTIT_2026.pptx','slides/preview_montage.png']:
    p=root/prefix
    if p.is_file():selected.append(p)
entries=[]
for p in sorted(set(selected)):
    entries.append({'path':str(p.relative_to(root)),'sha256':sha256(p.read_bytes()).hexdigest(),
                    'bytes':p.stat().st_size})
manifest={'description':'PTIT PQC 2026 experimental and slide artifact hash manifest',
          'files':entries,'count':len(entries)}
(root/'results'/'SHA256_MANIFEST.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
(root/'results'/'SHA256SUMS.txt').write_text(''.join(e['sha256']+'  '+e['path']+'\n' for e in entries),encoding='utf8')
print('Manifest file entries:',len(entries))
