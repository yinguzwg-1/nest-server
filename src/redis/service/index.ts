import { Inject, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue, Job } from "bull";
import { RedisClientType } from "redis";
import path from "path";
import fs from "fs";
@Injectable()
export class RedisService {

  constructor(
    @InjectQueue('redis') private readonly redisQueue: Queue,
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    @InjectQueue('file-merge-queue') private readonly fileMergeQueue: Queue,
  ) { 
  
  }
 

  async addLogToStream(queueName: string, data: any) {
    
    await this.redisQueue.add(queueName, data, {
      attempts: 3, // 重试次数
      backoff: 3000, // 重试间隔
      // 设置任务在2小时后过期（7200000毫秒）
      delay: 0, // 立即执行
      // 任务完成后立即删除
      removeOnComplete: true,
      // 任务失败后立即删除
      removeOnFail: true,
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

  // ========== 针对key获取数据的方法 ==========

  // 根据key获取数据（自动识别数据类型）
  async getDataByKey(key: string) {
    try {
      const type = await this.redisQueue.client.type(key);
      let data: any;

      switch (type) {
        case 'string':
          data = await this.redisQueue.client.get(key);
          break;
        case 'list':
          data = await this.redisQueue.client.lrange(key, 0, -1);
          break;
        case 'set':
          data = await this.redisQueue.client.smembers(key);
          break;
        case 'zset':
          data = await this.redisQueue.client.zrange(key, 0, -1, 'WITHSCORES');
          break;
        case 'hash':
          data = await this.redisQueue.client.hgetall(key);
          break;
        default:
          data = null;
      }

      return {
        key,
        type,
        data,
        exists: true
      };
    } catch (error) {
      return {
        key,
        type: null,
        data: null,
        exists: false,
        error: error.message
      };
    }
  }

  // 获取字符串类型的数据
  async getStringData(key: string): Promise<string | null> {
    try {
      return await this.redisQueue.client.get(key);
    } catch (error) {
      console.error(`Error getting string data for key ${key}:`, error);
      return null;
    }
  }

  // 获取列表类型的数据
  async getListData(key: string, start: number = 0, end: number = -1): Promise<string[]> {
    try {
      return await this.redisQueue.client.lrange(key, start, end);
    } catch (error) {
      console.error(`Error getting list data for key ${key}:`, error);
      return [];
    }
  }

  // 获取集合类型的数据
  async getSetData(key: string): Promise<string[]> {
    try {
      return await this.redisQueue.client.smembers(key);
    } catch (error) {
      console.error(`Error getting set data for key ${key}:`, error);
      return [];
    }
  }

  // 获取有序集合类型的数据
  async getZSetData(key: string, start: number = 0, end: number = -1, withScores: boolean = false): Promise<any[]> {
    try {
      if (withScores) {
        return await this.redisQueue.client.zrange(key, start, end, 'WITHSCORES');
      } else {
        return await this.redisQueue.client.zrange(key, start, end);
      }
    } catch (error) {
      console.error(`Error getting zset data for key ${key}:`, error);
      return [];
    }
  }

  // 获取哈希类型的数据
  async getHashData(key: string, field?: string): Promise<any> {
    try {
      if (field) {
        return await this.redisQueue.client.hget(key, field);
      } else {
        return await this.redisQueue.client.hgetall(key);
      }
    } catch (error) {
      console.error(`Error getting hash data for key ${key}:`, error);
      return field ? null : {};
    }
  }

  // 获取哈希的多个字段
  async getHashFields(key: string, fields: string[]): Promise<any> {
    try {
      return await this.redisQueue.client.hmget(key, ...fields);
    } catch (error) {
      console.error(`Error getting hash fields for key ${key}:`, error);
      return fields.map(() => null);
    }
  }

  // 检查key是否存在
  async keyExists(key: string): Promise<boolean> {
    try {
      const result = await this.redisQueue.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error checking key existence for ${key}:`, error);
      return false;
    }
  }

  // 获取key的数据类型
  async getKeyType(key: string): Promise<string | null> {
    try {
      return await this.redisQueue.client.type(key);
    } catch (error) {
      console.error(`Error getting key type for ${key}:`, error);
      return null;
    }
  }

  // 获取key的过期时间
  async getKeyTTL(key: string): Promise<number> {
    try {
      return await this.redisQueue.client.ttl(key);
    } catch (error) {
      console.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  // 批量获取多个key的数据
  async getMultipleKeysData(keys: string[]): Promise<Array<{key: string, data: any, type: string | null, exists: boolean}>> {
    try {
      const results = await Promise.all(
        keys.map(async (key) => {
          return await this.getDataByKey(key);
        })
      );
      return results;
    } catch (error) {
      console.error('Error getting multiple keys data:', error);
      return keys.map(key => ({
        key,
        data: null,
        type: null,
        exists: false,
        error: error.message
      }));
    }
  }

  // 根据模式搜索key并获取数据
  async searchKeysAndGetData(pattern: string, limit: number = 100): Promise<Array<{key: string, data: any, type: string | null}>> {
    try {
      const keys = await this.redisQueue.client.keys(pattern);
      const limitedKeys = keys.slice(0, limit);
      
      const results = await Promise.all(
        limitedKeys.map(async (key) => {
          const result = await this.getDataByKey(key);
          return {
            key: result.key,
            data: result.data,
            type: result.type
          };
        })
      );
      
      return results;
    } catch (error) {
      console.error(`Error searching keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  // 获取Bull队列相关的特定key数据
  async getBullQueueData(queueName: string = 'redis'): Promise<any> {
    try {
      const prefix = `bull:${queueName}`;
      const keys = await this.redisQueue.client.keys(`${prefix}:*`);
      
      const queueData: any = {
        queueName,
        totalKeys: keys.length,
        keys: {},
        stats: await this.getQueueStats()
      };

      // 获取关键队列数据
      const keyTypes = ['wait', 'active', 'completed', 'failed', 'delayed', 'paused'];
      
      for (const keyType of keyTypes) {
        const key = `${prefix}:${keyType}`;
        if (keys.includes(key)) {
          queueData.keys[keyType] = await this.getDataByKey(key);
        }
      }

      return queueData;
    } catch (error) {
      console.error('Error getting Bull queue data:', error);
      return { error: error.message };
    }
  }

  // 获取指定key的大小信息
  async getKeySize(key: string): Promise<number> {
    try {
      const type = await this.redisQueue.client.type(key);
      
      switch (type) {
        case 'string':
          return await this.redisQueue.client.strlen(key);
        case 'list':
          return await this.redisQueue.client.llen(key);
        case 'set':
          return await this.redisQueue.client.scard(key);
        case 'zset':
          return await this.redisQueue.client.zcard(key);
        case 'hash':
          return await this.redisQueue.client.hlen(key);
        default:
          return 0;
      }
    } catch (error) {
      console.error(`Error getting key size for ${key}:`, error);
      return 0;
    }
  }

  // 清理长时间等待的任务（超过2小时）
  async cleanOldWaitingJobs(maxAgeHours: number = 2): Promise<number> {
    try {
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000; // 转换为毫秒
      const cutoffTime = Date.now() - maxAgeMs;
      
      // 获取所有等待中的任务
      const waitingJobs = await this.redisQueue.getJobs(['waiting'], 0, -1);
      let cleanedCount = 0;
      
      for (const job of waitingJobs) {
        try {
          const jobData = await job.getState();
          const jobTimestamp = job.timestamp;
          
          // 如果任务创建时间超过指定时间，则删除
          if (jobTimestamp < cutoffTime) {
            await job.remove();
            cleanedCount++;
            console.log(`Cleaned old waiting job ${job.id} created at ${new Date(jobTimestamp)}`);
          }
        } catch (jobError) {
          console.error(`Error processing job ${job.id}:`, jobError);
        }
      }
      
      console.log(`Cleaned ${cleanedCount} old waiting jobs older than ${maxAgeHours} hours`);
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning old waiting jobs:', error);
      return 0;
    }
  }

  // 清理所有长时间等待的任务（包括其他队列）
  async cleanAllOldWaitingJobs(maxAgeHours: number = 2): Promise<{redis: number, fileMerge: number}> {
    try {
      const redisCleaned = await this.cleanOldWaitingJobs(maxAgeHours);
      
      // 清理文件合并队列中的旧任务
      const fileMergeCleaned = await this.cleanOldWaitingJobsFromQueue(
        this.fileMergeQueue, 
        maxAgeHours
      );
      
      return {
        redis: redisCleaned,
        fileMerge: fileMergeCleaned
      };
    } catch (error) {
      console.error('Error cleaning all old waiting jobs:', error);
      return { redis: 0, fileMerge: 0 };
    }
  }

  // 从指定队列清理长时间等待的任务
  private async cleanOldWaitingJobsFromQueue(queue: Queue, maxAgeHours: number = 2): Promise<number> {
    try {
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      const cutoffTime = Date.now() - maxAgeMs;
      
      const waitingJobs = await queue.getJobs(['waiting'], 0, -1);
      let cleanedCount = 0;
      
      for (const job of waitingJobs) {
        try {
          const jobTimestamp = job.timestamp;
          
          if (jobTimestamp < cutoffTime) {
            await job.remove();
            cleanedCount++;
            console.log(`Cleaned old waiting job ${job.id} from queue ${queue.name} created at ${new Date(jobTimestamp)}`);
          }
        } catch (jobError) {
          console.error(`Error processing job ${job.id} from queue ${queue.name}:`, jobError);
        }
      }
      
      console.log(`Cleaned ${cleanedCount} old waiting jobs from queue ${queue.name} older than ${maxAgeHours} hours`);
      return cleanedCount;
    } catch (error) {
      console.error(`Error cleaning old waiting jobs from queue ${queue.name}:`, error);
      return 0;
    }
  }

  // 获取任务创建时间信息
  async getJobTimingInfo(): Promise<any> {
    try {
      const waitingJobs = await this.redisQueue.getJobs(['waiting'], 0, -1);
      const now = Date.now();
      
      const timingInfo = waitingJobs.map(job => ({
        id: job.id,
        timestamp: job.timestamp,
        createdAt: new Date(job.timestamp),
        ageInHours: Math.round((now - job.timestamp) / (1000 * 60 * 60) * 100) / 100,
        isOld: (now - job.timestamp) > (2 * 60 * 60 * 1000) // 超过2小时
      }));
      
      return {
        totalWaiting: timingInfo.length,
        oldJobs: timingInfo.filter(job => job.isOld),
        recentJobs: timingInfo.filter(job => !job.isOld),
        timingInfo
      };
    } catch (error) {
      console.error('Error getting job timing info:', error);
      return { error: error.message };
    }
  }

}