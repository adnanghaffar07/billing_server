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

        // Find the last divider and action block indices
        const lastDividerIndex = message.blocks
          .map((block, index) => block.type === "divider" ? index : -1)
          .filter(index => index !== -1)
          .pop();

        const actionBlockIndex = message.blocks.findIndex(block => 
          block.type === "actions" && 
          block.elements?.[0]?.action_id === "assign_task"
        );

        if (lastDividerIndex === -1 || actionBlockIndex === -1) {
          throw new Error('Message structure is invalid');
        }

        // Create new blocks array with original content
        const newBlocks = [...message.blocks];

        // Remove the action block and its following divider
        newBlocks.splice(actionBlockIndex, 2);

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
                  text: "👤 Assigned to: ",
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

        // Add divider, assignment section, and unassign button
        newBlocks.push(
          {
            type: "divider",
            block_id: `div_${Date.now()}`
          },
          assignmentSection,
          unassignButton,
          {
            type: "divider",
            block_id: `div_${Date.now() + 1}`
          }
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
        // Find indices of assignment section and unassign button
        const assignmentIndex = message.blocks.findIndex(block => 
          block.type === "rich_text" && 
          block.elements?.[0]?.elements?.some(el => 
            el.type === "text" && el.text.includes("Assigned to:")
          )
        );

        if (assignmentIndex === -1) {
          throw new Error('Assignment section not found');
        }

        // Create new blocks array without assignment section and unassign button
        const resetBlocks = message.blocks.filter((block, index) => 
          index < assignmentIndex - 1 || // Before the divider preceding assignment
          index > assignmentIndex + 2    // After the divider following unassign button
        );

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

        // Add divider and assign button
        resetBlocks.push(
          {
            type: "divider",
            block_id: `div_${Date.now()}`
          },
          assignButton,
          {
            type: "divider",
            block_id: `div_${Date.now() + 1}`
          }
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
