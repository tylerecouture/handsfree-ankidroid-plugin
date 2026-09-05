#!/usr/bin/env python3
"""
Build a small AnkiVoice test deck (.apkg) for on-device testing.

The generated note type embeds the loader, and its media includes the current
_ankivoice.js from the repo root, so importing the .apkg drops the script into
collection.media automatically. Cards deliberately exercise line breaks, <small>
(extra info that should NOT be spoken), and an Ultimate-Geography-style layout
where the answer sits ABOVE <hr id="answer">.

Usage:
    pip install -r demo/requirements.txt
    python demo/build_apkg.py           # writes demo/AnkiVoice-test.apkg
"""
import io
import os

import genanki

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, "_ankivoice.js")

# Read the loader from the repo rather than duplicating it here - two copies of
# the same snippet drift, and the .apkg is what gets tested on the device.
with io.open(os.path.join(ROOT, "loader.html"), encoding="utf-8") as fh:
    LOADER = "\n" + fh.read().strip()

CSS = ".card{font-family:sans-serif;font-size:22px;text-align:center;} small{opacity:.6;}"

# Standard front/back layout
basic = genanki.Model(
    1607392400, "AnkiVoice Test (basic)",
    fields=[{"name": "Front"}, {"name": "Back"}],
    templates=[{
        "name": "Card 1",
        "qfmt": "{{Front}}" + LOADER,
        "afmt": '{{FrontSide}}\n<hr id="answer">\n{{Back}}' + LOADER,
    }],
    css=CSS,
)

# Inverted layout: the answer (Country) renders ABOVE <hr id="answer">
inverted = genanki.Model(
    1607392401, "AnkiVoice Test (answer above hr)",
    fields=[{"name": "Country"}, {"name": "Flag"}, {"name": "Info"}],
    templates=[{
        "name": "Card 1",
        # Question shows the flag + info; answer reveals the country name on top.
        "qfmt": "<b>FLAG</b><br>{{Flag}}<br><small>{{Info}}</small>" + LOADER,
        "afmt": '{{Country}}\n<hr id="answer">\n<b>FLAG</b><br>{{Flag}}<br><small>{{Info}}</small>' + LOADER,
    }],
    css=CSS,
)

deck = genanki.Deck(1607392402, "AnkiVoice Test")

deck.add_note(genanki.Note(model=basic, fields=[
    "Name the three primary colours.<br>Take your time. <small>(this hint should NOT be read)</small>",
    "Red.<br>Blue.<br>Yellow.",
]))
deck.add_note(genanki.Note(model=basic, fields=[
    "<p>Roughly how fast does light travel?</p>",
    "About 300,000 kilometres per second.",
]))
deck.add_note(genanki.Note(model=inverted, fields=[
    "Mali", "green / yellow / red vertical bands",
    "Flag similar to Guinea (green and red flipped).",
]))

pkg = genanki.Package(deck)
pkg.media_files = [JS]
out = os.path.join(os.path.dirname(__file__), "AnkiVoice-test.apkg")
pkg.write_to_file(out)
print("wrote", out)
