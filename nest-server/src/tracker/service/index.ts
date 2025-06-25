import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackerEvent, TrackerEventDto } from '../entities';

@Injectable()
export class TrackerService {
  constructor(
    @InjectRepository(TrackerEvent)
    private readonly trackerRepository: Repository<TrackerEvent>,
  ) {}

  async createEvent(eventDto: TrackerEventDto): Promise<TrackerEvent> {
    try {
      // 转换 DTO 到 Entity
      const event = this.trackerRepository.create({
        ...eventDto,
        event_time: new Date(eventDto.event_time),
      });

      // 保存到数据库
      const savedEvent = await this.trackerRepository.save(event);
      
      return savedEvent;
    } catch (error) {
      throw new Error(`创建事件失败: ${error.message}`);
    }
  }

  async createBatchEvents(eventsDto: TrackerEventDto[]): Promise<TrackerEvent[]> {
    try {
      // 转换 DTO 到 Entity
      const events = eventsDto.map(eventDto => 
        this.trackerRepository.create({
          ...eventDto,
          event_time: new Date(eventDto.event_time),
        })
      );

      // 批量保存到数据库
      const savedEvents = await this.trackerRepository.save(events);
      
      return savedEvents;
    } catch (error) {
      throw new Error(`批量创建事件失败: ${error.message}`);
    }
  }

  async getEventsByUserId(userId: string, limit: number = 100): Promise<TrackerEvent[]> {
    return this.trackerRepository.find({
      where: { user_id: userId },
      order: { event_time: 'DESC' },
      take: limit,
    });
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
        'COUNT(DISTINCT event.session_id) as unique_sessions'
      ])
      .where('event.event_time >= :startTime', { startTime })
      .groupBy('event.event_id')
      .orderBy('event_count', 'DESC')
      .getRawMany();

    return stats;
  }
} 