/**
 * PTIT PQC workshop 2026 - reproducible PowerPoint authored with PptxGenJS.
 * All quantitative graphics are read from ../results/figures and are produced
 * by python run_all.py, not synthetic artwork or invented measurements.
 * Math is typeset via TeX source in assets/equations/, then embedded as PNG.
 */
const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
// During authoring use the installed slide-layout helpers. On an ordinary GitHub
// checkout, fall back to a tiny independent PNG-only fit routine so users can
// rebuild without any OpenAI-specific runtime.
let imageSizingContain, warnIfSlideElementsOutOfBounds;
try {
  if (process.env.PQC_FORCE_PORTABLE) throw new Error('portable rebuild requested');
  ({imageSizingContain,warnIfSlideElementsOutOfBounds} = require('/home/oai/skills/slides/pptxgenjs_helpers'));
} catch (_error) {
  imageSizingContain = (file,x,y,w,h) => {
    const buf=fs.readFileSync(file);
    if(buf.toString('ascii',1,4)!=='PNG') throw new Error('Portable rebuild supports PNG images only: '+file);
    const iw=buf.readUInt32BE(16),ih=buf.readUInt32BE(20);
    const k=Math.min(w/iw,h/ih),ww=iw*k,hh=ih*k;
    return {x:x+(w-ww)/2,y:y+(h-hh)/2,w:ww,h:hh};
  };
  warnIfSlideElementsOutOfBounds = () => {};
}

const P = new pptxgen();
P.layout='LAYOUT_WIDE'; P.author='Bui Phi Hung';
P.subject='Post-Quantum Cryptography: quantum risks, NIST standards, verified toy attacks and real PQC benchmarking';
P.title='Post-Quantum Cryptography - PTIT Workshop 2026';
P.company='Quantum Intelligence Algorithms Laboratory, PTIT';
P.lang='en-US';
P.theme={headFontFace:'Aptos Display',bodyFontFace:'Aptos',lang:'en-US'};
const SW=13.3333333333,SH=7.5;
const C={navy:'173E65',navy2:'0D2E52',blue:'277FA6',teal:'15877F',red:'CB3547',gold:'D19230',
  ink:'23384C',muted:'647588',light:'F4F8FB',white:'FFFFFF',line:'D7E3EA',pblue:'EAF3F9',
  pteal:'E8F5F2',pred:'FCF0F0',pgold:'FFF5E4',dark:'153B61'};
