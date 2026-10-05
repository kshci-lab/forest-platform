<?php

declare(strict_types=1);

require_once __DIR__ . '/ok_core_api_client.php';

function kf_sync_json_encode($value): string
{
    return json_encode(
        $value,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
    );
}

function kf_sync_now(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Asia/Tokyo')))
        ->format('Y-m-d H:i:s.v');
}

function kf_sync_to_iso_timestamp(string $timestamp): string
{
    $timezone = new DateTimeZone('Asia/Tokyo');
    $date = DateTimeImmutable::createFromFormat('Y-m-d H:i:s.v', $timestamp, $timezone);
    if (!$date) {
        $date = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $timestamp, $timezone);
    }
    if (!$date) {
        $date = new DateTimeImmutable($timestamp, $timezone);
    }
    return $date->format('Y-m-d\TH:i:s.vP');
}

function kf_sync_stage_payload(string $stage1, string $stage2, string $stage3): array
{
    return [
        [
            'stage_code' => 'stage1',
            'rendered_content' => $stage1,
            'slots' => [],
        ],
        [
            'stage_code' => 'stage2',
            'rendered_content' => $stage2,
            'slots' => [],
        ],
        [
            'stage_code' => 'stage3',
            'rendered_content' => $stage3,
            'slots' => [],
        ],
    ];
}

function kf_sync_resolve_sso_sub(mysqli $db, int $userId, string $sessionSub = ''): string
{
    $sessionSub = trim($sessionSub);
    if ($sessionSub !== '') {
        if (strlen($sessionSub) > 191) {
            throw new RuntimeException('SSO subが191文字を超えています。');
        }
        return $sessionSub;
    }

    $statement = $db->prepare(
        'SELECT sso_sub FROM users WHERE user_id = ? AND is_active = 1 LIMIT 1'
    );
    if (!$statement) {
        throw new RuntimeException('SSOユーザー確認の準備に失敗しました: ' . $db->error);
    }
    $statement->bind_param('i', $userId);
    $statement->execute();
    $result = $statement->get_result();
    $row = $result ? $result->fetch_assoc() : null;
    if ($result) {
        $result->free();
    }
    $statement->close();

    $ssoSub = trim((string)($row['sso_sub'] ?? ''));
    if ($ssoSub === '') {
        throw new RuntimeException(
            'SSO subを確認できません。いったんログアウトしてSSOログインし直してください。'
        );
    }
    return $ssoSub;
}

function kf_sync_entity_type_code(string $experienceType): string
{
    $normalized = strtolower(trim($experienceType));
    if (in_array($normalized, ['process', 'process_node'], true)) {
        return 'process_node';
    }
    if (in_array($normalized, ['trigger', 'triggers'], true)) {
        return 'trigger';
    }
    if (in_array($normalized, ['version', 'versions', 'versionsbro', 'node_version'], true)) {
        return 'node_version';
    }
    return 'source_entity';
}

function kf_sync_source_snapshot(
    mysqli $db,
    string $entityTypeCode,
    string $entityId,
    string $fallbackContent
): array {
    $queries = [
        'process_node' => 'SELECT
                process_node_id,
                node_id,
                content,
                process_node_type,
                created_at,
                updated_at,
                deleted
            FROM process_nodes
            WHERE process_node_id = ?
            LIMIT 1',
        'node_version' => 'SELECT
                node_version_id,
                node_id,
                parent_id,
                node_type_id,
                appeared_at,
                disappeared_at,
                content,
                concept_id,
                x,
                y
            FROM node_versions
            WHERE node_version_id = ?
            LIMIT 1',
        'trigger' => 'SELECT
                trigger_id,
                activity_id,
                `from`,
                `to`,
                activity_time,
                activity_type,
                content,
                add_time,
                x,
                y,
                deleted
            FROM triggers
            WHERE trigger_id = ?
            LIMIT 1',
    ];

    if (isset($queries[$entityTypeCode])) {
        $statement = $db->prepare($queries[$entityTypeCode]);
        if ($statement) {
            $statement->bind_param('s', $entityId);
            $statement->execute();
            $result = $statement->get_result();
            $row = $result ? $result->fetch_assoc() : null;
            if ($result) {
                $result->free();
            }
            $statement->close();
            if (is_array($row)) {
                return $row;
            }
        }
    }

    return [
        'entity_id' => $entityId,
        'content' => $fallbackContent,
        'source_row_found' => false,
    ];
}

