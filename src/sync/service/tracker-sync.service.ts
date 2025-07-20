import { Injectable, OnModuleInit } from "@nestjs/common";
import { RedisService } from "../../redis/service";
import { TrackerService } from "../../tracker/service";
import { Job } from "bull";

@Injectable()
export class TrackerSyncService implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly trackerService: TrackerService
  ) {}
  
  private readonly BATCH_SIZE = 10;
  private readonly SYNC_INTERVAL = 10000; // 10秒

  async onModuleInit() {
    this.startSyncJob();
  }

  private async startSyncJob() {
    setInterval(async () => {
      try {
        await this.syncBatch();
      } catch (error) {
        // 出错时终止整个同步过程
        process.exit(1);
      }  
    }, this.SYNC_INTERVAL);
  }

  private async syncBatch() {
    try {    
      const logStream = await this.redisService.getWaitingJobs(this.BATCH_SIZE);    
      if (logStream.length === 0) {
        return; // 没有数据需要处理
      }

      // 处理每个任务
      for (const job of logStream) {
        try {
          // 首先检查任务是否已经被处理过
          const alreadyProcessed = await this.redisService.isJobAlreadyProcessed(job.id);
          if (alreadyProcessed) {
            continue;
          }

          // 检查任务状态
          const canProcess = await this.redisService.canProcessJob(job);
          if (!canProcess) {
            continue;
          }

          const logData = JSON.parse(job.data);
          
          // 检查是否是 tracker 事件（通过 key 判断）
          if (job.name === 'tracker_event' || logData.event_id) {
            // 处理 tracker 事件
            await this.trackerService.processEventFromQueue(logData);
          }
          
          // 数据库插入成功后，安全地删除任务
          const completed = await this.redisService.safelyCompleteJob(job);
          if (completed) {
            await this.redisService.markJobAsProcessed(job.id);
          }
        } catch (error) {
          // 处理失败时安全地删除任务并记录到Redis
          try {
            const failed = await this.redisService.safelyFailJob(job, error);
            if (failed) {
              await this.redisService.markJobAsProcessed(job.id);
            }
          } catch (removeError) {
            console.error(`Error removing job ${job.id}:`, removeError);
          }
          throw error; // 重新抛出错误，终止整个同步过程
        }
      } 
    } catch (error) {
      console.error('Error in tracker syncBatch:', error);
      throw error; // 重新抛出错误，让上层处理
    }
  }
} 