<?php

function ok_core_env_or_default($name, $default)
{
    $value = getenv($name);
    return $value === false || $value === '' ? $default : $value;
}

function ok_core_connect()
{
    $db_host = ok_core_env_or_default('OK_CORE_DB_HOST', 'localhost');
    $db_port = (int)ok_core_env_or_default('OK_CORE_DB_PORT', 8889);
    $db_user = ok_core_env_or_default('OK_CORE_DB_USER', 'root');
    $db_password = ok_core_env_or_default('OK_CORE_DB_PASSWORD', 'root');
    $db_dbname = ok_core_env_or_default('OK_CORE_DB_NAME', 'ok_core');

    $ok = @new mysqli($db_host, $db_user, $db_password, $db_dbname, $db_port);
    if ($ok->connect_error) {
        throw new RuntimeException('OK-Core DB connection failed: ' . $ok->connect_error);
    }
    $ok->set_charset('utf8mb4');
    return $ok;
}

function ok_core_table_exists(mysqli $ok, $table)
{
    $escaped = $ok->real_escape_string($table);
    $res = $ok->query("SHOW TABLES LIKE '{$escaped}'");
    if (!$res) {
        return false;
    }
    $exists = $res->num_rows > 0;
    $res->free();
    return $exists;
}

function ok_core_column_exists(mysqli $ok, $table, $column)
{
    $tableEscaped = $ok->real_escape_string($table);
    $columnEscaped = $ok->real_escape_string($column);
    $res = $ok->query("SHOW COLUMNS FROM `{$tableEscaped}` LIKE '{$columnEscaped}'");
    if (!$res) {
        return false;
    }
    $exists = $res->num_rows > 0;
    $res->free();
    return $exists;
}

function ok_core_fetch_forest_user(mysqli $forest, $userId)
{
    $sql = 'SELECT user_id, sso_sub, name, password, sso_user_id, sso_username, email, display_name, role, is_active, sso_claims_json FROM users WHERE user_id = ? LIMIT 1';
    $stmt = $forest->prepare($sql);
    if (!$stmt) {
        return null;
    }
    $uid = (int)$userId;
    $stmt->bind_param('i', $uid);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    if ($res) {
        $res->free();
    }
    $stmt->close();
    return $row;
}

function ok_core_ensure_user(mysqli $ok, mysqli $forest, $userId)
{
    $ssoSub = isset($_SESSION['HCIMLAB_SSO_SUB']) ? (string)$_SESSION['HCIMLAB_SSO_SUB'] : '';
    if ($ssoSub !== '') {
        $stmt = $ok->prepare('SELECT user_id FROM users WHERE sso_sub = ? LIMIT 1');
        if ($stmt) {
            $stmt->bind_param('s', $ssoSub);
            $stmt->execute();
            $stmt->bind_result($okUserId);
            if ($stmt->fetch()) {
                $stmt->close();
                return (int)$okUserId;
            }
            $stmt->close();
        }
    }

    $uid = (int)$userId;
    $stmt = $ok->prepare('SELECT user_id FROM users WHERE user_id = ? LIMIT 1');
    if ($stmt) {
        $stmt->bind_param('i', $uid);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            $stmt->close();
            return $uid;
        }
        $stmt->close();
    }

    $forestUser = ok_core_fetch_forest_user($forest, $uid);
    if (!$forestUser) {
        throw new RuntimeException('Forest user not found for OK-Core import.');
    }

    $sub = $ssoSub !== '' ? $ssoSub : (isset($forestUser['sso_sub']) ? (string)$forestUser['sso_sub'] : null);
    $name = isset($forestUser['name']) && $forestUser['name'] !== '' ? (string)$forestUser['name'] : ('user ' . $uid);
    $password = isset($forestUser['password']) && $forestUser['password'] !== '' ? (string)$forestUser['password'] : 'SSO_LOGIN_DISABLED';
    $ssoUserId = isset($forestUser['sso_user_id']) ? $forestUser['sso_user_id'] : null;
    $ssoUsername = isset($forestUser['sso_username']) ? $forestUser['sso_username'] : null;
    $email = isset($forestUser['email']) ? $forestUser['email'] : null;
    $displayName = isset($forestUser['display_name']) && $forestUser['display_name'] !== '' ? $forestUser['display_name'] : $name;
    $role = isset($forestUser['role']) ? $forestUser['role'] : null;
    $isActive = isset($forestUser['is_active']) ? (int)$forestUser['is_active'] : 1;
    $claimsJson = isset($forestUser['sso_claims_json']) ? $forestUser['sso_claims_json'] : null;

    $sql = 'INSERT INTO users (user_id, sso_sub, name, login_time, password, sso_user_id, sso_username, email, display_name, role, is_active, sso_claims_json, sso_updated_at)
            VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              sso_sub = COALESCE(VALUES(sso_sub), sso_sub),
              sso_user_id = VALUES(sso_user_id),
              sso_username = VALUES(sso_username),
              email = VALUES(email),
              display_name = VALUES(display_name),
              role = VALUES(role),
              is_active = VALUES(is_active),
              sso_claims_json = VALUES(sso_claims_json),
              sso_updated_at = NOW()';
    $stmt = $ok->prepare($sql);
    if (!$stmt) {
        throw new RuntimeException('OK-Core user upsert prepare failed: ' . $ok->error);
    }
    $stmt->bind_param('issssssssis', $uid, $sub, $name, $password, $ssoUserId, $ssoUsername, $email, $displayName, $role, $isActive, $claimsJson);
    if (!$stmt->execute()) {
        $error = $stmt->error;
        $stmt->close();
        throw new RuntimeException('OK-Core user upsert failed: ' . $error);
    }
    $stmt->close();
    return $uid;
}