function kf_sync_create_context_package(
    mysqli $db,
    string $activityTypeCode,
    string $externalActivityId,
    string $entityTypeCode,
    string $entityId,
    array $snapshot,
    string $timestamp
): int {
    $statement = $db->prepare(
        'INSERT INTO kf_context_packages (
            activity_type_code,
            external_activity_id,
            created_at
        ) VALUES (?, ?, ?)'
    );
    if (!$statement) {
        throw new RuntimeException('文脈パッケージ登録の準備に失敗しました: ' . $db->error);
    }
    $statement->bind_param(
        'sss',
        $activityTypeCode,
        $externalActivityId,
        $timestamp
    );
    if (!$statement->execute()) {
        $message = $statement->error;
        $statement->close();
        throw new RuntimeException('文脈パッケージを登録できませんでした: ' . $message);
    }
    $contextPackageId = (int)$db->insert_id;
    $statement->close();

    $snapshotJson = kf_sync_json_encode($snapshot);
    $displayOrder = 1;
    $statement = $db->prepare(
        'INSERT INTO kf_context_package_items (
            context_package_id,
            entity_type_code,
            entity_id,
            display_order,
            snapshot_json
        ) VALUES (?, ?, ?, ?, ?)'
    );
    if (!$statement) {
        throw new RuntimeException('文脈項目登録の準備に失敗しました: ' . $db->error);
    }
    $statement->bind_param(
        'issis',
        $contextPackageId,
        $entityTypeCode,
        $entityId,
        $displayOrder,
        $snapshotJson
    );
    if (!$statement->execute()) {
        $message = $statement->error;
        $statement->close();
        throw new RuntimeException('文脈項目を登録できませんでした: ' . $message);
    }
    $statement->close();
    return $contextPackageId;
}

function kf_sync_next_experience_id(mysqli $db): int
{
    $result = $db->query(
        'SELECT experience_knowledge_id
         FROM experience_knowledges
         ORDER BY experience_knowledge_id DESC
         LIMIT 1
         FOR UPDATE'
    );
    if (!$result) {
        throw new RuntimeException('KF IDを採番できませんでした: ' . $db->error);
    }
    $row = $result->fetch_assoc();
    $result->free();
    return $row ? ((int)$row['experience_knowledge_id'] + 1) : 1;
}

function kf_sync_next_shared_node_id(mysqli $db): int
{
    $result = $db->query(
        'SELECT id FROM shared_nodes ORDER BY id DESC LIMIT 1 FOR UPDATE'
    );
    if (!$result) {
        throw new RuntimeException('共有IDを採番できませんでした: ' . $db->error);
    }
    $row = $result->fetch_assoc();
    $result->free();
    return $row ? ((int)$row['id'] + 1) : 1;
}

function kf_sync_load_fragment_for_update(
    mysqli $db,
    int $experienceKnowledgeId,
    int $userId
): array {
    $statement = $db->prepare(
        'SELECT *
         FROM experience_knowledges
         WHERE experience_knowledge_id = ?
           AND user_id = ?
         LIMIT 1
         FOR UPDATE'
    );
    if (!$statement) {
        throw new RuntimeException('KF確認の準備に失敗しました: ' . $db->error);
    }
    $statement->bind_param('ii', $experienceKnowledgeId, $userId);
    $statement->execute();
    $result = $statement->get_result();
    $row = $result ? $result->fetch_assoc() : null;
    if ($result) {
        $result->free();
    }
    $statement->close();
    if (!$row) {
        throw new RuntimeException('操作できるKFが見つかりませんでした。');
    }
    return $row;
}

