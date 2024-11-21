import { slack, sendSlackMessage } from "../utils/slackConfig.js";
import dotenv from "dotenv";

dotenv.config();

export const handleSlackInteractions = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    const { type, user, actions, container, response_url } = payload;

    if (type !== "block_actions") {
      return res.status(400).json({ message: "Unsupported interaction type" });
    }

    const action = actions[0];
    const { action_id, value: taskId } = action;

    switch (action_id) {
      case "assign_task":
        // Update the message to show user info and unassign button
        const newMessage = {
          text: `Task assigned to ${user.name}`,
          blocks: [
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
              },
              accessory: {
                type: "image",
                image_url: user.profile.image_72,
                alt_text: user.name
              }
            },
            {
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
            }
          ]
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

        // Update the message back to original state
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

    res.status(200).json({ message: "Interaction handled successfully" });
  } catch (error) {
    console.error("Error handling Slack interaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
