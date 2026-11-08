export function responsiveImages(pages,{variants,base}){
  const images=new Map();for(const [original,row]of Object.entries(variants)){images.set(original,row);images.set(row.path,row);}
  for(const [file,html]of pages)pages.set(file,html.replace(/<img\b[^>]*>/g,tag=>{
    const src=tag.match(/\bsrc="([^"]+)"/)?.[1];if(!src)return tag;
    const relative=src.startsWith(base)?decodeURIComponent(src.slice(base.length)):src;
    const row=images.get(relative);if(!row){const priority=/class="[^"]*detail-(?:portrait|cover)/.test(tag);return /\bloading=/.test(tag)?tag:tag.replace(/\s*\/?\s*>$/,priority?' loading="eager" fetchpriority="high" decoding="async" />':' loading="lazy" decoding="async" />');}
    const add=[];if(!/\bwidth=/.test(tag))add.push(`width="${row.width}"`);if(!/\bheight=/.test(tag))add.push(`height="${row.height}"`);
    if(!/\bdecoding=/.test(tag))add.push('decoding="async"');
    const hero=/class="[^"]*hero-art/.test(tag),detail=/class="[^"]*detail-(?:portrait|cover)/.test(tag);
    if(hero||detail){add.push('fetchpriority="high"','loading="eager"');tag=tag.replace(/\sloading="[^"]*"/,'');}
    else if(!/\bloading=/.test(tag))add.push('loading="lazy"');
    if(row.responsive?.length){
      const candidates=[...row.responsive,{path:row.path,width:row.width}];add.push(`srcset="${candidates.map(v=>base+v.path.split('/').map(encodeURIComponent).join('/')+' '+v.width+'w').join(', ')}"`);
      add.push(`sizes="${hero?'100vw':/artist poster|detail-portrait|detail-cover/.test(tag)?'(max-width: 700px) 100vw, 50vw':'(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw'}"`);
    }
    return tag.replace(/\s*\/?\s*>$/,' '+add.join(' ')+' />');
  }));return pages;
}