function kf_sync_ensure_context_for_existing(
    mysqli $db,
    array $fragment,
    string $timestamp
): int {
    $contextPackageId = (int)($fragment['context_package_id'] ?? 0);
    if ($contextPackageId > 0) {
        return $contextPackageId;
    }

    $entityId = trim((string)($fragment['thought_experience_node_id'] ?? ''));
    if ($entityId === '') {
        $entityId = 'experience-' . (string)$fragment['experience_knowledge_id'];
    }
    $entityTypeCode = kf_sync_entity_type_code((string)($fragment['experience_type'] ?? ''));
    $snapshot = kf_sync_source_snapshot(
        $db,
        $entityTypeCode,
        $entityId,
        (string)($fragment['selected_contents'] ?? '')
    );
    $contextPackageId = kf_sync_create_context_package(
        $db,
        'legacy_experience_knowledge',
        'experience-' . (string)$fragment['experience_knowledge_id'],
        $entityTypeCode,
        $entityId,
        $snapshot,
        $timestamp
    );

    $statement = $db->prepare(
        'UPDATE experience_knowledges
         SET context_package_id = ?
         WHERE experience_knowledge_id = ?'
    );
    if (!$statement) {
        throw new RuntimeException('既存KFへの文脈設定を準備できませんでした: ' . $db->error);
    }
    $experienceKnowledgeId = (int)$fragment['experience_knowledge_id'];
    $statement->bind_param('ii', $contextPackageId, $experienceKnowledgeId);
    $statement->execute();
    $statement->close();
    return $contextPackageId;
}

function kf_sync_build_payload(
    mysqli $db,
    int $experienceKnowledgeId,
    string $ssoSub,
    string $sourceUpdatedAt
): array {
    $statement = $db->prepare(
        'SELECT
            ek.*,
            cp.activity_type_code,
            cp.external_activity_id,
            cp.created_at AS context_created_at
         FROM experience_knowledges ek
         INNER JOIN kf_context_packages cp
           ON cp.context_package_id = ek.context_package_id
         WHERE ek.experience_knowledge_id = ?
         LIMIT 1'
    );
    if (!$statement) {
        throw new RuntimeException('送信KF読込の準備に失敗しました: ' . $db->error);
    }
    $statement->bind_param('i', $experienceKnowledgeId);
    $statement->execute();
    $result = $statement->get_result();
    $fragment = $result ? $result->fetch_assoc() : null;
    if ($result) {
        $result->free();
    }
    $statement->close();
    if (!$fragment) {
        throw new RuntimeException('送信するKFまたは文脈パッケージが見つかりません。');
    }

    $items = [];
    $contextPackageId = (int)$fragment['context_package_id'];
    $statement = $db->prepare(
        'SELECT entity_type_code, entity_id, display_order, snapshot_json
         FROM kf_context_package_items
         WHERE context_package_id = ?
         ORDER BY display_order, context_package_item_id'
    );
    if (!$statement) {
        throw new RuntimeException('文脈項目読込の準備に失敗しました: ' . $db->error);
    }
    $statement->bind_param('i', $contextPackageId);
    $statement->execute();
    $result = $statement->get_result();
    while ($result && ($row = $result->fetch_assoc())) {
        $snapshot = json_decode((string)$row['snapshot_json'], true);
        $items[] = [
            'entity_type_code' => (string)$row['entity_type_code'],
            'entity_id' => (string)$row['entity_id'],
            'display_order' => (int)$row['display_order'],
            'snapshot' => is_array($snapshot) ? $snapshot : [],
        ];
    }
    if ($result) {
        $result->free();
    }
    $statement->close();

    $shareGroupIds = [];
    $statement = $db->prepare(
        'SELECT knowledge_group_id
         FROM shared_nodes
         WHERE experience_knowledge_id = ? AND deleted = 0
         ORDER BY knowledge_group_id'
    );
    if (!$statement) {
        throw new RuntimeException('共有先読込の準備に失敗しました: ' . $db->error);
    }
    $statement->bind_param('i', $experienceKnowledgeId);
    $statement->execute();
    $result = $statement->get_result();
    while ($result && ($row = $result->fetch_assoc())) {
        $shareGroupIds[] = (string)$row['knowledge_group_id'];
    }
    if ($result) {
        $result->free();
    }
    $statement->close();

    $stages = null;
    if (!empty($fragment['stage_payload_json'])) {
        $decodedStages = json_decode((string)$fragment['stage_payload_json'], true);
        if (is_array($decodedStages)) {
            $stages = $decodedStages;
        }
    }
    if (!is_array($stages)) {
        $stages = kf_sync_stage_payload(
            (string)$fragment['stage1'],
            (string)($fragment['stage2'] ?? ''),
            (string)($fragment['stage3'] ?? '')
        );
    }

    $summary = trim((string)$fragment['knowledge_fragment_content']);
    if ($summary === '') {
        $summary = trim((string)$fragment['selected_contents']);
    }
    if ($summary === '') {
        $summary = 'Experience KF ' . $experienceKnowledgeId;
    }

    return [
        'protocol' => [
            'code' => 'OK_CORE_KF',
            'version' => '1.0',
        ],
        'source_revision' => (int)$fragment['source_revision'],
        'source_updated_at' => kf_sync_to_iso_timestamp($sourceUpdatedAt),
        'expresser_sso_sub' => $ssoSub,
        'summary' => $summary,
        'activity' => [
            'type_code' => (string)$fragment['activity_type_code'],
            'external_activity_id' => (string)$fragment['external_activity_id'],
        ],
        'context_package' => [
            'external_context_package_id' => (string)$contextPackageId,
            'created_at' => kf_sync_to_iso_timestamp((string)$fragment['context_created_at']),
            'items' => $items,
        ],
        'stages' => $stages,
        'share_group_ids' => $shareGroupIds,
    ];
}

