'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ControlBar,
  RoomAudioRenderer,
  useSession,
  SessionProvider,
  useAgent,
  BarVisualizer,
  useSessionMessages,
} from '@livekit/components-react';
import { TokenSource, TokenSourceConfigurable, TokenSourceFetchOptions, ConnectionState } from 'livekit-client';
import '@livekit/components-styles';

export default function Home() {
  // Use the Next.js API route for token generation
  const tokenSource: TokenSourceConfigurable = useRef(
    TokenSource.endpoint('/api/token'),
  ).current;

  const tokenOptions: TokenSourceFetchOptions = { agentName: 'bluejay-agent' };

  const session = useSession(tokenSource, tokenOptions);

  const isConnected = session.connectionState === ConnectionState.Connected;
  const isConnecting = session.connectionState === ConnectionState.Connecting;

  const handleStartCall = async () => {
    console.log('Starting session...');
    try {
      await session.start();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleEndCall = () => {
    console.log('Ending session...');
    session.end();
  };

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

            {/* Call Control Button */}
            <div className="flex justify-center">
              {!isConnected ? (
                <button
                  onClick={handleStartCall}
                  disabled={isConnecting}
                  className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-semibold rounded-full text-lg shadow-lg transition-all duration-200 flex items-center gap-3"
                >
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Start Call
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleEndCall}
                  className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full text-lg shadow-lg transition-all duration-200 flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                  End Call
                </button>
              )}
            </div>

            {/* Voice Agent Interface - only show when connected */}
            {isConnected && (
              <>
                <MyAgentView />

                {/* Control Bar */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <ControlBar
                    controls={{
                      microphone: true,
                      camera: false,
                      screenShare: false,
                      chat: false,
                      leave: false,
                    }}
                  />
                </div>
              </>
            )}

            {/* Info Banner - show different message based on state */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-xs text-blue-800 dark:text-blue-300 text-center">
                {isConnected ? (
                  <>
                    <span className="font-semibold">Tip:</span> Click the microphone button above to start talking with the AI assistant
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Ready:</span> Click &quot;Start Call&quot; to connect with your Darius coaching assistant
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Audio Renderer - only needed when connected */}
          {isConnected && <RoomAudioRenderer />}
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
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 min-h-[300px] flex flex-col space-y-6">
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

      {/* Live Transcript */}
      <TranscriptView />
    </div>
  );
}

function TranscriptView() {
  const { messages } = useSessionMessages();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const lastMessageCountRef = useRef(0);

  // Handle auto-scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50; // 50px threshold

    // Auto-scroll if user is at bottom or if it's a new user message
    if (isAtBottom || !isUserScrolled) {
      container.scrollTop = container.scrollHeight;
      setIsUserScrolled(false);
    }

    // Track if user manually scrolled up
    const handleScroll = () => {
      const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      setIsUserScrolled(!atBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages, isUserScrolled]);

  // Reset scroll state when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      // Check if the last message is from user (auto-scroll for user messages)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.type === 'userTranscript') {
        setIsUserScrolled(false);
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Live Transcript
      </h3>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto max-h-[300px] space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Start speaking to begin the conversation
          </p>
        ) : (
          messages.map((message) => {
            const isUser = message.type === 'userTranscript';
            const isAgent = message.type === 'agentTranscript';
            const isChat = message.type === 'chatMessage' || message.type === undefined;

            return (
              <div
                key={message.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isUser
                      ? 'bg-blue-500 text-white'
                      : isAgent
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 opacity-80">
                    {isUser ? 'You' : isAgent ? 'Agent' : 'System'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {isUser || isAgent
                      ? message.message
                      : isChat && 'message' in message
                        ? message.message
                        : String(message)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
