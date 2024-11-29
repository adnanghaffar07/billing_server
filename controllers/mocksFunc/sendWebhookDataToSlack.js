import { sendSlackMessage } from "../../utils/slackConfig.js";

// create a simple function to send data to Slack
export const sendWebhookDataToSlack = async (req, res) => {
  // Get the data from the request body
  try {
    const data = req.body;

    // Send the data to Slack
    await sendSlackMessage({
      channel: "C0831BKJFV0",
      text: "Webhook Data",
      blocks: [
        {
          type: "rich_text",
          elements: [
            {
              type: "rich_text_section",
              elements: [
                {
                  type: "text",
                  text: `Body: ${JSON.stringify(
                    data,
                    null,
                    2
                  )}\n Query: ${JSON.stringify(
                    req.query,
                    null,
                    2
                  )}\n Params: ${JSON.stringify(req.params, null, 2)}`,
                  style: {},
                },
              ],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      message: "Data sent to Slack",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};
