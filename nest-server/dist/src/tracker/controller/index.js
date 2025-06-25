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
var TrackerController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackerController = void 0;
const common_1 = require("@nestjs/common");
const service_1 = require("../service");
let TrackerController = TrackerController_1 = class TrackerController {
    constructor(trackerService) {
        this.trackerService = trackerService;
        this.logger = new common_1.Logger(TrackerController_1.name);
    }
    async trackBatchEvents(eventsDto) {
        try {
            const results = await this.trackerService.createBatchEvents(eventsDto);
            return {
                success: true,
                message: `批量事件追踪成功，共处理 ${results.length} 条事件`,
                data: {
                    processed_count: results.length,
                    events: results.map(result => ({
                        event_id: result.event_id,
                        user_id: result.user_id,
                        session_id: result.session_id,
                        event_time: result.event_time
                    }))
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `批量事件追踪失败: ${error.message}`,
                data: null
            };
        }
    }
};
exports.TrackerController = TrackerController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], TrackerController.prototype, "trackBatchEvents", null);
exports.TrackerController = TrackerController = TrackerController_1 = __decorate([
    (0, common_1.Controller)('events'),
    __metadata("design:paramtypes", [service_1.TrackerService])
], TrackerController);
//# sourceMappingURL=index.js.map