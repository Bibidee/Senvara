// Syntax-transpile dependency-free client modules to exercise their logic without an app server.
// This is NOT a Next.js build or an SDK typecheck.
const fs=require('node:fs');
const path=require('node:path');
let ts;
try {ts=require('../frontend/node_modules/typescript');}
catch {ts=require('typescript');}
const root=path.resolve(__dirname,'..');
const input=['constants','validation','wallet-errors','format','tx-store','chain','transactions'];
fs.mkdirSync(path.join(root,'.test-dist'),{recursive:true});
for(const name of input){
  const file=path.join(root,'frontend/lib',name+'.ts');
  const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
  const issues=output.diagnostics||[];
  if(issues.length){console.error(issues.map(e=>ts.flattenDiagnosticMessageText(e.messageText,'\n')).join('\n'));process.exit(1)}
  fs.writeFileSync(path.join(root,'.test-dist',name+'.js'),output.outputText);
}
console.log(`Compiled ${input.length} client logic files for isolated tests.`);
