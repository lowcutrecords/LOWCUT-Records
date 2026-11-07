// Static catalogue enhancement only: never fetch or replace the HTML catalogue.
(() => {
  function refresh() {
    const es=document.documentElement.lang==='es';
    const artists=JSON.parse(document.getElementById('public-artist-data')?.textContent||'[]');
    document.querySelectorAll('[data-public-artist]').forEach(card=>{
      const a=artists.find(a=>a.id===card.dataset.publicArtist);if(!a)return;
      card.querySelector('[data-artist-meta]').textContent=(es?a.taglineEs:a.taglineEn)||[a.genres.join(' / '),a.location].filter(Boolean).join(' / ');
      const bio=(es?a.bioEs:a.bioEn)||a.bioEn;
      card.querySelector('[data-artist-bio]').replaceChildren(...bio.split(/\n\s*\n/).filter(Boolean).map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));
    });
    document.querySelectorAll('[data-public-roster-note]').forEach(el=>el.textContent=es?`${artists.length} artistas. Una plataforma independiente.`:`${artists.length} artists. One independent platform.`);
    document.querySelectorAll('[data-release-date]').forEach(el=>{
      const value=el.dataset.releaseDate;
      const date=value?new Intl.DateTimeFormat(es?'es-AR':'en-US',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')).toUpperCase():'';
      el.textContent=`${date} · ${el.dataset.label || 'LOWCUT//'}`;
    });
    document.querySelectorAll('[data-public-status]').forEach(el=>{
      const linked=el.tagName==='A',status=el.dataset.publicStatus;
      el.textContent=status==='released'?(linked?(es?'ESCUCHAR AHORA':'LISTEN NOW'):(es?'DISPONIBLE AHORA':'OUT NOW')):status==='presave'?'PRE-SAVE':(es?'PRÓXIMAMENTE':'COMING SOON');
      if(linked)el.textContent+=' ↗';
    });
    document.querySelectorAll('[data-profile-link]').forEach(el=>el.textContent=es?'PERFIL DEL ARTISTA ↗':'ARTIST PROFILE ↗');
  }
  refresh();
  document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>setTimeout(refresh,0)));
})();