function ok_core_ensure_group_membership(mysqli $ok, mysqli $forest, $groupId, $okUserId)
{
    $gid = (int)$groupId;
    if ($gid <= 0) {
        return;
    }

    $stmt = $ok->prepare('SELECT group_id FROM knowledge_groups WHERE group_id = ? LIMIT 1');
    if ($stmt) {
        $stmt->bind_param('i', $gid);
        $stmt->execute();
        $stmt->store_result();
        $exists = $stmt->num_rows > 0;
        $stmt->close();
        if (!$exists) {
            $name = 'Organization ' . $gid;
            $creator = (int)$okUserId;
            $insert = $ok->prepare('INSERT INTO knowledge_groups (group_id, name, creater, created_at, deleted) VALUES (?, ?, ?, NOW(), 0)');
            if ($insert) {
                $insert->bind_param('isi', $gid, $name, $creator);
                $insert->execute();
                $insert->close();
            }
        }
    }

    $role = 'member';
    if ($stmt = $forest->prepare('SELECT role FROM kgroup_user_link WHERE group_id = ? AND user_id = ? AND deleted = 0 LIMIT 1')) {
        $stmt->bind_param('ii', $gid, $okUserId);
        $stmt->execute();
        $stmt->bind_result($forestRole);
        if ($stmt->fetch() && $forestRole !== null && $forestRole !== '') {
            $role = (string)$forestRole;
        }
        $stmt->close();
    }

    $sql = 'INSERT INTO kgroup_user_link (group_id, user_id, role, created_at, deleted)
            VALUES (?, ?, ?, NOW(), 0)
            ON DUPLICATE KEY UPDATE role = VALUES(role), deleted = 0';
    $stmt = $ok->prepare($sql);
    if ($stmt) {
        $stmt->bind_param('iis', $gid, $okUserId, $role);
        $stmt->execute();
        $stmt->close();
    }
}

