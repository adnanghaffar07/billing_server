import dotenv from "dotenv";

dotenv.config();

export const handleSlackEvents = async (req, res) => {
  try {
    console.log("Received Slack Event:", req.body);
    res.status(200).json({
      type: "url_verification",
      challenge: req.body.challenge
    });
  } catch (error) {
    console.error("Error handling Slack interaction:", error);  
    // Send a response to Slack to acknowledge the interaction
    res.status(500).json({
      error: "Failed to handle Slack interaction",
      message: error.message
    });
  }
};