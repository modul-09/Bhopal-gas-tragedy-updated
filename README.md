# The Night Bhopal Went Silent — sound experience prototype

A short, scroll-driven first-person sound narrative about the Bhopal Gas Tragedy. The current prototype uses a detailed illustrated first-person view of an old Indian room, a rotating ceiling fan, warm yellow streetlight, and blur that increases as the character struggles to keep their eyes open.

## Run locally

1. Extract the project folder.
2. Open a terminal/Command Prompt in this folder.
3. Run `py -m http.server 8000` (or `python -m http.server 8000`).
4. Open `http://localhost:8000` in a browser.
5. Click **Begin listening** and use headphones.

Do not open `index.html` directly with a `file://` URL. A local web server is needed for audio loading.

## Story progression

- **Eyes open:** Ceiling fan, distant wedding, night ambience, train, and occasional dog barks. A siren begins faintly near the end.
- **First blink:** Wedding sound falls away, siren gets louder, dogs bark.
- **Second blink:** Siren becomes clearer; coughing begins; wind fades almost away.
- **Third blink:** Wind disappears, the siren grows louder, coughs repeat from different positions, one baby cries, and the view begins to blur.
- **Fourth blink:** A close, loud cough; another baby crying; dog whines and barks; the babies and neighbours fade one by one; the siren dominates and an ambulance sound arrives near the end. The image becomes heavily blurred before silence.
- **Silence:** Sound fades out and the historical section follows.

## Hosting

This is a static HTML/CSS/JavaScript project and can be deployed to GitHub Pages or another static hosting service. Keep `index.html`, `style.css`, `js/`, and `assets/` in their existing relative locations. On GitHub Pages, publish from the `main` branch and `/(root)`.

## Notes

- Headphones are recommended for the Web Audio API's HRTF spatialisation.
- The visual is an artistic reconstruction, not documentary footage of a specific room or individual.
- Before public presentation, verify that you have permission to redistribute all included audio assets and refine historical citations.
