#!/usr/bin/env python3
"""Local meeting audio archive, checkpointed speech-to-text, and explainable lesson candidates."""
import argparse, collections, datetime, fcntl, hashlib, json, math, os, re, shutil, subprocess, tempfile, time, unicodedata
from pathlib import Path
AUDIO={'.m4a','.mp3','.wav','.aac','.aif','.aiff','.caf','.flac','.ogg','.opus'}
VERSION='meeting-audio-1'
def now():return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def read(path,default=None):return json.loads(path.read_text()) if path.is_file() else default
def atomic(path,data):
 path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
 fd,tmp=tempfile.mkstemp(prefix='.audio-',dir=path.parent)
 try:
  with os.fdopen(fd,'w') as f:json.dump(data,f,ensure_ascii=False);f.flush();os.fsync(f.fileno())
  os.replace(tmp,path)
 finally:
  if os.path.exists(tmp):os.unlink(tmp)
def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def signature(path):
 s=path.stat();return f'{s.st_size}:{s.st_mtime_ns}:{s.st_ino}'
def normalize(text):return re.sub(r'\s+','',unicodedata.normalize('NFKC',text).lower())
def grams(text):
 t=normalize(text);return collections.Counter(t[i:i+3] for i in range(max(0,len(t)-2)))
def candidates(text,lessons):
 a=grams(text);an=math.sqrt(sum(v*v for v in a.values()));result=[]
 if not an:return []
 for lesson in lessons:
  body=lesson.get('text','');b=grams(body);bn=math.sqrt(sum(v*v for v in b.values()))
  score=sum(v*b.get(k,0) for k,v in a.items())/(an*bn) if bn else 0
  aliases=lesson.get('surname_aliases',[])
  name_hit=any(len(alias)>1 and normalize(alias) in normalize(text) for alias in aliases)
  if name_hit:score=max(score,0.12)
  if score>=0.08:result.append({'lesson_id':lesson['id'],'score':round(score,4),'reason':'苗字への言及あり。教訓の持ち主候補で、話者の識別ではありません。' if name_hit else '文字列の重なりに基づく候補。意味の一致や確信度を示す数値ではありません。'})
 return sorted(result,key=lambda r:r['score'],reverse=True)[:3]
def blocks(segments,lessons):
 out=[];current=[]
 def flush():
  if not current:return
  text=''.join(s['text'] for s in current).strip();start=current[0]['start'];end=current[-1]['end']
  ident=hashlib.sha256(f'{start}:{end}:{text}'.encode()).hexdigest()[:20]
  out.append({'id':ident,'start':start,'end':end,'text':text,'candidates':candidates(text,lessons),'speaker':None,'l3_status':'criteria_unset'})
 for seg in segments:
  if current and (seg['start']-current[-1]['end']>8 or seg['end']-current[0]['start']>90):flush();current=[]
  current.append(seg)
 flush();return out

def safe_source(file,folder,config):
 p=Path(file['local_path']);root=Path(config['roots'][folder['kind']]['path']).resolve(strict=True)
 if p.is_symlink():raise ValueError('シンボリックリンクは音声として取り込みません。')
 real=p.resolve(strict=True);relative=real.relative_to(root)
 if len(relative.parts)!=2 or relative.parts[0]!=folder['name'] or relative.parts[1]!=file['name'] or not real.is_file():raise ValueError('対象の日付フォルダ直下の音声ではありません。')
 return real

def pcm_window(path,done,seconds=60):
 total=path.stat().st_size//2
 start=min(total,round(done*16000));end=min(start+seconds*16000,total)
 with path.open('rb') as stream:stream.seek(start*2);raw=stream.read((end-start)*2)
 return raw,end/16000

