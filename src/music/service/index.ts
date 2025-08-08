import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MusicMetadata } from "../entities";
import { Like, Repository } from "typeorm";

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
    async searchMusic(keyword: string) {
    // 并发执行三个查询
    const [musicListRes1, musicListRes2, musicListRes3] = await Promise.allSettled([
      this.musicRepository.find({
        where: {
          title: Like(`%${keyword}%`),
        }
      }),
      this.musicRepository.find({
        where: {
          artist: Like(`%${keyword}%`),
        }
      }),
      this.musicRepository.find({
        where: {
          album: Like(`%${keyword}%`),
        }
      })
    ]);
    const musicList = {
      title: [],
      artist: [],
      album: []
    }
    if (musicListRes1.status === 'fulfilled') {
      musicList.title.push(...musicListRes1.value);
    }
    if (musicListRes2.status === 'fulfilled') {
      musicList.artist.push(...musicListRes2.value);
    }
    if (musicListRes3.status === 'fulfilled') {
      musicList.album.push(...musicListRes3.value);
    }
    return musicList;
  }
} 