class EmailService {
    constructor() {
        this.emailQueue = [];
    }

    sendEmail(email) {
        // Simulate sending an email
        console.dir(email, { depth: null });
        // this.emailQueue.push(email);
    }

    getEmailQueue() {
        return this.emailQueue;
    }
}
const emailService = new EmailService();

module.exports = emailService;