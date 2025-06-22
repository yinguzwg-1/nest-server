import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { Media } from '../../media/entities';
import { MediaType, MediaStatus } from '../../media/types';
import { Translation, TranslationField } from '../../translation/entities';
import { TranslationService } from '../../translation/service';
import { AITranslationService } from '../../translation/service/ai-translation.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

interface CrawlerProgress {
  lastPage: number;
  lastUpdateTime: string;
  source: string;
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
      fs.writeFileSync(this.progressFilePath, JSON.stringify(initialProgress, null, 2));
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
        source
      };
      fs.writeFileSync(this.progressFilePath, JSON.stringify(progress, null, 2));
    } catch (error) {
      this.logger.error('保存爬虫进度失败:', error);
    }
  }

  async getLastCrawledPage(source: string): Promise<number> {
    const progress = this.getProgress();
    return progress[source]?.lastPage || 0;
  }

  async crawl(source: string, startPage?: number) {
    const lastPage = startPage || await this.getLastCrawledPage(source);
    this.logger.log(`开始爬取 ${source}, 从第 ${lastPage + 1} 页开始`);

    try {
      // 这里实现具体的爬虫逻辑
      // ...

      // 每爬完一页就保存进度
      this.saveProgress(source, lastPage + 1);
    } catch (error) {
      this.logger.error(`爬取 ${source} 第 ${lastPage + 1} 页时发生错误:`, error);
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
      fs.writeFileSync(this.progressFilePath, JSON.stringify(progress, null, 2));
      this.logger.log(`已重置 ${source} 的爬取进度`);
    } catch (error) {
      this.logger.error(`重置 ${source} 进度失败:`, error);
      throw error;
    }
  }

  async crawlMovieList(pageNum: number = 1): Promise<void> {
    let browser;
    try {
      this.logger.log(`Starting to crawl page ${pageNum}`);
      
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
        ]
      });

      // 创建新页面
      const page = await browser.newPage();

      // 设置视窗大小
      await page.setViewport({ width: 1920, height: 1080 });

      // 设置请求头
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
    
      // 访问页面
      const url = `${this.baseUrl}/tag/${pageNum}.html`;
      this.logger.log(`Navigating to ${url}`);
      
      const response = await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      if (!response.ok()) {
        throw new Error(`Failed to load page: ${response.status()}`);
      }

      // 等待一下确保页面加载
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 获取电影数据
      const movies = await page.evaluate(() => {
        const movieElements = document.querySelectorAll('.stui-vodlist__box');
        const movies = [];

        movieElements.forEach(element => {
          // 获取标题
          const titleElement = element.querySelector('.title.text-overflow a');
          const title = titleElement?.textContent?.trim() || '';
          
          // 获取演员信息
          const castElement = element.querySelector('.text.text-overflow.text-muted.hidden-xs');
          const castText = castElement?.textContent?.trim() || '';
          const cast = castText ? castText.split(',').map(name => name.trim()) : [];
          
          // 获取视频质量
          const qualityElement = element.querySelector('.pic-text.text-right');
          const quality = qualityElement?.textContent?.trim() || '';

          // 获取链接
          const link = titleElement?.getAttribute('href') || '';

          // 获取图片URL
          const imageElement = element.querySelector('.stui-vodlist__thumb.lazyload');
          const imageUrl = imageElement?.getAttribute('data-original') || '';
          
          if (title) {
            movies.push({
              title,
              quality,
              cast,
              link,
              poster: imageUrl,
              backdrop: imageUrl
            });
          }
        });

        return movies;
      });
      
      this.logger.log(`Found ${movies.length} movies on page ${pageNum}`);

      // 保存到数据库
      for (const movieData of movies) {
        try {
          // 生成随机年份 (2015-2025)
          const randomYear = Math.floor(Math.random() * (2025 - 2015 + 1)) + 2015;
          
          // 生成随机评分 (6.1-9.7)
          const randomRating = (Math.random() * (9.7 - 6.1) + 6.1).toFixed(1);

          // 生成默认分类
          const defaultGenres = ['动作', '剧情'];

          // 创建新电影记录
          const movieEntity = {
            title: movieData.title,
            description: '暂无描述',
            poster: movieData.poster ? `${this.baseUrl}${movieData.poster}` : '',
            backdrop: movieData.backdrop ? `${this.baseUrl}${movieData.backdrop}` : '',
            rating: parseFloat(randomRating),
            year: randomYear,
            genres: JSON.stringify(defaultGenres),
            type: MediaType.MOVIE,
            status: MediaStatus.RELEASED,
            cast:JSON.stringify(movieData.cast && movieData.cast.length > 0 ? movieData.cast : ['未知演员']),
            isImagesDownloaded: false,
            duration: 0,
            director: '',
            boxOffice: 0,
            views: 0,
            likes: 0,
            sourceUrl: movieData.link,
          } as any;

          // 保存电影基本信息
          const movie = this.mediaRepository.create(movieEntity);
          const savedMovie = await this.mediaRepository.save(movie);

          // 使用 AI 翻译服务翻译标题和描述
          const [englishTitle, englishDescription] = await Promise.all([
            this.aiTranslationService.translateToEnglish(movieData.title),
            this.aiTranslationService.translateToEnglish('暂无描述')
          ]);

          this.logger.log(`Translated title: ${movieData.title} -> ${englishTitle}`);

          // 使用新方法保存翻译
          await this.translationService.createTranslationsForNewMedia(savedMovie as unknown as Media, {
            title: {
              zh: movieData.title,
              en: englishTitle
            },
            description: {
              zh: '暂无描述',
              en: englishDescription
            }
          });

          this.logger.log(`Successfully saved movie "${movieData.title}" with translations`);
        } catch (error) {
          this.logger.error(`Failed to save movie "${movieData.title}": ${error.message}`);
        }
      }

      this.logger.log(`Successfully crawled page ${pageNum}, found ${movies.length} movies`);
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