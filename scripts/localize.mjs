import {homeTranslations,translateHome} from './home-i18n.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs=value=>String(value||'').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');
const terms={RELEASES:'LANZAMIENTOS',ARTISTS:'ARTISTAS','SEND A DEMO ↗':'ENVIAR UNA DEMO ↗','LOWCUT// ROSTER':'ARTISTAS DE LOWCUT//','AUDIO PREVIEW':'PREVIEW DE AUDIO','PLAY PREVIEW ▶':'ESCUCHAR PREVIEW ▶','HOVER TO PREVIEW':'PASÁ PARA ESCUCHAR','MORE FROM THE ARTIST':'MÁS DEL ARTISTA','BACK TO LOWCUT// ↗':'VOLVER A LOWCUT// ↗','ARTIST PROFILE ↗':'PERFIL DEL ARTISTA ↗','LISTEN NOW ↗':'ESCUCHAR AHORA ↗','OUT NOW':'DISPONIBLE AHORA','COMING SOON':'PRÓXIMAMENTE','No releases currently listed in the public catalogue.':'No hay lanzamientos visibles en el catálogo público por ahora.','NO PUBLIC RELEASES YET.':'TODAVÍA NO HAY LANZAMIENTOS PÚBLICOS.'};
export function localizedPages(original,{artists,releases,template,base,origin,partners=[]}){
  const dictionary=homeTranslations(template),pages=new Map(),canonicalRoutes=[];
  const localized=(route,lang)=>base+lang+'/'+route;
  for(const [file,source] of original){
    const route=file==='index.html'?'':file.replace(/index\.html$/,'');
    for(const lang of ['en','es']){
      const canonical=origin+localized(route,lang);
      let html=source.replace('<html lang="en">',`<html lang="${lang}">`);
      html=html.replace(/\/\* V14 — custom cursor \*\/[\s\S]*?(?=\/\* V14 — richer label story \*\/)/,'');
      if(file==='index.html'){
        html=html.replace(/    const translations = [\s\S]*?setLang\(initial\);\n/,'');
        html=html.replace(/    if \(matchMedia\('\(pointer:fine\)'\)\.matches\) \{[\s\S]*?(?=    \/\/ Release preview player:)/,'');
        html=html.replace(/    \/\/ Release preview player:[\s\S]*?(?=  \}\)\(\);\n  <\/script>)/,'');
        if(lang==='es')html=translateHome(html,lang,dictionary,esc);
        html=html.replace(/<button\b([^>]*data-lang="(en|es)"[^>]*)>[\s\S]*?<\/button>/g,(_,attrs,l)=>`<a class="lang-btn${l===lang?' active':''}" data-lang="${l}" lang="${l}" hreflang="${l}" href="${localized('',l)}"${l===lang?' aria-current="page"':''}>${l.toUpperCase()}</a>`);
      }else{
        html=html.replace(/<script>\(\(\)=>\{[\s\S]*?\/\/ Release preview player:[\s\S]*?<\/script>/,'');
        html=html.replace('<body class="detail-page">','<body class="detail-page"><div class="custom-cursor" aria-hidden="true"></div>');
        const selector=`<div class="lang-switch detail-lang-switch" role="navigation" aria-label="${lang==='es'?'Idioma':'Language'}">${['en','es'].map(l=>`<a class="lang-btn${l===lang?' active':''}" lang="${l}" hreflang="${l}" href="${localized(route,l)}"${l===lang?' aria-current="page"':''}>${l.toUpperCase()}</a>`).join('')}</div>`;
        html=html.replace('</header>',selector+'</header>');
      }
      html=html.replace(/<script src="[^"]*catalogue-ui\.js" defer><\/script>/,'');
      // Localize every internal HTML link; asset URLs always stay under the project base.
      html=html.replace(/href="([^\"]+)"/g,(whole,href)=>{
        if(href.startsWith(base)&&!/^\/(?:en|es)\//.test(href.slice(base.length-1))){
          const relative=href.slice(base.length);
          if(!/^(?:assets\/|styles\.css|detail\.css|cursor\.css|transitions\.css)/.test(relative))return `href="${localized(relative,lang)}"`;
        }
        if(href==='styles.css')return `href="${base}styles.css"`;
        if(href.startsWith('assets/'))return `href="${base+href}"`;
        return whole;
      });
      html=html.replace(/src="(assets\/[^\"]+)"/g,(_,src)=>`src="${base+src}"`);
      html=html.replace(/<link rel="canonical" href="[^"]+"\s*\/>/,`<link rel="canonical" href="${canonical}" />\n${['en','es'].map(l=>`<link rel="alternate" hreflang="${l}" href="${origin+localized(route,l)}" />`).join('\n')}\n<link rel="alternate" hreflang="x-default" href="${origin+localized(route,'en')}" />`);
      html=html.replace(/(<meta property="og:url" content=")[^"]+/,`$1${canonical}`);
      if(lang==='es'){
        for(const p of partners)if(p.taglineEn&&p.taglineEs)html=html.replaceAll(esc(p.taglineEn),esc(p.taglineEs));
        html=html.replace(/>([^<>]+)</g,(whole,text)=>`>${terms[text]||text.replace(/^GENRES: /,'GÉNEROS: ').replace(/^COLLABORATIONS: /,'COLABORACIONES: ')}<`);
        html=html.replace(/\bFour emerging voices\. One independent platform\./g,`${artists.length} artistas. Una plataforma independiente.`).replace(new RegExp(`${artists.length} artists\\. One independent platform\\.`,'g'),`${artists.length} artistas. Una plataforma independiente.`);
        for(const a of artists){
          html=html.replaceAll(esc(`${a.name} on LOWCUT// Records. ${a.taglineEn||[a.genres.join(' / '),a.location].filter(Boolean).join(' / ')}. Biography and releases from the public catalogue.`),esc(`${a.name} en LOWCUT// Records. ${a.taglineEs||a.genres.join(' / ')}. Biografía y lanzamientos del catálogo público.`));
          if(a.bioEs?.trim())html=html.replaceAll(paragraphs(a.bioEn),paragraphs(a.bioEs));
          else html=html.replaceAll(paragraphs(a.bioEn),`<p class="translation-note">Biografía disponible en inglés.</p>${paragraphs(a.bioEn).replaceAll('<p>','<p lang="en">')}`);
          if(a.taglineEs&&a.taglineEn)html=html.replaceAll(esc(a.taglineEn),esc(a.taglineEs));
        }
        html=html.replaceAll('— Artist | LOWCUT// Records','— Artista | LOWCUT// Records');
        for(const r of releases){
          const oldDate=r.releaseDate?new Intl.DateTimeFormat('en-US',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(r.releaseDate+'T12:00:00Z')).toUpperCase():'';
          const newDate=r.releaseDate?new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(r.releaseDate+'T12:00:00Z')).toUpperCase():'';
          if(oldDate)html=html.replaceAll(oldDate,newDate);
          html=html.replaceAll(esc(`${r.title} by ${r.artists.join(' & ')}. ${r.label}.`),esc(`${r.title} de ${r.artists.join(' & ')}. ${r.label}.`));
          const englishBody=r.descriptionEn||r.description||`${r.title} by ${r.artists.join(' & ')}. ${r.label}.`;
          if(r.descriptionEs){
            html=html.replaceAll(paragraphs(englishBody),paragraphs(r.descriptionEs));
            const before=esc((r.descriptionEn||r.description||'').trim().replace(/\s+/g,' ').slice(0,180));
            const after=esc(r.descriptionEs.trim().replace(/\s+/g,' ').slice(0,180));
            if(before)html=html.replaceAll(`content="${before}"`,`content="${after}"`);
          }
          const englishCredits=r.creditsEn||r.credits;
          if(r.creditsEs&&englishCredits)html=html.replaceAll(`<p>${esc(englishCredits)}</p>`,`<p>${esc(r.creditsEs)}</p>`);
          const old=esc(`${r.title} by ${r.artists.join(' & ')} — ${r.label}${r.releaseDate?', released '+newDate:''}. Listen to the preview and find streaming links.`);
          const translated=esc(`${r.title} de ${r.artists.join(' & ')} — ${r.label}. ${newDate}. Descubrí su música y encontrá enlaces a plataformas.`);
          html=html.replaceAll(old,translated);
        }
        html=html.replaceAll('LOWCUT// Records — Independent Argentine Record Label','LOWCUT// Records — Sello discográfico independiente argentino');
        html=html.replaceAll('Discover LOWCUT// Records, an independent Argentine label for electronic, urban and experimental music. Explore artists, listen to releases and submit your demo.','Conocé LOWCUT// Records, sello argentino independiente de música electrónica, urbana y experimental. Descubrí artistas, escuchá lanzamientos y enviá tu demo.');
        html=html.replace('aria-label="Open menu"','aria-label="Abrir menú"').replace('aria-label="LOWCUT Records home"','aria-label="Inicio de LOWCUT Records"');
        const placeholders={'Artist / project name':'Artista / nombre del proyecto','Track title':'Título del tema','Genre, mood or references':'Género, clima o referencias','Short bio, context of the track and anything we should know':'Bio breve, contexto del tema y lo que quieras contarnos'};
        for(const [before,after] of Object.entries(placeholders))html=html.replace(`placeholder="${before}"`,`placeholder="${after}"`);
      }
      // Page identities remain unique in SEO results for each language.
      if(route.startsWith('lanzamientos/'))html=html.replace(/<title>(.*?)<\/title>/,`<title>$1 — ${lang==='es'?'Lanzamiento':'Release'}</title>`);
      html=html.replace('</head>',`<link rel="stylesheet" href="${base}cursor.css" /><link rel="stylesheet" href="${base}transitions.css" /><script src="${base}cursor.js" defer></script><script src="${base}site-ui.js" defer></script></head>`);
      const canonicalRoute=lang+'/'+route;pages.set(canonicalRoute+'index.html',html);canonicalRoutes.push(canonicalRoute);
      if(lang==='en')pages.set(file,html); // Preserve every previously shared URL.
    }
  }
  return {pages,canonicalRoutes};
}
