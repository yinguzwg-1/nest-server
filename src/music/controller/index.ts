import { Controller, Get, Query } from "@nestjs/common";
import { MusicService } from "../service";

@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get()
  async getMusicList(@Query('page') page: number, @Query('limit') limit: number) {
    const res = await this.musicService.getMusicList(page, limit);
    return {
      code: 200,
      message: 'success',
      data: res
    };
  }
}