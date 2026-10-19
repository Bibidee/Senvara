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
const {classifyTransaction}=chain;
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
  chain.dossierById=async()=>({id:2,status:'WITHDRAWN',proposer:actor,reviewer:'0x'+'2'.repeat(40),attempts:0,updated_at:Math.floor(Date.now()/1000)});
  const tx=await transactions.sendAction(participant,check,'withdraw',[2n],2);
  const result=await transactions.refreshStoredTransaction(tx);
  assert.equal(result.phase,'VERIFIED');
  assert.equal(store.getIntent(tx.id),null);
});
test('irrelevant canonical status never releases the write guard',async()=>{
  map.clear();
  chain.transactionState=async()=>({phase:'VERIFYING',description:'Finalized and successful'});
  chain.dossierById=async()=>({id:3,status:'AWAITING_REVIEWER',proposer:actor,reviewer:'0x'+'2'.repeat(40),attempts:0,updated_at:Math.floor(Date.now()/1000)});
  const tx=await transactions.sendAction(participant,check,'withdraw',[3n],3);
  const result=await transactions.refreshStoredTransaction(tx);
  assert.equal(result.phase,'FINALIZED_UNVERIFIED');
  assert.notEqual(store.getIntent(tx.id),null);
});
test('evaluation readback must advance attempt count',async()=>{
  map.clear();
  chain.transactionState=async()=>({phase:'VERIFYING',description:'Finalized and successful'});
  chain.dossierById=async()=>({id:4,status:'READY_FOR_REVIEW',proposer:actor,reviewer:'0x'+'2'.repeat(40),attempts:1,last_attempt_by:actor,last_attempt_at:Math.floor(Date.now()/1000)});
  const tx=await transactions.sendAction(participant,check,'evaluate',[4n],4);
  const result=await transactions.refreshStoredTransaction(tx);
  assert.equal(result.phase,'FINALIZED_UNVERIFIED');
  assert.equal(result.expectedAttempt,2);
});
test('historical evaluation attempt cannot be attributed without an effect identifier',async()=>{
  const tx=store.readLocalTransactions()[0];
  chain.dossierById=async()=>({id:4,status:'DECIDED',attempts:2,proposer:actor,last_attempt_by:actor,last_attempt_at:Math.floor(Date.now()/1000)});
  const result=await transactions.refreshStoredTransaction(tx);
  assert.equal(result.phase,'FINALIZED_UNVERIFIED');
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
