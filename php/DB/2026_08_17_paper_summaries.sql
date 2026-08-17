CREATE TABLE IF NOT EXISTS `paper_summaries` (
  `map_id` int(11) NOT NULL,
  `rq` text NOT NULL,
  `e_1_strong` text NOT NULL,
  `e_1_weak` text NOT NULL,
  `e_2_strong` text NOT NULL,
  `e_2_weak` text NOT NULL,
  `e_3_strong` text NOT NULL,
  `e_3_weak` text NOT NULL,
  `summary` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`map_id`),
  CONSTRAINT `fk_paper_summaries_map`
    FOREIGN KEY (`map_id`) REFERENCES `maps` (`map_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

