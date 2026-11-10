import importlib.util,json,subprocess,tempfile,unittest,zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('detector',Path(__file__).with_name('analyze_meeting_lessons.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class DetectionTests(unittest.TestCase):
 def classify(self,text):return m.classify([{'location':'1ページ','text':text}])['auto_status']
 def test_concrete_lesson(self):self.assertEqual(self.classify('教訓\n議論を始める前に、目的と前提を確認しておくことが重要だと分かった。'),'yes')
 def test_heading_only(self):self.assertNotEqual(self.classify('教訓'),'yes')
 def test_empty_section(self):self.assertEqual(self.classify('研究の進捗について十分な量の本文を説明する。今週は実験を実施して結果をまとめた。\n教訓：特になし'),'no')
 def test_schedule_only(self):self.assertEqual(self.classify('研究の進捗について十分な量の本文を説明する。今週は実験を実施した。\n教訓：次回のMTまでに資料を作成する'),'no')
 def test_ambiguous(self):self.assertEqual(self.classify('教訓：皆で議論をした。これは今週の研究ミーティングでの活動報告です。'),'review')
 def test_unreadable(self):self.assertEqual(self.classify(''),'review')
 def test_mixed_scanned_pages(self):self.assertEqual(m.classify([{'location':'1','text':'研究計画と活動報告の文章。今週は検証実験を進めて結果を整理して報告しました。'},{'location':'2','text':''}])['auto_status'],'review')
 def test_word_and_powerpoint(self):
  with tempfile.TemporaryDirectory() as d:
   for ext,entry,xml in [('docx','word/document.xml','<w:document xmlns:w="word"><w:body><w:p><w:r><w:t>教訓</w:t></w:r></w:p><w:p><w:r><w:t>議論の前に目的を確認しておくことが重要だと分かった。</w:t></w:r></w:p></w:body></w:document>'),('pptx','ppt/slides/slide1.xml','<p:sld xmlns:p="presentation" xmlns:a="drawing"><a:p><a:r><a:t>教訓</a:t></a:r></a:p><a:p><a:r><a:t>事前に目的を確認することが重要だと分かった。</a:t></a:r></a:p></p:sld>')]:
    p=Path(d)/('test.'+ext)
    with zipfile.ZipFile(p,'w') as z:z.writestr(entry,xml)
    self.assertEqual(m.classify(m.extraction(p))['auto_status'],'yes')
 def test_blank_pdf(self):
  from pypdf import PdfWriter
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'blank.pdf';w=PdfWriter();w.add_blank_page(width=100,height=100);w.write(p)
   self.assertEqual(m.classify(m.extraction(p))['auto_status'],'review')
 def test_worker_incremental(self):
  with tempfile.TemporaryDirectory() as d:
   b=Path(d);cache=b/'cache';cache.mkdir();folder=b/'general'/'2026-01-01';folder.mkdir(parents=True)
   path=folder/'test.docx'
   with zipfile.ZipFile(path,'w') as z:z.writestr('word/document.xml','<w:document xmlns:w="w"><w:p><w:r><w:t>教訓：事前に議論の目的を確認しておくことが重要だと分かった。</w:t></w:r></w:p></w:document>')
   config={'source_mode':'onedrive','cache_dir':str(cache),'roots':{'general':{'path':str(folder.parent)}}};cp=b/'config.json';cp.write_text(json.dumps(config))
   snapshot={'source_fingerprint':'test','folders':{'g':{'kind':'general','name':'2026-01-01'}},'files':{'onedrive:f':{'folder_key':'g','name':path.name,'local_path':str(path)}}};(cache/'snapshot.json').write_text(json.dumps(snapshot))
   m.run(cp);data=json.loads((cache/'analysis-results.json').read_text());self.assertEqual(data['files']['onedrive:f']['auto_status'],'yes');self.assertIn('file_size',data['files']['onedrive:f'])
   m.run(cp);self.assertEqual(json.loads((cache/'analysis-status.json').read_text())['reused'],1)
   path.touch();m.run(cp);self.assertEqual(json.loads((cache/'analysis-status.json').read_text())['reused'],0)
if __name__=='__main__':unittest.main()
