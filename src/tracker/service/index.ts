import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackerEvent, TrackerEventDto, UserEventsResponse, ModuleStats, DeviceStats } from '../entities';
import { RedisService } from '../../redis/service';

@Injectable()
export class TrackerService {
  constructor(
    @InjectRepository(TrackerEvent)
    private readonly trackerRepository: Repository<TrackerEvent>,
    private readonly redisService: RedisService,
  ) {}

  async createEvent(eventDto: TrackerEventDto): Promise<void> {
    try {
      // 将事件数据添加到 Redis 队列
      await this.redisService.addLogToStream('tracker_event', JSON.stringify(eventDto));
    } catch (error) {
      throw new Error(`添加事件到队列失败: ${error.message}`);
    }
  }

  async createBatchEvents(
    eventsDto: TrackerEventDto[],
  ): Promise<void> {
    try {
      // 批量将事件数据添加到 Redis 队列
      for (const eventDto of eventsDto) {
        await this.redisService.addLogToStream('tracker_event', JSON.stringify(eventDto));
      }
    } catch (error) {
      throw new Error(`批量添加事件到队列失败: ${error.message}`);
    }
  }

  async getEvents(
  ): Promise<UserEventsResponse> {
    // 获取用户的所有事件总数
    const total = await this.trackerRepository.count();
    // 获取分页的事件列表
    const events = await this.trackerRepository.find({
      order: { event_time: 'DESC' },
      
    });

    // 获取用户的所有事件用于统计
    const allUserEvents = await this.trackerRepository.find({
      order: { event_time: 'DESC' },
    });

    // 计算统计数据
    const stats = this.calculateUserStats(allUserEvents);
    return {
      events,
      total,
      hasMore: false,
      stats,
    };
  }

  private calculateUserStats(events: TrackerEvent[]): UserEventsResponse['stats'] {
    // 统计唯一会话
    const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean)).size;
    const uniqueUsers = new Set(events.map(e => e.user_id).filter(Boolean)).size;
    // 统计今日事件
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEvents = events.filter(e => {
      const eventDate = e.event_time || e.created_at;
      return eventDate >= today;
    }).length;

    // 按模块统计
    const moduleStatsMap = new Map<string, { name: string; id: string; count: number; routes: Set<string> }>();
    
    // 模块ID到英文名称的映射（用于统一显示）
    const moduleIdToNameMap: Record<string, string> = {
      'media': 'Media',
      'blog': 'Blog',
      'burrypoint': 'Data Analytics',
      'about': 'About',
      'monitoring': 'Performance Monitoring',
      'home': 'Home',
      'movies': 'Movies',
      'tvshows': 'TV Shows',
      'rankings': 'Rankings',
      'upload': 'Upload',
      'unknown': 'Unknown Module'
    };
    
    events.forEach(event => {
      const moduleName = event.properties?.module_name || 'Unknown Module';
      const moduleId = event.properties?.module_id || 'unknown';
      // 只使用 moduleId 作为唯一键，避免因语言不同导致的重复统计
      const key = moduleId;

      if (!moduleStatsMap.has(key)) {
        // 使用统一的英文名称作为显示名称
        const displayName = moduleIdToNameMap[moduleId] || moduleName;
        moduleStatsMap.set(key, {
          name: displayName,
          id: moduleId,
          count: 0,
          routes: new Set()
        });
      }

      const moduleStat = moduleStatsMap.get(key)!;
      moduleStat.count++;
      
      if (event.properties?.route) {
        moduleStat.routes.add(event.properties.route);
      }
    });

    const moduleStats: ModuleStats[] = Array.from(moduleStatsMap.values()).map(stat => ({
      name: stat.name,
      id: stat.id,
      count: stat.count,
      routes: Array.from(stat.routes)
    }));

    // 按设备类型统计
    const deviceStats: DeviceStats = {
      web: 0,
      mobile: 0,
      unknown: 0
    };

    events.forEach(event => {
      const userAgent = event.properties?.user_agent;
      if (!userAgent) {
        deviceStats.unknown++;
        return;
      }

      const mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'Windows Phone'];
      const isMobile = mobileKeywords.some(keyword => userAgent.includes(keyword));
      
      if (isMobile) {
        deviceStats.mobile++;
      } else {
        deviceStats.web++;
      }
    });

    return {
      totalEvents: events.length,
      uniqueSessions,
      todayEvents,
      moduleStats,
      deviceStats,
      uniqueUsers,
    };
  }

  async getEventsBySessionId(sessionId: string): Promise<TrackerEvent[]> {
    return this.trackerRepository.find({
      where: { session_id: sessionId },
      order: { event_time: 'ASC' },
    });
  }

  async getEventStats(timeRange: string = '24h'): Promise<any> {
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const stats = await this.trackerRepository
      .createQueryBuilder('event')
      .select([
        'event.event_id as event_id',
        'COUNT(*) as event_count',
        'COUNT(DISTINCT event.user_id) as unique_users',
        'COUNT(DISTINCT event.session_id) as unique_sessions',
      ])
      .where('event.event_time >= :startTime', { startTime })
      .groupBy('event.event_id')
      .orderBy('event_count', 'DESC')
      .getRawMany();

    return stats;
  }

  // 从 Redis 队列处理事件数据并保存到数据库
  async processEventFromQueue(eventData: any): Promise<void> {
    try {
      // 转换数据到 Entity
      const event = this.trackerRepository.create({
        ...eventData,
        event_time: new Date(eventData.event_time),
      });

      // 保存到数据库
      await this.trackerRepository.save(event);
   
    } catch (error) {
      throw new Error(`处理队列事件失败: ${error.message}`);
    }
  }
}
