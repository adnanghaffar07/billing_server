import { sendSlackMessage } from "../../utils/slackConfig.js";
import { getAdminDetails } from "../../utils/onfleetConfig.js";
import {
  getAddressFromCoordinates
} from "../../utils/googleFunctions.js";

import dotenv from "dotenv";

dotenv.config();

const handleTaskUpdates = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload) {
      return res.status(404).json({ message: "Invalid payload or Not Found" });
    }

    if(payload.actionContext.type !== "ADMIN"){
        return res.status(200).json({ message: "Success" });
    }

    const taskId = payload.data.task.id;

    const adminId = payload.adminId;
    if (adminId) {
      var admin = await getAdminDetails(adminId);
    }
    // // Extract details from payload
    const taskShortId = payload.data.task.shortId;
    const adminName = admin ? admin.name : "N/A";
    const businessName = payload.data.task.recipients[0].name;
    const locationCoordinates = payload.data.task.destination.location;
    const formattedCoordinates = locationCoordinates.reverse().join(",");
    const businessAddress = await getAddressFromCoordinates(
      formattedCoordinates
    );

    // Create Slack message
    const message = {
      text: `Task ${taskShortId} Updated by ${adminName}`,
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
                    name: "warning",
                    unicode: "26a0-fe0f"
                },
                {
                  type: "text",
                  text: `  onFleet Task Updated Notification`,
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
                  text: `Task ShortId: ${taskShortId}\nUpdated By: ${adminName}\nPickup Business name: ${businessName}\nPickup Business Address: ${businessAddress}`,
                  style: {},
                },
              ],
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "onFleet Task Link",
            verbatim: false,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Open",
              emoji: true,
            },
            url: `https://app.onfleet.com/dashboard#/manage?taskEdit=false&open=task&taskId=${taskId}`,
          },
        },
        {
          type: "divider",
        },
      ],
    };
    // Send Slack notification
    await sendSlackMessage({
      channel:'C07SMNR92CX',
      text: message.text,
      blocks: message.blocks,
    });

    res.status(200).json({
      message: "Task assigned notification sent successfully to Slack",
    });
  } catch (error) {
    console.error("Error handling task assignment notification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export { handleTaskUpdates };