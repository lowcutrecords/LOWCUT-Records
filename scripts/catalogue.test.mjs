import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanCatalogue,readPublicCollection} from './catalogue.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const artist={id:'fayre',slug:'fayre',name:'Fayre',aliases:[],imagePath:'assets/artist-fayre.png',bioEn:'Existing biography.',genres:[],links:[],visible:true};
const release={id:'track',title:'Track',artists:['Fayre'],visible:true,status:'released'};
test('exclude hidden releases/artists and strip private fields',()=>{
  const data=cleanCatalogue([{...release,authorizedUids:['private'],contract:'private'}, {...release,id:'hidden',status:'hidden'}],[{...artist,email:'private'}, {...artist,id:'draft',visible:false}]);
  assert.equal(data.releases.length,1);assert.equal(data.artists.length,1);assert(!JSON.stringify(data).includes('private'));
});
test('artist rename retains legacy relationships, current credit and document ID',()=>{
  const data=cleanCatalogue([release],[{...artist,name:'New Name',aliases:['Fayre']}]);
  assert.deepEqual(data.releases[0].artistIds,['fayre']);assert.deepEqual(data.releases[0].artists,['New Name']);assert.equal(data.artists[0].slug,'fayre');
});
test('empty catalogue is intentional and valid',()=>assert.deepEqual(cleanCatalogue([],[]),{releases:[],artists:[]}));
test('reject URL collisions and unsafe slugs',()=>{
  assert.throws(()=>cleanCatalogue([],[artist,{...artist,id:'other'}]),/Duplicate/);
  assert.throws(()=>cleanCatalogue([],[{...artist,slug:'../escape'}]),/slug/);
});
test('permission error does not silently reuse stale artist cache',async()=>{
  await assert.rejects(readPublicCollection('publicArtists',async()=>({ok:false,status:403})),/403/);
});
test('paginate public artists using a visible-only query',async()=>{
  let calls=0;
  const result=await readPublicCollection('publicArtists',async(url,options)=>{
    assert(url.endsWith(':runQuery'));const query=JSON.parse(options.body).structuredQuery;
    assert.equal(query.where.fieldFilter.value.booleanValue,true);
    calls++;if(calls===2){assert(query.startAt.values[0].referenceValue.endsWith('/artist99'));assert.equal(query.startAt.before,false);return {ok:true,json:async()=>[]};}
    return {ok:true,json:async()=>Array.from({length:100},(_,i)=>({document:{name:'projects/p/databases/(default)/documents/publicArtists/artist'+i,fields:{name:{stringValue:'Artist'}}}}))};
  });assert.equal(result.length,100);assert.equal(calls,2);
});
test('private collections cannot be read by the public builder',async()=>{
  await assert.rejects(readPublicCollection('users'),/not public/);
});
test('build creates new profiles/releases, keeps URLs on rename and removes hidden pages',async()=>{
  const source=fileURLToPath(new URL('../',import.meta.url));
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'lowcut-catalogue-test-'));
  // All test writes stay under a fresh OS temporary directory. No Firebase calls.
  try{
    await fs.mkdir(path.join(temp,'scripts'));await fs.mkdir(path.join(temp,'src'));await fs.mkdir(path.join(temp,'data'));
    for(const file of ['build.mjs','catalogue.mjs','localize.mjs','home-i18n.mjs'])await fs.copyFile(path.join(source,'scripts',file),path.join(temp,'scripts',file));
    await fs.copyFile(path.join(source,'src/home.html'),path.join(temp,'src/home.html'));
    const artists=[{...artist,id:'demo-artist',slug:'demo-artist',name:'Demo Artist',bioEs:'Biografía de prueba en español.'}];
    const releases=[{...release,id:'demo-track',slug:'demo-track',title:'Demo Track',artists:['Demo Artist'],artistIds:['demo-artist'],coverPath:'assets/demo.png',releaseDate:'2026-11-07',label:'LOWCUT// Records'}];
    const save=async()=>{await fs.writeFile(path.join(temp,'data/artists.json'),JSON.stringify(artists));await fs.writeFile(path.join(temp,'data/releases.json'),JSON.stringify(releases));};
    const run=()=>execFileSync(process.execPath,[path.join(temp,'scripts/build.mjs')],{stdio:'pipe'});
    await save();run();
    const spanish=await fs.readFile(path.join(temp,'es/artistas/demo-artist/index.html'),'utf8');
    assert(spanish.includes('Biografía de prueba en español.'));assert(spanish.includes('<html lang="es">'));
    assert(spanish.includes('href="/LOWCUT-Records/en/artistas/demo-artist/"'));assert(spanish.includes('hreflang="es"'));
    assert(spanish.includes('cursor.js'));assert(spanish.includes('view-transition-name: artist-demo-artist'));
    const partners=[{id:'fixture',name:'Partner Fixture',imagePath:'assets/fixture.webp',url:'https://example.com/',taglineEn:'Partner English',taglineEs:'Partner Español',visible:true,displayOrder:1}];
    await fs.writeFile(path.join(temp,'data/partners.json'),JSON.stringify(partners));run();
    assert((await fs.readFile(path.join(temp,'es/index.html'),'utf8')).includes('Partner Español'));
    partners[0].visible=false;await fs.writeFile(path.join(temp,'data/partners.json'),JSON.stringify(partners));run();
    assert(!(await fs.readFile(path.join(temp,'en/index.html'),'utf8')).includes('Partner Fixture'));
    let page=await fs.readFile(path.join(temp,'artistas/demo-artist/index.html'),'utf8');assert(page.includes('Demo Track'));
    artists[0].name='Renamed Artist';artists[0].aliases=['Demo Artist'];releases[0].title='Renamed Track';
    await save();run();page=await fs.readFile(path.join(temp,'lanzamientos/demo-track/index.html'),'utf8');assert(page.includes('Renamed Track'));assert(page.includes('Renamed Artist'));
    assert(page.includes('artistas/demo-artist/'));
    artists[0].visible=false;releases[0].visible=false;await save();run();
    await assert.rejects(fs.access(path.join(temp,'artistas/demo-artist/index.html')));
    await assert.rejects(fs.access(path.join(temp,'lanzamientos/demo-track/index.html')));
    await assert.rejects(fs.access(path.join(temp,'es/lanzamientos/demo-track/index.html')));
    await assert.rejects(fs.access(path.join(temp,'en/artistas/demo-artist/index.html')));
    assert(!(await fs.readFile(path.join(temp,'sitemap.xml'),'utf8')).includes('demo-track'));
  }finally{
    if(path.dirname(temp)!==os.tmpdir()||!path.basename(temp).startsWith('lowcut-catalogue-test-'))throw new Error('Unsafe test cleanup path');
    await fs.rm(temp,{recursive:true,force:true});
  }
});
