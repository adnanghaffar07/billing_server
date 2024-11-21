import dotenv from "dotenv";
import {
  sendSlackMessage,
} from "../../utils/slackConfig.js";

dotenv.config();

const handleTaskMock = async (req, res) => {
  try {
    const message = {
      text: `Mock Integration Of Interactions`,
      blocks: [
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
                  type: "emoji",
                  name: "x",
                  unicode: "274c",
                },
                {
                  type: "text",
                  text: `  Mock Integration Of Interactions`,
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
                  text: `Test Inegration Of Interactions`,
                  style: {
                    bold: true,
                  },
                  style: {},
                },
              ],
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Assign to me",
                emoji: true,
              },
              style: "primary",
            //   value: taskId,
              value: '89f23402',
              action_id: "assign_task",
            },
          ],
        },
        {
          type: "divider",
        },
      ],
    };

    await sendSlackMessage({
      channel: 'C07SMNR92CX',
      text: message.text,
      blocks: message.blocks,
    });

    res.status(200).json({
      message: "Task deleted notification sent successfully to Slack",
    });
  } catch (error) {
    console.error("Error handling task deletion notification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export { handleTaskMock };