def transcribe(asset,output,context,python_config,status_cb):
 status_cb('loading_model',0,None,'ローカル音声認識モデルを読み込み中です。')
 import imageio_ffmpeg, numpy as np, mlx_whisper
 ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
 model=python_config.get('audio_model_path') or str(Path(python_config['_config_path']).parent/'speech-model')
 if not (Path(model)/'config.json').is_file():raise ValueError('ローカル音声認識モデルが未設定です。')
 # Convert to a private PCM file once; decode fixed real-time chunks for measurable progress/checkpoints.
 pcm=output.with_suffix('.pcm')
 if not pcm.exists():
  status_cb('converting',0,None,'音声を変換中です。')
  building=pcm.with_suffix('.pcm-building')
  subprocess.run([ffmpeg,'-nostdin','-y','-v','error','-i',str(asset),'-f','s16le','-ac','1','-ar','16000',str(building)],check=True,timeout=300,capture_output=True)
  os.chmod(building,0o600);os.replace(building,pcm)
 duration=pcm.stat().st_size/32000
 if duration<=0 or duration>6*3600:raise ValueError('音声長が対象範囲外です（上限6時間）。')
 existing=read(output,{})
 # Transcript can be reused independently from changing lesson context.
 segments=existing.get('segments',[]) if existing.get('engine_version')==VERSION else []
 done=existing.get('processed_seconds',0) if existing.get('engine_version')==VERSION else 0
 chunk=60
 while done<duration-0.001:
  raw,end=pcm_window(pcm,done,chunk);status_cb('transcribing',done,duration,'文字起こし中です。音声は外部へ送信していません。')
  wave=np.frombuffer(raw,np.int16).astype(np.float32)/32768.0
  result=mlx_whisper.transcribe(wave,path_or_hf_repo=model,language='ja',verbose=None,temperature=0.0,condition_on_previous_text=False)
  for s in result.get('segments',[]):
   text=s.get('text','').strip()
   if text:segments.append({'start':round(done+max(0,s['start']),3),'end':round(min(end,done+s['end']),3),'text':text})
  done=end
  atomic(output,{'engine_version':VERSION,'state':'partial' if done<duration else 'complete','processed_seconds':done,'duration':duration,'segments':segments,'updated_at':now()})
 status_cb('matching',duration,duration,'当日の教訓と文字起こしを照合中です。')
 data=read(output);data.update(blocks=blocks(segments,context.get('lessons',[])),context_signature=context['signature'],state='complete',updated_at=now());atomic(output,data)
 return data

