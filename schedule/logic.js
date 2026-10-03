/* =========================================================================
   Pure schedule logic — no DOM. Node-testable (see verify.js).
   ========================================================================= */
(function (global) {
  "use strict";

  const DATA = (typeof module !== "undefined" && module.exports)
    ? require("./data.js")
    : global.ScheduleData;

  const { PARAS, ANCHOR, SCHEDULES } = DATA;

  const PARA_BY_N = {};
  PARAS.forEach(function (p) { PARA_BY_N[p.n] = p; });

  const DAY_START = timeToMin("08:15");
  const DAY_END = timeToMin("22:00");
  const MS_WEEK = 7 * 24 * 3600 * 1000;

  /* ---------- time helpers ---------- */
  function timeToMin(t) {
    const parts = String(t).split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  function minToTime(m) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  }
  function fmtDuration(min) {
    if (min < 60) return min + " мин";
    const h = Math.floor(min / 60);
    const mm = min % 60;
    return mm ? h + " ч " + mm + " мин" : h + " ч";
  }

  /* ---------- date helpers ---------- */
  function parseISO(s) {
    const p = String(s).split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function atMidnight(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  function dayIndex(date) {        // 0=Mon ... 6=Sun
    return (date.getDay() + 6) % 7;
  }
  function mondayOf(date) {
    const d = atMidnight(date);
    d.setDate(d.getDate() - dayIndex(d));
    return d;
  }
  /* Parity for the week containing `date`: "nad" | "pod" */
  function weekParity(date) {
    const anchorMon = mondayOf(parseISO(ANCHOR.monday));
    const diffWeeks = Math.round((mondayOf(date) - anchorMon) / MS_WEEK);
    const even = (((diffWeeks % 2) + 2) % 2) === 0;
    if (even) return ANCHOR.parity;
    return ANCHOR.parity === "pod" ? "nad" : "pod";
  }
  function otherParity(p) { return p === "nad" ? "pod" : "nad"; }
  function parityLabel(p) { return p === "nad" ? "Над чертой" : "Под чертой"; }
  function weekRange(date) {
    const mon = mondayOf(date);
    const sun = new Date(mon.getTime());
    sun.setDate(sun.getDate() + 6);
    return { monday: mon, sunday: sun };
  }
  /* Next flip moment = Monday 00:00 after the current week's Sunday */
  function nextFlip(date) {
    return new Date(mondayOf(date).getTime() + MS_WEEK);
  }

  /* ---------- schedule queries ---------- */
  const GROUP_IDS = Object.keys(SCHEDULES);

  function entriesFor(groupId, day, week) {
    return SCHEDULES[groupId].entries.filter(function (e) {
      return e.day === day && (e.week === "both" || e.week === week);
    });
  }

  function merge(ivs) {
    const s = ivs.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    const out = [];
    s.forEach(function (iv) {
      const last = out[out.length - 1];
      if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
      else out.push([iv[0], iv[1]]);
    });
    return out;
  }

  function busyIntervals(groupId, day, week) {
    return merge(entriesFor(groupId, day, week).map(function (e) {
      return [timeToMin(PARA_BY_N[e.p].start), timeToMin(PARA_BY_N[e.p].end)];
    }));
  }

  /* Per-group presence for a day: is this group at the university? */
  function groupPresence(day, week) {
    const out = {};
    GROUP_IDS.forEach(function (id) {
      const es = entriesFor(id, day, week);
      if (!es.length) {
        out[id] = { inUniversity: false, firstPara: null, lastPara: null, firstStart: null, lastEnd: null, entries: [] };
        return;
      }
      const nums = es.map(function (e) { return e.p; });
      const firstPara = Math.min.apply(null, nums);
      const lastPara = Math.max.apply(null, nums);
      out[id] = {
        inUniversity: true,
        firstPara: firstPara,
        lastPara: lastPara,
        firstStart: PARA_BY_N[firstPara].start,
        lastEnd: PARA_BY_N[lastPara].end,
        entries: es.sort(function (a, b) { return a.p - b.p; })
      };
    });
    return out;
  }

  /* Windows when EVERY group is simultaneously free.
     Returns maximal free intervals inside [08:15, 22:00] with labels. */
  function commonFreeWindows(day, week) {
    const all = [];
    GROUP_IDS.forEach(function (id) {
      busyIntervals(id, day, week).forEach(function (iv) { all.push(iv); });
    });
    const merged = merge(all);

    // Whole day free?
    if (!merged.length) {
      return [{
        start: minToTime(DAY_START), end: minToTime(DAY_END),
        startMin: DAY_START, endMin: DAY_END, minutes: DAY_END - DAY_START,
        kind: "all", paraFrom: null, paraTo: null,
        label: "Весь день свободно", isMain: false, isShort: false
      }];
    }

    const gaps = [];
    let cursor = DAY_START;
    merged.forEach(function (iv) {
      if (iv[0] > cursor) gaps.push([cursor, iv[0]]);
      cursor = Math.max(cursor, iv[1]);
    });
    if (cursor < DAY_END) gaps.push([cursor, DAY_END]);

    return gaps.map(function (g) {
      const s = g[0], e = g[1];
      const minutes = e - s;
      const atStart = merged.some(function (iv) { return iv[1] === s; });
      const atEnd = merged.some(function (iv) { return iv[0] === e; });

      let kind, paraFrom = null, paraTo = null, label;
      if (!atStart) { kind = "lead"; label = "До занятий (утро)"; }
      else if (!atEnd) { kind = "trail"; label = "После занятий (вечер)"; }
      else {
        kind = "break";
        paraTo = paraStarting(e);
        paraFrom = paraEnding(s);
        if (paraFrom && paraTo) label = "Перерыв между " + paraFrom + " и " + paraTo + " парой";
        else label = "Перерыв";
      }
      const isMain = (s === timeToMin("11:30") && e === timeToMin("12:00"));
      return {
        start: minToTime(s), end: minToTime(e),
        startMin: s, endMin: e, minutes: minutes,
        kind: kind, paraFrom: paraFrom, paraTo: paraTo,
        label: label, isMain: isMain, isShort: minutes < 15
      };
    });
  }

  function paraEnding(min) {
    const p = PARAS.find(function (x) { return timeToMin(x.end) === min; });
    return p ? p.n : null;
  }
  function paraStarting(min) {
    const p = PARAS.find(function (x) { return timeToMin(x.start) === min; });
    return p ? p.n : null;
  }

  /* Full snapshot for a whole day (both data + windows). */
  function daySnapshot(day, week) {
    return {
      day: day,
      week: week,
      presence: groupPresence(day, week),
      windows: commonFreeWindows(day, week)
    };
  }

  /* Nearest upcoming meeting window from `now`. Scans up to `horizonDays`. */
  function nextMeeting(now, horizonDays) {
    horizonDays = horizonDays || 14;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (let off = 0; off <= horizonDays; off++) {
      const d = atMidnight(now);
      d.setDate(d.getDate() + off);
      const wk = weekParity(d);
      const wins = commonFreeWindows(dayIndex(d), wk);
      for (let i = 0; i < wins.length; i++) {
        const w = wins[i];
        const isToday = off === 0;
        if (isToday && w.endMin <= nowMin) continue;       // already over
        return { date: d, week: wk, window: w, isToday: isToday, isNow: isToday && w.startMin <= nowMin && nowMin < w.endMin };
      }
    }
    return null;
  }

  const API = {
    timeToMin, minToTime, fmtDuration,
    parseISO, atMidnight, dayIndex, mondayOf, weekParity, otherParity,
    parityLabel, weekRange, nextFlip,
    GROUP_IDS, entriesFor, busyIntervals, groupPresence,
    commonFreeWindows, daySnapshot, nextMeeting,
    DAY_START, DAY_END
  };

  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.ScheduleLogic = API;
})(typeof window !== "undefined" ? window : globalThis);
