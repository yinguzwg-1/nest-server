export declare class TrackerPropertiesDto {
    url?: string;
    referrer?: string;
    screen_width?: number;
    screen_height?: number;
    viewport_width?: number;
    viewport_height?: number;
    language?: string;
    user_agent?: string;
    page?: number;
}
export declare class TrackerEventDto {
    event_id?: string;
    event_time?: string;
    user_id?: string;
    session_id?: string;
    device_fingerprint?: string;
    properties?: TrackerPropertiesDto;
    sdk_version?: string;
    app_id?: string;
}
