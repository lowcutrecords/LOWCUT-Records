import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.resolve(root,'_site');
// A fixed, verified child directory is the only recursively replaced target.
if(path.dirname(output)!==path.resolve(root)||path.basename(output)!=='_site')throw new Error('Invalid artifact directory');
await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output);
const pages=JSON.parse(await fs.readFile(path.join(root,'data/generated-pages.json'),'utf8'));
const publicFiles=['index.html','styles.css','detail.css','catalogue-ui.js','cursor.css','cursor.js','site-ui.js','transitions.css','sitemap.xml',...pages];
for(const file of publicFiles){
  if(file.includes('..')||path.isAbsolute(file))throw new Error('Invalid public path');
  const target=path.join(output,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(root,file),target);
}
await fs.cp(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
await fs.writeFile(path.join(output,'.nojekyll'),'');
const hash=crypto.createHash('sha256');
async function walk(dir){
  for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    const file=path.join(dir,entry.name);
    if(entry.isSymbolicLink())throw new Error('Symlink not allowed in public artifact');
    if(entry.isDirectory())await walk(file);else{hash.update(path.relative(output,file).split(path.sep).join('/'));hash.update(await fs.readFile(file));}
  }
}
await walk(output);const fingerprint=hash.digest('hex');
await fs.writeFile(path.join(output,'catalogue-state.json'),JSON.stringify({fingerprint})+'\n');
let changed=true;
if(process.argv.includes('--compare-live')){
  try{
    const response=await fetch('https://lowcutrecords.github.io/LOWCUT-Records/catalogue-state.json',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});
    if(response.ok)changed=(await response.json()).fingerprint!==fingerprint;
  }catch{console.warn('Could not compare published fingerprint; treating artifact as changed.');}
}
if(process.env.GITHUB_OUTPUT)await fs.appendFile(process.env.GITHUB_OUTPUT,`changed=${changed}\n`);
console.log(`Public-only artifact prepared. changed=${changed}; no upload or deployment performed.`);
