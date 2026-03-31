const { Queue } = require('bullmq');
const Redis = require('ioredis');
const config = require('../../cmd/api/config');

class QueueManager {
    constructor(queueName) {
        this.queueName = queueName;
        // Instantiate the BullMQ Queue with its own encapsulated connection
        this.queue = new Queue(this.queueName, {
            connection: this.createRedisConnection()
        });
    }

    /**
     * Factory method for Redis connections.
     * BullMQ requires maxRetriesPerRequest to be null.
     */
    createRedisConnection() {
        return new Redis(config.redis.url, config.redis.options);
    }

    /**
     * Adds a new job to the queue.
     */
    async addDocumentJob(jobData) {
        return await this.queue.add('process-pdf', jobData, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        });
    }

    /**
     * Safely closes the queue connection.
     */
    async close() {
        await this.queue.close();
    }
}

// Export a singleton instance for your document processing
const documentQueue = new QueueManager('document-processing');
module.exports = documentQueue;