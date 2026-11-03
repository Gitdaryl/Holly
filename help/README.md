# Help videos

Narrated phone-screen videos of the desk, played from the "Watch how" buttons on the Deals and Stationery tabs.

| Video | Tour | Plays from |
|---|---|---|
| public/help/roadmaps.mp4 | help/tours/roadmaps.mjs | Deals tab |
| public/help/stationery.mp4 | help/tours/stationery.mjs | Stationery tab |

## Re-record after a screen changes

```
npm run build
node help/record.mjs roadmaps
node help/record.mjs stationery
```

Never edit a video by hand. Change the tour (one sentence per step, said the way Holly would say it) and re-run.

- The recorder serves the fresh build, answers every API call from help/lib/demo.mjs (made-up "Sample" people, dates relative to today), so nothing touches the real site, Blob, Twilio or Claude.
- Narration: ElevenLabs "Chris", the On Point help-clip narrator (help/voice.mjs). Lines are cached in help/cache by their exact words, so re-recording unchanged lines is free. `HELP_VOICE=<id>` tries another voice.
- `--script` prints the narration only; `--headed` shows the browser while it drives.
- Each take writes help/out/<id>/sheet.jpg (eight frames) and steps.json (timing, steps that ran past their line, page errors). Look at both before committing.
- Spoken text gets the shared respellings (Manitou is said "Manitaw"); captions keep the real spelling. Avoid the word "live" in narration: the voices misread it.
