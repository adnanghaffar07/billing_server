import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';
import routes from './routes/routes.js';
import { AppError, errorHandler } from './utils/errorHandling.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/************** Middlewares ****************/
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.json({limit: '10kb'}));
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser());

// Configure CORS to allow credentials
const corsOptions = {
    origin: 'http://localhost:4000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

/************** Routes ****************/
app.use('/', routes);

// 404 handler
app.use((req, res, next) => {
    const err = new AppError(`Can't find ${req.originalUrl} on this server.`, 404);
    next(err);
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
