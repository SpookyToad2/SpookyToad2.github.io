# BoardSpace (Miro Clone)

Static whiteboard app that runs on GitHub Pages.

## Features
- Local account registration/login (`username + password`)
- Session assigned to current browser (auto-login on return)
- Main board menu after login (create board / join existing board)
- Shared boards with unique board links (`#/board/<board-id>`) not tied to a specific account
- Board save/load to local storage
- Drawing-first whiteboard workflow (enabled by default)
- Left-side Miro-like tools: `Cursor`, `Select`, `Draw`, `Eraser`
- Eraser removes whole strokes (not partial fragments)
- Selection supports `Ctrl+A` (select all), `Delete`, grouped move, and grouped delete
- Zoom-aware grid (grid scales while zooming with mouse wheel)
- Undo/redo support (`Ctrl+Z`, `Ctrl+Y`, also buttons)
- Image/PDF upload by button or drag-and-drop
- Supported image formats: `gif`, `png`, `webp`, `jpg`, `jpeg`
- PDF upload with vertically scrollable multi-page rendering
- Spawn 3D shape windows with realistic lighting:
  `Cube`, `Prism`, `Pyramid`, `Parallelepiped`, `Cylinder`, `Cone`, `Sphere`
- Rotate 3D shapes by left-click + drag
- Real-time 3D shape sync across users on the same board (WebSocket backend)
- Pan/zoom board and drag/resize cards
- Freehand drawing with mouse or graphics tablet pen
- Sticky notes
- Live cursor/name presence for other open app sessions (same browser origin via BroadcastChannel)

## Important storage note
This project has no backend. All data is saved in your browser only:
- Accounts and boards: `localStorage`
- Uploaded files (images/PDFs): `IndexedDB`

If you clear browser site data, your saved boards/accounts/files are removed.

## Collaboration note
This is still a static GitHub Pages app (no backend).  
\"Other users cursor\" is implemented in-browser using `BroadcastChannel`, which means real-time cursor presence works across open tabs/windows on the same origin and browser profile, not internet-wide multi-user sync.

## Run locally
Use a local web server (do not open `index.html` directly via `file://`).

Windows quick start:
1. Run [start-local.ps1](e:\Windows_Stuff\Документы\CODING\HTML\MiroClone\start-local.ps1) from PowerShell:
   - `.\start-local.ps1`
   - Optional custom port: `.\start-local.ps1 -Port 8090`
2. Open `http://localhost:8080` (or your chosen port).
3. Keep that terminal window open while using the app (stop with `Ctrl + C`).

## Real-time backend (required for multi-user 3D sync)
Open a second terminal in the project folder and run:
1. `npm install`
2. `npm run start:realtime`

This starts the WebSocket server at `ws://localhost:8787`.
The front-end auto-connects and broadcasts 3D shape creation/rotation events by board id.

Alternative:
- Double-click [start-local.bat](e:\Windows_Stuff\Документы\CODING\HTML\MiroClone\start-local.bat)

Manual fallback commands:
- Python launcher: `py -m http.server 8080`
- Python: `python -m http.server 8080`
- Node: `npx http-server . -p 8080 -c-1`

## Deploy on GitHub Pages
1. Push these files to a GitHub repository.
2. In GitHub repository settings, open `Pages`.
3. Set source to your default branch root.
4. Open the published Pages URL.

No build step is required.
