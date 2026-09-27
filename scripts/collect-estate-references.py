"""Download dated official photo references, preserving provenance outside runtime assets."""
import concurrent.futures, hashlib, io, json, re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
import requests
from PIL import Image, ImageDraw

ROOT=Path('assets/references/current-2026-09'); ROOT.mkdir(parents=True,exist_ok=True)
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__(); self.images=[];self.links=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='img':self.images.append(a)
  if tag=='a' and a.get('href'):self.links.append(a['href'])
def page(url):
 r=requests.get(url,timeout=50);r.raise_for_status();return Page(r.text)
base='https://www.whitehouse.gov'
seeds=[base+'/gallery/?query-8-page='+str(i) for i in [1,2,3,4,5,10,13,16]]
links=set()
for p in concurrent.futures.ThreadPoolExecutor(4).map(page,seeds):
 for link in p.links:
  link=urljoin(base,link)
  if '/gallery/' in link and '?' not in link and re.search('rose-garden|oval-office|cabinet-meeting|east-room|state-dinner|helipad|king-charles|press-briefing|roosevelt',link):links.add(link)
links.update([base+'/walk-of-fame/','https://obamawhitehouse.archives.gov/node/354641',base+'/gallery/president-donald-j-trump-hosts-a-cabinet-meeting-thursday-march-26-2026/',base+'/gallery/president-donald-j-trump-and-first-lady-melania-trump-host-a-state-dinner-for-king-charles-iii-and-queen-camilla-of-the-uk-april-28-2026/'])
records={};errors=[]
def collect(url):
 try:return url,page(url)
 except Exception as e:return url,str(e)
for source,p in concurrent.futures.ThreadPoolExecutor(5).map(collect,sorted(links)):
 if isinstance(p,str):errors.append([source,p]);continue
 for im in p.images:
  alt=im.get('alt','');url=im.get('src','').split('?')[0]
  if not url or not re.search('White House|Oval Office|Rose Garden|Cabinet Room|East Room|Blue Room|Colonnade|Portico|helipad|Brady|Roosevelt',alt,re.I):continue
  if '/uploads/2026/' not in url and 'archives.gov' not in url:continue
  if url not in records:records[url]={'url':url,'source':source,'caption':alt,'era':'2026' if '/2026/' in url else 'historical layout only'}
items=list(records.values())
def download(pair):
 i,r=pair;name=f'{i:03d}-'+r['url'].split('/')[-1].rsplit('.',1)[0]+'.jpg';r['file']=name
 try:
  dst=ROOT/name
  if not dst.exists():
   b=requests.get(r['url']+'?w=1200',timeout=50);b.raise_for_status();im=Image.open(io.BytesIO(b.content)).convert('RGB');im.thumbnail((1200,1200));im.save(dst,quality=82)
  r['sha256']=hashlib.sha256(dst.read_bytes()).hexdigest()
 except Exception as e:r['error']=str(e)
 return r
items=list(concurrent.futures.ThreadPoolExecutor(6).map(download,enumerate(items)))
(ROOT/'manifest.json').write_text(json.dumps({'retrieved':'2026-09-27','source_pages':sorted(links),'images':items,'errors':errors},indent=2),encoding='utf-8')
good=[r for r in items if 'error' not in r]
for start in range(0,len(good),30):
 sheet=Image.new('RGB',(1500,1200),'#172529');d=ImageDraw.Draw(sheet)
 for j,r in enumerate(good[start:start+30]):
  im=Image.open(ROOT/r['file']);im.thumbnail((294,168));x=j%5*300;y=j//5*200;sheet.paste(im,(x,y));d.text((x+4,y+170),r['file'][:40],fill='white')
 sheet.save(ROOT/f'contact-{start//30+1:02d}.jpg',quality=85)
print(json.dumps({'pages':len(links),'images':len(good),'errors':len(items)-len(good),'sheets':(len(good)+29)//30}))
