import { slack, sendSlackMessage } from "../utils/slackConfig.js";
import dotenv from "dotenv";
import { sendErrorWebhook } from "../utils/webhookUtils.js";
import { getESTTimestamp } from "../utils/dateFormatter.js";

dotenv.config();

const MAX_HISTORY_ENTRIES = 5; // Limit history to last 5 entries

export const handleSlackInteractions = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    const { type, user, actions, container, message } = payload;

    if (type !== "block_actions") {
      return res.status(400).json({ message: "Unsupported interaction type" });
    }

    const action = actions[0];
    const { action_id, value: taskId } = action;

    // Extract the initial message blocks (everything before the first divider)
    const dividerIndex = message.blocks.findIndex(block => block.type === "divider");
    const initialMessageBlocks = dividerIndex !== -1 
      ? message.blocks.slice(0, dividerIndex)
      : message.blocks.filter(block => 
          !block.block_id?.includes('assign_') && 
          !block.block_id?.includes('history_') && 
          !block.type.includes('actions'));

    // Get existing history if any
    const historyBlock = message.blocks.find(block => 
      block.type === "rich_text" && 
      block.block_id?.startsWith('history_')
    );

    // Parse existing history entries
    let historyEntries = [];
    if (historyBlock && historyBlock.elements[0]?.elements) {
      const elements = historyBlock.elements[0].elements;
      // Skip the header and process pairs of entries
      for (let i = 1; i < elements.length; i += 2) {
        if (elements[i] && elements[i + 1]) {
          historyEntries.push(elements[i], elements[i + 1]);
        }
      }
    }

    switch (action_id) {
      case "assign_task":
        if (!user || !user.id || !user.name) {
          throw new Error('Invalid user data in payload');
        }

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

        // Add new assignment to history
        const newAssignEntries = [
          {
            type: "text",
            text: `\n${timestamp} - Assigned to `
          },
          {
            type: "user",
            user_id: user.id
          }
        ];
        
        // Combine and limit history entries
        historyEntries = [...historyEntries, ...newAssignEntries].slice(-10); // Keep last 5 pairs

        // Create history section
        const historySection = {
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
                },
                ...historyEntries
              ]
            }
          ]
        };

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

        // Construct new blocks array
        const newBlocks = [
          ...initialMessageBlocks,
          {
            type: "divider",
            block_id: `div_${Date.now()}`
          },
          assignmentSection,
          unassignButton,
          historySection
        ];

        // Update the message
        await slack.chat.update({
          channel: container.channel_id,
          ts: container.message_ts,
          blocks: newBlocks,
          text: message.text
        });
        break;

      case "unassign_task":
        const unassignTimestamp = getESTTimestamp();

        // Add unassignment to history
        const newUnassignEntries = [
          {
            type: "text",
            text: `\n${unassignTimestamp} - Unassigned by `
          },
          {
            type: "user",
            user_id: user.id
          }
        ];

        // Combine and limit history entries
        historyEntries = [...historyEntries, ...newUnassignEntries].slice(-10);

        // Create updated history section
        const updatedHistory = {
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
                },
                ...historyEntries
              ]
            }
          ]
        };

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

        // Construct new blocks array
        const resetBlocks = [
          ...initialMessageBlocks,
          {
            type: "divider",
            block_id: `div_${Date.now()}`
          },
          assignButton,
          updatedHistory
        ];

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
    
    res.status(200).json({
      response_type: "ephemeral",
      text: "Sorry, there was an error processing your request. Our team has been notified."
    });
  }
};