function kf_sync_supersede_older(
    mysqli $db,
    int $experienceKnowledgeId,
    int $sourceRevision,
    string $timestamp
): void {
    $message = 'Superseded by source_revision ' . $sourceRevision;
    $statement = $db->prepare(
        'UPDATE kf_sync_outbox
         SET status = "SUPERSEDED",
             next_retry_at = NULL,
             last_error = ?,
             updated_at = ?
         WHERE experience_knowledge_id = ?
           AND source_revision < ?
           AND status IN ("PENDING", "FAILED")'
    );
    if (!$statement) {
        throw new RuntimeException('旧Outbox無効化の準備に失敗しました: ' . $db->error);
    }
    $statement->bind_param(
        'ssii',
        $message,
        $timestamp,
        $experienceKnowledgeId,
        $sourceRevision
    );
    $statement->execute();
    $statement->close();
}

function kf_sync_enqueue(
    mysqli $db,
    int $experienceKnowledgeId,
    int $sourceRevision,
    string $operation,
    string $ssoSub,
    ?array $payload,
    string $timestamp
): int {
    kf_sync_supersede_older($db, $experienceKnowledgeId, $sourceRevision, $timestamp);
    $payloadJson = $payload === null ? null : kf_sync_json_encode($payload);
    $statement = $db->prepare(
        'INSERT INTO kf_sync_outbox (
            experience_knowledge_id,
            source_revision,
            operation,
            acting_user_sso_sub,
            payload_json,
            status,
            attempt_count,
            created_at,
            updated_at
         ) VALUES (?, ?, ?, ?, ?, "PENDING", 0, ?, ?)'
    );
    if (!$statement) {
        throw new RuntimeException('Outbox登録の準備に失敗しました: ' . $db->error);
    }
    $statement->bind_param(
        'iisssss',
        $experienceKnowledgeId,
        $sourceRevision,
        $operation,
        $ssoSub,
        $payloadJson,
        $timestamp,
        $timestamp
    );
    if (!$statement->execute()) {
        $message = $statement->error;
        $statement->close();
        throw new RuntimeException('Outboxへ登録できませんでした: ' . $message);
    }
    $outboxId = (int)$db->insert_id;
    $statement->close();
    return $outboxId;
}

function kf_sync_retry_at(int $attemptCount): ?string
{
    $minutes = [1 => 1, 2 => 5, 3 => 30];
    if (!isset($minutes[$attemptCount])) {
        return null;
    }
    return (new DateTimeImmutable('now', new DateTimeZone('Asia/Tokyo')))
        ->modify('+' . $minutes[$attemptCount] . ' minutes')
        ->format('Y-m-d H:i:s');
}

