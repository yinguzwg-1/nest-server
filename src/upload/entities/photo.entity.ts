import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('photos')
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string; // 存储图片路径

  @Column({ nullable: true })
  title: string;

  // 从 EXIF 提取的元数据
  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ nullable: true })
  make: string; // 生产商

  @Column({ nullable: true })
  model: string; // 型号

  @Column({ nullable: true })
  exposureTime: string; // 曝光时间

  @Column({ nullable: true })
  fNumber: string; // 光圈

  @Column({ nullable: true })
  iso: number; // ISO

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ nullable: true })
  liveVideoUrl: string; // Live Photo 配对视频路径

  @Column({ type: 'datetime', nullable: true })
  takenAt: Date; // 拍摄时间（从 EXIF 提取，无则用上传时间）

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