function ok_core_import_experience_kf(mysqli $forest, array $payload)
{
    $ok = ok_core_connect();
    try {
        if (!ok_core_table_exists($ok, 'experience_knowledges')) {
            throw new RuntimeException('OK-Core experience_knowledges table does not exist.');
        }

        $forestUserId = isset($payload['user_id']) ? (int)$payload['user_id'] : 0;
        $okUserId = ok_core_ensure_user($ok, $forest, $forestUserId);
        $groupId = isset($payload['group_id']) ? (int)$payload['group_id'] : 0;
        ok_core_ensure_group_membership($ok, $forest, $groupId, $okUserId);

        $experienceKnowledgeId = isset($payload['experience_knowledge_id']) ? (int)$payload['experience_knowledge_id'] : 0;
        if ($experienceKnowledgeId <= 0) {
            throw new RuntimeException('experience_knowledge_id is required.');
        }

        $selectedContents = isset($payload['selected_contents']) ? (string)$payload['selected_contents'] : '';
        $knowledgeFragmentContent = isset($payload['knowledge_fragment_content']) ? (string)$payload['knowledge_fragment_content'] : '';
        $stage1 = isset($payload['stage1']) ? (string)$payload['stage1'] : '';
        $stage2 = isset($payload['stage2']) ? (string)$payload['stage2'] : null;
        $stage3 = isset($payload['stage3']) ? (string)$payload['stage3'] : null;
        $thoughtExperienceNodeId = isset($payload['thought_experience_node_id']) ? (string)$payload['thought_experience_node_id'] : null;
        $experienceType = isset($payload['experience_type']) ? (string)$payload['experience_type'] : null;
        $timestamp = isset($payload['timestamp']) ? (string)$payload['timestamp'] : date('Y-m-d H:i:s');

        $sql = 'INSERT INTO experience_knowledges
                  (experience_knowledge_id, remarked_utterance_id, used_remarked_utterance, thought_experience_node_id, experience_type, selected_contents, knowledge_fragment_content, user_id, stage1, stage2, stage3, created_at, updated_at, deleted, discussed)
                VALUES (?, NULL, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, "YET")
                ON DUPLICATE KEY UPDATE
                  thought_experience_node_id = VALUES(thought_experience_node_id),
                  experience_type = VALUES(experience_type),
                  selected_contents = VALUES(selected_contents),
                  knowledge_fragment_content = VALUES(knowledge_fragment_content),
                  user_id = VALUES(user_id),
                  stage1 = VALUES(stage1),
                  stage2 = VALUES(stage2),
                  stage3 = VALUES(stage3),
                  updated_at = VALUES(updated_at),
                  deleted = 0';
        $stmt = $ok->prepare($sql);
        if (!$stmt) {
            throw new RuntimeException('OK-Core KF import prepare failed: ' . $ok->error);
        }
        $stmt->bind_param(
            'issssisssss',
            $experienceKnowledgeId,
            $thoughtExperienceNodeId,
            $experienceType,
            $selectedContents,
            $knowledgeFragmentContent,
            $okUserId,
            $stage1,
            $stage2,
            $stage3,
            $timestamp,
            $timestamp
        );
        if (!$stmt->execute()) {
            $error = $stmt->error;
            $stmt->close();
            throw new RuntimeException('OK-Core KF import failed: ' . $error);
        }
        $stmt->close();

        if ($groupId > 0 && ok_core_table_exists($ok, 'shared_nodes')) {
            $sharedNodeId = null;
            $stmtFindShared = $ok->prepare('SELECT id FROM shared_nodes WHERE experience_knowledge_id = ? AND knowledge_group_id = ? LIMIT 1');
            if ($stmtFindShared) {
                $stmtFindShared->bind_param('ii', $experienceKnowledgeId, $groupId);
                $stmtFindShared->execute();
                $stmtFindShared->bind_result($foundSharedNodeId);
                if ($stmtFindShared->fetch()) {
                    $sharedNodeId = (int)$foundSharedNodeId;
                }
                $stmtFindShared->close();
            }

            if ($sharedNodeId !== null) {
                $stmtShared = $ok->prepare('UPDATE shared_nodes SET updated_at = ?, deleted = 0 WHERE id = ?');
                if ($stmtShared) {
                    $stmtShared->bind_param('si', $timestamp, $sharedNodeId);
                    $stmtShared->execute();
                    $stmtShared->close();
                }
            } else {
                $stmtShared = $ok->prepare('INSERT INTO shared_nodes (experience_knowledge_id, knowledge_group_id, created_at, updated_at, deleted) VALUES (?, ?, ?, ?, 0)');
                if ($stmtShared) {
                    $stmtShared->bind_param('iiss', $experienceKnowledgeId, $groupId, $timestamp, $timestamp);
                    $stmtShared->execute();
                    $stmtShared->close();
                }
            }
        }

        $ok->close();
        return array('status' => 'ok', 'ok_core_experience_knowledge_id' => $experienceKnowledgeId);
    } catch (Throwable $e) {
        if ($ok instanceof mysqli) {
            $ok->close();
        }
        return array('status' => 'error', 'message' => $e->getMessage());
    }
}

function ok_core_get_user_groups(mysqli $forest, $userId)
{
    $ok = ok_core_connect();
    try {
        $okUserId = ok_core_ensure_user($ok, $forest, $userId);
        $sql = 'SELECT kg.group_id, kg.name
                FROM kgroup_user_link kul
                INNER JOIN knowledge_groups kg ON kg.group_id = kul.group_id
                WHERE kul.user_id = ? AND kul.deleted = 0 AND kg.deleted = 0
                ORDER BY kul.created_at DESC, kg.created_at DESC';
        $stmt = $ok->prepare($sql);
        if (!$stmt) {
            throw new RuntimeException('OK-Core group query prepare failed: ' . $ok->error);
        }
        $stmt->bind_param('i', $okUserId);
        $stmt->execute();
        $result = $stmt->get_result();
        $groups = array();
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $groups[] = array(
                    'group_id' => (int)$row['group_id'],
                    'name' => (string)$row['name']
                );
            }
            $result->free();
        }
        $stmt->close();
        $ok->close();
        return array('status' => 'ok', 'groups' => $groups);
    } catch (Throwable $e) {
        if ($ok instanceof mysqli) {
            $ok->close();
        }
        return array('status' => 'error', 'message' => $e->getMessage(), 'groups' => array());
    }
}

?>