def run(config_path):
 config=read(config_path);config['_config_path']=str(config_path)
 cache=Path(config['cache_dir']);base=Path(config.get('audio_store_dir',str(cache.parent/'meeting-audio')))
 for sub in ['', 'assets','transcripts','jobs']: (base/sub).mkdir(parents=True,exist_ok=True,mode=0o700)
 snapshot=read(cache/'snapshot.json');contexts=read(base/'contexts.json',{})
 status_path=base/'status.json'
 with (base/'worker.lock').open('a') as lock:
  os.chmod(base/'worker.lock',0o600)
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:return
  catalog=read(base/'catalog.json',{'recordings':{}})
  selected=[(key,f,snapshot['folders'][f['folder_key']])for key,f in snapshot['files'].items() if Path(f['name']).suffix.lower()in AUDIO]
  state={'state':'scanning','done':0,'total':len(selected),'updated_at':now(),'message':'音声を確認しています。','processed_seconds':0,'duration':None}
  atomic(status_path,state)
  current_keys=set()
  try:
   errors=[]
   for file_key,file,folder in selected:
    rid=None
    try:
     source=safe_source(file,folder,config);before=signature(source)
     if time.time()-source.stat().st_mtime<30:raise ValueError('音声の更新後30秒未満です。同期が安定してから再実行してください。')
     reusable=next((r for r in catalog['recordings'].values() if r.get('source_fingerprint')==snapshot['source_fingerprint'] and file_key in r.get('source_keys',[]) and r.get('source_signature')==before),None)
     digest=reusable['content_hash'] if reusable else sha(source)
     if signature(source)!=before:raise ValueError('取り込み中に音声が変化しました。再実行してください。')
     meeting_id=hashlib.sha256((folder['kind']+':'+file['folder_key']).encode()).hexdigest()[:24]
     rid=hashlib.sha256((meeting_id+':'+digest).encode()).hexdigest()[:32];current_keys.add(rid)
     asset=base/'assets'/(digest+source.suffix.lower())
     if not asset.exists():
      tmp=asset.with_suffix(asset.suffix+'.copying');shutil.copyfile(source,tmp);os.chmod(tmp,0o600)
      if sha(tmp)!=digest:tmp.unlink();raise ValueError('コピー中に音声が変化しました。再実行してください。')
      os.replace(tmp,asset)
     context=contexts.get(file['folder_key'],{'lessons':[],'signature':'none','meeting_date':folder['date'],'kind':folder['kind']})
     context_file=base/'jobs'/(rid+'-context.json');atomic(context_file,context)
     recording=catalog['recordings'].get(rid,{})
     recording.pop('error',None)
     if recording.get('context') and recording['context'].get('signature')!=context['signature']:
      recording.setdefault('context_history',{})[recording['context']['signature']]=recording['context']
     recording.update(source_fingerprint=snapshot['source_fingerprint'],id=rid,meeting_id=meeting_id,meeting_date=folder['date'],kind=folder['kind'],folder_key=file['folder_key'],source_keys=list(set(recording.get('source_keys',[])+[file_key])),name=file['name'],asset_name=asset.name,content_hash=digest,source_signature=before,state='processing',context=context,updated_at=now(),source_present=True)
     catalog['recordings'][rid]=recording;atomic(base/'catalog.json',catalog)
     output=base/'transcripts'/(rid+'.json')
     def update(phase,seconds,duration,message):
      state.update(state=phase,recording_id=rid,current_file=file['name'],processed_seconds=seconds,duration=duration,message=message,updated_at=now());atomic(status_path,state)
     existing=read(output)
     if existing and existing.get('state')=='complete' and existing.get('engine_version')==VERSION:
      if existing.get('context_signature')!=context['signature']:
       existing.update(blocks=blocks(existing['segments'],context.get('lessons',[])),context_signature=context['signature'],updated_at=now());atomic(output,existing)
      recording['state']='complete'
     else:
      transcribe(asset,output,context,config,update);recording['state']='complete'
     completed=read(output,{})
     if completed.get('state')=='complete':
      recording['duration']=completed.get('duration');state.update(processed_seconds=completed.get('duration',0),duration=completed.get('duration'))
      pcm=output.with_suffix('.pcm')
      if pcm.exists():pcm.unlink()
     recording['updated_at']=now();catalog['recordings'][rid]=recording;atomic(base/'catalog.json',catalog)
    except Exception as e:
     state.update(state='file_error',message=str(e)[:400],current_file=file['name'],updated_at=now());atomic(status_path,state)
     errors.append({'file_key':file_key,'name':file['name'],'message':str(e)[:400]})
     if rid and rid in catalog['recordings']:
      catalog['recordings'][rid].update(state='failed',error=str(e)[:400],updated_at=now());atomic(base/'catalog.json',catalog)
    state.update(done=state['done']+1,updated_at=now());atomic(status_path,state)
   snapshot_keys={key for key,_,_ in selected}
   for rid,recording in catalog['recordings'].items():recording['source_present']=rid in current_keys or bool(set(recording.get('source_keys',[])) & snapshot_keys)
   atomic(base/'catalog.json',catalog)
   failed=len(errors);state['errors']=errors
   state.update(state='complete_with_errors' if failed else 'complete',message='音声処理が完了しました。対応候補は未確認です。' if not failed else '一部の音声を処理できませんでした。完了済み結果は保持しています。',updated_at=now());atomic(status_path,state)
  except BaseException:
   state.update(state='failed',message='音声処理が中断されました。完了済み区間を保持します。',updated_at=now());atomic(status_path,state);raise
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--config',type=Path,required=True);args=parser.parse_args();run(args.config)
