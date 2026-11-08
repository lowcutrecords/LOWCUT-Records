import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const prefix='/LOWCUT-Records/';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.xml':'application/xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
  if(pathname==='/'||pathname==='/LOWCUT-Records'){res.writeHead(302,{Location:prefix});return res.end();}
  if(!pathname.startsWith(prefix)){res.writeHead(404);return res.end();}
  let relative=pathname.slice(prefix.length);
  if(relative.split('/').some(p=>p.startsWith('.')||['src','scripts','data'].includes(p))){res.writeHead(404);return res.end();}
  let file=path.resolve(root,relative);
  if(file!==path.resolve(root) && !file.startsWith(root)){res.writeHead(403);return res.end();}
  try{
    let stat=fs.statSync(file);
    if(stat.isDirectory()){
      if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'});return res.end();}
      file=path.join(file,'index.html');stat=fs.statSync(file);
    }
    const type=types[path.extname(file)]||'application/octet-stream';
    const headers={'Content-Type':type,'Cache-Control':'no-store','X-Robots-Tag':'noindex','Accept-Ranges':'bytes'};
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if(range){
      const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;
      if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}
      res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${stat.size}`});
      if(req.method==='HEAD')return res.end();
      return fs.createReadStream(file,{start,end}).pipe(res);
    }
    res.writeHead(200,{...headers,'Content-Length':stat.size});
    if(req.method==='HEAD')return res.end();
    fs.createReadStream(file).pipe(res);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(4173,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:4173/LOWCUT-Records/ (preview server sends noindex; generated production HTML does not).'));
