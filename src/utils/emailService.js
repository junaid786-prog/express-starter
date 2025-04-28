const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const sgMail = require('@sendgrid/mail');
const CONFIG = require('../config/config');
const logger = require('../config/logger');

class EmailService {
    constructor() {
        this.emailQueue = [];
        this.templateCache = new Map();
        this.templateDir = path.join(process.cwd(), 'src', 'templates');

        // Initialize SendGrid with API key
        if (CONFIG.EMAIL_PASS) {
            logger.info('Initializing SendGrid with API key');

            sgMail.setApiKey(CONFIG.EMAIL_PASS);
        } else {
            console.error('SendGrid API key missing or invalid email service configuration');
        }
    }

    /**
     * Load an email template from the filesystem
     * @param {string} templateKey - Template name (same as file name without extension)
     * @returns {Promise<string>} The template content
     */
    async loadTemplate(templateKey) {
        // Check if template is already cached
        if (this.templateCache.has(templateKey)) {
            return this.templateCache.get(templateKey);
        }

        try {
            // Attempt to load the template file
            const templatePath = path.join(this.templateDir, `${templateKey}.html`);
            const template = await readFileAsync(templatePath, 'utf8');

            // Cache the template for future use
            this.templateCache.set(templateKey, template);
            return template;
        } catch (error) {
            throw new Error(`Failed to load email template: ${templateKey}. ${error.message}`);
        }
    }

    /**
     * Replace placeholders in template with actual values
     * @param {string} template - Email template with placeholders
     * @param {Object} data - Data to replace placeholders
     * @returns {string} Processed template
     */
    processTemplate(template, data) {
        let processedTemplate = template;

        // Replace all {{key}} placeholders with corresponding values
        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            processedTemplate = processedTemplate.replace(placeholder, value);
        }

        return processedTemplate;
    }

    /**
     * Send an email using a template
     * @param {Object} options - Email options
     * @param {string} options.to - Recipient email address
     * @param {string} options.subject - Email subject
     * @param {string} options.templateKey - Template key to use
     * @param {Object} options.data - Data for template processing
     * @param {string} [options.from] - Sender email (defaults to EMAIL_FROM env var)
     * @param {Array} [options.attachments] - Optional attachments
     * @param {Object} [options.cc] - Optional cc recipients
     * @param {Object} [options.bcc] - Optional bcc recipients
     * @returns {Promise<Object>} Result of the send operation
     */
    async sendEmail({ to, subject, templateKey, data, from = CONFIG.EMAIL_FROM, attachments, cc, bcc }) {
        try {
            // Load and process the template
            const template = await this.loadTemplate(templateKey);
            const htmlContent = this.processTemplate(template, data);

            // Create the email message
            const msg = {
                to,
                from,
                subject,
                html: htmlContent,
            };

            // Add optional fields if provided
            if (attachments && attachments.length > 0) {
                msg.attachments = attachments;
            }

            if (cc) msg.cc = cc;
            if (bcc) msg.bcc = bcc;

            // // Record email in queue for tracking/debugging
            // this.emailQueue.push({
            //     timestamp: new Date(),
            //     recipient: to,
            //     subject,
            //     templateKey
            // });

            // Send the email via SendGrid
            const result = await sgMail.send(msg);
            console.log(`Email sent to ${to} using template ${templateKey}`);
            
            return result;
        } catch (error) {
            console.dir(error, { depth: null });

            console.error(`Failed to send email: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get the email queue for monitoring/debugging
     * @returns {Array} The email queue
     */
    getEmailQueue() {
        return this.emailQueue;
    }

    /**
     * Clear the template cache
     */
    clearTemplateCache() {
        this.templateCache.clear();
    }
}

// Create and export a singleton instance
const emailService = new EmailService();
module.exports = emailService;