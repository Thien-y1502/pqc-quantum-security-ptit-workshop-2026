"""Measured local wall-clock benchmarks, NOT intrinsic cryptographic cycle counts.

OpenSSL CLI includes process startup, PEM parsing and temporary file I/O.
AES-GCM uses the cryptography Python binding; compare AES-128 and AES-256
within that binding, NOT with subprocess-based timings.
"""
from __future__ import annotations
import csv
import json
import os
from pathlib import Path
import platform
import statistics
import subprocess
import tempfile
import time

import numpy as np
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from demos.openssl_pqc import check_openssl,run,gen_key,kem_encap,kem_decap,sign,verify

HEADERS=['family','algorithm','operation','iteration','elapsed_ms','harness']

def timeit(fn):
    s=time.perf_counter_ns(); result=fn()
    return (time.perf_counter_ns()-s)/1e6,result

def measure(rows,family,alg,operation,call,trials,warmups=2):
    for _ in range(warmups): call()
    for i in range(trials):
        ms,value=timeit(call)
        rows.append({'family':family,'algorithm':alg,'operation':operation,
                     'iteration':i,'elapsed_ms':round(ms,6),
                     'harness':'openssl-cli wall clock (spawn + key parsing + file I/O)'})

def to_csv(path,records,header):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('w',newline='',encoding='utf8') as f:
        w=csv.DictWriter(f,fieldnames=header); w.writeheader();w.writerows(records)

