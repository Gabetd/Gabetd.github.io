# Pitch Scale Detector

A small browser app that uses the microphone to detect a played or sung pitch, identify the closest note, show cents sharp/flat, and place the note on a selected musical scale.

## Features

- Toggle left-side staff letters to label each treble staff line and space for note-learning practice.

- Selectable audio input dropdown using available microphone devices
- Audio input status states:
  - Connected: listening
  - Connected: not listening
  - Not connected
  - Not able to connect
- Microphone pitch detection through the Web Audio API
- YIN-style autocorrelation pitch estimation
- Frequency to MIDI/note conversion
- Cents offset display for tuning
- Scale selector: chromatic, major, natural minor, harmonic minor, pentatonic, blues
- Visual scale strip that highlights the detected note when it belongs to the selected scale
- Scrolling music staff with a fixed playhead
- Pause / play the moving music staff without stopping microphone listening
- BPM input that controls staff scroll speed for tempo practice
- Sheet music start delay input from 0 to 5 seconds
- Sheet music upload for note text, ABC notation, plain MusicXML `.xml` / `.musicxml`, and common image files
- Browser-side scanned sheet music image parsing for basic treble-staff note heads
- Adjustable 0-5 second sheet music start delay, defaulting to 3 seconds, so you have time to get into position
- Manual note text fallback/edit box
- Bold sheet music targets on the staff
- Semi-transparent played notes when sheet music is loaded
- Staff note display setting: traditional note symbols or letter labels placed at the correct staff position
- Violin note placement image pinned on the left side of the practice screen
- Waveform display

## Sheet music upload formats

### Note text

Upload a `.txt` / `.notes` file or type notes manually. Notes are separated by spaces. Bar lines are optional and ignored for timing.

```text
C4 D4 E4 F4 | G4:2 G4:2 | A4 B4 C5:2 R:2
```

Supported tokens:

- `C4`, `D4`, `F#4`, `Bb3` for notes
- `R` or `Rest` for rests
- `:beats` after a note/rest for duration, for example `C4:2`, `D4:0.5`, `R:1`
- No duration means 1 beat

### MusicXML

Upload plain `.xml` or `.musicxml` files. The app reads the first playable part, notes, rests, durations, accidentals, and tempo when present.

Compressed `.mxl` and PDFs are not parsed in this browser-only version.

### Scanned sheet music images

Upload `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, or `.bmp` files. The app scans the image in the browser, finds five-line treble staves, detects likely note heads, maps their vertical positions to notes, and loads them into the moving staff.

Image scanning is intentionally basic and works best with:

- A straight, high-contrast crop around printed sheet music
- One melody line on treble staff
- Clean black notation on a light background

Limitations: image scanning does not reliably read rhythm, beams, ties, lyrics, handwriting, bass clef, or complex multi-voice notation. Detected image notes are loaded as 1 beat each so you can still practice pitch and timing against the moving staff.

### ABC notation

Upload `.abc` files. The parser supports basic single-line melodies, rests, octave marks, simple accidentals, `L:` default note length, and `Q:` tempo.

## Requirements

- Node.js LTS
- A modern browser
- HTTPS or localhost for microphone access

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL in your browser.

## Build

```bash
npm run build
npm run preview
```

## Deploy with GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Push the project to a GitHub repository with the default branch named `main`.
2. In GitHub, open **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Push to `main` or run **Deploy to GitHub Pages** from the **Actions** tab.

The workflow runs `npm ci`, builds the Vite app, uploads `dist`, and deploys it to GitHub Pages.

The Vite config uses `base: './'` so generated assets work whether the site is hosted at the domain root or under a repository path like `https://username.github.io/repo-name/`.

## Notes

Pitch detection works best with one clear note at a time. Chords, heavy noise, speaker bleed, or strong vibrato will make the detector jump around.
