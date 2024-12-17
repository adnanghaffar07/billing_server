import { dateFormatter } from "./dateFormatter.js";
import { getTimeZoneFromCoordinates } from "./googleFunctions.js";
import { sendSlackMessage } from "./slackConfig.js";

export const checkAndNotifyHighValueOrder = async (task) => {
    try {

        const locationCoordinates = task.destination.location;
        const formattedCoordinates = locationCoordinates.reverse().join(",");
        const getTimeZone = await getTimeZoneFromCoordinates(formattedCoordinates);
        const deliveryDate = new Date(task.completeBefore);
        const formattedDeliveryDate = dateFormatter(deliveryDate, getTimeZone);

        // Validate task object and its required properties
        if (!task) {
            console.log('Task object is missing');
            return;
        }

        if (!task.metadata || !Array.isArray(task.metadata)) {
            console.log('No metadata array found for high value check');
            return;
        }

        if (!task.recipients || !Array.isArray(task.recipients) || task.recipients.length === 0) {
            console.log('No recipients found in task');
            return;
        }

        // Safely extract and validate subtotal
        const subtotalMeta = task.metadata.find(meta => meta.name === 'order_subtotal');
        if (!subtotalMeta || !subtotalMeta.value) {
            console.log('No valid order_subtotal found in metadata');
            return;
        }

        const subtotal = parseFloat(subtotalMeta.value);
        if (isNaN(subtotal)) {
            console.log('Invalid subtotal value:', subtotalMeta.value);
            return;
        }

        console.log('Checking order value:', subtotal);

        if (subtotal > 750) {
            console.log('High value order detected:', subtotal);
            
            // Safely get business name with fallbacks
            let businessName;
            try {
                const merchantNameMeta = task.metadata.find(meta => meta.name === 'merchant_name');
                businessName = merchantNameMeta && merchantNameMeta.value 
                    ? merchantNameMeta.value 
                    : (task.recipients[0] && task.recipients[0].name 
                        ? task.recipients[0].name 
                        : 'Unknown Business');
            } catch (error) {
                console.log('Error extracting business name, using fallback:', error);
                businessName = 'Unknown Business';
            }

            // Ensure task shortId exists
            const taskId = task.shortId || 'Unknown Task ID';
            
            const highValueMessage = {
                text: "High Value Order Alert",
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "<!here>"
                        }
                    },
                    {
                        type: "divider"
                    },
                    {
                        type: "rich_text",
                        elements: [
                            {
                                type: "rich_text_section",
                                elements: [
                                    {
                                        type: "emoji",
                                        name: "money_with_wings",
                                        unicode: "1f4b8"
                                    },
                                    {
                                        type: "text",
                                        text: "  High Value Order Alert",
                                        style: {
                                            bold: true
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "rich_text",
                        elements: [
                            {
                                type: "rich_text_quote",
                                elements: [
                                    {
                                        type: "text",
                                        text: `Task ID: ${taskId}\nOrder Subtotal: $${subtotal.toFixed(2)}\nBusiness Name: ${businessName}\nDelivery Date: ${formattedDeliveryDate}`,
                                        style: {}
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "OnFleet Task Link",
                            verbatim: false,
                        },
                        accessory: {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "Open",
                                emoji: true,
                            },
                            url: `https://app.onfleet.com/dashboard#/manage?taskEdit=false&open=task&taskId=${task.id}`,
                        },
                    },
                    {
                        type: "divider"
                    },
                    {
                        type: "rich_text",
                        elements: [
                          {
                            type: "rich_text_section",
                            elements: [
                              {
                                type: "text",
                                text: `Note: For high-value orders, exercise extra caution when assigning drivers. Ensure the best possible driver is selected to minimize risks and ensure secure delivery.`,
                                style: {
                                  italic: true,
                                },
                              },
                            ],
                          },
                        ],
                      },
                      {
                        type: "divider",
                      },
                ]
            };

            const SLACK_CHANNEL = process.env.INTERNAL_CHANNEL_ID;

            try {
                await sendSlackMessage({
                    channel:SLACK_CHANNEL,
                    text: highValueMessage.text,
                    blocks: highValueMessage.blocks
                });
                console.log('High value notification sent successfully');
            } catch (slackError) {
                console.log('Error sending Slack notification:', slackError);
                // Continue execution - don't let Slack errors break the flow
            }
        }
    } catch (error) {
        console.log('Error in checkAndNotifyHighValueOrder:', error);
        // Don't throw the error - we want the server to continue running
    }
};
