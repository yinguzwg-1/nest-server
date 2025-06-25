import { TrackerService } from '../service';
import { TrackerEventDto, ITrackerEventResponse } from '../entities';
export declare class TrackerController {
    private readonly trackerService;
    private readonly logger;
    constructor(trackerService: TrackerService);
    trackBatchEvents(eventsDto: TrackerEventDto[]): Promise<ITrackerEventResponse>;
}
