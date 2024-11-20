import { sendSlackMessage } from "../utils/slackConfig.js";
import { findDriverById } from "../utils/dragonflyConfig.js";
import { getOrderDetailsWebhook } from "../utils/webhookUtils.js";
import { formatWaypointTime } from "../utils/timeUtils.js";
import { it } from "date-fns/locale";

export const driver_assigned = async (req, res) => {
  try {
    const body = req.body;
    const query = req.query;
    const driverId = req.params.id;
    const teamUUID = query.teamUUID;
    const orderId = query.orderId;

    if (!driverId) {
      return res.status(404).json({
        status: "Not Found",
        message: "Driver ID is required",
      });
    }

    if (!teamUUID) {
      return res.status(400).json({
        status: "Bad Request",
        message: "Team UUID is required",
      });
    }

    const orderDetails = await getOrderDetailsWebhook(orderId);
    console.log(orderDetails);

    // Format pickup and dropoff times
    const pickupTime = await formatWaypointTime(orderDetails.pickup_waypoint);
    const dropoffTime = await formatWaypointTime(orderDetails.dropoff_waypoint);

    // Get driver details from Dragonfly API
    const driverDetails = await findDriverById(teamUUID, driverId);

    if (!driverDetails) {
      return res.status(404).json({
        status: "Not Found",
        message: "Driver not found",
      });
    }

    const message = {
      text: `Cartwheel Task Assigned`,
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
                  text: `  Cartwheel Task Assigned`,
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
                  text: `Task ID: ${orderDetails.order_id}\nPickup Business name: ${orderDetails.pickup_waypoint.name}\nPickup Business Address: ${orderDetails.pickup_waypoint.address}\nPickup Time: ${pickupTime.formattedTime}\nDelivery Time: ${dropoffTime.formattedTime}\nDriver Name: ${driverDetails.name}\nDriver Phone No: ${driverDetails.phone}`,
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
          type: "rich_text",
          elements: [
            {
              type: "rich_text_section",
              elements: [
                {
                  type: "text",
                  text: `Disclaimer:- Please do not rely on these Pickup and Dropoff times. They are provided for reference and are subject to change. We recommend using the cartWheel app for real-time updates as they are subject to change.`,
                  style: {
                    italic: true,
                  },
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

    const SLACK_CHANNEL = process.env.ASSIGNED_CHANNEL_ID;
    await sendSlackMessage({
      SLACK_CHANNEL,
      text: message.text,
      blocks: message.blocks,
    });

    res.status(200).json({
      status: "success",
      data: {
        driver: driverDetails,
        pickup: {
          time: pickupTime.formattedTime,
          timezone: pickupTime.timeZone,
          location: orderDetails.pickup_waypoint.name
        },
        dropoff: {
          time: dropoffTime.formattedTime,
          timezone: dropoffTime.timeZone,
          location: orderDetails.dropoff_waypoint.name
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const driver_unassigned = async (req, res) => {
  try {
    res.status(200).json({
      status: "success",
    });
    //   const { teamUUID, status, teamId } = req.query;

    //   if (teamUUID && status && teamId) {
    //     console.log(teamUUID, status, teamId, "This is Query Data");
    //     console.log(req.params.id, "This is Parameter");
    //     res.status(200).json({
    //       status: "success",
    //     });
    //   } else {
    //     res.status(400).json({
    //       status: "fail",
    //       message: "Please check Parameter value is missing",
    //     });
    //   }
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const driver_coordinates = async (req, res) => {
  try {
    res.status(200).json({
      status: "success",
    });
    //   const { teamUUID, status, teamId } = req.query;

    //   if (teamUUID && status && teamId) {
    //     console.log(teamUUID, status, teamId, "This is Query Data");
    //     console.log(req.params.id, "This is Parameter");
    //     res.status(200).json({
    //       status: "success",
    //     });
    //   } else {
    //     res.status(400).json({
    //       status: "fail",
    //       message: "Please check Parameter value is missing",
    //     });
    //   }
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};
