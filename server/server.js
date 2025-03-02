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
    origin: ['http://127.0.0.1:5500', 'http://localhost:3000'],
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

// Add reference text endpoint
let currentReferenceText = "Please generate a tongue twister first";

app.post('/api/set-reference', (req, res) => {
    if (req.body && req.body.referenceText) {
        currentReferenceText = req.body.referenceText;
        res.json({ success: true, message: 'Reference text updated' });
    } else {
        res.status(400).json({ error: 'No reference text provided' });
    }
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
            // Create pronunciation assessment config
            const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
                currentReferenceText,
                sdk.PronunciationAssessmentGradingSystem.HundredMark,
                sdk.PronunciationAssessmentGranularity.Phoneme,
                true
            );

            // Create audio config
            const audioConfig = sdk.AudioConfig.fromWavFileInput(
                fs.readFileSync(req.file.path)
            );

            // Configure speech settings with more detailed options
            speechConfig.enableAudioLogging();
            speechConfig.setProfanity(sdk.ProfanityOption.Raw);
            speechConfig.setServiceProperty('wordLevelTimings', 'true', sdk.ServicePropertyChannel.UriQueryParameter);
            speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_PostProcessingOption, 'detailed');

            // Create speech recognizer with pronunciation assessment
            const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
            pronunciationConfig.applyTo(recognizer);

            // Enable more detailed recognition
            recognizer.recognizing = (s, e) => {
                console.log(`RECOGNIZING: Text=${e.result.text}`);
            };

            // Perform recognition and assessment
            const result = await new Promise((resolve, reject) => {
                let assessmentResults = [];

                recognizer.recognized = (s, e) => {
                    if (e.result.text) {
                        console.log('Full recognition result:', e.result);
                        
                        // Access the properties directly from the result
                        const properties = JSON.parse(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult));
                        console.log('Parsed properties:', properties);

                        // Extract all phonemes
                        const allPhonemes = [];
                        if (properties.NBest && properties.NBest[0] && properties.NBest[0].Words) {
                            properties.NBest[0].Words.forEach(word => {
                                if (word.Phonemes) {
                                    word.Phonemes.forEach(phoneme => {
                                        allPhonemes.push({
                                            phoneme: phoneme.Phoneme,
                                            accuracyScore: Math.round(phoneme.PronunciationAssessment?.AccuracyScore || 0),
                                            fromWord: word.Word,
                                            duration: phoneme.Duration,
                                            offset: phoneme.Offset
                                        });
                                    });
                                }
                            });
                        }

                        console.log('Extracted phonemes:', allPhonemes);

                        assessmentResults.push({
                            text: e.result.text,
                            phonemes: allPhonemes
                        });
                    }
                };

                recognizer.recognizeOnceAsync(
                    result => {
                        console.log('Recognition completed');
                        resolve({ result, assessmentResults });
                    },
                    error => reject(error)
                );
            });

            // Format the final response
            const finalResponse = {
                transcription: result.result.text,
                phonemes: result.assessmentResults[0]?.phonemes || [],
                feedback: 'Speech analysis completed'
            };

            console.log('Final response:', JSON.stringify(finalResponse, null, 2));
            res.json(finalResponse);

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