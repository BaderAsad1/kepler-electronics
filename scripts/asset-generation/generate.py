#!/usr/bin/env python3
"""Cached fallback using the bundled image CLI. Native generation was used for this build."""
import json, os, subprocess, sys, tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[2]
manifest=json.loads((root/'assets/image-prompts.json').read_text())
jobs=[]
for item in manifest:
 target=root/'assets/masters'/f"{item['name']}.png"
 if target.exists() and '--force' not in sys.argv:
  print('Cached:',item['name']);continue
 jobs.append({'prompt':item['prompt'],'out':str(target),'size': '1024x1536' if 'mobile' in item['name'] else '1024x1024' if 'stage' in item['name'] else '1536x1024'})
if not jobs: sys.exit(0)
if not os.environ.get('OPENAI_API_KEY'): sys.exit('Missing assets need native generation or an authorized OPENAI_API_KEY. No paid request was made.')
with tempfile.TemporaryDirectory(prefix='kepler-image-') as temp:
 path=Path(temp)/'jobs.jsonl';path.write_text('\n'.join(json.dumps(x) for x in jobs))
 command=[sys.executable,str(root/'scripts/asset-generation/image_gen.py'),'generate-batch','--jsonl',str(path),'--out-dir',str(root/'assets/masters'),'--model',os.environ.get('OPENAI_IMAGE_MODEL','gpt-image-2'),'--no-augment']
 if '--force' in sys.argv:command.append('--force')
 subprocess.run(command,check=True,cwd=root)
