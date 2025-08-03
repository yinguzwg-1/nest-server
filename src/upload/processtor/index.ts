import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { UploadService } from '../service';

@Processor('file-merge-queue')
export class FileMergeProcessor {
  constructor(private readonly uploadService: UploadService) { }

  @Process('merge-file')
  async handleMerge(job: Job<{ fileId: string }>) {
    const { fileId } = job.data;
    await this.uploadService.mergeChunks(fileId);
  }
}