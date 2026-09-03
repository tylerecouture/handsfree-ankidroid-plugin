# Changelog

Versions are tracked in the header of `_ankivoice.js` and mirrored here.

Current: **v28**

## v28

countdowns for delays >=1s show in the bar (reveal wait, "pause"); the per-command word fields now list the full default vocabulary (editable, reset restores it); voice test no longer blocks - it shows heard words while reviewing normally; settings button now says "Save".

## v27

each command's trigger words are now editable in the settings ("Extra words -> Hard", etc.); your additions merge with the built-in list and persist, so recognition can be tuned without editing the script.

## v26

settings now persist across app restarts (stored in a host-scoped cookie, not just localStorage, since AnkiDroid's server port changes each launch). New "Voice test" setting: shows the recognizer's full list of heard words (without acting) so mis-hears can be identified/added.

## v25

fixed AnkiVoice's own UI being read aloud: the gear icon (spoken as "gear") and the hidden settings panel are now excluded from the card text, so a re-read no longer appends "gear" or reads the settings.

## v24

spoken-answer auto-marking is now OFF by default (it was unreliable); still available as "Detect spoken answers" in the settings. With it off, stray sounds after the question no longer trigger a reveal.

## v23

reveal ("answer") is now recognised from any word starting with "answ" (answer/answers/answered) plus phonetic variants, so it triggers on the first try instead of falling through to the answer-attempt path.

## v22

more tolerant grade matching: accepts the recognizer's common mis-hears of "hard" (heart/hart/hardt/harder) and a few of the others, so short grade words don't need over-articulating.

## v21

settings panel: a gear button on the far right of the bar opens an on-screen settings screen for all the CFG options; choices are saved (localStorage) and applied to the current card on close.

## v20

halved the answer-side wait before the grade mic (250 ms); the question wait is kept at 3 s.

## v19

stops reading/listening when Anki goes to the background (app switch); NEW: on the question side it also tries to recognise a spoken answer - a short phrase that matches the answer is confirmed ("Correct") and marked Good automatically; otherwise it says "Answer not recognized" and reads the answer for normal grading.

## v18

says "Card buried" on skip; on the answer side always speaks a "Mark it" cue then waits markMicDelayMs before opening the mic (so the beep is distinct from the answer); pause-not-heard message now adds "tap the button to listen again"; says "There's nothing for me to read on this card." when a card has no readable text.

## v17

new "off" voice command: turns the voice off (persists across cards) until you tap the bar to turn it back on - same as tapping off.

## v16

on the answer side, the first-run prompt and "help" now describe ONLY the grading options (again/hard/good/easy), not the full command list.

## v15

strict single-mic guard (never run two recognizers at once; stop any leftover mic when a new card starts) - fixes overlapping beeps; first card of a session now lists all voice commands; new commands: "pause" (mic off for CFG.pauseSeconds, then resume) and "help" (replay commands).

## v14

no delay before the grade mic after the answer is read; when the mic auto-pauses after the listen window, it now says aloud that the command wasn't heard and the mic is paused.

## v13

keeps the SCREEN ON while actively reading/listening (screen wake lock + muted looping video) and RELEASES it when it pauses, so the screen can still sleep if you stop answering. The bar now shows an action hint in every state ("tap to turn off" while active).

## v12

answer = everything not already on the question side (handles Ultimate Geography etc.); quiet "thinking delay" before the mic opens.

## v11

bottom bar is the on/off button (big/bold).

## v10

<small> not spoken; line-break pauses; hides UI off-AnkiDroid.

## v5

session prompts; speaks grade + next interval.

## v1

read question; "answer" to reveal; read answer; grade by voice.
