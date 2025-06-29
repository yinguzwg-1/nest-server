-- ========================================
-- 用户行为追踪事件表 - 常用查询语句
-- ========================================

-- 1. 查询特定用户的所有事件
SELECT * FROM tracker_events 
WHERE user_id = '1234567890' 
ORDER BY event_time DESC 
LIMIT 100;

-- 2. 查询特定会话的所有事件
SELECT * FROM tracker_events 
WHERE session_id = 'ses_nn7ev19kmcbpp649' 
ORDER BY event_time ASC;

-- 3. 查询特定事件类型的统计
SELECT 
    event_id,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM tracker_events 
WHERE event_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY event_id
ORDER BY event_count DESC;

-- 4. 查询用户行为漏斗分析
SELECT 
    user_id,
    session_id,
    GROUP_CONCAT(event_id ORDER BY event_time ASC) as event_sequence,
    COUNT(*) as event_count,
    MIN(event_time) as session_start,
    MAX(event_time) as session_end
FROM tracker_events 
WHERE session_id IN (
    SELECT DISTINCT session_id 
    FROM tracker_events 
    WHERE event_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
)
GROUP BY user_id, session_id
ORDER BY session_start DESC;

-- 5. 查询页面访问统计
SELECT 
    JSON_EXTRACT(properties, '$.url') as page_url,
    COUNT(*) as page_views,
    COUNT(DISTINCT user_id) as unique_visitors,
    COUNT(DISTINCT session_id) as unique_sessions
FROM tracker_events 
WHERE event_id = 'crawl_click'
    AND event_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY JSON_EXTRACT(properties, '$.url')
ORDER BY page_views DESC;

-- 6. 查询设备信息统计
SELECT 
    JSON_EXTRACT(properties, '$.user_agent') as user_agent,
    JSON_EXTRACT(properties, '$.language') as language,
    COUNT(*) as count
FROM tracker_events 
WHERE event_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY 
    JSON_EXTRACT(properties, '$.user_agent'),
    JSON_EXTRACT(properties, '$.language')
ORDER BY count DESC
LIMIT 20;

-- 7. 查询应用使用情况
SELECT 
    app_id,
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    DATE(event_time) as event_date
FROM tracker_events 
WHERE event_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY app_id, DATE(event_time)
ORDER BY event_date DESC, total_events DESC;

-- 8. 查询实时活跃用户
SELECT 
    user_id,
    session_id,
    MAX(event_time) as last_activity,
    COUNT(*) as event_count
FROM tracker_events 
WHERE event_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY user_id, session_id
ORDER BY last_activity DESC;

-- 9. 查询错误事件统计
SELECT 
    event_id,
    COUNT(*) as error_count,
    COUNT(DISTINCT user_id) as affected_users
FROM tracker_events 
WHERE event_id LIKE '%error%' 
    OR event_id LIKE '%fail%'
    AND event_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY event_id
ORDER BY error_count DESC;

-- 10. 清理旧数据（保留30天）
DELETE FROM tracker_events 
WHERE event_time < DATE_SUB(NOW(), INTERVAL 30 DAY); 