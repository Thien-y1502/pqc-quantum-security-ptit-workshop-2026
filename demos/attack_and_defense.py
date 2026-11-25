"""Self-contained synthetic demonstrations; no real user/business data."""
from __future__ import annotations
import hashlib
import json
import math
from pathlib import Path
import tempfile
import time

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from demos.quantum_toy import Curve,add,mul,shor_rsa_qft,ecc_dlog_qft,grover_sim
from demos.openssl_pqc import check_openssl,gen_key,kem_encap,kem_decap,sign,verify

MESSAGE=b'SYNTHETIC ONLY: Example invoice INV-2026-001, total 1200 test units.'
AAD=b'PTIT-PQC-Workshop-Synthetic-v1'

def derive(secret: bytes, context: bytes) -> bytes:
    return HKDF(algorithm=hashes.SHA256(),length=32,salt=None,info=context).derive(secret)

def rsa_toy_demo():
    q=shor_rsa_qft()
    p1,p2=q['factors']; n=p1*p2
    phi=(p1-1)*(p2-1); public_e=3
    private_d=pow(public_e,-1,phi)
    plain_integer=2
    cipher_integer=pow(plain_integer,public_e,n)
    restored=pow(cipher_integer,private_d,n)
    assert restored==plain_integer
    return {'modulus':n,'public_exponent':public_e,'private_exponent':private_d,
            'plaintext_integer':plain_integer,'ciphertext_integer':cipher_integer,
            'recovered_plaintext':restored,'factors':q['factors'],'period':q['period'],
            'quantum_model':'ideal modular-exponentiation oracle + exact inverse-QFT sampling',
            'not_claimed':'This does not attack RSA-2048 or estimate fault-tolerant resources.'}

def ecc_toy_demo():
    q=ecc_dlog_qft()
    assert q['secret']==7
    return {'group_order':q['group_order'],'curve':q['curve'],
            'generator':q['generator'],'public_point':q['public_point'],
            'recovered_scalar':q['secret'],'recoverable_shot_fraction':q['success_rate'],
            'quantum_model':'ideal two-register EC-group oracle and inverse-QFT sampling',
            'not_claimed':'This does not crack P-256 or model a full fault-tolerant machine.'}

def grover_toy_demo():
    rows=grover_sim()
    best=max(rows,key=lambda x:x['quantum_theory'])
    return {'candidate_count':best['n_candidates'],'optimal_iteration':best['iterations'],
            'ideal_success':best['quantum_theory'],
            'not_claimed':'This is an unstructured oracle, not an AES-128 or AES-256 oracle.'}

def aes_partial_key_exposure_demo():
    """Real AES-128-GCM with only 12 SECRET bits; remaining 116 bits known.

    A brute-force demonstration of key entropy, not a break of full AES-128.
    """
    known_prefix=b'K'*14
    target_suffix=0x6C5
    key=known_prefix+target_suffix.to_bytes(2,'big')
    nonce=bytes.fromhex('000102030405060708090a0b')
    ciphertext=AESGCM(key).encrypt(nonce,MESSAGE,AAD)
    start=time.perf_counter_ns(); attempts=0;found=None
    for x in range(1<<12):
        attempts+=1
        candidate=known_prefix+x.to_bytes(2,'big')
        try:
            pt=AESGCM(candidate).decrypt(nonce,ciphertext,AAD)
        except InvalidTag:
            continue
        if pt==MESSAGE:
            found=x;break
    elapsed_ms=(time.perf_counter_ns()-start)/1e6
    assert found==target_suffix
    return {'cipher':'AES-128-GCM, real library','unknown_key_bits':12,
            'known_key_bits':116,'search_space':4096,'attempts':attempts,
            'elapsed_ms':elapsed_ms,'key_recovered':True,
            'plaintext_verified':True,'not_claimed':'Full 128-bit AES keys were not searched.'}

def hndl_toy_demo():
    """Recorded toy-ECDH AES-256-GCM later decrypted after recovering d.

    The future capability is modeled with ECC toy quantum Fourier sampling,
    NOT an assertion that deployed ECC is breakable in 2026.
    """
    curve=Curve(); generator=(5,1)
    alice_priv=7; bob_priv=11
    alice_pub=mul(curve,generator,alice_priv)
    bob_pub=mul(curve,generator,bob_priv)
    shared=mul(curve,bob_pub,alice_priv)
    assert shared==mul(curve,alice_pub,bob_priv)
    material=json.dumps({'shared_point':shared,'domain':'synthetic-ecdh-v1'},sort_keys=True).encode()
    key=derive(material,b'toy-ecdh-only-not-real-security')
    nonce=bytes.fromhex('00'*12)
    recorded=AESGCM(key).encrypt(nonce,MESSAGE,AAD)
    recovered_d=ecc_dlog_qft(secret=alice_priv)['secret']
    recovered_shared=mul(curve,bob_pub,recovered_d)
    recovered_material=json.dumps({'shared_point':recovered_shared,'domain':'synthetic-ecdh-v1'},sort_keys=True).encode()
    recovered_key=derive(recovered_material,b'toy-ecdh-only-not-real-security')
    restored=AESGCM(recovered_key).decrypt(nonce,recorded,AAD)
    assert restored==MESSAGE
    return {'recorded_ciphertext_bytes':len(recorded),'curve_order':19,
            'attacker_recovered_ec_scalar':recovered_d,
            'restored_exact_plaintext':restored.decode(),
            'warning':'A synthetic scenario with an intentionally tiny elliptic curve; not a deployed TLS attack.'}

