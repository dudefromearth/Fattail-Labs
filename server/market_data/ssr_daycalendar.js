// Copied from Tape Lab app/daycalendar.js (TREQ-041/TREQ-045) for Chain Snapshot dash.
// TapeLens shared day-picker calendar widget (TREQ-041/TREQ-045). A small popup calendar that only lets
// you pick from a known set of "available" days -- every other day renders dim and genuinely disabled
// (not just unstyled), and month navigation is clamped to the range that actually has data, so there is
// never a way to browse into an empty month with nothing to click.
//
// Originally built for the Backtest page only (DL-T056, Coach: "the user must be made aware of which
// dates have data to load, and which ones do not... The calendar should restrict navigation if it means
// navigating to a view with no days containing data"). Pulled out here (TREQ-045) so Symbol view and the
// front page's market-narrative picker reuse the identical, already-hardened widget instead of
// re-implementing their own -- including the fix for the bug Coach caught live on the Backtest page
// (2026-09-23): clicking the month arrow used to close the whole popup, because render() replaces the
// very button that was just clicked (see the stopPropagation comment in render() below).
//
// Two layers, like structure_lab.js: pure date-math helpers (unit tested in Node, see
// test_daycalendar.js) and a DOM-mounting function (browser only -- there's no DOM in this project's
// Node test harness, so mount() itself is verified live instead).
//
// Usage (see backtest.html / symbol.html / index.html for real call sites):
//   <label>Day
//     <span style="position:relative;display:inline-flex;align-items:center;gap:2px">
//       <button type="button" id="dayPickerBtn">Pick a day…</button>
//       <input type="hidden" id="day">
//     </span>
//   </label>
//   <script src="/daycalendar.js"></script>
//   <script>
//     const cal = DayCalendar.mount({ buttonEl: $('dayPickerBtn'), hiddenInputEl: $('day') });
//     cal.setAvailableDays(days);   // call whenever the day list is (re)fetched
//     cal.setValue('2026-09-22');   // set programmatically (e.g. a deep link) -- fires no event
//     cal.getValue();               // current ISO value, or null
//   Picking a day in the popup sets hiddenInputEl.value and dispatches a real 'change' event on it, so
//   every existing `$('day').addEventListener('change', ...)` / `.onchange` keeps working unchanged --
//   the same "every existing reader/writer keeps working" contract the Backtest page's hidden #day
//   input already relied on.
//
// The wrapping <span> MUST establish its own positioning context (position:relative, as shown above) --
// the popup anchors with position:absolute against the nearest positioned ancestor, not against the
// button itself.
(function (root) {
  'use strict';
  const DayCalendar = {};

  // ---- pure date math (no DOM -- testable in Node, test_daycalendar.js) -------------------------------
  DayCalendar.displayDate = function (iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return String(m).padStart(2, '0') + '/' + String(d).padStart(2, '0') + '/' + y;
  };
  DayCalendar.monthLabel = function (year, month) {
    return new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  };
  // The month range the popup will ever show -- bounded to the earliest/latest available day's own
  // month, so "restrict navigation" is enforced structurally, not just by disabling a button someone
  // could still click around. `sortedDays` must already be sorted ascending (every call site sorts once
  // when it loads the day list, not on every render).
  DayCalendar.monthBounds = function (sortedDays) {
    if (!sortedDays.length) return null;
    const first = sortedDays[0], last = sortedDays[sortedDays.length - 1];
    return {
      min: { year: +first.slice(0, 4), month: +first.slice(5, 7) - 1 },
      max: { year: +last.slice(0, 4), month: +last.slice(5, 7) - 1 },
    };
  };
  DayCalendar.beforeMonth = function (a, b) { return a.year < b.year || (a.year === b.year && a.month < b.month); };
  DayCalendar.afterMonth = function (a, b) { return a.year > b.year || (a.year === b.year && a.month > b.month); };

  // ---- DOM widget ---------------------------------------------------------------------------------------
  function injectStyle(doc) {
    if (doc.getElementById('daycal-style')) return;
    const style = doc.createElement('style');
    style.id = 'daycal-style';
    style.textContent =
      '.daycal-popup { position:absolute; top:calc(100% + 4px); left:0; z-index:40; background:#0d1117; border:1px solid var(--line); border-radius:8px; padding:8px; width:216px; box-shadow:0 4px 16px rgba(0,0,0,.5); }' +
      '.daycal-popup .daycal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; font-size:11px; font-weight:600; color:var(--text); }' +
      '.daycal-popup .daycal-header button { padding:1px 8px; font-size:12px; }' +
      // Explicit disabled look, not inherited from the host page's own button CSS: index.html's default
      // button is a solid blue "primary" style with no :disabled rule at all, so the earliest/latest
      // month's prev/next arrow could silently look clickable while doing nothing -- exactly what TREQ-041
      // ("restrict navigation... make unavailable clearly marked") was about avoiding.
      '.daycal-popup .daycal-header button:disabled { opacity:.35; cursor:not-allowed; }' +
      '.daycal-popup .daycal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }' +
      '.daycal-popup .daycal-dow { text-align:center; font-size:9px; color:var(--dim); padding:2px 0; }' +
      '.daycal-popup .daycal-day { text-align:center; font-size:11px; padding:5px 0; border-radius:5px; background:transparent; border:1px solid transparent; color:var(--dim); font:inherit; }' +
      '.daycal-popup .daycal-day.blank { visibility:hidden; }' +
      '.daycal-popup .daycal-day.available { border-color:var(--green); color:var(--green); font-weight:600; cursor:pointer; }' +
      '.daycal-popup .daycal-day.available:hover { background:rgba(63,185,80,.2); }' +
      '.daycal-popup .daycal-day.available.selected { background:var(--green); color:#0d1117; }' +
      '.daycal-popup .daycal-day.unavailable { color:#3a3f45; cursor:not-allowed; }';
    doc.head.appendChild(style);
  }
  function el(doc, tag, cls, text) {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Mounts one calendar onto `opts.buttonEl` (the visible trigger) and, if given, keeps
  // `opts.hiddenInputEl`'s value in sync (the ISO date lives there, exactly as the Backtest page's own
  // hidden #day input already worked -- every existing reader/writer of that input keeps working
  // unchanged). Returns { setAvailableDays, setValue, getValue, open, close }.
  DayCalendar.mount = function (opts) {
    const doc = opts.doc || root.document;
    const buttonEl = opts.buttonEl;
    const hiddenInputEl = opts.hiddenInputEl || null;
    const onSelect = opts.onSelect || function () {};
    const placeholder = opts.placeholder || 'Pick a day…';
    const unavailableTitle = opts.unavailableTitle || 'No data this day';

    injectStyle(doc);

    const popup = el(doc, 'div', 'daycal-popup');
    popup.hidden = true;
    buttonEl.insertAdjacentElement('afterend', popup);
    if (!buttonEl.getAttribute('type')) buttonEl.type = 'button';
    buttonEl.setAttribute('aria-haspopup', 'true');
    buttonEl.setAttribute('aria-expanded', 'false');

    let availableDays = [];   // sorted ISO strings
    let calView = null;       // { year, month(0-indexed) } for whichever month the popup shows
    let value = opts.initialValue || (hiddenInputEl && hiddenInputEl.value) || null;

    function applyValue(iso) {
      value = iso || null;
      if (hiddenInputEl) hiddenInputEl.value = value || '';
      buttonEl.textContent = value ? DayCalendar.displayDate(value) : placeholder;
      if (value) calView = { year: +value.slice(0, 4), month: +value.slice(5, 7) - 1 };
    }

    function render() {
      if (!calView) { popup.replaceChildren(); return; }
      const bounds = DayCalendar.monthBounds(availableDays);
      const { year, month } = calView;
      const availableSet = new Set(availableDays);
      const header = el(doc, 'div', 'daycal-header');
      const prevBtn = el(doc, 'button', null, '‹'); prevBtn.type = 'button'; prevBtn.setAttribute('aria-label', 'Previous month');
      const nextBtn = el(doc, 'button', null, '›'); nextBtn.type = 'button'; nextBtn.setAttribute('aria-label', 'Next month');
      if (bounds && !DayCalendar.beforeMonth(bounds.min, { year, month })) prevBtn.disabled = true;   // already at (or before) the earliest available month
      if (bounds && !DayCalendar.afterMonth(bounds.max, { year, month })) nextBtn.disabled = true;    // already at (or past) the latest available month
      // stopPropagation matters here: render() below replaces this very button (popup.replaceChildren
      // swaps in brand-new header/grid nodes), detaching it from popup's DOM tree before this click
      // finishes bubbling. Without stopping it, the document-level outside-click listener below sees
      // e.target as a now-detached node, so `popup.contains(e.target)` reads false and wrongly closes
      // the popup on every month change (the exact bug Coach caught live, 2026-09-23).
      prevBtn.addEventListener('click', (e) => { e.stopPropagation(); calView.month--; if (calView.month < 0) { calView.month = 11; calView.year--; } render(); });
      nextBtn.addEventListener('click', (e) => { e.stopPropagation(); calView.month++; if (calView.month > 11) { calView.month = 0; calView.year++; } render(); });
      header.append(prevBtn, el(doc, 'span', null, DayCalendar.monthLabel(year, month)), nextBtn);

      const grid = el(doc, 'div', 'daycal-grid');
      for (const d of ['S', 'M', 'T', 'W', 'T', 'F', 'S']) grid.append(el(doc, 'div', 'daycal-dow', d));
      const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      for (let i = 0; i < firstDow; i++) grid.append(el(doc, 'div', 'daycal-day blank'));
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const available = availableSet.has(iso);
        const btn = el(doc, 'button', 'daycal-day ' + (available ? 'available' : 'unavailable') + (iso === value ? ' selected' : ''), String(d));
        btn.type = 'button';
        if (!available) { btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); btn.title = unavailableTitle; }
        else {
          btn.addEventListener('click', () => {
            applyValue(iso);
            close();
            if (hiddenInputEl) hiddenInputEl.dispatchEvent(new Event('change'));
            onSelect(iso);
          });
        }
        grid.append(btn);
      }
      popup.replaceChildren(header, grid);
    }

    function open() {
      if (!calView) {
        const iso = value || (availableDays.length ? availableDays[availableDays.length - 1] : null);
        if (iso) calView = { year: +iso.slice(0, 4), month: +iso.slice(5, 7) - 1 };
        else { const now = new Date(); calView = { year: now.getUTCFullYear(), month: now.getUTCMonth() }; }
      }
      render();
      popup.hidden = false;
      buttonEl.setAttribute('aria-expanded', 'true');
    }
    function close() {
      popup.hidden = true;
      buttonEl.setAttribute('aria-expanded', 'false');
    }
    buttonEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popup.hidden) open(); else close();
    });
    doc.addEventListener('click', (e) => {
      if (!popup.hidden && !popup.contains(e.target) && e.target !== buttonEl) close();
    });
    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !popup.hidden) close();
    });

    buttonEl.textContent = value ? DayCalendar.displayDate(value) : placeholder;
    if (value) calView = { year: +value.slice(0, 4), month: +value.slice(5, 7) - 1 };

    return {
      setAvailableDays(days) { availableDays = [...days].sort(); if (!popup.hidden) render(); },
      setValue(iso) { applyValue(iso); },
      getValue() { return value; },
      open,
      close,
    };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DayCalendar;
  else root.DayCalendar = DayCalendar;
})(typeof window !== 'undefined' ? window : globalThis);
