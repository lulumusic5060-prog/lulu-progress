#!/usr/bin/env python3
"""Package distributable source; private user outputs and uploads never enter it."""
import argparse,json,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('output');p.add_argument('--include-brand',action='store_true');a=p.parse_args()
root=Path(__file__).resolve().parents[1]
files=['SKILL.md','README.md','LICENSE','.gitignore','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','tsconfig.json','上传GitHub教程.md','验证记录.md']
for folder in ['src','scripts','editor','references','agents','examples']:
    files += [str(f.relative_to(root)) for f in (root/folder).rglob('*') if f.is_file() and '__pycache__' not in f.parts]
if (root/'previews/editor.png').is_file():files.append('previews/editor.png')
if a.include_brand:files += ['public/lulu-neutral.png','public/lulu-playful.png']
output=Path(a.output).resolve();output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
    for relative in sorted(set(files)):
        f=root/relative
        if not f.is_file():raise SystemExit(f'Missing required file: {relative}')
        content=f.read_bytes()
        if not a.include_brand and relative.startswith('examples/') and f.suffix=='.json':
            config=json.loads(content)
            for key in ['image','alternateImage']:config.pop(key,None)
            content=(json.dumps(config,ensure_ascii=False,indent=2)+'\n').encode()
        z.writestr('lulu-progress/'+relative,content)
print(f'{output} ({output.stat().st_size:,} bytes); brand assets: {a.include_brand}')
