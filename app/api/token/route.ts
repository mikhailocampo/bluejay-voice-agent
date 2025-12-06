import { AccessToken } from 'livekit-server-sdk';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';
import { NextResponse } from 'next/server';

// Standard TokenSourceRequest format from livekit-client SDK
interface TokenSourceRequest {
  room_name?: string;
  participant_name?: string;
  participant_identity?: string;
  participant_metadata?: string;
  participant_attributes?: Record<string, string>;
  room_config?: {
    agents?: Array<{
      agent_name?: string;
      metadata?: string;
    }>;
  };
}

async function generateToken(request: Request) {
  try {
    console.log('Token request received:', request.method, request.url);

    // Parse request body for POST requests (standard TokenSourceRequest format)
    let body: TokenSourceRequest = {};
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch {
        // Body parsing failed, use defaults
      }
    }

    // Extract values from the standard TokenSourceRequest format
    const roomName = body.room_name || `room-${Math.random().toString(36).substring(7)}`;
    const participantIdentity = body.participant_identity || body.participant_name || `user-${Math.random().toString(36).substring(7)}`;
    const participantName = body.participant_name || participantIdentity;
    const participantMetadata = body.participant_metadata;
    const participantAttributes = body.participant_attributes;
    
    // Extract agent dispatch configuration from room_config
    const agentName = body.room_config?.agents?.[0]?.agent_name;
    const agentMetadata = body.room_config?.agents?.[0]?.metadata;

    // Validate required environment variables
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('Missing LiveKit credentials');
      return NextResponse.json(
        { error: 'Server configuration error - missing LiveKit credentials' },
        { status: 500 }
      );
    }

    // Create access token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      // Token expires in 10 minutes
      ttl: '10m',
    });

    // Add participant metadata if provided
    if (participantMetadata) {
      token.metadata = participantMetadata;
    }

    // Add participant attributes if provided
    if (participantAttributes) {
      token.attributes = participantAttributes;
    }

    // Grant permissions
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    });

    // Configure agent dispatch if agent name is provided
    if (agentName) {
      token.roomConfig = new RoomConfiguration({
        agents: [
          new RoomAgentDispatch({
            agentName: agentName,
            metadata: agentMetadata,
          }),
        ],
      });
    }

    const jwt = await token.toJwt();

    // Get LiveKit server URL
    const liveKitUrl =
      process.env.LIVEKIT_URL ||
      process.env.LIVEKIT_WS_URL ||
      process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!liveKitUrl) {
      console.error('Missing LIVEKIT_URL environment variable');
      return NextResponse.json(
        { error: 'Server configuration error - missing LiveKit URL' },
        { status: 500 }
      );
    }

    console.log('Token generated successfully:', {
      identity: participantIdentity,
      room: roomName,
      agentName: agentName || 'auto-dispatch',
    });

    // Return standard TokenSourceResponse format (snake_case)
    return NextResponse.json({
      participant_token: jwt,
      server_url: liveKitUrl,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

// Handle POST requests (standard for TokenSource.endpoint)
export async function POST(request: Request) {
  return generateToken(request);
}

// Enable CORS for local development if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
