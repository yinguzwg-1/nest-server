import { Repository } from 'typeorm';
import { TrackerEvent, TrackerEventDto } from '../entities';
export declare class TrackerService {
    private readonly trackerRepository;
    constructor(trackerRepository: Repository<TrackerEvent>);
    createEvent(eventDto: TrackerEventDto): Promise<TrackerEvent>;
    createBatchEvents(eventsDto: TrackerEventDto[]): Promise<TrackerEvent[]>;
    getEventsByUserId(userId: string, limit?: number): Promise<TrackerEvent[]>;
    getEventsBySessionId(sessionId: string): Promise<TrackerEvent[]>;
    getEventStats(timeRange?: string): Promise<any>;
}
