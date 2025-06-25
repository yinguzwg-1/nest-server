import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackerController } from '../controller';
import { TrackerService } from '../service';
import { TrackerEvent } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackerEvent]),
  ],
  controllers: [TrackerController],
  providers: [TrackerService],
  exports: [TrackerService],
})
export class TrackerModule {} 