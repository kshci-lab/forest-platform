CREATE TABLE IF NOT EXISTS `paper_reading_reflections` (
  `reflection_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `node_id` varchar(45) NOT NULL,
  `reflection_type` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`reflection_id`),
  UNIQUE KEY `uq_paper_reading_reflections_node` (`node_id`),
  CONSTRAINT `fk_paper_reading_reflections_node`
    FOREIGN KEY (`node_id`) REFERENCES `nodes` (`node_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
