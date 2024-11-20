import { dateFormatter } from './dateFormatter.js';
import { getTimeZoneFromCoordinates } from './googleFunctions.js';

export const formatWaypointTime = async (waypointData) => {
    try {
        const { location, arrive_at } = waypointData;
        const coordinates = `${location.latitude},${location.longitude}`;
        
        // Get the timezone for the location
        const timeZone = await getTimeZoneFromCoordinates(coordinates);
        
        // Parse the UTC time from the arrive_at string
        const utcDate = new Date(arrive_at);
        
        // Format the date with the correct timezone
        const formattedTime = dateFormatter(utcDate, timeZone);
        
        return {
            formattedTime,
            timeZone
        };
    } catch (error) {
        console.error('Error formatting waypoint time:', error);
        throw error;
    }
};
