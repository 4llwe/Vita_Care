#!/usr/bin/env python3
import argparse,re,sys
p=argparse.ArgumentParser();p.add_argument('--sql',required=True);p.add_argument('--schema',default='prisma/schema.prisma');a=p.parse_args()
schema=open(a.schema,encoding='utf-8').read(); sql=open(a.sql,encoding='utf-8').read()
models=set(re.findall(r'^model\s+(\w+)',schema,re.M)); created=set(re.findall(r'CREATE TABLE\s+"([^"]+)"',sql,re.I))
missing=sorted(models-created); extra=sorted(created-models)
danger=re.findall(r'\b(DROP\s+(?:DATABASE|SCHEMA|TABLE)|TRUNCATE\s+TABLE)\b',sql,re.I)
if missing or extra or danger:
 print({'models':len(models),'tables':len(created),'missing':missing,'extra':extra,'dangerous':danger},file=sys.stderr);sys.exit(1)
print(f'Baseline preview review passed: {len(models)} models / {len(created)} CREATE TABLE statements; no destructive statements.')
