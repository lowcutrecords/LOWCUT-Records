// Shared public-data boundary. Never read users, private releases, contracts or login logs.
const allowedRelease=['id','slug','title','artists','artistIds','releaseDate','coverPath','previewPath','publicLink','label','status','visible','featured','displayOrder','description','descriptionEn','descriptionEs','genre','credits','creditsEn','creditsEs'];
const allowedArtist=['id','slug','name','aliases','imagePath','taglineEn','taglineEs','location','genres','bioEn','bioEs','links','visible','displayOrder'];
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>o[k]!==undefined).map(k=>[k,o[k]]));
export function cleanCatalogue(releases,artists){
  const visible=rows=>rows.filter(r=>r.visible===true && String(r.status||'').toLowerCase()!=='hidden').sort((a,b)=>(Number(a.displayOrder)||0)-(Number(b.displayOrder)||0)||String(a.id).localeCompare(String(b.id)));
  const r=visible(releases).map(x=>pick(x,allowedRelease));
  const a=visible(artists).map(x=>pick(x,allowedArtist));
  const ids=new Set();
  for(const row of [...r,...a]){
    if(typeof row.id!=='string'||!/^[a-z0-9_-]+$/i.test(row.id))throw new Error('Invalid public document ID');
    if(row.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug))throw new Error(`Invalid public slug: ${row.id}`);
  }
  for(const row of r){if(!row.title?.trim()||!Array.isArray(row.artists)||!row.artists.length)throw new Error(`Incomplete release: ${row.id}`);}
  for(const row of a){
    if(!row.name?.trim()||!row.imagePath||!row.bioEn?.trim())throw new Error(`Incomplete artist: ${row.id}`);
    const key=row.slug||row.id;if(ids.has(key))throw new Error('Duplicate artist URL');ids.add(key);
    if(!Array.isArray(row.genres)||!Array.isArray(row.links))throw new Error('Invalid artist fields');
  }
  // Empty lists are valid: hiding every item must remove it from the generated site.
  for(const release of r){
    const resolved=release.artists.map((name,i)=>a.find(artist=>release.artistIds?.[i]===artist.id||[artist.name,...(artist.aliases||[])].some(alias=>alias.toLowerCase()===name.toLowerCase())));
    release.artistIds=release.artists.map((name,i)=>resolved[i]?.id||release.artistIds?.[i]||'');
    release.artists=release.artists.map((name,i)=>resolved[i]?.name||name);
  }
  return {releases:r,artists:a};
}
function decode(v){
  if('stringValue'in v)return v.stringValue;if('booleanValue'in v)return v.booleanValue;
  if('integerValue'in v)return Number(v.integerValue);if('doubleValue'in v)return v.doubleValue;
  if('arrayValue'in v)return(v.arrayValue.values||[]).map(decode);
  if('mapValue'in v)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,decode(x)]));
  return null;
}
export async function readPublicCollection(name,fetcher=fetch){
  if(!['publicReleases','publicArtists','publicPartners'].includes(name))throw new Error('Collection is not public catalogue');
  const rows=[];let token='';
  do{
    const url=new URL(`https://firestore.googleapis.com/v1/projects/lowcut-artist-portal/databases/(default)/documents/${name}`);
    url.searchParams.set('pageSize','100');if(token)url.searchParams.set('pageToken',token);
    // Rules are not filters: do not retrieve drafts anonymously when publicArtists rules require visible=true.
    // publicArtists is queried below via runQuery instead of listDocuments.
    if(name!=='publicReleases')break;
    const response=await fetcher(url,{signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error(`${name}: Firebase ${response.status}. No cached fallback used.`);
    const json=await response.json();rows.push(...(json.documents||[]));token=json.nextPageToken||'';
  }while(token);
  if(name!=='publicReleases'){
    // A paginated ordered query keeps admin drafts unreadable to anonymous visitors.
    let lastName;
    while(true){
      const structuredQuery={from:[{collectionId:name}],where:{fieldFilter:{field:{fieldPath:'visible'},op:'EQUAL',value:{booleanValue:true}}},orderBy:[{field:{fieldPath:'__name__'},direction:'ASCENDING'}],limit:100};
      if(lastName)structuredQuery.startAt={values:[{referenceValue:lastName}],before:false};
      const response=await fetcher('https://firestore.googleapis.com/v1/projects/lowcut-artist-portal/databases/(default)/documents:runQuery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({structuredQuery}),signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw new Error(`${name}: Firebase ${response.status}. Review publicArtists rules before activation. No cached fallback used.`);
      const page=(await response.json()).filter(x=>x.document).map(x=>x.document);rows.push(...page);
      if(page.length<100)break;lastName=page.at(-1).name;
    }
  }
  return rows.map(d=>({...Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,decode(v)])),id:d.name.split('/').pop()}));
}