def mlkem_demo(workspace:Path):
    check_openssl()
    workspace.mkdir(parents=True,exist_ok=True)
    sk,pk=gen_key('ML-KEM-768',workspace)
    ct,enc_ss=kem_encap(pk,workspace)
    dec_ss=kem_decap(sk,ct,workspace)
    assert enc_ss.read_bytes()==dec_ss.read_bytes()
    key=derive(enc_ss.read_bytes(),b'pqc-workshop-mlkem-aes256gcm-v1')
    iv=bytes.fromhex('d1a20a7f1b6fdc070ef309dd')
    sealed=AESGCM(key).encrypt(iv,MESSAGE,AAD)
    assert AESGCM(key).decrypt(iv,sealed,AAD)==MESSAGE
    corrupt=bytearray(sealed);corrupt[-1]^=1
    tamper_rejected=False
    try:
        AESGCM(key).decrypt(iv,bytes(corrupt),AAD)
    except InvalidTag:
        tamper_rejected=True
    assert tamper_rejected
    return {'algorithm':'ML-KEM-768 (FIPS 203) via OpenSSL 3.5+','ciphertext_bytes':ct.stat().st_size,
            'shared_secret_bytes':enc_ss.stat().st_size,'encaps_decaps_match':True,
            'aead_algorithm':'AES-256-GCM','aead_roundtrip':True,'aead_tamper_rejected':True,
            'warning':'AEAD tamper rejection is not a security proof for ML-KEM. Sender authenticity is separate.'}

def signatures_demo(workspace:Path):
    check_openssl()
    workspace.mkdir(parents=True,exist_ok=True)
    msg=workspace/'document.txt';msg.write_bytes(MESSAGE)
    tampered=workspace/'document_tampered.txt';tampered.write_bytes(MESSAGE+b' altered')
    out=[]
    for alg in ['ML-DSA-65','SLH-DSA-SHA2-128s']:
        d=workspace/alg;d.mkdir(parents=True,exist_ok=True)
        sk,pk=gen_key(alg,d)
        sig=d/'signature.bin';sign(sk,msg,sig)
        valid=verify(pk,msg,sig)
        invalid=verify(pk,tampered,sig)
        assert valid and not invalid
        out.append({'algorithm':alg,'signature_bytes':sig.stat().st_size,
                    'valid_document_accepted':valid,'modified_document_accepted':invalid})
    return out

def hybrid_demo(workspace:Path):
    """Classical X25519 + post-quantum ML-KEM combined via HKDF (toy composition).

    Protocol illustration only; not TLS 1.3, not RFC 10024 implementation.
    """
    from cryptography.hazmat.primitives.asymmetric import x25519
    sk,pk=gen_key('ML-KEM-768',workspace)
    ct,kemss=kem_encap(pk,workspace)
    mlkem_secret=kemss.read_bytes()
    a=x25519.X25519PrivateKey.generate();b=x25519.X25519PrivateKey.generate()
    x_secret=a.exchange(b.public_key())
    assert x_secret==b.exchange(a.public_key())
    combined=derive(x_secret+mlkem_secret,b'hybrid-demo-v1')
    # Only classical shared secret is disclosed; remaining ML-KEM remains secret.
    # This is a protocol intuition, not a reduction/proof of hybrid security.
    iv=bytes.fromhex('fee3da0b5f235f2125227535')
    sealed=AESGCM(combined).encrypt(iv,MESSAGE,AAD)
    return {'classical_component':'X25519','pqc_component':'ML-KEM-768',
            'combiner':'HKDF-SHA256 over concatenated secrets','key_bytes':len(combined),
            'ciphertext_bytes':len(sealed),'roundtrip':AESGCM(combined).decrypt(iv,sealed,AAD)==MESSAGE,
            'warning':'Demonstration of composition, not RFC 10024/TLS. No authentication or side-channel analysis.'}

if __name__=='__main__':
    with tempfile.TemporaryDirectory() as temp:
        base=Path(temp)
        results={'rsa_toy':rsa_toy_demo(),'ecc_toy':ecc_toy_demo(),
                 'grover':grover_toy_demo(),'aes_key_exposure':aes_partial_key_exposure_demo(),
                 'hndl_toy':hndl_toy_demo(),
                 'mlkem':mlkem_demo(base/'mlkem'),
                 'signatures':signatures_demo(base/'sigs'),
                 'hybrid':hybrid_demo(base/'hybrid')}
        print(json.dumps(results,indent=2))
