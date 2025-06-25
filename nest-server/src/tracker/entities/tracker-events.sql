-- 创建 tracker_events 表
CREATE TABLE `tracker_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID (自增)',
  `event_id` varchar(100) NOT NULL COMMENT '事件ID',
  `event_time` timestamp NOT NULL COMMENT '事件发生时间',
  `user_id` varchar(100) NOT NULL COMMENT '用户ID',
  `session_id` varchar(100) NOT NULL COMMENT '会话ID',
  `device_fingerprint` text NOT NULL COMMENT '设备指纹',
  `properties` json NOT NULL COMMENT '事件属性 (JSON格式)',
  `sdk_version` varchar(20) NOT NULL COMMENT 'SDK版本',
  `app_id` varchar(50) NOT NULL COMMENT '应用ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_event_user` (`event_id`, `user_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_event_time` (`event_time`),
  KEY `idx_app_id` (`app_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户行为追踪事件表';

-- 创建索引的详细说明
-- idx_event_user: 用于按事件类型和用户查询
-- idx_session: 用于按会话查询用户行为序列
-- idx_event_time: 用于按时间范围查询
-- idx_app_id: 用于按应用查询
-- idx_user_id: 用于按用户查询所有事件 