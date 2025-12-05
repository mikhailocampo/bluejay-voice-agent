# Bluejay - AWS Amplify Deployment Guide

## Project Overview

This is a minimal Next.js 15 project with LiveKit packages installed, ready for deployment to AWS Amplify.

### Tech Stack
- **Framework**: Next.js 15.5.7 (with Turbopack)
- **React**: 19.1.0
- **Package Manager**: Bun
- **LiveKit Packages**:
  - livekit-client@2.16.0
  - @livekit/components-react@2.9.17
  - @livekit/components-styles@1.2.0

## Local Development

### Prerequisites
- Bun installed ([bun.sh](https://bun.sh))

### Commands
```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run linter
bun run lint
```

The dev server runs on `http://localhost:3000` by default.

## Deploying to AWS Amplify

### Option 1: Deploy via AWS Amplify Console (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit - Next.js 15 + LiveKit setup"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Amplify**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Select "GitHub" and authorize AWS Amplify
   - Choose your repository and branch
   - Amplify will auto-detect the `amplify.yml` configuration

3. **Review Build Settings**
   - The `amplify.yml` file is already configured with:
     - Bun installation and setup
     - Build commands
     - SSR support with `.next` baseDirectory
     - Caching for faster builds

   - **Important**: You may need to set the Node.js version in Amplify Console:
     - Go to App Settings → Build Settings
     - Set Node.js version to **20** or **22** (required as of Sept 2025)

4. **Deploy**
   - Click "Save and deploy"
   - Wait for the build to complete
   - Your app will be available at the Amplify-provided URL

### Option 2: Deploy via Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

## Important Notes

### Bun Support in Amplify

⚠️ **AWS Amplify doesn't officially support Bun yet**. The `amplify.yml` configuration attempts to install Bun during the build process. If you encounter issues:

1. **Fallback to npm**: Edit `amplify.yml` to use npm instead:
   ```yaml
   preBuild:
     commands:
       - npm ci
   build:
     commands:
       - npm run build
   ```

2. **Update package.json scripts** if using npm:
   ```json
   {
     "scripts": {
       "dev": "next dev --turbopack",
       "build": "next build --turbopack",
       "start": "next start",
       "lint": "eslint"
     }
   }
   ```

### Next.js 15 Support

- Next.js 15 is the latest version officially supported by AWS Amplify
- Next.js 16 is not yet officially supported (as of Dec 2025)

### Common Deployment Issues

1. **Build fails with Node version error**
   - Solution: Set Node.js version to 20 or 22 in Amplify Console

2. **Build succeeds but page doesn't load**
   - Verify `baseDirectory: .next` is set in `amplify.yml`
   - Check that SSR mode is enabled in Amplify

3. **Build output too large (>220MB)**
   - Next.js Turbopack builds should be well under this limit
   - If needed, optimize dependencies or split code

4. **Environment variables not available**
   - Add env vars in Amplify Console → Environment variables
   - Restart the build after adding variables

## Next Steps

1. ✅ **Deploy to Amplify** - Follow the steps above
2. 🔐 **Configure LiveKit** - Add LiveKit credentials as environment variables:
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `LIVEKIT_URL`
3. 🎨 **Build Features** - Start implementing LiveKit functionality
4. 📊 **Monitor** - Use Amplify Console to monitor builds and performance

## Resources

- [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/)
- [Next.js Deployment Guide](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit React Quickstart](https://docs.livekit.io/home/quickstarts/react/)

## Success Criteria

✅ Local build succeeds (`bun run build`)
✅ LiveKit packages installed
✅ amplify.yml configured
⏳ Deploy to Amplify and access via public URL

Once deployed, you'll have a live URL showing the deployment confirmation page!
