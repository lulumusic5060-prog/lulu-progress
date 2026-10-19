import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'lulu-test-'));
try{
 const path=join(dir,'model.mjs');
 await build({entryPoints:['src/avatar-model.ts'],bundle:true,platform:'node',format:'esm',outfile:path});
 const {validateAvatar,progressState,avatarLayout}=await import(pathToFileURL(path));
 const p={width:1080,height:1920,fps:30,duration:10.01,position:'top',style:'lulu',chapters:[{label:'第一章',start:0},{label:'第二章',start:3.2}],labels:true};
 validateAvatar(p);
 assert.equal(progressState(p,95).active,0);assert.equal(progressState(p,96).active,1);
 assert.equal(progressState(p,0).global,0);
 const end=progressState(p,Math.ceil(p.duration*p.fps)-1);assert.equal(end.global,1);assert.equal(end.local,1);
 assert.throws(()=>validateAvatar({...p,chapters:[{label:'空',start:1}]}));
 assert.throws(()=>validateAvatar({...p,chapters:[{label:'A',start:0},{label:'B',start:0}]}));
 assert.throws(()=>validateAvatar({...p,image:'../private.png'}));
 assert.throws(()=>validateAvatar({...p,avatarSize:900}));
 for(const size of [40,84,180])for(const position of ['top','bottom']){
   const l=avatarLayout({...p,avatarSize:size,position,compact:true});
   assert.equal(l.height%2,0);assert.ok(l.y-size/2>=0);assert.ok(l.labelY+8<l.height);
 }
 console.log('通过：章节边界、首尾进度、配置校验、全部头像尺寸紧凑布局。');
}finally{await rm(dir,{recursive:true,force:true});}
