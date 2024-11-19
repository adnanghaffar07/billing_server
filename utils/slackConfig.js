import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Slack WebClient
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Common Slack message sending function
const sendSlackMessage = async ({ channel = process.env.SLACK_CHANNEL_ID, text, blocks }) => {
    try {
        const result = await slack.chat.postMessage({
            channel,
            text,
            blocks
        });
        return result;
    } catch (error) {
        console.error('Error sending Slack message:', error);
        throw error;
    }
};

// Function to create formatted task deletion message
const createTaskDeletionMessage = ({ taskShortId, adminName, recipientName, recipientAddress }) => {
    return {
        text: `Task ${taskShortId} deleted by ${adminName}`,
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Task Deleted*\n*ID:* ${taskShortId}\n*Admin:* ${adminName}\n*Recipient:* ${recipientName}\n*Address:* ${recipientAddress}`
                }
            }
        ]
    };
};

export { slack, sendSlackMessage, createTaskDeletionMessage };
