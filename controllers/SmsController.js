import { sendSmSWebhook } from "../utils/webhookUtils.js";

export const sendSmsToTeams = async (req, res) => {
    try {
        const { teams, message } = req.body;

        if (!teams || !Array.isArray(teams) || teams.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one team'
            });
        }

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Here you would make the API call to make.com
        // This is a placeholder for the actual API call
        await sendSmSWebhook(teams, message);

        res.status(200).json({
            success: true,
            message: 'SMS sent successfully' 
        });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send SMS'
        });
    }
};
