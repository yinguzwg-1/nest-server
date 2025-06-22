import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { Media } from '../../media/entities';
import { MediaType, MediaStatus } from '../../media/types';
import { Translation, TranslationField } from '../../translation/entities';
import { TranslationService } from '../../translation/service';

interface MovieData {
  title: string;
  quality: string;
  cast: string[];
  link: string;
  poster: string;
  backdrop: string;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly baseUrl = 'https://www.cun6.com';

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly translationService: TranslationService,
  ) {}

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
        // 生成随机年份 (2015-2025)
        const randomYear = Math.floor(Math.random() * (2025 - 2015 + 1)) + 2015;
        
        // 生成随机评分 (6.1-9.7)
        const randomRating = (Math.random() * (9.7 - 6.1) + 6.1).toFixed(1);

        // 创建新电影记录
        const movieEntity = {
          title: movieData.title, // 使用中文标题作为默认标题
          description: '暂无描述', // 使用中文描述作为默认描述
          poster: movieData.poster ? `${this.baseUrl}${movieData.poster}` : '',
          backdrop: movieData.backdrop ? `${this.baseUrl}${movieData.backdrop}` : '',
          rating: parseFloat(randomRating),
          year: randomYear,
          genres: [],
          type: MediaType.MOVIE,
          status: MediaStatus.RELEASED,
          cast: movieData.cast || [],
          isImagesDownloaded: false,
          duration: 0,
          director: '',
          boxOffice: 0,
          views: 0,
          likes: 0,
          sourceUrl: movieData.link,
        } as Partial<Media>;

        const movie = this.mediaRepository.create(movieEntity);
        const savedMovie = await this.mediaRepository.save(movie);

        // 保存翻译
        await this.translationService.setTranslations(savedMovie.id, TranslationField.TITLE, {
          zh: movieData.title,
          en: movieData.title // 暂时使用中文标题作为英文标题
        });

        await this.translationService.setTranslations(savedMovie.id, TranslationField.DESCRIPTION, {
          zh: '暂无描述',
          en: 'No description available'
        });

        this.logger.log(`Successfully saved movie "${movieData.title}"`);
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