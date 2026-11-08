import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {legalRoutes} from '../src/legal-content.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
import {base as basePath,siteUrl as base} from './site-config.mjs';
const manifest=JSON.parse(await fs.readFile(path.join(root,'data/generated-pages.json'),'utf8'));
const files=['index.html',...manifest];
const releases=JSON.parse(await fs.readFile(path.join(root,'data/releases.json'),'utf8'));
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
const titles=new Set(),descriptions=new Set();
let references=0;
for(const file of files){
  const html=await fs.readFile(path.join(root,file),'utf8');
  assert(!html.includes('/LOWCUT-Records/'),`Legacy project path: ${file}`);
  const route=file==='index.html'?'':file.replace(/index\.html$/,'');
  const localized=/^(en|es)\//.test(file);
  const legalType=Object.keys(legalRoutes).find(type=>Object.values(legalRoutes[type]).includes(route));
  const expected=base+(localized?route:'en/'+route);
  const title=html.match(/<title>(.*?)<\/title>/)?.[1];
  const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert(title && (!localized||!titles.has(title)),`Missing/duplicate title: ${file}`);if(localized)titles.add(title);
  assert(description && (!localized||!descriptions.has(description)),`Missing/duplicate description: ${file}`);if(localized)descriptions.add(description);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`H1 count: ${file}`);
  assert(html.includes(`<link rel="canonical" href="${expected}"`),`Canonical: ${file}`);
  assert(sitemap.includes(`<loc>${expected}</loc>`),`Sitemap: ${file}`);
  for(const language of ['en','es']){
    const logical=localized?route.slice(3):route;
    const alternate=legalType?legalRoutes[legalType][language]:language+'/'+logical;
    assert(html.includes(`hreflang="${language}" href="${base+alternate}"`),`Language alternate: ${file}`);
  }
  assert(html.includes('cursor.js')&&html.includes('cursor.css')&&html.includes('class="custom-cursor"'),`Shared cursor: ${file}`);
  const lang=html.match(/<html lang="(en|es)"/)?.[1]||'en';
  for(const type of Object.keys(legalRoutes))assert(html.includes(`href="${basePath+legalRoutes[type][lang]}"`),`Legal link: ${file}`);
  if(localized)assert(html.includes(`<html lang="${file.slice(0,2)}">`),`HTML language: ${file}`);
  const structured=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||'null');
  assert(structured?.['@context']==='https://schema.org'&&Array.isArray(structured['@graph']),`Structured data: ${file}`);
  assert(structured['@graph'].some(x=>x['@type']==='Organization'),`Organization: ${file}`);
  if(/(?:artistas|lanzamientos)\//.test(file))assert(structured['@graph'].some(x=>x['@type']==='BreadcrumbList'),`Breadcrumbs: ${file}`);
  if(/artistas\//.test(file))assert(structured['@graph'].some(x=>['Person','MusicGroup'].includes(x['@type'])),`Artist entity: ${file}`);
  if(/lanzamientos\//.test(file))assert(structured['@graph'].some(x=>['MusicRecording','MusicAlbum'].includes(x['@type'])),`Release entity: ${file}`);
  assert(!/noindex|LOADING RELEASES|getDocs\(|firebasejs\//i.test(html),`Dynamic dependency or indexing block: ${file}`);
  for(const match of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)){
    if(/application\/(?:ld\+)?json/.test(match[1]||''))JSON.parse(match[2]);else new vm.Script(match[2],{filename:file});
  }
  for(const match of html.matchAll(/(?:href|src|data-audio)="([^"]+)"/g)){
    const ref=match[1].replace(/&amp;/g,'&');
    if(/^(?:https?:|mailto:|#)/.test(ref))continue;
    const url=new URL(ref,expected);
    assert(url.pathname.startsWith(basePath),`Base path: ${ref} in ${file}`);
    let local=decodeURIComponent(url.pathname.slice(basePath.length));
    if(!local||local.endsWith('/'))local+='index.html';
    await fs.access(path.join(root,local));references++;
    if(url.hash && local.endsWith('.html')){
      const target=await fs.readFile(path.join(root,local),'utf8');
      assert(target.includes(`id="${url.hash.slice(1)}"`),`Missing fragment: ${ref}`);
    }
  }
}
const home=await fs.readFile(path.join(root,'index.html'),'utf8');
for(const r of releases){assert(r.visible===true && r.status!=='hidden');assert(home.includes(`data-track="${r.title}"`),`Missing initial release: ${r.title}`);}
const template=(await fs.readFile(path.join(root,'src/home.html'),'utf8')).replace(/\r\n/g,'\n');
assert.equal(home.match(/<form[\s\S]*?<\/form>/)[0],template.match(/<form[\s\S]*?<\/form>/)[0],'Form changed');
assert.equal((sitemap.match(/<loc>/g)||[]).length,files.filter(f=>/^(en|es)\//.test(f)).length);
const ui=await fs.readFile(path.join(root,'catalogue-ui.js'),'utf8');new vm.Script(ui);
console.log(`PASS: ${files.length} pages, ${releases.length} initial HTML releases, unique metadata, canonical/sitemap agreement, ${references} local links/assets, script syntax and unchanged form.`);
