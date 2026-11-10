#!/usr/bin/env python3
"""Local-only, incremental meeting lesson detection. No network calls or document writes."""
import argparse, contextlib, datetime, fcntl, hashlib, json, os, re, signal, subprocess, sys, tempfile, time, unicodedata, zipfile
from pathlib import Path
from xml.etree import ElementTree
VERSION = 'lesson-rules-1'

def now(): return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def read_json(path, default=None):
    return json.loads(path.read_text()) if path.is_file() else default

def atomic(path, value):
    fd, tmp = tempfile.mkstemp(prefix='.analysis-', dir=path.parent)
    try:
        with os.fdopen(fd,'w') as f:
            json.dump(value, f, ensure_ascii=False); f.flush(); os.fsync(f.fileno())
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)

def signature(path):
    st = path.stat()
    return hashlib.sha256(f'{st.st_size}:{st.st_mtime_ns}:{st.st_ino}:{VERSION}'.encode()).hexdigest()

def extraction(path):
    if path.stat().st_size > 60*1024*1024: raise ValueError('容量が大きいため手動確認が必要です。')
    suffix = path.suffix.lower()
    if suffix == '.pdf':
        from pypdf import PdfReader
        reader = PdfReader(str(path), strict=False)
        if reader.is_encrypted and not reader.decrypt(''): raise ValueError('パスワード付きPDFです。')
        if len(reader.pages)>200: raise ValueError('200ページを超えるため手動確認が必要です。')
        units=[]
        for i,page in enumerate(reader.pages):
            contents=page.get_contents()
            if contents and len(contents.get_data())>20*1024*1024: raise ValueError('PDFページの展開サイズが大きいため要確認です。')
            units.append({'location':f'{i+1}ページ','text':page.extract_text() or ''})
        return units
    if suffix in ('.pptx','.docx'):
        with zipfile.ZipFile(path) as z:
            entries=[i for i in z.infolist() if (re.fullmatch(r'ppt/slides/slide\d+\.xml',i.filename) if suffix=='.pptx' else i.filename=='word/document.xml')]
            if sum(i.file_size for i in entries)>20*1024*1024: raise ValueError('展開サイズが大きいため手動確認が必要です。')
            entries.sort(key=lambda i:int(re.search(r'\d+',i.filename).group()) if suffix=='.pptx' else 0)
            units=[]
            for i,entry in enumerate(entries):
                tree=ElementTree.fromstring(z.read(entry))
                paragraphs=[]
                for node in tree.iter():
                    if node.tag.rsplit('}',1)[-1]=='p':
                        texts=[c.text or '' for c in node.iter() if c.tag.rsplit('}',1)[-1]=='t']
                        if texts: paragraphs.append(''.join(texts))
                units.append({'location':f'{i+1}スライド' if suffix=='.pptx' else '本文','text':'\n'.join(paragraphs)})
            return units
    raise ValueError('画像・動画・旧Office形式など、自動文字抽出の対象外です。')

def classify(units):
    heading=re.compile(r'教訓|学んだこと|学び|得られた知見|今後.{0,8}活か|lessons?\s+learned',re.I)
    learning=re.compile(r'重要|必要|大切|有効|べき|することで|すると|した方が|しておく|防ぐ|避け|見直|分かった|わかった|気づ|学ん|理解|意識|工夫|早め|必ず|徹底|事前に|確認する|確認して|相談する')
    empty=re.compile(r'^(?:[\s:：・●○\-\d.)）]*)(?:なし|特になし|未記入|未入力|記載なし|記入予定|TODO|TBD|ここに.{0,10}記入)[。.\s]*$',re.I)
    only_plan=re.compile(r'(?:次回|来週|明日|今週).{0,25}(?:までに|予定).{0,25}(?:作成|提出|作る|完成)|(?:作成|提出|作る|完成).{0,8}予定')
    evidence=[]; uncertain=[]; empties=[]; total=0; blank=False
    for unit in units:
        text=unicodedata.normalize('NFKC',unit['text'])
        text=re.sub(r'(?<=[\u3040-\u9fff])[^\S\n]+(?=[\u3040-\u9fff])','',text)
        total+=len(re.sub(r'\s','',text)); blank=blank or len(re.sub(r'\s','',text))<10
        hits=list(heading.finditer(text))
        for j,hit in enumerate(hits):
            end=min(hit.end()+650,hits[j+1].start() if j+1<len(hits) else len(text))
            body=text[hit.end():end].strip(' \n\t:：・●○-')
            snippet=text[max(0,hit.start()-30):min(end,hit.end()+450)].strip()
            item={'location':unit['location'],'text':snippet}
            if not body or empty.fullmatch(body): empties.append(item); continue
            if only_plan.search(body) and not learning.search(body): empties.append(item); continue
            if len(re.sub(r'\s','',body))>=15 and learning.search(body): evidence.append(item)
            else: uncertain.append(item)
    if evidence: return {'auto_status':'yes','reason':'教訓に関する見出しと、学び・改善につながる具体的な文章を検出しました。人による確認前の候補です。','evidence':evidence[:3]}
    if total<30: return {'auto_status':'review','reason':'文字を十分に抽出できません。画像主体の資料などを確認してください。','evidence':[]}
    if uncertain: return {'auto_status':'review','reason':'教訓に関連する記述はありますが、具体的な学びか自動では判断できません。','evidence':uncertain[:3]}
    if blank: return {'auto_status':'review','reason':'文字を読み取れないページがあります。教訓なしとは断定できません。','evidence':empties[:3]}
    if empties: return {'auto_status':'no','reason':'教訓欄が空、なし・未記入、または予定だけの記述でした。自動判定のため修正できます。','evidence':empties[:3]}
    joined='\n'.join(u['text'] for u in units)
    if re.search(r'分かった|わかった|気づ|重要.{0,12}学|振り返り',joined):
        return {'auto_status':'review','reason':'学びの可能性がある文章があります。教訓欄がないため要確認です。','evidence':[]}
    return {'auto_status':'no','reason':'抽出できた本文に、教訓・学びに該当する記述を検出しませんでした。自動判定のため修正できます。','evidence':[]}

