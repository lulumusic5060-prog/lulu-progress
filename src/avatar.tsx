import React from 'react';
import {AbsoluteFill,Img,staticFile,useCurrentFrame} from 'remotion';
import {AvatarConfig,avatarLayout,progressState} from './avatar-model';

export const AvatarBar=(p:AvatarConfig)=>{
 const frame=useCurrentFrame(), s=progressState(p,frame), l=avatarLayout(p);
 const {width:W,chapters}=p,n=chapters.length;
 const accent=p.accent??'#e52a85',track=p.track??'#f9d9e8',ink=p.ink??'#79204b';
 const cell=l.span/n,h=p.barHeight??24, gap=Math.min(8,cell/8);
 const segmented=p.style!=='lulu';
 const bounds=chapters.map((c,i)=>segmented?{x:l.edge+cell*i,w:cell}:{x:l.edge+l.span*c.start/p.duration,w:l.span*((chapters[i+1]?.start??p.duration)-c.start)/p.duration});
 let x=l.edge+l.span*s.global,dy=0;
 if(p.style==='lulu-cells')x=l.edge+cell*(s.active+s.local);
 if(p.style==='lulu-hop'){
   const hop=s.active===0?1:Math.min(1,(s.time-chapters[s.active].start)/Math.min(.5,((chapters[s.active+1]?.start??p.duration)-chapters[s.active].start)/2));
   const ease=hop*hop*(3-2*hop);
   x=l.edge+cell*(Math.max(0,s.active-1)+(s.active?ease:0)+.5);
   dy=-Math.sin(hop*Math.PI)*Math.min(16,l.size*.15);
 }
 x=Math.max(l.edge+l.size/2,Math.min(W-l.edge-l.size/2,x));
 const all=p.labelMode==='all'||(p.labelMode!=='current'&&bounds.every((b,i)=>b.w>Array.from(chapters[i].label).length*l.font+16));
 const image=s.active%2===1&&p.alternateImage?p.alternateImage:p.image;
 const imageUrl=image?(p.assetBase?`${p.assetBase}${image}`:staticFile(image)):null;
 return <AbsoluteFill style={{background:'transparent',fontFamily:'"PingFang SC","Microsoft YaHei",sans-serif'}}>
  <svg width={W} height={l.height}>
   {!segmented?<><rect x={l.edge} y={l.y-h/2} width={l.span} height={h} rx={h/2} fill={track}/><rect x={l.edge} y={l.y-h/2} width={l.span*s.global} height={h} rx={h/2} fill={accent}/>{chapters.slice(1).map((c,i)=><circle key={i} cx={l.edge+l.span*c.start/p.duration} cy={l.y} r={Math.min(5,h/4)} fill='#ffffff'/>)}</>:bounds.map((b,i)=>{
    const fill=i<s.active?1:i===s.active?s.local:0;
    return <g key={i}><rect x={b.x+gap/2} y={l.y-h/2} width={b.w-gap} height={h} rx={h/2} fill={track}/><rect x={b.x+gap/2} y={l.y-h/2} width={(b.w-gap)*fill} height={h} rx={h/2} fill={accent}/></g>;
   })}
   {p.labels&&(all?bounds.map((b,i)=><text key={i} x={b.x+b.w/2} y={l.labelY} fill={ink} opacity={i===s.active?1:.62} fontSize={Math.min(l.font,(b.w-10)/Math.max(1,Array.from(chapters[i].label).length))} textAnchor='middle' stroke='#fff8fc' strokeWidth={2} paintOrder='stroke' fontWeight={i===s.active?700:400}>{chapters[i].label}</text>):<text x={W/2} y={l.labelY} textAnchor='middle' stroke='#fff8fc' strokeWidth={2} paintOrder='stroke' fill={ink} fontSize={l.font} fontWeight={600}>{s.active+1} / {n} · {chapters[s.active].label}</text>)}
  </svg>
  <div style={{position:'absolute',left:x-l.size/2,top:l.y-l.size/2+dy,width:l.size,height:l.size,borderRadius:'50%',boxSizing:'border-box',border:`${Math.max(3,l.size*.045)}px solid white`,overflow:'hidden',background:track,boxShadow:`0 3px 12px ${accent}45`,transform:`rotate(${Math.sin(s.time*3)*3}deg)`}}>
   {imageUrl?<Img src={imageUrl} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 20%'}}/>:<svg viewBox='0 0 100 100' width='100%' height='100%'><rect width='100' height='100' fill={track}/><path d='M50 12 61 36 88 39 68 58 73 85 50 72 27 85 32 58 12 39 39 36Z' fill={accent}/><circle cx='42' cy='48' r='3' fill='white'/><circle cx='59' cy='48' r='3' fill='white'/><path d='M42 58Q50 67 59 58' fill='none' stroke='white' strokeWidth='3' strokeLinecap='round'/></svg>}
  </div>
 </AbsoluteFill>;
};
