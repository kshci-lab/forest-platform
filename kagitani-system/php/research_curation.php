<?php
/** Dashboard-only decisions. Source MySQL and learning records are never written. */
class ResearchCuration {
    private PDO $db;
    public function __construct(string $path) {
        if(!is_dir(dirname($path))&&!mkdir(dirname($path),0700,true)&&!is_dir(dirname($path)))throw new RuntimeException('整理保存先を作成できません。');
        $this->db=new PDO('sqlite:'.$path,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
        chmod($path,0600);$this->db->exec('PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS revisions (revision INTEGER PRIMARY KEY, state TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL, operation_id TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL); CREATE TABLE IF NOT EXISTS previews (id TEXT PRIMARY KEY, actor TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL);');
    }
    public static function path(): string {return getenv('FOREST_CURATION_DB')?:dirname(__DIR__,4).'/forest-platform-private/research-curation/curation.sqlite';}
    public static function json($v):string{return json_encode($v,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);}
    public function read(?int $revision=null):array {
        if($revision===0)return ['revision'=>0,'groups'=>[],'decisions'=>[]];
        $s=$revision===null?$this->db->query('SELECT * FROM revisions ORDER BY revision DESC LIMIT 1'):$this->db->prepare('SELECT * FROM revisions WHERE revision=?');if($revision!==null)$s->execute([$revision]);$r=$s->fetch();
        if(!$r){if($revision!==null)throw new RuntimeException('指定の整理版がありません。再取得してください。',409);return ['revision'=>0,'groups'=>[],'decisions'=>[]];}return json_decode($r['state'],true,512,JSON_THROW_ON_ERROR);
    }
    public static function key(array $r):string {
        if(isset($r['origin_type']))return $r['origin_type'].'/'.($r['reflection_group_id']!==null?'reflection/'.$r['reflection_group_id']:($r['origin_type']==='map'?'legacy_node/'.$r['object_node_id']:'legacy_lesson/'.$r['lesson_id']));
        return 'means/'.$r['object_node_id'];
    }
    public static function hash(array $r):string {return hash('sha256',self::json($r));}
    public static function exclusions(array $st):array{$out=[];foreach($st['groups']??[]as$g)if($g['active'])foreach($g['members']as$k)if($k!==$g['representative'])$out[$k]=['group_id'=>$g['id'],'representative'=>$g['representative'],'reason'=>$g['reason']];return $out;}
    public static function normalize($v):string{return preg_replace('/^[\s\x{3000}]+|[\s\x{3000}]+$/u','',str_replace(["\r\n","\r"],"\n",(string)$v));}
    public static function candidates(array $rows):array {
        $groups=[];foreach($rows as$r){$kind=isset($r['origin_type'])?$r['origin_type']:'means';$text=self::normalize($r['lesson_learned']??$r['content']??'');if($text==='')continue;$group=$r['user_id'].'|'.$kind.'|'.hash('sha256',$text);$groups[$group][self::key($r)]=$r;}
        $out=[];foreach($groups as$g)if(count($g)>1){$rs=array_values($g);$full=array_unique(array_map(fn($r)=>self::json(array_map([self::class,'normalize'],[$r['lesson_learned']??$r['content'],$r['why_important']??$r['purpose']??'',$r['opportunity']??$r['reason_text']??''])),$rs));$out[]=['keys'=>array_keys($g),'match'=>count($full)===1?'内容・理由等の一致（文脈は要確認）':'内容一致・理由等に相違','rows'=>$rs,'rule'=>'exact-v1'];}return $out;
    }
    public static function propose(array $state,array $rows,array $input,string $actor):array {
        $mode=$input['mode']??'exclude';$reason=trim($input['reason']??'');if($reason==='')throw new RuntimeException('判断理由を入力してください。');
        $next=$state;$id=$input['group_id']??bin2hex(random_bytes(16));
        if($mode==='undo') {if(!isset($next['groups'][$id])||!$next['groups'][$id]['active'])throw new RuntimeException('有効な整理判断がありません。',409);$next['groups'][$id]['active']=false;$next['groups'][$id]['undo_actor']=$actor;$next['groups'][$id]['undo_reason']=$reason;}
        else {
            $keys=array_values(array_unique($input['keys']??[]));if(count($keys)<2||count($keys)>20)throw new RuntimeException('同じ種類・参加者の記録を2〜20件選んでください。');
            $chosen=[];foreach($keys as$k){if(!isset($rows[$k]))throw new RuntimeException('対象が更新・削除されています。再取得してください。',409);$chosen[$k]=$rows[$k];}
            if(count(array_unique(array_column($chosen,'user_id')))!==1||count(array_unique(array_map(fn($r)=>$r['origin_type']??'means',$chosen)))!==1)throw new RuntimeException('同じ参加者・同じ起点の記録だけを整理できます。');
            if(!in_array($mode,['exclude','hold','distinct'],true))throw new RuntimeException('不明な判断です。');
            if($mode==='exclude'){
                $representative=$input['representative']??'';if(!in_array($representative,$keys,true))throw new RuntimeException('残す記録を選んでください。');
                foreach($state['groups']as$g)if($g['active']&&array_intersect($g['members'],$keys))throw new RuntimeException('すでに整理グループに含まれています。先に既存判断を取り消してください。',409);
                $next['groups'][$id]=['id'=>$id,'members'=>$keys,'representative'=>$representative,'active'=>true,'reason'=>$reason,'actor'=>$actor,'created_at'=>gmdate('c'),'snapshots'=>$chosen,'hashes'=>array_map([self::class,'hash'],$chosen)];
            } else $next['decisions'][]=['id'=>$id,'members'=>$keys,'mode'=>$mode,'reason'=>$reason,'actor'=>$actor,'created_at'=>gmdate('c'),'hashes'=>array_map([self::class,'hash'],$chosen)];
        }
        $next['revision']=$state['revision']+1;return $next;
    }
    public function preview(string $actor,array $payload):string {$id=bin2hex(random_bytes(24));$s=$this->db->prepare('INSERT INTO previews VALUES(?,?,?,?)');$s->execute([$id,$actor,self::json($payload),time()]);return $id;}
    public function previewData(string $actor,string $id):array{$s=$this->db->prepare('SELECT * FROM previews WHERE id=? AND actor=?');$s->execute([$id,$actor]);$r=$s->fetch();if(!$r||$r['created_at']<time()-1800)throw new RuntimeException('影響確認の有効期限が切れました。再確認してください。',409);return json_decode($r['payload'],true,512,JSON_THROW_ON_ERROR);}
    public function result(string $operation,string $fingerprint):?array{$s=$this->db->prepare('SELECT * FROM revisions WHERE operation_id=?');$s->execute([$operation]);$r=$s->fetch();if(!$r)return null;if(!hash_equals($r['fingerprint'],$fingerprint))throw new RuntimeException('同じ操作IDで異なる内容は保存できません。',409);return json_decode($r['state'],true);}
    public function commit(string $actor,int $expected,array $next,string $operation,string $fingerprint):array {
        if(!preg_match('/^[a-zA-Z0-9-]{16,80}$/',$operation))throw new RuntimeException('操作IDを確認してください。');
        $this->db->exec('BEGIN IMMEDIATE');try{if($old=$this->result($operation,$fingerprint)){$this->db->exec('COMMIT');return $old;}if($this->read()['revision']!==$expected)throw new RuntimeException('整理判断が別の画面で変更されました。再確認してください。',409);$s=$this->db->prepare('INSERT INTO revisions VALUES(?,?,?,?,?,?)');$s->execute([$expected+1,self::json($next),$actor,gmdate('c'),$operation,$fingerprint]);$this->db->exec('COMMIT');return $next;}catch(Throwable $e){$this->db->exec('ROLLBACK');throw $e;}
    }
    public function history():array{return $this->db->query('SELECT revision,actor,created_at FROM revisions ORDER BY revision DESC LIMIT 100')->fetchAll();}
}
