import {test} from 'node:test';
import assert from 'node:assert/strict';
import {structuredData} from './structured-data.mjs';
import {responsiveImages} from './responsive-images.mjs';
const base='/LOWCUT-Records/',origin='https://lowcutrecords.github.io';
const artist={id:'lack',name:'LACK',slug:'lack',imagePath:'assets/lack.webp',bioEn:'Band biography',bioEs:'Biografía de la banda',genres:['Alternative rock'],links:[{url:'https://example.com/lack'}]};
const artistPath=a=>'artistas/'+a.slug+'/',releasePath=r=>'lanzamientos/'+r.id+'/';
const page=(lang,route)=>`<html lang="${lang}"><head><title>Fixture</title><meta name="description" content="Description" /><link rel="canonical" href="${origin+base+lang+'/'+route}" /></head><body></body></html>`;
const extract=html=>JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
test('entity graph uses language-specific URLs and stable identity across languages',()=>{
 const pages=new Map(['en','es'].map(l=>[l+'/artistas/lack/index.html',page(l,'artistas/lack/')]));
 structuredData(pages,{artists:[artist],releases:[],base,origin,artistPath,releasePath,image:x=>x});
 const [en,es]=[...pages.values()].map(extract);const entity=(g,t)=>g.find(x=>x['@type']===t);
 assert.equal(entity(es,'MusicGroup').description,artist.bioEs);assert.equal(entity(es,'MusicGroup')['@id'],entity(en,'MusicGroup')['@id']);
 assert.equal(entity(es,'ProfilePage').url,origin+base+'es/artistas/lack/');
 assert.equal(entity(es,'BreadcrumbList').itemListElement.length,3);assert(entity(es,'Organization'));
});
test('singles are recordings, alternate-version EP is album, drafts omit publication dates',()=>{
 const release={id:'single',title:'Track </script><script>alert(1)</script>',artists:['LACK'],artistIds:['lack'],coverPath:'assets/cover.webp',previewPath:'assets/preview.mp3',status:'presave',releaseDate:'2099-01-01',genre:'Rock'};
 const ep={...release,id:'lasthourep',title:'Last Hour'};
 const pages=new Map([['en/lanzamientos/single/index.html',page('en','lanzamientos/single/')],['en/lanzamientos/lasthourep/index.html',page('en','lanzamientos/lasthourep/')]]);
 structuredData(pages,{artists:[artist],releases:[release,ep],base,origin,artistPath,releasePath,image:x=>x});
 const recording=extract([...pages.values()][0]).find(x=>x['@type']==='MusicRecording');assert(!recording.datePublished);assert.equal(recording.name,release.title);assert(![...pages.values()][0].includes(release.title));
 assert.equal(extract([...pages.values()][1]).find(x=>x['@type']==='MusicAlbum').albumReleaseType,'https://schema.org/EPRelease');
});
test('mobile image variants preserve dimensions and prioritize only the hero',()=>{
 const pages=new Map([['index.html','<img class="hero-art" src="/LOWCUT-Records/assets/banner.webp" /><img src="https://example.com/external.webp" />']]);
 responsiveImages(pages,{base,variants:{'assets/banner.png':{path:'assets/banner.webp',width:1920,height:1080,responsive:[{path:'assets/banner-480w.webp',width:480}]}}});
 const html=pages.get('index.html');assert(html.includes('fetchpriority="high"'));assert(html.includes('sizes="100vw"'));assert(html.includes('width="1920" height="1080"'));assert(html.includes('480w'));assert.equal((html.match(/fetchpriority/g)||[]).length,1);
});
