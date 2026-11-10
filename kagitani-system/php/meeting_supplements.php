<?php
/** User-confirmed sharing records without a SharePoint presentation file. */
trait MeetingSupplements {
    private function supplementDirectory() {
        return $this->config['supplements_dir'] ?? (dirname($this->directory()).'/meeting-supplements');
    }

    private function supplements() {
        $path=$this->supplementDirectory().'/records.json';
        if (!is_file($path)) return [];
        self::privatePath($path);
        $data=json_decode(file_get_contents($path),true,512,JSON_THROW_ON_ERROR);
        if (!is_array($data)) throw new RuntimeException('補足共有記録を読み込めません。');
        $records=[];
        foreach ($data as $record) {
            if (empty($record['id']) || empty($record['user_id']) ||
                (($record['meeting_kind'] ?? 'general') === 'general' && empty($record['lesson'])) ||
                strlen($record['meeting_date'] ?? '')!==10 || !self::meetingDate($record['meeting_date'])) throw new RuntimeException('補足共有記録の形式が不正です。');
            $records[$record['id']]=$record; // stable ID makes repeated import idempotent
        }
        return array_values($records);
    }

    private function supplementalRecords(array $filter,array $users) {
        $usersById=[];
        foreach ($users as $user) $usersById[(string)$user['user_id']]=$user['name'] ?? $user['user_name'];
        $selected=array_map('strval',$filter['user_ids'] ?? []);
        $snapshot=$this->snapshot();$result=[];
        foreach ($this->supplements() as $record) {
            if (($record['meeting_kind'] ?? 'general') !== 'general') continue;
            $date=$record['meeting_date'];$uid=(string)$record['user_id'];
            if (!isset($usersById[$uid]) || ($selected && !in_array($uid,$selected,true))) continue;
            if (!empty($filter['start_date']) && $date<substr($filter['start_date'],0,10)) continue;
            if (!empty($filter['end_date']) && $date>substr($filter['end_date'],0,10)) continue;
            $folder=['id'=>'manual-general-'.$date,'drive_id'=>'supplemental','kind'=>'general','date'=>$date,
                'name'=>$date.' 全体MT（共有補足記録）','web_url'=>''];
            // Attach to an existing same-day folder if present; never count the meeting twice.
            $matches=[];
            foreach ($snapshot['folders'] ?? [] as $key=>$f) if ($f['kind']==='general' && $f['date']===$date) $matches[$key]=$f;
            if ($matches) {ksort($matches);$folder=reset($matches);}
            $result[]=['record_id'=>'supplement:'.$record['id'],'meeting_date'=>$date,'created_at'=>$date.' 00:00:00','updated_at'=>$date.' 00:00:00',
                'origin_type'=>'general','user_id'=>$uid,'user_name'=>$usersById[$uid],
                'name'=>$record['title'] ?? ($usersById[$uid].' 教訓共有（ファイルなし）'),'folder'=>$folder,'files'=>[],
                'file_count'=>0,'participant_conflict'=>false,'supplemental'=>$record];
        }
        return $result;
    }

    private function historicalResearchRecords($metric,array $filter,array $users) {
        $names=[];foreach($users as $u)$names[(string)$u['user_id']]=$u['name'] ?? $u['user_name'];
        $selected=array_map('strval',$filter['user_ids'] ?? []);$snapshot=$this->snapshot();$out=[];
        foreach($this->supplements() as $record) {
            if (($record['meeting_kind'] ?? 'general')!=='research') continue;
            $share=($record['record_type'] ?? '')==='lesson_share_assumption';
            if (($metric==='research_lesson_shares_assumed_total')!==$share) continue;
            if (!$share && ($record['record_type'] ?? '')!=='recorded_discussion') continue;
            if ($metric==='reframing_discussions_assumed_total' && empty($record['reframing_assumed']))continue;
            $uid=(string)$record['user_id'];$date=$record['meeting_date'];
            if (!isset($names[$uid]) || ($selected && !in_array($uid,$selected,true))) continue;
            if (!empty($filter['start_date']) && $date<substr($filter['start_date'],0,10))continue;
            if (!empty($filter['end_date']) && $date>substr($filter['end_date'],0,10))continue;
            $folder=['id'=>'historical-research-'.$date,'drive_id'=>'historical','kind'=>'research','date'=>$date,'name'=>$date.' 研究MT（利用者指定記録）','web_url'=>''];
            $matching=[];foreach($snapshot['folders'] ?? [] as $key=>$f)if($f['kind']==='research'&&$f['date']===$date)$matching[$key]=$f;
            if($matching){ksort($matching);$folder=reset($matching);}
            $out[]=['record_id'=>'historical:'.$record['id'],'meeting_date'=>$date,'created_at'=>$date.' 00:00:00','updated_at'=>$date.' 00:00:00',
                'origin_type'=>'research','user_id'=>$uid,'user_name'=>$names[$uid],'name'=>$record['title'],'folder'=>$folder,'files'=>[],
                'file_count'=>0,'participant_conflict'=>false,'historical'=>$record];
        }
        return $out;
    }

    public function supplementEvidence($id) {
        foreach ($this->supplements() as $record) {
            if ($record['id']!==$id) continue;
            $name=$record['evidence_file'] ?? '';
            if (!preg_match('/^[a-zA-Z0-9_-]+\.png$/',$name)) break;
            $dir=realpath($this->supplementDirectory().'/evidence');$path=$dir ? realpath($dir.'/'.$name) : false;
            if (!$path || dirname($path)!==$dir || !is_file($path)) break;
            self::privatePath($path);
            return ['path'=>$path,'mime'=>'image/png','name'=>$name];
        }
        throw new RuntimeException('補足記録の根拠画像が見つかりません。');
    }
}
