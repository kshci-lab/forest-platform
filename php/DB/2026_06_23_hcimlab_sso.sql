ALTER TABLE `users`
  ADD COLUMN `sso_sub` varchar(191) DEFAULT NULL AFTER `user_id`,
  ADD COLUMN `sso_user_id` varchar(191) DEFAULT NULL AFTER `password`,
  ADD COLUMN `sso_username` varchar(191) DEFAULT NULL AFTER `sso_user_id`,
  ADD COLUMN `email` varchar(191) DEFAULT NULL AFTER `sso_username`,
  ADD COLUMN `display_name` varchar(191) DEFAULT NULL AFTER `email`,
  ADD COLUMN `role` varchar(45) DEFAULT NULL AFTER `display_name`,
  ADD COLUMN `is_active` tinyint(1) NOT NULL DEFAULT 1 AFTER `role`,
  ADD COLUMN `sso_claims_json` longtext DEFAULT NULL AFTER `is_active`,
  ADD COLUMN `sso_updated_at` timestamp NULL DEFAULT NULL AFTER `sso_claims_json`;

ALTER TABLE `users`
  ADD UNIQUE KEY `users_sso_sub_unique` (`sso_sub`);
