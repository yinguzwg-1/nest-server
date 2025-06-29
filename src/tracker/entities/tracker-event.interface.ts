export interface ITrackerProperties {
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

export interface ITrackerEvent {
  event_id?: string;
  event_time?: string;
  user_id?: string;
  session_id?: string;
  device_fingerprint?: string;
  properties?: ITrackerProperties;
  sdk_version?: string;
  app_id?: string;
}

export interface ITrackerEventResponse {
  success: boolean;
  message: string;
  data?: any;
}
