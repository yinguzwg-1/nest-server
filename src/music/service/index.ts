import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MusicMetadata } from "../entities";
import { Repository } from "typeorm";

@Injectable()
export class MusicService {
  constructor(
    @InjectRepository(MusicMetadata)
    private readonly musicRepository: Repository<MusicMetadata>
  ) {}

  async getMusicList(page: number, limit: number) {
    const [musicList, total] = await this.musicRepository.findAndCount({ skip: (page - 1) * limit, take: limit });
    return {
      musicList,
      total,
      page,
      limit
    };
  }
} 