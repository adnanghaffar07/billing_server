import axios from 'axios';
import { webhookUrls } from '../config/urls.js';

// Webhook URLs
// export const webhookUrl = "https://hook.us1.make.com/guukybx41137y39coqcly1tl4fo46yyl";
// export const webhookUrl_2 = "https://hook.us1.make.com/n6tzxxn45ezrws47hmufcdazc47vn6aa";
// export const webhookUrl_3 = "https://hook.us1.make.com/nh1q6e4pkj01mg79a2y1502dwgb8rke2";

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

export const sendNotificationWebhook = async (notificationData) => {
    try {
        await axios.post(webhookUrls.notification, notificationData);
        console.log("Notification sent to webhook successfully.");
    } catch (error) {
        console.error(
            "Failed to send notification to webhook:",
            error.message
        );
    }
};
