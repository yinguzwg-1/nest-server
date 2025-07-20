import { Body, Controller, Get, Post } from "@nestjs/common";
import { MonitorService } from "../service";
import { MonitorDto } from "../entities";


@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get()
  getMonitorData() {
    return this.monitorService.getMonitoringData();
  }
}