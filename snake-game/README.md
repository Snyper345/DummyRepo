# Snake (HTML5 Canvas)

A self-contained Snake game you can run by opening `index.html`.

## Run

- Option 1: Open `index.html` directly in your browser (double-click or drag-drop).
- Option 2: Serve the folder and open in a browser:

```bash
# from the repository root
cd /workspace/snake-game
python3 -m http.server 5173
# then open http://localhost:5173
```

## Controls

- Arrow Keys / WASD: Move
- P: Pause / Resume (or click the Pause button)
- R: Restart (or click the Restart button)
- On mobile: Use the on-screen D‑pad

## Notes

- The board is a 20×20 grid; speed is 10 ticks/sec.
- Best score is saved in `localStorage`.

## Files

- `index.html`: Markup and UI scaffold
- `style.css`: Styling for layout, overlay, and controls
- `script.js`: Game loop, rendering, input, and logic