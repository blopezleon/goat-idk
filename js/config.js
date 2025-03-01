// This file will load and export the environment variables
const config = {
    AZURE_SPEECH_KEY: '',
    AZURE_SPEECH_REGION: ''
};

// Function to load environment variables from .env file
async function loadEnvironmentVariables() {
    try {
        const response = await fetch('/.env');
        const text = await response.text();
        
        // Parse .env file
        const lines = text.split('\n');
        lines.forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                config[key.trim()] = value.trim();
            }
        });
    } catch (error) {
        console.error('Error loading environment variables:', error);
    }
}

// Load environment variables when the script is loaded
await loadEnvironmentVariables();

export default config; 