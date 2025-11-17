import sesHelper, { SendEmailResult } from "./aws/ses.helper";
import { logger } from "./logger.helper";

export interface EmailOptions {
    to: string | string[];
    subject: string;
    htmlBody?: string;
    textBody?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string | string[];
    from?: string;
    traceId?: string;
}

class EmailHelper {
    private readonly DEFAULT_FROM_EMAIL = "noreply@bios.med";
    private readonly DEFAULT_REPLY_TO = "support@bios.med";
    public adminEmails: string[] = ["samuel@endodna.com", "andres@endodna.com"];

    async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
        const { to, subject, htmlBody, textBody, cc, bcc, replyTo, from, traceId } = options;

        try {
            return await sesHelper.sendEmail({
                from: from || this.DEFAULT_FROM_EMAIL,
                to,
                subject,
                htmlBody,
                textBody,
                cc,
                bcc,
                replyTo: replyTo || this.DEFAULT_REPLY_TO,
                traceId,
            });
        } catch (error) {
            logger.error("Failed to send email", {
                traceId,
                to,
                subject,
                error: error,
                method: "EmailHelper.sendEmail",
            });
            throw error;
        }
    }

    async sendNotificationEmail(
        to: string | string[],
        title: string,
        message: string,
        actionUrl?: string,
        actionText?: string,
        traceId?: string,
    ): Promise<SendEmailResult> {
        const subject = title;
        const htmlBody = this.getNotificationEmailTemplate(title, message, actionUrl, actionText);
        const textBody = this.getNotificationEmailTextTemplate(title, message, actionUrl, actionText);

        return this.sendEmail({
            to,
            subject,
            htmlBody,
            textBody,
            traceId,
        });
    }

    // Email templates
    private getNotificationEmailTemplate(
        title: string,
        message: string,
        actionUrl?: string,
        actionText?: string,
    ): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #9C27B0; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="content">
            <p>${message}</p>
            ${actionUrl && actionText ? `
            <p style="text-align: center;">
                <a href="${actionUrl}" class="button">${actionText}</a>
            </p>
            ` : ""}
            <p>Best regards,<br>The BiosAI Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} BiosAI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    private getNotificationEmailTextTemplate(
        title: string,
        message: string,
        actionUrl?: string,
        actionText?: string,
    ): string {
        return `
${title}

${message}

${actionUrl && actionText ? `${actionText}: ${actionUrl}` : ""}

Best regards,
The BiosAI Team
        `.trim();
    }

}

export const emailHelper = new EmailHelper();
export default emailHelper;

