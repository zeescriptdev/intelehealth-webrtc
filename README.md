# intelehealth-webrtc

A React WebRTC boilerplate template for building video call components.

## Getting started

### Install dependencies

```bash
npm install
```

### Development mode

Start watch mode to compile changes automatically:

```bash
npm run dev
```

### Build for production

Create an optimized build:

```bash
npm run build
```

## Project structure

```
src/
├── index.ts          # Package exports
├── VideoCall.tsx     # React component with TODO implementations
└── useWebRTC.ts      # WebRTC hook with TODO implementations
```

Add to your project's `package.json`:

```json
"dependencies": {
  "@intelehealth/webrtc": "file:../intelehealth-webrtc"
}
```

Then run `npm install` in your project.

## Basic usage

```tsx
import { VideoCall } from "@intelehealth/webrtc";
import { useState } from "react";

export function App() {
  const [remoteSdp, setRemoteSdp] = useState<RTCSessionDescriptionInit>();
  const [remoteCandidate, setRemoteCandidate] = useState<RTCIceCandidateInit>();

  return (
    <VideoCall
      onCreateOffer={async (offer) => {
        // Send offer to remote peer via signaling
      }}
      onCreateAnswer={async (answer) => {
        // Send answer to remote peer via signaling
      }}
      onSendIceCandidate={(candidate) => {
        // Send ICE candidate to remote peer
      }}
      remoteSdp={remoteSdp}
      remoteIceCandidate={remoteCandidate}
      onError={(error) => console.error(error)}
    />
  );
}
```

## Implementation

Both `src/useWebRTC.ts` and `src/VideoCall.tsx` have TODO comments marking the areas that need WebRTC implementation. Start there to add the actual functionality.

## Commit & Deploy

### Create commit

```bash
git add .
git commit -m "refactor: convert to WebRTC boilerplate template with TODO implementations

- Convert useWebRTC hook to template with documented implementation steps
- Update VideoCall component with TODO markers and structure
- Add video element refs and effect hooks for stream handling
- Clean up documentation and focus on local development
- Simplify README with clear development and testing instructions
- Mark all implementation points with actionable TODO comments"
```

### Push to branch

```bash
git push origin boilerplate
```

### How to run

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build for production
npm run build
```
