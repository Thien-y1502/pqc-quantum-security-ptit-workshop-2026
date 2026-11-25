"""Exact small-register state-vector / QFT demonstrations.

Educational ONLY. Ideal oracle state preparation, not a fault-tolerant
circuit resource estimate. All toy groups are intentionally cryptographically
insecure. Shor's procedures here model Fourier sampling correctly for the
small instances but are not general RSA/ECC cracking programs.
"""
from __future__ import annotations
from dataclasses import dataclass
from fractions import Fraction
import math
import numpy as np

@dataclass(frozen=True)
class Curve:
    p: int = 17
    a: int = 2
    b: int = 2

Point = tuple[int,int] | None

def add(c: Curve, p: Point, q: Point) -> Point:
    if p is None: return q
    if q is None: return p
    x1,y1=p; x2,y2=q
    if x1 == x2 and (y1+y2)%c.p==0: return None
    if p==q:
        if y1%c.p==0: return None
        slope=((3*x1*x1+c.a)*pow(2*y1,-1,c.p))%c.p
    else:
        slope=((y2-y1)*pow((x2-x1)%c.p,-1,c.p))%c.p
    x3=(slope*slope-x1-x2)%c.p
    y3=(slope*(x1-x3)-y1)%c.p
    return x3,y3

def mul(c: Curve,p: Point,n: int) -> Point:
    acc=None
    while n:
        if n&1: acc=add(c,acc,p)
        p=add(c,p,p); n>>=1
    return acc

def subgroup(c: Curve,p: Point) -> list[Point]:
    pts=[None]; current=None
    while True:
        current=add(c,current,p)
        if current is None: break
        if current in pts: raise ValueError('not a valid group sequence')
        pts.append(current)
    return pts

def shor_rsa_qft(n=15,a=2,counting_qubits=6,shots=1024,seed=20261123):
    if math.gcd(a,n)!=1: raise ValueError('a must be coprime to n')
    size=1<<counting_qubits
    state=np.zeros((size,n),dtype=np.complex128)
    for x in range(size): state[x,pow(a,x,n)]=1/math.sqrt(size)
    # Inverse QFT convention: complex FFT. Measurement probabilities are invariant
    # under overall phase; ideal modular exponentiation oracle already applied.
    spectrum=np.fft.fft(state,axis=0,norm='ortho')
    probs=np.sum(np.abs(spectrum)**2,axis=1)
    probs/=probs.sum()
    rng=np.random.default_rng(seed)
    outcomes=rng.choice(size,size=shots,p=probs)
    hist=np.bincount(outcomes,minlength=size)
    recovered=None; period=None
    for k in np.argsort(-hist):
        if k==0: continue
        guess=Fraction(int(k),size).limit_denominator(n).denominator
        if guess%2 or pow(a,guess,n)!=1: continue
        left=math.gcd(pow(a,guess//2,n)-1,n)
        right=math.gcd(pow(a,guess//2,n)+1,n)
        if 1<left<n and 1<right<n:
            recovered=sorted([left,right]);period=guess;break
    if recovered is None: raise AssertionError('RSA toy factor recovery failed')
    return dict(n=n,a=a,counting_qubits=counting_qubits,shots=shots,seed=seed,
                qft_probabilities=probs.tolist(),histogram=hist.tolist(),
                period=period,factors=recovered)

def ecc_dlog_qft(curve=None,generator=(5,1),secret=7,shots=1024,seed=20261123):
    """Two-register Fourier sampling of a small cyclic EC subgroup.

    Registers a,b in Z_r and point register f(a,b)=aP+bQ.
    After QFT(a,b), pairs (u,v) obey v=secret*u (mod r), so v/u
    recovers the discrete logarithm for u != 0. Includes group operations
    to construct the actual oracle basis state.
    """
    curve=curve or Curve()
    points=subgroup(curve,generator)
    r=len(points)
    if r<5 or any(r%d==0 for d in range(2,math.isqrt(r)+1)):
        raise ValueError('choose prime-order subgroup')
    public=mul(curve,generator,secret)
    lut={pt:i for i,pt in enumerate(points)}
    state=np.zeros((r,r,r),dtype=np.complex128)
    for a in range(r):
        for b in range(r):
            pt=add(curve,mul(curve,generator,a),mul(curve,public,b))
            state[a,b,lut[pt]]=1/r
    spectrum=np.fft.fftn(state,axes=(0,1),norm='ortho')
    probs=np.sum(np.abs(spectrum)**2,axis=2)
    probs/=probs.sum()
    rng=np.random.default_rng(seed)
    observed=rng.choice(r*r,size=shots,p=probs.reshape(-1))
    hist=np.bincount(observed,minlength=r*r).reshape(r,r)
    estimates=[]
    for code in observed:
        u,v=divmod(int(code),r)
        if u:
            estimates.append((v*pow(u,-1,r))%r)
    if not estimates or any(e!=secret%r for e in estimates):
        raise AssertionError('ECC QFT relation was violated')
    return dict(curve={'p':curve.p,'a':curve.a,'b':curve.b},group_order=r,
                generator=list(generator),public_point=list(public),secret=secret,
                shots=shots,seed=seed,samples_recoverable=len(estimates),
                success_rate=len(estimates)/shots,
                histogram=hist.tolist())

def grover_sim(nbits=8,target=173,max_iterations=15,shots=1024,seed=20261123):
    n=1<<nbits
    if target>=n: raise ValueError('target out of range')
    amplitudes=np.ones(n)/math.sqrt(n)
    angle=math.asin(1/math.sqrt(n))
    rng=np.random.default_rng(seed)
    rows=[]
    for t in range(max_iterations+1):
        empirical=int(rng.binomial(shots,abs(amplitudes[target])**2))
        rows.append({'iterations':t,'classical_success':min((t+1)/n,1.0),
                     'quantum_theory':math.sin((2*t+1)*angle)**2,
                     'quantum_sampled':empirical/shots,'success_shots':empirical,
                     'shots':shots,'n_candidates':n})
        # Phase oracle |target> -> -|target>, then diffusion 2|s><s| - I.
        amplitudes[target]*=-1
        amplitudes=2*np.mean(amplitudes)-amplitudes
        amplitudes=np.asarray(amplitudes,dtype=np.float64)
    assert all(abs(row['quantum_theory']-row['quantum_sampled'])<0.09 for row in rows)
    return rows
