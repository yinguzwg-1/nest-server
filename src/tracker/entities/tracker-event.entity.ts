import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('tracker_events')
@Index(['event_id', 'user_id'])
@Index(['session_id'])
@Index(['event_time'])
export class TrackerEvent {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  event_id: string;
  @Column()
  event_time: string;
  @Column()
  user_id: string;
  @Column()
  session_id: string;
  @Column({type: 'json'})
  properties: {
    url: string;
    referrer: string;
    screen_width: number;
    screen_height: number;
    viewport_width: number;
    viewport_height: number;
    language: string;
    user_agent: string;
    page_name: string;
    page_title: string;
    timestamp: string;
    lcp: number;
    fcp: number;
    ttfb: number;
    fid: number;
    performance_timestamp: number
  };
  @Column()
  sdk_version: string;
  @Column()
  app_id: string;
  @Column()
  module: string;
}
