-- knowledge_explorer を組織知登録フォーム(TACTO参照)に対応させるための変更。
-- 既に同名カラムが存在する環境では、ADD COLUMN は重複エラーになります。
-- 実行前に SHOW COLUMNS FROM knowledge_explorer; で確認してください。

ALTER TABLE `knowledge_explorer`
  MODIFY COLUMN `comment` TEXT NULL DEFAULT NULL;

ALTER TABLE `knowledge_explorer`
  ADD COLUMN `tacto_when` TEXT NULL DEFAULT NULL AFTER `comment`,
  ADD COLUMN `tacto_what` TEXT NULL DEFAULT NULL AFTER `tacto_when`,
  ADD COLUMN `tacto_why` TEXT NULL DEFAULT NULL AFTER `tacto_what`,
  ADD COLUMN `organizational_basis` TEXT NULL DEFAULT NULL AFTER `tacto_why`;
