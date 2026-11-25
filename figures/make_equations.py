"""Reproducible LaTeX typesetting into transparent PNGs and vector PDFs.

PowerPoint embeds high-DPI cropped PNGs for compatibility. Editable LaTeX
source and vector PDFs are retained alongside every formula.
"""
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'slides'/'assets'/'equations'
OUT.mkdir(parents=True,exist_ok=True)

EQUATIONS={
 'qubit':r'|\psi\rangle=\alpha|0\rangle+\beta|1\rangle,\qquad |\alpha|^2+|\beta|^2=1',
 'rsa':r'N=pq,\qquad c\equiv m^e\pmod{N},\qquad m\equiv c^d\pmod{N}',
 'ecc':r'E:\; y^2\equiv x^3+ax+b\pmod{p},\qquad Q=[d]P',
 'shor_order':r'f_a(x)=a^x\!\!\pmod N,\qquad r=\min\{t>0:a^t\equiv 1\pmod N\}',
 'qft_peaks':r'k\approx j\,\frac{2^t}{r},\qquad \gcd\bigl(a^{r/2}\pm 1,N\bigr)',
 'grover':r'\Pr[\mathrm{success}]=\sin^2\!\left((2t+1)\arcsin\frac{1}{\sqrt{N}}\right)',
 'grover_complexity':r'\underbrace{O(2^k)}_{\mathrm{classical}}\quad\longrightarrow\quad\underbrace{O(2^{k/2})}_{\mathrm{Grover\ queries}}',
 'lwe':r'\mathbf{b}=A\mathbf{s}+\mathbf{e}\pmod q',
 'module_lwe':r'R_q=\mathbb{Z}_q[X]/(X^{256}+1),\qquad \mathbf{b}=A\mathbf{s}+\mathbf{e}\in R_q^k',
 'mlkem_pke':r'\begin{aligned}\mathbf{t}&=A\mathbf{s}+\mathbf{e}\\\mathbf{u}&=A^\top\mathbf{r}+\mathbf{e}_1\\v&=\mathbf{t}^\top\mathbf{r}+e_2+\operatorname{Encode}(m)\end{aligned}',
 'mlkem_dec':r'v-\mathbf{s}^\top\mathbf{u}=\operatorname{Encode}(m)+\underbrace{(\mathbf{e}^\top\mathbf{r}+e_2-\mathbf{s}^\top\mathbf{e}_1)}_{\mathrm{small\ noise}}',
 'mldsa_core':r'\mathbf{t}=A\mathbf{s}_1+\mathbf{s}_2,\quad \mathbf{w}=A\mathbf{y},\quad \mathbf{z}=\mathbf{y}+c\mathbf{s}_1',
 'mldsa_challenge':r'c=H(\mu\parallel\operatorname{HighBits}(\mathbf{w})),\qquad \|\mathbf{z}\|_\infty<B',
 'kem':r'(pk,sk)\leftarrow\mathrm{KeyGen},\quad (ct,K)\leftarrow\mathrm{Encaps}(pk),\quad K\leftarrow\mathrm{Decaps}(sk,ct)',
 'kdf':r'K_{\mathrm{AEAD}}=\mathrm{HKDF}(K_{\mathrm{KEM}},\,\mathrm{context})',
 'signature':r'\sigma=\mathrm{Sign}(sk,m),\qquad \mathrm{Verify}(pk,m,\sigma)\in\{0,1\}',
 'hybrid':r'K_{\mathrm{session}}=\mathrm{HKDF}\bigl(K_{\mathrm{ECDHE}}\parallel K_{\mathrm{ML\text{-}KEM}},\mathrm{context}\bigr)',
 'ec_qft':r'v\equiv d\,u\pmod r\quad\Longrightarrow\quad d\equiv v\,u^{-1}\pmod r',
 'rsa_toy':r'15=3\times5,\quad 2^x\bmod 15:\;1,2,4,8,\underbrace{1}_{r=4},\ldots',
 'aes_note':r'k_{\mathrm{unknown}}=12\;\mathrm{bits}\quad\Rightarrow\quad 2^{12}=4{,}096\;\mathrm{candidates}',
 'security':r'\mathrm{PQC}\neq\mathrm{QKD}\qquad\text{and}\qquad \mathrm{PQC}\neq\mathrm{quantum\ hardware}',
}

DOC=r'''\documentclass[border=6pt]{standalone}
\usepackage{amsmath,amssymb,mathtools,xcolor}
\definecolor{ptitnavy}{HTML}{163E68}
\begin{document}
\color{ptitnavy}
\(\displaystyle %s\)
\end{document}
'''

def main():
    for name,eq in EQUATIONS.items():
        path=OUT/f'{name}.tex';path.write_text(DOC%eq,encoding='ascii')
        compile_proc=subprocess.run(['pdflatex','-interaction=nonstopmode','-halt-on-error',
                                     '-output-directory',str(OUT),str(path)],
                                    capture_output=True,text=True)
        if compile_proc.returncode!=0:
            raise RuntimeError(f'LaTeX failure in {name}: '+compile_proc.stdout[-1200:])
        subprocess.run(['pdftocairo','-png','-singlefile','-transp','-r','280',
                        str(OUT/f'{name}.pdf'),str(OUT/name)],check=True,
                       capture_output=True)
    for suffix in ['aux','log']:
        for p in OUT.glob(f'*.{suffix}'):p.unlink()
    print('Equations typeset:',len(EQUATIONS))

if __name__=='__main__':main()
