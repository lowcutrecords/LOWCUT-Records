// Public fields only. No users, contracts, private contact details or inferred credits.
const absolute=(value,base)=>value?new URL(value,base).href:undefined;
const description=html=>html.match(/<meta name="description" content="([^"]+)"/)?.[1].replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const safeJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function structuredData(pages,{artists,releases,base,origin,artistPath,releasePath,image}){
  const site=origin+base,orgId=site+'#organization',siteId=site+'#website';
  const org={'@type':'Organization','@id':orgId,name:'LOWCUT// Records',url:site,logo:{'@type':'ImageObject',url:absolute(image('assets/logo-white.png'),site)},description:'Independent record label based in Argentina.',sameAs:['https://www.instagram.com/lowcut.records/','https://soundcloud.com/lowcut_records']};
  const website={'@type':'WebSite','@id':siteId,url:site,name:'LOWCUT// Records',publisher:{'@id':orgId},inLanguage:['en','es']};
  const artistNode=(a,lang)=>{const type=a.schemaType||(a.id==='lack'?'MusicGroup':'Person');return {'@type':type,'@id':site+'#artist-'+a.id,name:a.name,url:site+lang+'/'+artistPath(a),image:absolute(image(a.imagePath),site),description:(lang==='es'?a.bioEs:a.bioEn)||a.bioEn,[type==='MusicGroup'?'genre':'knowsAbout']:a.genres,sameAs:a.links.map(l=>l.url)};};
  for(const [file,html] of pages){
    const language=html.match(/<html[^>]*lang="(en|es)"/)?.[1]||'en';
    const canonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if(!canonical)throw new Error('Missing canonical for structured data: '+file);
    const route=file.replace(/^(en|es)\//,'').replace(/index\.html$/,'');
    const a=artists.find(a=>route===artistPath(a)),r=releases.find(r=>route===releasePath(r));
    const graph=[org,website];
    const page={'@type':a?'ProfilePage':'WebPage','@id':canonical+'#webpage',url:canonical,name:html.match(/<title>(.*?)<\/title>/)?.[1],description:description(html),inLanguage:language,isPartOf:{'@id':siteId},publisher:{'@id':orgId}};
    if(a){const entity=artistNode(a,language);graph.push(entity);page.mainEntity={'@id':entity['@id']};}
    if(r){
      // EP/album entries must not be presented as individual recordings.
      // The label confirmed Last Hour is an EP of alternate versions of one song.
      const releaseType=r.releaseType||(r.id==='lasthourep'?'ep':'single');
      const type=['ep','album'].includes(releaseType)?'MusicAlbum':'MusicRecording';
      const entity={'@type':type,'@id':site+'#release-'+r.id,name:r.title,url:canonical,image:absolute(image(r.coverPath),site),description:r[language==='es'?'descriptionEs':'descriptionEn']||r.description||description(html),publisher:{'@id':orgId}};
      if(r.genre)entity.genre=r.genre;
      const credits=r[language==='es'?'creditsEs':'creditsEn']||r.credits;if(credits)entity.creditText=credits;
      if(type!=='CreativeWork')entity.byArtist=r.artists.flatMap((name,i)=>{
        const artist=artists.find(a=>a.id===r.artistIds?.[i]||a.name===name);if(artist)return [artistNode(artist,language)];
        // Display credits sometimes contain "Dro feat. Fayre" in a single field.
        const names=name.split(/\s+(?:feat\.?|ft\.?|featuring|x|&)\s+/i);
        return names.map(n=>{const match=artists.find(a=>a.name.toLowerCase()===n.trim().toLowerCase());return match?artistNode(match,language):{'@type':'Person',name:n.trim()};});
      });
      else entity.creator=r.artists.map(name=>({'@type':'Person',name}));
      if(type==='MusicAlbum')entity.albumReleaseType='https://schema.org/'+(releaseType==='ep'?'EPRelease':'AlbumRelease');
      if(r.status==='released'&&/^\d{4}-\d{2}-\d{2}$/.test(r.releaseDate||'')&&r.releaseDate<=new Date().toISOString().slice(0,10))entity.datePublished=r.releaseDate;
      if(r.publicLink)entity.sameAs=[r.publicLink];
      if(r.previewPath)entity.audio={'@type':'AudioObject',name:r.title+' — audio preview',contentUrl:absolute(r.previewPath,site),encodingFormat:'audio/mpeg'};
      graph.push(entity);page.mainEntity={'@id':entity['@id']};
    }
    if(a||r){
      const breadcrumbId=canonical+'#breadcrumb',label=language==='es'?(a?'Artistas':'Lanzamientos'):(a?'Artists':'Releases');
      graph.push({'@type':'BreadcrumbList','@id':breadcrumbId,itemListElement:[{'@type':'ListItem',position:1,name:'LOWCUT//',item:site+language+'/'},{'@type':'ListItem',position:2,name:label,item:site+language+'/#'+(a?'artists':'releases')},{'@type':'ListItem',position:3,name:(a||r).name||r.title,item:canonical}]});
      page.breadcrumb={'@id':breadcrumbId};
    }
    graph.push(page);pages.set(file,html.replace('</head>',`<script type="application/ld+json">${safeJSON({'@context':'https://schema.org','@graph':graph})}</script></head>`));
  }
  return pages;
}
