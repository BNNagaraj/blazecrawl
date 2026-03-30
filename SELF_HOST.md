# Self-Hosting BlazeCrawl

Run BlazeCrawl on your own infrastructure with full feature parity.

## Prerequisites

- Node.js 22+
- Firebase project (free tier works)
- Anthropic API key (for Extract API — optional)

## Option 1: Docker Compose (Recommended)

```bash
git clone https://github.com/BNNagaraj/blazecrawl.git
cd blazecrawl
cp .env.example .env
# Edit .env with your Firebase and Anthropic API keys
docker compose up
```

The app will be available at `http://localhost:3000`.

## Option 2: Manual Setup

### 1. Clone and install

```bash
git clone https://github.com/BNNagaraj/blazecrawl.git
cd blazecrawl
npm install
cd functions && npm install && cd ..
```

### 2. Configure Firebase

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select Firestore, Hosting, Functions, and Authentication when prompted.

### 3. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase project config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
ANTHROPIC_API_KEY=sk-ant-xxx  # Optional, for Extract API
```

### 4. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy to Firebase

```bash
# Build the static frontend
NEXT_BUILD_MODE=export npm run build

# Deploy everything
firebase deploy
```

## Configuration

### Firestore Security Rules

The included `firestore.rules` file configures:
- Users can only read/write their own API keys
- Activity logs are append-only per user
- Admin access for server-side operations

### Cloud Functions

The API runs as a Firebase Cloud Function with:
- 1 GiB memory
- 120 second timeout
- Node.js 22 runtime

To set the Anthropic API key for Cloud Functions:

```bash
firebase functions:config:set anthropic.key="sk-ant-xxx"
```

Or set it as an environment variable in the Firebase Console.

## Updating

```bash
git pull origin main
npm install
cd functions && npm install && cd ..
firebase deploy
```
