import { sendSlackMessage } from "../../utils/slackConfig.js";
import { getAdminDetails } from "../../utils/onfleetConfig.js";
import {
  getAddressFromCoordinates,
  getTimeZoneFromCoordinates,
} from "../../utils/googleFunctions.js";
import {
  dateFormatter,
  shortDateFormatter,
} from "../../utils/dateFormatter.js";
import dotenv from "dotenv";

dotenv.config();

const handleTaskAssigned = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(404).json({ message: "Invalid payload or Not Found" });
    }

    if (payload.data.task.pickupTask === false) {
      return res.status(200).json({
        message: "Not a pickup task",
      });
    }

    const taskId = payload.data.task.id;

    const adminId = payload.adminId;
    if (adminId) {
      var admin = await getAdminDetails(adminId);
    }
    // Extract details from payload
    const taskShortId = payload.data.task.shortId;
    const adminName = admin ? admin.name : "Empty or Auto Assigned";
    const driverName = payload.data.worker.name;
    const businessName = payload.data.task.recipients[0].name;
    const locationCoordinates = payload.data.task.destination.location;
    const formattedCoordinates = locationCoordinates.reverse().join(",");
    const businessAddress = await getAddressFromCoordinates(
      formattedCoordinates
    );
    const getTimeZone = await getTimeZoneFromCoordinates(formattedCoordinates);
    const orderCreatedDate = new Date(payload.data.task.timeCreated);
    const orderCreatedDateFormatted = shortDateFormatter(orderCreatedDate);
    const deliveryDate = new Date(payload.data.task.completeBefore);
    const formattedDeliveryDate = dateFormatter(deliveryDate, getTimeZone);
    const driverPhoneNo = payload.data.worker.phone;

    // Create Slack message
    const message = {
      text: `Task ${taskShortId} assigned by ${adminName} to ${driverName}`,
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
                  name: "car",
                  unicode: "1f697",
                },
                {
                  type: "text",
                  text: `  onFleet Task Assigned`,
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
                  text: `Task ShortId: ${taskShortId}\nAssigned By: ${adminName}\nPickup Business name: ${businessName}\nPickup Business Address: ${businessAddress}\nOrder Created Date: ${orderCreatedDateFormatted}\nDate of Delivery: ${formattedDeliveryDate}\nDriver Name: ${driverName}\nDriver Phone No: ${driverPhoneNo}`,
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

    const SLACK_CHANNEL = process.env.ASSIGNED_CHANNEL_ID;
    // Send Slack notification
    await sendSlackMessage({
      SLACK_CHANNEL,
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

export { handleTaskAssigned };
