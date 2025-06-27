import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
  Logger,
} from '@nestjs/common';
import { TrackerService } from '../service';
import { TrackerEventDto, ITrackerEventResponse } from '../entities';

@Controller('events')
export class TrackerController {
  private readonly logger = new Logger(TrackerController.name);
  constructor(private readonly trackerService: TrackerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async trackBatchEvents(
    @Body() eventsDto: TrackerEventDto[],
  ): Promise<ITrackerEventResponse> {
    try {
      const results = await this.trackerService.createBatchEvents(eventsDto);

      return {
        success: true,
        message: `批量事件追踪成功，共处理 ${results.length} 条事件`,
        data: {
          processed_count: results.length,
          events: results.map((result) => ({
            event_id: result.event_id,
            user_id: result.user_id,
            session_id: result.session_id,
            event_time: result.event_time,
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
}
