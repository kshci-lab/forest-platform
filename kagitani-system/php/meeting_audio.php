<?php
/** Durable local recordings, timecoded transcripts and human-confirmed lesson links. */
trait MeetingAudio {
    private $audioJsonCache=[];
    private $audioTranscriptCache=[];
    private function audioDirectory($create=false) {
        $dir=$this->config['audio_store_dir'] ?? (dirname($this->directory()).'/meeting-audio');
        if($create && !is_dir($dir))mkdir($dir,0700,true);
        if(is_dir($dir))self::privatePath($dir);
        return $dir;
    }
    private function audioRead($name,$default=[]) {
        if(array_key_exists($name,$this->audioJsonCache))return $this->audioJsonCache[$name];
        $path=$this->audioDirectory().'/'.$name.'.json';
        return $this->audioJsonCache[$name]=is_file($path) ? json_decode(file_get_contents($path),true,512,JSON_THROW_ON_ERROR) : $default;
    }
    private function audioWrite($name,array $data) {
        $dir=$this->audioDirectory(true);$tmp=tempnam($dir,'.audio-');chmod($tmp,0600);
        try{file_put_contents($tmp,json_encode($data,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));if(!rename($tmp,$dir.'/'.$name.'.json'))throw new RuntimeException('音声記録を保存できません。');$this->audioJsonCache[$name]=$data;}
        finally{if(is_file($tmp))unlink($tmp);}
    }
    public function audioStatus() {
        if(!$this->config)return ['state'=>'unconfigured','message'=>'OneDriveの設定が必要です。'];
        $state=$this->audioRead('status',['state'=>'never','message'=>'音声はまだ処理していません。','done'=>0,'total'=>0]);
        if(in_array($state['state'],['queued','scanning','loading_model','converting','transcribing','matching'],true) && time()-strtotime($state['updated_at'] ?? '1970-01-01')>600) {
            $state['state']='interrupted';$state['message']='音声処理の進捗が停止しています。保存済み区間から再実行できます。';
        }
        return $state;
    }
    public function audioInventory(array $filter=[]) {
        if(!$this->config || !$this->status()['available'])return ['source_files'=>[],'recordings'=>[],'status'=>$this->audioStatus()];
        $snapshot=$this->snapshot();$source=[];
        foreach($snapshot['files'] ?? [] as $key=>$file) {
            if(self::fileKind($file['name'])!=='audio')continue;
            $folder=$snapshot['folders'][$file['folder_key']];
            if(!$this->audioDateMatches($folder['date'],$filter))continue;
            $source[]=['file_key'=>$key,'name'=>$file['name'],'meeting_date'=>$folder['date'],'kind'=>$folder['kind'],'folder_key'=>$file['folder_key']];
        }
        $recordings=[];
        foreach($this->audioRead('catalog',['recordings'=>[]])['recordings'] as $recording) {
            if(($recording['source_fingerprint'] ?? '')!==$this->fingerprint() || !$this->audioDateMatches($recording['meeting_date'],$filter))continue;
            unset($recording['source_signature'],$recording['context_history']);$recordings[]=$recording;
        }
        usort($recordings,function($a,$b){return strcmp($a['meeting_date'].$a['name'],$b['meeting_date'].$b['name']);});
        return ['source_files'=>$source,'recordings'=>$recordings,'status'=>$this->audioStatus()];
    }
    private function audioDateMatches($date,array $filter) {
        return (empty($filter['start_date']) || $date>=substr($filter['start_date'],0,10)) && (empty($filter['end_date']) || $date<=substr($filter['end_date'],0,10));
    }
    public function startAudioAnalysis(array $users=[]) {
        if(!$this->isLocal() || !$this->snapshot())throw new RuntimeException('正常に読み取ったOneDrive一覧が必要です。');
        $dir=$this->audioDirectory(true);$lock=fopen($dir.'/launch.lock','c');
        if(!$lock || !flock($lock,LOCK_EX|LOCK_NB))throw new RuntimeException('音声処理を起動中です。');
        try{
            $status=$this->audioStatus();
            if(in_array($status['state'],['queued','scanning','loading_model','converting','transcribing','matching'],true))return $status;
            if($users)$this->audioWrite('users',$users);else $users=$this->audioRead('users');
            $contexts=[];$snapshot=$this->snapshot();
            foreach($snapshot['folders'] as $key=>$folder) {
                $hasAudio=false;foreach($snapshot['files'] as $file)if($file['folder_key']===$key&&self::fileKind($file['name'])==='audio'){$hasAudio=true;break;}
                if(!$hasAudio)continue;
                $filter=['user_ids'=>[],'date_basis'=>'created_at','start_date'=>$folder['date'],'end_date'=>$folder['date']];
                $records=$this->records($folder['kind']==='general'?'shared_lessons_total':'research_mt_total',$filter,$users);$lessons=[];
                foreach($records as $record) {
                    if($record['folder']['id']!==$folder['id'] || $record['folder']['drive_id']!==$folder['drive_id'])continue;
                    foreach($record['files'] as $file) {
                        $evidence=$file['analysis']['evidence'] ?? [];if(!$evidence)$evidence=[['location'=>'本文未取得','text'=>'']];
                        foreach($evidence as $i=>$e) {
                            $id=$file['drive_id'].':'.$file['id'].':lesson-'.$i;
                            $lessons[]=['id'=>$id,'owner_id'=>$record['user_id'],'owner_name'=>$record['user_name'],
                                'title'=>$record['user_name'].'／'.$file['name'].'／'.$e['location'],'text'=>$e['text'],
                                'source_name'=>$file['name'],'source_signature'=>$file['analysis']['signature'] ?? null,
                                'surname_aliases'=>$this->config['participants']['surname_aliases'][(string)$record['user_id']] ?? []];
                        }
                    }
                }
                if($folder['kind']==='general')foreach($this->supplementalRecords($filter,$users) as $r) {
                    $lessons[]=['id'=>$r['record_id'],'owner_id'=>$r['user_id'],'owner_name'=>$r['user_name'],'title'=>$r['name'],
                        'text'=>$r['supplemental']['lesson'],'source_name'=>'共有補足記録','source_signature'=>hash('sha256',json_encode($r['supplemental'])),
                        'surname_aliases'=>$this->config['participants']['surname_aliases'][(string)$r['user_id']] ?? []];
                }
                $contexts[$key]=['kind'=>$folder['kind'],'meeting_date'=>$folder['date'],'lessons'=>$lessons,'signature'=>hash('sha256',json_encode($lessons,JSON_UNESCAPED_UNICODE))];
            }
            $this->audioWrite('contexts',$contexts);
            $configPath=$this->config['_config_path'] ?? '';$python=$this->config['analysis_python'] ?? (dirname($configPath).'/analysis-venv/bin/python');
            $worker=dirname(__DIR__,2).'/scripts/transcribe_meeting_audio.py';
            if(!$configPath || !is_executable($python) || !is_file($worker) || !function_exists('exec'))throw new RuntimeException('ローカル文字起こし環境が未設定です。');
            $state=['state'=>'queued','done'=>0,'total'=>0,'updated_at'=>gmdate('Y-m-d\TH:i:s\Z'),'message'=>'音声の取り込み・文字起こしを起動しています。'];$this->audioWrite('status',$state);
            $command='/usr/bin/nohup '.escapeshellarg($python).' '.escapeshellarg($worker).' --config '.escapeshellarg($configPath).' > '.escapeshellarg($dir.'/worker.log').' 2>&1 < /dev/null & echo $!';
            exec($command,$out,$exit);if($exit!==0||empty($out[0])||!ctype_digit(trim($out[0])))throw new RuntimeException('音声処理を起動できません。');
            return $state;
        }finally{flock($lock,LOCK_UN);fclose($lock);}
    }
    private function recording($id) {
        if(!is_string($id)||!preg_match('/^[a-f0-9]{32}$/',$id))throw new RuntimeException('録音IDが不正です。');
        $recording=$this->audioRead('catalog',['recordings'=>[]])['recordings'][$id] ?? null;
        if(!$recording || ($recording['source_fingerprint'] ?? '')!==$this->fingerprint())throw new RuntimeException('録音が見つかりません。');
        return $recording;
    }
    public function audioTranscript($id) {
        $recording=$this->recording($id);$path=$this->audioDirectory().'/transcripts/'.$id.'.json';
        if(!isset($this->audioTranscriptCache[$id]))$this->audioTranscriptCache[$id]=is_file($path)?json_decode(file_get_contents($path),true,512,JSON_THROW_ON_ERROR):['state'=>'pending','segments'=>[],'blocks'=>[]];
        $transcript=$this->audioTranscriptCache[$id];
        $reviews=$this->audioRead('reviews');
        foreach($transcript['blocks'] ?? [] as $i=>$block) {
            $review=$reviews[$id.':'.$block['id']] ?? null;
            if($review && ($review['context_signature'] ?? '')===($transcript['context_signature'] ?? ''))$transcript['blocks'][$i]['review']=$review;
        }
        return ['recording'=>$recording,'transcript'=>$transcript];
    }
    public function saveAudioReview($id,$blockId,$contextSignature,array $lessonIds,$start,$end,$decision,$reviewer) {
        $data=$this->audioTranscript($id);$t=$data['transcript'];
        if(($t['state'] ?? '')!=='complete'||($t['context_signature'] ?? '')!==$contextSignature)throw new RuntimeException('解析結果が更新されています。再表示して確認してください。');
        $block=null;foreach($t['blocks'] as $b)if($b['id']===$blockId){$block=$b;break;}
        if(!$block)throw new RuntimeException('議論区間が見つかりません。');
        $known=array_column($data['recording']['context']['lessons'],'id');
        if(array_diff($lessonIds,$known)||!in_array($decision,['confirmed','none','clear'],true))throw new RuntimeException('対応する教訓の指定が不正です。');
        if($decision==='confirmed'&&!$lessonIds)throw new RuntimeException('対応する教訓を選ぶか「対応なし」を選んでください。');
        if(!is_numeric($start)||!is_numeric($end)||(float)$start<0||(float)$end<=(float)$start||(float)$end>(float)$t['duration']+0.01)throw new RuntimeException('音声区間の開始・終了秒を確認してください。');
        $dir=$this->audioDirectory(true);$lock=fopen($dir.'/reviews.lock','c');if(!$lock||!flock($lock,LOCK_EX))throw new RuntimeException('確認結果を保存できません。');
        try{
            $reviews=$this->audioRead('reviews');$key=$id.':'.$blockId;
            if($decision==='clear'){if(isset($reviews[$key])){$history=$this->audioRead('review-history');$history[]=$reviews[$key];$this->audioWrite('review-history',$history);}unset($reviews[$key]);}
            else{
                if(isset($reviews[$key])){$history=$this->audioRead('review-history');$history[]=$reviews[$key];$this->audioWrite('review-history',$history);}
                $reviews[$key]=['recording_id'=>$id,'block_id'=>$blockId,'context_signature'=>$contextSignature,'decision'=>$decision,'lesson_ids'=>$decision==='none'?[]:array_values(array_unique($lessonIds)),
                    'start'=>(float)$start,'end'=>(float)$end,'reviewer_id'=>$reviewer,'reviewed_at'=>gmdate('Y-m-d\TH:i:s\Z')];
            }
            $this->audioWrite('reviews',$reviews);
        }finally{flock($lock,LOCK_UN);fclose($lock);}
    }
    public function audioMetricRecords($metric,array $filter,array $users) {
        $snapshot=$this->snapshot();if(!$snapshot)return [];$out=[];
        if($metric==='audio_confirmed_lessons_total') {
            $names=[];foreach($users as $user)$names[(string)$user['user_id']]=$user['name'] ?? $user['user_name'];
            $selected=array_map('strval',$filter['user_ids'] ?? []);$unique=[];
            foreach($this->audioInventory($filter)['recordings'] as $recording) {
                $data=$this->audioTranscript($recording['id']);$lookup=[];
                foreach($recording['context']['lessons'] as $lesson)$lookup[$lesson['id']]=$lesson;
                foreach($data['transcript']['blocks'] ?? [] as $block) {
                    $review=$block['review'] ?? null;if(!$review||$review['decision']!=='confirmed')continue;
                    foreach($review['lesson_ids'] as $lessonId) {
                        $lesson=$lookup[$lessonId] ?? null;if(!$lesson)continue;$uid=$lesson['owner_id'];
                        if($selected&&!in_array((string)$uid,$selected,true)&&!($uid===null&&!empty($filter['include_unmatched'])))continue;
                        $key=$recording['meeting_id'].':'.$lessonId;
                        if(isset($unique[$key]))continue;$unique[$key]=true;
                        $date=$recording['meeting_date'];$folder=$snapshot['folders'][$recording['folder_key']] ?? ['id'=>$recording['folder_key'],'drive_id'=>'audio-archive','kind'=>$recording['kind'],'date'=>$date,'name'=>$date.' MT録音','web_url'=>''];
                        $out[]=['record_id'=>'audio-confirmed:'.$key,'meeting_date'=>$date,'created_at'=>$date.' 00:00:00','updated_at'=>$date.' 00:00:00',
                            'origin_type'=>$recording['kind'],'user_id'=>$uid,'user_name'=>$uid===null?'未判定':($names[(string)$uid] ?? $lesson['owner_name']),
                            'name'=>$lesson['title'],'folder'=>$folder,'files'=>[],'file_count'=>0,'participant_conflict'=>false,
                            'audio_evidence'=>['recording_id'=>$recording['id'],'start'=>$review['start'],'end'=>$review['end'],'lesson'=>$lesson['text'],'recording_name'=>$recording['name']]];
                    }
                }
            }
            return $out;
        }
        foreach($snapshot['files'] as $key=>$file) {
            if(self::fileKind($file['name'])!=='audio')continue;$folder=$snapshot['folders'][$file['folder_key']];$date=$folder['date'];
            if(!$this->audioDateMatches($date,$filter))continue;
            $id=$metric==='meeting_audio_sessions_total'?$file['folder_key']:$key;
            if(isset($out[$id])){$out[$id]['files'][]=$file;$out[$id]['file_count']++;continue;}
            $out[$id]=['record_id'=>'audio:'.$id,'meeting_date'=>$date,'created_at'=>$date.' 00:00:00','updated_at'=>$date.' 00:00:00',
                'origin_type'=>$folder['kind'],'user_id'=>null,'user_name'=>'MT全体の録音（個人未割当）','name'=>$metric==='meeting_audio_sessions_total'?$folder['name']:$file['name'],
                'folder'=>$folder,'files'=>[$file],'file_count'=>1,'participant_conflict'=>false];
        }
        return array_values($out);
    }

    public function audioAsset($id) {
        $r=$this->recording($id);$name=$r['asset_name'] ?? '';
        if(!preg_match('/^[a-f0-9]{64}\.(m4a|mp3|wav|aac|aif|aiff|caf|flac|ogg|opus)$/',$name))throw new RuntimeException('音声資産の形式が不正です。');
        $dir=realpath($this->audioDirectory().'/assets');$path=$dir?realpath($dir.'/'.$name):false;
        if(!$path||dirname($path)!==$dir||!is_file($path))throw new RuntimeException('保存済み音声が見つかりません。');
        $ext=pathinfo($path,PATHINFO_EXTENSION);$types=['m4a'=>'audio/mp4','mp3'=>'audio/mpeg','wav'=>'audio/wav','aac'=>'audio/aac','flac'=>'audio/flac','ogg'=>'audio/ogg','opus'=>'audio/ogg','aif'=>'audio/aiff','aiff'=>'audio/aiff','caf'=>'audio/x-caf'];
        return ['path'=>$path,'mime'=>$types[$ext],'name'=>$r['name']];
    }
}
