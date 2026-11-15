"""Extract SK/SP from the four supplied English PDFs. Never marks text reviewed.
Usage: python scripts/curriculum/extract.py /path/to/upload
Requires pdfplumber. Output retains PDF page numbers (1-based), not printed folios.
"""
import sys,re,json,hashlib
from pathlib import Path
import pdfplumber
root=Path(sys.argv[1]); entries=[]; sources=[]
files=[('Versi_BI_DOKUMEN_PENJAJARAN_KSSR_MATEMATIK_TAHAP_I_VERSI_BAHASA.pdf',None,234.1,450.0),('DSKP KSSR Mathematics Year 4 (Semakan).pdf',4,223.9,495.0),('DSKP KSSR Mathematics Year 5 (Semakan).pdf',5,223.9,507.4),('DSKP KSSR Mathematics Year 6 (Semakan 2017).pdf',6,229.5,518.6)]
def clean(s):return re.sub(r'\s+',' ',s).strip()
for name,fixed,left,right in files:
 path=root/name;pdf=pdfplumber.open(path);skmap={};topics={};current=None
 sources.append({'file':name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'pages':len(pdf.pages),'language':'English','status':'extracted; review against source required'})
 for page_no,page in enumerate(pdf.pages,1):
  text=page.extract_text() or ''
  if not ('CONTENT STANDARD' in text and 'LEARNING STANDARD' in text):continue
  year=fixed
  if not year:
   m=re.search(r'\(Year ([123])\)',text,re.I)
   if not m:continue
   year=int(m[1])
  for m in re.finditer(r'(?:TOPIC:\s*)?(\d+\.0)\s+([A-Z][A-Z ,&()\-/0-9]+)',text):
   topics[(year,m[1].split('.')[0])]=clean(m[2].split('\n')[0])
  header=[w for w in page.extract_words() if w['text']=='CONTENT']
  if not header:continue
  top=header[0]['bottom']+7
  learning=[w for w in page.extract_words() if w['text']=='LEARNING' and abs(w['top']-header[0]['top'])<3]
  if not learning:continue
  rules=sorted(set(round(e['x0'],1) for e in page.edges if e.get('orientation')=='v' and e['bottom']-e['top']>35))
  if rules:
   lx=learning[0]['x0'];rx=learning[0]['x1']
   l=[x for x in rules if x<lx];r=[x for x in rules if x>rx]
   if l and r:left=max(l);right=min(r)
  body_bottom=page.height-42
  for w in page.extract_words():
   if re.fullmatch(r'\d+',w['text']) and w['top']>page.height*.86 and abs((w['x0']+w['x1'])/2-page.width/2)<35:body_bottom=min(body_bottom,w['top']-2)
  # Content-standard labels occupy a separate PDF column.
  sktext=page.crop((70,top,left-1,body_bottom)).extract_text() or ''
  matches=list(re.finditer(r'(?m)^\s*(\d+\.\d+)\s+([^\n]+(?:\n(?!\s*\d+\.\d+\s)[^\n]+)*)',sktext))
  for m in matches:skmap[(year,m[1])]=clean(m[2])
  sptext=page.crop((left+1,top,right-1,body_bottom)).extract_text() or ''
  sptext=sptext.replace('Pupils will be able to:','').replace('LEARNING STANDARD','').strip()
  spans=list(re.finditer(r'(?m)^\s*(\d+\.\d+\.\d+)\s+',sptext))
  if spans and current and current['year']==year:
   prefix=clean(sptext[:spans[0].start()])
   if prefix and not re.fullmatch(r'\d+',prefix):current['text']+=' '+prefix
  for j,m in enumerate(spans):
   code=m[1];body=clean(sptext[m.end():spans[j+1].start() if j+1<len(spans) else len(sptext)])
   if not body:continue
   current={'id':f'y{year}-{code}','year':year,'topic':topics.get((year,code.split('.')[0]),'Topic '+code.split('.')[0]),'sk':'.'.join(code.split('.')[:2]),'skText':'','sp':code,'text':body,'source':name,'page':page_no,'status':'extracted'}
   entries.append(current)
  if not spans and current and current['year']==year and sptext and not re.fullmatch(r'\d+',sptext):current['text']+=' '+clean(sptext)
 for e in entries:
  if e['source']==name:e['skText']=skmap.get((e['year'],e['sk']),'See source document')
 pdf.close()
ids=[e['id'] for e in entries]
if len(ids)!=len(set(ids)):raise ValueError('Duplicate year/SP entries; inspect extraction')
Path('data/curriculum.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
Path('data/curriculum-sources.json').write_text(json.dumps(sources,indent=2)+'\n')
print(json.dumps({'total':len(entries),'byYear':{y:sum(e['year']==y for e in entries) for y in range(1,7)}},indent=2),flush=True)
