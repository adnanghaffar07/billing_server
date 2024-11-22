import dotenv from "dotenv";
import {
  sendSlackMessage
} from "../../utils/slackConfig.js";

dotenv.config();

const handleTaskOptimizationRoute = async (req, res) => {
  try {
    const payload = req.body;
    const message = {
      text: `Route Otimization`,
      blocks: [
        {
          type: "divider",
        },
        {
          type: "rich_text",
          elements: [
            {
              type: "rich_text_quote",
              elements: [
                {
                  type: "text",
                  text: `TEST Route Otimization: \n${JSON.stringify(payload)}`,
                  style: {},
                },
              ],
            },
          ],
        },
        {
          type: "divider",
        },
      ],
    };
    await sendSlackMessage({
      channel: "C07SMNR92CX",
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

export { handleTaskOptimizationRoute };
