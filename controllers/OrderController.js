const axios = require("axios");

const webhookUrl = "https://hook.us1.make.com/guukybx41137y39coqcly1tl4fo46yyl"; // replace with your actual webhook URL

async function sendErrorWebhook(errorMessage, additionalInfo) {
  try {
    await axios.post(webhookUrl, {
      errorMessage,
      additionalInfo,
    });
    console.log("Error information sent to webhook successfully.");
  } catch (error) {
    console.error(
      "Failed to send error information to webhook:",
      error.message
    );
  }
}

module.exports = {
  get_order_status: async (req, res) => {
    try {
      const { teamUUID, status, teamId } = req.query;
      const orderId = req.params.id;

      // Initialize an array to hold missing parameters
      const missingParams = [];

      // Check for missing query parameters
      if(!orderId) missingParams.push('orderId')
      if (!teamUUID) missingParams.push("teamUUID");
      if (!status) missingParams.push("status");
      if (!teamId) missingParams.push("teamId");

      // If there are missing parameters, respond with the details
      if (missingParams.length > 0) {
        const errorMessage = `Missing parameter(s): ${missingParams.join(
          ", "
        )}`;
        await sendErrorWebhook(errorMessage, { teamUUID, status, teamId });
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
        await axios.post(webhookUrl, payload);
      } catch (error) {
        console.error("Error sending data to Make.com webhook:", error.message);
        await sendErrorWebhook("Error sending data to Make.com webhook", {
          error: error.message,
        });
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
      await sendErrorWebhook("An unexpected error occurred", {
        error: err.message,
      });
      res.status(500).json({
        status: "fail",
        message: "An unexpected error occurred",
        error: err.message,
      });
    }
  },

  order_details: async (req, res) => {
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
  },
  order_dsp_declined: async (req, res) => {
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
  },
};
