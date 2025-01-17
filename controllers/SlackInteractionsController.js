import { slack, sendSlackMessage } from "../utils/slackConfig.js";
import dotenv from "dotenv";
import { sendErrorWebhook } from "../utils/webhookUtils.js";
import { getESTTimestamp } from "../utils/dateFormatter.js";

dotenv.config();

export const handleSlackInteractions = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    const { type, user, actions, container, message } = payload;

    console.log(JSON.stringify(payload, null, 2), "This is payload from slack");

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

        // Find the assign button block index
        const assignButtonIndex = message.blocks.findIndex(block => 
          block.type === "actions" && 
          block.elements?.[0]?.action_id === "assign_task"
        );

        if (assignButtonIndex === -1) {
          throw new Error('Assign button not found');
        }

        // Keep blocks before the assign button
        const newBlocks = message.blocks.slice(0, assignButtonIndex);

        // Get current EST timestamp
        const timestamp = getESTTimestamp();

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
        } else {
          // If history section exists, remove it from newBlocks as we'll add it back later
          newBlocks.splice(newBlocks.findIndex(block => block.block_id === historySection.block_id), 1);
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
        // Find the unassign button and assignment section
        const unassignButtonIndex = message.blocks.findIndex(block => 
          block.type === "actions" && 
          block.elements?.[0]?.action_id === "unassign_task"
        );

        const assignmentSectionIndex = message.blocks.findIndex(block =>
          block.type === "rich_text" &&
          block.elements?.[0]?.elements?.some(el => 
            el.type === "text" && el.text.includes("Currently assigned to:")
          )
        );

        if (unassignButtonIndex === -1 || assignmentSectionIndex === -1) {
          throw new Error('Required blocks not found');
        }

        // Keep blocks before the assignment section
        const resetBlocks = message.blocks.slice(0, assignmentSectionIndex);

        // Get current EST timestamp
        const unassignTimestamp = getESTTimestamp();

        // Get existing history section
        let existingHistory = message.blocks.find(block => 
          block.type === "rich_text" && 
          block.block_id?.startsWith('history_')
        );

        if (existingHistory) {
          // Remove existing history from resetBlocks if it exists
          const historyIndex = resetBlocks.findIndex(block => block.block_id === existingHistory.block_id);
          if (historyIndex !== -1) {
            resetBlocks.splice(historyIndex, 1);
          }

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