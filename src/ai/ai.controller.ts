import { Controller, Post, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /api/ai/analyze
   * Body: { imageUrl: string, prompt?: string, history?: Array<{role, content}> }
   * 返回流式响应 (SSE)
   */
  @Post('analyze')
  async analyzeImage(
    @Body() body: { imageUrl: string; prompt?: string; history?: Array<{ role: string; content: string }> },
    @Res() res: Response,
  ) {
    const { imageUrl, prompt, history } = body;

    if (!imageUrl) {
      throw new HttpException('imageUrl is required', HttpStatus.BAD_REQUEST);
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    try {
      await this.aiService.streamAnalysis(imageUrl, prompt, history, (chunk: string) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      });
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message || 'AI analysis failed' })}\n\n`);
      res.end();
    }
  }

  /**
   * POST /api/ai/quick-tags
   * Body: { imageUrl: string }
   * 快速获取图片标签（非流式）
   */
  @Post('quick-tags')
  async quickTags(@Body() body: { imageUrl: string }) {
    if (!body.imageUrl) {
      throw new HttpException('imageUrl is required', HttpStatus.BAD_REQUEST);
    }
    return this.aiService.getQuickTags(body.imageUrl);
  }

  /**
   * POST /api/ai/cartoon
   * Body: { imageUrl: string }
   * 生成卡通风格图片
   */
  @Post('cartoon')
  async generateCartoon(@Body() body: { imageUrl: string }) {
    if (!body.imageUrl) {
      throw new HttpException('imageUrl is required', HttpStatus.BAD_REQUEST);
    }
    return this.aiService.generateCartoon(body.imageUrl);
  }
}
