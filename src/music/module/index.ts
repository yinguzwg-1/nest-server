import { Module } from "@nestjs/common";
import { MusicController } from "../controller";
import { MusicService } from "../service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MusicMetadata } from "../entities";

@Module({
  imports: [TypeOrmModule.forFeature([MusicMetadata])],
  controllers: [MusicController],
  providers: [MusicService],
  exports: [MusicService],
})
export class MusicModule {}