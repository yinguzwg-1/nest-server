import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('tracker_events')
@Index(['event_id', 'user_id'])
@Index(['session_id'])
@Index(['event_time'])
export class TrackerEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  event_id?: string;

  @Column({ type: 'timestamp', nullable: true })
  event_time?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  user_id?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  session_id?: string;

  @Column({ type: 'text', nullable: true })
  device_fingerprint?: string;

  @Column({ type: 'json', nullable: true })
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

  @Column({ type: 'varchar', length: 20, nullable: true })
  sdk_version?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  app_id?: string;

  @CreateDateColumn()
  created_at: Date;

  @CreateDateColumn()
  updated_at: Date;
} 