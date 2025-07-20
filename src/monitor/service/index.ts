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
}