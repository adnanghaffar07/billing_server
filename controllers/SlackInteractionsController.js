import { slack, sendSlackMessage } from "../utils/slackConfig.js";
import dotenv from "dotenv";
import { sendErrorWebhook } from "../utils/webhookUtils.js";

dotenv.config();

export const handleSlackInteractions = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    const { type, user, actions, container, response_url } = payload;

    console.log(JSON.stringify(payload, null, 2), "This is payload");

    if (type !== "block_actions") {
      return res.status(400).json({ message: "Unsupported interaction type" });
    }

    const action = actions[0];
    const { action_id, value: taskId } = action;

    switch (action_id) {
      case "assign_task":
        // Verify user data exists
        if (!user || !user.id || !user.name) {
          throw new Error('Invalid user data in payload');
        }

        // Create blocks for the message
        const blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Task Assignment*"
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Assigned to:* <@${user.id}>`
            }
          }
        ];

        // Add profile image if available
        if (user.profile?.image_72) {
          blocks[1].accessory = {
            type: "image",
            image_url: user.profile.image_72,
            alt_text: user.name
          };
        }

        // Add unassign button
        blocks.push({
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Unassign",
                emoji: true
              },
              style: "danger",
              value: taskId,
              action_id: "unassign_task"
            }
          ]
        });

        const newMessage = {
          text: `Task assigned to ${user.name}`,
          blocks: blocks
        };

        // Update the original message
        await slack.chat.update({
          channel: container.channel_id,
          ts: container.message_ts,
          text: newMessage.text,
          blocks: newMessage.blocks
        });
        break;

      case "unassign_task":
        // Restore the original assign button
        const resetMessage = {
          text: "Task available for assignment",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*Task Assignment*"
              }
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Assign to me",
                    emoji: true
                  },
                  style: "primary",
                  value: taskId,
                  action_id: "assign_task"
                }
              ]
            }
          ]
        };

        // Update the message
        await slack.chat.update({
          channel: container.channel_id,
          ts: container.message_ts,
          text: resetMessage.text,
          blocks: resetMessage.blocks
        });
        break;

      default:
        return res.status(400).json({ message: "Unsupported action" });
    }

    res.status(200).json({ message: "Action processed successfully" });
  } catch (error) {
    console.error("Error handling Slack interaction:", error);
    await sendErrorWebhook(`Slack Interaction Error: ${error.message}`);
    
    // Send a response to Slack to acknowledge the interaction
    res.status(200).json({
      response_type: "ephemeral",
      text: "Sorry, there was an error processing your request. Our team has been notified."
    });
  }
};
