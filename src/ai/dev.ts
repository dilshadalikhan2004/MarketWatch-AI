
import { config } from 'dotenv';
config();

// Import your AI flows here
import '@/ai/flows/ai-investment-assistant';
import '@/ai/flows/sentiment-analysis';

console.log("Genkit development server started with flows loaded.");
// You can add more development-specific logic here if needed.
