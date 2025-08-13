import { Controller, Get, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

@Controller('music_files')
export class AudioController {
  // 音频文件存储目录（与你的脚本中AUDIO_DIR一致）
  private readonly audioDir = '/root/music_files';
  @Get(':filename(*)') // 支持子目录，如 "album/song.mp3"
  async getAudioFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
     
      // 1. 构建音频文件和meta文件的完整路径
      const audioPath = path.join(this.audioDir, filename);
      const metaPath = `${audioPath}.meta`;

      // 2. 检查音频文件是否存在
      if (!fs.existsSync(audioPath)) {
        throw new HttpException('音频文件不存在', HttpStatus.NOT_FOUND);
      }

      // 3. 读取meta文件（如果存在）
      let duration = '';
      if (fs.existsSync(metaPath)) {
        // 读取meta文件第一行（假设时长信息在这里）
        duration = fs.readFileSync(metaPath, 'utf-8').split('\n')[0].trim();
      }

      // 4. 添加时长响应头
      if (duration) {
        res.setHeader('X-Audio-Duration', duration);
        res.setHeader('Access-Control-Expose-Headers', 'X-Audio-Duration');
      }
      console.log('duration---------------', duration);
      // 5. 流式返回音频文件（适合大文件）
      const stream = fs.createReadStream(audioPath);
      stream.pipe(res);

    } catch (error) {
      throw new HttpException(
        `处理音频文件失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}