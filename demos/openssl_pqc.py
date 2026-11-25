"""OpenSSL 3.5+ CLI wrappers for the REAL NIST-standardized algorithms.

This example intentionally uses subprocesses for portable demonstrations. For
production use, prefer a reviewed protocol and supported library bindings.
"""
from __future__ import annotations
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

class OpenSSLUnavailable(RuntimeError): pass

def run(*args, ok=True):
    p=subprocess.run(['openssl',*map(str,args)],capture_output=True,text=True)
    if ok and p.returncode!=0:
        raise RuntimeError('openssl failed: '+' '.join(map(str,args))+'\n'+p.stderr[:1000])
    return p

def check_openssl():
    if not shutil.which('openssl'): raise OpenSSLUnavailable('openssl executable missing')
    p=run('version')
    m=re.search(r'OpenSSL\s+(\d+)\.(\d+)',p.stdout)
    if not m or (int(m.group(1)),int(m.group(2)))<(3,5):
        raise OpenSSLUnavailable('OpenSSL 3.5+ required for FIPS 203/204/205')
    algos=run('list','-kem-algorithms').stdout
    for name in ['ML-KEM-768']:
        if name not in algos: raise OpenSSLUnavailable(name+' missing from OpenSSL provider')
    return p.stdout.strip()

def gen_key(algorithm,dir: Path):
    d=Path(dir); d.mkdir(parents=True,exist_ok=True)
    safe=re.sub('[^A-Za-z0-9_-]','_',algorithm)
    sk=d/(safe+'_private.pem'); pk=d/(safe+'_public.pem')
    run('genpkey','-algorithm',algorithm,'-out',sk)
    run('pkey','-in',sk,'-pubout','-out',pk)
    return sk,pk

def kem_encap(pk: Path, dir: Path):
    d=Path(dir)
    ct=d/'kem_ciphertext.bin';ss=d/'encapsulated_secret.bin'
    run('pkeyutl','-encap','-inkey',pk,'-pubin','-out',ct,'-secret',ss)
    return ct,ss

def kem_decap(sk:Path,ct:Path,dir:Path):
    ss=Path(dir)/'decapsulated_secret.bin'
    run('pkeyutl','-decap','-inkey',sk,'-in',ct,'-secret',ss)
    return ss

def sign(sk:Path, msg:Path, signature:Path, rsa_pss=False):
    args=['pkeyutl','-sign','-inkey',sk,'-rawin','-in',msg,'-out',signature]
    if rsa_pss: args+=['-digest','sha256','-pkeyopt','rsa_padding_mode:pss','-pkeyopt','rsa_pss_saltlen:digest']
    elif 'ECDSA' in str(sk): args+=['-digest','sha256']
    run(*args)
    return signature

def verify(pk:Path,msg:Path,sig:Path,rsa_pss=False):
    args=['pkeyutl','-verify','-pubin','-inkey',pk,'-rawin','-in',msg,'-sigfile',sig]
    if rsa_pss: args+=['-digest','sha256','-pkeyopt','rsa_padding_mode:pss','-pkeyopt','rsa_pss_saltlen:digest']
    elif 'ECDSA' in str(pk): args+=['-digest','sha256']
    return run(*args,ok=False).returncode==0
