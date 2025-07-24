import { Injectable } from "@nestjs/common";
import { Monitor, MonitorDto } from "../entities";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { EventsGateway } from "../../common/websocket";

@Injectable()
export class MonitorService {

  constructor(
    @InjectRepository(Monitor)  
    private readonly monitorRepository: Repository<Monitor>,
    private readonly eventsGateway: EventsGateway
  ) {}

  async logRequest(request: MonitorDto) {
    const result = await this.monitorRepository.save(request);
    // 通知客户端有新的监控数据
    this.eventsGateway.server.emit('monitorUpdate', {
      type: 'request',
      count: 1,
      timestamp: new Date().toISOString()
    });
    return result;
  }

  async logError(error: MonitorDto) {
    const result = await this.monitorRepository.save(error);
    // 通知客户端有新的错误数据
    this.eventsGateway.server.emit('monitorUpdate', {
      type: 'error',
      count: 1,
      timestamp: new Date().toISOString()
    });
    return result;
  }

  async batchLogRequests(requests: MonitorDto[]) {
    const results = await this.monitorRepository.save(requests);
    // 只有当有数据时才发送通知
    if (requests.length > 0) {
      this.eventsGateway.server.emit('monitorUpdate', {
        type: 'batch_request',
        count: requests.length,
        timestamp: new Date().toISOString()
      });
    }
    return results;
  }

  async batchLogErrors(errors: MonitorDto[]) {
    const results = await this.monitorRepository.save(errors);
    // 只有当有数据时才发送通知
    if (errors.length > 0) {
      this.eventsGateway.server.emit('monitorUpdate', {
        type: 'batch_error',
        count: errors.length,
        timestamp: new Date().toISOString()
      });
    }
    return results;
  }

  // 静默批量日志方法，不发送WebSocket通知
  async batchLogRequestsSilent(requests: MonitorDto[]) {
    const results = await this.monitorRepository.save(requests);
    return results;
  }

  async batchLogErrorsSilent(errors: MonitorDto[]) {
    const results = await this.monitorRepository.save(errors);
    return results;
  }

  async getMonitoringData() {
    return await this.monitorRepository.find({
      order: {
        timestamp: 'DESC'
      }
    });
  }

  async getMonitoringDataWithPagination(page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.monitorRepository.findAndCount({
      order: {
        timestamp: 'DESC'
      },
      skip,
      take: limit
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  async getMonitoringStats() {
    const total = await this.monitorRepository.count();
    
    // 计算成功率
    const successfulRequests = await this.monitorRepository
      .createQueryBuilder('monitor')
      .where('monitor.status_code < :statusCode', { statusCode: 400 })
      .getCount();
    const successRate = total > 0 ? (successfulRequests / total) * 100 : 0;
    
    // 计算平均响应时间
    const avgResult = await this.monitorRepository
      .createQueryBuilder('monitor')
      .select('AVG(monitor.duration)', 'averageDuration')
      .getRawOne();
    const averageResponseTime = avgResult?.averageDuration ? Math.round(avgResult.averageDuration) : 0;
    
    // 状态码分布
    const statusCodeStats = await this.monitorRepository
      .createQueryBuilder('monitor')
      .select('monitor.status_code', 'statusCode')
      .addSelect('COUNT(*)', 'count')
      .groupBy('monitor.status_code')
      .getRawMany();
    
    const statusCodeDistribution: Record<number, number> = {};
    statusCodeStats.forEach(stat => {
      statusCodeDistribution[stat.statusCode] = parseInt(stat.count);
    });

    return {
      total,
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round((100 - successRate) * 100) / 100,
      averageResponseTime,
      statusCodeDistribution
    };
  }


  // 获取指定模块的最新性能数据
  async getLatestPerformanceByModuleName(moduleName: string) {
    return await this.monitorRepository.findOne({
      where: { module: moduleName },
      order: { timestamp: 'DESC' }
    });
  }
}