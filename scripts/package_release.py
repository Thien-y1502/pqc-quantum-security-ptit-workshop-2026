"""Generate a clean source archive, plot archive and full workshop bundle."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import shutil
import hashlib

root=Path(__file__).resolve().parents[1]
out=root.parent
prefix='PQC_Workshop_2026_GitHub'

def keep(p:Path):
    rel=p.relative_to(root)
    if any(x in rel.parts for x in ['__pycache__','node_modules','.venv','.pytest_cache']):return False
    if len(rel.parts)>=2 and rel.parts[0]=='slides' and rel.parts[1]=='PQC_Quantum_Security_PTIT_2026':return False
    if p.suffix in {'.pyc','.pem','.key','.p12','.pfx','.bin','.aux','.log'}:return False
    return True

all_files=sorted(p for p in root.rglob('*') if p.is_file() and keep(p))
source=[p for p in all_files if p.name!='PQC_Quantum_Security_PTIT_2026.pptx']
result=[p for p in all_files if str(p.relative_to(root)).startswith(('results/','docs/OBSERVED_RESULTS','docs/FIGURE_INDEX'))]

def zipit(dest,files):
    with ZipFile(dest,'w',compression=ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
        for p in files:
            z.write(p,arcname=str(Path(prefix)/p.relative_to(root)))
    with ZipFile(dest) as z:
        bad=z.testzip()
        if bad:raise RuntimeError('Corrupt ZIP item: '+bad)
    print(dest.name,'files=',len(files),'size_MiB=',round(dest.stat().st_size/1048576,2))

zipit(out/'PQC_2026_GitHub_Source_and_Results.zip',source)
zipit(out/'PQC_2026_Experimental_Results.zip',result)
zipit(out/'PQC_2026_Full_Workshop_Package.zip',all_files)
shutil.copy2(root/'slides'/'PQC_Quantum_Security_PTIT_2026.pptx',out/'PQC_Quantum_Security_PTIT_Workshop_2026.pptx')
shutil.copy2(root/'slides'/'preview_montage.png',out/'PQC_2026_Slide_Preview.png')
shutil.copy2(root/'docs'/'OBSERVED_RESULTS.md',out/'PQC_2026_Observed_Results.md')
for n in ['PQC_Quantum_Security_PTIT_Workshop_2026.pptx','PQC_2026_Slide_Preview.png']:
    p=out/n;print(n,round(p.stat().st_size/1048576,2),'MiB')
