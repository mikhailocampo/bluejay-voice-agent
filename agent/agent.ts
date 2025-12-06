import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  defineAgent,
  voice,
} from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    // Preload the VAD model to reduce latency on first connection
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const vad = ctx.proc.userData.vad! as silero.VAD;

    // Create the voice agent with instructions
    const agent = new voice.Agent({
      instructions: `You are Bluejay, a helpful and friendly voice AI assistant.
You assist users with their questions by providing clear, concise information.
Your responses should be conversational and natural for voice - avoid complex formatting, bullet points, or special characters.
Keep responses brief and to the point since this is a voice conversation.
You are curious, friendly, and have a warm personality.`,
    });

    // Create the agent session with STT-LLM-TTS pipeline using LiveKit Inference
    const session = new voice.AgentSession({
      // Voice Activity Detection - detects when user is speaking
      vad,
      // Speech-to-Text - converts user's speech to text
      stt: 'assemblyai/universal-streaming:en',
      // Large Language Model - generates responses
      llm: 'openai/gpt-4.1-mini',
      // Text-to-Speech - converts agent's text response to speech
      tts: 'cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
      // Turn detection - determines when user has finished speaking
      turnDetection: new livekit.turnDetector.MultilingualModel(),
    });

    // Start the session with the agent
    await session.start({
      agent,
      room: ctx.room,
      inputOptions: {
        // Noise cancellation for cleaner audio input
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    // Greet the user when they connect
    session.say('Hello! I\'m Bluejay, your voice assistant. How can I help you today?');
  },
});

// Run the agent with explicit agent name for dispatch
cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    // This must match the agentName in the frontend's tokenOptions
    agentName: 'bluejay-agent',
  }),
);

