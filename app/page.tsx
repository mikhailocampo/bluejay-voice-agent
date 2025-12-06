'use client';

import { useEffect, useRef } from 'react';
import {
  ControlBar,
  RoomAudioRenderer,
  useSession,
  SessionProvider,
  useAgent,
  BarVisualizer,
} from '@livekit/components-react';
import { TokenSource, TokenSourceConfigurable, TokenSourceFetchOptions } from 'livekit-client';
import '@livekit/components-styles';

export default function Home() {
  // Use the Next.js API route for token generation
  const tokenSource: TokenSourceConfigurable = useRef(
    TokenSource.endpoint('/api/token'),
  ).current;

  const tokenOptions: TokenSourceFetchOptions = { agentName: 'bluejay-agent' };

  const session = useSession(tokenSource, tokenOptions);

  // Connect to session
  useEffect(() => {
    console.log('Starting session...');
    session.start().catch((error) => {
      console.error('Failed to start session:', error);
    });
    return () => {
      console.log('Ending session...');
      session.end();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SessionProvider session={session}>
      <div className="font-sans flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Bluejay Voice AI
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Powered by LiveKit Agents
              </p>
            </div>

            {/* Voice Agent Interface */}
            <MyAgentView />

            {/* Control Bar */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <ControlBar
                controls={{
                  microphone: true,
                  camera: false,
                  screenShare: false,
                  chat: false,
                }}
              />
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-xs text-blue-800 dark:text-blue-300 text-center">
                <span className="font-semibold">Tip:</span> Click the microphone button above to start talking with the AI assistant
              </p>
            </div>
          </div>

          {/* Audio Renderer */}
          <RoomAudioRenderer />
        </div>
      </div>
    </SessionProvider>
  );
}

function MyAgentView() {
  const agent = useAgent();

  const getStateColor = (state: string) => {
    switch (state) {
      case 'listening': return 'bg-green-500';
      case 'thinking': return 'bg-yellow-500';
      case 'speaking': return 'bg-blue-500';
      case 'idle': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'listening': return 'Listening...';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      case 'idle': return 'Ready';
      case 'initializing': return 'Connecting...';
      default: return state;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 min-h-[300px] flex flex-col items-center justify-center space-y-6">
      {/* Agent State Indicator */}
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${getStateColor(agent.state)} ${agent.state !== 'idle' ? 'animate-pulse' : ''}`}></div>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {getStateText(agent.state)}
        </p>
      </div>

      {/* Audio Visualizer */}
      {agent.canListen && agent.microphoneTrack && (
        <div className="w-full max-w-md">
          <BarVisualizer
            track={agent.microphoneTrack}
            state={agent.state}
            barCount={7}
          />
        </div>
      )}

      {/* Connection Status */}
      {agent.state === 'initializing' && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Connecting to voice agent...
        </p>
      )}

      {agent.state === 'idle' && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enable your microphone to start
        </p>
      )}
    </div>
  );
}
