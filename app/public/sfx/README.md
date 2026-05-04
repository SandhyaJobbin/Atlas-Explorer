Phase 5 sounds are lazy-loaded by `js/audio.js` through `manifest.json`.
The final assets can live here or elsewhere in the repo.

The current manifest uses the Kenney interface sounds under:

`assets/audio/kenney_interface-sounds/Audio/`

It also uses:

`assets/audio/cheers.mp3`

for the pass and badge celebration cues.

If you add dedicated MP3 files here later, use these default names:

- `correct.mp3`
- `wrong.mp3`
- `streak.mp3`
- `pass.mp3`
- `fail.mp3`
- `tick.mp3`
- `click.mp3`
- `star.mp3`
- `badge.mp3`

`js/audio.js` falls back to short Web Audio tones when an asset is missing or cannot be decoded.

When final MP3 assets are added, enable them in `manifest.json`:

```json
{
  "correct": true,
  "wrong": true
}
```

Use `true` for the default file path above, or provide a custom relative path string such as:

```json
{
  "correct": "assets/audio/kenney_interface-sounds/Audio/confirmation_002.ogg"
}
```
