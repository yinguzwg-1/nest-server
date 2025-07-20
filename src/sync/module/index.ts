import { Module } from "@nestjs/common";
import { MonitorSyncService } from "../service/monitor-sync.service";
import { TrackerSyncService } from "../service/tracker-sync.service";
import { Monitor } from "../../monitor/entities";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RedisModule } from "../../redis/module";
import { MonitorModule } from "../../monitor/module";
import { TrackerModule } from "../../tracker/module";
import { WebSocketModule } from "../../common/websocket/websocket.module";

@Module({
  imports: [
    RedisModule,
    MonitorModule,
    TrackerModule,
    TypeOrmModule.forFeature([Monitor]),
    WebSocketModule,
  ],
  providers: [MonitorSyncService, TrackerSyncService],
  exports: [MonitorSyncService, TrackerSyncService],
})
export class SyncModule {}