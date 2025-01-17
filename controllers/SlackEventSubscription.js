import dotenv from "dotenv";
import { getMessage } from "../utils/slackConfig.js";
import {sendSMS} from "../utils/twilioConfig.js";

dotenv.config();

// Helper function to log errors with context
const logError = (context, error) => {
  console.error(`Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
};

export const handleSlackEvents = async (req, res) => {
  try {
    // Validate request body
    if (!req.body) {
      return res.status(400).json({
        error: "Invalid request body",
        ok: false
      });
    }

    console.log("Received Slack Event:", JSON.stringify(req.body, null, 2));

    // Handle URL verification
    if (req.body.type === "url_verification") {
      return res.status(200).json({
        challenge: req.body.challenge
      });
    }

    // Validate event structure
    if (!req.body.event || !req.body.event.type) {
      return res.status(400).json({
        error: "Invalid event structure",
        ok: false
      });
    }

    // Handle message events
    if (req.body.event.type === "message") {
      const event = req.body.event;
      
      try {
        // Check if message is in the specific channel and not from a bot
        if (event.channel === "C0841505XL1" && !event.bot_id && !event.subtype) {
          // Check if message is in a thread
          if (event.thread_ts) {
            try {
              // Get the parent message
              const parentMessage = await getMessage(event.channel, event.thread_ts);
              console.log("Parent message:", parentMessage);
              
              if (!parentMessage) {
                logError("getMessage", new Error("Parent message not found"));
                return res.status(200).json({ ok: true }); // Still return 200 to Slack
              }
              
              if (parentMessage && parentMessage.text) {
                // Extract phone number using regex
                const phoneMatch = parentMessage.text.match(/\+1\d{10}/);
                
                if (phoneMatch) {
                  const phoneNumber = phoneMatch[0];
                  try {
                    await sendSMS(phoneNumber, event.text);
                    console.log(`SMS would be sent to ${phoneNumber} with message: ${event.text}`);
                  } catch (twilioError) {
                    logError("Twilio SMS", twilioError);
                    // Don't throw error, just log it and continue
                  }
                }
              }
            } catch (threadError) {
              logError("Thread processing", threadError);
              // Don't throw error, continue processing
            }
          }
        }
      } catch (messageError) {
        logError("Message processing", messageError);
        // Don't throw error, continue processing
      }
    }

    // Always respond with 200 OK for Slack events
    return res.status(200).json({ ok: true });
  } catch (error) {
    logError("handleSlackEvents", error);
    
    // Ensure we always send a response to Slack
    // Even in case of errors, send 200 to acknowledge receipt
    return res.status(200).json({
      ok: true,
      error: "An error occurred but event was received"
    });
  }
};