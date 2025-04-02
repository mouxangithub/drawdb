<div align="center">
    <img width="64" alt="drawdb logo" src="./src/assets/icon-dark.png">
    <h1>drawDB</h1>
</div>

<h3 align="center">Free, simple, and intuitive database schema editor and SQL generator.</h3>

<div align="center" style="margin-bottom:12px;">
    <a href="https://drawdb.app/" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/badge/Start%20building-grey" alt="drawDB"/>
    </a>
    <a href="https://discord.gg/BrjZgNrmR6" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/discord/1196658537208758412.svg?label=Join%20the%20Discord&logo=discord" alt="Discord"/>
    </a>
    <a href="https://x.com/drawDB_" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/badge/Follow%20us%20on%20X-blue?logo=X" alt="Follow us on X"/>
    </a>
</div>

<div align="center" style="margin-bottom:20px;">
    <a href="README.md">English</a> | <a href="README.zh.md">中文</a>
</div>

<h3 align="center"><img width="700" style="border-radius:5px;" alt="demo" src="drawdb.png"></h3>

## 📝 Project Introduction

DrawDB is a powerful and user-friendly database entity relationship (DBER) editor that runs directly in your browser. Build database diagrams with a few clicks, export SQL scripts, customize your editor, and more without creating an account.

This project is based on [drawdb-io/drawdb](https://github.com/drawdb-io/drawdb) with enhancements including a backend server, SQLite database integration, and more features.

> **Development Note**: This project was developed with the assistance of AI, using the [Cursor](https://cursor.sh/) editor for code generation and adaptation. The AI helped rewrite and enhance the original codebase, adding the backend server integration and other extended features.

## 📋 What's Added

Compared to the original project, this fork adds several key features:

- **Full Backend Server**: Added a server component for persistent data storage
- **SQLite Database**: Integrated SQLite for diagram storage and management
- **Multi-Diagram Management**: Support for creating and managing multiple diagrams
- **Internationalization**: Added support for multiple languages (English/Chinese)
- **Docker Deployment**: Complete Docker support for easy deployment
- **Automated Backups**: Built-in database backup functionality
- **Enhanced Preview**: Interactive diagram preview with zoom and pan capabilities
- **Optimized UI**: Refined user interface with control panel centered at bottom and floating info panel
- **Creation Time Display**: Added creation time display in both grid and table view modes
- **Advanced Filtering System**: Comprehensive filtering by database type, creation time, and update time
- **Real-time Collaboration**: WebSocket-based collaborative editing with user presence indicators, cursor tracking, and conflict resolution
- **Collaboration Controls**: User interface components showing online collaborators, connection status, and collaborative actions
- **Offline Recovery**: Pending operations queue for recovering from temporary disconnections
- **User Identity Management**: Consistent user identification across sessions with color-coded avatars

## ✨ Core Features

- **Multi-Diagram Management**: Create and manage multiple database diagrams with grid and table view modes
- **Interactive Preview**: Diagram thumbnails and full-featured preview mode with drag and zoom capabilities
- **Diagram Sharing**: Generate sharing links to collaborate with team members or clients
- **Collaborative Editing**: Support for concurrent diagram editing with version conflict resolution
- **Real-time Presence**: See who's currently viewing and editing the diagram with user avatars and status indicators
- **User Activity Detection**: Automatically detect and manage inactive users in collaborative sessions
- **Operation Synchronization**: All changes are instantly synchronized between all connected users
- **Internationalization**: Support for multiple languages, including English and Chinese interfaces
- **Advanced Filtering**: Filter diagrams by name, database type, creation date, and modification date
- **JSON Editor**: Real-time JSON editing for tables, relationships, subject areas, and notes
- **Free to Use**: All features completely free, no account registration required

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Pull the latest image
docker pull ghcr.io/mouxangithub/drawdb:latest

# Create necessary directories
mkdir -p server/database backups

# Run the container
docker run -d --name drawdb \
  -p 3000:3000 \
  -v $(pwd)/server/database:/app/server/database \
  -v $(pwd)/backups:/app/backups \
  ghcr.io/mouxangithub/drawdb:latest
```

Using Docker Compose:

```yaml
services:
  drawdb:
    image: ghcr.io/mouxangithub/drawdb:latest
    container_name: drawdb
    restart: unless-stopped
    ports:
      - 3000:3000
    volumes:
      - ./server/database:/app/server/database
      - ./backups:/app/backups
```

### Using Startup Scripts

#### Windows
```bat
# Run locally (without Docker, start both frontend and backend)
start.bat local

# Start development environment (using Docker)
start.bat dev

# Start production environment (using Docker)
start.bat prod
```

#### Linux/macOS
```bash
# Add execution permission
chmod +x start.sh

# Run locally (without Docker, start both frontend and backend)
./start.sh local

# Start development environment (using Docker)
./start.sh dev

# Start production environment (using Docker)
./start.sh prod
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/mouxangithub/drawdb
cd drawdb

# Install all dependencies
npm run install:all

# Start both frontend and backend development servers
npm start
```

## 🏗️ Project Structure

The project is divided into frontend and backend parts:

```
drawdb/
├─ src/                   # Frontend source code
│  ├─ animations/         # Animation components
│  ├─ assets/             # Static resources
│  ├─ components/         # Reusable components
│  │  ├─ common/          # Common UI components
│  │  │  ├─ DiagramPreviewCard/  # Interactive diagram preview cards
│  │  │  ├─ DiagramViewModal/    # Full diagram preview modal
│  │  │  ├─ ShareModal/          # Diagram sharing modal
│  │  │  ├─ DiagramThumbnail.jsx # Diagram thumbnail component
│  │  │  ├─ ZoomControl.jsx      # Zoom control component
│  │  │  ├─ ConfirmationPrompt.jsx  # Confirmation dialog component
│  │  │  └─ ThemeLanguageSwitcher/ # Theme and language switcher component
│  │  ├─ CollaborationStatus.jsx  # WebSocket connection status component
│  │  ├─ CollaboratorsList.jsx    # Online collaborators list component
│  │  ├─ UserActivityIndicator.jsx # User activity indicator component
│  │  ├─ WebSocketLoadingOverlay.jsx # WebSocket loading overlay
│  │  ├─ EditorCanvas/    # Canvas editor components
│  │  ├─ EditorHeader/    # Editor header components
│  │  ├─ EditorSidePanel/ # Editor side panel components
│  │  ├─ JsonEditor/      # JSON editor component
│  │  └─ LexicalEditor/   # Rich text editor components
│  ├─ context/            # React contexts
│  │  ├─ WebSocketContext.jsx  # WebSocket connection context management
│  │  ├─ CollaborationContext.jsx  # Collaboration features and user activity management
│  │  └─ ...              # Other context components
│  ├─ data/               # Static data and constants
│  ├─ hooks/              # Custom React hooks
│  │  ├─ useWebSocket.js  # WebSocket connection hook
│  │  ├─ useCollaboration.js  # Collaboration feature hook
│  │  ├─ useUserActivity.js  # User activity monitoring hook
│  │  ├─ useJsonEditor.js  # JSON editor state hook
│  │  └─ ...              # Other hooks
│  ├─ i18n/               # Internationalization configuration
│  ├─ icons/              # Icon components
│  ├─ pages/              # Page components
│  ├─ services/           # APIs and services
│  │  ├─ websocket.js     # WebSocket client service
│  │  ├─ diagramWebSocketService.js  # Diagram WebSocket service
│  │  └─ ...              # Other services
│  ├─ styles/             # CSS styles
│  │  ├─ components/      # Component styles
│  │  ├─ pages/           # Page styles
│  │  └─ global/          # Global styles
│  ├─ utils/              # Utility functions
│  ├─ App.jsx             # Main application component
│  └─ main.jsx            # Application entry point
├─ server/                # Backend server
│  ├─ database/           # SQLite database files
│  └─ src/                # Server source code
│     ├─ websocket/       # WebSocket server implementation
│     └─ ...              # Other server code
```

## 📋 Environment Variables

The project uses a `.env` file to configure both frontend and backend environment variables:

```bash
# Server configuration
PORT=3000
NODE_ENV=development

# Frontend configuration
VITE_WS_PORT=3000  # WebSocket port for real-time collaboration

# Database configuration
DB_STORAGE=server/database/drawdb.sqlite
```

## 🔄 Data Backup

The SQLite database used by the system is mounted to the host system via Docker volumes and can be backed up using:

```bash
# Using startup script for backup
./start.sh backup  # Linux/macOS
start.bat backup   # Windows

# Or manual backup
cp server/database/drawdb.sqlite backups/drawdb_$(date +%Y%m%d_%H%M%S).sqlite
```

## 🔧 Troubleshooting

If you encounter issues, please check:

1. **Static files not accessible**: Ensure the following:
   - Check if the `STATIC_FILES_DIR` environment variable is set correctly
   - Check if the `/app/server/public` directory exists and contains static files in the Docker container
   - If using a custom Docker build, ensure `npm run build` has been executed successfully and the build results are copied to `/app/server/public`
   - Run `docker exec -it drawdb sh` to enter the container and check the `/app/server/public` directory

2. **Docker container won't start**: Check if the port is already in use or if directory permissions are correct
3. **WebSocket collaboration error fixes**:
   - Fixed the `handleCollaborationOperation` function defined multiple times in `Workspace.jsx`, renamed to `handleCollaborationEvent`
   - Fixed the issue where `diagramData` variable was undefined during drag operations
   - Optimized WebSocket message handling logic to ensure compatibility with different formats of event data
   - Strengthened error handling and data validation to improve system stability

## 🤝 Contributing

Contributions are welcome, whether it's code contributions, bug reports, or feature suggestions. Please see the [contribution guidelines](CONTRIBUTING.md).

## 👏 Acknowledgements

This project is based on [drawdb-io/drawdb](https://github.com/drawdb-io/drawdb). We would like to express our sincere gratitude to the original project's creators and all contributors who made it possible.

## 📄 License

This project is released under the [AGPL-3.0 License](LICENSE), the same license as the original [drawdb-io/drawdb](https://github.com/drawdb-io/drawdb) project. The AGPL-3.0 license requires that:

- Source code must be made available when distributing the software
- Modifications must be released under the same license when distributing the software
- Changes made to the code must be documented
- If you run a modified program on a server and let users communicate with it, you must also provide them with the source code

## 🔄 Collaboration Features

The project supports real-time collaborative editing, allowing multiple users to edit the same diagram simultaneously. Key features include:

### Real-time Collaboration

- **No login required** - Automatically identify users using a unique device identifier (based on IP address or a client-generated unique ID)
- **Real-time cursors** - Display the cursor position of other users
- **Editing indicators** - Show which components are being edited by other users
- **Version conflict resolution** - Automatically handle version conflicts when multiple users edit simultaneously

### Collaboration Components

- **Collaboration status bar** - Displays the current connection status and the number of online users
- **User list** - Shows all currently online users
- **Editing indicators** - Display who is currently editing on components
- **Remote cursors** - Show the cursor position of other users

### Technical Implementation

- Implemented WebSocket service using the `ws` library
- Used Sequelize to operate the SQLite database
- The client uses the native WebSocket API in the browser

---

*Looking for the Chinese version of this document? See [README.zh.md](README.zh.md).*