import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const roots=[root];
if(process.argv.includes('--portal'))roots.push(path.resolve(root,'../LOWCUT-Records-Portal'));
const all=[];
for(const directory of roots){
  const manifestFile=path.join(directory,'data/image-variants.json');let previous={};
  try{previous=JSON.parse(await fs.readFile(manifestFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  const files=[];
  async function scan(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){
    if(['.git','node_modules','_site','tests','review'].includes(entry.name))continue;
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())await scan(file);else if(/\.(png|jpe?g)$/i.test(entry.name))files.push(file);
  }}
  await scan(directory);const manifest={};
  // Bounded concurrency avoids decoding the full high-resolution catalogue at once.
  for(let start=0;start<files.length;start+=2)await Promise.all(files.slice(start,start+2).map(async file=>{
    const relative=path.relative(directory,file).split(path.sep).join('/');
    const output=file.replace(/\.(png|jpe?g)$/i,'.webp');
    const webpPath=path.relative(directory,output).split(path.sep).join('/');
    const source=await fs.readFile(file),sourceHash=crypto.createHash('sha256').update(source).digest('hex');
    const lossless=/(?:logo|favicon|bichitostv)/i.test(path.basename(file));
    const recipe=lossless?'webp-lossless-effort6':'webp-q90-alpha100-effort6';
    let row=previous[relative];
    if(!row||row.sourceHash!==sourceHash||row.recipe!==recipe||!(await fs.stat(output).catch(()=>null))){
      const sourceMeta=await sharp(source).metadata();
      const result=await sharp(source).webp({quality:90,alphaQuality:100,lossless,effort:6}).toFile(output);
      const check=await sharp(output).metadata();
      const needsAlpha=sourceMeta.hasAlpha && !(await sharp(source).stats()).isOpaque;
      if(check.format!=='webp'||check.width!==sourceMeta.width||check.height!==sourceMeta.height||(needsAlpha&&!check.hasAlpha))throw new Error(`Image validation failed: ${relative}`);
      row={path:webpPath,width:check.width,height:check.height,bytes:result.size,sourceBytes:source.length,sourceHash,recipe};
    }
    manifest[relative]=row;all.push({project:path.basename(directory),original:relative,...row});
  }));
  await fs.mkdir(path.dirname(manifestFile),{recursive:true});
  await fs.writeFile(manifestFile,JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a],[b])=>a.localeCompare(b))),null,2)+'\n');
}
const before=all.reduce((s,r)=>s+r.sourceBytes,0),after=all.reduce((s,r)=>s+r.bytes,0);
console.log(JSON.stringify({images:all.length,originalBytes:before,webpBytes:after,reductionPercent:Number((100*(1-after/before)).toFixed(1))}));
