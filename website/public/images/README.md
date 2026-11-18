# Website images

This folder holds the images the site shows and the site's social preview.

- `home.webp` (main menu), `notes.webp` (Notes demo) and `themes.webp` (Settings, Appearance): 1440 x 900 WebP captures of the desktop app in the Blueprint light theme. Made on 2026-11-17 with the app's dev capture harness at version 0.1.0, using a throwaway profile seeded with five made-up notes. `src/config/content.ts` (`screenshots`) points at them.
- `placeholder.svg`: a plain wireframe to use for a screenshot slot until a real capture exists (for example right after a rebrand). Nothing points at it now.
- `../social.svg` is the source for `../social.png`, the 1200 x 630 image used in link previews.

## Making a screenshot

Captures come from the desktop app's dev capture harness, which is controlled by `APP_CAPTURE_*` environment variables (see the app's `CLAUDE.md`). Use a throwaway profile so that no personal data is captured. Show only demo content.

1. Start the app with a scratch user-data directory and the capture variables set, so it saves a PNG and quits.
2. Convert the PNG to WebP:

   ```bash
   ffmpeg -i capture.png -c:v libwebp -quality 88 images/notes.webp
   ```

   The captures here were made with, for example:

   ```bash
   APP_CAPTURE=capture.png APP_CAPTURE_SIZE=1440x900 APP_CAPTURE_DELAY=4000 \
     pnpm exec electron --no-sandbox --user-data-dir=/tmp/shots/ud . app-template://open/notes
   ```

3. Point the matching `src` in `src/config/content.ts` at the new file, and update its `alt` text to describe what the picture shows.

## Social preview

`social.png` is rendered from `social.svg` with Inkscape:

```bash
inkscape website/public/social.svg --export-type=png --export-filename=website/public/social.png -w 1200 -h 630
```

Run it again after editing `social.svg`.
