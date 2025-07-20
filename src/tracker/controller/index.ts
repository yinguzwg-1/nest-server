import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
  Logger,
  Query,
  Get,
  ParseIntPipe,
} from '@nestjs/common';
import { TrackerService } from '../service';
import { TrackerEventDto, ITrackerEventResponse } from '../entities';

@Controller('events')
export class TrackerController {
  private readonly logger = new Logger(TrackerController.name);
  constructor(private readonly trackerService: TrackerService) {}

  @Post('single')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async trackSingleEvent(
    @Body() eventDto: TrackerEventDto,
  ): Promise<ITrackerEventResponse> {
    try {
      await this.trackerService.createEvent(eventDto);

      return {
        success: true,
        message: '单个事件追踪成功',
        data: {
          processed_count: 1,
          events: [{
            event_id: eventDto.event_id,
            user_id: eventDto.user_id,
            session_id: eventDto.session_id,
            event_time: eventDto.event_time,
          }],
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `单个事件追踪失败: ${error.message}`,
        data: null,
      };
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async trackBatchEvents(
    @Body() eventsDto: TrackerEventDto[],
  ): Promise<ITrackerEventResponse> {
    try {
      await this.trackerService.createBatchEvents(eventsDto);

      return {
        success: true,
        message: `批量事件追踪成功，共处理 ${eventsDto.length} 条事件`,
        data: {
          processed_count: eventsDto.length,
          events: eventsDto.map((event) => ({
            event_id: event.event_id,
            user_id: event.user_id,
            session_id: event.session_id,
            event_time: event.event_time,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `批量事件追踪失败: ${error.message}`,
        data: null,
      };
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getTrackerEvents(
    @Query('page') page: string,
  ): Promise<ITrackerEventResponse> {
    try {
      const result = await this.trackerService.getEvents();
      return {
        success: true,
        message: `获取用户事件成功，共 ${result.total} 条记录`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `获取用户事件失败: ${error.message}`,
        data: null,
      };
    }
  }
}
