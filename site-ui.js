(() => {
  const es=document.documentElement.lang==='es';
  const words=es?{play:'ESCUCHAR PREVIEW ▶',stop:'DETENER PREVIEW ■',hover:'PASÁ PARA ESCUCHAR',playing:'REPRODUCIENDO · ',click:'TOCÁ PARA ESCUCHAR'}:{play:'PLAY PREVIEW ▶',stop:'STOP PREVIEW ■',hover:'HOVER TO PREVIEW',playing:'NOW PLAYING · ',click:'CLICK TO PREVIEW'};
  // Remember the selection, but the page URL always determines its language.
  try{localStorage.setItem('lowcut-language',es?'es':'en');}catch{}
  let activeCard=null,activeAudio=null;
  const label=card=>card.querySelector('.release-audio-badge span:last-child');
  function stop(){
    if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;}
    if(activeCard){activeCard.classList.remove('is-playing');const badge=label(activeCard);if(badge)badge.textContent=words.hover;const button=activeCard.querySelector('.mobile-preview-btn');if(button)button.textContent=words.play;}
    activeAudio=null;activeCard=null;
  }
  function start(card){
    if(activeCard===card&&activeAudio&&!activeAudio.paused)return;
    stop();const audio=new Audio(card.dataset.audio);audio.preload='auto';audio.volume=.72;
    activeAudio=audio;activeCard=card;card.classList.add('is-playing');
    if(label(card))label(card).textContent=words.playing+(card.dataset.track||'PREVIEW');
    audio.addEventListener('ended',stop,{once:true});
    audio.play().catch(()=>{if(activeAudio!==audio)return;stop();if(label(card))label(card).textContent=words.click;});
  }
  document.querySelectorAll('.release-card[data-audio]').forEach(card=>{
    if(matchMedia('(pointer:fine)').matches){card.addEventListener('mouseenter',()=>start(card));card.addEventListener('mouseleave',()=>{if(activeCard===card)stop();});}
    card.querySelector('.mobile-preview-btn')?.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      if(activeCard===card&&activeAudio&&!activeAudio.paused)stop();else{start(card);if(activeCard===card)event.currentTarget.textContent=words.stop;}
    });
  });
  // Native player and card previews never play simultaneously.
  document.querySelectorAll('audio').forEach(audio=>audio.addEventListener('play',stop));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
})();