const img=path.join(__dirname,'assets');
const chart=(name)=>path.join(__dirname,'..','results','figures',name);
const eqpath=(name)=>path.join(img,'equations',name+'.png');
const logo=path.join(img,'ptit_logo_original.png');
const club=path.join(img,'club_logo_original.png');
const SHAPE=P.ShapeType;
let slideNumber=0;
function txt(s,text,x,y,w,h,size=17,color=C.ink,bold=false,extra={}){
  s.addText(text,{x,y,w,h,fontFace:'Aptos',fontSize:size,color,bold,
      margin:0,breakLine:false,valign:'mid',fit:'shrink',...extra});
}
function rectangle(s,x,y,w,h,fill=C.white,line=null,r=0.08){
  s.addShape(SHAPE.roundRect,{x,y,w,h,rectRadius:r,
      fill:{color:fill},line:{color:line||fill,transparency:line?0:100,width:.8},radius:r});
}
function line(s,x1,y1,x2,y2,color=C.line,width=1.3,dash='solid'){
  s.addShape(SHAPE.line,{x:x1,y:y1,w:x2-x1,h:y2-y1,line:{color,width,dashType:dash}});
}
function dot(s,x,y,fill=C.teal,r=.07){s.addShape(SHAPE.ellipse,{x,y,w:2*r,h:2*r,fill:{color:fill},line:{color:fill}})}
function pill(s,label,x,y,w,color=C.blue,bg=C.pblue){rectangle(s,x,y,w,.36,bg);txt(s,label,x+.1,y+.03,w-.2,.28,10.2,color,true,{charSpacing:.35});}
function fitimg(s,p,x,y,w,h){if(!fs.existsSync(p))throw new Error('Asset not found: '+p);s.addImage({path:p,...imageSizingContain(p,x,y,w,h)});}
function math(s,name,x,y,w,h){fitimg(s,eqpath(name),x,y,w,h)}
function chartImg(s,name,x,y,w,h){fitimg(s,chart(name),x,y,w,h)}
function logoSmall(s){fitimg(s,logo,12.20,.33,.43,.56);fitimg(s,club,12.7,.35,.42,.51);}
function base(section,title,kicker=''){
  slideNumber++;
  let s=P.addSlide();s.background={color:C.white};
  s.addShape(SHAPE.rect,{x:0,y:0,w:SW,h:.105,fill:{color:C.navy},line:{color:C.navy}});
  txt(s,section.toUpperCase(),.58,.29,10,.25,10.4,C.blue,true,{charSpacing:1.5});
  txt(s,title,.58,.69,11.40,.51,25,C.navy,true);
  if(kicker)txt(s,kicker,.59,1.19,11.78,.34,12,C.muted,false);
  line(s,.56,1.60,12.79,1.60,C.line,1);
  line(s,.57,7.06,12.74,7.06,C.line,.7);
  txt(s,'POST-QUANTUM CRYPTOGRAPHY  |  PTIT HCMC  |  29 NOV 2026',.58,7.13,9,.16,8.1,C.muted,true);
  txt(s,String(slideNumber).padStart(2,'0'),12.37,7.10,.43,.2,9,C.muted,true,{align:'right'});
  logoSmall(s);
  return s;
}
function notes(s,body,sources=[]){s.addNotes(body+'\n\n[Sources]\n'+sources.map(x=>x).join('\n'));}
function card(s,x,y,w,h,label,body,accent=C.blue,fill=C.light){
  rectangle(s,x,y,w,h,fill);s.addShape(SHAPE.rect,{x:x,y,w:.07,h,fill:{color:accent},line:{color:accent}});
  txt(s,label,x+.24,y+.18,w-.40,.34,16,accent,true);
  txt(s,body,x+.24,y+.63,w-.45,h-.80,13,C.ink,false,{valign:'top',breakLine:false});
}
function arrow(s,x,y,color=C.blue){txt(s,'>',x,y,.34,.42,23,color,true,{align:'center'});}
function twoColFormula(s,leftEq,rightEq,leftTitle,rightTitle,leftBody,rightBody){
  card(s,.7,1.95,5.75,3.88,leftTitle,leftBody,C.blue,C.pblue);
  card(s,6.86,1.95,5.75,3.88,rightTitle,rightBody,C.teal,C.pteal);
  math(s,leftEq,1.07,3.65,5.05,.76);math(s,rightEq,7.18,3.65,5.06,.75);
}
// 01 - Cover
{
 slideNumber++;const s=P.addSlide();s.background={color:C.navy2};
 s.addShape(SHAPE.rect,{x:0,y:0,w:8.6,h:SH,fill:{color:C.navy},line:{color:C.navy}});
 s.addShape(SHAPE.rect,{x:.67,y:1.52,w:.08,h:3.90,fill:{color:'E34B4F'},line:{color:'E34B4F'}});
 txt(s,'SECURITY  |  QUANTUM  |  MIGRATION',1.0,1.42,7,.39,13,'D7E8F4',true,{charSpacing:2});
 txt(s,'POST-QUANTUM\nCRYPTOGRAPHY',.97,2.15,9.45,1.54,40,C.white,true,{breakLine:false,valign:'mid'});
 txt(s,'From Shor and Grover to NIST standards, verified experiments, and real migration',1.01,4.06,7.1,.87,19,'E0EDF6');
 txt(s,'Bui Phi Hung  |  Quantum Intelligence Algorithms Laboratory  |  PTIT',1.00,6.34,8.2,.36,12.3,'E8F1F7',true);
 txt(s,'Technical Workshop  |  29 November 2026',1.02,6.76,7.6,.28,11,'BCD3E4');
 // understated overlapping rings
 for(const [x,y,r,col] of [[9.2,1.70,2.5,'3E8DBC'],[10.6,1.80,2.5,'C24E60'],[9.9,3.16,2.5,'2D9C8F']])
  s.addShape(SHAPE.ellipse,{x,y,w:r,h:r,fill:{color:col,transparency:84},line:{color:col,width:2.4,transparency:20}});
 fitimg(s,logo,11.86,.39,.59,.77);fitimg(s,club,12.53,.42,.53,.64);
 notes(s,'Open by asking: can encrypted data recorded now remain secret after future cryptanalytically relevant quantum computers exist? This presentation separates ideal toy quantum sampling from practical NIST-standardized cryptography and measured local benchmarks.',
   ['https://www.nist.gov/news-events/news/2026/10/nist-report-provides-guidelines-transition-post-quantum-cryptography']);
}
// 02 - Presenter
{
 const s=base('Presenter','Bui Phi Hung','Quantum Intelligence Algorithms Laboratory  |  Posts and Telecommunications Institute of Technology');
 rectangle(s,.84,2.09,4.25,3.79,C.pblue);fitimg(s,logo,1.39,2.41,1.39,1.99);fitimg(s,club,3.15,2.55,1.42,1.68);
 txt(s,'President',5.51,2.13,5.92,.48,19,C.blue,true);
 txt(s,'Science & Technology Club',5.51,2.61,6.50,.53,25,C.navy,true);
 line(s,5.52,3.34,11.98,3.34,C.line,1.2);
 txt(s,'Department of Information Security',5.52,3.64,6.52,.39,16,C.ink);
 txt(s,'Faculty of Information Technology',5.52,4.10,6.51,.38,16,C.ink);
 txt(s,'PTIT  |  Ho Chi Minh City, Viet Nam',5.52,4.56,6.51,.40,16,C.ink);
 pill(s,'FOCUS  |  POST-QUANTUM SECURITY',5.52,5.27,4.70,C.teal,C.pteal);
 notes(s,'Presenter information comes from the original PPTX, using the role President of Science & Technology Club and academic affiliation supplied by the presenter. Avoid using an unrequested alias in the title.');
}
// 03 - Venn: three domains; semantic centerpiece, native/editable vectors
{
 const s=base('Concept map','Three domains. One migration decision.','A conceptual map: current cryptography, quantum attack capabilities, and post-quantum defenses.');
 const circles=[{x:2.62,y:1.87,c:'357EB5'},{x:6.22,y:1.87,c:'CF5F62'},{x:4.42,y:3.03,c:'27A08A'}];
 circles.forEach(o=>s.addShape(SHAPE.ellipse,{x:o.x,y:o.y,w:3.96,h:3.96,fill:{color:o.c,transparency:86},line:{color:o.c,width:2.4}}));
 txt(s,'CURRENT CRYPTO',3.20,2.56,3.05,.33,17,C.navy,true,{align:'center'});
 txt(s,'RSA  /  ECC  /  AES',3.26,3.02,2.94,.25,12,C.navy,false,{align:'center'});
 txt(s,'QUANTUM THREAT',7.02,2.56,2.73,.33,17,'9D2C3B',true,{align:'center'});
 txt(s,'Shor  /  Grover  /  HNDL',6.97,3.02,2.89,.25,12,'9D2C3B',false,{align:'center'});
 txt(s,'PQC DEFENSE',5.12,5.42,2.95,.34,17,'126C60',true,{align:'center'});
 txt(s,'Lattice  /  Hash  /  NIST',5.12,5.87,2.95,.26,12,'126C60',false,{align:'center'});
 rectangle(s,4.71,3.76,3.73,1.19,C.white,C.navy,.10);
 s.addShape(SHAPE.rect,{x:4.71,y:3.76,w:3.73,h:.065,fill:{color:C.red},line:{color:C.red}});
 txt(s,'PQC MIGRATION',4.93,3.99,3.29,.40,19,C.navy,true,{align:'center'});
 txt(s,'Choose, integrate, verify',4.95,4.42,3.25,.28,12,C.ink,false,{align:'center'});
 notes(s,'Explain the three domains, then zoom into them sequentially throughout the lecture. The overlapping circles are an educational conceptual map, not a formal set-theoretic equality. PQC runs on ordinary computers and is distinct from quantum key distribution.',
  ['https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 04 - Definition
{
 const s=base('01  /  Context','PQC: a precise definition','Design cryptography that remains secure against known classical and quantum cryptanalytic methods.');
 rectangle(s,.83,2.02,11.67,1.53,C.navy);
 txt(s,'PQC does NOT require a quantum computer.',1.12,2.33,10.99,.62,29,C.white,true,{align:'center'});
 card(s,.84,3.85,3.65,2.02,'What changes?','Public-key assumptions, key establishment, and digital signatures.',C.blue,C.pblue);
 card(s,4.83,3.85,3.65,2.02,'What stays?','Symmetric encryption, authenticated encryption, and modern hash functions.',C.teal,C.pteal);
 card(s,8.82,3.85,3.65,2.02,'What is NOT promised?','No scheme is proven forever immune to any future discovery.',C.red,C.pred);
 notes(s,'PQC refers to cryptographic algorithms meant for ordinary computing platforms. Unlike QKD, PQC does not rely on quantum transmission hardware. It is designed against known quantum algorithms; security depends on assumptions and correct deployment.',
  ['https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 05 - current primitives
{
 const s=base('01  /  Context','Three cryptographic roles in one secure session','Different tasks face different quantum threats.');
 card(s,.75,2.01,3.95,3.90,'PUBLIC KEY','ECDHE / RSA: establish or protect session secrets.\nECDSA / RSA-PSS: authenticate the peer.\nMain threat: Shor.',C.blue,C.pblue);
 card(s,4.77,2.01,3.95,3.90,'SYMMETRIC','AES-GCM: protect bulk application data.\nGrover gives a quadratic ideal query advantage, not an RSA-like break.',C.teal,C.pteal);
 card(s,8.79,2.01,3.78,3.90,'HASHING','SHA-256 / SHA-3: digest and integrity building blocks.\nHash output length and role determine quantum margins.',C.gold,C.pgold);
 rectangle(s,.93,6.23,11.44,.38,C.navy);
 txt(s,'Public-key transition is urgent; symmetric and hash migration is a parameter / use-case decision.',1.01,6.29,11.27,.25,12,C.white,true,{align:'center'});
 notes(s,'AES is not asymmetric encryption. SHA-256 is a hash function, not encryption. TLS 1.3 uses ephemeral key agreement and authenticated encryption; older RSA key transport differs. Shor threatens factoring and discrete logarithms, while Grover offers ideal quadratic search speedups.',
  ['https://csrc.nist.gov/Projects/post-quantum-cryptography','https://www.rfc-editor.org/rfc/rfc8446.html']);
}
// 06 - channel
{
 const s=base('01  /  Context','What happens in an encrypted connection?','Authentication and key establishment precede bulk data protection.');
 const xs=[.77,3.95,7.13,10.31];
 const arr=[['CLIENT','Initiates connection'],['KEY AGREEMENT','ECDHE + authentication'],['SESSION KEY','HKDF / key schedule'],['APPLICATION','AES-GCM records']];
 arr.forEach((v,i)=>{card(s,xs[i],2.73,2.31,2.25,v[0],v[1],[C.blue,C.red,C.teal,C.blue][i],i===1?C.pred:C.pblue);if(i<3)arrow(s,xs[i]+2.48,3.63)});
 rectangle(s,1.06,5.54,11.16,.69,C.pgold);
 txt(s,'Only breaking key establishment does not bypass all authentication requirements.',1.24,5.72,10.81,.33,16,C.ink,true,{align:'center'});
 notes(s,'Explain the separation between peer authentication, ephemeral key establishment, HKDF, and AEAD. This abstract flow is intentionally not a wire-level TLS implementation; protocol version and handshake mode matter.',
  ['https://www.rfc-editor.org/rfc/rfc8446.html']);
}
// 07 RSA and ECC
{
 const s=base('02  /  Threat','RSA and ECC rely on different hard problems','Classical hardness means known classical algorithms require enormous work at approved parameter sizes.');
 twoColFormula(s,'rsa','ecc','RSA: FACTORING','ECC: DISCRETE LOG',
     'Easy direction: multiply large primes.\nHard direction: factor their product.\nShor reduces factoring to order-finding.',
     'Easy direction: scalar multiplication on E(Fp).\nHard direction: recover scalar d from P and Q.\nQuantum discrete-log algorithms change this.');
 txt(s,'The difference is the mathematical problem, not merely key length.',1.16,6.20,11.12,.35,17,C.navy,true,{align:'center'});
 notes(s,'RSA key generation chooses large primes. Factoring N undermines related secret information. ECC uses discrete logarithms in suitable elliptic-curve groups. Shor has polynomial-time algorithms for factoring and discrete logarithm on an ideal fault-tolerant quantum computer.',
  ['https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm','https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 08 quantum bits
{
 const s=base('02  /  Threat','Quantum advantage comes from interference','Superposition is necessary but not sufficient for algorithmic speedup.');
 math(s,'qubit',1.05,1.99,11.20,1.13);
 const xs=[.82,4.85,8.87];
 [['SUPERPOSITION','Amplitude across basis states'],['PHASE + INTERFERENCE','Constructive and destructive combination'],['MEASUREMENT','One outcome; probabilities matter']].forEach((p,i)=>{
   card(s,xs[i],3.48,3.63,2.06,p[0],p[1],[C.blue,C.teal,C.red][i],[C.pblue,C.pteal,C.pred][i]);
   if(i<2)arrow(s,xs[i]+3.69,4.25);
 });
 txt(s,'A photon can encode a qubit; it is not universally equivalent to one classical bit.',1.06,6.12,11.06,.45,16,C.navy,true,{align:'center'});
 notes(s,'Qubits carry complex amplitudes and relative phases; measurement returns an observed outcome, not all 2^n basis labels. Algorithms exploit controlled interference and structure. Photonic platforms are one of several physical realizations.',
  ['https://quantum.cloud.ibm.com/learning/en/courses/quantum-information/quantum-circuits/quantum-circuits']);
}
// 09 Shor
{
 const s=base('02  /  Threat','Shor: periodic structure instead of trial division','Factorization is reduced to order finding in modular exponentiation.');
 math(s,'shor_order',1.2,1.86,10.8,.84);
 const stages=[['CHOOSE a','gcd(a,N)=1'],['MODULAR ORACLE','a^x mod N'],['INVERSE QFT','phase / frequency peaks'],['POST-PROCESS','recover r; compute gcd']];
 stages.forEach((v,i)=>{card(s,.78+i*3.12,3.11,2.72,2.20,v[0],v[1],[C.blue,C.blue,C.teal,C.red][i],[C.pblue,C.pblue,C.pteal,C.pred][i]);if(i<3)arrow(s,3.50+i*3.12,4.04)});
 math(s,'qft_peaks',1.2,5.69,10.8,.76);
 notes(s,'For suitable a, find order r such that a^r=1 mod N. If r is even and a^(r/2) is not -1 modulo N, nontrivial gcd factors can be found. Ideal QFT probabilities concentrate near integer multiples of 2^t/r. Toy simulation explicitly prepares the modular oracle state and applies an inverse-QFT FFT.',
 ['https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm']);
}
// 10 ECC quantum DLP
{
 const s=base('02  /  Threat','The analogous quantum risk for ECC','Two-register Fourier sampling can expose a discrete logarithm in a tiny cyclic group.');
 card(s,.84,2.05,5.00,2.98,'TOY EC GROUP','Public P and Q = [d]P; seek d.\nUse uniform a,b registers and a point oracle: aP+bQ.\nFourier outcomes satisfy a linear relation.',C.blue,C.pblue);
 rectangle(s,6.18,2.05,6.15,2.98,C.pteal);
 txt(s,'Fourier sampling identity',6.46,2.35,5.45,.42,18,C.teal,true);
 math(s,'ec_qft',6.38,3.17,5.78,.66);
 txt(s,'This experiment will use r = 19, not P-256.',1.17,5.69,10.91,.40,18,C.navy,true,{align:'center'});
 notes(s,'This pedagogical simulation shows Fourier sampling in the group generated by P=(5,1) on y^2=x^3+2x+2 over F_17. The group order is 19, and Q=7P. The idealized oracle is not a gate-by-gate implementation for commercial P-256. The derived u,v relation identifies d mod r.',
  ['https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 11 Grover
{
 const s=base('02  /  Threat','Grover: a different kind of quantum advantage','Search amplification changes ideal query complexity without revealing every key at once.');
 math(s,'grover_complexity',1.07,2.12,11.15,.85);
 card(s,.91,3.46,3.57,2.26,'ORACLE','Mark the correct candidate by changing its phase.',C.blue,C.pblue);
 card(s,4.87,3.46,3.57,2.26,'DIFFUSION','Amplify marked amplitude through a reflection.',C.teal,C.pteal);
 card(s,8.82,3.46,3.57,2.26,'MEASUREMENT','High success after an appropriate number of iterations.',C.red,C.pred);
 math(s,'grover',1.38,6.06,10.49,.52);
 notes(s,'Ideal unstructured search with N=2^k entries needs O(2^(k/2)) oracle queries for Grover, versus O(2^k) classically. Counting an AES oracle demands implementing reversible AES plus key schedule and fault tolerance; the schematic oracle demonstration is not an actual AES quantum attack. AES-256 increases margin.',
  ['https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 12 HNDL
{
 const s=base('02  /  Threat','Harvest now, decrypt later (HNDL)','The confidentiality lifetime of intercepted data may exceed the lifetime of its key agreement.');
 const stages=[{x:.76,yr:'2026',head:'CAPTURE',body:'Record encrypted content and public handshake material.'},
 {x:4.83,yr:'FUTURE',head:'QUANTUM CAPABILITY',body:'A sufficiently powerful quantum computer threatens vulnerable public-key systems.'},
 {x:8.90,yr:'LATER',head:'RECOVER OLD DATA',body:'If past session secrets are derived, recorded payloads may be decrypted.'}];
 line(s,1.40,3.29,11.76,3.29,C.navy,3);
 stages.forEach((v,i)=>{dot(s,v.x+1.77,3.20,[C.blue,C.red,C.teal][i],.10);
   txt(s,v.yr,v.x+1.03,2.61,2.55,.39,19,[C.blue,C.red,C.teal][i],true,{align:'center'});
   card(s,v.x,3.83,3.72,2.16,v.head,v.body,[C.blue,C.red,C.teal][i],[C.pblue,C.pred,C.pteal][i]);});
 txt(s,'Risk is greatest for information that must remain confidential for years.',1.16,6.31,10.96,.31,16,C.navy,true,{align:'center'});
 notes(s,'An adversary can store encrypted traffic today and attempt decryption later after gaining new capabilities. This is particularly relevant to long-lived secrets. It does not mean recording any AES ciphertext automatically allows future decryption: the key establishment must be compromised and protocol details matter.',
 ['https://www.nist.gov/news-events/news/2026/10/nist-report-provides-guidelines-transition-post-quantum-cryptography']);
}
// 13 threat matrix
{
 const s=base('02  /  Threat','What breaks, what survives, what changes?','Quantum exposure is not uniform across cryptographic families.');
 const rows=[['RSA / RSA-PSS','Integer factoring / RSA signatures','Shor','Replace vulnerable public-key uses'],
 ['ECDH / ECDSA','Elliptic-curve discrete log','Shor','PQC KEM and signatures'],
 ['AES-128','Symmetric key search','Grover model','Assess security margin / threat model'],
 ['AES-256','Symmetric key search','Grover model','Retain with suitable implementation'],
 ['SHA-256 / SHA-3','Hash / preimage / collision properties','Quantum search effects vary','Choose appropriate digest sizes and roles']];
 const cx=[.74,3.35,7.38,9.45],cw=[2.47,3.87,1.88,3.01];
 ['FAMILY','CLASSICAL ASSUMPTION','THREAT','RESPONSE'].forEach((t,i)=>{
    s.addShape(SHAPE.rect,{x:cx[i],y:2.03,w:cw[i],h:.50,fill:{color:C.navy},line:{color:C.navy}});
    txt(s,t,cx[i]+.10,2.14,cw[i]-.14,.25,11.2,C.white,true);
 });
 rows.forEach((r,j)=>{
    const y=2.56+j*.71;
    s.addShape(SHAPE.rect,{x:.74,y,w:11.75,h:.68,fill:{color:j%2?C.white:C.light},line:{color:C.line,width:.25}});
    r.forEach((v,i)=>txt(s,v,cx[i]+.10,y+.06,cw[i]-.17,.56,i===0?11.6:10.4,i===2?C.red:C.ink,i===0));
 });
 notes(s,'This is a qualitative threat map, not a cryptanalytic time-to-break forecast. Use Shor for factoring and DLP, not for direct AES encryption. Grover preimage-search advantages differ from collision-attack scenarios. Key-management and authentication changes are distinct.',
 ['https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 14 - section interlude
{
 slideNumber++;const s=P.addSlide();s.background={color:C.navy};
 txt(s,'THE DEFENSIVE SHIFT',.96,1.23,9.9,.45,15,'A6D7E9',true,{charSpacing:2});
 txt(s,'CHANGE THE\nHARD PROBLEM.',.93,2.05,11.5,2.05,52,C.white,true);
 txt(s,'From factoring / discrete logarithms  ->  module lattices / hash-based constructions',.95,5.18,10.6,.74,20,'E0EEF8');
 s.addShape(SHAPE.rect,{x:.96,y:6.27,w:3.70,h:.08,fill:{color:C.red},line:{color:C.red}});
 fitimg(s,logo,11.51,.51,.67,.91);fitimg(s,club,12.33,.57,.62,.77);
 notes(s,'This interlude marks a shift from identifying quantum threats to changing the mathematical assumptions in the cryptographic protocol.',
 ['https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 15 - LWE
{
 const s=base('03  /  Mathematics','Learning with errors: hiding a secret in noisy equations','Linear algebra alone is not enough once carefully sampled errors are introduced.');
 math(s,'lwe',.84,2.01,11.69,.97);
 const cols=[['A','Public matrix',C.blue,C.pblue],['s','Hidden vector',C.red,C.pred],['e','Small error',C.teal,C.pteal]];
 cols.forEach((v,i)=>card(s,.86+i*4.12,3.34,3.60,1.72,v[0],v[1],v[2],v[3]));
 rectangle(s,1.08,5.43,11.04,.74,C.pgold);
 txt(s,'LWE is an intuition; real security depends on parameters, distributions, and reductions.',1.24,5.65,10.71,.34,15,C.ink,true,{align:'center'});
 notes(s,'LWE: given A and b=A*s+e modulo q, recover s or distinguish b from random under specified distributions. Without noise, linear algebra can solve appropriately full-rank systems. ML-KEM uses module structure over polynomial rings, not this simplistic scalar equation as a complete specification.',
 ['https://csrc.nist.gov/pubs/fips/203/final']);
}
// 16 module ring
{
 const s=base('03  /  Mathematics','Module lattices: structure + noise + carefully chosen parameters','The module setting provides compact algebraic representations.');
 rectangle(s,.91,1.99,11.47,1.12,C.pblue);
 math(s,'module_lwe',1.04,2.22,11.18,.65);
 card(s,.92,3.43,5.44,2.48,'MATHEMATICAL STRUCTURE','Vectors of polynomials modulo a fixed ring relation.\nEfficiency comes from structured algebra.',C.blue,C.pblue);
 card(s,6.74,3.43,5.44,2.48,'SECURITY ASSUMPTION','Recovering secrets from noisy structured relations is believed hard for known classical and quantum attacks.',C.teal,C.pteal);
 txt(s,'A new assumption is a risk trade-off, not a proof of invulnerability.',1.18,6.33,10.95,.28,15,C.red,true,{align:'center'});
 notes(s,'For ML-KEM, the ring R_q is a quotient polynomial ring and vectors/matrices live in module spaces. Security relies on Module-LWE related assumptions plus correct CCA-secure KEM design. Explain how errors frustrate direct linear-algebra recovery without falsely asserting every lattice problem resists all possible quantum attacks.',
 ['https://csrc.nist.gov/pubs/fips/203/final']);
}
// 17 math change
{
 const s=base('03  /  Mathematics','Compare the assumptions, not just key sizes','A mathematical change also alters packet size, libraries, key management and signatures.');
 const items=[['CLASSICAL RSA','Factor N = pq','Shor order finding'],['CLASSICAL ECC','Recover d from Q = dP','Quantum discrete logarithm'],
              ['ML-KEM / ML-DSA','Structured module-lattice problems','No known efficient quantum attack at specified parameter sets'],
              ['SLH-DSA','Hash security and authentication trees','Security requires correct hash parameters and implementation']];
 items.forEach((a,i)=>{
   const y=1.94+i*1.07;rectangle(s,.85,y,11.62,.89,i%2?C.white:C.light,C.line);
   txt(s,a[0],1.07,y+.18,2.70,.41,14.2,i>1?C.teal:C.navy,true);
   txt(s,a[1],4.02,y+.14,3.42,.54,12.1,C.ink);
   txt(s,a[2],7.79,y+.11,4.26,.59,11.2,i>1?C.teal:C.red,false);
 });
 notes(s,'Do not say PQC is proved unbreakable. Each primitive has security notions (KEM IND-CCA, EUF-CMA for signatures, etc.) and depends on concrete parameters. The point of migration is to move away from known polynomial-time quantum algorithms targeting factoring and discrete logarithms.',
 ['https://csrc.nist.gov/pubs/fips/203/final','https://csrc.nist.gov/pubs/fips/204/final','https://csrc.nist.gov/pubs/fips/205/final']);
}
// 18 standards
{
 const s=base('04  /  Standards','NIST: three finalized PQC FIPS standards','Published on 13 August 2024; extra algorithms remain at different standardization stages.');
 const data=[['FIPS 203','ML-KEM','Key encapsulation','Module lattices',C.blue,C.pblue],
 ['FIPS 204','ML-DSA','Digital signatures','Module lattices',C.teal,C.pteal],
 ['FIPS 205','SLH-DSA','Digital signatures','Hash-based trees',C.gold,C.pgold]];
 data.forEach((r,i)=>{
   let y=2.02+i*1.36;rectangle(s,.89,y,11.45,1.16,r[5]);
   txt(s,r[0],1.13,y+.23,2.01,.36,17,r[4],true);
   txt(s,r[1],3.20,y+.22,2.13,.42,20,C.navy,true);
   txt(s,r[2],5.44,y+.17,3.35,.54,15,C.ink);
   txt(s,r[3],9.21,y+.18,2.69,.52,13,r[4],true);
 });
 pill(s,'FIPS 206 / FN-DSA: IN DEVELOPMENT',.91,6.34,5.15,C.red,C.pred);
 pill(s,'HQC: SELECTED FOR STANDARDIZATION',6.25,6.34,6.12,C.teal,C.pteal);
 notes(s,'Correct roles: ML-KEM is a KEM, not direct bulk encryption. ML-DSA and SLH-DSA are digital signatures, not ciphers. FN-DSA (Falcon-derived) was still under development, and HQC was selected in March 2025 as an additional KEM for future standardization as of November 2026.',
 ['https://csrc.nist.gov/Projects/post-quantum-cryptography/post-quantum-cryptography-standardization','https://www.nist.gov/news-events/news/2025/03/nist-pqc-standardization-process-hqc-announced-4th-round-selection']);
}
// Extra: lattice encryption intuition before full KEM protocol
{
 const s=base('04  /  Standards','Why does noisy lattice decryption work?','Simplified K-PKE algebra underneath ML-KEM: honest parties cancel structured terms.');
 card(s,.83,1.93,3.35,3.82,'PUBLIC KEY','Create t = A*s + e.\nA and t are public; s stays hidden.\nErrors make secret recovery hard.',C.blue,C.pblue);
 math(s,'mlkem_pke',4.42,2.10,7.70,1.59);
 rectangle(s,4.45,3.97,7.72,1.72,C.pteal);
 txt(s,'Receiver subtracts the known secret contribution',4.65,4.19,7.35,.34,16,C.teal,true);
 math(s,'mlkem_dec',4.63,4.73,7.37,.62);
 pill(s,'ILLUSTRATIVE K-PKE ALGEBRA; FIPS 203 ADDS COMPRESSIONS + CCA-SAFE KEM TRANSFORM',.95,6.20,11.47,C.red,C.pred);
 notes(s,'This equation is an explanatory simplification of the underlying K-PKE component, not a verbatim full specification of FIPS 203. The public t=A*s+e contains noise. An encapsulating party constructs u=A^T*r+e1 and v=t^T*r+e2+Encode(m). The decapsulating party cancels s^T*u, leaving an encoded message plus a controlled small error. Correct parameter choices enable decoding. The actual ML-KEM uses polynomial modules, NTT operations, compression, hashing, and a CCA-secure transform; these must never be omitted from implementation.',
 ['https://csrc.nist.gov/pubs/fips/203/final']);
}
// 19 ML-KEM steps
{
 const s=base('04  /  Standards','ML-KEM: create a common secret over a public channel','KeyGen -> Encaps -> Decaps; then use HKDF and AES-GCM for the actual message.');
 math(s,'kem',.70,1.95,11.91,.76);
 const roles=[['BOB','KeyGen()\nPublishes pk; keeps sk'],['ALICE','Encaps(pk)\nGets ct and K'],['BOB','Decaps(sk,ct)\nReconstructs K']];
 roles.forEach((r,i)=>{card(s,.78+i*4.14,3.26,3.64,2.08,r[0],r[1],[C.blue,C.teal,C.blue][i],[C.pblue,C.pteal,C.pblue][i]);if(i<2)arrow(s,4.45+i*4.14,4.07)});
 rectangle(s,1.04,5.81,11.22,.67,C.pgold);
 txt(s,'Both sides have the same K, but peer identity and key authenticity are separate questions.',1.21,5.99,10.86,.31,15,C.ink,true,{align:'center'});
 notes(s,'ML-KEM-768 uses a public/secret keypair and encapsulation ciphertext to derive the shared secret. Bob decapsulates under sk. The KEM shared secret should be fed through appropriate key derivation and authenticated encryption. The public key must be authenticated for actual secure channels.',
 ['https://csrc.nist.gov/pubs/fips/203/final','https://csrc.nist.gov/pubs/sp/800/227/final']);
}
// 20 actual channel
{
 const s=base('04  /  Standards','ML-KEM protects keys; AES-GCM protects payloads','Two distinct primitives working in one secure workflow.');
 const stages=[['ML-KEM-768','KEM ciphertext + 32-byte secret'],['HKDF-SHA256','Derive 256-bit AEAD key'],['AES-256-GCM','Encrypt synthetic document']];
 stages.forEach((a,i)=>{card(s,.81+i*4.13,2.86,3.65,2.36,a[0],a[1],[C.blue,C.teal,C.blue][i],[C.pblue,C.pteal,C.pblue][i]);if(i<2)arrow(s,4.44+i*4.13,3.83)});
 math(s,'kdf',.92,5.60,11.51,.82);
 txt(s,'Tampering is rejected by AES-GCM tag checking; that alone is not a proof of KEM security.',1.13,6.48,11.05,.25,12.1,C.red,true,{align:'center'});
 notes(s,'In the executable source, OpenSSL 3.5.5 performs real FIPS 203 ML-KEM-768 KEM calls, and cryptography performs HKDF and AES-256-GCM. Roundtrip secrets are compared. A ciphertext bit flip triggers InvalidTag at the AEAD layer, not in a generic proof of ML-KEM.',
 ['https://csrc.nist.gov/pubs/fips/203/final','https://csrc.nist.gov/pubs/sp/800/227/final']);
}
// 21 signatures
{
 const s=base('04  /  Standards','ML-DSA: sign a message; verify who signed it','Correct signatures authenticate the signed content when the public key is authenticated.');
 math(s,'signature',1.08,2.07,11.17,.96);
 card(s,.92,3.50,3.61,2.15,'KEY GENERATION','Public verification key; private signing key.',C.blue,C.pblue);
 card(s,4.88,3.50,3.61,2.15,'SIGN','Produce a signature tied to the exact message.',C.teal,C.pteal);
 card(s,8.85,3.50,3.61,2.15,'VERIFY','Valid original -> accept; altered message -> reject.',C.red,C.pred);
 txt(s,'ML-DSA uses module-lattice assumptions, unlike RSA-PSS and ECDSA.',1.17,6.21,10.99,.37,17,C.navy,true,{align:'center'});
 notes(s,'ML-DSA (FIPS 204), derived from CRYSTALS-Dilithium, signs messages using module-lattice-related mathematical assumptions. A signature does not encrypt message data. In source, sign and verification operate on a synthetic document; changing one byte makes verification fail.',
 ['https://csrc.nist.gov/pubs/fips/204/final']);
}
// Extra: ML-DSA core math and secret-leakage prevention
{
 const s=base('04  /  Standards','The mathematical idea behind ML-DSA','A lattice signature uses a masked commitment, a hash challenge, and rejection sampling.');
 math(s,'mldsa_core',.95,1.88,11.49,.73);
 math(s,'mldsa_challenge',.97,2.90,11.45,.72);
 card(s,.80,4.06,3.64,1.86,'SECRET VECTORS','Short secret s1 and s2 are hidden behind the public relation.',C.blue,C.pblue);
 card(s,4.81,4.06,3.64,1.86,'FRESH MASK','Fresh y produces w = A*y, before a challenge c is derived.',C.teal,C.pteal);
 card(s,8.82,4.06,3.64,1.86,'REJECTION','Bounding and hint logic limit secret leakage; verifier recomputes the challenge.',C.red,C.pred);
 txt(s,'Conceptual core only: real FIPS 204 also specifies packing, decomposition, hints, and precise bounds.',1.08,6.30,11.08,.31,12.4,C.red,true,{align:'center'});
 notes(s,'The Dilithium-style construction is not merely Sign(sk,m). A public key encodes t approximately A*s1+s2; a signer forms a masked commitment w=A*y, hashes a message-related commitment into challenge c and returns z=y+c*s1 plus hint material after rejection tests. A verifier reconstructs the challenge using public data and checks bounds. The slide suppresses NTT, rounding, t0/t1, context and rejection details and must not be used as implementation pseudocode.',
 ['https://csrc.nist.gov/pubs/fips/204/final']);
}
// 22 SLH tree
{
 const s=base('04  /  Standards','SLH-DSA: hash-based signatures with tree authentication','A mathematically different signature family gives diversity in the standardization portfolio.');
 const nodes=[{x:5.80,y:2.15,label:'ROOT',c:C.navy},
 {x:3.47,y:3.08,label:'H(L,R)',c:C.blue},{x:8.03,y:3.08,label:'H(L,R)',c:C.blue},
 {x:2.02,y:4.12,label:'LEAF 1',c:C.teal},{x:4.64,y:4.12,label:'LEAF 2',c:C.teal},
 {x:7.04,y:4.12,label:'LEAF 3',c:C.teal},{x:9.65,y:4.12,label:'LEAF 4',c:C.teal}];
 [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].forEach(([a,b])=>line(s,nodes[a].x+.66,nodes[a].y+.39,nodes[b].x+.66,nodes[b].y,C.line,2));
 nodes.forEach((n,i)=>{rectangle(s,n.x,n.y,1.32,.70,i===0?C.navy:(i<3?C.pblue:C.pteal));
 txt(s,n.label,n.x+.06,n.y+.18,1.20,.29,11,i===0?C.white:n.c,true,{align:'center'});});
 pill(s,'Simplified Merkle-tree intuition - not full SLH-DSA internals',2.82,5.73,7.70,C.red,C.pred);
 notes(s,'SLH-DSA FIPS 205 is stateless hash-based. Actual structure includes hypertrees, WOTS+ and FORS, and many more implementation details than the pedagogical tree shown. Its underlying assumptions differ from ML-DSA, improving portfolio diversity.',
 ['https://csrc.nist.gov/pubs/fips/205/final']);
}
// 23 timeline
{
 const s=base('04  /  Standards','Standardization is completed; migration is now the challenge','Precise dates matter: distinguish NIST standards from federal migration milestones.');
 const years=[{yr:'2024',head:'FIPS 203-205',detail:'Three standards finalized',col:C.blue},
 {yr:'2025',head:'SP 800-227 + HQC',detail:'KEM guidance; HQC selected',col:C.teal},
 {yr:'2026',head:'NIST IR 8547',detail:'Final roadmap, 27 Oct',col:C.red},
 {yr:'2030',head:'Federal high-value',detail:'Priority key-establishment target',col:C.gold},
 {yr:'2031',head:'Federal high-value',detail:'Priority digital-signature target',col:C.gold},
 {yr:'2035',head:'Broader NIST phaseout',detail:'Disallow quantum-vulnerable PK',col:C.navy}];
 line(s,.99,3.22,12.24,3.22,C.navy,3.1);
 years.forEach((v,i)=>{const x=.54+i*2.09;dot(s,x+.83,3.13,v.col,.11);
    txt(s,v.yr,x,2.51,1.93,.42,22,v.col,true,{align:'center'});
    txt(s,v.head,x,3.68,1.89,.50,12.1,C.navy,true,{align:'center'});
    txt(s,v.detail,x,4.33,1.91,.70,10.1,C.muted,false,{align:'center',valign:'top'});
 });
 rectangle(s,1.15,5.54,10.96,.70,C.pgold);
 txt(s,'These dates concern U.S. federal policies; they are not automatic legal deadlines for all Vietnamese firms.',1.31,5.72,10.65,.36,13.2,C.ink,true,{align:'center'});
 notes(s,'NIST released FIPS 203,204,205 on 2024-08-13; finalized SP 800-227 on 2025-09-18; selected HQC on 2025-03-11; finalized NIST IR 8547 on 2026-10-27. U.S. federal high-value/high-impact systems have accelerated targets (2030 key establishment, 2031 digital signatures) and broader NIST deprecation/disallowance after 2030/2035. Do not present as a globally binding deadline.',
 ['https://csrc.nist.gov/pubs/ir/8547/final','https://www.nist.gov/news-events/news/2026/10/nist-report-provides-guidelines-transition-post-quantum-cryptography','https://csrc.nist.gov/pubs/sp/800/227/final']);
}
// 24 TLS hybrid
{
 const s=base('04  /  Deployment','Hybrid TLS 1.3: keep compatibility while adding PQC','IETF RFC 10024 (August 2026) specifies X25519MLKEM768 and two other hybrid groups.');
 card(s,.84,2.12,3.55,2.48,'ECDHE SECRET','X25519 traditional shared secret.',C.blue,C.pblue);
 card(s,4.92,2.12,3.55,2.48,'ML-KEM SECRET','Quantum-resistant encapsulated secret.',C.teal,C.pteal);
 arrow(s,4.42,2.95);arrow(s,8.55,2.95);
 card(s,9.05,2.12,3.43,2.48,'TLS KEY SCHEDULE','Standardized combination and key derivation.',C.red,C.pred);
 math(s,'hybrid',1.25,5.03,10.82,.72);
 rectangle(s,1.23,6.12,10.95,.42,C.pgold);
 txt(s,'Repo hybrid demo is illustrative HKDF composition, NOT a full RFC 10024/TLS implementation.',1.33,6.21,10.74,.22,11.9,C.ink,true,{align:'center'});
 notes(s,'RFC 9954 discusses the hybrid key-exchange design for TLS 1.3; RFC 10024 (August 2026) defines X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024. Production TLS requires precise wire encoding, negotiated groups, transcript-binding and authentication; the included source is an educational combiner, not RFC/TLS stack.',
 ['https://www.rfc-editor.org/rfc/rfc10024.html','https://datatracker.ietf.org/doc/html/rfc9954']);
}
// 25 methodology
{
 const s=base('05  /  Experiments','Two evidence classes: quantum toys and real cryptographic primitives','Every graph is generated from a CSV produced by the source code; claims are bounded by its setup.');
 card(s,.84,2.10,5.58,3.56,'A. IDEALIZED QUANTUM SIMULATIONS','RSA: exact modular oracle + inverse QFT, N=15.\nECC: two-register QFT, subgroup order 19.\nGrover: ideal 8-qubit marked-item oracle.\nNo RSA-2048, P-256 or AES quantum break.',C.blue,C.pblue);
 card(s,6.79,2.10,5.58,3.56,'B. REAL SOFTWARE EXECUTION','OpenSSL 3.5.5: ML-KEM, ML-DSA, SLH-DSA.\nPython cryptography: HKDF, AES-GCM.\nWall-clock + serialized byte sizes.\nSynthetic data, never enterprise secrets.',C.teal,C.pteal);
 rectangle(s,1.08,6.05,11.08,.46,C.pgold);
 txt(s,'Reproducible: source -> verified outputs -> raw CSV -> plots -> slide figures',1.31,6.13,10.65,.24,13.2,C.ink,true,{align:'center'});
 notes(s,'Clarify that quantum oracle sampling and real OpenSSL operations are not commensurate measurements. Quantum toy results verify mathematics in a tiny group. PQC benchmark tests real algorithms, but wall-time includes subprocess startup, PEM parsing, disk I/O, and non-isolated CPU effects. Visuals read from actual output CSV.',
 ['https://csrc.nist.gov/pubs/fips/203/final']);
}
// 26 RSA chart
{
 const s=base('05  /  Experiments','Demo A: Shor extracts the period for N = 15','Measured histogram from an exact ideal inverse-QFT simulation, 1,024 shots.');
 chartImg(s,'fig01_rsa_order_qft.png',.66,1.82,12.07,4.43);
 pill(s,'OBSERVED: r = 4  ->  factors (3,5)',.83,6.41,5.41,C.teal,C.pteal);
 pill(s,'TOY ONLY  |  NOT RSA-2048',7.68,6.41,4.49,C.red,C.pred);
 notes(s,'Counting-register peaks at k=0,16,32,48 correspond to 2^6/r=16 for r=4. Rational reconstruction from k/64 followed by gcd recovers factors 3 and 5. The demonstration models ideal modular exponentiation and inverse QFT on a very small N=15. The toy RSA roundtrip also recovers a tiny message. These results were produced by python run_all.py; raw: rsa_qft_histogram.csv.',
 ['https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm']);
}
// 27 ECC heatmap
{
 const s=base('05  /  Experiments','Demo B: quantum Fourier samples reveal a tiny EC secret','Curve E(F17), subgroup order 19; public Q = [7]P.');
 chartImg(s,'fig02_ecc_dlog_qft.png',.69,1.82,12.02,4.57);
 pill(s,'RECOVERED: d = 7',.96,6.43,3.46,C.teal,C.pteal);
 pill(s,'NOT A P-256 ATTACK',8.48,6.43,3.75,C.red,C.pred);
 notes(s,'At an ideal discrete-log oracle, two-register Fourier sampling yields pairs (u,v) obeying v = 7u mod 19. For u != 0, compute d = v/u modulo r; 974/1024 registered shots are recoverable under this seeded simulation. The mathematical group arithmetic is implemented explicitly; source in demos/quantum_toy.py.',
 ['https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 28 Grover chart
{
 const s=base('05  /  Experiments','Demo C: Grover amplifies success probabilities','Measured state-vector samples overlaid on the ideal Grover formula.');
 chartImg(s,'fig03_grover_success.png',.73,1.82,11.96,4.56);
 pill(s,'N = 256  |  IDEAL 8-QUBIT ORACLE',.89,6.42,5.23,C.blue,C.pblue);
 pill(s,'NO AES-256 QUANTUM BREAK',7.73,6.42,4.63,C.red,C.pred);
 notes(s,'The simulation applies an oracle phase flip and the diffusion operator to an 8-qubit 256-element state vector. After 12 iterations, ideal success is approximately 99.995%; experimental sampling with 1,024 shots is shown. This is a standard unstructured oracle, not a reversible AES circuit. Classical distinct-guess success is (t+1)/N. Source: grover_probability.csv.',
 ['https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 29 AES partial key
{
 const s=base('05  /  Experiments','Demo D: real AES, but only 12 unknown key bits','Known-key-exposure demonstration, not a weakness in full AES-128.');
 math(s,'aes_note',1.04,2.01,11.29,.84);
 card(s,.93,3.30,3.65,2.13,'KNOWN-PLAINTEXT','Encrypt one synthetic document with AES-128-GCM.',C.blue,C.pblue);
 card(s,4.84,3.30,3.65,2.13,'RESTRICTED SEARCH','Assume the attacker already knows 116 of 128 key bits.',C.red,C.pred);
 card(s,8.79,3.30,3.65,2.13,'RECOVER','Correct suffix found at candidate 1,733 (1,734 attempts).',C.teal,C.pteal);
 rectangle(s,1.05,5.91,11.14,.70,C.pgold);
 txt(s,'Full AES-128 brute-force still involves up to 2^128 candidates; this example exposes only 12 bits.',1.18,6.04,10.88,.41,14.2,C.ink,true,{align:'center'});
 notes(s,'The source encrypts with a real AES-128-GCM key, but it deliberately gives the attacker 116 known bits, leaving 12 unknown bits. The correct 12-bit suffix is 0x6C5, found after 1734 iterations in the fixed traversal. This is NOT a cryptanalytic break of AES-128; it is an entropy / key exposure lesson. Elapsed runtime is host-dependent.',
 ['https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 30 HNDL observed
{
 const s=base('05  /  Experiments','Demo E: captured toy-ECDH traffic is decrypted later','A self-contained synthetic scenario links Fourier recovery to stored AES-GCM ciphertext.');
 const stages=[['CAPTURE NOW','Public EC points + ciphertext'],['IDEAL FUTURE ORACLE','Recover d=7 in a group of 19'],['DERIVE OLD KEY','Reconstruct shared EC point'],['DECRYPT','Recover original synthetic text']];
 stages.forEach((a,i)=>{card(s,.61+i*3.20,2.45,2.84,2.80,a[0],a[1],[C.blue,C.red,C.gold,C.teal][i],[C.pblue,C.pred,C.pgold,C.pteal][i]);if(i<3)arrow(s,3.48+i*3.20,3.51)});
 rectangle(s,.92,5.73,11.46,.78,C.pgold);
 txt(s,'Recorded ciphertext is vulnerable here ONLY because the demonstration intentionally uses a tiny EC group.',1.15,5.95,10.96,.35,15,C.ink,true,{align:'center'});
 notes(s,'Alice and Bob exchange tiny elliptic curve public points and derive a shared point. The demo uses that point in an educational HKDF-to-AES-GCM workflow, records ciphertext, recovers Alice scalar using ideal toy QFT sampling, reconstructs the old session secret and decrypts. This is NOT a secure ECDH implementation and NOT a production TLS interception.',
 ['https://www.nist.gov/news-events/news/2026/10/nist-report-provides-guidelines-transition-post-quantum-cryptography']);
}
// 31 Real PQC
{
 const s=base('05  /  Experiments','Demo F: the standardized defenses actually execute','OpenSSL 3.5.5 real algorithms, tested with genuine key and signature operations.');
 chartImg(s,'fig09_results_triptych.png',.84,1.78,11.65,3.48);
 pill(s,'ML-KEM: SHARED SECRET MATCH',.88,5.74,4.69,C.teal,C.pteal);
 pill(s,'ML-DSA: TAMPER REJECTED',5.79,5.74,3.67,C.blue,C.pblue);
 pill(s,'SLH-DSA: VERIFIED',9.73,5.74,2.60,C.teal,C.pteal);
 txt(s,'AES-GCM tampering test passed separately; signature tests detect changed signed messages.',1.05,6.39,11.21,.30,13,C.ink,true,{align:'center'});
 notes(s,'The OpenSSL CLI executes ML-KEM-768 (FIPS 203), ML-DSA-65 (FIPS 204), and SLH-DSA-SHA2-128s (FIPS 205) locally. ML-KEM ciphertext is 1088 bytes and shared secret 32 bytes; ML-DSA signature 3309 bytes; SLH-DSA signature 7856 bytes. Correct signatures verify; modifications fail. Values from results/raw/sizes.csv; no statement of FIPS 140 module certification is made.',
 ['https://csrc.nist.gov/pubs/fips/203/final','https://csrc.nist.gov/pubs/fips/204/final','https://csrc.nist.gov/pubs/fips/205/final']);
}
// 32 KEM bench + bytes
{
 const s=base('05  /  Benchmark','Key establishment: time and communication cost','Observed OpenSSL CLI wall clock includes process launch, PEM parse, file I/O.');
 chartImg(s,'fig04_kem_latency.png',.56,1.81,6.20,4.70);
 chartImg(s,'fig07_kem_bytes.png',6.64,1.81,6.20,4.70);
 txt(s,'Do not equate an X25519 derive with a KEM encapsulation or infer TLS handshake latency.',1.17,6.63,10.98,.28,12.2,C.red,true,{align:'center'});
 notes(s,'Both charts come from results/raw/primitive_summary.csv and sizes.csv. X25519 derive versus ML-KEM encapsulate/decapsulate are compared as measured operations, not as identical handshakes. KEM keys and ciphertexts increase byte counts. TLS overhead cannot be directly inferred because negotiation, framing, certificates and signature are excluded.',
 ['https://csrc.nist.gov/pubs/sp/800/227/final']);
}
// 33 Signature benchmark
{
 const s=base('05  /  Benchmark','Signatures: execution time versus artifact size','Different mathematical families have different bandwidth and compute trade-offs.');
 chartImg(s,'fig05_signature_latency.png',.52,1.81,6.24,4.75);
 chartImg(s,'fig06_signature_sizes.png',6.67,1.81,6.20,4.75);
 txt(s,'Log-scale timing on the left; public keys are DER-encoded on the right.',1.17,6.61,11,.29,12.2,C.red,true,{align:'center'});
 notes(s,'Observed cryptographic operations: RSA-PSS 2048, ECDSA P-256, ML-DSA-65, SLH-DSA-SHA2-128s. SLH signing can be significantly more expensive than ML-DSA in this run, while signature size differs substantially. All sample measures include OpenSSL CLI subprocess overhead; the curves are not processor-cycle benchmarks and do not establish across-security-level dominance.',
 ['https://csrc.nist.gov/pubs/fips/204/final','https://csrc.nist.gov/pubs/fips/205/final']);
}
// 34 AES throughput
{
 const s=base('05  /  Benchmark','AES remains the bulk-encryption workhorse','The PQC transition usually changes key establishment, not every encrypted payload algorithm.');
 chartImg(s,'fig08_aes_throughput.png',.73,1.82,11.94,4.60);
 rectangle(s,.89,6.42,11.51,.38,C.pgold);
 txt(s,'AES benchmark uses a separate in-process Python binding, so do not compare latency directly with OpenSSL CLI charts.',1.05,6.48,11.16,.24,11.7,C.ink,true,{align:'center'});
 notes(s,'The throughput benchmark measures 1 MiB synthetic payload AES-128-GCM vs AES-256-GCM using the Python cryptography binding, 30 samples per case, fresh nonce per encryption. Bars are median MiB/s; error spans show p5-p95. Hardware acceleration and host load strongly affect throughput. This chart does not measure Grover advantage.',
 ['https://csrc.nist.gov/projects/post-quantum-cryptography']);
}
// 35 migration
{
 const s=base('06  /  Implementation','How a real organization should migrate','Risk-prioritized, interoperable, testable - not just replace one function call.');
 const steps=[['01','DISCOVER','Inventory TLS, PKI, SSH, VPN, firmware signing and libraries'],
 ['02','PRIORITIZE','Long-lived secrets and exposed key-establishment paths first'],
 ['03','PILOT','Test ML-KEM / hybrid TLS and ML-DSA/SLH-DSA use cases'],
 ['04','MEASURE','Certificates, packets, CPU, memory, compatibility, rollback'],
 ['05','DEPLOY','Phase rollout, monitor failures, update crypto agility plan']];
 steps.forEach((v,i)=>{
   const y=1.89+i*.90;rectangle(s,.80,y,11.65,.76,i%2?C.white:C.light,C.line);
   rectangle(s,1.03,y+.11,.57,.51,i===1?C.red:(i===4?C.teal:C.navy));
   txt(s,v[0],1.11,y+.20,.42,.21,12,C.white,true,{align:'center'});
   txt(s,v[1],1.89,y+.17,2.35,.35,15,C.navy,true);
   txt(s,v[2],4.20,y+.12,7.92,.45,12.1,C.ink);
 });
 notes(s,'A practical PQC transition requires cryptographic inventory, dependency analysis, risk ranking, crypto agility, interoperability testing, certificate format and protocol support, hardware resources, rollback, implementation review and governance. U.S. NIST transition guidance can inform organizations globally, but legal deadlines depend on jurisdiction.',
 ['https://csrc.nist.gov/pubs/ir/8547/final','https://www.rfc-editor.org/rfc/rfc10024.html']);
}
// 36 caveats and takeaways
{
 const s=base('06  /  Conclusion','What these experiments prove - and what they do not','A credible PQC talk needs a boundary between evidence, theory, and deployment.');
 card(s,.84,1.97,5.59,3.75,'SUPPORTED','Ideal Fourier sampling retrieves tiny toy secrets.\nGrover amplification matches the ideal formula.\nReal ML-KEM/ML-DSA/SLH-DSA operations work.\nMeasured sizes and local timing are reproducible.',C.teal,C.pteal);
 card(s,6.80,1.97,5.59,3.75,'NOT SUPPORTED','No working RSA-2048, ECC P-256 or AES-256 break.\nNo fault-tolerant qubit count/cost estimate.\nNo measured TLS latency or production security proof.\nNo universal ranking from single-host benchmarks.',C.red,C.pred);
 rectangle(s,1.18,6.03,11.04,.55,C.navy);
 txt(s,'Move early, migrate by function, and validate every cryptographic boundary.',1.44,6.18,10.54,.27,15,C.white,true,{align:'center'});
 notes(s,'This slide explicitly discloses limitations: toy models are not realistic attack costs, local CLI operations include spawn and file overhead, and no production TLS handshake or authenticated enrollment was implemented. The meaningful result is why security assumptions change and how real PQC operations can be evaluated.',
 ['https://csrc.nist.gov/pubs/ir/8547/final']);
}
// 37 sources
{
 const s=base('Source notes','Primary standards and technical references','Every slide also includes source links and presenter notes in PowerPoint notes.');
 const refs=[
  ['NIST FIPS 203','https://csrc.nist.gov/pubs/fips/203/final'],
  ['NIST FIPS 204','https://csrc.nist.gov/pubs/fips/204/final'],
  ['NIST FIPS 205','https://csrc.nist.gov/pubs/fips/205/final'],
  ['NIST SP 800-227 (2025)','https://csrc.nist.gov/pubs/sp/800/227/final'],
  ['NIST IR 8547 final (2026)','https://csrc.nist.gov/pubs/ir/8547/final'],
  ['IETF RFC 10024 (2026)','https://www.rfc-editor.org/rfc/rfc10024.html'],
  ['IETF RFC 9954 (2026)','https://www.rfc-editor.org/rfc/rfc9954.html'],
  ['IBM Shor tutorial','https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm']
 ];
 refs.forEach((r,i)=>{
   let col=i<4?0:1,j=i%4,x=.76+col*6.19,y=1.93+j*1.10;
   rectangle(s,x,y,5.96,.91,i%2?C.white:C.light,C.line);
   txt(s,r[0],x+.17,y+.08,5.47,.29,14.5,C.navy,true);
   txt(s,r[1],x+.17,y+.45,5.48,.23,9.8,C.blue,false);
 });
 notes(s,'References are official NIST publications, IETF RFCs, and an IBM educational tutorial. Check version dates before reusing for a later workshop; this deck is current through November 23, 2026.');
}
// 38 Thank-you
{
 slideNumber++;const s=P.addSlide();s.background={color:C.white};
 s.addShape(SHAPE.rect,{x:8.78,y:0,w:4.55,h:SH,fill:{color:C.navy},line:{color:C.navy}});
 txt(s,'THANK YOU',.93,2.18,7.46,1.07,48,C.navy,true);
 txt(s,'Questions & discussion',.96,3.53,7.23,.57,24,C.blue);
 line(s,.95,4.38,7.83,4.38,C.line,1.3);
 txt(s,'Bui Phi Hung',.97,4.83,6.96,.55,23,C.navy,true);
 txt(s,'President of Science & Technology Club',.97,5.40,7.02,.43,15,C.muted);
 txt(s,'Quantum Intelligence Algorithms Laboratory  |  PTIT HCMC',.98,6.12,7.42,.40,12,C.ink);
 fitimg(s,logo,9.34,1.78,1.48,1.92);fitimg(s,club,11.27,1.83,1.44,1.57);
 txt(s,'Source code + raw CSV + plots\nare included in the repository archive.',9.25,5.20,3.72,.97,16,C.white,false,{align:'center'});
 notes(s,'End with three points: the threat is primarily to vulnerable public-key mathematics; PQC changes the assumptions and can be integrated into conventional software; reproducible demonstrations must not be confused with breaking deployed RSA, ECC or AES. Invite questions about mathematical details, the experiment setup, and transition priorities.');
}
// Make sure no visual elements exceed page bounds.
P._slides.forEach((s,i)=>{try{warnIfSlideElementsOutOfBounds(s,P)}catch(err){console.log('Bounds diagnostic',i+1,err.message)}});
const dest=process.argv[2]||path.join(__dirname,'PQC_Quantum_Security_PTIT_2026.pptx');
P.writeFile({fileName:dest});
console.log('Wrote',P._slides.length,'slides to',dest);
