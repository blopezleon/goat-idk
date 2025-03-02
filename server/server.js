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
                sdk.PronunciationAssessmentGranularity.Word,
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
                        const pronunciation = sdk.PronunciationAssessmentResult.fromResult(e.result);
                        const words = pronunciation.detailResult?.Words || [];
                        console.log('Pronunciation details:', JSON.stringify(pronunciation.detailResult, null, 2));
                        
                        assessmentResults.push({
                            text: e.result.text,
                            pronunciation: pronunciation,
                            words: words.map(word => ({
                                Word: word.Word,
                                AccuracyScore: word.PronunciationAssessment?.AccuracyScore,
                                ErrorType: word.PronunciationAssessment?.ErrorType || 'None',
                                Duration: word.Duration,
                                Offset: word.Offset,
                                PronunciationAssessment: {
                                    AccuracyScore: word.PronunciationAssessment?.AccuracyScore || 0,
                                    CompletenessScore: word.PronunciationAssessment?.CompletenessScore || 0,
                                    FluencyScore: word.PronunciationAssessment?.FluencyScore || 0,
                                    PronunciationScore: word.PronunciationAssessment?.PronunciationScore || 0
                                }
                            }))
                        });
                    }
                };

                recognizer.recognizeOnceAsync(
                    result => resolve({ result, assessmentResults }),
                    error => reject(error)
                );
            });

            // Clean up
            recognizer.close();
            fs.unlinkSync(req.file.path);

            // Process results
            const transcription = result.result.text;
            
            // Process word-by-word results with better error handling
            const wordAnalysis = result.assessmentResults[0]?.words?.map(word => ({
                word: word.Word,
                accuracyScore: word.AccuracyScore || 0,
                errorType: word.ErrorType || 'None',
                duration: word.Duration,
                offset: word.Offset,
                pronunciation: {
                    accuracyScore: word.PronunciationAssessment?.AccuracyScore || 0,
                    completenessScore: word.PronunciationAssessment?.CompletenessScore || 0,
                    fluencyScore: word.PronunciationAssessment?.FluencyScore || 0,
                    pronunciationScore: word.PronunciationAssessment?.PronunciationScore || 0
                }
            })) || [];

            console.log('Word Analysis:', JSON.stringify(wordAnalysis, null, 2));

            // Calculate overall scores
            const overallScore = {
                PronScore: result.assessmentResults[0]?.pronunciation.pronunciationScore || 0,
                AccuracyScore: result.assessmentResults[0]?.pronunciation.accuracyScore || 0,
                FluencyScore: result.assessmentResults[0]?.pronunciation.fluencyScore || 0,
                CompletenessScore: result.assessmentResults[0]?.pronunciation.completenessScore || 0
            };

            console.log('Processed results:', {
                transcription,
                overallScore,
                wordAnalysis
            });

            res.json({
                transcription,
                overallScore,
                wordAnalysis,
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