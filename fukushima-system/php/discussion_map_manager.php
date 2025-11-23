<?php
// 議論内省マップのデータを読み出すための処理群

session_start();
require("connect_db.php");

// POSTデータの受け取り
$user_id = isset($_SESSION['USERID']) ? $_SESSION['USERID'] : null;      //ユーザID
$map_id = isset($_SESSION['MAPID']) ? $_SESSION['MAPID'] : null;    //シートID

$purpose = isset($_POST["purpose"]) ? $_POST["purpose"] : null; // どんなデータを取得したり保存したりするのか（内容．例：発話ノードのXMLからの保存orマップノードの取得）

$target_map_created_start_times = null;  // リフレクションの開始時間
$first_load_flag = isset($_POST["first_load_flag"]) ? $_POST["first_load_flag"] : null;// どんなデータがほしいというリクエストなのかを判定

// 外部化フォームの保存処理（プリペアドステートメント使用）: 最優先で実行して他のSELECTを回避
if($purpose === "save_externalized_content") {
    header('Content-Type: application/json; charset=utf-8');
    // デバッグ: 受信POSTをログ出力（再現時のみ有効）
    @file_put_contents(__DIR__ . '/debug.txt', date('c') . " save_externalized_content POST: " . print_r($_POST, true) . "\n", FILE_APPEND);
    // 必要な値を受け取る
    // remarked_utterance_id: 複数対応（CSV優先）
    $remarked_utterance_ids = isset($_POST['remarked_utterance_ids']) ? $_POST['remarked_utterance_ids'] : null;
    $remarked_utterance_id_single = isset($_POST['remarked_utterance_id']) ? $_POST['remarked_utterance_id'] : '';
    $remarked_ids_str = '';
    if ($remarked_utterance_ids !== null && $remarked_utterance_ids !== '') {
        // 正規化：全角カンマを半角に、空要素除去
        $tmp = str_replace('，', ',', $remarked_utterance_ids);
        $parts = array_filter(array_map('trim', explode(',', $tmp)), function($v){ return $v !== ''; });
        $remarked_ids_str = implode(',', $parts);
    } else {
        $remarked_ids_str = trim((string)$remarked_utterance_id_single);
    }
    $selected_contents = isset($_POST['selected_contents']) ? $_POST['selected_contents'] : '';
    $stage1 = isset($_POST['stage1']) ? $_POST['stage1'] : '';
    $stage2 = isset($_POST['stage2']) ? $_POST['stage2'] : '';
    $stage3 = isset($_POST['stage3']) ? $_POST['stage3'] : '';
    $used_flag = 1; // 登録時は使用済み=1
    $knowledge_fragment_content = isset($_POST['knowledge_fragment_content']) ? $_POST['knowledge_fragment_content'] : '';

    // カラム存在チェック: knowledge_fragments_content（推奨）/ knowledge_fragment_content（旧）
    $kfragColName = null; // 実際に使うカラム名
    try {
        if ($colRes2a = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'knowledge_fragments_content'")) {
            if ($colRes2a->num_rows > 0) { $kfragColName = 'knowledge_fragments_content'; }
            $colRes2a->close();
        }
        if ($kfragColName === null) {
            if ($colRes2b = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'knowledge_fragment_content'")) {
                if ($colRes2b->num_rows > 0) { $kfragColName = 'knowledge_fragment_content'; }
                $colRes2b->close();
            }
        }
    } catch (Exception $exCol2) {
        @file_put_contents(__DIR__ . '/debug.txt', date('c') . " save_externalized_content SHOW COLUMNS (kfrag) error: " . $exCol2->getMessage() . "\n", FILE_APPEND);
    }
    $hasKFragCol = ($kfragColName !== null);

    // カラム存在チェック: used_remarked_utterance が外部DBに存在するか
    $hasUsedCol = false;
    try {
        if ($colRes = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'used_remarked_utterance'")) {
            $hasUsedCol = ($colRes->num_rows > 0);
            $colRes->close();
        }
    } catch (Exception $exCol) {
        // 失敗時は未存在扱い（エラーログのみ）
        @file_put_contents(__DIR__ . '/debug.txt', date('c') . " save_externalized_content SHOW COLUMNS error: " . $exCol->getMessage() . "\n", FILE_APPEND);
    }

    // カラム存在チェック: user_id が外部DBに存在するか
    $hasUserCol = false;
    try {
        if ($colResU = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'user_id'")) {
            $hasUserCol = ($colResU->num_rows > 0);
            $colResU->close();
        }
    } catch (Exception $exColU) {
        @file_put_contents(__DIR__ . '/debug.txt', date('c') . " save_externalized_content SHOW COLUMNS (user_id) error: " . $exColU->getMessage() . "\n", FILE_APPEND);
    }

    // バリデーション
    if ($selected_contents === '') {
        echo json_encode(["status" => "error", "error" => "selected_contents が空です"]);
        return;
    }

    // まずは外部キー（PK）を指定せずにINSERT（通常は AUTO_INCREMENT を期待）
    // ただし環境によっては externalized_contents_id が AUTO_INCREMENT でない場合がある。
    // その場合は例外を待たずに最初から明示的なIDを割り当ててINSERTする（ログを減らし確実に挿入するため）。
    $extIdAuto = false;
    try {
        if ($colExt = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'externalized_contents_id'")) {
            $rowCol = $colExt->fetch_assoc();
            if ($rowCol && isset($rowCol['Extra']) && stripos($rowCol['Extra'], 'auto_increment') !== false) {
                $extIdAuto = true;
            }
            $colExt->close();
        }
    } catch (Exception $_ex) {
        // ignore and assume not auto
    }

    $use_explicit_id_from_start = !$extIdAuto;
    $deleted = 0;
    if ($hasUsedCol && $hasKFragCol) {
        if ($hasUserCol) {
            $stmt = $mysqli->prepare("INSERT INTO externalized_contents (remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, used_remarked_utterance, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        } else {
            $stmt = $mysqli->prepare("INSERT INTO externalized_contents (remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, used_remarked_utterance, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        }
    } elseif ($hasUsedCol && !$hasKFragCol) {
        if ($hasUserCol) {
            $stmt = $mysqli->prepare("INSERT INTO externalized_contents (remarked_utterance_id, selected_contents, stage1, stage2, stage3, used_remarked_utterance, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        } else {
            $stmt = $mysqli->prepare("INSERT INTO externalized_contents (remarked_utterance_id, selected_contents, stage1, stage2, stage3, used_remarked_utterance, deleted) VALUES (?, ?, ?, ?, ?, ?, ?)");
        }
    } elseif (!$hasUsedCol && $hasKFragCol) {
        if ($hasUserCol) {
            $stmt = $mysqli->prepare("INSERT INTO externalized_contents (remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        } else {
            $stmt = $mysqli->prepare("INSERT INTO externalized_contents (remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, deleted) VALUES (?, ?, ?, ?, ?, ?, ?)");
        }
    } else {
        if ($hasUserCol) {
            $stmt = $mysqli->prepare("INSERT INTO externalized_contents (remarked_utterance_id, selected_contents, stage1, stage2, stage3, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?)");
        } else {
            $stmt = $mysqli->prepare("INSERT INTO externalized_contents (remarked_utterance_id, selected_contents, stage1, stage2, stage3, deleted) VALUES (?, ?, ?, ?, ?, ?)");
        }
    }
    if(!$stmt){
        @file_put_contents(__DIR__ . '/debug.txt', date('c') . " save_externalized_content prepare error (no pk): " . $mysqli->error . "\n", FILE_APPEND);
        echo json_encode(["status" => "error", "error" => $mysqli->error]);
        return;
    }

    // 明示IDモードの場合は、ここでは prepare した $stmt を使わず、最初から explicit ID を付けたINSERTへ切り替える。
    if ($use_explicit_id_from_start) {
        // クローズして後続の explicit-insert を呼び出すためのフラグ経路へ進める
        @$stmt->close();
        // compute next explicit id (same logic as fallback)
        $res = $mysqli->query("SELECT MAX(externalized_contents_id) AS max_id FROM externalized_contents");
        $row = $res ? $res->fetch_assoc() : null;
        $currentMax = ($row && isset($row['max_id']) && $row['max_id'] !== null) ? intval($row['max_id'], 10) : 14; // start 15
        $nextExtId = $currentMax + 1; // 15 スタート

        // prepare explicit-insert statement (reuse fallback variants)
        if ($hasUsedCol && $hasKFragCol) {
            if ($hasUserCol) {
                $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, used_remarked_utterance, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            } else {
                $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, used_remarked_utterance, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            }
        } elseif ($hasUsedCol && !$hasKFragCol) {
            if ($hasUserCol) {
                $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, used_remarked_utterance, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            } else {
                $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, used_remarked_utterance, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            }
        } elseif (!$hasUsedCol && $hasKFragCol) {
            if ($hasUserCol) {
                $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            } else {
                $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            }
        } else {
            if ($hasUserCol) {
                $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            } else {
                $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, deleted) VALUES (?, ?, ?, ?, ?, ?, ?)");
            }
        }
        if(!$stmt2){
            @file_put_contents(__DIR__ . '/debug.txt', date('c') . " save_externalized_content prepare error (explicit id): " . $mysqli->error . "\n", FILE_APPEND);
            echo json_encode(["status" => "error", "error" => $mysqli->error]);
            return;
        }
        // bind for explicit-insert
        if ($hasUsedCol && $hasKFragCol) {
            if ($hasUserCol) {
                $uid_val2 = ($user_id !== null) ? (int)$user_id : 0;
                $stmt2->bind_param("issssssiii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $used_flag, $uid_val2, $deleted);
            } else {
                $stmt2->bind_param("issssssii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $used_flag, $deleted);
            }
        } elseif ($hasUsedCol && !$hasKFragCol) {
            if ($hasUserCol) {
                $uid_val2 = ($user_id !== null) ? (int)$user_id : 0;
                $stmt2->bind_param("isssssiii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $used_flag, $uid_val2, $deleted);
            } else {
                $stmt2->bind_param("isssssii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $used_flag, $deleted);
            }
        } elseif (!$hasUsedCol && $hasKFragCol) {
            if ($hasUserCol) {
                $uid_val2 = ($user_id !== null) ? (int)$user_id : 0;
                $stmt2->bind_param("issssssii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $uid_val2, $deleted);
            } else {
                $stmt2->bind_param("issssssi", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $deleted);
            }
        } else {
            if ($hasUserCol) {
                $uid_val2 = ($user_id !== null) ? (int)$user_id : 0;
                $stmt2->bind_param("isssssii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $uid_val2, $deleted);
            } else {
                $stmt2->bind_param("isssssi", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $deleted);
            }
        }
        if(!$stmt2->execute()){
            @file_put_contents(__DIR__ . '/debug.txt', date('c') . " save_externalized_content execute error (explicit id): " . $stmt2->error . "\n", FILE_APPEND);
            echo json_encode(["status" => "error", "error" => $stmt2->error]);
            $stmt2->close();
            return;
        }
        $stmt2->close();

        // knowledge_fragment 挿入（explicit）
        if ($knowledge_fragment_content !== '') {
            $kfMax = 0;
            if ($resKf = $mysqli->query("SELECT MAX(knowledge_fragment_id) AS max_id FROM {$kfragTable}")) {
                $rowKf = $resKf->fetch_assoc();
                if ($rowKf && isset($rowKf['max_id']) && $rowKf['max_id'] !== null) {
                    $kfMax = intval($rowKf['max_id'], 10);
                }
            }
            $nextKfId = ($kfMax >= 15) ? ($kfMax + 1) : 15;
            $sqlKf2 = "INSERT INTO {$kfragTable} (knowledge_fragment_id, {$kfTextCol}, externalized_contents_id) VALUES (?, ?, ?)";
            if ($stmtKf = $mysqli->prepare($sqlKf2)) {
                $stmtKf->bind_param("isi", $nextKfId, $knowledge_fragment_content, $nextExtId);
                if (!@$stmtKf->execute()) {
                    @file_put_contents(__DIR__ . '/debug.txt', date('c') . " knowledge_fragment ({$kfragTable}) insert failed (explicit): " . $stmtKf->error . "\n", FILE_APPEND);
                }
                @$stmtKf->close();
            } else {
                @file_put_contents(__DIR__ . '/debug.txt', date('c') . " knowledge_fragment ({$kfragTable}) prepare failed (explicit): " . $mysqli->error . "\n", FILE_APPEND);
            }
        }

        echo json_encode(["status" => "ok", "id" => $nextExtId]);
        return;
    }

    // bind
    if ($hasUsedCol && $hasKFragCol) {
        if ($hasUserCol) {
            // s s s s s s i i i
            $uid_val = ($user_id !== null) ? (int)$user_id : 0;
            $stmt->bind_param("ssssssiii", $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $used_flag, $uid_val, $deleted);
        } else {
            // s s s s s s i i
            $stmt->bind_param("ssssssii", $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $used_flag, $deleted);
        }
    } elseif ($hasUsedCol && !$hasKFragCol) {
        if ($hasUserCol) {
            // s s s s s i i i
            $uid_val = ($user_id !== null) ? (int)$user_id : 0;
            $stmt->bind_param("sssssiii", $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $used_flag, $uid_val, $deleted);
        } else {
            // s s s s s i i
            $stmt->bind_param("sssssii", $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $used_flag, $deleted);
        }
    } elseif (!$hasUsedCol && $hasKFragCol) {
        if ($hasUserCol) {
            // s s s s s s i i
            $uid_val = ($user_id !== null) ? (int)$user_id : 0;
            $stmt->bind_param("ssssssii", $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $uid_val, $deleted);
        } else {
            // s s s s s s i
            $stmt->bind_param("ssssssi", $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $deleted);
        }
    } else {
        if ($hasUserCol) {
            // s s s s s i i
            $uid_val = ($user_id !== null) ? (int)$user_id : 0;
            $stmt->bind_param("sssssii", $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $uid_val, $deleted);
        } else {
            // s s s s s i
            $stmt->bind_param("sssssi", $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $deleted);
        }
    }

    // knowledge_fragment(s) テーブル名と本文カラム名を検出
    $kfragTable = null;
    try {
        if ($resA = $mysqli->query("SHOW TABLES LIKE 'knowledge_fragments'")) {
            if ($resA->num_rows > 0) { $kfragTable = 'knowledge_fragments'; }
            $resA->close();
        }
        if ($kfragTable === null) {
            if ($resB = $mysqli->query("SHOW TABLES LIKE 'knowledge_fragment'")) {
                if ($resB->num_rows > 0) { $kfragTable = 'knowledge_fragment'; }
                $resB->close();
            }
        }
    } catch (Exception $_ex) { /* noop */ }
    if ($kfragTable === null) { $kfragTable = 'knowledge_fragment'; }

    $kfTextCol = 'knowledge_fragment_content';
    try {
        if ($colKfA = $mysqli->query("SHOW COLUMNS FROM {$kfragTable} LIKE 'comment'")) {
            if ($colKfA->num_rows > 0) { $kfTextCol = 'comment'; }
            $colKfA->close();
        }
        if ($kfTextCol === 'knowledge_fragment_content'){
            if ($colKfB = $mysqli->query("SHOW COLUMNS FROM {$kfragTable} LIKE 'knowledge_fragment_content'")) {
                if ($colKfB->num_rows > 0) { $kfTextCol = 'knowledge_fragment_content'; }
                $colKfB->close();
            }
        }
    } catch(Exception $eKf){ /* noop */ }

    try {
        $ok = $stmt->execute();
        if ($ok) {
            $newId = $stmt->insert_id;
            $stmt->close();
            // knowledge_fragment にも保存（空の場合はスキップ）
            if ($knowledge_fragment_content !== '') {
                $kfMax = 0;
                if ($resKf = $mysqli->query("SELECT MAX(knowledge_fragment_id) AS max_id FROM {$kfragTable}")) {
                    $rowKf = $resKf->fetch_assoc();
                    if ($rowKf && isset($rowKf['max_id']) && $rowKf['max_id'] !== null) {
                        $kfMax = intval($rowKf['max_id'], 10);
                    }
                }
                // 採番初期値は 15 からスタート（要件）
                $nextKfId = ($kfMax >= 15) ? ($kfMax + 1) : 15;
                $sqlKf = "INSERT INTO {$kfragTable} (knowledge_fragment_id, {$kfTextCol}, externalized_contents_id) VALUES (?, ?, ?)";
                if ($stmtKf = $mysqli->prepare($sqlKf)) {
                    $stmtKf->bind_param("isi", $nextKfId, $knowledge_fragment_content, $newId);
                    if (!@$stmtKf->execute()) {
                        @file_put_contents(__DIR__ . '/debug.txt', date('c') . " knowledge_fragment ({$kfragTable}) insert failed (post-insert): " . $stmtKf->error . "\n", FILE_APPEND);
                    }
                    @$stmtKf->close();
                } else {
                    @file_put_contents(__DIR__ . '/debug.txt', date('c') . " knowledge_fragment ({$kfragTable}) prepare failed (post-insert): " . $mysqli->error . "\n", FILE_APPEND);
                }
            }
            echo json_encode(["status" => "ok", "id" => $newId]);
            return;
        }
    } catch (mysqli_sql_exception $e) {
        // ここで AUTO_INCREMENT が無い等のエラーを検出
        $msg = $e->getMessage();
        @file_put_contents(__DIR__ . '/debug.txt', date('c') . " save_externalized_content execute exception (no pk insert): " . $msg . "\n", FILE_APPEND);
        // フォールバック条件: 外部キー(主キー)にデフォルトが無い旨のエラー
        $needFallback = (strpos($msg, "externalized_contents_id") !== false && strpos($msg, "doesn't have a default value") !== false);
        if (!$needFallback) {
            $stmt->close();
            echo json_encode(["status" => "error", "error" => $msg]);
            return;
        }
    }

    // フォールバック: システムで externalized_contents_id を採番してINSERT
    $stmt->close();
    // externalized_contents_id: 初期11111から+1
    $res = $mysqli->query("SELECT MAX(externalized_contents_id) AS max_id FROM externalized_contents");
    $row = $res ? $res->fetch_assoc() : null;
    $currentMax = ($row && isset($row['max_id']) && $row['max_id'] !== null) ? intval($row['max_id'], 10) : 11110;
    $nextExtId = $currentMax + 1; // 11111 スタート

    if ($hasUsedCol && $hasKFragCol) {
        if ($hasUserCol) {
            $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, used_remarked_utterance, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        } else {
            $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, used_remarked_utterance, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        }
    } elseif ($hasUsedCol && !$hasKFragCol) {
        if ($hasUserCol) {
            $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, used_remarked_utterance, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        } else {
            $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, used_remarked_utterance, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        }
    } elseif (!$hasUsedCol && $hasKFragCol) {
        if ($hasUserCol) {
            $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        } else {
            $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, {$kfragColName}, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        }
    } else {
        if ($hasUserCol) {
            $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, user_id, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        } else {
            $stmt2 = $mysqli->prepare("INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, selected_contents, stage1, stage2, stage3, deleted) VALUES (?, ?, ?, ?, ?, ?, ?)");
        }
    }
    if(!$stmt2){
        @file_put_contents(__DIR__ . '/debug.txt', date('c') . " save_externalized_content prepare error (pk fallback): " . $mysqli->error . "\n", FILE_APPEND);
        echo json_encode(["status" => "error", "error" => $mysqli->error]);
        return;
    }
    if ($hasUsedCol && $hasKFragCol) {
        if ($hasUserCol) {
            // i s s s s s s i i i
            $uid_val2 = ($user_id !== null) ? (int)$user_id : 0;
            $stmt2->bind_param("issssssiii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $used_flag, $uid_val2, $deleted);
        } else {
            // i s s s s s s i i
            $stmt2->bind_param("issssssii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $used_flag, $deleted);
        }
    } elseif ($hasUsedCol && !$hasKFragCol) {
        if ($hasUserCol) {
            // i s s s s s i i i
            $uid_val2 = ($user_id !== null) ? (int)$user_id : 0;
            $stmt2->bind_param("isssssiii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $used_flag, $uid_val2, $deleted);
        } else {
            // i s s s s s i i
            $stmt2->bind_param("isssssii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $used_flag, $deleted);
        }
    } elseif (!$hasUsedCol && $hasKFragCol) {
        if ($hasUserCol) {
            // i s s s s s s i i
            $uid_val2 = ($user_id !== null) ? (int)$user_id : 0;
            $stmt2->bind_param("issssssii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $uid_val2, $deleted);
        } else {
            // i s s s s s s i
            $stmt2->bind_param("issssssi", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $knowledge_fragment_content, $deleted);
        }
    } else {
        if ($hasUserCol) {
            // i s s s s s i i
            $uid_val2 = ($user_id !== null) ? (int)$user_id : 0;
            $stmt2->bind_param("isssssii", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $uid_val2, $deleted);
        } else {
            // i s s s s s i
            $stmt2->bind_param("isssssi", $nextExtId, $remarked_ids_str, $selected_contents, $stage1, $stage2, $stage3, $deleted);
        }
    }
    if(!$stmt2->execute()){
        @file_put_contents(__DIR__ . '/debug.txt', date('c') . " save_externalized_content execute error (pk fallback): " . $stmt2->error . "\n", FILE_APPEND);
        echo json_encode(["status" => "error", "error" => $stmt2->error]);
        $stmt2->close();
        return;
    }
    $stmt2->close();

    // knowledge_fragment にも保存（空の場合はスキップ）
    if ($knowledge_fragment_content !== '') {
        $kfMax = 0;
        if ($resKf = $mysqli->query("SELECT MAX(knowledge_fragment_id) AS max_id FROM {$kfragTable}")) {
            $rowKf = $resKf->fetch_assoc();
            if ($rowKf && isset($rowKf['max_id']) && $rowKf['max_id'] !== null) {
                $kfMax = intval($rowKf['max_id'], 10);
            }
        }
        // 採番初期値は 15 からスタート
        $nextKfId = ($kfMax >= 15) ? ($kfMax + 1) : 15;
        $sqlKf2 = "INSERT INTO {$kfragTable} (knowledge_fragment_id, {$kfTextCol}, externalized_contents_id) VALUES (?, ?, ?)";
        if ($stmtKf = $mysqli->prepare($sqlKf2)) {
            $stmtKf->bind_param("isi", $nextKfId, $knowledge_fragment_content, $nextExtId);
            if (!@$stmtKf->execute()) {
                @file_put_contents(__DIR__ . '/debug.txt', date('c') . " knowledge_fragment ({$kfragTable}) insert failed (fallback): " . $stmtKf->error . "\n", FILE_APPEND);
            }
            @$stmtKf->close();
        } else {
            @file_put_contents(__DIR__ . '/debug.txt', date('c') . " knowledge_fragment ({$kfragTable}) prepare failed (fallback): " . $mysqli->error . "\n", FILE_APPEND);
        }
    }

    echo json_encode(["status" => "ok", "id" => $nextExtId]);
    return;
}

$return_data = []; // DBアクセスの結果として返すキー・バリューのペア

/*
 * すべてのマップ履歴について，開始と終了（リフレクションの開始＿過去のリフレクションの終了）時刻を取得
 */
$result_map_create_start_and_end = $mysqli->query("SELECT * FROM network_maps WHERE map_id = '$map_id' ORDER BY start_time DESC");

$map_create_start_and_end = [];
$latest_map_created_time = null; // 最初にヒットしたもの（現在の最新状態のもの）を履歴情報から除外するためのフラグ
while ($row = $result_map_create_start_and_end->fetch_assoc()) {
    $latest_map_created_time === null ? $latest_map_created_time = $row['start_time'] : array_push($map_create_start_and_end, $row); // 最新のやつは除外してそれ以外はPUSH
}

if(!empty($first_load_flag)) {
    // 最初の読み込みの処理のときだけ，最新のマップ作成時間を取得
    $target_map_created_start_times = $latest_map_created_time;
} else {
    // 過去のマップを読み出そうとするとき
    $target_map_created_start_times = isset($_POST["first_load_flag"]) ? $_POST["first_load_flag"] : null;
}

$return_data = array_merge($return_data, ["map_create_start_and_end" => $map_create_start_and_end]);

// （以降、他purposeの処理）


if($purpose === "record_meeting_utterance") {
    // ミーティングの発話をノードごとに保存する処理

    /*
     * マップ作成開始時間の記録・直前までのMapの終了時刻のアップデート
     *   手続きは，まず過去の最新のマップの終了時刻を更新，次に，その更新した時刻TIMESTAMPをSELECT取得，最後にそのタイムスタンプと同じ時刻の新規マップデータを挿入
     */
    
    $et_update_query = "UPDATE network_maps SET end_time = CURRENT_TIMESTAMP(), situation = 'end'
                                                       WHERE map_id = '$map_id' AND start_time in
                                                             ( SELECT * FROM (SELECT MAX(start_time) FROM network_maps WHERE map_id = '$map_id') AS MAX_START_TIME)";
    $mysqli->query($et_update_query);
    $map_renewal_time_query = "SELECT MAX(end_time) FROM network_maps WHERE map_id = '$map_id' ORDER BY end_time DESC"; // XMLからのデータを引き渡された時間（マップを新しく作り始めた時間＝リフレクションが次のフェーズにうつったとき）
    $result_map_renewal_time_tmp = $mysqli->query($map_renewal_time_query);
    $row = $result_map_renewal_time_tmp->fetch_assoc();
    $map_renewal_time_tmp = $row['MAX(end_time)'];
    $map_renewal_time = $map_renewal_time_tmp === null ? "CURRENT_TIMESTAMP" : "'$map_renewal_time_tmp'"; // 過去に作ったマップが１つもないときは現在時刻指定
    $network_map_id = uniqid(); //新しいマップのID

    $st_record_query = "INSERT INTO network_maps (network_map_id, map_id, start_time, end_time, situation) VALUES
                                              ('$network_map_id', '$map_id', $map_renewal_time, $map_renewal_time, 'start')";
    $res = $mysqli->query($st_record_query);

    // ここまでで $map_id（network_texts でも使っているマップID）と
    // $jsonDataArray = json_decode($_POST['utters'], true); が用意されている前提

    // 本アップロード（1リクエスト）ごとの discussion_id を採番（初期 22222、以降 +1）。
    // まず discussion_sessions の最大を参照、なければ discussion_utterances、そのどちらも無ければ 22222。
    $this_discussion_id = 22222;
    $max1 = 0; $max2 = 0;
    if ($resMax1 = $mysqli->query("SELECT MAX(discussion_id) AS max_id FROM discussion_sessions")) {
        $rowMax1 = $resMax1->fetch_assoc();
        if ($rowMax1 && isset($rowMax1['max_id']) && $rowMax1['max_id'] !== null) {
            $max1 = intval($rowMax1['max_id'], 10);
        }
    }
    if ($resMax2 = $mysqli->query("SELECT MAX(discussion_id) AS max_id FROM discussion_utterances")) {
        $rowMax2 = $resMax2->fetch_assoc();
        if ($rowMax2 && isset($rowMax2['max_id']) && $rowMax2['max_id'] !== null) {
            $max2 = intval($rowMax2['max_id'], 10);
        }
    }
    $currentMaxDid = max($max1, $max2);
    if ($currentMaxDid >= 22222) {
        $this_discussion_id = $currentMaxDid + 1;
    }

    // セッション情報（discussion_sessions）を保存（XMLに含まれる start_time / end_time を利用）
    $session_start = isset($_POST['session_start_time']) ? trim($_POST['session_start_time']) : '';
    $session_end = isset($_POST['session_end_time']) ? trim($_POST['session_end_time']) : '';
    // フォールバック: XML側の時間が無い場合は、network_mapsの開始時刻($map_renewal_time_tmp)を使う
    if ($session_start === '' && $map_renewal_time_tmp !== null) {
        $session_start = $map_renewal_time_tmp;
    }
    if ($session_end === '' && $map_renewal_time_tmp !== null) {
        $session_end = $map_renewal_time_tmp;
    }
    if ($session_start !== '' || $session_end !== '') {
        $ds_stmt = $mysqli->prepare("INSERT INTO discussion_sessions (discussion_id, start_time, end_time) VALUES (?, ?, ?)");
        if ($ds_stmt) {
            $ds_stmt->bind_param('iss', $this_discussion_id, $session_start, $session_end);
            if (!$ds_stmt->execute()) {
                @file_put_contents(__DIR__ . '/debug.txt', date('c') . " discussion_sessions execute error: " . $ds_stmt->error . "\n", FILE_APPEND);
            }
            $ds_stmt->close();
        } else {
            @file_put_contents(__DIR__ . '/debug.txt', date('c') . " discussion_sessions prepare error: " . $mysqli->error . "\n", FILE_APPEND);
        }
    }

    // 参加者情報（discussion_participants）の保存
    // utters(JSON)の各要素の sender を user_id として解釈し、重複を除いて1カラムにカンマ区切りで保存する
    $participants_payload = isset($_POST['utters']) ? $_POST['utters'] : '[]';
    $participantsArray = json_decode($participants_payload, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($participantsArray) && !empty($participantsArray)) {
        $uniqueUserIds = [];
        foreach ($participantsArray as $p) {
            $sid = isset($p['sender']) ? trim($p['sender']) : '';
            if ($sid === '' || !is_numeric($sid)) { continue; }
            // 数値文字列としてユニーク化（DBはvarcharを想定）
            $uniqueUserIds[$sid] = true;
        }
        if (!empty($uniqueUserIds)) {
            $csvUserIds = implode(',', array_keys($uniqueUserIds));
            $dp_stmt = $mysqli->prepare("INSERT INTO discussion_participants (discussion_id, user_id) VALUES (?, ?)");
            if ($dp_stmt) {
                // discussion_id: int, user_id: varchar (csv)
                $dp_stmt->bind_param('is', $this_discussion_id, $csvUserIds);
                if (!$dp_stmt->execute()) {
                    @file_put_contents(__DIR__ . '/debug.txt', date('c') . " discussion_participants execute error: " . $dp_stmt->error . "\n", FILE_APPEND);
                }
                $dp_stmt->close();
            } else {
                @file_put_contents(__DIR__ . '/debug.txt', date('c') . " discussion_participants prepare error: " . $mysqli->error . "\n", FILE_APPEND);
            }
        }
    }

    /*
    * 発話ノードの記録（network_textsへのデータ挿入）
    */
    $jsonDataArray = json_decode($_POST['utters'], true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        die('JSON Decode Error: ' . json_last_error_msg());
    }

    if (!empty($jsonDataArray)) {

    /* network_texts への一括INSERTは廃止（discussion_utterances に移行）
    $nt_record_query = "INSERT INTO network_texts (network_text_id, network_map_id, sender, content, network_on, time, JPNtime, ST_Time) VALUES ";
    */
        // discussion_utterances への保存（プリペアドステートメント）
    // 変更点: アップロードファイルの <id> を utterance_id として格納するため、
    // 明示的に utterance_id を含めてINSERTするプリペアドステートメントを用意
    $du_stmt = $mysqli->prepare("INSERT INTO discussion_utterances (utterance_id, discussion_id, user_id, content, network_on, utter_time, utter_epoc_time) VALUES (?, ?, ?, ?, ?, ?, ?)");
        if(!$du_stmt){
            @file_put_contents(__DIR__ . '/debug.txt', date('c') . " discussion_utterances prepare error: " . $mysqli->error . "\n", FILE_APPEND);
        }
        $du_discussion_id = $this_discussion_id;

        foreach ($jsonDataArray as $jsonData) {
            $id = $mysqli->real_escape_string($jsonData['message_id'] ?? uniqid());
            $content = $mysqli->real_escape_string($jsonData['content']);
            $sender = $mysqli->real_escape_string($jsonData['sender'] ?? $jsonData['user_name']);
            $time = $mysqli->real_escape_string($jsonData['time']);
            $JPNtime = $mysqli->real_escape_string($jsonData['JPNtime'] ?? $jsonData['time']);
            
            /* $nt_record_query .= "('$id', '$network_map_id', '$sender', '$content', 0, '$time', '$JPNtime', $map_renewal_time), "; */

            // discussion_utterances へも登録
            if($du_stmt){
                // アップロードXMLの <id> を優先して utterance_id に使用する
                $du_utterance_id = null;
                if (isset($jsonData['id']) && is_numeric($jsonData['id'])) {
                    $du_utterance_id = intval($jsonData['id'], 10);
                } elseif (isset($jsonData['message_id']) && is_numeric($jsonData['message_id'])) {
                    $du_utterance_id = intval($jsonData['message_id'], 10);
                } elseif (isset($jsonData['utterance_id']) && is_numeric($jsonData['utterance_id'])) {
                    $du_utterance_id = intval($jsonData['utterance_id'], 10);
                }

                if ($du_utterance_id === null) {
                    // IDが取得できない場合はスキップ（ログのみ）
                    @file_put_contents(__DIR__ . '/debug.txt', date('c') . " discussion_utterances skip: no valid utterance_id in payload\n", FILE_APPEND);
                } else {
                    $du_content = isset($jsonData['content']) ? $jsonData['content'] : '';
                    $du_network_on = 0; // 新規は0
                    $du_utter_time = isset($jsonData['JPNtime']) ? $jsonData['JPNtime'] : (isset($jsonData['time']) ? $jsonData['time'] : '');
                    $du_utter_epoch = 0.0;
                    if(isset($jsonData['time'])){
                        $du_utter_epoch = is_numeric($jsonData['time']) ? (float)$jsonData['time'] : 0.0;
                    }
                    // senderが数値IDならそれを使う。そうでない場合は0（後でJOINできないが最低限保存）
                    $du_user_id = 0;
                    if (isset($jsonData['sender']) && is_numeric($jsonData['sender'])) {
                        $du_user_id = intval($jsonData['sender'], 10);
                    }
                    // 型: i i i s i s d （utterance_id, discussion_id, user_id, content, network_on, utter_time, utter_epoc_time）
                    $du_stmt->bind_param("iiisisd", $du_utterance_id, $du_discussion_id, $du_user_id, $du_content, $du_network_on, $du_utter_time, $du_utter_epoch);
                    try {
                        $ok_du = $du_stmt->execute();
                        if(!$ok_du){
                            @file_put_contents(__DIR__ . '/debug.txt', date('c') . " discussion_utterances execute error: " . $du_stmt->error . "\n", FILE_APPEND);
                        }
                    } catch (mysqli_sql_exception $e_du) {
                        $msg_du = $e_du->getMessage();
                        @file_put_contents(__DIR__ . '/debug.txt', date('c') . " discussion_utterances execute exception: " . $msg_du . "\n", FILE_APPEND);
                        // 重複キーなどはスキップ（処理継続）
                    }
                }
            }
            
        }
    /* $nt_record_query = rtrim($nt_record_query,", "); */
        // network_texts への挿入は任意。後からコメントアウトしても他処理は動くように、この先の依存を作らない。
        // echo $nt_record_query;
        // $mysqli->query($nt_record_query);
        // if($mysqli->error){
        //     echo "Error network_text insert: ".$mysqli->error;
        // }
        if(isset($du_stmt) && $du_stmt){
            $du_stmt->close();
            // echo "\nDiscussion: discussion_utterancesテーブルにデータを保存しました";
        }

    } else {
        echo "No valid data in utters.";
    }
    
    // $document_record_query = "INSERT INTO document_content_organize (id, time, content, user_id, map_id, slide_id) VALUES ";
    // while ($row = $result_document->fetch_assoc()) {
    //     $id = $mysqli->real_escape_string($row['content_id']);
    //     $content = $mysqli->real_escape_string($row['content']);
    //     $slide_id = $mysqli->real_escape_string($row['slide_id']);
    //     $document_record_query .= "('$id', $map_renewal_time, '$content', $user_id, $map_id, '$slide_id'), ";
    // }
    // $document_record_query = rtrim($document_record_query,", ");
    // $mysqli->query($document_record_query);
    // /*
    // * 未完成?，資料の構造を取ってくる（今残ってる資料を取ってきてるから過去の資料を見たいならまだできない）
    // あと，もともとのDBのdocument_content_relationにuseridがないから重複しないか清水さんに聞く
    // */
    // $result_document_relation = $mysqli->query("SELECT id, node1_id, doc_con1_id, doc_con1_label, ont1_id, ont2_id, node2_id, doc_con2_id, doc_con2_label  FROM item_content_relations
    // WHERE map_id = '$map_id' AND deleted = 0 ORDER BY created_at ASC");
    // while ($row = $result_document_relation->fetch_assoc()) {
        
    //     $doc_con1_id = $mysqli->real_escape_string($row['doc_con1_id']);
    //     $doc_con1_label = $mysqli->real_escape_string($row['doc_con1_label']);
    //     $doc_con2_id = $mysqli->real_escape_string($row['doc_con2_id']);
    //     $doc_con2_label = $mysqli->real_escape_string($row['doc_con2_label']);
    //     if($doc_con1_label == "提案" || $doc_con1_label == "主張" || $doc_con1_label == "疑問"){
    //         $argmentnode = $mysqli->query("SELECT argument FROM document_content_organize
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         $result_argmentnode = $argmentnode->fetch_assoc()['argument'];
    //         if($result_argmentnode == 1){
    //             $mysqli->query("UPDATE document_content_organize SET claim = 1, argument = 2
    //                        WHERE user_id = '$user_id' AND map_1id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         }else{
    //             $mysqli->query("UPDATE document_content_organize SET claim = 1, argument = 3
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         } 
    //     }else if($doc_con1_label == "推測[自身]" || $doc_con1_label == "推測[世の中]" || $doc_con1_label == "仮説[自身]" || $doc_con1_label == "仮説[世の中]" || $doc_con1_label == "判断"){
    //         $argmentnode = $mysqli->query("SELECT argument FROM document_content_organize
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         $result_argmentnode = $argmentnode->fetch_assoc()['argument'];
    //         if($result_argmentnode == 1){
    //             $mysqli->query("UPDATE document_content_organize SET argument_node2 = '$doc_con2_id'
    //                           WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         }else{
                
    //             $mysqli->query("UPDATE document_content_organize SET argument = 1, argument_node = '$doc_con2_id'
    //                           WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         }
    //     }else if($doc_con1_label == "事実[自身]" || $doc_con1_label == "事実[世の中]"){
    //         if($doc_con2_label == "提案" || $doc_con2_label == "主張" || $doc_con2_label == "疑問"){
    //             $mysqli->query("UPDATE document_content_organize SET basis = 1, basis_node = '$doc_con2_id'
    //                            WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         }else if($doc_con2_label == "推測[自身]" || $doc_con2_label == "推測[世の中]" || $doc_con2_label == "仮説[自身]" || $doc_con2_label == "仮説[世の中]" || $doc_con2_label == "判断"){
    //             $mysqli->query("UPDATE document_content_organize SET basis = 1
    //                            WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         }
    //     }
    //     if($doc_con2_label == "提案" || $doc_con2_label == "主張" || $doc_con2_label == "疑問"){
    //         $argmentnode2 = $mysqli->query("SELECT argument FROM document_content_organize
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         $result_argmentnode2 = $argmentnode2->fetch_assoc()['argument'];
    //         if($result_argmentnode2 == 1){
    //             $mysqli->query("UPDATE document_content_organize SET claim = 1, argument = 2
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }else{
    //             $mysqli->query("UPDATE document_content_organize SET claim = 1, argument = 3
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }
    //     }else if($doc_con2_label == "推測[自身]" || $doc_con2_label == "推測[世の中]" || $doc_con2_label == "仮説[自身]" || $doc_con2_label == "仮説[世の中]" || $doc_con2_label == "判断"){
    //         $argmentnode2 = $mysqli->query("SELECT argument FROM document_content_organize
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         $result_argmentnode2 = $argmentnode2->fetch_assoc()['argument'];
    //         if($result_argmentnode2 == 1){
    //             $mysqli->query("UPDATE document_content_organize SET argument_node2 = '$doc_con1_id'
    //                           WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }else{
    //             $mysqli->query("UPDATE document_content_organize SET argument = 1, argument_node = '$doc_con1_id'
    //                           WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }
    //     }else if($doc_con2_label == "事実[自身]" || $doc_con2_label == "事実[世の中]"){
    //         if($doc_con1_label == "提案" || $doc_con1_label == "主張" || $doc_con1_label == "疑問"){
    //             $mysqli->query("UPDATE document_content_organize SET basis = 1, basis_node = '$doc_con1_id'
    //                            WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }else if($doc_con1_label == "推測[自身]" || $doc_con1_label == "推測[世の中]" || $doc_con1_label == "仮説[自身]" || $doc_con1_label == "仮説[世の中]" || $doc_con1_label == "判断"){
    //             $mysqli->query("UPDATE document_content_organize SET basis = 1
    //                            WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }
    //     }
    // }

    return;
}



if($purpose === "select_meeting_utterance") {
    /***
     *** ここから議論内省マップデータの取得（SELECT）処理
     ***/

    $return_data = array_merge($return_data, ['start_time' => $target_map_created_start_times]);

    /*
     * 議論内省マップのノードデータと思考整理マップのノードの対応関係データを取得する処理
     */
    
    $result_forest_node_and_discussionmap_node_relation = $mysqli->query("SELECT network_node_id, mindmap_node_id FROM network_mindmap_connects
              WHERE mindmap_node_id IN (SELECT node_id FROM map_node_links WHERE map_id = '$map_id') AND time > '$target_map_created_start_times'
              ORDER BY time DESC ");
    
    $forest_node_and_discussionmap_node_relation = [];
    while ($row = $result_forest_node_and_discussionmap_node_relation->fetch_assoc()) {
        array_push($forest_node_and_discussionmap_node_relation, $row);
    }
    $return_data = array_merge($return_data, ['fnode_dnode_rel' => $forest_node_and_discussionmap_node_relation]);
    
    
    /* 
     * オントロジーとの対応データの読み込み
     */
    $result_discussionmap_node_and_ontology_relation = $mysqli->query("SELECT ontology_id, network_node_id FROM network_ontology_connects
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id' AND situation = 'start')) 
              AND time > '$target_map_created_start_times' ORDER BY time DESC ");
    $discussionmap_node_and_ontology_relation = [];
    while ($row = $result_discussionmap_node_and_ontology_relation->fetch_assoc()) {
        array_push($discussionmap_node_and_ontology_relation, $row);
    }
    $return_data = array_merge($return_data, ['dnode_ontology_rel' => $discussionmap_node_and_ontology_relation]);    
    
    /*
     * 議論内省マップのノードデータの取得
     */
    $result_discussionmap_node = $mysqli->query("SELECT network_node_id, label, node_x, node_y, node_type FROM network_nodes
            WHERE network_map_id IN (SELECT network_map_id FROm network_maps WHERE map_id = '$map_id' AND situation = 'start') AND deleted = 0 AND updated_at >= '$target_map_created_start_times'
            ORDER BY updated_at DESC ");
    $discussionmap_node = [];
    while ($row = $result_discussionmap_node->fetch_assoc()) {
        array_push($discussionmap_node, $row);
    }
    $return_data = array_merge($return_data, ['dnode' => $discussionmap_node]);

    /*
     * 議論内省マップのエッジデータの取得
     */
    $result_discussionmap_edge = $mysqli->query("SELECT edge_start, edge_end, edge_label FROM network_edges
              WHERE (edge_start IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id' AND situation = 'start')) 
              OR edge_end IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id' AND situation = 'start'))) 
              AND deleted = 0 AND time >= '$target_map_created_start_times' ORDER BY time DESC ");
    $discussionmap_edge = [];
    while ($row = $result_discussionmap_edge->fetch_assoc()) {
        array_push($discussionmap_edge, $row);
    }
    $return_data = array_merge($return_data, ['dedge' => $discussionmap_edge]);

    /*
     * 採用のデータの取得
     */
    $result_recruit = $mysqli->query("SELECT network_node_id, result_recruit, ontology_id, reason FROM network_recruits
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id' AND situation = 'start')) 
              AND time > '$target_map_created_start_times' ORDER BY time DESC ");
    $recruit = [];
    while ($row = $result_recruit->fetch_assoc()) {
        array_push($recruit, $row);
    }
    $return_data = array_merge($return_data, ['recruit' => $recruit]);


    /*
    * 未完成?，資料のタイトルを取ってくる（今残ってる資料を取ってきてるから過去の資料を見たいならまだできない）
    */
    $result_document_title = $mysqli->query("SELECT node_id, title, item_id, concept_id FROM item_latest
                            WHERE map_id = '$map_id' ");
    $document_title = [];
    while ($row = $result_document_title->fetch_assoc()) {
        array_push($document_title, $row);
    }
    $return_data = array_merge($return_data, ['document_title' => $document_title]);


    $result_document = $mysqli->query("SELECT item_content_id, node_id, title, item_id, concept_id FROM item_content_latest
                        WHERE map_id = '$map_id' ");
    $document = [];
    while ($row = $result_document->fetch_assoc()) {
    array_push($document, $row);
    }
    $return_data = array_merge($return_data, ['document' => $document]);

    // userIDがないから一意に特定できるかわからん．清水さんに確認
    $result_item_content_relation = $mysqli->query("SELECT node1_id, item_content1_id, item_content1_label, node2_id, item_content2_id, item_content2_label FROM item_content_relations
        WHERE item_content1_id IN (SELECT item_content_id FROM item_contents WHERE item_id IN (SELECT item_id FROM items WHERE map_id = '$map_id')) AND deleted = 0");
    $item_content_relation = [];
    while ($row = $result_item_content_relation->fetch_assoc()) {
        array_push($item_content_relation, $row);
    }
    $return_data = array_merge($return_data, ['item_content_relation' => $item_content_relation]);
    
    /*
     * 議論における発話パーツ一覧
     */
        // 発話一覧（sender は users.name を優先表示。数値IDが保存されている場合は users と結合して名前に置換し、
        // すでに名前が入っている場合はそのまま表示する）
        // 対応する discussion_id を推定: セッション開始時刻と一致するものを優先、無ければ最新
        $target_discussion_id = null;
        $resDid = $mysqli->query("SELECT discussion_id FROM discussion_sessions WHERE start_time = '$target_map_created_start_times' ORDER BY discussion_id DESC LIMIT 1");
        if ($resDid && $resDid->num_rows > 0) {
            $target_discussion_id = intval($resDid->fetch_assoc()['discussion_id'], 10);
        } else {
            $resLatestDid = $mysqli->query("SELECT MAX(discussion_id) AS max_id FROM discussion_utterances");
            if ($resLatestDid) {
                $rowL = $resLatestDid->fetch_assoc();
                if ($rowL && isset($rowL['max_id']) && $rowL['max_id'] !== null) {
                    $target_discussion_id = intval($rowL['max_id'], 10);
                }
            }
        }
        $result_utterance = $mysqli->query("SELECT 
                                    du.utterance_id,
                                    du.discussion_id,
                                    COALESCE(u.name, du.user_id) AS sender,
                                    du.content,
                                    du.network_on,
                                    du.utter_epoc_time AS time,
                                    du.utter_time
                            FROM discussion_utterances du
                            LEFT JOIN users u ON u.user_id = du.user_id
                            " . ($target_discussion_id !== null ? ("WHERE du.discussion_id = " . $target_discussion_id) : "") . "
                            ORDER BY du.utter_epoc_time ASC, du.utterance_id ASC");
    $utterance = [];
    while ($row = $result_utterance->fetch_assoc()) {
        array_push($utterance, $row);
    }
    $return_data = array_merge($return_data, ['utterance' => $utterance]);
    
    
    if (empty($return_data)) {
        echo json_encode(["error" => "not"]);
        return;
    } else {
        echo json_encode($return_data);
        return;
    }


}else if($purpose === "select_version_discussionmap"){
    $result_discussionmap_create_start_time = $mysqli->query("SELECT start_time FROM network_maps 
                WHERE  network_map_id IN (SELECT network_map_id FROm network_maps WHERE map_id = '$map_id')
                AND start_time < '$first_load_flag' AND end_time > '$first_load_flag'");
    if (empty($result_discussionmap_create_start_time) ||
        $result_discussionmap_create_start_time->num_rows === 0 ||
        $result_discussionmap_create_start_time->num_rows === null) {
        // エンドタイムが今の最新時刻を含むものが存在しない（まだ最新のリフレクションを閉じていない）場合，現状最新の時刻のマップを取得する
        $res = $mysqli->query("SELECT MAX(start_time) FROM network_maps 
                WHERE map_id = '$map_id'"); // 一番最新のマップの時間
        $result_discussionmap_create_start_time = $res->fetch_assoc()['MAX(start_time)'];
    }else{
        $result_discussionmap_create_start_time = $result_discussionmap_create_start_time->fetch_assoc()['start_time'];
    }
    $return_data = array_merge($return_data, ['result_discussionmap_create_start_time' => $result_discussionmap_create_start_time]);

     /*
     * 議論内省マップのノードデータと思考整理マップのノードの対応関係データを取得する処理
     */
    $result_forest_node_and_discussionmap_node_relation = $mysqli->query("SELECT network_node_id, mindmap_node_id FROM network_mindmap_connects
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id')) 
              AND time > '$result_discussionmap_create_start_time' AND time < '$first_load_flag' ORDER BY time DESC ");
    
    $forest_node_and_discussionmap_node_relation = [];
    while ($row = $result_forest_node_and_discussionmap_node_relation->fetch_assoc()) {
        array_push($forest_node_and_discussionmap_node_relation, $row);
    }
    $return_data = array_merge($return_data, ['fnode_dnode_rel' => $forest_node_and_discussionmap_node_relation]);
    
    
    /* 
     * オントロジーとの対応データの読み込み
     */
    $result_discussionmap_node_and_ontology_relation = $mysqli->query("SELECT ontology_id, network_node_id FROM network_ontology_connects
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id')) 
              AND time > '$result_discussionmap_create_start_time' AND time < '$first_load_flag' ORDER BY time DESC ");
    $discussionmap_node_and_ontology_relation = [];
    while ($row = $result_discussionmap_node_and_ontology_relation->fetch_assoc()) {
        array_push($discussionmap_node_and_ontology_relation, $row);
    }
    $return_data = array_merge($return_data, ['dnode_ontology_rel' => $discussionmap_node_and_ontology_relation]);    
    
    /*
     * 議論内省マップのノードデータの取得
     */
    $result_discussionmap_node = $mysqli->query("SELECT network_node_id, label, node_x, node_y, node_type FROM network_nodes
            WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id') AND deleted = 0 AND updated_at >= '$result_discussionmap_create_start_time' 
            AND updated_at < '$first_load_flag' ORDER BY updated_at DESC ");
    $discussionmap_node = [];
    while ($row = $result_discussionmap_node->fetch_assoc()) {
        array_push($discussionmap_node, $row);
    }
    $return_data = array_merge($return_data, ['dnode' => $discussionmap_node]);

    /*
     * 議論内省マップのエッジデータの取得
     */
    $result_discussionmap_edge = $mysqli->query("SELECT edge_start, edge_end, edge_label FROM network_edges
              WHERE (edge_start IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id')) 
                OR edge_end IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id' AND situation = 'start')))  
                AND deleted = 0 AND time >= '$result_discussionmap_create_start_time' AND time < '$first_load_flag' ORDER BY time DESC ");
    $discussionmap_edge = [];
    while ($row = $result_discussionmap_edge->fetch_assoc()) {
        array_push($discussionmap_edge, $row);
    }
    $return_data = array_merge($return_data, ['dedge' => $discussionmap_edge]);

    /*
     * 採用の取得
     */
    $result_recruit = $mysqli->query("SELECT network_node_id, ontology_id, result_recruit FROM network_recruits
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id')) 
              AND time > '$result_discussionmap_create_start_time' AND time < '$first_load_flag' ORDER BY time DESC ");
    $recruit = [];
    while ($row = $result_recruit->fetch_assoc()) {
        array_push($recruit, $row);
    }
    $return_data = array_merge($return_data, ['recruit' => $recruit]);

    if (empty($return_data)) {
        echo json_encode(["error" => "not"]);
        return;
    } else {
        echo json_encode($return_data);
        return;
    }
}else if($purpose === "select_past_discussionmap"){
    
    $discussion_start_time = $_POST["discussion_start_time"];
    $discussion_end_time = $_POST["discussion_end_time"];
     /*
     * 議論内省マップのノードデータと思考整理マップのノードの対応関係データを取得する処理
     */
    $result_forest_node_and_discussionmap_node_relation = $mysqli->query("SELECT network_node_id, mindmap_node_id FROM network_mindmap_connects
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id')) 
              AND time > '$discussion_start_time' AND time < '$discussion_end_time' ORDER BY time DESC ");
    
    $forest_node_and_discussionmap_node_relation = [];
    while ($row = $result_forest_node_and_discussionmap_node_relation->fetch_assoc()) {
        array_push($forest_node_and_discussionmap_node_relation, $row);
    }
    $return_data = array_merge($return_data, ['fnode_dnode_rel' => $forest_node_and_discussionmap_node_relation]);
    
    
    /* 
     * オントロジーとの対応データの読み込み
     */
    $result_discussionmap_node_and_ontology_relation = $mysqli->query("SELECT ontology_id, network_node_id FROM network_ontology
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id'))
              AND time > '$discussion_start_time' AND time < '$discussion_end_time' ORDER BY time DESC ");
    $discussionmap_node_and_ontology_relation = [];
    while ($row = $result_discussionmap_node_and_ontology_relation->fetch_assoc()) {
        array_push($discussionmap_node_and_ontology_relation, $row);
    }
    $return_data = array_merge($return_data, ['dnode_ontology_rel' => $discussionmap_node_and_ontology_relation]);    
    
    /*
     * 議論内省マップのノードデータの取得
     */
    $result_discussionmap_node = $mysqli->query("SELECT node_id, label, node_x, node_y, node_type FROM network_nodes
            WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id') 
            AND updated_at >= '$discussion_start_time' AND updated_at < '$discussion_end_time' ORDER BY updated_at DESC ");
    $discussionmap_node = [];
    while ($row = $result_discussionmap_node->fetch_assoc()) {
        array_push($discussionmap_node, $row);
    }
    $return_data = array_merge($return_data, ['dnode' => $discussionmap_node]);

    /*
     * 議論内省マップのエッジデータの取得
     */
    $result_discussionmap_edge = $mysqli->query("SELECT edge_start, edge_end, edge_label FROM network_edges
              WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id') 
              AND time >= '$discussion_start_time' AND time < '$discussion_end_time'
              ORDER BY time DESC ");
    $discussionmap_edge = [];
    while ($row = $result_discussionmap_edge->fetch_assoc()) {
        array_push($discussionmap_edge, $row);
    }
    $return_data = array_merge($return_data, ['dedge' => $discussionmap_edge]);

    /*
     * 採用の取得
     */
    $result_recruit = $mysqli->query("SELECT node_id, ontology_id, result_recruit FROM network_recruits
              WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id') 
              AND time > '$discussion_start_time' AND time < '$discussion_end_time'
              ORDER BY time DESC ");
    $recruit = [];
    while ($row = $result_recruit->fetch_assoc()) {
        array_push($recruit, $row);
    }
    $return_data = array_merge($return_data, ['recruit' => $recruit]);

    if (empty($return_data)) {
        echo json_encode(["error" => "not"]);
        return;
    } else {
        echo json_encode($return_data);
        return;
    }
}
