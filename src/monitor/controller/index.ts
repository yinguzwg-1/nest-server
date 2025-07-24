import { Controller, Get, Query } from "@nestjs/common";
import { MonitorService } from "../service";

@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get()
  getMonitorData(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    return this.monitorService.getMonitoringDataWithPagination(pageNum, limitNum);
  }


  @Get('stats')
  getMonitoringStats() {
    return this.monitorService.getMonitoringStats();
  }
}