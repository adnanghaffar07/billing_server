import { getWorkerByPhoneNumber } from "../../utils/onfleetConfig.js";
import { sendSlackMessageWithEmoji } from "../../utils/slackConfig.js";
import { getSms } from "../../utils/twilioConfig.js";

export const receiveSmsTwilio = async (req, res) => {
    
    try {
        const { body } = req;
        
        const { from, message, bodySHA256 } = body;

        const worker = await getWorkerByPhoneNumber(from);
        const workerName = worker[0].name;
        const lastMessage = await getSms(from);
        const lastMessageBody = lastMessage[0].body; 

        const slackMessage = {
            text: `SMS Received\nFrom: ${workerName}\nContact: ${from}\nMessage: ${message}\n\n=========\nHistory\n\nLast Send Message: ${lastMessageBody}`
          };
          await sendSlackMessageWithEmoji({
            text: slackMessage.text,
            blocks: null,
             emoji: ":incoming_envelope:"
          });
        
        
        res.status(200).json({
            success: true,
            message: `Sms received successfully`
        });
        
        
    } catch (error) {
        console.error(error);
        res.status(200).json({
            success: false,
            message: 'Error receiving sms'
        });
    }
};