function kf_sync_attempt_outbox(mysqli $db, int $outboxId): array
{
    $statement = $db->prepare(
        'SELECT *
         FROM kf_sync_outbox
         WHERE outbox_id = ?
         LIMIT 1'
    );
    if (!$statement) {
        throw new RuntimeException('Outbox読込の準備に失敗しました: ' . $db->error);
    }
    $statement->bind_param('i', $outboxId);
    $statement->execute();
    $result = $statement->get_result();
    $outbox = $result ? $result->fetch_assoc() : null;
    if ($result) {
        $result->free();
    }
    $statement->close();
    if (!$outbox) {
        throw new RuntimeException('Outboxが見つかりません。');
    }

    if ($outbox['status'] === 'SENT' || $outbox['status'] === 'SUPERSEDED') {
        return [
            'status' => (string)$outbox['status'],
            'outbox_id' => $outboxId,
            'attempt_count' => (int)$outbox['attempt_count'],
            'request_id' => (string)($outbox['last_request_id'] ?? ''),
        ];
    }

    $attemptCount = (int)$outbox['attempt_count'] + 1;
    try {
        if ($outbox['operation'] === 'UPSERT') {
            $payload = json_decode((string)$outbox['payload_json'], true);
            if (!is_array($payload)) {
                throw new OkCoreApiException(
                    'Outboxのpayload_jsonを読み込めません。',
                    0,
                    'INVALID_OUTBOX_PAYLOAD'
                );
            }
            $response = ok_core_api_put_fragment(
                (int)$outbox['experience_knowledge_id'],
                (string)$outbox['acting_user_sso_sub'],
                $payload
            );
        } else {
            $deletePayload = json_decode((string)$outbox['payload_json'], true);
            $sourceDeletedAt = is_array($deletePayload)
                ? (string)($deletePayload['source_deleted_at'] ?? '')
                : '';
            if ($sourceDeletedAt === '') {
                throw new OkCoreApiException(
                    '削除Outboxにsource_deleted_atがありません。',
                    0,
                    'INVALID_OUTBOX_PAYLOAD'
                );
            }
            $response = ok_core_api_delete_fragment(
                (int)$outbox['experience_knowledge_id'],
                (string)$outbox['acting_user_sso_sub'],
                (int)$outbox['source_revision'],
                $sourceDeletedAt
            );
        }

        $httpStatus = (int)$response['http_status'];
        $requestId = (string)$response['request_id'];
        $responseJson = kf_sync_json_encode($response['body']);
        $statement = $db->prepare(
            'UPDATE kf_sync_outbox
             SET status = "SENT",
                 attempt_count = ?,
                 next_retry_at = NULL,
                 last_http_status = ?,
                 last_request_id = ?,
                 last_error = NULL,
                 response_json = ?,
                 updated_at = NOW(3),
                 sent_at = NOW(3)
             WHERE outbox_id = ?'
        );
        if (!$statement) {
            throw new RuntimeException('Outbox成功更新の準備に失敗しました: ' . $db->error);
        }
        $statement->bind_param(
            'iissi',
            $attemptCount,
            $httpStatus,
            $requestId,
            $responseJson,
            $outboxId
        );
        $statement->execute();
        $statement->close();
        return [
            'status' => 'SENT',
            'outbox_id' => $outboxId,
            'attempt_count' => $attemptCount,
            'http_status' => $httpStatus,
            'request_id' => $requestId,
            'response' => $response['body'],
        ];
    } catch (OkCoreApiException $error) {
        $nextRetryAt = $error->retryable() ? kf_sync_retry_at($attemptCount) : null;
        $responseJson = $error->responseBody() === null
            ? null
            : kf_sync_json_encode($error->responseBody());
        $httpStatus = $error->httpStatus() > 0 ? $error->httpStatus() : null;
        $requestId = $error->requestId();
        $message = $error->errorCode() . ': ' . $error->getMessage();
        $statement = $db->prepare(
            'UPDATE kf_sync_outbox
             SET status = "FAILED",
                 attempt_count = ?,
                 next_retry_at = ?,
                 last_http_status = ?,
                 last_request_id = ?,
                 last_error = ?,
                 response_json = ?,
                 updated_at = NOW(3)
             WHERE outbox_id = ?'
        );
        if (!$statement) {
            throw new RuntimeException('Outbox失敗更新の準備に失敗しました: ' . $db->error);
        }
        $statement->bind_param(
            'isisssi',
            $attemptCount,
            $nextRetryAt,
            $httpStatus,
            $requestId,
            $message,
            $responseJson,
            $outboxId
        );
        $statement->execute();
        $statement->close();

        return [
            'status' => $nextRetryAt !== null ? 'QUEUED' : 'FAILED',
            'outbox_id' => $outboxId,
            'attempt_count' => $attemptCount,
            'http_status' => $httpStatus,
            'request_id' => $requestId,
            'retryable' => $error->retryable(),
            'next_retry_at' => $nextRetryAt,
            'error_code' => $error->errorCode(),
            'message' => $error->getMessage(),
        ];
    }
}

