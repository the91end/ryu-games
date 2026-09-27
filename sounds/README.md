# Flash card sounds

Recordings live at `sounds/<category id>/<card id>.mp3`, using the ids from
`games/flashcards-data.js`. A card can also point at a shared file with
`audio: 'vehicles/siren'`. The source and license of each file are listed in
[CREDITS.md](CREDITS.md).

If a card has a `sound` but no recording exists, the game speaks the sound
instead ("Kwek kwek!" for the duck, for example).

To add or replace a recording, keep it short (4 seconds or less) and give it a
free license (CC0 or public domain is easiest). Then add it to CREDITS.md. This
command matches the existing files:

    ffmpeg -i input.wav -t 4 -af "afade=t=out:st=3.5:d=0.5,loudnorm=I=-16:TP=-1.5" \
      -ac 1 -ar 22050 -b:a 64k sounds/animals/duck.mp3