def perform(output:Path,trials=14,aes_trials=30):
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    version=check_openssl()
    rows=[];size_rows=[]
    with tempfile.TemporaryDirectory(prefix='pqc_bench_') as td:
        d=Path(td)
        msg=d/'message.txt';msg.write_bytes(b'Synthetic PKI certificate approval for PTIT PQC workshop, 2026.')
        # Classical X25519 setup (two independent peers).
        xd=d/'x25519';xs,xp=gen_key('X25519',xd)
        peer_dir=d/'x25519_peer';ys,yp=gen_key('X25519',peer_dir)
        xout=xd/'shared.bin'
        def xderive():run('pkeyutl','-derive','-inkey',xs,'-peerkey',yp,'-out',xout)
        measure(rows,'key_establishment','X25519','derive',xderive,trials)
        assert xout.stat().st_size==32
        # ML-KEM-768 KEM operations.
        kd=d/'mlkem';ks,kp=gen_key('ML-KEM-768',kd)
        def enc():return kem_encap(kp,kd)
        measure(rows,'key_establishment','ML-KEM-768','encapsulate',enc,trials)
        ct,ss1=kem_encap(kp,kd)
        def dec():return kem_decap(ks,ct,kd)
        measure(rows,'key_establishment','ML-KEM-768','decapsulate',dec,trials)
        assert ss1.read_bytes()==kem_decap(ks,ct,kd).read_bytes()
        # Signature benchmarking; all verified before inclusion.
        sig_configs=[('RSA-PSS-2048', 'RSA', ['-pkeyopt','rsa_keygen_bits:2048'],True),
                     ('ECDSA-P256','EC',['-pkeyopt','ec_paramgen_curve:prime256v1'],False),
                     ('ML-DSA-65','ML-DSA-65',[],False),
                     ('SLH-DSA-SHA2-128s','SLH-DSA-SHA2-128s',[],False)]
        for name,algorithm,extra,is_rsa in sig_configs:
            target=d/name;target.mkdir(exist_ok=True)
            sk=target/'private.pem';pk=target/'public.pem'
            run('genpkey','-algorithm',algorithm,*extra,'-out',sk)
            run('pkey','-in',sk,'-pubout','-out',pk)
            signature=target/'sig.bin'
            # Our shared sign helper detects ECDSA by 'ECDSA' in the path.
            sign(sk,msg,signature,rsa_pss=is_rsa)
            assert verify(pk,msg,signature,rsa_pss=is_rsa)
            def do_sign():return sign(sk,msg,signature,rsa_pss=is_rsa)
            def do_verify():
                if not verify(pk,msg,signature,rsa_pss=is_rsa):
                    raise AssertionError('signature verification failed')
            measure(rows,'signature',name,'sign',do_sign,trials)
            measure(rows,'signature',name,'verify',do_verify,trials)
            run('pkey','-in',sk,'-pubout','-outform','DER','-out',target/'public.der')
            size_rows.append({'family':'signature','algorithm':name,'size_type':'public_key_SPKI_DER',
                              'bytes':(target/'public.der').stat().st_size})
            size_rows.append({'family':'signature','algorithm':name,'size_type':'signature',
                              'bytes':signature.stat().st_size})
        for name,sk,pk in [('X25519',xs,xp),('ML-KEM-768',ks,kp)]:
            path=d/(name+'_public.der')
            run('pkey','-in',sk,'-pubout','-outform','DER','-out',path)
            size_rows.append({'family':'key_establishment','algorithm':name,
                              'size_type':'public_key_SPKI_DER','bytes':path.stat().st_size})
        size_rows.extend([
            {'family':'key_establishment','algorithm':'X25519','size_type':'secret_bytes','bytes':xout.stat().st_size},
            {'family':'key_establishment','algorithm':'ML-KEM-768','size_type':'ciphertext','bytes':ct.stat().st_size},
            {'family':'key_establishment','algorithm':'ML-KEM-768','size_type':'secret_bytes','bytes':ss1.stat().st_size}])
    to_csv(output/'primitive_raw.csv',rows,HEADERS)
    summary=[]
    combos=sorted(set((r['family'],r['algorithm'],r['operation']) for r in rows))
    for fam,alg,op in combos:
        values=np.array([r['elapsed_ms'] for r in rows if (r['family'],r['algorithm'],r['operation'])==(fam,alg,op)])
        summary.append({'family':fam,'algorithm':alg,'operation':op,'trials':len(values),
                        'median_ms':round(float(np.median(values)),5),
                        'p95_ms':round(float(np.percentile(values,95)),5),
                        'min_ms':round(float(np.min(values)),5),'max_ms':round(float(np.max(values)),5)})
    to_csv(output/'primitive_summary.csv',summary,
           ['family','algorithm','operation','trials','median_ms','p95_ms','min_ms','max_ms'])
    to_csv(output/'sizes.csv',size_rows,['family','algorithm','size_type','bytes'])
    # AES comparison is measured in-process under a separate harness.
    data=os.urandom(1024*1024)
    aes_rows=[]
    for bits in [128,256]:
        cipher=AESGCM(os.urandom(bits//8));nonce=os.urandom(12)
        for _ in range(4):cipher.encrypt(nonce,data,b'synthetic')
        for i in range(aes_trials):
            # Benchmark-only repeated encryption with fixed nonce is NEVER emitted
            # as real application code; unique nonces required for real messages.
            nonce=os.urandom(12)
            s=time.perf_counter_ns()
            ct=cipher.encrypt(nonce,data,b'synthetic')
            enc_ms=(time.perf_counter_ns()-s)/1e6
            s=time.perf_counter_ns();plain=cipher.decrypt(nonce,ct,b'synthetic')
            dec_ms=(time.perf_counter_ns()-s)/1e6
            assert plain==data
            aes_rows.extend([{'algorithm':f'AES-{bits}-GCM','operation':'encrypt',
                              'iteration':i,'data_bytes':len(data),'elapsed_ms':round(enc_ms,6),
                              'throughput_mib_s':round((len(data)/(1024*1024))/(enc_ms/1000),5)},
                             {'algorithm':f'AES-{bits}-GCM','operation':'decrypt',
                              'iteration':i,'data_bytes':len(data),'elapsed_ms':round(dec_ms,6),
                              'throughput_mib_s':round((len(data)/(1024*1024))/(dec_ms/1000),5)}])
    to_csv(output/'aes_raw.csv',aes_rows,
           ['algorithm','operation','iteration','data_bytes','elapsed_ms','throughput_mib_s'])
    aes_summary=[]
    for a in ['AES-128-GCM','AES-256-GCM']:
        for op in ['encrypt','decrypt']:
            values=np.array([r['throughput_mib_s'] for r in aes_rows if r['algorithm']==a and r['operation']==op])
            aes_summary.append({'algorithm':a,'operation':op,'trials':len(values),
                                'median_mib_s':round(float(np.median(values)),2),
                                'p5_mib_s':round(float(np.percentile(values,5)),2),
                                'p95_mib_s':round(float(np.percentile(values,95)),2)})
    to_csv(output/'aes_summary.csv',aes_summary,['algorithm','operation','trials','median_mib_s','p5_mib_s','p95_mib_s'])
    metadata={'openssl_version':version,'platform':platform.platform(),
              'python':platform.python_version(),'machine':platform.machine(),
              'processor':platform.processor(),'trials_per_primitive':trials,'aes_trials':aes_trials,
              'timing_method':'wall clock ns / subprocess for key and signatures, AES Python binding in-process',
              'limitations':['Not a controlled cross-implementation cryptographic benchmark',
                             'OpenSSL CLI results include process startup, PEM parse, disk I/O',
                             'AES-GCM uses Python binding, compared only within AES variants',
                             'No networking/real TLS or side channels measured',
                             'Single-host non-isolated exploratory benchmark; performance can vary by run']}
    (output/'environment.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
    return {'primitive_summary':summary,'aes_summary':aes_summary,'sizes':size_rows,'environment':metadata}
