-- OK-Core initial schema
-- Target DB name used by OK-Core/php/connect_db.php by default:
--   ok_core

CREATE DATABASE IF NOT EXISTS `ok_core` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ok_core`;

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL,
  `sso_sub` varchar(191) DEFAULT NULL,
  `name` varchar(45) NOT NULL,
  `login_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `password` varchar(999) NOT NULL DEFAULT 'SSO_LOGIN_DISABLED',
  `sso_user_id` varchar(191) DEFAULT NULL,
  `sso_username` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `display_name` varchar(191) DEFAULT NULL,
  `role` varchar(45) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sso_claims_json` longtext DEFAULT NULL,
  `sso_updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `users_sso_sub_unique` (`sso_sub`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `knowledge_groups` (
  `group_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `creater` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`group_id`),
  KEY `idx_knowledge_groups_creater` (`creater`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `kgroup_user_link` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` varchar(45) NOT NULL DEFAULT 'others',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_group_user` (`group_id`, `user_id`),
  KEY `idx_kgroup_user_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `experience_knowledges` (
  `experience_knowledge_id` int(11) NOT NULL AUTO_INCREMENT,
  `remarked_utterance_id` varchar(255) DEFAULT NULL,
  `thought_experience_node_id` varchar(255) DEFAULT NULL,
  `experience_type` varchar(45) DEFAULT NULL,
  `used_remarked_utterance` tinyint(4) NOT NULL DEFAULT 0,
  `selected_contents` longtext NOT NULL,
  `knowledge_fragment_content` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `stage1` varchar(255) NOT NULL DEFAULT '',
  `stage2` varchar(255) DEFAULT NULL,
  `stage3` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(4) NOT NULL DEFAULT 0,
  `discussed` enum('YET','UNDERWAY','DONE') NOT NULL DEFAULT 'YET',
  PRIMARY KEY (`experience_knowledge_id`),
  KEY `idx_experience_knowledges_user` (`user_id`),
  KEY `idx_experience_knowledges_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `externalized_contents` (
  `externalized_contents_id` int(11) NOT NULL AUTO_INCREMENT,
  `remarked_utterance_id` varchar(255) DEFAULT NULL,
  `thought_experience_node_id` varchar(255) DEFAULT NULL,
  `externalized_type` varchar(45) DEFAULT NULL,
  `used_remarked_utterance` tinyint(4) NOT NULL DEFAULT 0,
  `selected_contents` longtext NOT NULL,
  `knowledge_fragment_content` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `stage1` varchar(255) NOT NULL DEFAULT '',
  `stage2` varchar(255) DEFAULT NULL,
  `stage3` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(4) NOT NULL DEFAULT 0,
  `discussed` enum('YET','UNDERWAY','DONE') NOT NULL DEFAULT 'YET',
  PRIMARY KEY (`externalized_contents_id`),
  KEY `idx_externalized_contents_user` (`user_id`),
  KEY `idx_externalized_contents_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `shared_nodes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `experience_knowledge_id` int(11) DEFAULT NULL,
  `process_node_id` varchar(255) DEFAULT NULL,
  `knowledge_group_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_shared_nodes_group` (`knowledge_group_id`),
  KEY `idx_shared_nodes_experience` (`experience_knowledge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `knowledge_explorer` (
  `knowledge_node_id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_node_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `node_title` varchar(255) NOT NULL,
  `knowledge_fragment_id` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `tacto_when` text DEFAULT NULL,
  `tacto_what` text DEFAULT NULL,
  `tacto_why` text DEFAULT NULL,
  `organizational_basis` text DEFAULT NULL,
  `node_type` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int(11) DEFAULT NULL,
  `deleted` tinyint(4) NOT NULL DEFAULT 0,
  `sort_order` int(11) DEFAULT NULL,
  `knowledge_group_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`knowledge_node_id`),
  KEY `idx_knowledge_explorer_parent_node` (`parent_node_id`),
  KEY `idx_knowledge_explorer_parent` (`parent_id`),
  KEY `idx_knowledge_explorer_group` (`knowledge_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `knowledge_explorer_fragment_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `knowledge_node_id` int(11) NOT NULL,
  `fragment_source_type` enum('experience','discussion','SRL') NOT NULL,
  `fragment_source_id` int(11) NOT NULL,
  `display_order` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_knowledge_fragment` (`knowledge_node_id`, `fragment_source_type`, `fragment_source_id`),
  KEY `idx_knowledge_node_id` (`knowledge_node_id`),
  KEY `idx_fragment_lookup` (`fragment_source_type`, `fragment_source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `discussion_history` (
  `discussion_history_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `posted_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `content` varchar(255) NOT NULL,
  `knowledge_fragment_id` varchar(255) NOT NULL,
  `fragment_source_type` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`discussion_history_id`),
  KEY `idx_discussion_fragment` (`knowledge_fragment_id`),
  KEY `idx_discussion_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `knowledge_fragment_positions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL DEFAULT 0,
  `externalized_contents_id` int(11) NOT NULL,
  `pos_x` float NOT NULL DEFAULT 0,
  `pos_y` float NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_group_externalized` (`group_id`, `externalized_contents_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Minimal local group for first login tests.
-- Replace the user_id after the first SSO login, or create groups through an admin flow later.
-- INSERT INTO `knowledge_groups` (`name`, `creater`) VALUES ('Default Organization', 1);
-- INSERT INTO `kgroup_user_link` (`group_id`, `user_id`, `role`) VALUES (1, 1, 'admin');
