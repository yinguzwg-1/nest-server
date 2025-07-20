import { Module } from "@nestjs/common";
import { Monitor } from "../entities";
import { MonitorService } from "../service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MonitorController } from "../controller";
import { WebSocketModule } from "../../common/websocket/websocket.module";

@Module({
  providers: [MonitorService],
  controllers: [MonitorController],
  exports: [MonitorService],
  imports: [TypeOrmModule.forFeature([Monitor]), WebSocketModule],
})
export class MonitorModule {}