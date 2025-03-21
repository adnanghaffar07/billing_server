import { sendSlackMessage } from "./slackConfig.js";

export const altoPickupCreated = async(task) => {

    console.log('Processing Alto pickup task:', task);
    const taskShortId = task.shortId;
    const taskId = task.id;
    const metadata = task.metadata;

    // Check if this is a pickup task and if it's related to Alto
    if (task.pickupTask === true) {
        // Find if Alto is in the metadata
        const isAltoTask = metadata && metadata.some(item => 
            (item.name === "nash_customer_name" && item.value === "Alto") || 
            (item.name && item.name.toLowerCase().includes("alto"))
        );

        if (isAltoTask) {
            // Create Alto pickup Slack alert
            const altoPickupMessage = {
                text: `⚠️ ALTO PICKUP ALERT: Task ${taskShortId}`,
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "<!here>"
                        }
                    },
                    {
                        type: "divider",
                    },
                    {
                        type: "rich_text",
                        elements: [
                            {
                                type: "rich_text_section",
                                elements: [
                                    {
                                        "type": "emoji",
                                        "name": "rotating_light",
                                        "unicode": "1f6a8"
                                    },
                                    {
                                        type: "text",
                                        text: `  new Alto Route just created - Please Assign ASAP`,
                                        style: {
                                            bold: true,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: "rich_text",
                        elements: [
                            {
                                type: "rich_text_quote",
                                elements: [
                                    {
                                        type: "text",
                                        text: `Task ShortId: ${taskShortId}\nPharmacy Name: ${task.destination.address.name}`,
                                        style: {},
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "Alto Task Link",
                            verbatim: false,
                        },
                        accessory: {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "Open",
                                emoji: true,
                            },
                            url: `https://app.onfleet.com/dashboard#/manage?taskEdit=false&open=task&taskId=${taskId}`,
                        },
                    },
                    {
                        type: "divider",
                    }
                ],
            };
            
            try {
                // Send Alto pickup Slack notification
                await sendSlackMessage({
                    channel: "C086N4LGESF",
                    text: altoPickupMessage.text,
                    blocks: altoPickupMessage.blocks,
                });
                console.log(`Alto pickup alert sent for task ${taskShortId}`);
            } catch (error) {
                console.error('Error sending Alto pickup Slack alert:', error);
            }
        }
    }
    
}