// week-tracker.js
// Расчет чётности недели ("Над чертой" / "Под чертой") с авто-сменой в понедельник 00:00

// Опорный понедельник: 5 октября 2026 года = "ПОД ЧЕРТОЙ" (below)
const REF_MONDAY = new Date(2026, 9, 5, 0, 0, 0, 0); // Месяц 9 = Октябрь

/**
 * Получить дату понедельника для указанной даты
 * (Воскресенье считается 7-м днем текущей недели)
 */
export function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Вс, 1 = Пн, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

/**
 * Получить дату воскресенья (конца недели) для указанной даты
 */
export function getSundayOfWeek(date = new Date()) {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Определение чётности недели ('below' | 'above')
 * Понедельник 05.10.2026 — "ПОД ЧЕРТОЙ" (четная неделя)
 * Понедельник 12.10.2026 — "НАД ЧЕРТОЙ" (нечетная неделя)
 */
export function getParityForDate(date = new Date()) {
  const monday = getMondayOfWeek(date);
  const diffMs = monday.getTime() - REF_MONDAY.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const mod = ((diffWeeks % 2) + 2) % 2;

  // mod === 0 -> ПОД ЧЕРТОЙ (below)
  // mod === 1 -> НАД ЧЕРТОЙ (above)
  return mod === 0 ? 'below' : 'above';
}

/**
 * Полные метаданные по текущей неделе
 */
export function getWeekInfo(date = new Date()) {
  const parity = getParityForDate(date);
  const monday = getMondayOfWeek(date);
  const sunday = getSundayOfWeek(date);

  const nextMonday = new Date(sunday);
  nextMonday.setMilliseconds(nextMonday.getMilliseconds() + 1);

  const now = new Date(date);
  const msUntilNext = Math.max(0, nextMonday.getTime() - now.getTime());
  const hoursUntilNext = Math.floor(msUntilNext / (1000 * 60 * 60));
  const daysUntilNext = Math.floor(hoursUntilNext / 24);

  return {
    parity, // 'above' | 'below'
    label: parity === 'below' ? 'ПОД ЧЕРТОЙ' : 'НАД ЧЕРТОЙ',
    subLabel: parity === 'below' ? 'Чётная неделя' : 'Нечётная неделя',
    monday,
    sunday,
    nextCycleDate: nextMonday,
    daysUntilNext,
    hoursUntilNext: hoursUntilNext % 24,
  };
}
