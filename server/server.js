import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import OpenAI from 'openai';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add debug logging for .env path
const envPath = join(__dirname, '../.env');
console.log('Looking for .env file at:', envPath);
dotenv.config({ path: envPath });

// Add validation logging
console.log('Environment variables loaded:');
console.log('SPEECH_KEY:', process.env.SPEECH_KEY ? 'Present' : 'Missing');
console.log('SPEECH_REGION:', process.env.SPEECH_REGION ? 'Present' : 'Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');

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

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Add this near the top after OpenAI initialization
console.log('OpenAI API Key status:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');

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

            // Prepare data for OpenAI
            const lowScoringPhonemes = finalResponse.phonemes
                .filter(p => p.accuracyScore < 70)
                .map(p => ({
                    phoneme: p.phoneme,
                    score: p.accuracyScore,
                    word: p.fromWord
                }));

            if (lowScoringPhonemes.length > 0) {
                try {
                    console.log('Attempting OpenAI API call with phonemes:', JSON.stringify(lowScoringPhonemes, null, 2));
                    
                    const aiPrompt = `As a speech therapist, provide specific advice for improving the pronunciation of these phonemes:
                        ${JSON.stringify(lowScoringPhonemes, null, 2)}
                        
                        For each problematic phoneme:
                        1. Explain how to position the mouth, tongue, and lips
                        2. Provide a simple exercise to practice the sound
                        3. Suggest 2-3 simple practice words
                        
                        Format the response in clear, simple bullet points. Make sure that it is formated in html format.`;

                    console.log('Sending prompt to OpenAI:', aiPrompt);

                    const aiResponse = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: "You are a helpful and kind speech therapist providing specific, actionable advice for pronunciation improvement."
                            },
                            {
                                role: "user",
                                content: aiPrompt
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 500
                    });

                    console.log('Received OpenAI response:', aiResponse.choices[0].message.content);
                    finalResponse.aiFeedback = aiResponse.choices[0].message.content;
                } catch (error) {
                    console.error('OpenAI API error details:', {
                        message: error.message,
                        type: error.type,
                        stack: error.stack
                    });
                    finalResponse.aiFeedback = "AI feedback unavailable at the moment. Error: " + error.message;
                }
            } else {
                console.log('No low-scoring phonemes found, skipping OpenAI call');
                finalResponse.aiFeedback = "Great job! All phonemes were pronounced well.";
            }

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