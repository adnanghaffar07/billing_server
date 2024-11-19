import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFilePath = path.join(__dirname, '../config/users.json');
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Function to validate credentials
const validateCredentials = (username, password) => {
    try {
        const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
        return usersData.users.some(user => 
            user.username === username && user.password === password
        );
    } catch (error) {
        console.error('Error reading users file:', error);
        return false;
    }
};

// Login handler
export const handleLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }

        if (validateCredentials(username, password)) {
            // Create JWT token
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
            
            // Set JWT as HTTP-only cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            return res.status(200).json({ 
                success: true, 
                message: 'Login successful'
            });
        }

        return res.status(401).json({ 
            success: false, 
            message: 'Invalid username or password' 
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Verify authentication status
export const verifyAuth = async (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.status(200).json({
            success: true,
            message: 'Authenticated',
            user: decoded
        });
    } catch (error) {
        res.clearCookie('token', { path: '/' });
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Authentication middleware for API routes
export const requireAuth = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.clearCookie('token', { path: '/' });
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Logout handler
export const handleLogout = async (req, res) => {
    res.clearCookie('token', { path: '/' });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};
