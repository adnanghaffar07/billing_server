import { slack, sendSlackMessage } from "../utils/slackConfig.js";
import dotenv from "dotenv";
import { sendErrorWebhook } from "../utils/webhookUtils.js";
import { getESTTimestamp } from "../utils/dateFormatter.js";

dotenv.config();

const MAX_HISTORY_ENTRIES = 5; // Limit history to last 5 entries

const trimHistory = (elements) => {
  // Find where history entries start (after the header)
  const historyStartIndex = elements[0].elements.findIndex(el => 
    el.type === "text" && el.text.includes("Assignment History")
  );

  if (historyStartIndex === -1) return elements;

  // Get all history entries (they start with newlines)
  const historyEntries = elements[0].elements
    .slice(historyStartIndex + 1)
    .filter(el => el.type === "text" && el.text.startsWith("\n"))
    .map((_, index, array) => array.slice(index * 2, (index + 1) * 2))
    .filter(entry => entry.length === 2); // Each entry has text and user mention

  // Keep only the last MAX_HISTORY_ENTRIES
  const trimmedEntries = historyEntries.slice(-MAX_HISTORY_ENTRIES);

  // Reconstruct the elements array
  return [{
    type: "rich_text_section",
    elements: [
      {
        type: "text",
        text: "📝 Assignment History:\n",
        style: {
          bold: true
        }
      },
      ...trimmedEntries.flat()
    ]
  }];
};

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

        // Keep all original blocks until the first action or rich_text block
        const messageEndIndex = message.blocks.findIndex(block => 
          block.type === "actions" || 
          (block.type === "rich_text" && block.block_id?.startsWith('assign_'))
        );

        // If no action/assignment blocks found, keep all blocks
        const newBlocks = messageEndIndex === -1 
          ? [...message.blocks]
          : message.blocks.slice(0, messageEndIndex);

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

        // Trim history if needed
        historySection.elements = trimHistory(historySection.elements);

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

        // Add divider if there are original blocks
        if (newBlocks.length > 0) {
          newBlocks.push({
            type: "divider",
            block_id: `div_${Date.now()}`
          });
        }

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
        // Keep all original blocks until the first action or rich_text block
        const unassignMessageEndIndex = message.blocks.findIndex(block => 
          block.type === "actions" || 
          (block.type === "rich_text" && block.block_id?.startsWith('assign_'))
        );

        // If no action/assignment blocks found, keep all blocks
        const resetBlocks = unassignMessageEndIndex === -1 
          ? [...message.blocks]
          : message.blocks.slice(0, unassignMessageEndIndex);

        // Get current EST timestamp
        const unassignTimestamp = getESTTimestamp();

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

          // Trim history if needed
          existingHistory.elements = trimHistory(existingHistory.elements);
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

        // Add divider if there are original blocks
        if (resetBlocks.length > 0) {
          resetBlocks.push({
            type: "divider",
            block_id: `div_${Date.now()}`
          });
        }

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
