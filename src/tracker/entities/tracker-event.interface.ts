export interface TrackerEventDto {
  event_id?: string;
  event_time?: Date;
  user_id?: string;
  session_id?: string;
  device_fingerprint?: string;
  properties?: {
    url?: string;
    route?: string;
    language?: string;
    page_url?: string;
    referrer?: string;
    module_id?: string;
    timestamp?: string;
    user_agent?: string;
    screen_width?: number;
    screen_height?: number;
    module_name?: string;
  };
  sdk_version?: string;
  app_id?: string;
}

export interface ModuleStats {
  name: string;
  id: string;
  count: number;
  routes: string[];
}

export interface DeviceStats {
  web: number;
  mobile: number;
  unknown: number;
}

export interface ITrackerEventResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface UserEventsResponse {
  events: any[];
  total: number;
  hasMore: boolean;
  stats: {
    totalEvents: number;
    uniqueSessions: number;
    todayEvents: number;
    moduleStats: ModuleStats[];
    deviceStats: DeviceStats;
    uniqueUsers: number;
  };
}

