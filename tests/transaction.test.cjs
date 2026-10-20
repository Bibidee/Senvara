const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const Module=require('node:module');
// Fixture-only contract address, never configured in the application.
process.env.NEXT_PUBLIC_SENVARA_CONTRACT='0x9668263921d88c1deaB8DA5A416a65D562cB4187';
const crypto=require('node:crypto');
const originalLoad=Module._load;
const sampleHash='0x'+'f'.repeat(64);
const consensusAddress='0x'+'c'.repeat(40);
const consensusAbi=[{type:'function',name:'addTransaction',stateMutability:'nonpayable',inputs:[
  {name:'sender',type:'address'},{name:'recipient',type:'address'},{name:'validators',type:'uint256'},
  {name:'rotations',type:'uint256'},{name:'data',type:'bytes'}],outputs:[]}];
const sdk={createClient:()=>({initializeConsensusSmartContract:async()=>{},readContract:async()=>{},getTransaction:async()=>({})}),
  abi:{calldata:{encode:value=>new Uint8Array(Buffer.from(JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v)))},transactions:{serialize:()=> '0x1234'}}};
Module._load=function(request,parent,isMain){
  if(request==='genlayer-js')return sdk;
  if(request==='genlayer-js/chains')return {simulator:{id:61999}};
  if(request==='genlayer-js/types')return {TransactionStatus:{FINALIZED:7,ACCEPTED:6}};
  return originalLoad.call(this,request,parent,isMain);
};
const chain=require('../.test-dist/chain.js');
const {classifyTransaction,validateDossier}=chain;
const store=require('../.test-dist/tx-store.js');
const transactions=require('../.test-dist/transactions.js');
const map=new Map();
global.window={
  crypto:crypto.webcrypto,
  localStorage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)},
  dispatchEvent:()=>{},
};
global.Event=class Event {constructor(name){this.type=name}};
const actor='0x'+'1'.repeat(40);
let lastWalletRequest;
const participant={provider:{request:async request=>{lastWalletRequest=request;return request.method==='eth_sendTransaction'?sampleHash:undefined}},walletId:'test-wallet',name:'Mock',account:actor,chainId:61999,epoch:1};
const check=async()=>{};
global.fetch=async()=>({ok:true,status:200,json:async()=>({result:{address:consensusAddress,abi:consensusAbi}})});
const finalized={statusName:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'SUCCESS',result:{status:'return'}}]}};
const failed={statusName:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'ERROR',error:'revert'}]}};
const nonce='a'.repeat(64);
const nonceFingerprint=crypto.createHash('sha256').update(nonce).digest('hex');
const reviewer='0x'+'2'.repeat(40);
const dossier=(overrides={})=>({id:1,proposer:actor,reviewer,assertion:'The versioned documentation describes how retries are handled safely.',repository:'acme/public-tool',commit:'a'.repeat(40),primary_path:'docs/retries.md',opposing_path:'',reviewer_note:'',created_at:100,response_deadline:200,review_deadline:0,updated_at:100,last_attempt_at:0,last_attempt_by:'',last_attempt_nonce_sha256:'',attempts:0,status:'AWAITING_REVIEWER',decision:'',last_reason:'',...overrides});
let evaluationTx;

