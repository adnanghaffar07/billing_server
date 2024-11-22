import { slack, sendSlackMessage } from "../utils/slackConfig.js";
import dotenv from "dotenv";
import { sendErrorWebhook } from "../utils/webhookUtils.js";
import { getESTTimestamp } from "../utils/dateFormatter.js";

dotenv.config();

const MAX_HISTORY_ENTRIES = 5; // Limit history to last 5 entries

const createHistorySection = (existingHistory = null, newEntry = null) => {
  let elements = [
    {
      type: "text",
      text: "📝 Assignment History:\n",
      style: {
        bold: true
      }
    }
  ];

  // Get existing entries if any
  if (existingHistory) {
    const historyEntries = existingHistory.elements[0].elements
      .slice(1) // Skip the header
      .reduce((acc, curr, i, arr) => {
        if (i % 2 === 0) {
          acc.push([curr, arr[i + 1]].filter(Boolean));
        }
        return acc;
      }, []);

    elements.push(...historyEntries.flat());
  }

  // Add new entry if provided
  if (newEntry) {
    elements.push(...newEntry);
  }

  // Keep only the last MAX_HISTORY_ENTRIES
  const entries = elements.slice(1).reduce((acc, curr, i, arr) => {
    if (i % 2 === 0) {
      acc.push([curr, arr[i + 1]].filter(Boolean));
    }
    return acc;
  }, []);

  const trimmedEntries = entries.slice(-MAX_HISTORY_ENTRIES).flat();

  return {
    type: "rich_text",
    block_id: `history_${Date.now()}`,
    elements: [
      {
        type: "rich_text_section",
        elements: [elements[0], ...trimmedEntries]
      }
    ]
  };
};

export const handleSlackInteractions = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    const { type, user, actions, container, message } = payload;

    if (type !== "block_actions") {
      return res.status(400).json({ message: "Unsupported interaction type" });
    }

    const action = actions[0];
    const { action_id, value: taskId } = action;

    // Keep original message blocks (excluding assignment-related blocks)
    const originalBlocks = message.blocks.filter(block => 
      !block.block_id?.includes('assign_') && 
      !block.block_id?.includes('history_') && 
      !block.block_id?.includes('div_') &&
      !block.type.includes('actions')
    );

    // Get existing history entries if any
    const existingHistory = message.blocks.find(block => 
      block.type === "rich_text" && 
      block.block_id?.startsWith('history_')
    );

    let historyEntries = [];
    if (existingHistory && existingHistory.elements[0]?.elements) {
      // Get all entries after the header
      historyEntries = existingHistory.elements[0].elements
        .slice(1) // Skip header
        .reduce((acc, curr, i, arr) => {
          if (i % 2 === 0 && arr[i + 1]) {
            acc.push([curr, arr[i + 1]]);
          }
          return acc;
        }, [])
        .flat();
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
        historyEntries.push(
          {
            type: "text",
            text: `\n${timestamp} - Assigned to `
          },
          {
            type: "user",
            user_id: user.id
          }
        );

        // Keep only last 5 entries
        historyEntries = historyEntries.slice(-10); // Keep last 5 pairs (10 elements)

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
          ...originalBlocks,
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
        historyEntries.push(
          {
            type: "text",
            text: `\n${unassignTimestamp} - Unassigned by `
          },
          {
            type: "user",
            user_id: user.id
          }
        );

        // Keep only last 5 entries
        historyEntries = historyEntries.slice(-10); // Keep last 5 pairs (10 elements)

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
          ...originalBlocks,
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
