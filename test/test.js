/*
 * Pure-function tests for _ankivoice.js.
 *
 * The bulk of the plugin depends on AnkiDroid's WebView JS API and can only be
 * verified on a device. But the text/interval/vocab logic is pure and testable.
 * This harness extracts those functions from ../_ankivoice.js (so tests always
 * run against the real source) and exercises them with a tiny DOM shim.
 *
 *   node test/test.js
 *
 * Exits non-zero on any failure.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const src = fs.readFileSync(path.join(__dirname, "..", "_ankivoice.js"), "utf8");

// --- pull a top-level `function NAME(...) { ... }` out of the source ---
function grab(name) {
  const re = new RegExp("function " + name + "\\([\\s\\S]*?\\n  }\\n");
  const m = src.match(re);
  if (!m) throw new Error("could not extract function " + name);
  return m[0];
}
function grabVar(name) {
  const re = new RegExp("var " + name + " = [\\s\\S]*?;\\n");
  const m = src.match(re);
  if (!m) throw new Error("could not extract var " + name);
  return m[0];
}

// Evaluate the extracted pieces in this scope. `CFG` is provided per-test.
let CFG = {};
eval(grabVar("AV_BLOCK"));
eval(grabVar("AV_UNITS"));
eval(grab("textWithBreaks"));
eval(grab("extractLines"));
eval(grab("speechJoin"));
eval(grab("subtractLines"));
eval(grab("normalize"));
eval(grab("answerMatches"));
eval(grab("expandIvl"));
eval(grab("unwrapValue"));
eval(grab("said"));

// --- tiny DOM node shim (nodeType 1 = element, 3 = text) ---
const E = (tag, kids, id) => ({ nodeType: 1, tagName: tag.toUpperCase(), id: id || "", childNodes: kids || [] });
const T = (text) => ({ nodeType: 3, nodeValue: text });
const heardOf = (t) => " " + t.toLowerCase() + " ";

let passed = 0;
function ok(label, cond) {
  assert.ok(cond, "FAILED: " + label);
  passed++;
}
function eq(label, a, b) {
  assert.deepStrictEqual(a, b, "FAILED: " + label + "\n  got:      " + JSON.stringify(a) + "\n  expected: " + JSON.stringify(b));
  passed++;
}

// ---------------- interval -> speech ----------------
eq("expandIvl 16m", expandIvl("16m"), "16 minutes");
eq("expandIvl 1d", expandIvl("1d"), "1 day");
eq("expandIvl <4m", expandIvl("<4m"), "less than 4 minutes");
eq("expandIvl 1.6mo", expandIvl("1.6mo"), "1.6 months");
eq("expandIvl 1y", expandIvl("1y"), "1 year");
eq("expandIvl zero-width", expandIvl("16\u200bm"), "16 minutes");
eq("unwrapValue raw json", unwrapValue('{"success":true,"value":"10m"}'), "10m");
eq("unwrapValue bare", unwrapValue("10m"), "10m");

// ---------------- line-break -> pause ----------------
eq("br makes pause", speechJoin(extractLines(E("div", [T("Red"), E("br"), T("Blue")]))), "Red. Blue.");
eq("paragraphs pause", speechJoin(extractLines(E("div", [E("p", [T("A")]), E("p", [T("B")])]))), "A. B.");
eq("no phantom pause on inline whitespace",
   speechJoin(extractLines(E("div", [E("span", [T("foo")]), T("\n     "), E("span", [T("bar")])]))), "foo bar.");
eq("existing punctuation kept", speechJoin(extractLines(E("div", [T("apples,"), E("br"), T("oranges")]))), "apples, oranges.");

// <small> and our own av-* UI are excluded from spoken text
eq("small + av-* excluded",
   extractLines(E("body", [
     E("div", [T("Q text")]),
     E("small", [T("hidden hint")]),
     E("div", [T("\u2699")], "av-gear"),
     E("div", [T("AnkiVoice")], "av-root"),
   ])),
   ["Q text"]);

// ---------------- answer = card minus question ----------------
(() => {
  const front = E("div", [E("div", [T("FLAG")]), E("div", [T("hint.")])]);
  const back = E("div", [E("div", [T("Mali")]), E("hr", [], "answer"), E("div", [T("FLAG")]), E("div", [T("hint.")])]);
  eq("answer above hr (Ultimate Geography)",
     subtractLines(extractLines(back), extractLines(front)), ["Mali"]);
})();
(() => {
  const front = E("div", [T("Capital of BC?")]);
  const back = E("div", [T("Capital of BC?"), E("hr", [], "answer"), T("Victoria")]);
  eq("standard FrontSide layout",
     subtractLines(extractLines(back), extractLines(front)), ["Victoria"]);
})();

// ---------------- spoken-answer matching (conservative) ----------------
ok("answerMatches exact", answerMatches("bamako", ["Bamako"]) === true);
ok("answerMatches wrong", answerMatches("mali", ["Bamako"]) === false);
ok("answerMatches not-in-long-sentence", answerMatches("guinea", ["Flag similar to Guinea and red flipped darker"]) === false);

// ---------------- editable command vocab ----------------
CFG = { words_hard: "hard, harder, heart", words_answer: "answer, reveal", words_good: "good, yes" };
ok("said built-in hard", said(heardOf("hard"), "hard") === true);
ok("said homophone heart", said(heardOf("heart"), "hard") === true);
ok("said reveal->answer", said(heardOf("reveal"), "answer") === true);
ok("said no false match", said(heardOf("banana"), "hard") === false);
CFG = { words_hard: "hard, harv, hard one" };
ok("said user-added word", said(heardOf("harv"), "hard") === true);
ok("said user-added phrase", said(heardOf("hard one"), "hard") === true);

console.log("\nAll " + passed + " assertions passed.");