test('ACCEPTED is provisional, never final',()=>{
  assert.equal(classifyTransaction({statusName:'ACCEPTED'}).phase,'ACCEPTED_PROVISIONAL');
  assert.equal(classifyTransaction({status:6}).phase,'ACCEPTED_PROVISIONAL');
});
test('FINALIZED with execution SUCCESS requires canonical verification',()=>{
  assert.equal(classifyTransaction(finalized).phase,'VERIFYING');
});
test('execution ERROR never becomes successful finality',()=>{
  assert.equal(classifyTransaction(failed).phase,'FAILED');
});
test('missing execution metadata fails closed',()=>{
  assert.equal(classifyTransaction({statusName:'FINALIZED'}).phase,'FINALIZED_UNVERIFIED');
});
test('undetermined, canceled and unexpected responses are distinguished',()=>{
  assert.equal(classifyTransaction({statusName:'UNDETERMINED'}).phase,'UNDETERMINED');
  assert.equal(classifyTransaction({statusName:'CANCELED'}).phase,'FAILED');
  assert.equal(classifyTransaction({statusName:'SOMETHING_ELSE'}).phase,'UNKNOWN');
});
test('submitted hash persists and blocks duplicate writes',async()=>{
  map.clear();
  chain.dossierById=async()=>dossier({id:1});
  const tx=await transactions.sendAction(participant,check,'withdraw',[1n],1);
  assert.equal(tx.hash,sampleHash);
  assert.equal(lastWalletRequest.method,'eth_sendTransaction');
  assert.equal(lastWalletRequest.params[0].to,consensusAddress);
  assert.equal(store.readLocalTransactions().length,1);
  await assert.rejects(()=>transactions.sendAction(participant,check,'withdraw',[1n],1),/already has a pending/i);
});
test('canonical success releases the exact action lock',async()=>{
  map.clear();
  chain.transactionState=async()=>({phase:'VERIFYING',description:'Finalized and successful'});
  let reads=0;
  chain.dossierById=async()=>reads++===0?dossier({id:2,updated_at:10}):dossier({id:2,status:'WITHDRAWN',updated_at:20});
  const tx=await transactions.sendAction(participant,check,'withdraw',[2n],2);
  const result=await transactions.refreshStoredTransaction(tx);
  assert.equal(result.phase,'VERIFIED');
  assert.equal(store.getIntent(tx.id),null);
});
test('irrelevant canonical status never releases the write guard',async()=>{
  map.clear();
  chain.transactionState=async()=>({phase:'VERIFYING',description:'Finalized and successful'});
  let reads=0;
  chain.dossierById=async()=>reads++===0?dossier({id:3,updated_at:10}):dossier({id:3,updated_at:20});
  const tx=await transactions.sendAction(participant,check,'withdraw',[3n],3);
  const result=await transactions.refreshStoredTransaction(tx);
  assert.equal(result.phase,'FINALIZED_UNVERIFIED');
  assert.notEqual(store.getIntent(tx.id),null);
});
test('evaluation readback must advance attempt count',async()=>{
  map.clear();
  chain.transactionState=async()=>({phase:'VERIFYING',description:'Finalized and successful'});
  let reads=0;
  chain.dossierById=async()=>reads++===0?dossier({id:4,status:'READY_FOR_REVIEW',opposing_path:'docs/counter.md',review_deadline:400,attempts:1,updated_at:100}):dossier({id:4,status:'DECIDED',opposing_path:'docs/counter.md',review_deadline:400,attempts:2,last_attempt_by:actor,last_attempt_at:200,last_attempt_nonce_sha256:nonceFingerprint,updated_at:200,decision:'SUPPORTED'});
  chain.observationById=async()=>({kind:'EVALUATED',primary:'SUPPORTS',opposing:'IRRELEVANT',decision:'SUPPORTED',primary_quote:'credible quote',opposing_quote:'',primary_sha256:'a'.repeat(64),opposing_sha256:'b'.repeat(64),signed_payload_sha256:'c'.repeat(64)});
  evaluationTx=await transactions.sendAction(participant,check,'evaluate',[4n,nonce],4);
  const result=await transactions.refreshStoredTransaction(evaluationTx);
  assert.equal(result.phase,'VERIFIED');
  assert.equal(result.expectedAttempt,2);
});
test('historical evaluation attempt cannot be attributed without an effect identifier',async()=>{
  chain.dossierById=async()=>({id:4,status:'DECIDED',attempts:2,proposer:actor,last_attempt_by:actor,last_attempt_at:200,updated_at:200,decision:'SUPPORTED'});
  const historicalTx={...evaluationTx,expectedPreviousStatus:'READY_FOR_REVIEW',expectedPreviousUpdatedAt:100};
  store.saveActionArgs(historicalTx.id,[4n,nonce]);
  const result=await transactions.refreshStoredTransaction(historicalTx);
  assert.equal(result.phase,'FINALIZED_UNVERIFIED');
});
test('retryable evaluation finality is reconciled without consuming the semantic budget',async()=>{
  map.clear();
  chain.transactionState=async()=>({phase:'VERIFYING',description:'Finalized and successful'});
  let reads=0;
  chain.dossierById=async()=>reads++===0?dossier({id:6,status:'READY_FOR_REVIEW',opposing_path:'docs/counter.md',review_deadline:400,updated_at:100}):dossier({id:6,status:'READY_FOR_REVIEW',opposing_path:'docs/counter.md',review_deadline:400,updated_at:200,last_attempt_at:200,last_attempt_by:actor,last_attempt_nonce_sha256:nonceFingerprint,last_reason:'JUDGMENT_UNAVAILABLE'});
  const tx=await transactions.sendAction(participant,check,'evaluate',[6n,nonce],6);
  const result=await transactions.refreshStoredTransaction(tx);
  assert.equal(result.phase,'RETRYABLE');
  assert.match(result.message,/No documentary verdict/);
  assert.equal(store.getEvaluationGuard(6,actor),null);
  assert.equal(store.getIntent(tx.id),null);
});
test('evaluation retry is blocked during the canonical cooldown',async()=>{
  map.clear();
  chain.dossierById=async()=>dossier({id:7,status:'READY_FOR_REVIEW',opposing_path:'docs/counter.md',review_deadline:400,last_attempt_at:Math.floor(Date.now()/1000)-1,last_attempt_by:actor,last_attempt_nonce_sha256:nonceFingerprint,last_reason:'JUDGMENT_UNAVAILABLE',updated_at:200});
  let walletCalls=0;
  const wallet={...participant,provider:{request:async request=>{walletCalls++;return participant.provider.request(request)}}};
  await assert.rejects(()=>transactions.sendAction(wallet,check,'evaluate',[7n,'b'.repeat(64)],7),/cooldown active/i);
  assert.equal(walletCalls,0);
});
test('evaluation retry after cooldown can use a fresh nonce',async()=>{
  map.clear();
  chain.dossierById=async()=>dossier({id:8,status:'READY_FOR_REVIEW',opposing_path:'docs/counter.md',review_deadline:400,last_attempt_at:1,last_attempt_by:actor,last_attempt_nonce_sha256:nonceFingerprint,last_reason:'JUDGMENT_UNAVAILABLE',updated_at:200});
  const tx=await transactions.sendAction(participant,check,'evaluate',[8n,'b'.repeat(64)],8);
  assert.equal(tx.expectedAttempt,1);
  assert.equal(tx.phase,'SUBMITTED');
});
test('conflicting actor or nonce fingerprint stays unverified and retains the guard',async()=>{
  map.clear();
  chain.transactionState=async()=>({phase:'VERIFYING',description:'Finalized and successful'});
  let reads=0;
  chain.dossierById=async()=>reads++===0?dossier({id:9,status:'READY_FOR_REVIEW',opposing_path:'docs/counter.md',review_deadline:400,updated_at:100}):dossier({id:9,status:'DECIDED',opposing_path:'docs/counter.md',review_deadline:400,attempts:1,last_attempt_by:reviewer,last_attempt_at:200,last_attempt_nonce_sha256:'d'.repeat(64),updated_at:200,decision:'SUPPORTED'});
  const tx=await transactions.sendAction(participant,check,'evaluate',[9n,nonce],9);
  const result=await transactions.refreshStoredTransaction(tx);
  assert.equal(result.phase,'FINALIZED_UNVERIFIED');
  assert.notEqual(store.getEvaluationGuard(9,actor),null);
});
test('close_expired reconciliation requires the expected pre-state transition',async()=>{
  map.clear();
  chain.transactionState=async()=>({phase:'VERIFYING',description:'Finalized and successful'});
  let reads=0;
  chain.dossierById=async()=>reads++===0?dossier({id:10,updated_at:100}):dossier({id:10,status:'EXPIRED_UNANSWERED',updated_at:200});
  const tx=await transactions.sendAction(participant,check,'close_expired',[10n],10);
  const result=await transactions.refreshStoredTransaction(tx);
  assert.equal(result.phase,'VERIFIED');
});
test('record-level evaluation guard blocks a fresh nonce while the first request is unresolved',async()=>{
  map.clear();
  chain.dossierById=async()=>({id:5,status:'READY_FOR_REVIEW',attempts:0,proposer:actor,reviewer:'0x'+'2'.repeat(40),last_attempt_by:'',last_attempt_at:0});
  const first=await transactions.sendAction(participant,check,'evaluate',[5n,'a'.repeat(64)],5);
  await assert.rejects(()=>transactions.sendAction(participant,check,'evaluate',[5n,'b'.repeat(64)],5),/record already has a pending/i);
  assert.equal(store.getEvaluationGuard(5,actor)?.txId,first.id);
  store.clearEvaluationGuard(5,actor,first.id);
});
test('proposal reconciliation searches older bounded pages and requires the immutable tuple',async()=>{
  map.clear();
  chain.transactionState=async()=>({phase:'VERIFYING',description:'Finalized and successful'});
  chain.listDossiers=async(offset)=>({total:41,ids:offset===0?[41,40]:offset===20?[21,20]:[1]});
  chain.dossierById=async(id)=>({id,proposer:actor,reviewer:'0x'+'2'.repeat(40),assertion:id===1?'A precise documentary assertion that is long enough.':'other',repository:'acme/public-tool',commit:'a'.repeat(40),primary_path:'docs/retries.md',opposing_path:'',reviewer_note:'',status:'AWAITING_REVIEWER',updated_at:1,created_at:1,attempts:0,last_attempt_by:'',last_attempt_at:0,decision:'',last_reason:''});
  const tx=await transactions.sendAction(participant,check,'propose',['A precise documentary assertion that is long enough.','acme/public-tool','a'.repeat(40),'docs/retries.md','0x'+'2'.repeat(40),86400n]);
  const result=await transactions.refreshStoredTransaction(tx);
  assert.equal(result.phase,'VERIFIED');
  assert.equal(result.recordId,1);
});

