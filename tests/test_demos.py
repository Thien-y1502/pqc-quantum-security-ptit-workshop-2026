"""Reproducible mathematical and cryptographic checks for the workshop."""
import math
from pathlib import Path
import tempfile
import unittest

from demos.quantum_toy import Curve,add,mul,subgroup,shor_rsa_qft,ecc_dlog_qft,grover_sim
from demos.attack_and_defense import (rsa_toy_demo,ecc_toy_demo,grover_toy_demo,
    aes_partial_key_exposure_demo,hndl_toy_demo,mlkem_demo,signatures_demo,hybrid_demo)
from demos.openssl_pqc import check_openssl

class QuantumToyTest(unittest.TestCase):
    def test_ec_group_arithmetic(self):
        c=Curve();p=(5,1)
        points=subgroup(c,p)
        self.assertEqual(len(points),19)
        self.assertEqual(mul(c,p,7),(0,6))
        self.assertIsNone(mul(c,p,19))
        self.assertEqual(add(c,mul(c,p,7),mul(c,p,11)),mul(c,p,18))
    def test_rsa_qft(self):
        out=shor_rsa_qft()
        self.assertEqual(out['factors'],[3,5])
        self.assertEqual(out['period'],4)
        self.assertEqual(sum(out['histogram']),1024)
        self.assertAlmostEqual(sum(out['qft_probabilities']),1.0,places=10)
    def test_ec_qft(self):
        out=ecc_dlog_qft()
        self.assertEqual(out['secret'],7)
        self.assertGreater(out['success_rate'],.9)
        r=out['group_order']
        for u,row in enumerate(out['histogram']):
            for v,count in enumerate(row):
                if count:self.assertEqual((7*u-v)%r,0)
    def test_grover(self):
        out=grover_sim()
        self.assertGreater(out[12]['quantum_theory'],.999)
        self.assertAlmostEqual(out[0]['quantum_theory'],1/256,places=10)
        self.assertEqual(out[12]['shots'],1024)

class ProtocolDemoTest(unittest.TestCase):
    def test_rsa_ecc_toy_roundtrip(self):
        self.assertEqual(rsa_toy_demo()['recovered_plaintext'],2)
        self.assertEqual(ecc_toy_demo()['recovered_scalar'],7)
    def test_aes_partial_known_key(self):
        out=aes_partial_key_exposure_demo()
        self.assertEqual(out['attempts'],1734)
        self.assertEqual(out['unknown_key_bits'],12)
        self.assertTrue(out['plaintext_verified'])
    def test_hndl_toy(self):
        self.assertIn('SYNTHETIC ONLY',hndl_toy_demo()['restored_exact_plaintext'])
    def test_real_nist_algorithms(self):
        self.assertIn('OpenSSL',check_openssl())
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)
            kem=mlkem_demo(p/'kem')
            self.assertTrue(kem['aead_roundtrip'])
            self.assertTrue(kem['aead_tamper_rejected'])
            self.assertEqual(kem['ciphertext_bytes'],1088)
            sigs=signatures_demo(p/'sigs')
            self.assertEqual(len(sigs),2)
            self.assertTrue(all(x['valid_document_accepted'] for x in sigs))
            self.assertTrue(all(not x['modified_document_accepted'] for x in sigs))
            hybrid=hybrid_demo(p/'hybrid')
            self.assertTrue(hybrid['roundtrip'])

if __name__=='__main__':unittest.main()
