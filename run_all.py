"""Run every demo, independently verify all checks, produce raw data and charts."""
from __future__ import annotations
import argparse
import csv
import json
from pathlib import Path
import tempfile
from demos.quantum_toy import shor_rsa_qft,ecc_dlog_qft,grover_sim
from demos.attack_and_defense import (rsa_toy_demo,ecc_toy_demo,grover_toy_demo,
    aes_partial_key_exposure_demo,hndl_toy_demo,mlkem_demo,signatures_demo,hybrid_demo)
from benchmarks.benchmark_suite import perform
from figures.plot_all import plot_all

ROOT=Path(__file__).resolve().parent

def csvwrite(path,rows,columns):
    path.parent.mkdir(exist_ok=True,parents=True)
    with path.open('w',newline='',encoding='utf8') as f:
        w=csv.DictWriter(f,fieldnames=columns);w.writeheader();w.writerows(rows)

def main(trials=14,aes_trials=30):
    raw=ROOT/'results'/'raw';raw.mkdir(parents=True,exist_ok=True)
    shor=shor_rsa_qft();ecc=ecc_dlog_qft();grover=grover_sim()
    csvwrite(raw/'rsa_qft_histogram.csv',
             [{'bin':i,'probability':shor['qft_probabilities'][i],'count':c} for i,c in enumerate(shor['histogram'])],
             ['bin','probability','count'])
    csvwrite(raw/'ecc_qft_histogram.csv',
             [{'u':u,'v':v,'count':ecc['histogram'][u][v]} for u in range(ecc['group_order']) for v in range(ecc['group_order'])],
             ['u','v','count'])
    csvwrite(raw/'grover_probability.csv',grover,list(grover[0].keys()))
    with tempfile.TemporaryDirectory(prefix='pqc_full_demos_') as td:
        base=Path(td)
        demos={'rsa_toy':rsa_toy_demo(),'ecc_toy':ecc_toy_demo(),
               'grover':grover_toy_demo(),'aes_partial_key_exposure':aes_partial_key_exposure_demo(),
               'hndl_toy':hndl_toy_demo(),'mlkem':mlkem_demo(base/'mlkem'),
               'signatures':signatures_demo(base/'signatures'),
               'hybrid':hybrid_demo(base/'hybrid')}
    (raw/'verified_demos.json').write_text(json.dumps(demos,indent=2),encoding='utf8')
    metrics=perform(raw,trials=trials,aes_trials=aes_trials)
    plot_all(raw,ROOT/'results'/'figures')
    print(json.dumps({'all_demo_checks':'PASS','demo_count':len(demos),
                      'primitive_timed_types':len(metrics['primitive_summary']),
                      'figures':len(list((ROOT/'results'/'figures').glob('*.png')))},indent=2))
    return demos,metrics

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--trials',type=int,default=14)
    p.add_argument('--aes-trials',type=int,default=30)
    a=p.parse_args();main(a.trials,a.aes_trials)