test('v0.2 dossier validation accepts fresh and post-response state',()=>{
  assert.doesNotThrow(()=>validateDossier(dossier(),1,'0.2.0'));
  assert.doesNotThrow(()=>validateDossier(dossier({status:'READY_FOR_REVIEW',opposing_path:'docs/counter.md',review_deadline:300,updated_at:200}),1,'0.2.0'));
});
test('v0.2 dossier validation accepts retryable and conclusive evaluation state',()=>{
  assert.doesNotThrow(()=>validateDossier(dossier({status:'READY_FOR_REVIEW',opposing_path:'docs/counter.md',review_deadline:300,updated_at:200,last_attempt_at:200,last_attempt_by:actor,last_attempt_nonce_sha256:nonceFingerprint,last_reason:'JUDGMENT_UNAVAILABLE'}),1,'0.2.0'));
  assert.doesNotThrow(()=>validateDossier(dossier({status:'DECIDED',opposing_path:'docs/counter.md',review_deadline:300,updated_at:200,last_attempt_at:200,last_attempt_by:actor,last_attempt_nonce_sha256:nonceFingerprint,attempts:1,decision:'SUPPORTED'}),1,'0.2.0'));
});
test('dossier validation rejects malformed or inconsistent attempt identity',()=>{
  assert.throws(()=>validateDossier(dossier({last_attempt_nonce_sha256:'not-a-fingerprint'}),1,'0.2.0'),/nonce fingerprint/i);
  assert.throws(()=>validateDossier(dossier({status:'DECIDED',opposing_path:'docs/counter.md',review_deadline:300,updated_at:200,attempts:0,decision:'SUPPORTED'}),1,'0.2.0'),/attempt identity/i);
  assert.throws(()=>validateDossier(dossier({status:'READY_FOR_REVIEW',opposing_path:'docs/counter.md',review_deadline:300,updated_at:200,last_attempt_at:200,last_attempt_by:reviewer,last_attempt_nonce_sha256:nonceFingerprint,last_reason:'JUDGMENT_UNAVAILABLE',proposer:reviewer}),1,'0.2.0'),/participant wallets|named participant/i);
  assert.throws(()=>validateDossier(dossier({attempts:4}),1,'0.2.0'),/attempt count/i);
});
test('historical v0.1 dossiers omit the candidate nonce field',()=>{
  const legacy=dossier();
  delete legacy.last_attempt_nonce_sha256;
  assert.doesNotThrow(()=>validateDossier(legacy,1,'0.1.0'));
  assert.throws(()=>validateDossier(dossier(),1,'0.1.0'),/unexpected candidate-only/i);
});
