import path from 'path';
import { fileURLToPath } from 'url';
import { getOnfleetTeamsFromServer, createOnfleetDriver } from '../utils/onfleetConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const showOnboardPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/onboard.html'));
};

export const showOnfleetOnboardPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/onboard-onfleet.html'));
};

export const showStitchOnboardPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/onboard-stitch.html'));
};

const validateDriverData = (firstName, lastName, phone) => {
    const errors = [];
    
    if (!firstName || firstName.trim().length === 0) {
        errors.push('First name is required');
    }
    
    if (!lastName || lastName.trim().length === 0) {
        errors.push('Last name is required');
    }
    
    if (!phone || phone.trim().length === 0) {
        errors.push('Phone number is required');
    } else {
        // Basic phone number validation (at least 10 digits)
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(phone)) {
            errors.push('Invalid phone number format');
        }
    }
    
    return errors;
};

export const handleOnfleetOnboard = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            phone,
            teams,
            displayName,
            hasVehicle,
            vehicle,
            capacity
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !phone || !teams || teams.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: firstName, lastName, phone, and teams are required'
            });
        }

        // Phone number validation (must be E.164 format)
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format. Must be in E.164 format (e.g., +15555555555)'
            });
        }

        // Prepare driver data
        const driverData = {
            name: `${firstName.trim()} ${lastName.trim()}`,
            phone: phone.trim(),
            teams: Array.isArray(teams) ? teams : [teams], // Ensure teams is an array
        };

        // Add optional fields if provided
        if (displayName) {
            driverData.displayName = displayName.trim();
        }

        if (hasVehicle === 'true' && vehicle) {
            driverData.vehicle = {
                type: vehicle.type,
                description: vehicle.description,
                licensePlate: vehicle.licensePlate,
                color: vehicle.color
            };
        }

        if (capacity && !isNaN(capacity)) {
            driverData.capacity = parseInt(capacity, 10);
        }

        // Create driver in Onfleet
        console.log(driverData);
        // const driver = await createOnfleetDriver(driverData);

        res.status(201).json({
            success: true,
            message: 'Driver successfully created in Onfleet',
            driver: driverData
        });

    } catch (error) {
        console.error('Error in handleOnfleetOnboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create driver in Onfleet',
            error: error.message
        });
    }
};

export const handleStitchOnboard = async (req, res) => {
    try {
        const { firstName, lastName, email, phone } = req.body;
        
        const validationErrors = validateDriverData(firstName, lastName, phone);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: validationErrors
            });
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        // TODO: Add Stitch driver creation logic here
        
        res.status(200).json({
            success: true,
            message: 'Driver successfully onboarded to Stitch'
        });
    } catch (error) {
        console.error('Error onboarding driver to Stitch:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to onboard driver to Stitch'
        });
    }
};

// Function to fetch teams from Onfleet
export const getOnfleetTeams = async (req, res) => {
    try {
        const teams = await getOnfleetTeamsFromServer()
        res.json(teams);
    } catch (error) {
        console.error('Error fetching Onfleet teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams from Onfleet' });
    }
};
