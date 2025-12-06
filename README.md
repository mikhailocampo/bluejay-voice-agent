# Bluejay Demo

A voice-enabled League of Legends coaching assistant using LiveKit Agents and Next.js.

League of Legends (LoL) is an esports MOBA game in which 10 players in 2 teams compete to destroy the opposing nexus. Each time has symmetrical starting resources such as turret defenses (objectives) and minions to then raise gold and experience points to enhance their respective champion. In this system, I attempt to create an LoL coach specifically for the champion, Darius because he's one of my favorite champions to play.

**Testable Link**: https://main.d2g7ps13beo37o.amplifyapp.com/

### Tech

- AWS Amplify (frontend)
- AWS Bedrock KnowledgeBase (AWS Aurora Serverless for vector store)
- Livekit Cloud (Agent)
- AWS Compute (/token auth for frontend)
- Typescript, TailwindCSS
- Serper.dev (Scraping)

EMBEDDING MODEL: Titan Text Embeddings v2; float vector; 1024 dim
VAD: Silero
STT: Assembly
LLM: GPT-4.1-mini (Bedrock KB)
TTS: Cartesia

### System Design

The system implements a real-time voice coaching assistant using a multi-tier architecture. The frontend (Next.js/React) establishes a WebRTC connection to LiveKit Cloud, which orchestrates media routing to a serverless LiveKit Agent. Amplify hosts the frontend and a simple /token route enabled by AWS compute provisioned by Amplify.

The agent implements a voice interaction pipeline: Silero VAD detects speech boundaries, AssemblyAI STT transcribes user audio to text, and OpenAI GPT-4.1-mini processes queries with tool-calling capabilities. When domain-specific knowledge is required, the LLM invokes a RAG tool that queries an AWS Bedrock Knowledge Base containing indexed Darius gameplay guides, using vector similarity search to retrieve relevant context.

The enriched LLM response is synthesized to speech via Cartesia TTS and streamed back through LiveKit to the client.

The agent employs connection guardrails including idle timeouts and participant lifecycle management, with noise cancellation applied to input audio for improved transcription accuracy. All components communicate asynchronously through LiveKit's media server, enabling low-latency voice interactions with sub-second response times.

### Decision Decisions

The Knowledge Base uses a serverless Aurora instance to store the embedded documents from S3 and I wrap the Bedrock API as a tool available to the LLM. There are a total of 4 guides scraped from MOBAFire and Eneba which are authored by high-elo players selected for their depth and accuracy to typical high-elo Darius decisions and thinking (I am a Plat-Emerald player which is considered low-echelon high-elo). The guides were scraped using Serper.dev.

I chose a naive chunking strategy of ~300 tokens per chunk on a markdown file for speed of implementation. A better approach is likely to leverage the markdown structure, but this would have required a custom lambda to attach to the KnowledgeBase. The hierarchal chunking strategy is also possible as to provide a table of contents with which the LLM can then chain questions according to the parent-child relationships identified, but this too was passed in favor of faster iteration.

#### Limits
- Typically after 4 turns, the agent experiences an `APIConnectionError` (after retrying TTS model 3 times) and is prone to abort the session unknowingly to the user.

- According to Livekit cloud, the livekit agent can only handle up to ~5 connections to their models in the pipeline; this would not scale to many concurrent users.

> As of writing, AWS Bedrock does NOT have us-west-1 KnowledgeBases available therefore we have the KnowledgeBase (and S3 bucket) hosted on us-west-2 while Amplify is hosted on us-west-1. This introduces some latency and is more optimal to co-locate the regions.

#### RAG Decision
One decision to make on the agent design was whether to have the RAG call preemptive to the LLM generation or allow the LLM to call the RAG tool when needed. Choosing to have preemptive retrieval trades accuracy (of retrieved documents) for speed while allowing the model to pass in a new query based on the user's request as a RAG tool trades latency for accuracy. In the context of the guide, giving targeted advice is more important than latency.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (Browser)                          │
│                     Next.js 15 + React 19                       │
│                  LiveKit Client Components                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ WebRTC
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LiveKit Cloud                            │
│                    (Real-time Media Server)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                      LiveKit Agent                             │
│                   (Darius Coach Assistant)                     │
│                                                                │
│  ┌──────────┐      ┌──────────┐       ┌──────────────────────┐ │
│  │   VAD    │ ───> │   STT    │ ───>  │        LLM           │ │
│  │ (Silero) │      │(Assembly)│       │   (GPT-4.1-mini)     │ │
│  └──────────┘      └──────────┘       │                      │ │
│                                       │   ┌──────────────┐   │ │
│                                       │   │  RAG Tool    │   │ │
│                                       │   │ (Bedrock KB) │   │ │
│                                       │   └──────────────┘   │ │
│                                       └──────────┬───────────┘ │
│                                                  │             │
│                                                  ▼             │
│                                       ┌──────────────────────┐ │
│                                       │        TTS           │ │
│                                       │    (Cartesia)        │ │
│                                       └──────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                   ┌────────────────────┐
                   │  AWS Bedrock       │
                   │  Knowledge Base    │
                   │  (Darius Guides)   │
                   └────────────────────┘
```

### Flow

1. **VAD (Voice Activity Detection)** - Silero detects when user speaks
2. **STT (Speech-to-Text)** - AssemblyAI transcribes user audio
3. **LLM + RAG** - GPT-4.1-mini processes query, uses RAG tool to search Bedrock Knowledge Base for Darius guide info
4. **TTS (Text-to-Speech)** - Cartesia converts response to natural speech
5. **Delivery** - Audio streams back to user through LiveKit Cloud

---

## Setup

### AWS Resources (us-west-2)

1. **S3 Bucket** - Upload markdown guides to S3
2. **Bedrock Knowledge Base** - Create KB with Titan Text Embeddings v2, link to S3 datasource, sync documents
3. **Aurora Serverless v2** - Auto-provisioned as vector store when creating KB
4. **IAM** - Create user with Bedrock/S3 access, export `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
5. Note KB ID for agent `.env.local`

### LiveKit Cloud

1. Create project at [cloud.livekit.io](https://cloud.livekit.io)
2. Add agent dispatch rule: `agentName: bluejay-agent`
3. Export `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

### Local Development

```bash
# Frontend (root)
bun install
bun run dev  # localhost:3000

# Agent (agent/)
cd agent
bun install
cp .env.local.example .env.local  # Add credentials
bun run dev  # Connects to LiveKit Cloud
```

Required env vars in `agent/.env.local`:

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `BEDROCK_KNOWLEDGE_BASE_ID`
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

Frontend env vars in root `.env.local`:

- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

### AI Tools Used
- Claude Code + LiveKit MCP
- Cursor + LiveKit MCP