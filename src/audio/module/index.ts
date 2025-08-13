import { Module } from '@nestjs/common';
import { AudioController } from '../controller';

@Module({
  controllers: [AudioController],
})
export class AudioModule {}