function kf_sync_attempt_safely(mysqli $db, int $outboxId): array
{
    try {
        return kf_sync_attempt_outbox($db, $outboxId);
    } catch (Throwable $error) {
        return [
            'status' => 'FAILED',
            'outbox_id' => $outboxId,
            'retryable' => false,
            'message' => $error->getMessage(),
        ];
    }
}

function kf_sync_create_fragment(mysqli $db, array $input): array
{
    $userId = (int)($input['user_id'] ?? 0);
    $groupId = (int)($input['group_id'] ?? 0);
    $mapId = (int)($input['map_id'] ?? 0);
    $entityId = trim((string)($input['thought_experience_node_id'] ?? ''));
    $experienceType = trim((string)($input['experience_type'] ?? ''));
    $selectedContents = (string)($input['selected_contents'] ?? '');
    $title = (string)($input['knowledge_fragment_content'] ?? '');
    $stage1 = (string)($input['stage1'] ?? '');
    $stage2 = (string)($input['stage2'] ?? '');
    $stage3 = (string)($input['stage3'] ?? '');
    $timestamp = (string)($input['timestamp'] ?? kf_sync_now());
    $sessionSub = (string)($input['sso_sub'] ?? '');

    if ($userId <= 0 || $groupId <= 0 || $entityId === '') {
        throw new InvalidArgumentException('ユーザー、共有先グループ、文脈ノードが必要です。');
    }
    if (strlen($title) > 255) {
        throw new InvalidArgumentException('KFの概要は255文字以内にしてください。');
    }

    $ssoSub = kf_sync_resolve_sso_sub($db, $userId, $sessionSub);
    $entityTypeCode = kf_sync_entity_type_code($experienceType);
    $snapshot = kf_sync_source_snapshot(
        $db,
        $entityTypeCode,
        $entityId,
        $selectedContents
    );
    $stagePayload = kf_sync_stage_payload($stage1, $stage2, $stage3);
    $stagePayloadJson = kf_sync_json_encode($stagePayload);
    $sourceRevision = 1;

    if (!$db->begin_transaction()) {
        throw new RuntimeException('KF保存トランザクションを開始できませんでした。');
    }
    try {
        $contextPackageId = kf_sync_create_context_package(
            $db,
            'thinking_process_map',
            $mapId > 0 ? ('map-' . $mapId) : ('node-' . $entityId),
            $entityTypeCode,
            $entityId,
            $snapshot,
            $timestamp
        );
        $experienceKnowledgeId = kf_sync_next_experience_id($db);

        $statement = $db->prepare(
            'INSERT INTO experience_knowledges (
                experience_knowledge_id,
                remarked_utterance_id,
                thought_experience_node_id,
                experience_type,
                used_remarked_utterance,
                selected_contents,
                knowledge_fragment_content,
                user_id,
                stage1,
                stage2,
                stage3,
                context_package_id,
                stage_payload_json,
                source_revision,
                created_at,
                updated_at,
                deleted,
                discussed
             ) VALUES (
                ?, NULL, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, "YET"
             )'
        );
        if (!$statement) {
            throw new RuntimeException('KF登録の準備に失敗しました: ' . $db->error);
        }
        $statement->bind_param(
            'issssisssisiss',
            $experienceKnowledgeId,
            $entityId,
            $experienceType,
            $selectedContents,
            $title,
            $userId,
            $stage1,
            $stage2,
            $stage3,
            $contextPackageId,
            $stagePayloadJson,
            $sourceRevision,
            $timestamp,
            $timestamp
        );
        if (!$statement->execute()) {
            $message = $statement->error;
            $statement->close();
            throw new RuntimeException('KFを保存できませんでした: ' . $message);
        }
        $statement->close();

        $sharedNodeId = kf_sync_next_shared_node_id($db);
        $statement = $db->prepare(
            'INSERT INTO shared_nodes (
                id,
                experience_knowledge_id,
                knowledge_group_id,
                created_at,
                updated_at,
                deleted
             ) VALUES (?, ?, ?, ?, ?, 0)'
        );
        if (!$statement) {
            throw new RuntimeException('共有情報登録の準備に失敗しました: ' . $db->error);
        }
        $statement->bind_param(
            'iiiss',
            $sharedNodeId,
            $experienceKnowledgeId,
            $groupId,
            $timestamp,
            $timestamp
        );
        if (!$statement->execute()) {
            $message = $statement->error;
            $statement->close();
            throw new RuntimeException('共有情報を保存できませんでした: ' . $message);
        }
        $statement->close();

        $payload = kf_sync_build_payload(
            $db,
            $experienceKnowledgeId,
            $ssoSub,
            $timestamp
        );
        $outboxId = kf_sync_enqueue(
            $db,
            $experienceKnowledgeId,
            $sourceRevision,
            'UPSERT',
            $ssoSub,
            $payload,
            $timestamp
        );
        $db->commit();
    } catch (Throwable $error) {
        $db->rollback();
        throw $error;
    }

    return [
        'experience_knowledge_id' => $experienceKnowledgeId,
        'context_package_id' => $contextPackageId,
        'source_revision' => $sourceRevision,
        'outbox_id' => $outboxId,
        'ok_core' => kf_sync_attempt_safely($db, $outboxId),
    ];
}

