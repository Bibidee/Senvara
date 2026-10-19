const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prepareProposal,validPath}=require('../.test-dist/validation.js');
const {chainNumber,validAccount,walletError}=require('../.test-dist/wallet-errors.js');
const valid={assertion:'The versioned documentation describes how retries are handled safely.',repository:'Acme/Public-Tool',commit:'a'.repeat(40),primary:'docs/retries.md',reviewer:'0x'+'1'.repeat(40),days:3};
test('canonical proposal arguments bind full revision and explicit reviewer',()=>{
  const data=prepareProposal(valid).args;
  assert.equal(data[1],'acme/public-tool');assert.equal(data[2],'a'.repeat(40));assert.equal(data[5],259200n);
});
test('front-end refuses branch names and short SHAs',()=>{
  for (const commit of ['main','abc123','b'.repeat(39)]) assert.throws(()=>prepareProposal({...valid,commit}),/40-character/);
});
test('front-end refuses invalid repository identities',()=>{
  for(const repository of ['file:///private','owner/..','owner repo/name','https://github.com/a/b'])assert.throws(()=>prepareProposal({...valid,repository}));
});
test('front-end excludes path traversal and encoded URL components',()=>{
  for(const path of ['../secret','docs/../secret','docs/%2f/private','https://host/file','docs//file','/absolute']) assert.throws(()=>validPath(path));
  assert.equal(validPath('docs/valid-file.md'),'docs/valid-file.md');
});
test('chain parser rejects malformed wallet responses',()=>{
  assert.equal(chainNumber('0xf22f'),61999);
  for(const raw of ['61999','0xzz','',undefined])assert.throws(()=>chainNumber(raw));
});
test('wallet account requires complete nonzero address',()=>{
  assert.equal(validAccount('0x'+'2'.repeat(40)),true);
  assert.equal(validAccount('0x'+'0'.repeat(40)),false);
  assert.equal(validAccount('0x1234'),false);
});
test('wallet error distinguishes signature rejection from chain setup and concurrent prompt',()=>{
  assert.match(walletError({code:4001}),/rejected/i);
  assert.match(walletError({code:4902}),/not configured/i);
  assert.match(walletError({code:-32002}),/already open/i);
});
