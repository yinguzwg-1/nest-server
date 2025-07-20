import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue, Job } from "bull";
@Injectable()
export class RedisService {

  constructor(@InjectQueue('redis') private readonly redisQueue: Queue) { 
  
  }
  async addLogToStream(queueName: string, data: any) {
    await this.redisQueue.add(queueName, data, {
      attempts: 3, // 重试次数
      backoff: 3000, // 重试间隔
    })
  }
  async getLogFromStream(batchSize: number) {
    const jobs = await this.redisQueue.getJobs(['waiting'], 0, batchSize);
    return jobs;
  }

  // 获取等待中的任务
  async getWaitingJobs(batchSize: number) {
    try {
   
      if (!this.redisQueue || typeof this.redisQueue.getJobs !== 'function') {
        throw new Error('Redis queue is not properly initialized');
      }

      // 调试：查看 Redis 中的 Bull 队列结构
      const keys = await this.redisQueue.client.keys('bull:redis:*');

      // 正确的方式查看不同类型的数据
      for (const key of keys) {
        const type = await this.redisQueue.client.type(key);

        try {
          if (type === 'list') {
            await this.redisQueue.client.lrange(key, 0, -1);
          } else if (type === 'set') {
            await this.redisQueue.client.smembers(key);
          } else if (type === 'zset') {
            await this.redisQueue.client.zrange(key, 0, -1);
          } else if (type === 'hash') {
            await this.redisQueue.client.hgetall(key);
          }
        } catch (keyError) {
        }
      }

      // 获取队列统计信息
      const stats = await this.getQueueStats();

      // 只获取waiting状态的任务，从索引0开始，获取指定数量
      const jobs = await this.redisQueue.getJobs(['waiting'], 0, batchSize);
      return jobs;
    } catch (error) {
      console.error('Error in getWaitingJobs:', error);
      throw error;
    }
  }

  // 获取所有可处理的任务（waiting + active）
  async getProcessableJobs(batchSize: number) {
    const jobs = await this.redisQueue.getJobs(['waiting', 'active'], 0, batchSize);
    return jobs;
  }

  // 使用更精确的方式获取任务
  async getJobsByState(state: 'waiting' | 'active' | 'completed' | 'failed', batchSize: number) {
    const jobs = await this.redisQueue.getJobs([state], 0, batchSize);
    return jobs;
  }

  // 检查任务是否可以被处理
  async canProcessJob(job: Job): Promise<boolean> {
    try {
      const state = await job.getState();
      // 只有 waiting 状态的任务可以被处理
      return state === 'waiting';
    } catch (error) {
      return false; // 如果无法检查状态，假设不可处理
    }
  }

  // 使用任务ID作为唯一标识符来防止重复处理
  async isJobAlreadyProcessed(jobId: string | number): Promise<boolean> {
    try {
      // 使用Redis SET来记录已处理的任务ID
      const result = await this.redisQueue.client.sismember('processed_job_ids', jobId.toString());
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  // 标记任务为已处理
  async markJobAsProcessed(jobId: string | number): Promise<void> {
    try {
      await this.redisQueue.client.sadd('processed_job_ids', jobId.toString());
    } catch (error) {
      console.log(`Cannot mark job ${jobId} as processed:`, error.message);
    }
  }

  // 清理已处理任务的记录（可选）
  async cleanProcessedJobIds(): Promise<void> {
    try {
      await this.redisQueue.client.del('processed_job_ids');
    } catch (error) {
      console.log('Cannot clean processed job IDs:', error.message);
    }
  }



  // 安全地标记任务为完成
  async safelyCompleteJob(job: Job, result: any = 'done'): Promise<boolean> {
    try {
      const state = await job.getState();
      if (state === 'waiting' || state === 'active') {
        // 直接删除任务而不是改变状态
        await job.remove();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // 安全地标记任务为失败
  async safelyFailJob(job: Job, error: any): Promise<boolean> {
    try {
      const state = await job.getState();
      if (state === 'waiting' || state === 'active') {
        // 直接删除任务而不是改变状态
        await job.remove();
        return true;
      }
      return false;
    } catch (moveError) {
      return false;
    }
  }

  // 直接删除任务（不管状态）
  async removeJob(job: Job) {
    try {
      await job.remove();
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeLogFromStream(batchSize: number) {
    await this.redisQueue.clean(0, 'completed', batchSize);
  } 

  // 清理已完成任务的方法（保留最近的任务）
  async cleanCompletedJobs(keepCount: number = 100) {
    await this.redisQueue.clean(keepCount, 'completed');
  }

  // 清理失败任务的方法（保留最近的任务）
  async cleanFailedJobs(keepCount: number = 50) {
    await this.redisQueue.clean(keepCount, 'failed');
  }

  // 获取指定状态的任务数量
  async getJobCount(status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused') {
    return await this.redisQueue.getJobCounts()[status] || 0;
  }

  // 获取队列的总体统计信息
  async getQueueStats() {
    try {
      const counts = await this.redisQueue.getJobCounts();
      return {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0
      };
    }
  }

  // 检查 Redis 连接状态
  async checkRedisConnection() {
    try {
      const ping = await this.redisQueue.client.ping();
      return ping === 'PONG';
    } catch (error) {
      return false;
    }
  }

  // 获取详细的队列信息
  async getDetailedQueueInfo() {
    try {
      const isConnected = await this.checkRedisConnection();
      if (!isConnected) {
        return { error: 'Redis not connected' };
      }

      const stats = await this.getQueueStats();
      const keys = await this.redisQueue.client.keys('bull:redis:*');
      
      return {
        connected: isConnected,
        stats,
        totalKeys: keys.length,
        keys: keys.slice(0, 10) // 只显示前10个key
      };
    } catch (error) {
      console.error('Error getting detailed queue info:', error);
      return { error: error.message };
    }
  }

}