import {
  sendErrorWebhook,
  sendOrderWebhook,
  sendNotificationWebhook,
  sendStatusWebhook,
} from "../utils/webhookUtils.js";

export const get_order_status = async (req, res) => {
  try {
    const { teamUUID, status, teamId } = req.query;
    const orderId = req.params.id;

    // Initialize an array to hold missing parameters
    const missingParams = [];

    // Check for missing query parameters
    if (!orderId) missingParams.push("orderId");
    if (!teamUUID) missingParams.push("teamUUID");
    if (!status) missingParams.push("status");
    if (!teamId) missingParams.push("teamId");

    // If there are missing parameters, respond with the details
    if (missingParams.length > 0) {
      const errorMessage = `Missing parameter(s): ${missingParams.join(", ")}`;
      await sendErrorWebhook(`${errorMessage},\n { ${teamUUID}, ${status}, ${teamId} }`);
      return res.status(400).json({
        status: "fail",
        message: errorMessage,
      });
    }

    // Prepare the data to send to the webhook
    const payload = {
      teamUUID,
      status,
      teamId,
      orderId,
    };

    // Send data to Make.com webhook
    try {
      if (status.trim() === "completed" || status.trim() === "COMPLETED") {
        await sendStatusWebhook(payload);
        
      }
    } catch (error) {
      console.error("Error sending data to Make.com webhook:", error.message);
      await sendErrorWebhook(`Error sending data to Make.com\n webhookerror: ${error.message}`);
      return res.status(500).json({
        status: "fail",
        message: "Error sending data to webhook",
        error: error.message,
      });
    }

    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    await sendErrorWebhook(`An unexpected error occurred \nwebhookerror: ${err.message}`);
    res.status(500).json({
      status: "fail",
      message: "An unexpected error occurred",
      error: err.message,
    });
  }
};

export const order_details = async (req, res) => {
  try {
    // Extract data from the request body
    const {
      job_id,
      order_id,
      tracking_link,
      pickup_waypoint,
      dropoff_waypoint,
      team_id,
      order_items,
      payment_type,
      order_total,
      sub_total,
      tax,
      delivery_fee,
      tip,
      allowed_vehicles,
      controlled_substances,
      is_contactless_delivery,
      require_photo_at_drop_off,
      require_photo_at_pick_up,
      customer_notification,
      barcode,
      route,
      catering,
    } = req.body;

    // Prepare the payload to send to the webhook
    const payload = {
      job_id,
      order_id,
      tracking_link,
      pickup_waypoint,
      dropoff_waypoint,
      team_id,
      order_items,
      payment_type,
      order_total,
      sub_total,
      tax,
      delivery_fee,
      tip,
      allowed_vehicles,
      controlled_substances,
      is_contactless_delivery,
      require_photo_at_drop_off,
      require_photo_at_pick_up,
      customer_notification,
      barcode,
      route,
      catering,
    };

    // Send data to Make.com webhook
    try {
      await sendOrderWebhook(payload);
      res.status(200).json({
        status: "success",
      });
    } catch (error) {
      console.error("Error sending data to Make.com webhook:", error.message);
      await sendErrorWebhook(`Error sending data to Make.com\n webhookerror: ${error.message}`);
      return res.status(500).json({
        status: "fail",
        message: "Error sending data to webhook",
        error: error.message,
      });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    await sendErrorWebhook(`An unexpected error occurred\n webhookerror: ${err.message}`);
    res.status(500).json({
      status: "fail",
      message: "An unexpected error occurred",
      error: err.message,
    });
  }
};
export const order_dsp_declined = async (req, res) => {
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
export const order_details_change = async (req, res) => {
  try {
    const orderId = req.params.id;
    const body = req.body;
    const payload = {
      orderId,
      ...body,
    };
    await sendNotificationWebhook(payload);
    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};
