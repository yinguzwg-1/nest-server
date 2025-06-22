"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const puppeteer = require("puppeteer");
const entities_1 = require("../../media/entities");
const types_1 = require("../../media/types");
const entities_2 = require("../../translation/entities");
const service_1 = require("../../translation/service");
let CrawlerService = CrawlerService_1 = class CrawlerService {
    constructor(mediaRepository, translationService) {
        this.mediaRepository = mediaRepository;
        this.translationService = translationService;
        this.logger = new common_1.Logger(CrawlerService_1.name);
        this.baseUrl = 'https://www.cun6.com';
    }
    async crawlMovieList(pageNum = 1) {
        let browser;
        try {
            this.logger.log(`Starting to crawl page ${pageNum}`);
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
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            });
            const url = `${this.baseUrl}/tag/${pageNum}.html`;
            this.logger.log(`Navigating to ${url}`);
            const response = await page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: 30000,
            });
            if (!response.ok()) {
                throw new Error(`Failed to load page: ${response.status()}`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            const movies = await page.evaluate(() => {
                const movieElements = document.querySelectorAll('.stui-vodlist__box');
                const movies = [];
                movieElements.forEach(element => {
                    const titleElement = element.querySelector('.title.text-overflow a');
                    const title = titleElement?.textContent?.trim() || '';
                    const castElement = element.querySelector('.text.text-overflow.text-muted.hidden-xs');
                    const castText = castElement?.textContent?.trim() || '';
                    const cast = castText ? castText.split(',').map(name => name.trim()) : [];
                    const qualityElement = element.querySelector('.pic-text.text-right');
                    const quality = qualityElement?.textContent?.trim() || '';
                    const link = titleElement?.getAttribute('href') || '';
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
            for (const movieData of movies) {
                const randomYear = Math.floor(Math.random() * (2025 - 2015 + 1)) + 2015;
                const randomRating = (Math.random() * (9.7 - 6.1) + 6.1).toFixed(1);
                const movieEntity = {
                    title: movieData.title,
                    description: '暂无描述',
                    poster: movieData.poster ? `${this.baseUrl}${movieData.poster}` : '',
                    backdrop: movieData.backdrop ? `${this.baseUrl}${movieData.backdrop}` : '',
                    rating: parseFloat(randomRating),
                    year: randomYear,
                    genres: [],
                    type: types_1.MediaType.MOVIE,
                    status: types_1.MediaStatus.RELEASED,
                    cast: movieData.cast || [],
                    isImagesDownloaded: false,
                    duration: 0,
                    director: '',
                    boxOffice: 0,
                    views: 0,
                    likes: 0,
                    sourceUrl: movieData.link,
                };
                const movie = this.mediaRepository.create(movieEntity);
                const savedMovie = await this.mediaRepository.save(movie);
                await this.translationService.setTranslations(savedMovie.id, entities_2.TranslationField.TITLE, {
                    zh: movieData.title,
                    en: movieData.title
                });
                await this.translationService.setTranslations(savedMovie.id, entities_2.TranslationField.DESCRIPTION, {
                    zh: '暂无描述',
                    en: 'No description available'
                });
                this.logger.log(`Successfully saved movie "${movieData.title}"`);
            }
            this.logger.log(`Successfully crawled page ${pageNum}, found ${movies.length} movies`);
        }
        catch (error) {
            this.logger.error(`Failed to crawl page ${pageNum}: ${error.message}`);
            throw error;
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Media)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        service_1.TranslationService])
], CrawlerService);
//# sourceMappingURL=index.js.map