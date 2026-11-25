"""Generate publication-readable plots ONLY from actual result CSV files.

Source-of-truth is results/raw. No benchmark values are hardcoded or fabricated.
"""
from __future__ import annotations
import csv
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator

NAVY='#163E68'; BLUE='#2E75A7'; TEAL='#168B85'; RED='#C93643'; GOLD='#D28F26'
TEXT='#233448';MUTED='#677589';GRID='#DBE6EF'; BG='#FFFFFF'

def read(path):
    with Path(path).open(encoding='utf8',newline='') as f:return list(csv.DictReader(f))

def base(figsize=(11.2,5.75)):
    fig,ax=plt.subplots(figsize=figsize,dpi=170)
    fig.patch.set_facecolor(BG);ax.set_facecolor(BG)
    for s in ['top','right']:ax.spines[s].set_visible(False)
    for s in ['bottom','left']:ax.spines[s].set_color(GRID)
    ax.tick_params(colors=TEXT,labelsize=10)
    ax.grid(axis='y',alpha=0.9,color=GRID,linewidth=0.8,zorder=0)
    return fig,ax

def decorate(fig,ax,title,subtitle,xlabel=None,ylabel=None,footer=None):
    ax.set_title(title,fontsize=20,fontweight='bold',loc='left',color=NAVY,pad=34)
    ax.text(0,1.025,subtitle,transform=ax.transAxes,fontsize=10,color=MUTED,va='bottom')
    if xlabel:ax.set_xlabel(xlabel,fontsize=11,color=TEXT,labelpad=11)
    if ylabel:ax.set_ylabel(ylabel,fontsize=11,color=TEXT,labelpad=11)
    if footer:fig.text(0.51,0.015,footer,ha='center',va='bottom',fontsize=9,color=MUTED)
    fig.subplots_adjust(top=.78,bottom=.21,left=.10,right=.95)

def save(fig,dest):
    fig.savefig(dest,dpi=195,facecolor='white',bbox_inches='tight',pad_inches=.12)
    fig.savefig(Path(dest).with_suffix('.svg'),facecolor='white',bbox_inches='tight',pad_inches=.12)
    plt.close(fig)

