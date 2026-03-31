const { Worker } = require('bullmq');
const Redis = require('ioredis');
const config = require('../../cmd/api/config');
const RagProcessor = require('../services/ragProcessor');

class DocumentWorker {
    constructor(queueName) {
        this.queueName = queueName;
        this.worker = null;
    }

    createRedisConnection() {
        return new Redis(config.redis.url, config.redis.options);
    }

    /**
     * Initializes the worker and starts listening for jobs.
     */
    start() {
        console.log(`Worker started for queue: ${this.queueName}...`);
        
        this.worker = new Worker(this.queueName, async (job) => {
            await this.processJob(job);
        }, { 
            // The worker gets its own fresh connection here!
            connection: this.createRedisConnection(),
            concurrency: 3 
        });

        this.setupListeners();
    }

    /**
     * The core execution logic.
     */
    async processJob(job) {
        const { filePath, docId, userId } = job.data;
        console.log(`[Worker] Picked up job ${job.id} for document ${docId}`);
        
        const processor = new RagProcessor();
        await processor.process(filePath, docId, userId);
        
        console.log(`[Worker] Completed job ${job.id}`);
    }

    /**
     * Attaches error and failure listeners.
     */
    setupListeners() {
        this.worker.on('failed', (job, err) => {
            console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
        });

        this.worker.on('error', (err) => {
            console.error(`[Worker] Internal BullMQ error:`, err.message);
        });
    }

    /**
     * Safely shuts down the worker.
     */
    async close() {
        if (this.worker) {
            await this.worker.close();
        }
    }
}

// Export a singleton instance
const documentWorker = new DocumentWorker('document-processing');
module.exports = documentWorker;