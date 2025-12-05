export default function Home() {
  return (
    <div className="font-sans flex items-center justify-center min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              Bluejay
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              AWS Amplify + Next.js + LiveKit
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Deployment Successful
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Framework
                </h3>
                <p className="font-mono text-sm text-gray-900 dark:text-white">
                  Next.js 15.5.7 (with Turbopack)
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  LiveKit Packages Installed
                </h3>
                <ul className="font-mono text-sm text-gray-900 dark:text-white space-y-1">
                  <li>livekit-client@2.16.0</li>
                  <li>@livekit/components-react@2.9.17</li>
                  <li>@livekit/components-styles@1.2.0</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  React Version
                </h3>
                <p className="font-mono text-sm text-gray-900 dark:text-white">
                  React 19.1.0
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-semibold">Next steps:</span> Configure LiveKit credentials and build your real-time application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
