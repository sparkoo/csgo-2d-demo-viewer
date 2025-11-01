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
│   │   ├── assets/     # Icons, images, and static assets
│   │   ├── hooks/      # Custom React hooks
│   │   └── ...         # Player-related components
│   ├── App.jsx         # Main app component with routing
│   ├── index.jsx       # Application entry point
│   └── context.js      # React context providers
├── public/
│   ├── wasm/           # WebAssembly parser files
│   │   ├── csdemoparser.wasm
│   │   └── wasm_exec.js
│   └── overviews/      # Map overview images
├── package.json        # npm dependencies and scripts
└── vite.config.js      # Vite configuration
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

**Vite Dev Server Commands:**
- Press `o` + `Enter` to open in the browser
- Press `h` + `Enter` to print all available commands
- Press `q` + `Enter` to quit

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

## Key Features

- **2D Map Visualization**: Top-down view of CS2 maps
- **Player Tracking**: Real-time player positions and movements
- **Event Markers**: Kills, bomb plants, defuses, and more
- **Timeline Control**: Seek to any point in the demo
- **Performance**: Efficient rendering using Canvas API
- **WASM Integration**: Fast demo parsing in the browser

## Components

### Index (Homepage)
Located in `src/Index/`, provides information and links to the player.

### Player
Located in `src/Player/`, the main demo visualization component with:
- Map rendering
- Player tracking
- Event timeline
- Playback controls
- Various hooks for state management

## Dependencies

Key dependencies (see `package.json` for full list):

- `@preact/compat` - React compatibility layer for Preact
- `preact-iso` - Routing for Preact
- `primereact` - UI component library
- `axios` - HTTP client for demo downloads
- `google-protobuf` - Protocol Buffers runtime
- `vite` - Build tool and dev server

## Configuration

### Vite Config

The Vite configuration (`vite.config.js`) includes:
- Preact plugin setup
- React compatibility aliases
- Build optimizations

### Environment Variables

Create a `.env` file in the `web/` directory for local configuration (if needed).

## Testing

Currently, there is no test suite for the web application. Manual testing is performed through the development server.

## Browser Support

Supports all modern browsers with WebAssembly support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Integration with Other Components

- **Parser**: Loads `csdemoparser.wasm` to parse demo files
- **Server**: Proxies demo downloads via `/download` endpoint
- **Browser Plugin**: Receives demo URLs from the FACEIT extension

## Assets

- **Map Overviews**: Located in `public/overviews/` (PNG images)
- **Weapon Icons**: SVG icons in `src/Player/assets/icons/csgo/`
- **Other Assets**: UI icons, images, etc.

## Notes

- The app uses Preact with React compatibility for a smaller bundle size
- Vite provides fast hot module replacement during development
- WebAssembly files must be rebuilt separately when parser changes
- Map overviews must be manually added for new CS2 maps
