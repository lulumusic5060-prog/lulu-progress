import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {existsSync,createReadStream} from 'node:fs';
import {resolve,dirname,extname,basename,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {build} from 'esbuild';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),cache=resolve(root,'.cache/editor'),out=resolve(root,'out');
const port=Number(process.env.PORT??4318);
await mkdir(cache,{recursive:true});await mkdir(out,{recursive:true});
await build({entryPoints:[resolve(root,'editor/app.tsx')],bundle:true,outfile:resolve(cache,'app.js'),platform:'browser',define:{'process.env.NODE_ENV':'"production"'},logLevel:'warning'});
await build({entryPoints:[resolve(root,'src/avatar-model.ts')],bundle:true,outfile:resolve(cache,'model.mjs'),platform:'node',format:'esm'});
const {validateAvatar}=await import(pathToFileURL(resolve(cache,'model.mjs')));
const jobs=new Map();
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
async function body(req,limit=1024*1024){let size=0;const chunks=[];for await(const b of req){size+=b.length;if(size>limit)throw Error('文件过大：头像最多 10 MB，字幕/配置最多 1 MB');chunks.push(b);}return Buffer.concat(chunks);}
function safePath(base,path){const p=resolve(base,path);if(p!==base&&!p.startsWith(base+sep))throw Error('无效路径');return p;}
async function file(res,path,attachment=false){const info=await stat(path);if(!info.isFile())throw Error('文件不存在');const type={'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.mov':'video/quicktime','.webm':'video/webm'}[extname(path)]??'application/octet-stream';res.writeHead(200,{'Content-Type':type,'Content-Length':info.size,...(attachment?{'Content-Disposition':`attachment; filename="${basename(path)}"`}:{})});createReadStream(path).pipe(res);}
const server=createServer(async(req,res)=>{
 try{
  if(req.headers.host!==`127.0.0.1:${port}`&&req.headers.host!==`localhost:${port}`)return json(res,403,{error:'请使用本地地址'});
  if(req.method==='POST'&&req.headers.origin&& ![`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin))return json(res,403,{error:'仅接受本地页面请求'});
  const url=new URL(req.url,`http://127.0.0.1:${port}`),path=decodeURIComponent(url.pathname);
  if(req.method==='GET'){
   if(path==='/')return await file(res,resolve(root,'editor/index.html'));
   if(path==='/app.js')return await file(res,resolve(cache,'app.js'));
   if(path==='/editor.css')return await file(res,resolve(root,'editor/editor.css'));
   if(path.startsWith('/assets/'))return await file(res,safePath(resolve(root,'public'),path.slice(8)));
   if(path.startsWith('/downloads/'))return await file(res,safePath(out,path.slice(11)),true);
   if(path.startsWith('/api/jobs/')){const job=jobs.get(path.split('/').pop());return json(res,job?200:404,job??{error:'找不到该任务'});}
   return json(res,404,{error:'未找到页面'});
  }
  if(req.method!=='POST')return json(res,405,{error:'不支持的方法'});
  if(path==='/api/avatar'){
   const b=await body(req,10*1024*1024);let ext;
   if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';
   else if(b[0]===255&&b[1]===216&&b[2]===255)ext='jpg';
   else if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')ext='webp';
   else throw Error('请选择有效的 PNG、JPG 或 WebP 图片');
   const relative=`uploads/avatar-${randomUUID()}.${ext}`;await mkdir(resolve(root,'public/uploads'),{recursive:true});await writeFile(resolve(root,'public',relative),b);return json(res,200,{path:relative});
  }
  if(path==='/api/subtitles'){
   const text=(await body(req)).toString('utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
   const regex=/((?:\d{2,}:)?\d{2}:\d{2}[,.]\d{3})\s*-->\s*((?:\d{2,}:)?\d{2}:\d{2}[,.]\d{3})[^\n]*\n([\s\S]*?)(?=\n\s*\n|$)/g;
   const seconds=s=>s.replace(',','.').split(':').reduce((a,b)=>a*60+Number(b),0),cues=[];
   for(const m of text.matchAll(regex)){const start=seconds(m[1]),end=seconds(m[2]);if(end<=start)throw Error('字幕结束时间须晚于开始时间');cues.push({start,end,text:m[3].replace(/<[^>]*>/g,'').trim()});}
   if(!cues.length)throw Error('未找到带时间码的 SRT / VTT 字幕');cues.sort((a,b)=>a.start-b.start);
   const chapters=[{label:'开场',start:0}];
   for(let i=1;i<cues.length&&chapters.length<8;i++)if(cues[i].start-cues[i-1].end>=1.2&&cues[i].start-chapters.at(-1).start>=8)chapters.push({label:`章节${chapters.length+1}`,start:cues[i].start});
   return json(res,200,{count:cues.length,durationEstimate:Math.max(...cues.map(c=>c.end)),chapters});
  }
  if(path==='/api/render'){
   if([...jobs.values()].some(j=>j.state==='running'))throw Error('已有视频正在导出，请等待完成');
   const p=JSON.parse((await body(req)).toString('utf8'));validateAvatar(p);
   const format=p.exportFormat==='webm'?'webm':'mov';delete p.exportFormat;
   if(!['lulu','lulu-hop','lulu-cells'].includes(p.style))throw Error('请选择头像主题');
   if(p.width>3840||p.height>3840||p.duration>3600||p.fps>60)throw Error('本地编辑器支持最长一小时、最高 3840 像素和 60 帧');
   delete p.assetBase;
   for(const image of [p.image,p.alternateImage].filter(Boolean))if(!existsSync(safePath(resolve(root,'public'),image)))throw Error('头像文件不存在，请重新上传');
   const id=randomUUID(),configName=`lulu-${id}.json`,videoName=`lulu-${id}.${format}`,configPath=resolve(out,configName),videoPath=resolve(out,videoName);
   await writeFile(configPath,JSON.stringify(p,null,2));
   const job={id,state:'running',progress:'准备中',config:`/downloads/${configName}`,video:`/downloads/${videoName}`};jobs.set(id,job);
   const child=spawn(process.execPath,[resolve(root,'scripts/export.mjs'),configPath,videoPath],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});let tail='';
   const log=data=>{const value=data.toString();tail=(tail+value).slice(-4000);const m=[...value.matchAll(/(?:Rendered|Encoded) (\d+)\/(\d+)/g)].at(-1);if(m)job.progress=`${m[1]} / ${m[2]} 帧`;};child.stdout.on('data',log);child.stderr.on('data',log);
   child.on('error',e=>{job.state='failed';job.error=e.message;});child.on('close',async code=>{if(code===0&&existsSync(videoPath)){job.bytes=(await stat(videoPath)).size;job.state='done';}else{job.state='failed';job.error=tail.replace(/\u001b\[[0-9;]*m/g,'').slice(-1500)||'渲染进程退出';}});
   return json(res,200,job);
  }
  json(res,404,{error:'接口不存在'});
 }catch(e){if(!res.headersSent)json(res,400,{error:e.message});else res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`LuLu Progress 本地编辑器：http://127.0.0.1:${port}`));
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
