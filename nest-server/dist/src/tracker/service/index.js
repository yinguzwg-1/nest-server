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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let TrackerService = class TrackerService {
    constructor(trackerRepository) {
        this.trackerRepository = trackerRepository;
    }
    async createEvent(eventDto) {
        try {
            const event = this.trackerRepository.create({
                ...eventDto,
                event_time: new Date(eventDto.event_time),
            });
            const savedEvent = await this.trackerRepository.save(event);
            return savedEvent;
        }
        catch (error) {
            throw new Error(`创建事件失败: ${error.message}`);
        }
    }
    async createBatchEvents(eventsDto) {
        try {
            const events = eventsDto.map(eventDto => this.trackerRepository.create({
                ...eventDto,
                event_time: new Date(eventDto.event_time),
            }));
            const savedEvents = await this.trackerRepository.save(events);
            return savedEvents;
        }
        catch (error) {
            throw new Error(`批量创建事件失败: ${error.message}`);
        }
    }
    async getEventsByUserId(userId, limit = 100) {
        return this.trackerRepository.find({
            where: { user_id: userId },
            order: { event_time: 'DESC' },
            take: limit,
        });
    }
    async getEventsBySessionId(sessionId) {
        return this.trackerRepository.find({
            where: { session_id: sessionId },
            order: { event_time: 'ASC' },
        });
    }
    async getEventStats(timeRange = '24h') {
        const now = new Date();
        let startTime;
        switch (timeRange) {
            case '1h':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        const stats = await this.trackerRepository
            .createQueryBuilder('event')
            .select([
            'event.event_id as event_id',
            'COUNT(*) as event_count',
            'COUNT(DISTINCT event.user_id) as unique_users',
            'COUNT(DISTINCT event.session_id) as unique_sessions'
        ])
            .where('event.event_time >= :startTime', { startTime })
            .groupBy('event.event_id')
            .orderBy('event_count', 'DESC')
            .getRawMany();
        return stats;
    }
};
exports.TrackerService = TrackerService;
exports.TrackerService = TrackerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TrackerEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TrackerService);
//# sourceMappingURL=index.js.map