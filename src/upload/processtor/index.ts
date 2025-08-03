import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { UploadService } from '../service';

@Processor('file-merge-queue')
export class FileMergeProcessor {
  constructor(private readonly uploadService: UploadService) { }

  @Process('merge-file')
  async handleMerge(job: Job<{ fileId: string, belongId: string }>) {
    const { fileId, belongId } = job.data;
    await this.uploadService.mergeChunks(fileId, belongId);
  }
}