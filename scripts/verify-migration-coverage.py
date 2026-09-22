#!/usr/bin/env python3
import glob,re,sys
schema=open('prisma/schema.prisma',encoding='utf-8').read()
models=set(re.findall(r'^model\s+(\w+)',schema,re.M))
sql='\n'.join(open(p,encoding='utf-8').read() for p in glob.glob('prisma/migrations/*/migration.sql'))
created=set(re.findall(r'CREATE TABLE\s+"([^"]+)"',sql,re.I))
missing=sorted(models-created)
if missing:
 print('MIGRATION COVERAGE FAILED: schema models without CREATE TABLE:',file=sys.stderr)
 print(', '.join(missing),file=sys.stderr)
 print('Generate and review prisma/migrations/20260920_hah_baseline/migration.sql before deployment.',file=sys.stderr)
 sys.exit(1)
print(f'Migration coverage passed: {len(models)} models represented.')