def allowed_path(file,folder,config):
    p=Path(file.get('local_path',''))
    root=Path(config['roots'][folder['kind']]['path']).resolve(strict=True)
    if not p.is_absolute() or p.is_symlink(): raise ValueError('ローカル資料のパスを確認できません。')
    resolved=p.resolve(strict=True)
    rel=resolved.relative_to(root)
    if len(rel.parts)!=2 or rel.parts[0]!=folder['name'] or rel.parts[1]!=file['name']: raise ValueError('対象の日付フォルダ直下の資料ではありません。')
    if not resolved.is_file(): raise ValueError('資料が読み取れません。')
    return resolved

def run(config_path):
    config=read_json(config_path)
    cache=Path(config['cache_dir']).resolve(strict=True)
    snapshot=read_json(cache/'snapshot.json')
    if not snapshot or config.get('source_mode')!='onedrive': raise ValueError('OneDriveの正常な一覧が必要です。')
    status_path=cache/'analysis-status.json'; results_path=cache/'analysis-results.json'
    with open(cache/'analysis.lock','a') as lock:
        os.chmod(cache/'analysis.lock',0o600)
        try: fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError: return
        files=[(key,f,snapshot['folders'][f['folder_key']]) for key,f in snapshot['files'].items() if snapshot['folders'][f['folder_key']]['kind']=='general' and Path(f['name']).suffix.lower() not in {'.m4a','.mp3','.wav','.aac','.aif','.aiff','.caf','.flac','.ogg','.opus','.mp4','.mov','.m4v','.mkv','.avi','.webm'}]
        old=read_json(results_path,{})
        results=old.get('files',{}) if old.get('source_fingerprint')==snapshot['source_fingerprint'] else {}
        state={'state':'running','started_at':now(),'updated_at':now(),'done':0,'total':len(files),'current_file':'','reused':0,'message':'本文解析を開始しました。'}
        atomic(status_path,state)
        try:
            current={}
            for key,file,folder in files:
                state.update(current_file=file['name'],updated_at=now());atomic(status_path,state)
                path=None
                try:
                    path=allowed_path(file,folder,config);sig=signature(path)
                    previous=results.get(key)
                    if previous and previous.get('signature')==sig and previous.get('rules_version')==VERSION:
                        result=previous;state['reused']+=1
                    else:
                        try:
                            child=subprocess.run([sys.executable,str(Path(__file__).resolve()),'--extract',str(path)],capture_output=True,text=True,timeout=45)
                            if child.returncode: raise ValueError('本文を抽出できません。破損・暗号化・対応形式を確認してください。')
                            payload=json.loads(child.stdout)
                            if payload.get('error'): raise ValueError(payload['error'])
                            result=classify(payload['units'])
                        except subprocess.TimeoutExpired:
                            result={'auto_status':'review','reason':'読み取りが45秒以内に完了しなかったため要確認です。','evidence':[]}
                        except (ValueError,KeyError,json.JSONDecodeError):
                            result={'auto_status':'review','reason':'本文を抽出できません。画像・動画・暗号化・破損などを確認してください。','evidence':[]}
                        if signature(path)!=sig: raise ValueError('解析中に資料が変更されました。再解析してください。')
                        result.update(signature=sig,rules_version=VERSION,analyzed_at=now())
                except (OSError,ValueError):
                    result={'signature':None,'rules_version':VERSION,'auto_status':'review','reason':'資料が未同期・移動・変更されているため読み取りできません。OneDriveを確認後、再解析してください。','evidence':[],'analyzed_at':now()}
                try:
                    st=path.stat(); result.update(file_size=st.st_size,file_mtime=int(st.st_mtime))
                except (OSError,AttributeError): pass
                current[key]=result
                # Keep old valid entries until each file's new result is ready; publish per-file progress.
                results[key]=result
                atomic(results_path,{'source_fingerprint':snapshot['source_fingerprint'],'updated_at':now(),'files':results})
                state.update(done=state['done']+1,updated_at=now());atomic(status_path,state)
            atomic(results_path,{'source_fingerprint':snapshot['source_fingerprint'],'updated_at':now(),'files':current})
            state.update(state='complete',current_file='',updated_at=now(),message='本文解析が完了しました。自動判定と人による確認を区別して表示します。');atomic(status_path,state)
        except BaseException:
            state.update(state='failed',updated_at=now(),message='解析が中断されました。完了済みの結果を保持しています。');atomic(status_path,state)
            raise

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--config',type=Path);parser.add_argument('--extract',type=Path);args=parser.parse_args()
    if args.extract:
        try: print(json.dumps({'units':extraction(args.extract)},ensure_ascii=False))
        except Exception: print(json.dumps({'error':'本文抽出に対応していない形式、または読み取りできない資料です。'}))
    elif args.config: run(args.config)
    else: parser.error('--config or --extract is required')
if __name__=='__main__': main()
