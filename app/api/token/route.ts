import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

async function generateToken(request: Request) {
  try {
    console.log('Token request received:', request.method, request.url);

    // Try to get params from query string (GET) or request body (POST)
    const { searchParams } = new URL(request.url);
    let identity = searchParams.get('identity');
    let roomName = searchParams.get('room');
    let agentName = searchParams.get('agentName');

    // If POST request, try to get params from body
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        identity = identity || body.identity;
        roomName = roomName || body.room;
        agentName = agentName || body.agentName;
      } catch {
        // Body parsing failed, use defaults
      }
    }

    // Use defaults if not provided
    identity = identity || `user-${Math.random().toString(36).substring(7)}`;
    roomName = roomName || 'default-room';

    // Validate required environment variables
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    // Temporary debug - check for whitespace/encoding issues
    console.log('API Key:', JSON.stringify(apiKey));
    console.log('API Secret length:', apiSecret?.length);
    console.log('API Secret first 4 chars:', apiSecret?.substring(0, 4));
    console.log('API Secret last 4 chars:', apiSecret?.substring(apiSecret.length - 4));


    if (!apiKey || !apiSecret) {
      console.error('Missing LiveKit credentials');
      return NextResponse.json(
        { error: 'Server configuration error - missing LiveKit credentials' },
        { status: 500 }
      );
    }

    // Create access token
    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      // Token expires in 1 hour
      ttl: '1h',
    });

    // Grant permissions
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Add agent metadata if provided
    if (agentName) {
      token.metadata = JSON.stringify({ agentName });
    }

    const jwt = await token.toJwt();

    // Check multiple possible environment variable names
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

    console.log('Token generated successfully for identity:', identity, 'room:', roomName, 'agentName:', agentName);
    console.log('LiveKit URL:', liveKitUrl);

    return NextResponse.json({
      accessToken: jwt,
      serverUrl: liveKitUrl,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

// Handle both GET and POST requests
export async function GET(request: Request) {
  return generateToken(request);
}

export async function POST(request: Request) {
  return generateToken(request);
}

// Enable CORS for local development if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
