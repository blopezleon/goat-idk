const express = require('express');
const cors = require('cors');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Azure Speech config
const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION
);

app.post('/api/analyze-speech', async (req, res) => {
    try {
        // Save the incoming audio blob to a temporary file
        const audioData = req.body.audio;
        const audioBuffer = Buffer.from(audioData.split('base64,')[1], 'base64');
        fs.writeFileSync('temp-audio.wav', audioBuffer);

        // Create audio config from the temp file
        const audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync('temp-audio.wav'));
        
        // Create pronunciation assessment config
    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
            req.body.referenceText || "This is a test.",
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        true
    );

        // Create recognizer
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
        pronunciationAssessmentConfig.applyTo(recognizer);

        let results = {
            transcription: '',
            scores: {
                accuracy: 0,
                fluency: 0,
                completeness: 0,
                prosody: 0,
                pronunciation: 0
            },
            words: []
        };

        // Handle recognition
        recognizer.recognized = function (s, e) {
            if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(e.result);
                results.transcription += e.result.text + ' ';
                results.scores.accuracy = pronunciationResult.accuracyScore;
                results.scores.fluency = pronunciationResult.fluencyScore;
                results.scores.completeness = pronunciationResult.completenessScore;
                
                // Get detailed word-level assessment
                const detailedResults = JSON.parse(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult));
                results.words = detailedResults.NBest[0].Words;
            }
        };

        // Start recognition
        await new Promise((resolve, reject) => {
            recognizer.recognizeOnceAsync(
                result => {
                    recognizer.close();
                    resolve(result);
                },
                error => {
                    recognizer.close();
                    reject(error);
                }
            );
        });

        // Clean up temp file
        fs.unlinkSync('temp-audio.wav');

        res.json(results);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error processing speech analysis' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});