import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly apiBase: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    // 支持 OpenAI / 兼容 API（如 DeepSeek、通义千问等）
    this.apiKey = this.configService.get<string>('AI_API_KEY') || '';
    this.apiBase = this.configService.get<string>('AI_API_BASE') || 'https://api.openai.com/v1';
    this.model = this.configService.get<string>('AI_MODEL') || 'gpt-4o-mini';
  }

  /**
   * 流式图片分析
   */
  async streamAnalysis(
    imageUrl: string,
    prompt?: string,
    history?: Array<{ role: string; content: string }>,
    onChunk?: (chunk: string) => void,
  ): Promise<void> {
    if (!this.apiKey) {
      // 无 API Key 时返回模拟响应
      return this.mockStreamAnalysis(imageUrl, prompt, onChunk);
    }

    const systemPrompt = `你是一位拥有 15 年经验的资深摄影师兼构图分析专家。请用中文回答。

当用户发送一张照片时，请从以下专业维度进行深度分析（根据用户的具体问题侧重回答，若用户无特定问题则全面分析）：

## 构图分析（核心）
1. **构图法则识别**：三分法/黄金分割/对角线/框架式/引导线/对称/放射/S 曲线等，指出照片实际使用了哪种，标注主体在画面中的位置
2. **主体与留白**：主体占比是否合适，留白的方向和面积是否服务于叙事
3. **视觉重心与视线引导**：观者的视线路径是怎样的，有无明确的入画点和终点
4. **层次感**：前景/中景/背景的安排，是否营造了足够的纵深
5. **裁切与边缘**：主体是否被不当裁切，画面边缘是否干净

## 色彩分析
- 色温倾向（冷/暖/中性）、主色调和谐度
- 饱和度是否适当，有无色彩断层
- 明度分布（直方图倾向）

## 光影分析
- 光源方向和质感（硬光/柔光/逆光/侧光等）
- 高光与阴影的过渡是否自然
- 光线对情绪氛围的贡献

## 改进建议
- 给出 2-3 条**具体可操作**的改进方向（如"可尝试将主体向左平移 1/3，让视线引导更顺畅"）
- 如果构图已经优秀，指出其中最出彩的点并解释为什么

请保持回答简洁专业、结构清晰，适当使用 emoji 增加可读性。每个维度用 2-3 句话概括，避免冗长。`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // 加入历史对话
    if (history && history.length > 0) {
      messages.push(...history.slice(-10)); // 最多保留 10 条历史
    }

    // 构建当前消息（带图片）
    const userContent: any[] = [];
    if (imageUrl) {
      // 将相对路径转为公网可访问的完整 URL（AI 服务需要能访问到图片）
      const siteUrl = this.configService.get<string>('SITE_URL') || 'https://zwg.autos';
      let fullImageUrl = imageUrl;
      if (!imageUrl.startsWith('http')) {
        fullImageUrl = `${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      } else if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
        // 本地地址 AI 服务无法访问，替换为生产域名
        fullImageUrl = imageUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, siteUrl);
      }

      this.logger.log(`AI 分析图片 URL: ${fullImageUrl}`);

      userContent.push({
        type: 'image_url',
        image_url: { url: fullImageUrl, detail: 'low' },
      });
    }
    userContent.push({
      type: 'text',
      text: prompt || '请全面分析这张照片的构图、色彩、光影和情感表达，并给出改进建议。',
    });

    messages.push({ role: 'user', content: userContent });

    try {
      const response = await fetch(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`AI API error: ${response.status} ${errorText}`);
        throw new Error(`AI 服务暂时不可用 (${response.status})`);
      }

      // 解析 SSE 流
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content && onChunk) {
              onChunk(content);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    } catch (error) {
      this.logger.error(`AI stream error: ${error.message}`);
      throw error;
    }
  }

  /**
   * 无 API Key 时的模拟流式响应
   */
  private async mockStreamAnalysis(
    imageUrl: string,
    prompt?: string,
    onChunk?: (chunk: string) => void,
  ): Promise<void> {
    const mockResponse = `## 📸 图片分析报告

> ⚠️ 当前为演示模式，请配置 \`AI_API_KEY\` 环境变量以启用真实 AI 分析。

### 🎨 构图分析
这张照片采用了经典的三分法构图，主体位于画面的黄金分割点附近，视觉重心明确。

### 🌈 色彩分析
整体色调和谐，色温偏暖，给人以舒适的视觉感受。饱和度适中，色彩层次丰富。

### 💡 光影分析
光线自然柔和，明暗过渡流畅，很好地营造了画面的立体感和空间感。

### 📝 建议标题
\`专业摄影作品 - 光影之美\`

### 🏷️ 推荐标签
\`摄影\` \`光影\` \`构图\` \`色彩\` \`艺术\`

---
*配置 AI_API_KEY 后可获得针对具体照片的个性化分析*`;

    // 模拟流式输出
    const chars = mockResponse.split('');
    for (let i = 0; i < chars.length; i++) {
      if (onChunk) onChunk(chars[i]);
      // 每 2-4 个字符暂停一下，模拟打字效果
      if (i % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 15));
      }
    }
  }

  /**
   * 快速获取图片标签
   */
  async getQuickTags(imageUrl: string): Promise<{ tags: string[] }> {
    if (!this.apiKey) {
      return { tags: ['摄影', '风光', '人像', '构图', '色彩', '光影'] };
    }

    const fullImageUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${this.configService.get<string>('SITE_URL') || 'https://zwg.autos'}${imageUrl}`;

    try {
      const response = await fetch(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: fullImageUrl, detail: 'low' } },
                { type: 'text', text: '请用 JSON 数组返回 5-8 个描述这张图片的中文标签，只返回 JSON 数组，不要其他内容。例如：["风景","日落","海边"]' },
              ],
            },
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      const match = content.match(/\[.*\]/s);
      const tags = match ? JSON.parse(match[0]) : [];
      return { tags };
    } catch (error) {
      this.logger.error(`Quick tags error: ${error.message}`);
      return { tags: ['摄影', '风光', '人像', '构图', '色彩'] };
    }
  }

  /**
   * 生成卡通风格图片
   */
  async generateCartoon(imageUrl: string): Promise<{ cartoonUrl: string; message: string; isMock: boolean }> {
    const fullImageUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${this.configService.get<string>('SITE_URL') || 'https://zwg.autos'}${imageUrl}`;

    if (!this.apiKey) {
      // 模拟模式：返回原图 URL + CSS 滤镜标记
      return {
        cartoonUrl: fullImageUrl,
        message: '🎨 演示模式：已对原图应用卡通滤镜效果。配置 AI_API_KEY 后可生成真正的 AI 卡通图片。',
        isMock: true,
      };
    }

    try {
      // 第一步：用 Vision 模型描述图片内容
      const descResponse = await fetch(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: fullImageUrl, detail: 'low' } },
                { type: 'text', text: 'Describe this image in detail in English for an AI image generator. Focus on the main subject, colors, composition, and mood. Keep it under 200 words. Only output the description, nothing else.' },
              ],
            },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (!descResponse.ok) {
        throw new Error(`Vision API error: ${descResponse.status}`);
      }

      const descData = await descResponse.json();
      const description = descData.choices?.[0]?.message?.content || '';

      if (!description) {
        throw new Error('Failed to get image description');
      }

      // 第二步：用 DALL-E 生成卡通版本
      const dalleResponse = await fetch(`${this.apiBase}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `Create a cute cartoon/anime style illustration based on this description: ${description}. Style: vibrant colors, clean lines, Studio Ghibli inspired, warm and cheerful mood, digital art.`,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      if (!dalleResponse.ok) {
        const errText = await dalleResponse.text();
        this.logger.error(`DALL-E error: ${dalleResponse.status} ${errText}`);
        throw new Error(`图片生成失败 (${dalleResponse.status})`);
      }

      const dalleData = await dalleResponse.json();
      const generatedUrl = dalleData.data?.[0]?.url;

      if (!generatedUrl) {
        throw new Error('No image generated');
      }

      return {
        cartoonUrl: generatedUrl,
        message: '🎨 AI 卡通图片生成完成！基于原照片的内容生成了吉卜力风格的卡通版本。',
        isMock: false,
      };
    } catch (error) {
      this.logger.error(`Cartoon generation error: ${error.message}`);
      // 降级为模拟模式
      return {
        cartoonUrl: fullImageUrl,
        message: `⚠️ AI 生成失败（${error.message}），已显示原图滤镜效果。`,
        isMock: true,
      };
    }
  }
}
