import { Queue, Worker } from "bullmq";

const connection = {
  host: new URL(process.env.REDIS_URL!).hostname,
  port: parseInt(new URL(process.env.REDIS_URL!).port),
  password: new URL(process.env.REDIS_URL!).password.replace(":", ""),
};

export const uploadQueue = new Queue("upload", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

export const compressionQueue = new Queue("compression", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const archiveQueue = new Queue("archive", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
  },
});

export interface UploadJobData {
  clipId: string;
  userId: string;
  r2Key: string;
  fileName: string;
  fileSize: number;
}

export interface CompressionJobData {
  clipId: string;
  originalKey: string;
  resolution: number;
  fps: number;
  maxDuration: number;
}

export interface ArchiveJobData {
  clipIds: string[];
  reason: string;
}

export function createWorker(
  queueName: string,
  processor: (jobData: unknown) => Promise<void>
) {
  return new Worker(
    queueName,
    async (job) => {
      await processor(job.data);
    },
    { connection }
  );
}