def plot_all(raw:Path,out:Path):
    raw=Path(raw);out=Path(out);out.mkdir(parents=True,exist_ok=True)
    # RSA: distribution from exact ideal QFT simulation, 1024 sampled shots.
    data=read(raw/'rsa_qft_histogram.csv')
    bins=np.array([int(d['bin']) for d in data]);counts=np.array([int(d['count']) for d in data])
    fig,ax=base()
    colors=[TEAL if b%16==0 else '#CAD9E5' for b in bins]
    ax.bar(bins,counts,color=colors,width=.95,zorder=3)
    for b in [0,16,32,48]:ax.annotate(f'{b}: {counts[b]}',(b,counts[b]),xytext=(b,counts[b]+11),ha='center',fontsize=11,color=NAVY,fontweight='bold')
    ax.set_ylim(0,max(counts)*1.22);ax.set_xlim(-1,64)
    ax.set_xticks([0,8,16,24,32,40,48,56,63])
    decorate(fig,ax,'Shor order-finding: N = 15, a = 2','Ideal modular oracle + inverse QFT; 6 counting qubits, 1,024 sampled shots',
             'Counting-register outcome k','Sampled count',footer='Peaks at k = 0, 16, 32, 48 imply period r = 4. Toy instance; not RSA-2048.')
    save(fig,out/'fig01_rsa_order_qft.png')
    # ECC: two-register QFT measured pair histogram.
    data=read(raw/'ecc_qft_histogram.csv');r=max(int(d['u']) for d in data)+1
    heat=np.zeros((r,r),dtype=int)
    for d in data:heat[int(d['u']),int(d['v'])]=int(d['count'])
    fig,ax=base((10.6,6.0));ax.grid(False)
    im=ax.imshow(heat.T,origin='lower',aspect='equal',interpolation='nearest',cmap='Blues')
    ax.scatter(np.arange(r),[(7*u)%r for u in range(r)],s=18,facecolors='none',edgecolors=RED,linewidths=1.5,label='v = 7u (mod 19)')
    ax.set_xticks(range(0,r,2));ax.set_yticks(range(0,r,2))
    fig.colorbar(im,ax=ax,shrink=.74,pad=.02,label='Observed shots')
    decorate(fig,ax,'Elliptic-curve discrete log: toy QFT','E: y^2 = x^3 + 2x + 2 (mod 17), prime-order group r = 19; secret scalar = 7',
             'First QFT-register outcome u','Second QFT-register outcome v',
             footer='Points satisfy v = d*u (mod r). Exact finite-register simulation; not an attack on P-256.')
    ax.legend(frameon=False,loc='upper left',fontsize=9)
    save(fig,out/'fig02_ecc_dlog_qft.png')
    # Grover probabilities.
    data=read(raw/'grover_probability.csv')
    t=np.array([int(d['iterations']) for d in data]);q=np.array([float(d['quantum_theory']) for d in data]);
    obs=np.array([float(d['quantum_sampled']) for d in data]);c=np.array([float(d['classical_success']) for d in data])
    fig,ax=base()
    ax.plot(t,q,color=BLUE,linewidth=3,label='Grover ideal theory',zorder=4)
    ax.scatter(t,obs,color=TEAL,s=32,label='State-vector sampled (1,024 shots)',zorder=5)
    ax.plot(t,c,color=RED,linestyle='--',linewidth=2,label='Classical: t+1 distinct guesses',zorder=3)
    ax.set_ylim(-0.025,1.10);ax.set_xlim(t.min(),t.max())
    ax.legend(loc='upper left',frameon=False,fontsize=9)
    decorate(fig,ax,'Grover: quadratic query advantage','8-qubit ideal unstructured search oracle; N = 256, one marked item',
             'Oracle iterations','Probability of finding the target',
             footer='Ideal-oracle query analysis does not include AES circuit construction, error correction or gate costs.')
    save(fig,out/'fig03_grover_success.png')
    # Process-inclusive OpenSSL CLI key establishment times.
    data=read(raw/'primitive_summary.csv')
    kem=[d for d in data if d['family']=='key_establishment']
    labels=[(d['algorithm']+' '+d['operation']).replace('encapsulate','encap').replace('decapsulate','decap') for d in kem]
    vals=[float(d['median_ms']) for d in kem];p95=[float(d['p95_ms']) for d in kem]
    fig,ax=base();pos=np.arange(len(kem))
    ax.barh(pos,vals,color=[BLUE if 'X25519' in k['algorithm'] else TEAL for k in kem],height=.53,zorder=3)
    ax.errorbar(vals,pos,xerr=[np.zeros(len(pos)),np.array(p95)-vals],fmt='none',color=RED,capsize=5,zorder=4)
    for i,v in enumerate(vals):ax.text(v+max(vals)*.05,i,f'{v:.2f} ms',va='center',fontsize=11,color=TEXT)
    ax.set_yticks(pos,labels);ax.set_xlim(0,max(p95)*1.39);ax.invert_yaxis();ax.grid(axis='x',color=GRID);ax.grid(axis='y',visible=False)
    decorate(fig,ax,'Key establishment: observed operation latency','Single host; OpenSSL CLI wall clock, including process launch + key parsing + file I/O',
             'Median time (ms), whisker = p95',None,
             footer='X25519 derive and ML-KEM encaps/decaps are different protocol operations; no absolute speed ranking implied.')
    save(fig,out/'fig04_kem_latency.png')
    # Signature bench groups.
    sig=[d for d in data if d['family']=='signature']
    algs=['RSA-PSS-2048','ECDSA-P256','ML-DSA-65','SLH-DSA-SHA2-128s']
    signv=[];verifyv=[]
    for a in algs:
        signv.append(float(next(d['median_ms'] for d in sig if d['algorithm']==a and d['operation']=='sign')))
        verifyv.append(float(next(d['median_ms'] for d in sig if d['algorithm']==a and d['operation']=='verify')))
    fig,ax=base();x=np.arange(len(algs));w=.34
    ax.bar(x-w/2,signv,width=w,color=BLUE,label='Sign',zorder=3)
    ax.bar(x+w/2,verifyv,width=w,color=TEAL,label='Verify',zorder=3)
    for v,offset in [(signv,-w/2),(verifyv,w/2)]:
        for i,d in enumerate(v):ax.text(i+offset,d*1.1,f'{d:.2f}',fontsize=9,ha='center',color=TEXT)
    ax.set_yscale('log');ax.set_ylim(1,max(signv+verifyv)*2.5)
    ax.set_xticks(x,['RSA-PSS\n2048','ECDSA\nP-256','ML-DSA\n65','SLH-DSA\nSHA2-128s'])
    ax.legend(frameon=False,loc='upper left')
    decorate(fig,ax,'Digital signatures: time cost','Median of local OpenSSL CLI runs; log y-axis, process launch included',
             'Algorithm','Median wall-clock time (ms, log scale)',
             footer='Different security levels, representation formats and implementations; benchmark for teaching only.')
    save(fig,out/'fig05_signature_latency.png')
    # Signature and public-key bytes (DER sizes).
    sizes=read(raw/'sizes.csv')
    vals=[]
    for a in algs:
        vals.append([int(next(d['bytes'] for d in sizes if d['algorithm']==a and d['size_type']=='public_key_SPKI_DER')),
                     int(next(d['bytes'] for d in sizes if d['algorithm']==a and d['size_type']=='signature'))])
    vals=np.array(vals)
    fig,ax=base();x=np.arange(4);w=.33
    ax.bar(x-w/2,vals[:,0],width=w,color=BLUE,label='Public key (SPKI DER)',zorder=3)
    ax.bar(x+w/2,vals[:,1],width=w,color=TEAL,label='Signature (encoded)',zorder=3)
    for i in range(4):
        for j,off in [(0,-w/2),(1,w/2)]:
            ax.text(i+off,vals[i,j]+max(vals[:,j])*.018,f'{vals[i,j]:,}',ha='center',fontsize=9,color=TEXT)
    ax.set_xticks(x,['RSA-PSS\n2048','ECDSA\nP-256','ML-DSA\n65','SLH-DSA\nSHA2-128s']);ax.set_ylim(0,vals.max()*1.29)
    ax.legend(frameon=False,loc='upper left')
    decorate(fig,ax,'Signature artifacts: size matters','Actual serialized public-key and signature bytes from OpenSSL 3.5.5',
             'Algorithm','Bytes',footer='SPKI DER has encoding overhead; signature sizes do not include certificate or TLS framing.')
    save(fig,out/'fig06_signature_sizes.png')
    # KEM public SPKI / encapsulated ciphertext dimensions.
    encs=[]
    for a in ['X25519','ML-KEM-768']:
        encs.append([int(next(d['bytes'] for d in sizes if d['algorithm']==a and d['size_type']=='public_key_SPKI_DER')),
                     int(next(d['bytes'] for d in sizes if d['algorithm']==a and d['size_type']=='ciphertext')) if a=='ML-KEM-768' else 0])
    encs=np.array(encs)
    fig,ax=base();x=np.arange(2);w=.30
    ax.bar(x-w/2,encs[:,0],width=w,color=BLUE,label='Public key (SPKI DER)',zorder=3)
    ax.bar(x+w/2,encs[:,1],width=w,color=TEAL,label='Encapsulation ciphertext (KEM only)',zorder=3)
    for i in range(2):
        for j,off in [(0,-w/2),(1,w/2)]:
            if encs[i,j]:ax.text(i+off,encs[i,j]+26,f'{encs[i,j]:,}',ha='center',fontsize=12,color=TEXT)
    ax.set_xticks(x,['X25519','ML-KEM-768']);ax.set_ylim(0,encs.max()*1.27)
    ax.legend(frameon=False,loc='upper left')
    decorate(fig,ax,'Key exchange: payload footprint','Observed file sizes. X25519 has peer public shares, not a KEM ciphertext.',
             'Mechanism','Bytes',footer='Not a TLS handshake size comparison; framing, certificates and negotiation are excluded.')
    save(fig,out/'fig07_kem_bytes.png')
    # AES throughput measured in process.
    data=read(raw/'aes_summary.csv');algs2=['AES-128-GCM','AES-256-GCM']
    v=[];interval=[]
    for a in algs2:
        r=next(d for d in data if d['algorithm']==a and d['operation']=='encrypt')
        v.append(float(r['median_mib_s']));interval.append((float(r['p5_mib_s']),float(r['p95_mib_s'])))
    fig,ax=base();x=np.arange(2)
    ax.bar(x,v,color=[BLUE,TEAL],width=.45,zorder=3)
    ax.errorbar(x,v,yerr=np.array([[v[i]-interval[i][0] for i in range(2)],
                                   [interval[i][1]-v[i] for i in range(2)]]),
                fmt='none',color=RED,capsize=7,zorder=4)
    for i,val in enumerate(v):ax.text(i,val+max(v)*.055,f'{val:,.0f} MiB/s',ha='center',color=TEXT,fontsize=13,fontweight='bold')
    ax.set_xticks(x,algs2);ax.set_ylim(0,max(max(v),max(y[1] for y in interval))*1.25)
    decorate(fig,ax,'AES stays: symmetric encryption throughput','1 MiB synthetic payloads, AES-GCM in-process Python/cryptography; median, p5-p95',
             'Algorithm','Encryption throughput (MiB/s)',
             footer='AES-256 adds brute-force margin; throughput on one host is not general-purpose performance.')
    save(fig,out/'fig08_aes_throughput.png')
    # Useful one-image recap with numeric metrics from true results, NOT fabricated.
    psize={ (s['algorithm'],s['size_type']):int(s['bytes']) for s in sizes }
    fig,ax=base((11.2,4.5));ax.axis('off')
    items=[('ML-KEM-768',f"{psize[('ML-KEM-768','ciphertext')]:,} B",'encapsulation ciphertext'),
           ('ML-DSA-65',f"{psize[('ML-DSA-65','signature')]:,} B",'signature'),
           ('SLH-DSA SHA2-128s',f"{psize[('SLH-DSA-SHA2-128s','signature')]:,} B",'signature')]
    for i,(name,val,kind) in enumerate(items):
        X=.03+i*.33
        ax.add_patch(plt.Rectangle((X,.15),.30,.66,transform=ax.transAxes,facecolor=['#EAF3FA','#E9F5F3','#F9F0E4'][i],edgecolor='none'))
        ax.text(X+.026,.66,name,fontsize=13,fontweight='bold',color=NAVY,transform=ax.transAxes)
        ax.text(X+.026,.42,val,fontsize=28,fontweight='bold',color=[BLUE,TEAL,GOLD][i],transform=ax.transAxes)
        ax.text(X+.026,.28,kind,fontsize=11,color=MUTED,transform=ax.transAxes)
    fig.text(.04,.93,'Observed artifact sizes, OpenSSL 3.5.5',fontsize=19,fontweight='bold',color=NAVY)
    fig.text(.04,.075,'Source: raw sizes.csv  |  Standard parameter variants, not all at identical security category.',fontsize=10,color=MUTED)
    save(fig,out/'fig09_results_triptych.png')
    return sorted(out.glob('*.png'))

if __name__=='__main__':
    root=Path(__file__).resolve().parents[1]
    print(*plot_all(root/'results'/'raw',root/'results'/'figures'),sep='\n')
