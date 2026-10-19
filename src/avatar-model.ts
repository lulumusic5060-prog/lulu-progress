export type Chapter = {label: string; start: number};
export type AvatarConfig = {
  width: number; height: number; fps: number; duration: number;
  style: string; position: string; chapters: Chapter[]; labels: boolean;
  accent?: string; track?: string; ink?: string; image?: string; alternateImage?: string;
  avatarSize?: number; barHeight?: number; margin?: number; offset?: number;
  labelMode?: 'auto'|'all'|'current'; compact?: boolean; assetBase?: string;
};
export const avatarStyles = ['lulu', 'lulu-hop', 'lulu-cells'];
export function validateAvatar(p: AvatarConfig) {
  for (const key of ['width','height','fps','duration'] as const)
    if (!Number.isFinite(p[key]) || p[key] <= 0) throw Error(`${key} 必须大于 0`);
  if (![p.width,p.height].every(v=>Number.isInteger(v)&&v%2===0)) throw Error('画面宽高必须是正偶数');
  if (!['top','bottom'].includes(p.position)) throw Error('位置应为 top 或 bottom');
  if (!Array.isArray(p.chapters)||!p.chapters.length||p.chapters[0].start!==0) throw Error('第一章必须从 0 秒开始');
  p.chapters.forEach((c,i)=>{
    if (typeof c.label!=='string'||!c.label.trim()||!Number.isFinite(c.start)||c.start<0||c.start>=p.duration||(i>0&&c.start<=p.chapters[i-1].start)) throw Error('章节名称不能为空，时间须递增且小于总时长');
  });
  for (const key of ['accent','track','ink'] as const)
    if (p[key]!==undefined&&!/^#[\da-f]{6}$/i.test(p[key]!)) throw Error('颜色请使用六位十六进制格式');
  if (p.labelMode&&!['auto','all','current'].includes(p.labelMode)) throw Error('无效文字显示模式');
  for (const [key,min,max] of [['avatarSize',40,180],['barHeight',6,44],['margin',3,18],['offset',0,25]] as const)
    if (p[key]!==undefined&&(!Number.isFinite(p[key])||p[key]!<min||p[key]!>max)) throw Error(`${key} 超出允许范围 ${min}–${max}`);
  for (const key of ['image','alternateImage'] as const)
    if(p[key] && (p[key]!.startsWith('/')||p[key]!.includes('..')||p[key]!.includes(':')||p[key]!.includes('\\'))) throw Error('头像须为 public 内的相对路径');
}
export function avatarLayout(p: AvatarConfig) {
  const size=p.avatarSize??84, font=Math.min(27,p.width/40), pad=20;
  const stripHeight=Math.ceil((size+font+pad*3+16)/2)*2;
  const height=p.compact?stripHeight:p.height;
  const edge=(p.margin??5.5)*p.width/100;
  const y=p.compact?pad+size/2:p.position==='bottom'?height-(size/2+font+pad*2)-(p.offset??0)*height/100:size/2+pad+(p.offset??4)*height/100;
  return {size,font,height,edge,span:p.width-edge*2,y,labelY:y+size/2+font+12};
}
export function progressState(p: AvatarConfig, frame: number) {
  const last=Math.ceil(p.duration*p.fps)-1;
  const time=Math.min(p.duration,Math.max(0,frame)/p.fps);
  let active=0;
  p.chapters.forEach((c,i)=>{if(time>=c.start)active=i;});
  const start=p.chapters[active].start, end=p.chapters[active+1]?.start??p.duration;
  const local=frame>=last?1:Math.max(0,Math.min(1,(time-start)/(end-start)));
  const global=frame>=last?1:time/p.duration;
  return {time,active,local,global,last};
}
