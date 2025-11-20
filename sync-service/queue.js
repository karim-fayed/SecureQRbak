import PQueue from "p-queue";
import winston from "winston";

export const queue = new PQueue({ concurrency: 1 });

export const logger = winston.createLogger({
    transports: [new winston.transports.Console()]
});

export function enqueue(task, description) {
    queue.add(task).catch(err => {
        logger.error(`❌ Queue Job Failed: ${description}`, err);
    });
}
