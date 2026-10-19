import React,{useState,useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {Player,PlayerRef} from '@remotion/player';
import {AvatarBar} from '../src/avatar';
import {AvatarConfig,avatarLayout,validateAvatar} from '../src/avatar-model';
import initial from '../examples/demo.json';
const themes=[['lulu','连续滑动','头像沿时间轴平稳前进','↗'],['lulu-hop','章节跳跃','进入新章节，头像轻轻一跳','⌁'],['lulu-cells','分段填充','每一章一格，逐段点亮','▤']];
const stamp=(s:number)=>`${Math.floor(s/60)}:${(s%60).toFixed(3).padStart(6,'0').replace(/\.000$/,'')}`;
const formatChapters=(p:AvatarConfig)=>p.chapters.map(c=>`${stamp(c.start)} ${c.label}`).join('\n');
function parseChapters(text:string){return text.trim().split('\n').filter(l=>l.trim()).map(line=>{
 const m=line.trim().match(/^(\d+(?::\d+){0,2}(?:\.\d+)?)\s+(.+)$/);if(!m)throw Error('章节格式示例：0:00 开场，每行一章');
 const start=m[1].split(':').reduce((n,v)=>n*60+Number(v),0);return {start,label:m[2].trim()};
});}
async function request(url:string,options?:RequestInit){const r=await fetch(url,options),d=await r.json();if(!r.ok)throw Error(d.error??'操作失败');return d;}
function App(){
 const [p,setP]=useState<AvatarConfig>(initial as AvatarConfig),[draft,setDraft]=useState(formatChapters(initial as AvatarConfig));
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[bg,setBg]=useState('light'),[strip,setStrip]=useState(true),[busy,setBusy]=useState(false),[exportFormat,setExportFormat]=useState('mov'),[job,setJob]=useState<any>(null);
 const player=useRef<PlayerRef>(null);const [frame,setFrame]=useState(0),[playing,setPlaying]=useState(false);
 useEffect(()=>{const timer=setInterval(()=>{if(player.current){setFrame(player.current.getCurrentFrame());setPlaying(player.current.isPlaying());}},120);return()=>clearInterval(timer);},[]);
 const change=(v:Partial<AvatarConfig>)=>setP(prev=>({...prev,...v}));
 const commit=(c:AvatarConfig)=>{validateAvatar(c);setP(c);setDraft(formatChapters(c));setError('');};
 useEffect(()=>{const raw=localStorage.getItem('lulu-progress-v2');if(raw)try{commit(JSON.parse(raw));}catch{}},[]);
 useEffect(()=>{localStorage.setItem('lulu-progress-v2',JSON.stringify(p));},[p]);
 useEffect(()=>{if(!job||job.state!=='running')return;const timer=setInterval(()=>request(`/api/jobs/${job.id}`).then(setJob).catch(e=>setError(e.message)),1500);return()=>clearInterval(timer);},[job?.id,job?.state]);
 const action=async(fn:()=>Promise<void>)=>{setError('');setBusy(true);try{await fn();}catch(e:any){setError(e.message);}finally{setBusy(false);}};
 const upload=(file:File|undefined,alternate=false)=>{if(!file)return;action(async()=>{const d=await request('/api/avatar',{method:'POST',headers:{'Content-Type':file.type},body:file});change(alternate?{alternateImage:d.path}:{image:d.path,alternateImage:undefined});setMessage('头像已保存到本地项目，预览和导出均使用这张图片。');});};
 const apply=()=>{try{commit({...p,chapters:parseChapters(draft)});setMessage('章节已应用，预览已同步。');}catch(e:any){setError(e.message);}};
 const download=()=>{try{const c={...p,chapters:parseChapters(draft)};validateAvatar(c);const url=URL.createObjectURL(new Blob([JSON.stringify(c,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='lulu-config.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e:any){setError(e.message);}};
 const render=()=>action(async()=>{const c={...p,chapters:parseChapters(draft),compact:strip};validateAvatar(c);commit(c);const d=await request('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...c,exportFormat})});setJob(d);setMessage('开始导出。你可以继续预览；本次导出使用点击时的设置。');});
 const inputProps={...p,compact:strip,assetBase:'/assets/'};
 const layout=avatarLayout(inputProps),frames=Math.ceil(p.duration*p.fps),running=job?.state==='running';
 return <><header><div className='brand'>LuLu<span> Progress</span> <small>STUDIO / 02</small></div><small>你的头像 · 你的配色 · 你的进度</small></header><main>
 <div className='intro'><div><div className='eyebrow'>MAKE IT YOURS</div><h1>让进度，有你的样子。</h1><p>选一个喜欢的动作，把你的 IP 放进视频里。</p></div><span className='badge'>本地创作 · 文件保存在电脑</span></div>
 <div className='workspace'><aside>
 <section className='card'><h2><span className='step'>01</span>选择你的节奏</h2><div className='themes'>{themes.map(([style,name,desc,icon])=><button key={style} className={`theme ${p.style===style?'selected':''}`} onClick={()=>change({style})}><i>{icon}</i><span><b>{name}</b><small>{desc}</small></span></button>)}</div></section>
 <section className='card'><h2><span className='step'>02</span>换上你的头像</h2><label className='upload'>＋ 上传头像 · PNG / JPG / WebP<input aria-label='上传头像' type='file' accept='image/png,image/jpeg,image/webp' onChange={e=>upload(e.target.files?.[0])}/></label><div className='avatar-status'>{p.image&&<img src={`/assets/${p.image}`}/>}<span className='hint'>{p.image?'已设置头像，可上传替换':'当前使用内置星星'}</span><button className='btn' onClick={()=>change({image:undefined,alternateImage:undefined})}>用星星</button></div><details><summary>添加另一种表情（可选）</summary><label className='upload'>上传第二张表情<input aria-label='上传第二张表情' type='file' accept='image/png,image/jpeg,image/webp' onChange={e=>upload(e.target.files?.[0],true)}/></label><p className='hint'>进入新章节时交替切换。图片采用圆形裁切，保留原图背景。</p>{p.alternateImage&&<button className='btn' onClick={()=>change({alternateImage:undefined})}>取消第二表情</button>}</details>
 <label>头像大小 <span className='counter'>{p.avatarSize??84}px</span></label><input aria-label='头像大小' type='range' min='40' max='180' value={p.avatarSize??84} onChange={e=>change({avatarSize:+e.target.value})}/>
 <div className='row'>{(['accent','track','ink'] as const).map((key,i)=><div key={key}><label>{['主色','底色','文字'][i]}</label><input aria-label={['主色','底色','文字'][i]} type='color' value={p[key]??'#e52a85'} onChange={e=>change({[key]:e.target.value})}/></div>)}</div>
 <label>进度条粗细 <span className='counter'>{p.barHeight??24}px</span></label><input aria-label='进度条粗细' type='range' min='6' max='44' value={p.barHeight??24} onChange={e=>change({barHeight:+e.target.value})}/>
 </section>
 <section className='card'><h2><span className='step'>03</span>字幕与章节</h2><label className='upload'>导入 SRT / VTT 字幕<input aria-label='导入字幕' type='file' accept='.srt,.vtt' onChange={e=>{const f=e.target.files?.[0];if(f)action(async()=>{const d=await request('/api/subtitles',{method:'POST',body:await f.text()});const c={...p,duration:d.durationEstimate,chapters:d.chapters};commit(c);setMessage(`读到 ${d.count} 条字幕。总时长暂取最后字幕结束；章节按停顿建议，请检查标题与时间，或交给 AI 按内容整理。`);});}}/></label>
 <label>视频真实总时长（秒）</label><input aria-label='总时长' className='field' type='number' min='.1' step='.001' value={p.duration} onChange={e=>{const v=+e.target.value;if(v>0)change({duration:v});}}/><p className='hint'>字幕可能不含片尾，请用最终视频时长核对。</p>
 <label>章节开始时间与标题</label><textarea aria-label='章节内容' rows={6} value={draft} onChange={e=>setDraft(e.target.value)}/><button className='btn' onClick={apply}>应用章节</button><p className='hint'>每行一章，如 0:00 开场。第一章从 0 开始。</p>
 <label className='inline-check'><input type='checkbox' checked={p.labels} onChange={e=>change({labels:e.target.checked})}/>显示章节标题</label><select aria-label='标题模式' value={p.labelMode??'auto'} onChange={e=>change({labelMode:e.target.value as any})}><option value='auto'>自动排版 · 拥挤时只显示当前章</option><option value='current'>只显示当前章节</option><option value='all'>显示全部 · 自动缩小字号</option></select>
 <details style={{marginTop:16}}><summary>导入已有配置</summary><input aria-label='导入配置' type='file' accept='.json' onChange={e=>{const f=e.target.files?.[0];if(f)action(async()=>{const c=JSON.parse(await f.text());if(!themes.some(t=>t[0]===c.style))throw Error('编辑器支持三款头像主题');commit(c);setStrip(!!c.compact);setMessage('配置已加载。自定义头像需在同一项目的 public 中。');});}}/></details>
 </section></aside>
 <div><section className='card preview-card'><div className='preview-top'><h2>实时预览</h2><span className='badge'>和导出使用同一套动画</span></div><div className={`stage ${bg}`}><div className='player-wrap'><Player ref={player} component={AvatarBar} inputProps={inputProps} compositionWidth={p.width} compositionHeight={layout.height} fps={p.fps} durationInFrames={frames} loop style={{width:'100%',maxHeight:'100%',aspectRatio:`${p.width}/${layout.height}`}}/></div></div>
 <div className='preview-bottom'><div className='row' style={{marginBottom:16}}><button className='btn' style={{flex:'0 0 66px'}} onClick={()=>player.current?.toggle()}>{playing?'暂停':'播放'}</button><input aria-label='预览进度' type='range' min='0' max={frames-1} value={Math.min(frame,frames-1)} onChange={e=>{player.current?.seekTo(+e.target.value);setFrame(+e.target.value);}}/><span className='counter' style={{flex:'0 0 70px'}}>{stamp(frame/p.fps)}</span></div><div className='summary'><span>{p.width} × {layout.height} · {p.fps} 帧 · {stamp(p.duration)}</span><span>{p.chapters.length} 个章节</span></div><div className='switches'>{[['dark','深色背景'],['light','浅色背景'],['checker','透明网格']].map(([v,label])=><button key={v} className={bg===v?'active':''} onClick={()=>setBg(v)}>{label}</button>)}</div>
 <div className='row'><div><label>视频比例</label><select aria-label='视频比例' value={`${p.width}x${p.height}`} onChange={e=>{const [width,height]=e.target.value.split('x').map(Number);change({width,height});}}><option value='1080x1920'>9:16 竖屏</option><option value='1920x1080'>16:9 横屏</option><option value='1080x1080'>1:1 方形</option><option value='1440x1080'>4:3 横屏</option>{!['1080x1920','1920x1080','1080x1080','1440x1080'].includes(`${p.width}x${p.height}`)&&<option value={`${p.width}x${p.height}`}>自定义 {p.width} × {p.height}</option>}</select></div><div><label>放置位置（完整画布）</label><select aria-label='放置位置' value={p.position} onChange={e=>change({position:e.target.value})}><option value='top'>顶部</option><option value='bottom'>底部</option></select></div></div>
 {!strip&&<><label>距离边缘 <span className='counter'>{p.offset??4}%</span></label><input aria-label='距离边缘' type='range' min='0' max='25' value={p.offset??4} onChange={e=>change({offset:+e.target.value})}/></>}
 <label className='inline-check'><input type='checkbox' checked={strip} onChange={e=>setStrip(e.target.checked)}/>紧凑透明素材 · 只导出进度条区域</label><p className='hint'>{strip?'导入剪映后，手动拖到顶部或底部。不要拉伸素材时长。':'按所选视频比例导出，起点对齐即可。预览背景不会进入导出。'}</p>
 {error&&<div role='alert' className='notice error'>{error}</div>}{message&&<div role='status' className='notice'>{message}</div>}
 <label>导出格式</label><select aria-label='导出格式' value={exportFormat} onChange={e=>setExportFormat(e.target.value)}><option value='mov'>透明 MOV · 剪辑素材，文件较大</option><option value='webm'>透明 WebM · 轻量，须确认剪辑软件支持</option></select><div className='export-row'><button className='btn wide' onClick={download}>保存可编辑配置</button><button className='btn primary wide' disabled={busy||running} onClick={render}>{running?'正在导出…':'导出透明视频 ↗'}</button></div>
 {job&&<div className='notice'>{job.state==='running'?`渲染中 ${job.progress??''}`:job.state==='done'?<div className='downloads'><b>透明视频已生成</b><a href={job.video} download>下载透明视频 · {(job.bytes/1024/1024).toFixed(1)} MB</a><a href={job.config} download>下载本次配置</a></div>:<span>导出失败：{job.error}。请检查运行依赖，设置已保留。</span>}</div>}
 </div></section></div></div></main><footer>LuLu Progress · 预览背景不参与导出 · 基于 Video Progress Studio / MIT</footer></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
