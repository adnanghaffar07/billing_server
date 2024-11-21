import dotenv from "dotenv";
import {
  sendSlackMessage,
  createTaskDeletionMessage,
} from "../../utils/slackConfig.js";
import { getAdminDetails } from "../../utils/onfleetConfig.js";
import {
  getAddressFromCoordinates,
  getTimeZoneFromCoordinates,
} from "../../utils/googleFunctions.js";
import { dateFormatter } from "../../utils/dateFormatter.js";

dotenv.config();

const handleTaskDeletion = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(404).json({ message: "Invalid payload or Not Found" });
    }

    const adminId = payload.adminId;
    if (!adminId) {
      return res.status(403).json({ message: "Admin ID not Defined" });
    }

    // Fetch admin details using Onfleet SDK
    const admin = await getAdminDetails(adminId);

    // Extract details from payload for Slack message
    const taskShortId = payload.data.task.shortId;
    const adminName = admin ? admin.name : "Unknown Admin";
    const businessName = payload.data.task.recipients[0].name;
    const locationCoordinates = payload.data.task.destination.location;
    const formattedCoordinates = locationCoordinates.reverse().join(",");
    const businessAddress = await getAddressFromCoordinates(
      formattedCoordinates
    );
    const getTimeZone = await getTimeZoneFromCoordinates(formattedCoordinates);
    const deliveryDate = new Date(payload.data.task.completeBefore);
    const formattedDeliveryDate = dateFormatter(deliveryDate, getTimeZone);
    const message = {
      text: `Task ${taskShortId} deleted by ${adminName}`,
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
                  text: `  onFleet Task Deleted (${payload.data.task.pickupTask === true ? "Pickup" : "DropOff"})`,
                  style: {
                    bold: true,
                  },
                }
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
                  text: `Task ShortId: ${taskShortId}\nDeleted By: ${adminName}\nPickup Business name: ${businessName}\nPickup Business Address: ${businessAddress}\nDate of Delivery: ${formattedDeliveryDate}`,
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

    const SLACK_CHANNEL = process.env.DELETED_CHANNEL_ID ;
    await sendSlackMessage({
      channel:SLACK_CHANNEL,
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

export { handleTaskDeletion };
