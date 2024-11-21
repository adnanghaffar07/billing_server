import { slack, sendSlackMessage } from "../utils/slackConfig.js";
import dotenv from "dotenv";
import { sendErrorWebhook } from "../utils/webhookUtils.js";

dotenv.config();

export const handleSlackInteractions = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    const { type, user, actions, container, message } = payload;

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

        // Keep all blocks until the last divider
        const lastDividerIndex = message.blocks
          .map((block, index) => block.type === "divider" ? index : -1)
          .filter(index => index !== -1)
          .pop();

        if (lastDividerIndex === -1) {
          throw new Error('Message structure is invalid');
        }

        // Keep only the blocks before the last divider
        const newBlocks = message.blocks.slice(0, lastDividerIndex + 1);

        // Get current timestamp in a readable format
        const timestamp = new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });

        // Create assignment section
        const assignmentSection = {
          type: "rich_text",
          block_id: `assign_${Date.now()}`,
          elements: [
            {
              type: "rich_text_section",
              elements: [
                {
                  type: "text",
                  text: "👤 Currently assigned to: ",
                  style: {
                    bold: true
                  }
                },
                {
                  type: "user",
                  user_id: user.id
                }
              ]
            }
          ]
        };

        // Create history section if it doesn't exist or get existing one
        let historySection = message.blocks.find(block => 
          block.type === "rich_text" && 
          block.block_id?.startsWith('history_')
        );

        if (!historySection) {
          historySection = {
            type: "rich_text",
            block_id: `history_${Date.now()}`,
            elements: [
              {
                type: "rich_text_section",
                elements: [
                  {
                    type: "text",
                    text: "📝 Assignment History:\n",
                    style: {
                      bold: true
                    }
                  }
                ]
              }
            ]
          };
        }

        // Add new assignment to history
        historySection.elements[0].elements.push(
          {
            type: "text",
            text: `\n${timestamp} - Assigned to `
          },
          {
            type: "user",
            user_id: user.id
          }
        );

        // Create unassign button
        const unassignButton = {
          type: "actions",
          block_id: `unassign_${Date.now()}`,
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
        };

        // Add all sections
        newBlocks.push(
          assignmentSection,
          unassignButton,
          {
            type: "divider",
            block_id: `div_history_${Date.now()}`
          },
          historySection
        );

        // Update the message
        await slack.chat.update({
          channel: container.channel_id,
          ts: container.message_ts,
          blocks: newBlocks,
          text: message.text
        });
        break;

      case "unassign_task":
        // Keep all blocks until the last divider
        const resetIndex = message.blocks
          .map((block, index) => block.type === "divider" ? index : -1)
          .filter(index => index !== -1)
          .pop();

        if (resetIndex === -1) {
          throw new Error('Message structure is invalid');
        }

        // Keep only the blocks before the last divider
        const resetBlocks = message.blocks.slice(0, resetIndex + 1);

        // Get current timestamp
        const unassignTimestamp = new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });

        // Get existing history section
        let existingHistory = message.blocks.find(block => 
          block.type === "rich_text" && 
          block.block_id?.startsWith('history_')
        );

        if (existingHistory) {
          existingHistory.elements[0].elements.push(
            {
              type: "text",
              text: `\n${unassignTimestamp} - Unassigned by `
            },
            {
              type: "user",
              user_id: user.id
            }
          );
        }

        // Create assign button
        const assignButton = {
          type: "actions",
          block_id: `assign_${Date.now()}`,
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
        };

        // Add sections
        resetBlocks.push(
          assignButton,
          {
            type: "divider",
            block_id: `div_history_${Date.now()}`
          },
          existingHistory
        );

        // Update the message
        await slack.chat.update({
          channel: container.channel_id,
          ts: container.message_ts,
          blocks: resetBlocks,
          text: message.text
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
