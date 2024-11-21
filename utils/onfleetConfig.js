import Onfleet from '@onfleet/node-onfleet';
import dotenv from 'dotenv';
import { sendErrorWebhook } from '../utils/webhookUtils.js';

dotenv.config();

// Initialize the Onfleet client with the auth token as a string
const onfleet = new Onfleet(process.env.ONFLEET_AUTH_TOKEN?.replace(/['"]/g, ''));

// Common function to get admin details
const getAdminDetails = async (adminId) => {
    try {
        const admins = await onfleet.administrators.get();
        return admins.find((admin) => admin.id === adminId);
    } catch (error) {
        console.error('Error fetching admin details:', error);
        return null;
    }
};

const getOnfleetTeamsFromServer = async () => {
    try {
        const teams = await onfleet.teams.get();
        return teams;
    } catch (error) {
        console.error('Error fetching teams:', error);
        return null;
    }
};

const getSingleOnfleetTask = async (taskId) => {
    try {
        const task = await onfleet.tasks.get(taskId);
        return task;
    } catch (error) {
        console.error('Error fetching task:', error);
        return null;
    }
};

const updateOnfleetTask = async (payload) => {
    try {
        const { taskId, metadata, notes } = payload;
        
        if (!taskId) {
            console.error('Task ID is required');
            return null;
        }

        // First, get the current task to ensure it exists
        let currentTask;
        try {
            currentTask = await onfleet.tasks.get(taskId);
        } catch (error) {
            console.error('Error fetching current task:', error);
            return null;
        }

        if (!currentTask) {
            console.error('Task not found');
            return null;
        }

        const updateData = {};

        // Handle metadata update
        if (metadata !== undefined) {
            if (Array.isArray(metadata)) {
                updateData.metadata = metadata;
            } else {
                console.error('Invalid metadata format: expected array');
                return null;
            }
        }

        // Handle notes update
        if (notes !== undefined) {
            if (typeof notes === 'string') {
                updateData.notes = notes;
            } else {
                console.error('Invalid notes format: expected string');
                return null;
            }
        }

        if (Object.keys(updateData).length === 0) {
            console.error('No valid update data provided');
            return null;
        }

        // Log the update attempt
        console.log('Attempting to update task with data:', {
            taskId,
            updateData
        });

        // Perform the update
        const updatedTask = await onfleet.tasks.update(taskId, updateData);
        
        // Log successful update
        // console.log('Task updated successfully:', updatedTask.id);
        
        return updatedTask;
    } catch (error) {

        await sendErrorWebhook(`Error updating task: ${error.message || 'Unknown error'} -> Task ID: ${payload?.taskId} -> Update Data: ${JSON.stringify(payload)}`);
        // Log the complete error
        console.error('Error updating task:', {
            message: error.message || 'Unknown error',
            stack: error.stack,
            data: error.data,
            code: error.code,
            taskId: payload?.taskId,
            updateData: payload
        });
        
        
        return null;
    }
};

const createOnfleetDriver = async (driverData) => {
    try {
        const worker = await onfleet.workers.create({
            name: driverData.name,
            phone: driverData.phone,
            teams: driverData.teams,
            displayName: driverData.displayName || undefined,
            address: driverData.address || undefined
        });
        return worker;
    } catch (error) {
        console.error('Error creating OnFleet driver:', error);
        return null;
    }
};

export { onfleet, getAdminDetails, getOnfleetTeamsFromServer, createOnfleetDriver, getSingleOnfleetTask, updateOnfleetTask };
