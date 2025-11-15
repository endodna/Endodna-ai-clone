import {
    SESClient,
    SendEmailCommand,
    SendEmailCommandInput,
} from "@aws-sdk/client-ses";
import { logger } from "../logger.helper";
import aws from "../../lib/aws";

export interface SendEmailParams {
    from: string;
    to: string | string[];
    subject: string;
    htmlBody?: string;
    textBody?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string | string[];
    traceId?: string;
}

export interface SendEmailResult {
    messageId: string;
}

class SESHelper {
    private enableSES: boolean = true;

    private getSESClient(): SESClient {
        return aws.getSESClient();
    }

    async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
        const { from, to, subject, htmlBody, textBody, cc, bcc, replyTo, traceId } = params;

        if (!this.enableSES) {
            logger.debug("SES disabled, skipping email send", {
                traceId,
                from,
                to,
                subject,
                method: "SESHelper.sendEmail",
            });
            return {
                messageId: "mock-message-id",
            };
        }

        try {
            const toAddresses = Array.isArray(to) ? to : [to];
            const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
            const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;
            const replyToAddresses = replyTo ? (Array.isArray(replyTo) ? replyTo : [replyTo]) : undefined;

            if (!htmlBody && !textBody) {
                throw new Error("Either htmlBody or textBody must be provided");
            }

            logger.debug("Sending email via SES", {
                traceId,
                from,
                to: toAddresses,
                subject,
                hasHtml: !!htmlBody,
                hasText: !!textBody,
                method: "SESHelper.sendEmail",
            });

            const sesClient = this.getSESClient();

            const emailParams: SendEmailCommandInput = {
                Source: from,
                Destination: {
                    ToAddresses: toAddresses,
                    CcAddresses: ccAddresses,
                    BccAddresses: bccAddresses,
                },
                Message: {
                    Subject: {
                        Data: subject,
                        Charset: "UTF-8",
                    },
                    Body: {
                        ...(htmlBody && {
                            Html: {
                                Data: htmlBody,
                                Charset: "UTF-8",
                            },
                        }),
                        ...(textBody && {
                            Text: {
                                Data: textBody,
                                Charset: "UTF-8",
                            },
                        }),
                    },
                },
                ...(replyToAddresses && {
                    ReplyToAddresses: replyToAddresses,
                }),
            };

            const command = new SendEmailCommand(emailParams);
            const response = await sesClient.send(command);

            logger.info("Email sent successfully via SES", {
                traceId,
                from,
                to: toAddresses,
                subject,
                messageId: response.MessageId,
                method: "SESHelper.sendEmail",
            });

            return {
                messageId: response.MessageId || "",
            };
        } catch (error) {
            logger.error("Failed to send email via SES", {
                traceId,
                from,
                to,
                subject,
                error: error,
                method: "SESHelper.sendEmail",
            });
            throw error;
        }
    }
}

export const sesHelper = new SESHelper();
export default sesHelper;

