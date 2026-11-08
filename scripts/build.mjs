import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {cleanCatalogue,readPublicCollection} from './catalogue.mjs';
import {localizedPages} from './localize.mjs';
import {structuredData} from './structured-data.mjs';
import {responsiveImages} from './responsive-images.mjs';
import {addLegalPages} from './legal-pages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
import {base,origin} from './site-config.mjs';
let imageVariants={};
try{imageVariants=JSON.parse(await fs.readFile(path.join(root,'data/image-variants.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const optimized=value=>imageVariants[value]?.path||value;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const asset = value => {
  if (!value) return '';
  value=optimized(value);
  if (/^https:\/\//i.test(value)) return new URL(value).href;
  if (!value.startsWith('assets/') || value.includes('..') || value.includes('\\')) throw new Error(`Invalid asset path: ${value}`);
  return base + value.split('/').map(encodeURIComponent).join('/');
};
const external = value => {
  if (!value) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error(`Invalid public link: ${value}`);
  return url.href;
};
const date = value => value ? new Intl.DateTimeFormat('en-US',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')).toUpperCase() : '';
const fresh=process.argv.includes('--refresh');
const rawReleases=fresh?await readPublicCollection('publicReleases'):JSON.parse(await fs.readFile(path.join(root,'data/releases.json'),'utf8'));
const rawArtists=fresh?await readPublicCollection('publicArtists'):JSON.parse(await fs.readFile(path.join(root,'data/artists.json'),'utf8'));
const {releases,artists}=cleanCatalogue(rawReleases,rawArtists);
let rawPartners=[];
try{rawPartners=JSON.parse(await fs.readFile(path.join(root,'data/partners.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(fresh&&process.env.ENABLE_PARTNER_SYNC==='true')rawPartners=await readPublicCollection('publicPartners');
const partners=rawPartners.filter(p=>p.visible===true).sort((a,b)=>(a.displayOrder||0)-(b.displayOrder||0));
for(const partner of partners){if(!partner.name||!partner.imagePath)throw new Error('Incomplete public partner');asset(partner.imagePath);external(partner.url);}

const knownSlugs = {menta:'menta-lack',insanev2:'insane-v2-zanx',singularity:'singularity',letmego:'let-me-go-zanx'};
const releasePath = r => `lanzamientos/${r.slug || knownSlugs[r.id] || slug(r.id)}/`;
const releasePaths=releases.map(releasePath);if(new Set(releasePaths).size!==releases.length)throw new Error('Duplicate release URL');
let template = (await fs.readFile(path.join(root,'src/home.html'),'utf8')).replace(/\r\n/g,'\n');
template=template.replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/g,(_,before,src,after)=>before+optimized(src)+after);
const artistPath = a => `artistas/${a.slug||slug(a.id)}/`;
const matchingArtist=(r,name,i)=>artists.find(a=>(r.artistIds?.[i]===a.id)||a.name.toLowerCase()===name.toLowerCase());
const hasArtist=(r,a)=>r.artistIds?.includes(a.id)||r.artists.some(n=>n.toLowerCase()===a.name.toLowerCase());
const artistLinks = r => r.artists.map((name,i)=>{
  const a=matchingArtist(r,name,i);
  return a ? `<a href="${base+artistPath(a)}">${esc(name)}</a>` : esc(name);
}).join(' X ');
function status(r) {
  const link=external(r.publicLink), label=r.status==='released'?'LISTEN NOW':r.status==='presave'?'PRE-SAVE':'COMING SOON';
  return link && ['released','presave'].includes(r.status) ? `<a class="release-presave" data-public-status="${esc(r.status)}" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>` : `<span class="release-presave coming-soon" data-public-status="${esc(r.status)}">${r.status==='released'?'OUT NOW':label}</span>`;
}
function card(r) {
  return `<article class="release-card${r.featured?' featured':''}"${r.previewPath?` data-audio="${esc(asset(r.previewPath))}"`:''} data-track="${esc(r.title)}">
  ${r.previewPath?'<div class="release-audio-badge"><span class="release-audio-dot"></span><span>HOVER TO PREVIEW</span></div>':''}
  <a class="release-cover-link" href="${base+releasePath(r)}" aria-label="${esc(r.title+' — '+r.artists.join(' X '))}"><img style="view-transition-name: release-${slug(r.id)}" src="${esc(asset(r.coverPath))}" alt="${esc(r.title+' — '+r.artists.join(' X '))}" loading="lazy" /></a>
  <div class="release-meta"><span>${artistLinks(r)}</span><h3 class="release-title"><a href="${base+releasePath(r)}">${esc(r.title)}</a></h3>
  <small data-release-date="${esc(r.releaseDate)}" data-label="${esc(r.label)}">${esc(date(r.releaseDate))} · ${esc(r.label)}</small>
  ${status(r)}${r.previewPath?'<button type="button" class="mobile-preview-btn">PLAY PREVIEW ▶</button>':''}</div></article>`;
}
const cards = list => list.map(card).join('\n');
function seo(title,description,route,image) {
  const url=origin+base+route;
  return `<title>${esc(title)}</title><meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(url)}" />
  <meta property="og:type" content="website" /><meta property="og:site_name" content="LOWCUT// Records" />
  <meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(url)}" /><meta property="og:image" content="${esc(new URL(asset(image),origin).href)}" />
  <meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" /><meta name="twitter:image" content="${esc(new URL(asset(image),origin).href)}" />`;
}
const refresh = `<script src="${base}catalogue-ui.js" defer></script>`;
let home=template.replace(/\s*<meta name="description"[^>]*>/,'').replace(/<title>.*?<\/title>/,seo('LOWCUT// Records — Independent Argentine Record Label','Discover LOWCUT// Records, an independent Argentine label for electronic, urban and experimental music. Explore artists, listen to releases and submit your demo.','','assets/banner-black.png'))
 .replace(/href="favicon.png"/g,`href="${base}assets/favicon.png"`)
 .replace(/<div class="release-loading" id="releaseLoading">[\s\S]*?<\/div>/,cards(releases)||'<p class="release-loading">NO PUBLIC RELEASES YET.</p>')
 .replace(/  <script type="module">[\s\S]*?<\/script>/,refresh);
const paragraphs=value=>String(value||'').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');
const meta=a=>a.taglineEn||[a.genres.join(' / '),a.location].filter(Boolean).join(' / ');
const officialLinks=a=>a.links.map(l=>`<a class="profile-link" href="${esc(external(l.url))}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`).join(' ');
home=home.replace(/(<div class="artist-stack">)[\s\S]*?(\n      <\/div>\n    <\/section>)/,(_,start,end)=>start+artists.map((a,i)=>`<article class="artist-card${i%2?' reverse':''}" data-public-artist="${esc(a.id)}"><a class="artist-portrait-link" style="display:contents" href="${base+artistPath(a)}" aria-label="${esc(a.name)}"><img style="view-transition-name: artist-${slug(a.id)}" src="${esc(asset(a.imagePath))}" alt="${esc(a.name)} artist poster" /></a><div class="artist-copy"><span><a class="artist-name-link" href="${base+artistPath(a)}">${esc(a.name.toUpperCase())}</a></span><h3 data-artist-meta>${esc(meta(a))}</h3><div data-artist-bio>${paragraphs(a.bioEn)}</div>${officialLinks(a)}<a class="profile-link" href="${base+artistPath(a)}" data-profile-link>ARTIST PROFILE ↗</a></div></article>`).join('\n')+end);
home=home.replace(/(<section class="footer-partners"[^>]*>)[\s\S]*?<\/section>/,(_,start)=>start+'<div class="footer-partners-head"><div><p class="index">LOWCUT// NETWORK</p><h3 class="footer-partners-title" id="partners-title">PARTNERS</h3></div></div>'+partners.map(p=>`<a class="partner-mini" href="${esc(external(p.url))}" target="_blank" rel="noopener noreferrer"><span class="partner-mini-logo"><img src="${esc(asset(p.imagePath))}" alt="${esc(p.name)} logo" loading="lazy" /></span><span class="partner-mini-copy"><strong>${esc(p.name)}</strong><span>${esc(p.taglineEn||'')}</span></span></a>`).join('')+'</section>');
home=home.replace('data-i18n="artists.note"','data-public-roster-note').replace('Four emerging voices. One independent platform.',`${artists.length} artists. One independent platform.`);
home=home.replace('</body>',`<script type="application/json" id="public-artist-data">${JSON.stringify(artists).replace(/</g,'\\u003c')}</script></body>`);
home=home.replace('</head>',`<link rel="stylesheet" href="${base}detail.css" /></head>`);
const commonStyle = template.match(/<style>([\s\S]*?)<\/style>/)[0];
const player = template.slice(template.indexOf('    // Release preview player:'),template.indexOf('  })();\n  </script>'));
function detail(title,description,route,image,content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="theme-color" content="#0a0a0a" />${seo(title,description,route,image)}<link rel="icon" href="${base}assets/favicon.png" /><link rel="stylesheet" href="${base}styles.css" />${commonStyle}<link rel="stylesheet" href="${base}detail.css" /></head>
  <body class="detail-page"><div class="noise" aria-hidden="true"></div><header class="site-header"><a class="brand" href="${base}">LOWCUT//</a><div class="detail-header-links"><a href="${base}#releases">RELEASES</a><a href="${base}#artists">ARTISTS</a><a href="${base}#demo">SEND A DEMO ↗</a></div></header>
  <main class="detail-main">${content}</main><footer><span>© 2026 LOWCUT// RECORDS</span><a href="${base}">BACK TO LOWCUT// ↗</a></footer>
  <script>(()=>{${player}})();</script>${refresh}</body></html>`;
}
let pages = new Map([['index.html',home]]);
for (const a of artists) {
  const discography=releases.filter(r=>hasArtist(r,a));
  const collaborators=[...new Set(discography.flatMap(r=>r.artists).filter(n=>n.toLowerCase()!==a.name.toLowerCase()))];
  const content=`<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${base}">LOWCUT//</a> / <a href="${base}#artists">ARTISTS</a> / ${esc(a.name)}</nav>
  <section class="detail-hero"><img class="detail-portrait" style="view-transition-name: artist-${slug(a.id)}" src="${esc(asset(a.imagePath))}" alt="${esc(a.name)} artist poster" /><div><p class="index">LOWCUT// ROSTER</p><h1>${esc(a.name)}</h1><p class="detail-meta">${esc(meta(a))}</p>${a.location?`<p class="detail-meta">${esc(a.location)}</p>`:''}${a.genres.length?`<p class="detail-meta">GENRES: ${esc(a.genres.join(' / '))}</p>`:''}${paragraphs(a.bioEn)}${officialLinks(a)}${collaborators.length?`<p class="detail-meta">COLLABORATIONS: ${collaborators.map(n=>{const c=artists.find(a=>a.name.toLowerCase()===n.toLowerCase());return c?`<a href="${base+artistPath(c)}">${esc(n)}</a>`:esc(n)}).join(', ')}</p>`:''}</div></section>
  <section class="detail-catalogue"><h2>RELEASES</h2>${discography.length?`<div class="release-grid">${cards(discography)}</div>`:'<p>No releases currently listed in the public catalogue.</p>'}</section>`;
  pages.set(artistPath(a)+'index.html',detail(`${a.name} — Artist | LOWCUT// Records`,`${a.name} on LOWCUT// Records. ${meta(a)}. Biography and releases from the public catalogue.`,artistPath(a),a.imagePath,content));
}
for (const r of releases) {
  const description=(r.descriptionEn||r.description)?.trim().replace(/\s+/g,' ').slice(0,180)||`${r.title} by ${r.artists.join(' & ')} — ${r.label}${r.releaseDate?', released '+date(r.releaseDate):''}. Listen to the preview and find streaming links.`;
  const related=releases.filter(x=>x.id!==r.id && x.artists.some(n=>r.artists.includes(n)));
  const content=`<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${base}">LOWCUT//</a> / <a href="${base}#releases">RELEASES</a> / ${esc(r.title)}</nav>
  <section class="detail-hero"><img class="detail-cover" style="view-transition-name: release-${slug(r.id)}" src="${esc(asset(r.coverPath))}" alt="${esc(r.title+' — '+r.artists.join(' X '))}" /><div><p class="index">${esc(r.label)}</p><h1>${esc(r.title)}</h1><p class="detail-byline">${artistLinks(r)}</p><p class="detail-meta">${esc(date(r.releaseDate))}</p>${paragraphs(r.descriptionEn||r.description||`${r.title} by ${r.artists.join(' & ')}. ${r.label}.`)}${r.genre?`<p>${esc(r.genre)}</p>`:''}${(r.creditsEn||r.credits)?`<p>${esc(r.creditsEn||r.credits)}</p>`:''}${status(r)}${r.previewPath?`<div class="detail-audio"><label for="release-preview">AUDIO PREVIEW</label><audio id="release-preview" controls preload="none" src="${esc(asset(r.previewPath))}"></audio></div>`:''}</div></section>
  ${related.length?`<section class="detail-catalogue"><h2>MORE FROM THE ARTIST</h2><div class="release-grid">${cards(related)}</div></section>`:''}`;
  pages.set(releasePath(r)+'index.html',detail(`${r.title} — ${r.artists.join(' & ')} | LOWCUT// Records`,description,releasePath(r),r.coverPath,content));
}
const localized=localizedPages(pages,{artists,releases,template,base,origin,partners});
pages=localized.pages;
pages=addLegalPages(pages,{base,origin,commonStyle,canonicalRoutes:localized.canonicalRoutes});
pages=responsiveImages(pages,{variants:imageVariants,base});
pages=structuredData(pages,{artists,releases,base,origin,artistPath,releasePath,image:optimized});
const routes=localized.canonicalRoutes;
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(r=>`  <url><loc>${esc(origin+base+r)}</loc></url>`).join('\n')}\n</urlset>\n`;
// Remove only pages previously generated by this builder, when a release is hidden/removed.
let previous=[];
try { previous=JSON.parse(await fs.readFile(path.join(root,'data/generated-pages.json'),'utf8')); } catch(e) { if(e.code!=='ENOENT')throw e; }
for(const old of previous) {
  if(!/^(?:(?:en|es)\/)?(?:(?:artistas|lanzamientos)\/[a-z0-9-]+\/|(?:privacidad|privacy|terminos-de-uso|terms-of-use)\/)?index\.html$/.test(old))throw new Error('Invalid previous page path');
  if(!pages.has(old))await fs.rm(path.join(root,old),{force:true});
}
for(const [name,html] of pages) { await fs.mkdir(path.dirname(path.join(root,name)),{recursive:true}); await fs.writeFile(path.join(root,name),html); }
await fs.writeFile(path.join(root,'sitemap.xml'),sitemap);
await fs.writeFile(path.join(root,'data/generated-pages.json'),JSON.stringify([...pages.keys()].filter(p=>p!=='index.html'),null,2)+'\n');
await fs.writeFile(path.join(root,'data/releases.json'),JSON.stringify(releases,null,2)+'\n');
await fs.writeFile(path.join(root,'data/artists.json'),JSON.stringify(artists,null,2)+'\n');
await fs.writeFile(path.join(root,'data/partners.json'),JSON.stringify(rawPartners,null,2)+'\n');
console.log(`Built ${pages.size} pages (${artists.length} artists, ${releases.length} visible releases) and sitemap. Source: ${process.argv.includes('--refresh')?'public Firestore':'local public snapshot'}.`);
