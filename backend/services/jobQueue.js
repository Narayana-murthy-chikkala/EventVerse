const EventEmitter = require('events');
const { sendTicketEmail, sendEmail } = require('../utils/sendEmail');

/**
 * EventVerse Asynchronous Job Queue
 * Implements decoupled background job execution using an EventEmitter queue.
 * Offloads SMTP email dispatch and heavy operations away from the HTTP critical path.
 */
class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 2;

    this.on('job_added', () => {
      this.processNext();
    });
  }

  /**
   * Enqueue a new background job
   * @param {string} jobType - Name of the job e.g. 'SEND_TICKET_EMAIL'
   * @param {object} payload - Job data
   */
  enqueue(jobType, payload) {
    const job = {
      id: `${jobType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: jobType,
      payload,
      attempts: 0,
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.emit('job_added');
    return job.id;
  }

  /**
   * Process jobs sequentially from the queue
   */
  async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      job.attempts++;
      await this.executeJob(job);
    } catch (err) {
      console.error(`❌ [JobQueue] Error executing ${job.type} (${job.id}):`, err.message);

      if (job.attempts <= this.maxRetries) {
        console.log(`🔁 [JobQueue] Retrying ${job.type} (attempt ${job.attempts + 1}/${this.maxRetries + 1})...`);
        this.queue.push(job);
      } else {
        console.error(`🚨 [JobQueue] Job ${job.id} failed permanently after ${job.attempts} attempts.`);
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  /**
   * Worker handler router
   */
  async executeJob(job) {
    switch (job.type) {
      case 'SEND_TICKET_EMAIL': {
        const { to, name, eventTitle, eventDate, eventVenue, qrCodeDataUrl } = job.payload;
        await sendTicketEmail({
          to,
          name,
          eventTitle,
          eventDate,
          eventVenue,
          qrCodeDataUrl,
        });
        console.log(`📨 [JobQueue] Background ticket email delivered successfully to ${to}`);
        break;
      }

      case 'SEND_GENERIC_EMAIL': {
        const { to, subject, html, text } = job.payload;
        await sendEmail({ to, subject, html, text });
        console.log(`📨 [JobQueue] Generic email dispatched to ${to}`);
        break;
      }

      default:
        console.warn(`⚠️ [JobQueue] Unknown job type: ${job.type}`);
    }
  }

  /**
   * Queue diagnostics
   */
  getStatus() {
    return {
      pendingJobs: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }
}

module.exports = new JobQueue();
