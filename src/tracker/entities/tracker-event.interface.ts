export interface TrackerEventDto {
  event_id: string,
  event_time: string,
  user_id: string,
  session_id: string,
  properties: {
    url: string,
    referrer: string,
    screen_width: number,
    screen_height: number,
    viewport_width: number,
    viewport_height: number,
    language: string,
    user_agent: string,
    page_name: string,
    page_title: string,
    timestamp: string,
    lcp: number,
    fcp: number,
    ttfb: number,
    fid: number,
    performance_timestamp: number
  },
  sdk_version: string,
  app_id: string,
  module: string
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

