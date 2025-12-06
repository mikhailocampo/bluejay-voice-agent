import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  defineAgent,
  llm,
  voice,
} from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { BedrockAgentRuntimeClient, RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { RoomEvent, ParticipantKind, type Participant } from '@livekit/rtc-node';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

// Session timeout configuration
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Bedrock client for Knowledge Base retrieval
// Explicitly pass credentials to override default credential chain (SSO, etc.)
const bedrockClient = new BedrockAgentRuntimeClient({
  region: 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// RAG tool for searching Darius guides in Bedrock Knowledge Base
const searchDariusGuides = llm.tool({
  description: `Search the Darius knowledge base for champion-specific information including matchups, combos, builds, runes, ability usage, laning phase, teamfighting, and game phase strategies. Use when user asks gameplay questions about Darius.`,
  parameters: z.object({
    query: z.string().describe('Search query for Darius guide information'),
  }),
  execute: async ({ query }) => {
    const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID;
    
    if (!knowledgeBaseId) {
      console.error('BEDROCK_KNOWLEDGE_BASE_ID environment variable is not set');
      return 'Knowledge base is not configured. Please set BEDROCK_KNOWLEDGE_BASE_ID.';
    }

    try {
      const command = new RetrieveCommand({
        knowledgeBaseId,
        retrievalQuery: { text: query },
        retrievalConfiguration: {
          vectorSearchConfiguration: { numberOfResults: 5 },
        },
      });

      const response = await bedrockClient.send(command);
      const results = response.retrievalResults
        ?.filter((r) => (r.score ?? 0) > 0.3)
        .map((r) => r.content?.text)
        .join('\n\n---\n\n');

      console.log(results)
      return results || 'No relevant Darius information found.';
    } catch (error: unknown) {
      const err = error as Error & { name?: string; $metadata?: { httpStatusCode?: number } };
      console.error('Bedrock retrieval error:', {
        name: err.name,
        message: err.message,
        statusCode: err.$metadata?.httpStatusCode,
      });
      return `Failed to search knowledge base: ${err.message}`;
    }
  },
});

// Darius coaching agent with RAG tool
class DariusCoachAgent extends voice.Agent {
  constructor() {
    super({
      instructions: `You are a League of Legends Darius coaching assistant.
You help players improve their Darius gameplay with advice on combos, matchups, builds, runes, and strategy.
Use searchDariusGuides when users ask about Darius mechanics, matchups, item builds, or game phases.

NOTE: You're ONLY allowed to respond using the returned output from the darius guides tool. Simply note if the tool had failed or what you see.

Keep responses conversational and brief for voice. Reference specific tips from guide results.
Your responses should be natural for voice - avoid complex formatting, bullet points, or special characters.`,
      tools: { searchDariusGuides },
    });
  }
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    // Preload the VAD model to reduce latency on first connection
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const vad = ctx.proc.userData.vad! as silero.VAD;

    // Create the Darius coach agent with RAG tool
    const agent = new DariusCoachAgent();

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

    // --- Error Handling ---

    // Listen for errors from STT, LLM, TTS to get detailed diagnostics
    session.on(voice.AgentSessionEventTypes.Error, (event) => {
      // ErrorEvent contains: error (with type, recoverable, error fields), modelConfig, source
      const errorInfo = event.error as { 
        type?: string; 
        recoverable?: boolean; 
        error?: Error & { cause?: unknown; code?: string };
      };
      
      const innerError = errorInfo.error;
      const errorDetails = {
        errorType: errorInfo.type, // 'tts_error', 'stt_error', 'llm_error', etc.
        recoverable: errorInfo.recoverable,
        message: innerError?.message,
        name: innerError?.name,
        stack: innerError?.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
        cause: innerError?.cause,
        code: innerError?.code,
      };

      if (errorInfo.recoverable) {
        console.warn('Recoverable error occurred:', errorDetails);
      } else {
        console.error('Unrecoverable error occurred:', errorDetails);
      }
    });

    // --- Connection Guardrails ---

    // Track idle timeout
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        console.log('Session idle timeout reached, shutting down');
        ctx.shutdown('Idle timeout');
      }, IDLE_TIMEOUT_MS);
    };

    // Start the idle timer
    resetIdleTimer();

    // Reset idle timer on user activity
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, () => {
      resetIdleTimer();
    });

    // Shutdown when participant disconnects
    ctx.room.on(RoomEvent.ParticipantDisconnected, (participant: Participant) => {
      // Only shutdown if a non-agent participant disconnects
      if (participant.kind !== ParticipantKind.AGENT) {
        console.log(`Participant ${participant.identity} disconnected, shutting down session`);
        ctx.shutdown('Participant disconnected');
      }
    });

    // Register shutdown callback for cleanup
    ctx.addShutdownCallback(async () => {
      console.log('Session shutdown initiated, cleaning up resources');
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    });

    // Greet the user when they connect
    session.say("Hey! I'm your Darius coach. Ask me anything about combos, matchups, builds, or how to dominate your lane!");
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
