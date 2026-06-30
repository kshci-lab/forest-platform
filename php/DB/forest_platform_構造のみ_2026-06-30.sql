-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- ホスト: localhost:8889
-- 生成日時: 2026 年 6 月 30 日 05:26
-- サーバのバージョン： 8.0.40
-- PHP のバージョン: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- データベース: `forest_platform`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `activities`
--

CREATE TABLE `activities` (
  `id` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `timestamp` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `node_id` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `act` varchar(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `type` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `concept_id` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `text` varchar(999) DEFAULT NULL,
  `parent_id` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `user_id` int NOT NULL,
  `map_id` int NOT NULL,
  `object_map_id` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `chapters`
--

CREATE TABLE `chapters` (
  `chapter_id` varchar(45) NOT NULL,
  `map_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `chapter_histories`
--

CREATE TABLE `chapter_histories` (
  `chapter_history_id` varchar(45) NOT NULL,
  `chapter_version_id` varchar(45) NOT NULL,
  `chapter_bro_id` varchar(45) NOT NULL,
  `title` varchar(1024) NOT NULL DEFAULT '',
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `chapter_latest`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `chapter_latest` (
`chapter_id` varchar(45)
,`chapter_bro_id` varchar(45)
,`title` varchar(1024)
,`appeared_at` timestamp
);

-- --------------------------------------------------------

--
-- テーブルの構造 `chapter_versions`
--

CREATE TABLE `chapter_versions` (
  `chapter_version_id` varchar(45) NOT NULL,
  `chapter_id` varchar(45) NOT NULL,
  `chapter_bro_id` varchar(45) NOT NULL,
  `map_version_id` int NOT NULL,
  `title` varchar(1024) NOT NULL DEFAULT '',
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `combined_contents`
--

CREATE TABLE `combined_contents` (
  `combined_contents_id` int NOT NULL,
  `externalized_contents_id` varchar(255) DEFAULT NULL,
  `content` varchar(255) NOT NULL,
  `comment` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `comments`
--

CREATE TABLE `comments` (
  `comment_id` int NOT NULL,
  `content` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `comment_annotations`
--

CREATE TABLE `comment_annotations` (
  `annotation_id` int NOT NULL,
  `comment_id` int NOT NULL,
  `start_char_id` int NOT NULL,
  `end_char_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `comment_destinations`
--

CREATE TABLE `comment_destinations` (
  `id` int NOT NULL,
  `comment_id` int NOT NULL,
  `destination` varchar(45) NOT NULL,
  `type` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `discussion_history`
--

CREATE TABLE `discussion_history` (
  `discussion_history_id` int NOT NULL,
  `user_id` int NOT NULL,
  `posted_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `content` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `knowledge_fragment_id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `discussion_participants`
--

CREATE TABLE `discussion_participants` (
  `discussion_id` int NOT NULL,
  `user_id` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `discussion_sessions`
--

CREATE TABLE `discussion_sessions` (
  `discussion_id` int NOT NULL,
  `start_time` varchar(45) NOT NULL,
  `end_time` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `discussion_utterances`
--

CREATE TABLE `discussion_utterances` (
  `utterance_id` int NOT NULL,
  `discussion_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` longtext NOT NULL,
  `network_on` int DEFAULT NULL,
  `utter_time` varchar(45) NOT NULL,
  `utter_epoc_time` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `document_titles`
--

CREATE TABLE `document_titles` (
  `document_id` int NOT NULL,
  `map_id` int NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `experience_knowledges`
--

CREATE TABLE `experience_knowledges` (
  `experience_knowledge_id` int NOT NULL,
  `remarked_utterance_id` varchar(255) DEFAULT NULL,
  `thought_experience_node_id` varchar(255) DEFAULT NULL,
  `experience_type` varchar(45) DEFAULT NULL,
  `used_remarked_utterance` tinyint NOT NULL,
  `selected_contents` longtext NOT NULL,
  `knowledge_fragment_content` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `stage1` varchar(255) NOT NULL,
  `stage2` varchar(255) DEFAULT NULL,
  `stage3` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL,
  `discussed` enum('YET','UNDERWAY','DONE') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `externalized_contents`
--

CREATE TABLE `externalized_contents` (
  `externalized_contents_id` int NOT NULL,
  `remarked_utterance_id` varchar(255) NOT NULL,
  `thought_experience_node_id` varchar(255) DEFAULT NULL,
  `externalized_type` varchar(45) DEFAULT NULL,
  `used_remarked_utterance` tinyint NOT NULL,
  `selected_contents` longtext NOT NULL,
  `knowledge_fragment_content` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `stage1` varchar(255) NOT NULL,
  `stage2` varchar(255) DEFAULT NULL,
  `stage3` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL,
  `discussed` enum('YET','UNDERWAY','DONE') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `feedbacks`
--

CREATE TABLE `feedbacks` (
  `feedback_id` int NOT NULL,
  `node_history_id` varchar(45) NOT NULL,
  `concept` varchar(45) NOT NULL,
  `content` varchar(999) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `images`
--

CREATE TABLE `images` (
  `image_id` varchar(64) NOT NULL,
  `image_name` varchar(256) NOT NULL,
  `image_type` varchar(64) NOT NULL,
  `image_content` mediumblob NOT NULL,
  `image_size` int NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `items`
--

CREATE TABLE `items` (
  `item_id` varchar(45) NOT NULL,
  `map_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `item_contents`
--

CREATE TABLE `item_contents` (
  `item_content_id` varchar(45) NOT NULL,
  `item_id` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `item_content_histories`
--

CREATE TABLE `item_content_histories` (
  `item_content_history_id` varchar(45) NOT NULL,
  `item_content_version_id` varchar(45) NOT NULL,
  `item_content_bro_id` varchar(45) NOT NULL DEFAULT 'root',
  `indent` varchar(45) NOT NULL DEFAULT 'root',
  `node_id` varchar(45) DEFAULT NULL,
  `logic_option` varchar(100) NOT NULL DEFAULT '0',
  `title` varchar(999) DEFAULT '',
  `type` int DEFAULT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `item_content_latest`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `item_content_latest` (
`item_content_id` varchar(45)
,`item_id` varchar(45)
,`item_content_version_id` varchar(45)
,`item_content_history_id` varchar(45)
,`indent` varchar(45)
,`item_content_bro_id` varchar(45)
,`node_id` varchar(45)
,`concept_id` varchar(45)
,`logic_option` varchar(100)
,`title` varchar(999)
,`node_type_id` int
,`class` varchar(100)
,`type` varchar(100)
,`appeared_at` timestamp
,`map_id` bigint
);

-- --------------------------------------------------------

--
-- テーブルの構造 `item_content_relations`
--

CREATE TABLE `item_content_relations` (
  `id` varchar(100) NOT NULL,
  `node1_id` varchar(45) NOT NULL,
  `item_content1_id` varchar(45) NOT NULL,
  `item_content1_label` varchar(45) NOT NULL,
  `ont1_id` varchar(45) NOT NULL,
  `node2_id` varchar(45) NOT NULL,
  `item_content2_id` varchar(45) NOT NULL,
  `item_content2_label` varchar(45) NOT NULL,
  `ont2_id` varchar(45) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `item_content_versions`
--

CREATE TABLE `item_content_versions` (
  `item_content_version_id` varchar(45) NOT NULL,
  `item_content_id` varchar(45) NOT NULL,
  `item_content_bro_id` varchar(45) NOT NULL DEFAULT 'root',
  `indent` varchar(45) NOT NULL DEFAULT 'root',
  `node_id` varchar(45) DEFAULT NULL,
  `logic_option` int NOT NULL DEFAULT '0',
  `title` varchar(999) DEFAULT '',
  `type` int DEFAULT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `item_histories`
--

CREATE TABLE `item_histories` (
  `item_history_id` varchar(45) NOT NULL,
  `item_version_id` varchar(45) NOT NULL,
  `item_bro_id` varchar(45) NOT NULL DEFAULT 'root',
  `node_id` varchar(45) DEFAULT NULL,
  `logic_option` int NOT NULL DEFAULT '0',
  `title` varchar(999) DEFAULT '',
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `item_latest`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `item_latest` (
`item_id` varchar(45)
,`item_version_id` varchar(45)
,`item_history_id` varchar(45)
,`item_bro_id` varchar(45)
,`map_id` int
,`node_id` varchar(45)
,`concept_id` varchar(45)
,`logic_option` int
,`title` varchar(999)
,`appeared_at` timestamp
);

-- --------------------------------------------------------

--
-- テーブルの構造 `item_relations`
--

CREATE TABLE `item_relations` (
  `id` varchar(100) NOT NULL,
  `node1_id` varchar(45) NOT NULL,
  `item1_id` varchar(45) NOT NULL,
  `item1_label` varchar(45) NOT NULL,
  `ont1_id` varchar(45) NOT NULL,
  `node2_id` varchar(45) NOT NULL,
  `item2_id` varchar(45) NOT NULL,
  `item2_label` varchar(45) NOT NULL,
  `ont2_id` varchar(45) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `item_versions`
--

CREATE TABLE `item_versions` (
  `item_version_id` varchar(45) NOT NULL,
  `item_id` varchar(45) NOT NULL,
  `item_bro_id` varchar(45) NOT NULL DEFAULT 'root',
  `node_id` varchar(45) DEFAULT NULL,
  `logic_option` int NOT NULL DEFAULT '0',
  `title` varchar(999) DEFAULT '',
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `kgroup_user_link`
--

CREATE TABLE `kgroup_user_link` (
  `id` int NOT NULL,
  `group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` varchar(45) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'others',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `knowledge_explorer`
--

CREATE TABLE `knowledge_explorer` (
  `knowledge_node_id` int NOT NULL,
  `parent_node_id` int DEFAULT NULL,
  `node_title` varchar(255) NOT NULL,
  `knowledge_fragment_id` varchar(255) DEFAULT NULL,
  `comment` varchar(255) DEFAULT NULL,
  `node_type` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int NOT NULL,
  `deleted` tinyint NOT NULL,
  `sort_order` int DEFAULT NULL,
  `knowledge_group_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `knowledge_explorer_fragment_links`
--

CREATE TABLE `knowledge_explorer_fragment_links` (
  `id` int NOT NULL,
  `knowledge_node_id` int NOT NULL,
  `fragment_source_type` enum('experience','externalized','SRL') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `fragment_source_id` int NOT NULL,
  `display_order` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- テーブルの構造 `knowledge_fragment`
--

CREATE TABLE `knowledge_fragment` (
  `knowledge_fragment_id` int NOT NULL,
  `knowledge_fragment_content` varchar(255) NOT NULL,
  `externalized_contents_id` int NOT NULL,
  `discussed` enum('YET','UNDERWAY','DONE','') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `knowledge_fragment_positions`
--

CREATE TABLE `knowledge_fragment_positions` (
  `id` int NOT NULL,
  `externalized_contents_id` int NOT NULL,
  `pos_x` float NOT NULL,
  `pos_y` float NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `knowledge_groups`
--

CREATE TABLE `knowledge_groups` (
  `group_id` int NOT NULL,
  `name` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `creater` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `maps`
--

CREATE TABLE `maps` (
  `map_id` int NOT NULL,
  `user_id` int NOT NULL,
  `paper_id` int DEFAULT NULL,
  `name` varchar(45) NOT NULL DEFAULT '',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `map_mode_link`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `map_mode_link` (
`map_id` int
,`user_id` int
,`paper_id` int
,`name` varchar(45)
,`created_at` timestamp
,`updated_at` timestamp
,`deleted` tinyint
,`mode_name` varchar(45)
,`mode_id` int
);

-- --------------------------------------------------------

--
-- テーブルの構造 `map_mode_links`
--

CREATE TABLE `map_mode_links` (
  `id` int NOT NULL,
  `map_id` int NOT NULL,
  `mode_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `map_node_links`
--

CREATE TABLE `map_node_links` (
  `id` int NOT NULL,
  `map_id` int NOT NULL,
  `node_id` varchar(45) NOT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `map_versions`
--

CREATE TABLE `map_versions` (
  `map_version_id` int NOT NULL,
  `map_id` int NOT NULL,
  `name` varchar(45) NOT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `map_version_reasons`
--

CREATE TABLE `map_version_reasons` (
  `id` int NOT NULL,
  `map_version_id` int NOT NULL,
  `reason` varchar(999) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `modes`
--

CREATE TABLE `modes` (
  `mode_id` int NOT NULL,
  `name` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `mt_timing`
--

CREATE TABLE `mt_timing` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `mt_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `network_edges`
--

CREATE TABLE `network_edges` (
  `network_edge_id` varchar(45) NOT NULL,
  `edge_start` varchar(45) NOT NULL,
  `edge_end` varchar(45) NOT NULL,
  `edge_label` varchar(45) DEFAULT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `network_maps`
--

CREATE TABLE `network_maps` (
  `network_map_id` varchar(45) NOT NULL,
  `map_id` int NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `situation` varchar(45) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `network_mindmap_connects`
--

CREATE TABLE `network_mindmap_connects` (
  `network_node_id` varchar(45) NOT NULL,
  `mindmap_node_id` varchar(45) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `network_nodes`
--

CREATE TABLE `network_nodes` (
  `network_node_id` varchar(45) NOT NULL,
  `network_map_id` varchar(45) NOT NULL,
  `label` varchar(100) NOT NULL,
  `node_x` int NOT NULL,
  `node_y` int NOT NULL,
  `node_type` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `network_ontology_connects`
--

CREATE TABLE `network_ontology_connects` (
  `network_node_id` varchar(45) NOT NULL,
  `ontology_id` varchar(45) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `network_recruits`
--

CREATE TABLE `network_recruits` (
  `network_node_id` varchar(45) NOT NULL,
  `ontology_id` varchar(45) DEFAULT NULL,
  `result_recruit` varchar(5) NOT NULL,
  `reason` longtext,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `network_texts`
--

CREATE TABLE `network_texts` (
  `network_text_id` int NOT NULL,
  `network_map_id` varchar(45) NOT NULL,
  `sender` varchar(45) NOT NULL,
  `content` longtext NOT NULL,
  `time` double NOT NULL,
  `JPNtime` varchar(45) NOT NULL,
  `ST_Time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `nodes`
--

CREATE TABLE `nodes` (
  `node_id` varchar(45) NOT NULL,
  `user_id` int NOT NULL,
  `node_type_id` int NOT NULL,
  `from_mode` varchar(100) DEFAULT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `node_actions`
--

CREATE TABLE `node_actions` (
  `node_action_id` varchar(45) NOT NULL,
  `node_history_id` varchar(45) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `act` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `node_allchange_view`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `node_allchange_view` (
`user_id` int
,`map_id` int
,`node_id` varchar(45)
,`node_version_id` varchar(45)
,`node_history_id` varchar(45)
,`content` varchar(999)
,`appeared_at` timestamp
,`disappeared_at` timestamp
,`concept_id` varchar(45)
,`parent_id` varchar(45)
,`node_type_id` int
,`type` varchar(100)
,`class` varchar(100)
);

-- --------------------------------------------------------

--
-- テーブルの構造 `node_histories`
--

CREATE TABLE `node_histories` (
  `node_history_id` varchar(45) NOT NULL,
  `node_version_id` varchar(45) NOT NULL,
  `parent_id` varchar(45) DEFAULT 'root',
  `node_type_id` int NOT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NULL DEFAULT NULL,
  `content` varchar(999) DEFAULT '',
  `concept_id` varchar(45) DEFAULT NULL,
  `x` varchar(45) NOT NULL,
  `y` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `node_latest`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `node_latest` (
`node_id` varchar(45)
,`node_version_id` varchar(45)
,`node_history_id` varchar(45)
,`parent_id` varchar(45)
,`node_type_id` int
,`class` varchar(100)
,`type` varchar(100)
,`content` varchar(999)
,`concept_id` varchar(45)
,`x` varchar(45)
,`y` varchar(45)
,`appeared_at` timestamp
);

-- --------------------------------------------------------

--
-- テーブルの構造 `node_types`
--

CREATE TABLE `node_types` (
  `node_type_id` int NOT NULL,
  `class` varchar(100) DEFAULT NULL,
  `type` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `node_versions`
--

CREATE TABLE `node_versions` (
  `node_version_id` varchar(45) NOT NULL,
  `node_id` varchar(45) NOT NULL,
  `parent_id` varchar(45) DEFAULT 'root',
  `node_type_id` int NOT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NULL DEFAULT NULL,
  `content` varchar(999) DEFAULT '',
  `concept_id` varchar(45) DEFAULT NULL,
  `x` varchar(45) NOT NULL,
  `y` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_activities`
--

CREATE TABLE `object_activities` (
  `object_activity_id` varchar(45) NOT NULL,
  `object_node_id` varchar(45) NOT NULL,
  `activity_id` varchar(45) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `activity_text` varchar(999) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_edges`
--

CREATE TABLE `object_edges` (
  `object_edge_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `edge_start` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `edge_end` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(999) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_edge_histories`
--

CREATE TABLE `object_edge_histories` (
  `object_edge_history_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `object_edge_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `edge_start` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `edge_end` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(999) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_journals`
--

CREATE TABLE `object_journals` (
  `object_journal_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `map_id` int NOT NULL,
  `start_date` date NOT NULL,
  `finish_date` date NOT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `update_at` timestamp NULL DEFAULT NULL,
  `delete` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_journal_history_records`
--

CREATE TABLE `object_journal_history_records` (
  `journal_history_id` varchar(45) NOT NULL,
  `object_journal_id` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_journal_lesson-learneds`
--

CREATE TABLE `object_journal_lesson-learneds` (
  `object_journal_lesson-learned_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `object_journal_reflection_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lesson_learned` longtext COLLATE utf8mb4_unicode_ci,
  `why_important` longtext COLLATE utf8mb4_unicode_ci,
  `opportunity` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `map_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_journal_nodes`
--

CREATE TABLE `object_journal_nodes` (
  `object_journal_node_id` varchar(45) NOT NULL,
  `object_journal_id` varchar(45) NOT NULL,
  `node_id` varchar(45) NOT NULL,
  `deleted` varchar(1) NOT NULL DEFAULT '0',
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `update_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_journal_reflections`
--

CREATE TABLE `object_journal_reflections` (
  `object_journal_reflection_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `object_journal_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `journal_history_id` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `evaluation_good` longtext COLLATE utf8mb4_unicode_ci,
  `evaluation_bad` longtext COLLATE utf8mb4_unicode_ci,
  `attribution` longtext COLLATE utf8mb4_unicode_ci,
  `attribution_bad` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_lesson-learneds`
--

CREATE TABLE `object_lesson-learneds` (
  `object_le_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `object_node_id` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reflection_id` varchar(45) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `lesson_learned` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `why_important` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `opportunity` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_nodes`
--

CREATE TABLE `object_nodes` (
  `object_node_id` varchar(45) NOT NULL,
  `node_id` varchar(45) DEFAULT NULL,
  `content` longtext NOT NULL,
  `node_x` varchar(45) NOT NULL,
  `node_y` varchar(45) NOT NULL,
  `object_nodes_type` varchar(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL,
  `status` varchar(11) DEFAULT NULL,
  `purpose` varchar(100) DEFAULT NULL,
  `estimated_time` varchar(50) DEFAULT NULL,
  `evaluation_good` longtext,
  `evaluation_bad` longtext,
  `attribution` longtext,
  `attribution_bad` longtext
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `object_nodes_histories`
--

CREATE TABLE `object_nodes_histories` (
  `object_node_history_id` varchar(45) NOT NULL,
  `object_node_id` varchar(45) NOT NULL,
  `object_node_type` varchar(11) NOT NULL,
  `status` varchar(45) NOT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `content` varchar(999) NOT NULL,
  `x` varchar(45) NOT NULL,
  `y` varchar(45) NOT NULL,
  `purpose` varchar(100) DEFAULT NULL,
  `estimated_time` varchar(30) DEFAULT NULL,
  `action_reason` varchar(999) DEFAULT NULL,
  `completion_reason` varchar(999) DEFAULT NULL,
  `challenges_learnings` varchar(999) DEFAULT NULL,
  `drag` int NOT NULL DEFAULT '0',
  `activity` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `object_nodes_summary`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `object_nodes_summary` (
`user_id` int
,`name` varchar(45)
,`total_active_objects` bigint
,`inProgress` decimal(23,0)
,`paused` decimal(23,0)
,`completed` decimal(23,0)
,`with_purpose` decimal(23,0)
,`with_eval_good` decimal(23,0)
,`with_eval_bad` decimal(23,0)
,`with_attribution` decimal(23,0)
,`with_attr_bad` decimal(23,0)
,`completion_rate` decimal(28,1)
);

-- --------------------------------------------------------

--
-- テーブルの構造 `object_reflection_records`
--

CREATE TABLE `object_reflection_records` (
  `reflection_id` varchar(45) NOT NULL,
  `object_node_id` varchar(45) NOT NULL,
  `evaluation_good` longtext,
  `attribution` longtext,
  `evaluation_bad` longtext,
  `attribution_bad` longtext,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `papers`
--

CREATE TABLE `papers` (
  `id` int NOT NULL,
  `paper_content` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paper_title` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `paper_annotations`
--

CREATE TABLE `paper_annotations` (
  `annotation_id` int NOT NULL,
  `node_id` varchar(45) NOT NULL,
  `start_char_id` int NOT NULL,
  `end_char_id` int NOT NULL,
  `content` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `paragraphes`
--

CREATE TABLE `paragraphes` (
  `paragraph_id` varchar(45) NOT NULL,
  `section_id` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `paragraph_contents`
--

CREATE TABLE `paragraph_contents` (
  `paragraph_content_id` varchar(45) NOT NULL,
  `paragraph_id` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `paragraph_content_histories`
--

CREATE TABLE `paragraph_content_histories` (
  `paragraph_content_history_id` varchar(45) NOT NULL,
  `paragraph_content_version_id` varchar(45) NOT NULL,
  `paragraph_content_par_id` varchar(45) NOT NULL,
  `paragraph_content_bro_id` varchar(45) NOT NULL,
  `node_id` varchar(45) NOT NULL,
  `content` varchar(999) NOT NULL,
  `concept_id` varchar(45) NOT NULL,
  `node_type_id` int NOT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `paragraph_content_latest`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `paragraph_content_latest` (
`paragraph_content_id` varchar(45)
,`paragraph_content_version_id` varchar(45)
,`paragraph_content_history_id` varchar(45)
,`paragraph_content_par_id` varchar(45)
,`paragraph_content_bro_id` varchar(45)
,`node_id` varchar(45)
,`concept_id` varchar(45)
,`content` varchar(999)
,`node_type_id` int
,`appeared_at` timestamp
);

-- --------------------------------------------------------

--
-- テーブルの構造 `paragraph_content_versions`
--

CREATE TABLE `paragraph_content_versions` (
  `paragraph_content_version_id` varchar(45) NOT NULL,
  `paragraph_content_id` varchar(45) NOT NULL,
  `paragraph_content_par_id` varchar(45) NOT NULL,
  `paragraph_content_bro_id` varchar(45) NOT NULL,
  `paragraph_version_id` varchar(45) NOT NULL,
  `content` varchar(999) NOT NULL,
  `node_id` varchar(45) NOT NULL,
  `concept_id` varchar(45) NOT NULL,
  `node_type_id` int NOT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `paragraph_histories`
--

CREATE TABLE `paragraph_histories` (
  `paragraph_history_id` varchar(45) NOT NULL,
  `paragraph_version_id` varchar(45) NOT NULL,
  `paragraph_bro_id` varchar(45) NOT NULL,
  `title` varchar(1024) NOT NULL DEFAULT '',
  `content` longtext NOT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `paragraph_latest`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `paragraph_latest` (
`paragraph_id` varchar(45)
,`paragraph_version_id` varchar(45)
,`paragraph_history_id` varchar(45)
,`paragraph_bro_id` varchar(45)
,`title` varchar(1024)
,`content` longtext
,`appeared_at` timestamp
);

-- --------------------------------------------------------

--
-- テーブルの構造 `paragraph_versions`
--

CREATE TABLE `paragraph_versions` (
  `paragraph_version_id` varchar(45) NOT NULL,
  `paragraph_id` varchar(45) NOT NULL,
  `paragraph_bro_id` varchar(45) NOT NULL,
  `section_version_id` varchar(45) NOT NULL,
  `title` varchar(1024) NOT NULL DEFAULT '',
  `content` longtext NOT NULL,
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `process_edges`
--

CREATE TABLE `process_edges` (
  `process_edge_id` varchar(45) NOT NULL,
  `edge_start` varchar(45) NOT NULL,
  `edge_end` varchar(45) NOT NULL,
  `label` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `process_nodes`
--

CREATE TABLE `process_nodes` (
  `process_node_id` varchar(45) NOT NULL,
  `node_id` varchar(45) NOT NULL,
  `content` varchar(100) DEFAULT NULL,
  `process_node_type` varchar(45) NOT NULL DEFAULT 'process',
  `node_x` int NOT NULL,
  `node_y` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `rationality_nodes`
--

CREATE TABLE `rationality_nodes` (
  `id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `rationality_id` varchar(45) NOT NULL,
  `node_id` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `remarked_utterances`
--

CREATE TABLE `remarked_utterances` (
  `utterance_id` int NOT NULL,
  `remarked_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `type` enum('SELF','OTHER','ORGANIZATION','UNKNOWN') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `scenario_titles`
--

CREATE TABLE `scenario_titles` (
  `scenario_id` int NOT NULL,
  `map_id` int NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `sections`
--

CREATE TABLE `sections` (
  `section_id` varchar(45) NOT NULL,
  `chapter_id` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `section_histories`
--

CREATE TABLE `section_histories` (
  `section_history_id` varchar(45) NOT NULL,
  `section_version_id` varchar(45) NOT NULL,
  `section_bro_id` varchar(45) NOT NULL,
  `title` varchar(1024) NOT NULL DEFAULT '',
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `section_latest`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `section_latest` (
`section_id` varchar(45)
,`section_bro_id` varchar(45)
,`title` varchar(1024)
,`appeared_at` timestamp
);

-- --------------------------------------------------------

--
-- テーブルの構造 `section_versions`
--

CREATE TABLE `section_versions` (
  `section_version_id` varchar(45) NOT NULL,
  `section_id` varchar(45) NOT NULL,
  `section_bro_id` varchar(45) NOT NULL,
  `chapter_version_id` varchar(45) NOT NULL,
  `title` varchar(1024) NOT NULL DEFAULT '',
  `appeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disappeared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- テーブルの構造 `shared_nodes`
--

CREATE TABLE `shared_nodes` (
  `id` int NOT NULL,
  `experience_knowledge_id` int NOT NULL,
  `knowledge_group_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `triggers`
--

CREATE TABLE `triggers` (
  `trigger_id` varchar(45) NOT NULL,
  `activity_id` varchar(45) DEFAULT NULL,
  `node_version_from` varchar(45) NOT NULL,
  `node_version_to` varchar(45) DEFAULT NULL,
  `activity_time` timestamp NULL DEFAULT NULL,
  `activity_type` varchar(100) DEFAULT NULL,
  `content` varchar(999) DEFAULT NULL,
  `add_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `x` int NOT NULL,
  `y` int NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `trigger_candidates`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `trigger_candidates` (
`activity_id` varchar(45)
,`activity_type` varchar(5)
,`map_id` bigint
,`node_id` varchar(45)
,`content` varchar(999)
,`concept_id` varchar(45)
,`appeared_at` timestamp
,`disappeared_at` timestamp
,`trigger_on` int
);

-- --------------------------------------------------------

--
-- テーブルの構造 `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `sso_sub` varchar(191) DEFAULT NULL,
  `name` varchar(45) NOT NULL,
  `login_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `password` varchar(999) NOT NULL,
  `sso_user_id` varchar(191) DEFAULT NULL,
  `sso_username` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `display_name` varchar(191) DEFAULT NULL,
  `role` varchar(45) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sso_claims_json` longtext,
  `sso_updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `user_final_lesson_summary`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `user_final_lesson_summary` (
`user_id` int
,`name` varchar(45)
,`node_lesson_count` bigint
,`journal_lesson_count` bigint
);

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `user_journal_node_summary`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `user_journal_node_summary` (
`user_id` int
,`name` varchar(45)
,`total_node_count` bigint
,`total_journal_count` bigint
);

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `user_journal_record_summary`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `user_journal_record_summary` (
`user_id` int
,`name` varchar(45)
,`journal_count` bigint
,`journal_node_count` bigint
);

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `user_lesson_learned_summary`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `user_lesson_learned_summary` (
`user_id` int
,`name` varchar(45)
,`node_lesson_count` bigint
,`journal_lesson_count` bigint
);

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `view_changed_content_vs_latest`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `view_changed_content_vs_latest` (
`node_id` varchar(45)
,`latest_node_version_id` varchar(45)
,`version_content` varchar(999)
,`history_node_version_id` varchar(45)
,`history_content` varchar(999)
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- ビュー用の構造 `chapter_latest`
--
DROP TABLE IF EXISTS `chapter_latest`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `chapter_latest`  AS SELECT `c`.`chapter_id` AS `chapter_id`, `cv`.`chapter_bro_id` AS `chapter_bro_id`, `cv`.`title` AS `title`, `cv`.`appeared_at` AS `appeared_at` FROM ((`chapters` `c` join `chapter_versions` `cv` on((`c`.`chapter_id` = `cv`.`chapter_id`))) join `chapter_histories` `ch` on((`cv`.`chapter_version_id` = `ch`.`chapter_version_id`))) ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `item_content_latest`
--
DROP TABLE IF EXISTS `item_content_latest`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `item_content_latest`  AS SELECT `ic`.`item_content_id` AS `item_content_id`, `ic`.`item_id` AS `item_id`, `icv`.`item_content_version_id` AS `item_content_version_id`, `ich`.`item_content_history_id` AS `item_content_history_id`, `ich`.`indent` AS `indent`, `ich`.`item_content_bro_id` AS `item_content_bro_id`, `ich`.`node_id` AS `node_id`, `node_latest`.`concept_id` AS `concept_id`, `ich`.`logic_option` AS `logic_option`, `ich`.`title` AS `title`, `node_types`.`node_type_id` AS `node_type_id`, `node_types`.`class` AS `class`, `node_types`.`type` AS `type`, `ich`.`appeared_at` AS `appeared_at`, (select `items`.`map_id` from `items` where (`items`.`item_id` = `ic`.`item_id`)) AS `map_id` FROM ((((`item_contents` `ic` join `item_content_versions` `icv` on((`ic`.`item_content_id` = `icv`.`item_content_id`))) join `item_content_histories` `ich` on((`icv`.`item_content_version_id` = `ich`.`item_content_version_id`))) join `node_types` on((`ich`.`type` = `node_types`.`node_type_id`))) left join `node_latest` on((`ich`.`node_id` = `node_latest`.`node_id`))) WHERE ((`ic`.`deleted` = 0) AND (`ich`.`disappeared_at` is null)) ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `item_latest`
--
DROP TABLE IF EXISTS `item_latest`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `item_latest`  AS SELECT `i`.`item_id` AS `item_id`, `iv`.`item_version_id` AS `item_version_id`, `ih`.`item_history_id` AS `item_history_id`, `ih`.`item_bro_id` AS `item_bro_id`, `i`.`map_id` AS `map_id`, `ih`.`node_id` AS `node_id`, `node_latest`.`concept_id` AS `concept_id`, `ih`.`logic_option` AS `logic_option`, `ih`.`title` AS `title`, `ih`.`appeared_at` AS `appeared_at` FROM (((`items` `i` join `item_versions` `iv` on((`iv`.`item_id` = `i`.`item_id`))) join `item_histories` `ih` on((`ih`.`item_version_id` = `iv`.`item_version_id`))) left join `node_latest` on((`ih`.`node_id` = `node_latest`.`node_id`))) WHERE ((`iv`.`appeared_at` = (select max(`iv2`.`appeared_at`) from `item_versions` `iv2` where (`iv2`.`item_id` = `i`.`item_id`))) AND (`ih`.`appeared_at` = (select max(`ih2`.`appeared_at`) from `item_histories` `ih2` where (`ih2`.`item_version_id` = `iv`.`item_version_id`))) AND (`i`.`deleted` = 0)) ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `map_mode_link`
--
DROP TABLE IF EXISTS `map_mode_link`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `map_mode_link`  AS SELECT `maps`.`map_id` AS `map_id`, `maps`.`user_id` AS `user_id`, `maps`.`paper_id` AS `paper_id`, `maps`.`name` AS `name`, `maps`.`created_at` AS `created_at`, `maps`.`updated_at` AS `updated_at`, `maps`.`deleted` AS `deleted`, `t1`.`name` AS `mode_name`, `t1`.`mode_id` AS `mode_id` FROM (`maps` join (select `map_mode_links`.`map_id` AS `map_id`,`modes`.`name` AS `name`,`modes`.`mode_id` AS `mode_id` from (`map_mode_links` join `modes` on((`map_mode_links`.`mode_id` = `modes`.`mode_id`)))) `t1` on((`maps`.`map_id` = `t1`.`map_id`))) ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `node_allchange_view`
--
DROP TABLE IF EXISTS `node_allchange_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `node_allchange_view`  AS SELECT `u`.`user_id` AS `user_id`, `m`.`map_id` AS `map_id`, `n`.`node_id` AS `node_id`, `nv`.`node_version_id` AS `node_version_id`, `nh`.`node_history_id` AS `node_history_id`, `nh`.`content` AS `content`, `nh`.`appeared_at` AS `appeared_at`, `nh`.`disappeared_at` AS `disappeared_at`, `nh`.`concept_id` AS `concept_id`, `nh`.`parent_id` AS `parent_id`, `nt`.`node_type_id` AS `node_type_id`, `nt`.`type` AS `type`, `nt`.`class` AS `class` FROM ((((((`users` `u` join `maps` `m` on((`u`.`user_id` = `m`.`user_id`))) join `map_node_links` `mnl` on((`m`.`map_id` = `mnl`.`map_id`))) join `nodes` `n` on((`mnl`.`node_id` = `n`.`node_id`))) join `node_versions` `nv` on((`n`.`node_id` = `nv`.`node_id`))) join `node_histories` `nh` on((`nv`.`node_version_id` = `nh`.`node_version_id`))) join `node_types` `nt` on((`nh`.`node_type_id` = `nt`.`node_type_id`))) WHERE (`n`.`deleted` = 1) ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `node_latest`
--
DROP TABLE IF EXISTS `node_latest`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `node_latest`  AS SELECT `nodes`.`node_id` AS `node_id`, `node_histories`.`node_version_id` AS `node_version_id`, `node_histories`.`node_history_id` AS `node_history_id`, `node_histories`.`parent_id` AS `parent_id`, `node_types`.`node_type_id` AS `node_type_id`, `node_types`.`class` AS `class`, `node_types`.`type` AS `type`, `node_histories`.`content` AS `content`, `node_histories`.`concept_id` AS `concept_id`, `node_histories`.`x` AS `x`, `node_histories`.`y` AS `y`, `node_histories`.`appeared_at` AS `appeared_at` FROM (((`nodes` join `node_versions` on((`node_versions`.`node_id` = `nodes`.`node_id`))) join `node_histories` on((`node_histories`.`node_version_id` = `node_versions`.`node_version_id`))) join `node_types` on((`node_histories`.`node_type_id` = `node_types`.`node_type_id`))) WHERE ((`node_versions`.`appeared_at` = (select max(`node_versions`.`appeared_at`) from `node_versions` where ((`node_versions`.`node_id` = `nodes`.`node_id`) AND (`nodes`.`deleted` = 0)))) AND (`node_histories`.`appeared_at` = (select max(`node_histories`.`appeared_at`) from `node_histories` where (`node_histories`.`node_version_id` = `node_versions`.`node_version_id`)))) ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `object_nodes_summary`
--
DROP TABLE IF EXISTS `object_nodes_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `object_nodes_summary`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`name` AS `name`, count(`onode`.`object_node_id`) AS `total_active_objects`, sum((case when (`onode`.`status` = 'inProgress') then 1 else 0 end)) AS `inProgress`, sum((case when (`onode`.`status` = 'paused') then 1 else 0 end)) AS `paused`, sum((case when (`onode`.`status` = 'completed') then 1 else 0 end)) AS `completed`, sum((case when ((`onode`.`purpose` is not null) and (`onode`.`purpose` <> '')) then 1 else 0 end)) AS `with_purpose`, sum((case when ((`onode`.`evaluation_good` is not null) and (`onode`.`evaluation_good` <> '')) then 1 else 0 end)) AS `with_eval_good`, sum((case when ((`onode`.`evaluation_bad` is not null) and (`onode`.`evaluation_bad` <> '')) then 1 else 0 end)) AS `with_eval_bad`, sum((case when ((`onode`.`attribution` is not null) and (`onode`.`attribution` <> '')) then 1 else 0 end)) AS `with_attribution`, sum((case when ((`onode`.`attribution_bad` is not null) and (`onode`.`attribution_bad` <> '')) then 1 else 0 end)) AS `with_attr_bad`, round(((sum((case when (`onode`.`status` = 'completed') then 1 else 0 end)) / count(`onode`.`object_node_id`)) * 100),1) AS `completion_rate` FROM ((`users` `u` join `nodes` `n` on((`u`.`user_id` = `n`.`user_id`))) join `object_nodes` `onode` on((`n`.`node_id` = `onode`.`node_id`))) WHERE ((`n`.`deleted` = 0) AND (`onode`.`deleted` = 0)) GROUP BY `u`.`user_id`, `u`.`name` ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `paragraph_content_latest`
--
DROP TABLE IF EXISTS `paragraph_content_latest`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `paragraph_content_latest`  AS SELECT `pc`.`paragraph_content_id` AS `paragraph_content_id`, `pcv`.`paragraph_content_version_id` AS `paragraph_content_version_id`, `ph`.`paragraph_content_history_id` AS `paragraph_content_history_id`, `pcv`.`paragraph_content_par_id` AS `paragraph_content_par_id`, `pcv`.`paragraph_content_bro_id` AS `paragraph_content_bro_id`, `pcv`.`node_id` AS `node_id`, `pcv`.`concept_id` AS `concept_id`, `pcv`.`content` AS `content`, `pcv`.`node_type_id` AS `node_type_id`, `pcv`.`appeared_at` AS `appeared_at` FROM ((`paragraph_contents` `pc` join `paragraph_content_versions` `pcv` on((`pc`.`paragraph_content_id` = `pcv`.`paragraph_content_id`))) join `paragraph_content_histories` `ph` on((`pcv`.`paragraph_content_version_id` = `ph`.`paragraph_content_version_id`))) ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `paragraph_latest`
--
DROP TABLE IF EXISTS `paragraph_latest`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `paragraph_latest`  AS SELECT `p`.`paragraph_id` AS `paragraph_id`, `pv`.`paragraph_version_id` AS `paragraph_version_id`, `ph`.`paragraph_history_id` AS `paragraph_history_id`, `pv`.`paragraph_bro_id` AS `paragraph_bro_id`, `pv`.`title` AS `title`, `pv`.`content` AS `content`, `pv`.`appeared_at` AS `appeared_at` FROM ((`paragraphes` `p` join `paragraph_versions` `pv` on((`p`.`paragraph_id` = `pv`.`paragraph_id`))) join `paragraph_histories` `ph` on((`pv`.`paragraph_version_id` = `ph`.`paragraph_version_id`))) ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `section_latest`
--
DROP TABLE IF EXISTS `section_latest`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `section_latest`  AS SELECT `s`.`section_id` AS `section_id`, `sv`.`section_bro_id` AS `section_bro_id`, `sv`.`title` AS `title`, `sv`.`appeared_at` AS `appeared_at` FROM ((`sections` `s` join `section_versions` `sv` on((`s`.`section_id` = `sv`.`section_id`))) join `section_histories` `sh` on((`sv`.`section_version_id` = `sh`.`section_version_id`))) ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `trigger_candidates`
--
DROP TABLE IF EXISTS `trigger_candidates`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `trigger_candidates`  AS SELECT `nv`.`node_version_id` AS `activity_id`, '自己内対話' AS `activity_type`, (select `map_node_links`.`map_id` from `map_node_links` where (`map_node_links`.`node_id` = `nv`.`node_id`)) AS `map_id`, `nv`.`node_id` AS `node_id`, `nv`.`content` AS `content`, (select `latest_nv`.`concept_id` from `node_versions` `latest_nv` where (`latest_nv`.`node_id` = `nv`.`node_id`) order by `latest_nv`.`appeared_at` desc limit 1) AS `concept_id`, `nv`.`appeared_at` AS `appeared_at`, `nv`.`disappeared_at` AS `disappeared_at`, (case when exists(select 1 from `triggers` `t` where (`t`.`activity_id` = `nv`.`node_version_id`)) then 1 else 0 end) AS `trigger_on` FROM `node_versions` AS `nv` WHERE (not((`nv`.`concept_id` like ''))) ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `user_final_lesson_summary`
--
DROP TABLE IF EXISTS `user_final_lesson_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `user_final_lesson_summary`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`name` AS `name`, count(distinct `oll`.`object_le_id`) AS `node_lesson_count`, count(distinct `ojll`.`object_journal_lesson-learned_id`) AS `journal_lesson_count` FROM (((((((`users` `u` left join `nodes` `n` on(((`u`.`user_id` = `n`.`user_id`) and (`n`.`deleted` = 0)))) left join `object_nodes` `onode` on(((`n`.`node_id` = `onode`.`node_id`) and (`onode`.`deleted` = 0)))) left join `object_lesson-learneds` `oll` on(((`onode`.`object_node_id` = `oll`.`object_node_id`) and (`oll`.`deleted` = 0)))) left join `maps` `m` on(((`u`.`user_id` = `m`.`user_id`) and (`m`.`deleted` = 0)))) left join `object_journals` `oj` on(((`m`.`map_id` = `oj`.`map_id`) and (`oj`.`delete` = 0)))) left join `object_journal_reflections` `ojr` on(((`oj`.`object_journal_id` = `ojr`.`object_journal_id`) and (`ojr`.`deleted` = 0)))) left join `object_journal_lesson-learneds` `ojll` on(((`ojr`.`object_journal_reflection_id` = `ojll`.`object_journal_reflection_id`) and (`ojll`.`deleted` = 0)))) GROUP BY `u`.`user_id`, `u`.`name` ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `user_journal_node_summary`
--
DROP TABLE IF EXISTS `user_journal_node_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `user_journal_node_summary`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`name` AS `name`, count(distinct `n`.`node_id`) AS `total_node_count`, count(distinct `ojn`.`object_journal_id`) AS `total_journal_count` FROM ((`users` `u` left join `nodes` `n` on(((`u`.`user_id` = `n`.`user_id`) and (`n`.`deleted` = 0)))) left join `object_journal_nodes` `ojn` on(((`n`.`node_id` = `ojn`.`node_id`) and (`ojn`.`deleted` = '0')))) GROUP BY `u`.`user_id`, `u`.`name` ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `user_journal_record_summary`
--
DROP TABLE IF EXISTS `user_journal_record_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `user_journal_record_summary`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`name` AS `name`, count(distinct `oj`.`object_journal_id`) AS `journal_count`, count(distinct `ojn`.`object_journal_node_id`) AS `journal_node_count` FROM (((`users` `u` left join `maps` `m` on(((`u`.`user_id` = `m`.`user_id`) and (`m`.`deleted` = 0)))) left join `object_journals` `oj` on(((`m`.`map_id` = `oj`.`map_id`) and (`oj`.`delete` = 0)))) left join `object_journal_nodes` `ojn` on(((`oj`.`object_journal_id` = `ojn`.`object_journal_id`) and (`ojn`.`deleted` = '0')))) GROUP BY `u`.`user_id`, `u`.`name` ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `user_lesson_learned_summary`
--
DROP TABLE IF EXISTS `user_lesson_learned_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `user_lesson_learned_summary`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`name` AS `name`, count(distinct `oll`.`object_le_id`) AS `node_lesson_count`, count(distinct `ojll`.`object_journal_lesson-learned_id`) AS `journal_lesson_count` FROM (((((`users` `u` left join `nodes` `n` on(((`u`.`user_id` = `n`.`user_id`) and (`n`.`deleted` = 0)))) left join `object_nodes` `onode` on(((`n`.`node_id` = `onode`.`node_id`) and (`onode`.`deleted` = 0)))) left join `object_lesson-learneds` `oll` on((((convert(`onode`.`object_node_id` using utf8mb4) collate utf8mb4_unicode_ci) = `oll`.`object_node_id`) and (`oll`.`deleted` = 0)))) left join `object_journal_nodes` `ojn` on(((`n`.`node_id` = `ojn`.`node_id`) and (`ojn`.`deleted` = '0')))) left join `object_journal_lesson-learneds` `ojll` on(((`ojn`.`object_journal_id` = (`ojll`.`object_journal_reflection_id` collate utf8mb4_general_ci)) and (`ojll`.`deleted` = 0)))) GROUP BY `u`.`user_id`, `u`.`name` ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `view_changed_content_vs_latest`
--
DROP TABLE IF EXISTS `view_changed_content_vs_latest`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_changed_content_vs_latest`  AS SELECT `nv`.`node_id` AS `node_id`, `nv`.`node_version_id` AS `latest_node_version_id`, `nv`.`content` AS `version_content`, `nh`.`node_version_id` AS `history_node_version_id`, `nh`.`content` AS `history_content`, `nh`.`appeared_at` AS `updated_at` FROM (`node_versions` `nv` join `node_histories` `nh` on((`nh`.`node_version_id` = `nv`.`node_version_id`))) WHERE ((`nv`.`appeared_at` = (select max(`v2`.`appeared_at`) from `node_versions` `v2` where (`v2`.`parent_id` = `nv`.`parent_id`))) AND (`nh`.`content` <> `nv`.`content`)) ;

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `chapters`
--
ALTER TABLE `chapters`
  ADD PRIMARY KEY (`chapter_id`),
  ADD KEY `map_cha_id` (`map_id`);

--
-- テーブルのインデックス `chapter_histories`
--
ALTER TABLE `chapter_histories`
  ADD PRIMARY KEY (`chapter_history_id`),
  ADD KEY `chaver_chahis_id` (`chapter_version_id`),
  ADD KEY `cha_chahis_bro_id` (`chapter_bro_id`);

--
-- テーブルのインデックス `chapter_versions`
--
ALTER TABLE `chapter_versions`
  ADD PRIMARY KEY (`chapter_version_id`),
  ADD KEY `cha_chaver_id` (`chapter_id`),
  ADD KEY `mapver_chaver_id` (`map_version_id`),
  ADD KEY `cha_chaver_bro_id` (`chapter_bro_id`);

--
-- テーブルのインデックス `combined_contents`
--
ALTER TABLE `combined_contents`
  ADD PRIMARY KEY (`combined_contents_id`);

--
-- テーブルのインデックス `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`comment_id`);

--
-- テーブルのインデックス `comment_annotations`
--
ALTER TABLE `comment_annotations`
  ADD PRIMARY KEY (`annotation_id`),
  ADD KEY `com_anncom_id` (`comment_id`);

--
-- テーブルのインデックス `comment_destinations`
--
ALTER TABLE `comment_destinations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `com_comdes_id` (`comment_id`);

--
-- テーブルのインデックス `discussion_history`
--
ALTER TABLE `discussion_history`
  ADD PRIMARY KEY (`discussion_history_id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `discussion_participants`
--
ALTER TABLE `discussion_participants`
  ADD PRIMARY KEY (`discussion_id`,`user_id`);

--
-- テーブルのインデックス `discussion_sessions`
--
ALTER TABLE `discussion_sessions`
  ADD PRIMARY KEY (`discussion_id`);

--
-- テーブルのインデックス `discussion_utterances`
--
ALTER TABLE `discussion_utterances`
  ADD PRIMARY KEY (`utterance_id`);

--
-- テーブルのインデックス `document_titles`
--
ALTER TABLE `document_titles`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `map_dtmap_id` (`map_id`);

--
-- テーブルのインデックス `experience_knowledges`
--
ALTER TABLE `experience_knowledges`
  ADD PRIMARY KEY (`experience_knowledge_id`);

--
-- テーブルのインデックス `externalized_contents`
--
ALTER TABLE `externalized_contents`
  ADD PRIMARY KEY (`externalized_contents_id`);

--
-- テーブルのインデックス `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `nodehis_feed_id` (`node_history_id`);

--
-- テーブルのインデックス `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`image_id`);

--
-- テーブルのインデックス `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `item_map_id` (`map_id`);

--
-- テーブルのインデックス `item_contents`
--
ALTER TABLE `item_contents`
  ADD PRIMARY KEY (`item_content_id`),
  ADD KEY `item_itcon_id` (`item_id`);

--
-- テーブルのインデックス `item_content_histories`
--
ALTER TABLE `item_content_histories`
  ADD PRIMARY KEY (`item_content_history_id`),
  ADD KEY `itconver_itconhis_id` (`item_content_version_id`);

--
-- テーブルのインデックス `item_content_relations`
--
ALTER TABLE `item_content_relations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `itcon_itconre_id1` (`item_content1_id`),
  ADD KEY `itcon_itconre_id2` (`item_content2_id`),
  ADD KEY `node_itconnore_id1` (`node1_id`),
  ADD KEY `node_itconnore_id2` (`node2_id`);

--
-- テーブルのインデックス `item_content_versions`
--
ALTER TABLE `item_content_versions`
  ADD PRIMARY KEY (`item_content_version_id`),
  ADD KEY `node_itcon_id` (`node_id`) USING BTREE,
  ADD KEY `itver_itcon_id` (`item_content_id`);

--
-- テーブルのインデックス `item_histories`
--
ALTER TABLE `item_histories`
  ADD PRIMARY KEY (`item_history_id`),
  ADD KEY `iver_ithis_id` (`item_version_id`),
  ADD KEY `node_ithis_id` (`node_id`);

--
-- テーブルのインデックス `item_relations`
--
ALTER TABLE `item_relations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_itre_id1` (`item1_id`),
  ADD KEY `item_itre_id2` (`item2_id`);

--
-- テーブルのインデックス `item_versions`
--
ALTER TABLE `item_versions`
  ADD PRIMARY KEY (`item_version_id`),
  ADD KEY `item_itver_id` (`item_id`);

--
-- テーブルのインデックス `kgroup_user_link`
--
ALTER TABLE `kgroup_user_link`
  ADD PRIMARY KEY (`id`),
  ADD KEY `knogrouseli_user_id` (`user_id`),
  ADD KEY `knogrogroli_gro_id` (`group_id`);

--
-- テーブルのインデックス `knowledge_explorer`
--
ALTER TABLE `knowledge_explorer`
  ADD PRIMARY KEY (`knowledge_node_id`);

--
-- テーブルのインデックス `knowledge_explorer_fragment_links`
--
ALTER TABLE `knowledge_explorer_fragment_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_knowledge_fragment` (`knowledge_node_id`,`fragment_source_type`,`fragment_source_id`),
  ADD KEY `idx_knowledge_node_id` (`knowledge_node_id`),
  ADD KEY `idx_fragment_lookup` (`fragment_source_type`,`fragment_source_id`);

--
-- テーブルのインデックス `knowledge_fragment`
--
ALTER TABLE `knowledge_fragment`
  ADD PRIMARY KEY (`knowledge_fragment_id`);

--
-- テーブルのインデックス `knowledge_fragment_positions`
--
ALTER TABLE `knowledge_fragment_positions`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `knowledge_groups`
--
ALTER TABLE `knowledge_groups`
  ADD PRIMARY KEY (`group_id`),
  ADD KEY `gro_use_id` (`creater`);

--
-- テーブルのインデックス `maps`
--
ALTER TABLE `maps`
  ADD PRIMARY KEY (`map_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `pap_map_id` (`paper_id`);

--
-- テーブルのインデックス `map_mode_links`
--
ALTER TABLE `map_mode_links`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mode_maplimo_id` (`mode_id`),
  ADD KEY `map_maplimo_id` (`map_id`);

--
-- テーブルのインデックス `map_node_links`
--
ALTER TABLE `map_node_links`
  ADD PRIMARY KEY (`id`),
  ADD KEY `map_id` (`map_id`) USING BTREE,
  ADD KEY `node_id` (`node_id`) USING BTREE;

--
-- テーブルのインデックス `map_versions`
--
ALTER TABLE `map_versions`
  ADD PRIMARY KEY (`map_version_id`),
  ADD KEY `map_id` (`map_id`) USING BTREE;

--
-- テーブルのインデックス `map_version_reasons`
--
ALTER TABLE `map_version_reasons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `map_version_id` (`map_version_id`);

--
-- テーブルのインデックス `modes`
--
ALTER TABLE `modes`
  ADD PRIMARY KEY (`mode_id`);

--
-- テーブルのインデックス `mt_timing`
--
ALTER TABLE `mt_timing`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_mtt_id` (`user_id`);

--
-- テーブルのインデックス `network_edges`
--
ALTER TABLE `network_edges`
  ADD PRIMARY KEY (`network_edge_id`),
  ADD KEY `netno_netedst_id` (`edge_start`),
  ADD KEY `netno_neteden_id` (`edge_end`);

--
-- テーブルのインデックス `network_maps`
--
ALTER TABLE `network_maps`
  ADD PRIMARY KEY (`network_map_id`),
  ADD KEY `map_netmap_id` (`map_id`);

--
-- テーブルのインデックス `network_mindmap_connects`
--
ALTER TABLE `network_mindmap_connects`
  ADD PRIMARY KEY (`network_node_id`),
  ADD KEY `node_netnode_id` (`mindmap_node_id`);

--
-- テーブルのインデックス `network_nodes`
--
ALTER TABLE `network_nodes`
  ADD PRIMARY KEY (`network_node_id`),
  ADD KEY `netmap_netnomap_id` (`network_map_id`);

--
-- テーブルのインデックス `network_ontology_connects`
--
ALTER TABLE `network_ontology_connects`
  ADD PRIMARY KEY (`network_node_id`);

--
-- テーブルのインデックス `network_recruits`
--
ALTER TABLE `network_recruits`
  ADD PRIMARY KEY (`network_node_id`);

--
-- テーブルのインデックス `network_texts`
--
ALTER TABLE `network_texts`
  ADD PRIMARY KEY (`network_text_id`),
  ADD KEY `netmap_nettexmap_id` (`network_map_id`);

--
-- テーブルのインデックス `nodes`
--
ALTER TABLE `nodes`
  ADD PRIMARY KEY (`node_id`),
  ADD KEY `node_user_id` (`user_id`),
  ADD KEY `type_node_id` (`node_type_id`);

--
-- テーブルのインデックス `node_actions`
--
ALTER TABLE `node_actions`
  ADD PRIMARY KEY (`node_action_id`),
  ADD KEY `nhis_nact_id` (`node_history_id`);

--
-- テーブルのインデックス `node_histories`
--
ALTER TABLE `node_histories`
  ADD PRIMARY KEY (`node_history_id`),
  ADD KEY `nhis_type_id` (`node_type_id`),
  ADD KEY `nver_nhis_id` (`node_version_id`);

--
-- テーブルのインデックス `node_types`
--
ALTER TABLE `node_types`
  ADD PRIMARY KEY (`node_type_id`);

--
-- テーブルのインデックス `node_versions`
--
ALTER TABLE `node_versions`
  ADD PRIMARY KEY (`node_version_id`),
  ADD KEY `type_nver_id` (`node_type_id`),
  ADD KEY `node_nver_id` (`node_id`);

--
-- テーブルのインデックス `object_activities`
--
ALTER TABLE `object_activities`
  ADD PRIMARY KEY (`object_activity_id`);

--
-- テーブルのインデックス `object_edges`
--
ALTER TABLE `object_edges`
  ADD PRIMARY KEY (`object_edge_id`);

--
-- テーブルのインデックス `object_edge_histories`
--
ALTER TABLE `object_edge_histories`
  ADD PRIMARY KEY (`object_edge_history_id`),
  ADD KEY `idx_object_edge_id` (`object_edge_id`);

--
-- テーブルのインデックス `object_journals`
--
ALTER TABLE `object_journals`
  ADD PRIMARY KEY (`object_journal_id`);

--
-- テーブルのインデックス `object_journal_history_records`
--
ALTER TABLE `object_journal_history_records`
  ADD PRIMARY KEY (`journal_history_id`);

--
-- テーブルのインデックス `object_journal_lesson-learneds`
--
ALTER TABLE `object_journal_lesson-learneds`
  ADD PRIMARY KEY (`object_journal_lesson-learned_id`);

--
-- テーブルのインデックス `object_journal_nodes`
--
ALTER TABLE `object_journal_nodes`
  ADD PRIMARY KEY (`object_journal_node_id`);

--
-- テーブルのインデックス `object_journal_reflections`
--
ALTER TABLE `object_journal_reflections`
  ADD PRIMARY KEY (`object_journal_reflection_id`);

--
-- テーブルのインデックス `object_lesson-learneds`
--
ALTER TABLE `object_lesson-learneds`
  ADD PRIMARY KEY (`object_le_id`);

--
-- テーブルのインデックス `object_nodes`
--
ALTER TABLE `object_nodes`
  ADD PRIMARY KEY (`object_node_id`);

--
-- テーブルのインデックス `object_nodes_histories`
--
ALTER TABLE `object_nodes_histories`
  ADD PRIMARY KEY (`object_node_history_id`);

--
-- テーブルのインデックス `object_reflection_records`
--
ALTER TABLE `object_reflection_records`
  ADD PRIMARY KEY (`reflection_id`);

--
-- テーブルのインデックス `papers`
--
ALTER TABLE `papers`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `paper_annotations`
--
ALTER TABLE `paper_annotations`
  ADD PRIMARY KEY (`annotation_id`),
  ADD KEY `node_annnode_id` (`node_id`);

--
-- テーブルのインデックス `paragraphes`
--
ALTER TABLE `paragraphes`
  ADD PRIMARY KEY (`paragraph_id`),
  ADD KEY `sec_par_id` (`section_id`);

--
-- テーブルのインデックス `paragraph_contents`
--
ALTER TABLE `paragraph_contents`
  ADD PRIMARY KEY (`paragraph_content_id`),
  ADD KEY `par_parcon_id` (`paragraph_id`);

--
-- テーブルのインデックス `paragraph_content_histories`
--
ALTER TABLE `paragraph_content_histories`
  ADD PRIMARY KEY (`paragraph_content_history_id`),
  ADD KEY `type_parconhis_id` (`node_type_id`),
  ADD KEY `parcon_parconhis_bro_id` (`paragraph_content_bro_id`),
  ADD KEY `parcon_parconhis_par_id` (`paragraph_content_par_id`),
  ADD KEY `parconver_parconhis_id` (`paragraph_content_version_id`),
  ADD KEY `node_parconhis_id` (`node_id`);

--
-- テーブルのインデックス `paragraph_content_versions`
--
ALTER TABLE `paragraph_content_versions`
  ADD PRIMARY KEY (`paragraph_content_version_id`),
  ADD KEY `parver_parconver_id` (`paragraph_version_id`),
  ADD KEY `parcon_parconver_id` (`paragraph_content_id`),
  ADD KEY `type_parconver_id` (`node_type_id`),
  ADD KEY `parcon_parconver_par_id` (`paragraph_content_par_id`),
  ADD KEY `parcon_parconver_bro_id` (`paragraph_content_bro_id`),
  ADD KEY `node_parconver_id` (`node_id`);

--
-- テーブルのインデックス `paragraph_histories`
--
ALTER TABLE `paragraph_histories`
  ADD PRIMARY KEY (`paragraph_history_id`),
  ADD KEY `parver_parhis_id` (`paragraph_version_id`),
  ADD KEY `par_parhis_bro_id` (`paragraph_bro_id`);

--
-- テーブルのインデックス `paragraph_versions`
--
ALTER TABLE `paragraph_versions`
  ADD PRIMARY KEY (`paragraph_version_id`),
  ADD KEY `par_parver_id` (`paragraph_id`),
  ADD KEY `secver_parver_id` (`section_version_id`),
  ADD KEY `par_parver_bro_id` (`paragraph_bro_id`);

--
-- テーブルのインデックス `process_edges`
--
ALTER TABLE `process_edges`
  ADD PRIMARY KEY (`process_edge_id`);

--
-- テーブルのインデックス `process_nodes`
--
ALTER TABLE `process_nodes`
  ADD PRIMARY KEY (`process_node_id`),
  ADD KEY `node_pno_id` (`node_id`);

--
-- テーブルのインデックス `rationality_nodes`
--
ALTER TABLE `rationality_nodes`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `scenario_titles`
--
ALTER TABLE `scenario_titles`
  ADD PRIMARY KEY (`scenario_id`),
  ADD KEY `map_stmap_id` (`map_id`);

--
-- テーブルのインデックス `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`section_id`),
  ADD KEY `cha_sec_id` (`chapter_id`);

--
-- テーブルのインデックス `section_histories`
--
ALTER TABLE `section_histories`
  ADD PRIMARY KEY (`section_history_id`),
  ADD KEY `secver_sechis_id` (`section_version_id`),
  ADD KEY `sec_sechis_bro_id` (`section_bro_id`);

--
-- テーブルのインデックス `section_versions`
--
ALTER TABLE `section_versions`
  ADD PRIMARY KEY (`section_version_id`),
  ADD KEY `sec_secver_id` (`section_id`),
  ADD KEY `chaver_secver_id` (`chapter_version_id`),
  ADD KEY `sec_secver_bro_id` (`section_bro_id`);

--
-- テーブルのインデックス `shared_nodes`
--
ALTER TABLE `shared_nodes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shere_gro_id` (`knowledge_group_id`),
  ADD KEY `share_excon_id` (`experience_knowledge_id`);

--
-- テーブルのインデックス `triggers`
--
ALTER TABLE `triggers`
  ADD PRIMARY KEY (`trigger_id`),
  ADD KEY `node_tri_f_id` (`node_version_from`),
  ADD KEY `node_tri_t_id` (`node_version_to`);

--
-- テーブルのインデックス `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `users_sso_sub_unique` (`sso_sub`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `knowledge_fragment_positions`
--
ALTER TABLE `knowledge_fragment_positions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `chapters`
--
ALTER TABLE `chapters`
  ADD CONSTRAINT `map_cha_id` FOREIGN KEY (`map_id`) REFERENCES `maps` (`map_id`);

--
-- テーブルの制約 `chapter_histories`
--
ALTER TABLE `chapter_histories`
  ADD CONSTRAINT `cha_chahis_bro_id` FOREIGN KEY (`chapter_bro_id`) REFERENCES `chapters` (`chapter_id`),
  ADD CONSTRAINT `chaver_chahis_id` FOREIGN KEY (`chapter_version_id`) REFERENCES `chapter_versions` (`chapter_version_id`);

--
-- テーブルの制約 `chapter_versions`
--
ALTER TABLE `chapter_versions`
  ADD CONSTRAINT `cha_chaver_bro_id` FOREIGN KEY (`chapter_bro_id`) REFERENCES `chapters` (`chapter_id`),
  ADD CONSTRAINT `cha_chaver_id` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`chapter_id`),
  ADD CONSTRAINT `mapver_chaver_id` FOREIGN KEY (`map_version_id`) REFERENCES `map_versions` (`map_version_id`);

--
-- テーブルの制約 `comment_annotations`
--
ALTER TABLE `comment_annotations`
  ADD CONSTRAINT `com_anncom_id` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`comment_id`);

--
-- テーブルの制約 `comment_destinations`
--
ALTER TABLE `comment_destinations`
  ADD CONSTRAINT `com_comdes_id` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`comment_id`);

--
-- テーブルの制約 `document_titles`
--
ALTER TABLE `document_titles`
  ADD CONSTRAINT `map_dtmap_id` FOREIGN KEY (`map_id`) REFERENCES `maps` (`map_id`);

--
-- テーブルの制約 `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD CONSTRAINT `nodehis_feed_id` FOREIGN KEY (`node_history_id`) REFERENCES `node_histories` (`node_history_id`);

--
-- テーブルの制約 `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `item_map_id` FOREIGN KEY (`map_id`) REFERENCES `maps` (`map_id`);

--
-- テーブルの制約 `item_contents`
--
ALTER TABLE `item_contents`
  ADD CONSTRAINT `item_itcon_id` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`);

--
-- テーブルの制約 `item_content_histories`
--
ALTER TABLE `item_content_histories`
  ADD CONSTRAINT `itconver_itconhis_id` FOREIGN KEY (`item_content_version_id`) REFERENCES `item_content_versions` (`item_content_version_id`);

--
-- テーブルの制約 `item_content_relations`
--
ALTER TABLE `item_content_relations`
  ADD CONSTRAINT `itcon_itconre_id1` FOREIGN KEY (`item_content1_id`) REFERENCES `item_contents` (`item_content_id`),
  ADD CONSTRAINT `itcon_itconre_id2` FOREIGN KEY (`item_content2_id`) REFERENCES `item_contents` (`item_content_id`);

--
-- テーブルの制約 `item_content_versions`
--
ALTER TABLE `item_content_versions`
  ADD CONSTRAINT `itver_itcon_id` FOREIGN KEY (`item_content_id`) REFERENCES `item_contents` (`item_content_id`);

--
-- テーブルの制約 `item_histories`
--
ALTER TABLE `item_histories`
  ADD CONSTRAINT `iver_ithis_id` FOREIGN KEY (`item_version_id`) REFERENCES `item_versions` (`item_version_id`);

--
-- テーブルの制約 `item_relations`
--
ALTER TABLE `item_relations`
  ADD CONSTRAINT `item_itre_id1` FOREIGN KEY (`item1_id`) REFERENCES `items` (`item_id`),
  ADD CONSTRAINT `item_itre_id2` FOREIGN KEY (`item2_id`) REFERENCES `items` (`item_id`);

--
-- テーブルの制約 `item_versions`
--
ALTER TABLE `item_versions`
  ADD CONSTRAINT `item_itver_id` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`);

--
-- テーブルの制約 `kgroup_user_link`
--
ALTER TABLE `kgroup_user_link`
  ADD CONSTRAINT `knogrogroli_gro_id` FOREIGN KEY (`group_id`) REFERENCES `knowledge_groups` (`group_id`),
  ADD CONSTRAINT `knogrouseli_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- テーブルの制約 `knowledge_groups`
--
ALTER TABLE `knowledge_groups`
  ADD CONSTRAINT `gro_use_id` FOREIGN KEY (`creater`) REFERENCES `users` (`user_id`);

--
-- テーブルの制約 `network_nodes`
--
ALTER TABLE `network_nodes`
  ADD CONSTRAINT `netmap_netnomap_id` FOREIGN KEY (`network_map_id`) REFERENCES `network_maps` (`network_map_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
