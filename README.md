# Bluejay

A minimal Next.js 15 project with LiveKit integration, ready for AWS Amplify deployment.

## Tech Stack

- **Next.js** 15.5.7 with Turbopack
- **React** 19.1.0
- **TypeScript**
- **Tailwind CSS** 4.x
- **Package Manager**: Bun
- **LiveKit** packages pre-installed

## Quick Start

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
bluejay/
├── app/                  # Next.js App Router
│   └── page.tsx         # Home page (deployment status)
├── public/              # Static assets
├── amplify.yml          # AWS Amplify build configuration
├── DEPLOYMENT.md        # Detailed deployment guide
└── package.json         # Dependencies and scripts
```

## Deployment

This project is configured for **AWS Amplify** deployment with:
- ✅ Pre-configured `amplify.yml` build settings
- ✅ SSR (Server-Side Rendering) support
- ✅ Bun package manager configuration
- ✅ Build caching optimization

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.**

### Quick Deploy Steps

1. Push to GitHub
2. Connect repository to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
3. Let Amplify auto-detect the configuration
4. Deploy!

## LiveKit Integration

LiveKit packages are installed and ready to use:
- `livekit-client@2.16.0`
- `@livekit/components-react@2.9.17`
- `@livekit/components-styles@1.2.0`

To start building with LiveKit:
1. Set up LiveKit Cloud account at [cloud.livekit.io](https://cloud.livekit.io)
2. Add LiveKit credentials as Amplify environment variables
3. Follow the [LiveKit React Quickstart](https://docs.livekit.io/home/quickstarts/react/)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [LiveKit Documentation](https://docs.livekit.io/)
- [Next.js on Amplify Guide](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
