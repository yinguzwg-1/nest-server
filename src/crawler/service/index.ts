import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { Media } from '../../media/entities';
import { MediaType, MediaStatus } from '../../media/types';
import { TranslationField } from '../../translation/entities';
import { TranslationService } from '../../translation/service';
import { AITranslationService } from '../../translation/service/ai-translation.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { CrawlerCacheService } from './crawler-cache.service';

interface CrawlerProgress {
  lastPage: number;
  lastUpdateTime: string;
  source: string;
}

interface MovieData {
  title: string;
  quality: string;
  link: string;
  poster: string;
  backdrop: string;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly baseUrl = 'https://www.cun6.com';
  private readonly progressFilePath: string;

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly translationService: TranslationService,
    private readonly aiTranslationService: AITranslationService,
    private readonly crawlerCacheService: CrawlerCacheService,
    private configService: ConfigService,
  ) {
    // 在项目根目录下创建 data 文件夹存储进度文件
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.progressFilePath = path.join(dataDir, 'crawler-progress.json');
    this.initProgressFile();
  }

  private initProgressFile() {
    if (!fs.existsSync(this.progressFilePath)) {
      const initialProgress: Record<string, CrawlerProgress> = {};
      fs.writeFileSync(
        this.progressFilePath,
        JSON.stringify(initialProgress, null, 2),
      );
    }
  }

  private getProgress(): Record<string, CrawlerProgress> {
    try {
      const content = fs.readFileSync(this.progressFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('读取爬虫进度文件失败:', error);
      return {};
    }
  }

  private saveProgress(source: string, page: number) {
    try {
      const progress = this.getProgress();
      progress[source] = {
        lastPage: page,
        lastUpdateTime: new Date().toISOString(),
        source,
      };
      fs.writeFileSync(
        this.progressFilePath,
        JSON.stringify(progress, null, 2),
      );
    } catch (error) {
      this.logger.error('保存爬虫进度失败:', error);
    }
  }

  async getLastCrawledPage(source: string): Promise<number> {
    const progress = this.getProgress();
    return progress[source]?.lastPage || 0;
  }

  async crawl(source: string, startPage?: number) {
    const lastPage = startPage || (await this.getLastCrawledPage(source));
    this.logger.log(`开始爬取 ${source}, 从第 ${lastPage + 1} 页开始`);

    try {
      // 这里实现具体的爬虫逻辑
      // ...

      // 每爬完一页就保存进度
      this.saveProgress(source, lastPage + 1);
    } catch (error) {
      this.logger.error(
        `爬取 ${source} 第 ${lastPage + 1} 页时发生错误:`,
        error,
      );
      throw error;
    }
  }

  async getAllProgress(): Promise<Record<string, CrawlerProgress>> {
    return this.getProgress();
  }

  async resetProgress(source: string) {
    try {
      const progress = this.getProgress();
      delete progress[source];
      fs.writeFileSync(
        this.progressFilePath,
        JSON.stringify(progress, null, 2),
      );
      this.logger.log(`已重置 ${source} 的爬取进度`);
    } catch (error) {
      this.logger.error(`重置 ${source} 进度失败:`, error);
      throw error;
    }
  }

  /**
   * 批量处理电影数据，使用缓存和并发翻译优化性能
   */
  private async processMoviesBatch(movies: MovieData[]): Promise<void> {
    if (movies.length === 0) return;

    this.logger.log(`开始批量处理 ${movies.length} 部电影`);

    try {
      // 1. 批量翻译标题（使用缓存优化）
      const titles = movies.map((m) => m.title);
      const translations =
        await this.crawlerCacheService.batchTranslateWithCache(titles);

      // 创建翻译映射
      const translationMap = new Map(
        translations.map((t) => [t.text, t.translation]),
      );

      const moviesWithTranslations = movies.map((movieData) => ({
        ...movieData,
        englishTitle: translationMap.get(movieData.title) || movieData.title,
      }));

      this.logger.log(
        `完成 ${moviesWithTranslations.length} 部电影的翻译（缓存命中率: ${this.crawlerCacheService.getCacheStats().size}）`,
      );

      // 2. 批量创建电影实体
      const movieEntities = moviesWithTranslations.map((movieData, index) => {
        const randomYear = Math.floor(Math.random() * (2025 - 2015 + 1)) + 2015;
        const randomRating = (Math.random() * (9.7 - 6.1) + 6.1).toFixed(1);
        return this.mediaRepository.create({
          title: movieData.title,
          description: '暂无描述',
          poster: movieData.poster ? `${this.baseUrl}${movieData.poster}` : '',
          backdrop: movieData.backdrop
            ? `${this.baseUrl}${movieData.backdrop}`
            : '',
          rating: parseFloat(randomRating),
          year: randomYear,
          type: MediaType.MOVIE,
          status: MediaStatus.RELEASED,
          isImagesDownloaded: false,
          duration: 0,
          director: '',
          boxOffice: 0,
          views: 0,
          likes: 0,
          sourceUrl: movieData.link,
        });
      });

      this.logger.log(`创建了 ${movieEntities.length} 个电影实体`);

      // 3. 批量保存电影到数据库
      const savedMovies = await this.mediaRepository.save(movieEntities);
      this.logger.log(`批量保存了 ${savedMovies.length} 部电影到数据库`);

      // 4. 批量创建翻译记录
      const translationPromises = savedMovies.map(async (savedMovie, index) => {
        const movieData = moviesWithTranslations[index];
        try {
          await this.translationService.setTranslations(
            savedMovie.id,
            TranslationField.TITLE,
            {
              zh: movieData.title,
              en: movieData.englishTitle,
            },
          );
        } catch (error) {
          this.logger.error(
            `保存翻译失败 (电影ID: ${savedMovie.id}): ${error.message}`,
          );
          throw error;
        }
      });

      // 5. 批量保存翻译记录
      await Promise.all(translationPromises);
      this.logger.log(`批量保存了 ${savedMovies.length} 条翻译记录`);
    } catch (error) {
      this.logger.error(`批量处理电影数据失败: ${error.message}`);
      this.logger.error(`错误堆栈: ${error.stack}`);
      throw error;
    }
  }

  async crawlMovieList(pageNum: number = 1): Promise<void> {
    let browser;
    try {
      // 启动浏览器
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection',
          '--memory-pressure-off',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--disable-css',
          '--disable-fonts',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-client-side-phishing-detection',
          '--disable-component-extensions-with-background-pages',
          '--disable-domain-reliability',
          '--disable-features=TranslateUI',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-sync-preferences',
          '--disable-threaded-animation',
          '--disable-threaded-scrolling',
          '--disable-web-resources',
          '--disable-web-security',
          '--disable-xss-auditor',
          '--no-first-run',
          '--no-default-browser-check',
          '--no-pings',
          '--no-zygote',
          '--single-process',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-background-timer-throttling',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-features=VizDisplayCompositor',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection',
          '--memory-pressure-off',
        ],
      });

      // 创建新页面
      const page = await browser.newPage();

      // 设置视窗大小
      await page.setViewport({ width: 1920, height: 1080 });

      // 设置请求头
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'zh-CN,zh;q=0.9',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });

      // 优化页面性能设置
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        // 阻止加载图片、字体、样式表等资源以提高速度
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // 访问页面
      const url = `${this.baseUrl}/tag/${pageNum}.html`;

      // 增加超时时间并添加重试机制
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          this.logger.log(`尝试访问页面 ${pageNum} (第 ${retryCount + 1} 次尝试)`);
          
          response = await page.goto(url, {
            waitUntil: 'domcontentloaded', // 改为更快的等待策略
            timeout: 120000, // 增加到120秒
          });

          if (!response.ok()) {
            throw new Error(`Failed to load page: ${response.status()}`);
          }
          
          // 如果成功，跳出重试循环
          break;
        } catch (error) {
          retryCount++;
          this.logger.warn(`第 ${retryCount} 次尝试失败: ${error.message}`);
          
          if (retryCount >= maxRetries) {
            throw new Error(`访问页面 ${pageNum} 失败，已重试 ${maxRetries} 次: ${error.message}`);
          }
          
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // 优化：等待特定元素出现而不是固定时间
      try {
        await page.waitForSelector('.stui-vodlist__box', { timeout: 20000 });
        // 额外等待一小段时间确保所有图片加载
        await page.waitForFunction(
          () => {
            const images = document.querySelectorAll(
              '.stui-vodlist__thumb.lazyload',
            );
            return images.length > 0;
          },
          { timeout: 10000 },
        );
      } catch (error) {
        this.logger.warn(
          `Timeout waiting for elements on page ${pageNum}, continuing anyway: ${error.message}`,
        );
      }

      // 获取电影数据
      const movies = await page.evaluate(() => {
        const movieElements = document.querySelectorAll('.stui-vodlist__box');
        const movies = [];

        movieElements.forEach((element) => {
          // 获取标题
          const titleElement = element.querySelector('.title.text-overflow a');
          const title = titleElement?.textContent?.trim() || '';

          // 获取视频质量
          const qualityElement = element.querySelector('.pic-text.text-right');
          const quality = qualityElement?.textContent?.trim() || '';

          // 获取链接
          const link = titleElement?.getAttribute('href') || '';

          // 获取图片URL
          const imageElement = element.querySelector(
            '.stui-vodlist__thumb.lazyload',
          );
          const imageUrl = imageElement?.getAttribute('data-original') || '';

          if (title) {
            movies.push({
              title,
              quality,
              link,
              poster: imageUrl,
              backdrop: imageUrl,
            });
          }
        });

        return movies;
      });

      // 添加调试日志
      this.logger.log(`提取到 ${movies.length} 部电影数据`);
      if (movies.length > 0) {
        this.logger.debug(
          `示例电影数据: ${JSON.stringify(movies[0], null, 2)}`,
        );
      }

      // 优化：批量处理和并发翻译
      await this.processMoviesBatch(movies);

      this.logger.log(
        `Successfully crawled page ${pageNum}, found ${movies.length} movies`,
      );
    } catch (error) {
      this.logger.error(`Failed to crawl page ${pageNum}: ${error.message}`);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
