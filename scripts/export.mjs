import {spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync,mkdirSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [props,output,...flags]=process.argv.slice(2);
if(!props||!output||!['.mov','.webm'].includes(output.slice(output.lastIndexOf('.')))||flags.some(f=>f!=='--compact'))throw Error('Usage: node scripts/export.mjs config.json output.mov|output.webm [--compact]');
const target=resolve(output);if(existsSync(target))throw Error('Output exists; choose a new filename.');
mkdirSync(dirname(target),{recursive:true});
const config=JSON.parse(readFileSync(resolve(props),'utf8'));
if(flags.includes('--compact'))config.compact=true;
if(config.compact&&!['lulu','lulu-hop','lulu-cells'].includes(config.style))throw Error('Compact export requires an avatar theme');
const temp=resolve(dirname(target),`.render-${randomUUID()}.json`);writeFileSync(temp,JSON.stringify(config));
try{
 const result=spawnSync(process.execPath,[resolve(root,'node_modules/@remotion/cli/remotion-cli.js'),'render','src/index.tsx','Overlay',target,'--props',temp,...(output.endsWith('.webm')?['--codec=vp9','--crf=24','--image-format=png','--pixel-format=yuva420p']:['--codec=prores','--prores-profile=4444','--image-format=png','--pixel-format=yuva444p10le']),...(process.env.REMOTION_BROWSER_EXECUTABLE?['--browser-executable',process.env.REMOTION_BROWSER_EXECUTABLE]:[])],{cwd:root,stdio:'inherit'});
 process.exitCode=result.status??1;
}finally{unlinkSync(temp);}
