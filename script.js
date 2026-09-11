const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

const translations = {
  en: {
    'nav.releases':'Releases','nav.artists':'Artists','nav.about':'About','nav.demo':'Submit Demo','nav.contact':'Contact',
    'hero.eyebrow':'INDEPENDENT LABEL · ARGENTINA','hero.title':'MUSIC FOR A<br/>DARKER TOMORROW.','hero.explore':'Explore releases','hero.demo':'Send a demo',
    'releases.title':'LATEST CUTS','releases.note':'Raw visuals. Distinct identities. No fixed genre.','releases.now':'NOW / NEXT','releases.manifestoTitle':'NEW SIGNALS.<br/>SAME ATTITUDE.','releases.manifestoText':'LOWCUT// is built around artists who want room to move between scenes, genres and ideas without losing identity.',
    'artists.title':'ARTISTS','artists.note':'Four emerging voices. One independent platform.',
    'about.title':'NO BOXES.<br/>JUST SOUND.','about.p1':'LOWCUT// Records is an independent Argentine label founded by Fayre and Dragho. The label is open to electronic, urban and experimental music, with one priority: helping each artist keep a recognizable identity.','about.p2':'LOWCUT// is not built around one genre. It is built around attitude, visual language, collaboration and music with character.','about.arg':'Based in Argentina','about.open':'Open genre policy','about.split':'Artist / label split',
    'demo.title':'SEND US<br/>SOMETHING<br/>REAL.','demo.text':'Electronic, urban, experimental or somewhere between. Send a private streaming link, a short artist bio and your contact information.','demo.success':'Demo sent. Thanks for sending your music to LOWCUT//.','demo.send':'SEND DEMO','demo.small':'Use a private streaming or download link. Please do not attach large files.',
    'contact.subtitle':'Independent music. Argentina.','footer.top':'BACK TO TOP ↑'
  },
  es: {
    'nav.releases':'Lanzamientos','nav.artists':'Artistas','nav.about':'Nosotros','nav.demo':'Enviar demo','nav.contact':'Contacto',
    'hero.eyebrow':'SELLO INDEPENDIENTE · ARGENTINA','hero.title':'MÚSICA PARA UN<br/>MAÑANA MÁS OSCURO.','hero.explore':'Ver lanzamientos','hero.demo':'Enviar un demo',
    'releases.title':'ÚLTIMOS LANZAMIENTOS','releases.note':'Visuales crudos. Identidades distintas. Sin género fijo.','releases.now':'AHORA / PRÓXIMO','releases.manifestoTitle':'NUEVAS SEÑALES.<br/>MISMA ACTITUD.','releases.manifestoText':'LOWCUT// está construido alrededor de artistas que quieren moverse entre escenas, géneros e ideas sin perder su identidad.',
    'artists.title':'ARTISTAS','artists.note':'Cuatro voces emergentes. Una plataforma independiente.',
    'about.title':'SIN CAJAS.<br/>SOLO SONIDO.','about.p1':'LOWCUT// Records es un sello independiente argentino fundado por Fayre y Dragho. El sello está abierto a música electrónica, urbana y experimental, con una prioridad: ayudar a cada artista a mantener una identidad reconocible.','about.p2':'LOWCUT// no está construido alrededor de un solo género. Está construido alrededor de actitud, lenguaje visual, colaboración y música con carácter.','about.arg':'Con base en Argentina','about.open':'Política de géneros abierta','about.split':'Reparto artista / sello',
    'demo.title':'MANDANOS<br/>ALGO<br/>REAL.','demo.text':'Electrónica, urbana, experimental o algo entre medio. Mandanos un link privado, una bio corta del artista y tu información de contacto.','demo.success':'Demo enviado. Gracias por compartir tu música con LOWCUT//.','demo.send':'ENVIAR DEMO','demo.small':'Usá un link privado de streaming o descarga. No adjuntes archivos pesados.',
    'contact.subtitle':'Música independiente. Argentina.','footer.top':'VOLVER ARRIBA ↑'
  }
};

function setLanguage(lang) {
  const dict = translations[lang] || translations.en;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (dict[key]) el.innerHTML = dict[key];
  });
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  localStorage.setItem('lowcut-language', lang);
}

document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
setLanguage(localStorage.getItem('lowcut-language') || 'en');
