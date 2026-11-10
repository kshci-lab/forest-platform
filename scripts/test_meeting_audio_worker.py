import importlib.util, unittest, tempfile, json, time
from unittest.mock import patch
from pathlib import Path
spec=importlib.util.spec_from_file_location('audio',Path(__file__).with_name('transcribe_meeting_audio.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AudioTests(unittest.TestCase):
 def test_candidates_are_not_assignments(self):
  lessons=[{'id':'a','text':'議論の前に目的を確認し、前提を合わせることが重要','surname_aliases':['田中']},{'id':'b','text':'実装を先に進める','surname_aliases':['白木']}]
  found=m.candidates('田中さんの教訓は、議論の前に目的を確認して前提を合わせるということですね。',lessons)
  self.assertTrue(found);self.assertEqual(found[0]['lesson_id'],'a');self.assertNotIn('confirmed',found[0])
 def test_unrelated_remains_unknown(self):self.assertEqual(m.candidates('本日の会場の空調についてのお知らせです',[{'id':'a','text':'データベース正規化と検索性能の検証','surname_aliases':[]}]),[])
 def test_timecoded_blocks(self):
  result=m.blocks([{'start':0,'end':20,'text':'発言1'},{'start':22,'end':50,'text':'発言2'},{'start':65,'end':80,'text':'別の話題'}],[])
  self.assertEqual(len(result),2);self.assertEqual(result[0]['start'],0);self.assertEqual(result[0]['end'],50);self.assertIsNone(result[0]['speaker']);self.assertEqual(result[0]['l3_status'],'criteria_unset')
 def test_stable_block_ids(self):
  segments=[{'start':1,'end':3,'text':'同じ発言'}];self.assertEqual(m.blocks(segments,[])[0]['id'],m.blocks(segments,[])[0]['id'])
 def test_safe_audio_path(self):
  with tempfile.TemporaryDirectory()as d:
   r=Path(d);f=r/'2026-07-27';f.mkdir();p=f/'voice.m4a';p.write_bytes(b'test')
   config={'roots':{'general':{'path':str(r)}}};item={'name':p.name,'local_path':str(p)};folder={'kind':'general','name':f.name}
   self.assertEqual(m.safe_source(item,folder,config),p.resolve())
   other=r/'outside.m4a';other.write_bytes(b'x');item['local_path']=str(other)
   with self.assertRaises(ValueError):m.safe_source(item,folder,config)
 def test_final_fractional_pcm_window(self):
  with tempfile.TemporaryDirectory()as d:
   p=Path(d)/'fixture.pcm';p.write_bytes(b'\0\0'*round(75.136*16000))
   raw,end=m.pcm_window(p,60);self.assertEqual(len(raw)%2,0);self.assertAlmostEqual(end,75.136)
 def test_durable_import_duplicate_and_removed_sources(self):
  with tempfile.TemporaryDirectory() as d:
   base=Path(d);cache=base/'cache';cache.mkdir();folder=base/'general'/'2026-07-27';folder.mkdir(parents=True);path=folder/'voice.m4a';path.write_bytes(b'audio fixture');m.os.utime(path,(time.time()-60,time.time()-60))
   store=base/'meeting-audio';store.mkdir();m.atomic(store/'contexts.json',{'g':{'signature':'ctx','lessons':[]}})
   snapshot={'source_fingerprint':'fp','folders':{'g':{'kind':'general','name':folder.name,'date':'2026-07-27'}},'files':{'first':{'folder_key':'g','name':path.name,'local_path':str(path)}}}
   m.atomic(cache/'snapshot.json',snapshot);config=base/'config.json';m.atomic(config,{'cache_dir':str(cache),'roots':{'general':{'path':str(folder.parent)}}})
   def fake(asset,output,context,config,callback):
    value={'engine_version':m.VERSION,'state':'complete','duration':2,'segments':[{'start':0,'end':2,'text':'発言'}],'blocks':[],'context_signature':context['signature']};m.atomic(output,value);return value
   with patch.object(m,'transcribe',side_effect=fake) as engine:
    m.run(config);catalog=m.read(store/'catalog.json');self.assertEqual(len(catalog['recordings']),1);rid=next(iter(catalog['recordings']));asset=store/'assets'/catalog['recordings'][rid]['asset_name'];self.assertTrue(asset.exists())
    duplicate=folder/'copy.m4a';duplicate.write_bytes(path.read_bytes());m.os.utime(duplicate,(time.time()-60,time.time()-60));snapshot['files']['second']={'folder_key':'g','name':duplicate.name,'local_path':str(duplicate)};m.atomic(cache/'snapshot.json',snapshot)
    m.run(config);self.assertEqual(len(m.read(store/'catalog.json')['recordings']),1);self.assertEqual(engine.call_count,1)
    snapshot['files']={};m.atomic(cache/'snapshot.json',snapshot);m.run(config);catalog=m.read(store/'catalog.json');self.assertFalse(catalog['recordings'][rid]['source_present']);self.assertTrue(asset.exists());self.assertTrue((store/'transcripts'/(rid+'.json')).exists())
if __name__=='__main__':unittest.main()
