import Onfleet from '@onfleet/node-onfleet';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Onfleet client
const onfleet = new Onfleet(process.env.ONFLEET_AUTH_TOKEN);

// Common function to get admin details
const getAdminDetails = async (adminId) => {
    try {
        const admins = await onfleet.administrators.get();
        return admins.find((admin) => admin.id === adminId);
    } catch (error) {
        console.error('Error fetching admin details:', error);
        throw error;
    }
};
const getOnfleetTeamsFromServer = async () => {
    try {
        const teams = await onfleet.teams.get();
        return teams
    } catch (error) {
        console.error('Error fetching admin details:', error);
        throw error;
    }
};
const getSingleOnfleetTask = async (taskId) => {
    try {
        const task = await onfleet.tasks.get(taskId);
        return task
    } catch (error) {
        console.error('Error fetching admin details:', error);
        throw error;
    }
};

const createOnfleetDriver = async (driverData) => {
    try {
        const worker = await onfleet.workers.create({
            name: driverData.name,
            phone: driverData.phone,
            teams: driverData.teams,
            vehicle: driverData.vehicle || undefined,
            capacity: driverData.capacity || undefined,
            displayName: driverData.displayName || undefined,
            address: driverData.address || undefined
        });
        return worker;
    } catch (error) {
        console.error('Error creating Onfleet driver:', error);
        throw error;
    }
};

export { onfleet, getAdminDetails, getOnfleetTeamsFromServer, createOnfleetDriver , getSingleOnfleetTask};
