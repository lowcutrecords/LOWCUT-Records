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
    'artist.fayre.meta':'ELECTRONIC / SANTA FE','artist.fayre.p1':'Fayre is a young Argentinian electronic music producer from Santa Fe, bringing a fresh and distinctive energy to the emerging electronic scene. At 16, his sound moves through Melodic Techno, House and Hard Techno, driven by atmosphere, emotion and powerful club rhythms.','artist.fayre.p2':'His approach is built around experimentation, immersive melodies, solid basslines and evolving arrangements. Rather than staying inside one genre, Fayre uses every release to explore a different side of electronic music while shaping a clear artistic identity.',
    'artist.dragho.meta':'MELODIC / CHACO','artist.dragho.p1':'Dragho is an Argentine electronic music producer from Chaco focused on melodic and club-oriented sounds. He blends emotional atmospheres with driving rhythms to create music that works on the dancefloor while remaining immersive and expressive.','artist.dragho.p2':'His productions combine melodic richness and energetic beats, giving his work a distinctive identity within modern electronic music.',
    'artist.zanx.meta':'PRODUCER / BEATMAKER','artist.zanx.p1':'Zanx is an Argentine producer and beatmaker whose sound is defined by energy, melody and atmosphere. Drawing from trap, phonk and experimental music, he gives each production a distinct identity.','artist.zanx.p2':'He is currently preparing his debut EP as a producer, marking a new chapter in the evolution of his sound.',
    'artist.dro.meta':'TRAP / EXPERIMENTAL URBAN','artist.dro.p1':'Dro is a 15-year-old Argentine artist from Santa Fe who began making music in 2024. His work focuses on trap and experimental urban sounds, with a constant search for a personal identity within a new generation of emerging artists.','artist.dro.p2':'He currently works alongside Fayre on projects that connect electronic and urban influences through collaboration and experimentation.',
    'about.title':'NO BOXES.<br/>JUST SOUND.','about.p1':'LOWCUT// Records is an independent Argentine label founded by Fayre and Dragho. The label is open to electronic, urban and experimental music, with one priority: helping each artist keep a recognizable identity.','about.p2':'LOWCUT// is not built around one genre. It is built around attitude, visual language, collaboration and music with character.','about.arg':'Based in Argentina','about.open':'Open genre policy','about.split':'Artist / label split',
    'demo.artistName':'ARTIST NAME','demo.email':'EMAIL','demo.trackTitle':'TRACK TITLE','demo.privateLink':'PRIVATE LINK','demo.genre':'GENRE / INFLUENCES','demo.message':'MESSAGE','demo.title':'SEND US<br/>SOMETHING<br/>REAL.','demo.text':'Electronic, urban, experimental or somewhere between. Send a private streaming link, a short artist bio and your contact information.','demo.success':'Demo sent. Thanks for sending your music to LOWCUT//.','demo.send':'SEND DEMO','demo.small':'Use a private streaming or download link. Please do not attach large files.',
    'contact.subtitle':'Independent music. Argentina.','footer.top':'BACK TO TOP ↑'
  },
  es: {
    'nav.releases':'Lanzamientos','nav.artists':'Artistas','nav.about':'Nosotros','nav.demo':'Enviar demo','nav.contact':'Contacto',
    'hero.eyebrow':'SELLO INDEPENDIENTE · ARGENTINA','hero.title':'MÚSICA PARA UN<br/>MAÑANA MÁS OSCURO.','hero.explore':'Ver lanzamientos','hero.demo':'Enviar un demo',
    'releases.title':'ÚLTIMOS LANZAMIENTOS','releases.note':'Visuales crudos. Identidades distintas. Sin género fijo.','releases.now':'AHORA / PRÓXIMO','releases.manifestoTitle':'NUEVAS SEÑALES.<br/>MISMA ACTITUD.','releases.manifestoText':'LOWCUT// está construido alrededor de artistas que quieren moverse entre escenas, géneros e ideas sin perder su identidad.',
    'artists.title':'ARTISTAS','artists.note':'Cuatro voces emergentes. Una plataforma independiente.',
    'artist.fayre.meta':'ELECTRÓNICA / SANTA FE','artist.fayre.p1':'Fayre es un joven productor argentino de música electrónica de Santa Fe, con una energía fresca y distintiva dentro de la escena emergente. A sus 16 años, su sonido se mueve entre el Melodic Techno, el House y el Hard Techno, impulsado por la atmósfera, la emoción y ritmos potentes de club.','artist.fayre.p2':'Su enfoque se basa en la experimentación, melodías inmersivas, líneas de bajo sólidas y arreglos en constante evolución. En lugar de limitarse a un solo género, Fayre utiliza cada lanzamiento para explorar una faceta diferente de la música electrónica mientras construye una identidad artística propia.',
    'artist.dragho.meta':'MELÓDICO / CHACO','artist.dragho.p1':'Dragho es un productor argentino de música electrónica de Chaco enfocado en sonidos melódicos y orientados al club. Combina atmósferas emocionales con ritmos contundentes para crear música que funciona en la pista de baile sin dejar de ser inmersiva y expresiva.','artist.dragho.p2':'Sus producciones combinan riqueza melódica y beats enérgicos, dando a su trabajo una identidad distintiva dentro de la música electrónica moderna.',
    'artist.zanx.meta':'PRODUCTOR / BEATMAKER','artist.zanx.p1':'Zanx es un productor y beatmaker argentino cuyo sonido se define por la energía, la melodía y la atmósfera. Con influencias del trap, phonk y la música experimental, busca darle a cada producción una identidad propia.','artist.zanx.p2':'Actualmente está preparando su EP debut como productor, marcando una nueva etapa en la evolución de su sonido.',
    'artist.dro.meta':'TRAP / URBANO EXPERIMENTAL','artist.dro.p1':'Dro es un artista argentino de 15 años de Santa Fe que comenzó a hacer música en 2024. Su trabajo se centra en el trap y los sonidos urbanos experimentales, con una búsqueda constante de una identidad personal dentro de una nueva generación de artistas emergentes.','artist.dro.p2':'Actualmente trabaja junto a Fayre en proyectos que conectan influencias electrónicas y urbanas mediante la colaboración y la experimentación.',
    'about.title':'SIN CAJAS.<br/>SOLO SONIDO.','about.p1':'LOWCUT// Records es un sello independiente argentino fundado por Fayre y Dragho. El sello está abierto a música electrónica, urbana y experimental, con una prioridad: ayudar a cada artista a mantener una identidad reconocible.','about.p2':'LOWCUT// no está construido alrededor de un solo género. Está construido alrededor de actitud, lenguaje visual, colaboración y música con carácter.','about.arg':'Con base en Argentina','about.open':'Política de géneros abierta','about.split':'Reparto artista / sello',
    'demo.artistName':'NOMBRE ARTÍSTICO','demo.email':'EMAIL','demo.trackTitle':'TÍTULO DEL TEMA','demo.privateLink':'LINK PRIVADO','demo.genre':'GÉNERO / INFLUENCIAS','demo.message':'MENSAJE','demo.title':'MANDANOS<br/>ALGO<br/>REAL.','demo.text':'Electrónica, urbana, experimental o algo entre medio. Mandanos un link privado, una bio corta del artista y tu información de contacto.','demo.success':'Demo enviado. Gracias por compartir tu música con LOWCUT//.','demo.send':'ENVIAR DEMO','demo.small':'Usá un link privado de streaming o descarga. No adjuntes archivos pesados.',
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
  document.querySelectorAll('.lang-btn').forEach(btn => { const active = btn.dataset.lang === lang; btn.classList.toggle('active', active); btn.setAttribute('aria-pressed', String(active)); });
  localStorage.setItem('lowcut-language', lang);
}

document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
setLanguage(localStorage.getItem('lowcut-language') || 'en');
