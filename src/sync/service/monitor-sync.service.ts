import { Injectable, OnModuleInit } from "@nestjs/common";
import { RedisService } from "../../redis/service";
import { MonitorService } from "../../monitor/service";
import { EventsGateway } from "../../common/websocket";

@Injectable()
export class MonitorSyncService implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly monitorService: MonitorService,
    private readonly eventsGateway: EventsGateway
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
        console.error('Sync job error:', error);
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

      let processedCount = 0;
      let requestData = [];
      let errorData = [];

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
          
          // 根据数据类型处理不同的业务逻辑
          if (logData.event_id) {
            // 这是 tracker 事件，跳过（由 TrackerSyncService 处理）
            continue;
          } else {
            // 这是 monitor 事件
            if (logData.error) {
              errorData.push(logData);
            } else {
              requestData.push(logData);
            }
          }
          
          // 数据库插入成功后，安全地删除任务
          const completed = await this.redisService.safelyCompleteJob(job);
          if (completed) {
            await this.redisService.markJobAsProcessed(job.id);
            processedCount++;
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

      // 批量插入数据（不发送monitorUpdate通知，避免重复）
      if (requestData.length > 0) {
        await this.monitorService.batchLogRequestsSilent(requestData);
      }
      
      if (errorData.length > 0) {
        await this.monitorService.batchLogErrorsSilent(errorData);
      }

      // 只有当处理了数据时才发送通知
      if (processedCount > 0) {
        this.eventsGateway.server.emit('syncComplete', {
          type: 'syncComplete',
          processedCount,
          requestCount: requestData.length,
          errorCount: errorData.length,
          timestamp: new Date().toISOString()
        });
        
      }
    } catch (error) {
      throw error; // 重新抛出错误，让上层处理
    }
  }
} 