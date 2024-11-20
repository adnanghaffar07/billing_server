import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CARTWHEEL_API_KEY = process.env.CARTWHEEL_API_KEY;

export const getDriversFromDragonfly = async (teamUUID) => {
    try {
        const response = await axios.get(
            `https://dragonfly.cartwheel.tech/app-portal/dynamic/dragonfly/teams/${teamUUID}/drivers`,
            {
                headers: {
                    'Authorization': CARTWHEEL_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        if (!response.data) {
            throw new Error(`No data received from Dragonfly`);
        }
        return response.data.drivers;
    } catch (error) {
        console.error('Error fetching drivers from Dragonfly:', error);
        throw error;
    }
};

export const findDriverById = async (teamUUID, driverId) => {
    try {
        const drivers = await getDriversFromDragonfly(teamUUID);
        return drivers.find(driver => driver.id === driverId);
    } catch (error) {
        console.error('Error finding driver:', error);
        throw error;
    }
};