function kf_sync_update_fragment(
    mysqli $db,
    int $experienceKnowledgeId,
    int $userId,
    string $title,
    string $stage1,
    string $stage2,
    string $stage3,
    string $timestamp,
    string $sessionSub = ''
): array {
    if (strlen($title) > 255) {
        throw new InvalidArgumentException('KFの概要は255文字以内にしてください。');
    }
    $ssoSub = kf_sync_resolve_sso_sub($db, $userId, $sessionSub);
    $stagePayloadJson = kf_sync_json_encode(
        kf_sync_stage_payload($stage1, $stage2, $stage3)
    );

    if (!$db->begin_transaction()) {
        throw new RuntimeException('KF更新トランザクションを開始できませんでした。');
    }
    try {
        $fragment = kf_sync_load_fragment_for_update($db, $experienceKnowledgeId, $userId);
        if ((int)$fragment['deleted'] !== 0) {
            throw new RuntimeException('削除済みのKFは更新できません。');
        }
        $sourceRevision = max(1, (int)($fragment['source_revision'] ?? 1)) + 1;
        $contextPackageId = kf_sync_ensure_context_for_existing($db, $fragment, $timestamp);

        $statement = $db->prepare(
            'UPDATE experience_knowledges
             SET knowledge_fragment_content = ?,
                 stage1 = ?,
                 stage2 = ?,
                 stage3 = ?,
                 context_package_id = ?,
                 stage_payload_json = ?,
                 source_revision = ?,
                 updated_at = ?
             WHERE experience_knowledge_id = ?
               AND user_id = ?
               AND deleted = 0'
        );
        if (!$statement) {
            throw new RuntimeException('KF更新の準備に失敗しました: ' . $db->error);
        }
        $statement->bind_param(
            'ssssisisii',
            $title,
            $stage1,
            $stage2,
            $stage3,
            $contextPackageId,
            $stagePayloadJson,
            $sourceRevision,
            $timestamp,
            $experienceKnowledgeId,
            $userId
        );
        if (!$statement->execute() || $statement->affected_rows < 1) {
            $message = $statement->error;
            $statement->close();
            throw new RuntimeException(
                $message !== '' ? $message : '更新できるKFが見つかりませんでした。'
            );
        }
        $statement->close();

        $payload = kf_sync_build_payload(
            $db,
            $experienceKnowledgeId,
            $ssoSub,
            $timestamp
        );
        $outboxId = kf_sync_enqueue(
            $db,
            $experienceKnowledgeId,
            $sourceRevision,
            'UPSERT',
            $ssoSub,
            $payload,
            $timestamp
        );
        $db->commit();
    } catch (Throwable $error) {
        $db->rollback();
        throw $error;
    }

    return [
        'experience_knowledge_id' => $experienceKnowledgeId,
        'context_package_id' => $contextPackageId,
        'source_revision' => $sourceRevision,
        'outbox_id' => $outboxId,
        'ok_core' => kf_sync_attempt_safely($db, $outboxId),
    ];
}

