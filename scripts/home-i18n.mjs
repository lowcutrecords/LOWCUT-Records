// Parse the existing literal translation dictionary without executing page JavaScript.
export function homeTranslations(template){
  const match=template.match(/const translations = (\{[\s\S]*?\n    \});\s*\n\s*const setLang/);
  if(!match)throw new Error('Home translation dictionary not found');
  const json=match[1].replace(/'((?:\\.|[^'\\])*)'/g,(_,text)=>JSON.stringify(text.replace(/\\(['\\nrt"])/g,(_,c)=>({n:'\n',r:'\r',t:'\t'}[c]??c))))
    .replace(/^(\s*)(en|es):\s*\{/gm,'$1"$2": {');
  return JSON.parse(json);
}
export function translateHome(html,lang,dictionaries,escape){
  return html.replace(/<([a-z][a-z0-9-]*)\b([^>]*\b(data-i18n(?:-html)?)="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi,(whole,tag,attrs,kind,key)=>{
    const value=dictionaries[lang][key];if(value===undefined)throw new Error(`Missing ${lang} home translation: ${key}`);
    return `<${tag}${attrs}>${kind==='data-i18n-html'?value:escape(value)}</${tag}>`;
  });
}
