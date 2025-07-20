import { Module } from '@nestjs/common';
import { EventsGateway } from './index';

@Module({
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class WebSocketModule {} 