const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

const demoButton = document.querySelector('#demoButton');
const demoStatus = document.querySelector('#demoStatus');
demoButton?.addEventListener('click', async () => {
  const template = `Subject: LOWCUT// Demo Submission\n\nArtist name:\nTrack title:\nPrivate link:\nGenre / influences:\nShort bio:\nInstagram / Spotify:\nContact email:`;
  try {
    await navigator.clipboard.writeText(template);
    demoStatus.textContent = 'Demo email template copied.';
  } catch {
    demoStatus.textContent = 'Copy this structure manually: Artist / Track / Private link / Genre / Bio / Socials / Email.';
  }
});
