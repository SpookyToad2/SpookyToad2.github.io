/* Sanity check for the pure logic — run:  node verify.js */
const D = require("./data.js");
const L = require("./logic.js");

console.log("Parity anchors:");
[["2026-10-03", "today (Sat)"], ["2026-10-04", "Sun"],
 ["2026-10-05", "next Mon"], ["2026-10-12", "Mon +7"],
 ["2026-09-28", "Mon -7"]].forEach(function (row) {
  console.log("  " + row[0] + " -> " + L.weekParity(L.parseISO(row[0])) + "  (" + row[1] + ")");
});

["nad", "pod"].forEach(function (week) {
  console.log("\n=========== " + L.parityLabel(week).toUpperCase() + " ===========");
  for (let day = 0; day < 7; day++) {
    const snap = L.daySnapshot(day, week);
    const pres = L.GROUP_IDS.map(function (id) {
      const p = snap.presence[id];
      return id + ":" + (p.inUniversity ? ("п" + p.firstPara + "-" + p.lastPara) : "нет");
    }).join("  ");
    console.log("\n" + D.WEEKDAYS[day] + "   [" + pres + "]");
    snap.windows.forEach(function (w) {
      console.log("   " + w.start + "-" + w.end + "  (" + w.minutes + "м)  " +
        w.label + (w.isMain ? "  <== ГЛАВНОЕ 11:30-12:00" : "") + (w.isShort ? "  [короткий]" : ""));
    });
  }
});

console.log("\n---- nextMeeting from Sat 2026-10-03 12:00 ----");
const nm = L.nextMeeting(new Date(2026, 9, 3, 12, 0));
console.log(nm ? (nm.date.toDateString() + "  " + nm.window.start + "-" + nm.window.end + "  " + nm.window.label) : "none");
