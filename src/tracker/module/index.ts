import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackerController } from '../controller';
import { TrackerService } from '../service';
import { TrackerEvent } from '../entities';
import { RedisModule } from '../../redis/module';

@Module({
  imports: [TypeOrmModule.forFeature([TrackerEvent]), RedisModule],
  controllers: [TrackerController],
  providers: [TrackerService],
  exports: [TrackerService],
})
export class TrackerModule {}
