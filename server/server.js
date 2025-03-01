import express from 'express';
import cors from 'cors';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();

// More flexible CORS configuration
app.use(cors({
    // Allow all origins in development
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') 
        : '*',
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

// Azure Speech config
const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION
);

app.post('/api/analyze-speech', async (req, res) => {
    try {
        console.log('1. Received audio analysis request');
        
        if (!req.body || !req.body.audio) {
            throw new Error('No audio data received');
        }

        console.log('2. Audio data received, length:', req.body.audio.length);
        
        // Extract the base64 audio data
        const base64Data = req.body.audio.split('base64,')[1];
        console.log('3. Base64 data extracted, length:', base64Data.length);
        
        const audioBuffer = Buffer.from(base64Data, 'base64');
        console.log('4. Converted to audio buffer, size:', audioBuffer.length);

        // Create WAV header
        const wavHeader = Buffer.alloc(44);
        
        // "RIFF" identifier
        wavHeader.write('RIFF', 0);
        // File size
        wavHeader.writeUInt32LE(audioBuffer.length + 36, 4);
        // "WAVE" identifier
        wavHeader.write('WAVE', 8);
        // "fmt " chunk
        wavHeader.write('fmt ', 12);
        // Chunk size
        wavHeader.writeUInt32LE(16, 16);
        // Audio format (1 for PCM)
        wavHeader.writeUInt16LE(1, 20);
        // Number of channels
        wavHeader.writeUInt16LE(1, 22);
        // Sample rate
        wavHeader.writeUInt32LE(16000, 24);
        // Byte rate
        wavHeader.writeUInt32LE(16000 * 2, 28);
        // Block align
        wavHeader.writeUInt16LE(2, 32);
        // Bits per sample
        wavHeader.writeUInt16LE(16, 34);
        // "data" chunk
        wavHeader.write('data', 36);
        // Data size
        wavHeader.writeUInt32LE(audioBuffer.length, 40);

        // Combine header and audio data
        const wavFile = Buffer.concat([wavHeader, audioBuffer]);
        
        // Save to temp file
        const tempFile = `temp-audio-${Date.now()}.wav`;
        const tempFilePath = path.join(__dirname, tempFile);
        fs.writeFileSync(tempFilePath, wavFile);
        console.log('Audio file saved temporarily at:', tempFilePath);

        // Configure speech settings
        speechConfig.speechRecognitionLanguage = "en-US";
        const audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(tempFilePath));
        
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        // Create pronunciation assessment config
    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
            req.body.referenceText || "This is a test.",
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        true
    );
        
        pronunciationAssessmentConfig.applyTo(recognizer);

        let results = {
            transcription: '',
            scores: {
                accuracy: 0,
                fluency: 0,
                completeness: 0,
                pronunciation: 0
            },
            words: []
        };

        // Handle the recognition
        recognizer.recognized = (s, e) => {
            console.log('Recognition event received:', e.result);
            if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(e.result);
                results.transcription += e.result.text + ' ';
                results.scores.accuracy = pronunciationResult.accuracyScore;
                results.scores.fluency = pronunciationResult.fluencyScore;
                results.scores.completeness = pronunciationResult.completenessScore;
                
                try {
                    const detailedResults = JSON.parse(
                        e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)
                    );
                    results.words = detailedResults.NBest[0].Words;
                } catch (error) {
                    console.error('Error parsing detailed results:', error);
                }
            }
        };

        // Start recognition and wait for result
        await new Promise((resolve, reject) => {
            recognizer.recognizeOnceAsync(
                result => {
                    recognizer.close();
                    console.log('Recognition completed successfully');
                    resolve(result);
                },
                error => {
                    recognizer.close();
                    console.error('Recognition error:', error);
                    reject(error);
                }
            );
        });

        // Clean up temp file
        try {
            fs.unlinkSync(tempFilePath);
            console.log('Temporary file deleted');
        } catch (error) {
            console.error('Error deleting temporary file:', error);
        }

        console.log('Sending results back to client:', results);
        res.json(results);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});