import { Controller, Get, Param, Res, HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

@Controller('music_files')
export class AudioController {
  // 音频文件存储目录（与你的脚本中AUDIO_DIR一致）
  private readonly audioDir = '../music_files';
  private logger = new Logger('AudioController');
  // AudioController 中补充响应头配置
  @Get(':filename(*)')
  async getAudioFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      this.logger.log('请求音频文件:', filename);
      const audioPath = path.join(this.audioDir, filename);

      if (!fs.existsSync(audioPath)) {
        throw new HttpException('音频文件不存在', HttpStatus.NOT_FOUND);
      }

      // 获取文件信息（用于 Content-Type 和分块传输）
      const stat = fs.statSync(audioPath);
      const mimeType = this.getMimeType(filename); // 根据扩展名获取正确的 MIME 类型

      // 关键：设置分块传输和音频类型头
      res.setHeader('Content-Type', mimeType); // 必须正确设置，如 audio/mpeg
      res.setHeader('Transfer-Encoding', 'chunked'); // 分块传输
      res.setHeader('Accept-Ranges', 'bytes'); // 支持断点续传（可选）
      res.setHeader('Access-Control-Expose-Headers', 'X-Audio-Duration, Content-Type'); // 允许前端获取头信息

      // 读取 meta 信息（时长）
      let duration = '';
      const metaPath = `${audioPath}.meta`;
      if (fs.existsSync(metaPath)) {
        duration = fs.readFileSync(metaPath, 'utf-8').split('\n')[0].trim();
        res.setHeader('X-Audio-Duration', duration);
      }

      // 流式传输文件（pipe 会自动分块）
      const stream = fs.createReadStream(audioPath);
      stream.pipe(res);

      // 处理流错误
      stream.on('error', (err) => {
        this.logger.error('音频流错误:', err);
        if (!res.headersSent) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('音频传输失败');
        }
      });

    } catch (error) {
      this.logger.error('处理音频失败:', error);
      throw new HttpException(
        `处理音频失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 辅助方法：根据文件名获取 MIME 类型
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac'
    };
    return mimeMap[ext] || 'audio/*';
  }
}