import axios from 'axios';
import { webhookUrls } from '../config/urls.js';
import dotenv from 'dotenv';

dotenv.config();


const API_URL = `https://flow.zoho.com/794165522/flow/webhook/incoming?zapikey=${process.env.ZAPI_KEY}&isdebug=false`;

export const sendErrorWebhook = async (errorMessage) => {
    try {
        await axios.post(webhookUrls.error, {
            text:errorMessage
        });
        console.log("Error information sent to webhook successfully.");
    } catch (error) {
        console.error(
            "Failed to send error information to webhook:",
            error.message
        );
    }
};

export const sendStatusWebhook = async (status) => {
    try {
        await axios.post(webhookUrls.status, status);
        console.log("Status information sent to webhook successfully.");
    } catch (error) {
        console.error(
            "Failed to send Status information to webhook:",
            error.message
        );
    }
};

export const sendOrderWebhook = async (orderData) => {
    try {
        await axios.post(webhookUrls.order, orderData);
        console.log("Order information sent to webhook successfully.");
    } catch (error) {
        console.error(
            "Failed to send order information to webhook:",
            error.message
        );
    }
};

// export const sendNotificationWebhook = async (notificationData) => {
//     try {
//         await axios.post(webhookUrls.notification, notificationData);
//         console.log("Notification sent to webhook successfully.");
//     } catch (error) {
//         console.error(
//             "Failed to send notification to webhook:",
//             error.message
//         );
//     }
// };
export const sendSmSWebhook = async (teams, message, dispatcherName) => {
    try {
        if (!teams || !Array.isArray(teams) || teams.length === 0) {
            return "one or more fields are empty";
        }
        const makeComResponse = await axios.post(webhookUrls.sendSmsToTeams, {
            teams: teams,
            message: message.trim(),
            sender: dispatcherName 
        });
        return makeComResponse
    } catch (error) {
        console.error(
            "Failed to send notification to webhook:",
            error.message
        );
    }
};
export const getOrderDetailsWebhook = async (orderId) => {
    try {
       const response = await axios.post(webhookUrls.notification, {order: orderId});
        console.log("Notification sent to webhook successfully.");
        return response.data
    } catch (error) {
        console.error(
            "Failed to send notification to webhook:",
            error.message
        );
    }
};
export const sendPostRequest = async (payload) => {

    console.log('Calling webhook...', payload, "AND", API_URL);
    try {
       const response = await axios.post(API_URL, payload);
        console.log("API CALL Successful");
        return response.status
    } catch (error) {
        console.error(
            "Failed to send notification to webhook:",
            error.message
        );
    }
};
