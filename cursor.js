(() => {
  const cursor=document.querySelector('.custom-cursor');
  const fine=matchMedia('(pointer:fine)');
  if(!cursor)return;
  function update(event){
    if(!fine.matches||event.pointerType==='touch')return;
    cursor.style.left=event.clientX+'px';cursor.style.top=event.clientY+'px';
    document.documentElement.classList.add('has-custom-cursor');cursor.classList.add('is-visible');
    const target=event.target instanceof Element?event.target:null;
    const input=!!target?.closest('input,textarea,select,[contenteditable="true"]');
    cursor.classList.toggle('is-input',input);
    cursor.classList.toggle('is-hover',!input&&!!target?.closest('a,button,.release-card,summary,[role="button"]'));
  }
  document.addEventListener('pointermove',update,{passive:true});
  document.addEventListener('pointerover',update,{passive:true});
  document.addEventListener('pointerleave',()=>cursor.classList.remove('is-visible'));
  fine.addEventListener('change',()=>{if(!fine.matches){document.documentElement.classList.remove('has-custom-cursor');cursor.classList.remove('is-visible');}});
})();
