# CS2 Demo Viewer Web Application

A Preact-based web application for visualizing CS2 demo files in 2D.

## Overview

This is the frontend component of the CS2 Demo Viewer. It provides:
- **Homepage**: Landing page with information about the viewer
- **Player**: Interactive 2D visualization of CS2 demo files

The Player component loads demo files, uses the WebAssembly parser to extract game data, and displays an interactive 2D map view with player positions, movements, kills, and other game events.

## Technology Stack

- **Framework**: [Preact](https://preactjs.com/) (lightweight React alternative)
- **Build Tool**: [Vite](https://vite.dev/)
- **UI Components**: [PrimeReact](https://primereact.org/)
- **HTTP Client**: Axios
- **Data Format**: Protocol Buffers

## Project Structure

```
web/
├── src/
│   ├── Index/          # Homepage component
│   ├── Player/         # 2D demo player component
├── public/
│   ├── wasm/           # WebAssembly parser files
│   │   ├── csdemoparser.wasm
│   │   └── wasm_exec.js
```

## Development

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Setup

Install dependencies:

```bash
cd web
npm ci
```

**Note:** To successfully parse demo files, you need to build the parser WebAssembly first. See the [Parser README](../parser/README.md) for build instructions.

### Running the Development Server

#### From the web directory:

```bash
npm start
```

#### From the project root:

```bash
make dev
```

The development server will start at [http://localhost:5173](http://localhost:5173).

### Building for Production

Build the application:

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

**Note:** Usually you don't need to run this manually during development. The build is done automatically in CI/CD and Docker containers.

## How It Works

1. **Loading**: The app loads the WASM parser from `public/wasm/`
2. **Demo Input**: User provides a demo file (upload or URL)
3. **Parsing**: The WASM parser processes the demo file
4. **Data Streaming**: Parser sends game events via Protocol Buffers
5. **Visualization**: The Player component renders the 2D map view
6. **Playback**: User can play/pause, seek, and interact with the demo
