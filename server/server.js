import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Check for required environment variables
if (!process.env.SPEECH_KEY || !process.env.SPEECH_REGION) {
    console.error('Missing required environment variables SPEECH_KEY and/or SPEECH_REGION');
    process.exit(1);
}

const app = express();
const upload = multer({ dest: 'uploads/' });

// More flexible CORS configuration
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/analyze', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'analyze.html'));
});

app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.post('/api/analyze-speech', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No audio file received');
        }

        console.log('Received audio file:', {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: req.file.path
        });

        // Configure speech settings
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            process.env.SPEECH_KEY,
            process.env.SPEECH_REGION
        );
        speechConfig.speechRecognitionLanguage = "en-US";

        try {
            // Create audio config from the file
            const audioConfig = sdk.AudioConfig.fromWavFileInput(
                fs.readFileSync(req.file.path)
            );

            // Create speech recognizer
            const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

            // Perform recognition
            const result = await new Promise((resolve, reject) => {
                recognizer.recognizeOnceAsync(
                    result => resolve(result),
                    error => reject(error)
                );
            });

            // Clean up
            recognizer.close();
            fs.unlinkSync(req.file.path);

            console.log('Recognition result:', result);

            res.json({
                transcription: result.text,
                feedback: 'Speech analysis completed'
            });

        } catch (error) {
            console.error('Speech recognition error:', error);
            res.status(500).json({
                error: 'Speech recognition failed: ' + error.message
            });
        }

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment variables loaded:', {
        SPEECH_KEY: process.env.SPEECH_KEY ? 'Present' : 'Missing',
        SPEECH_REGION: process.env.SPEECH_REGION
    });
});