function kf_sync_delete_fragment(
    mysqli $db,
    int $experienceKnowledgeId,
    int $userId,
    string $timestamp,
    string $sessionSub = ''
): array {
    $ssoSub = kf_sync_resolve_sso_sub($db, $userId, $sessionSub);
    if (!$db->begin_transaction()) {
        throw new RuntimeException('KF削除トランザクションを開始できませんでした。');
    }
    try {
        $fragment = kf_sync_load_fragment_for_update($db, $experienceKnowledgeId, $userId);
        if ((int)$fragment['deleted'] !== 0) {
            throw new RuntimeException('KFはすでに削除されています。');
        }
        $sourceRevision = max(1, (int)($fragment['source_revision'] ?? 1)) + 1;
        $sourceDeletedAt = kf_sync_to_iso_timestamp($timestamp);

        $statement = $db->prepare(
            'UPDATE experience_knowledges
             SET deleted = 1,
                 source_revision = ?,
                 updated_at = ?
             WHERE experience_knowledge_id = ?
               AND user_id = ?
               AND deleted = 0'
        );
        if (!$statement) {
            throw new RuntimeException('KF削除の準備に失敗しました: ' . $db->error);
        }
        $statement->bind_param(
            'isii',
            $sourceRevision,
            $timestamp,
            $experienceKnowledgeId,
            $userId
        );
        if (!$statement->execute() || $statement->affected_rows < 1) {
            $message = $statement->error;
            $statement->close();
            throw new RuntimeException(
                $message !== '' ? $message : '削除できるKFが見つかりませんでした。'
            );
        }
        $statement->close();

        $outboxId = kf_sync_enqueue(
            $db,
            $experienceKnowledgeId,
            $sourceRevision,
            'DELETE',
            $ssoSub,
            ['source_deleted_at' => $sourceDeletedAt],
            $timestamp
        );
        $db->commit();
    } catch (Throwable $error) {
        $db->rollback();
        throw $error;
    }

    return [
        'experience_knowledge_id' => $experienceKnowledgeId,
        'source_revision' => $sourceRevision,
        'outbox_id' => $outboxId,
        'ok_core' => kf_sync_attempt_safely($db, $outboxId),
    ];
}

function kf_sync_retry_due(mysqli $db, int $limit = 20): array
{
    $limit = max(1, min(100, $limit));
    $result = $db->query(
        'SELECT outbox_id
         FROM kf_sync_outbox
         WHERE status = "PENDING"
            OR (
                status = "FAILED"
                AND next_retry_at IS NOT NULL
                AND next_retry_at <= NOW()
            )
         ORDER BY outbox_id
         LIMIT ' . $limit
    );
    if (!$result) {
        throw new RuntimeException('再送対象を取得できませんでした: ' . $db->error);
    }
    $ids = [];
    while ($row = $result->fetch_assoc()) {
        $ids[] = (int)$row['outbox_id'];
    }
    $result->free();

    $results = [];
    foreach ($ids as $outboxId) {
        $results[] = kf_sync_attempt_safely($db, $outboxId);
    }
    return [
        'processed' => count($results),
        'results' => $results,
    ];
}
