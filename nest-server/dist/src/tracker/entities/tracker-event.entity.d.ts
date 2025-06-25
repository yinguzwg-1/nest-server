export declare class TrackerEvent {
    id: number;
    event_id?: string;
    event_time?: Date;
    user_id?: string;
    session_id?: string;
    device_fingerprint?: string;
    properties?: {
        url?: string;
        referrer?: string;
        screen_width?: number;
        screen_height?: number;
        viewport_width?: number;
        viewport_height?: number;
        language?: string;
        user_agent?: string;
        page?: number;
    };
    sdk_version?: string;
    app_id?: string;
    created_at: Date;
    updated_at: Date;
}
