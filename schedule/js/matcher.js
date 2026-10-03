// matcher.js
// Логика сопоставления расписаний, поиска окон для встреч и отслеживания нахождения в вузе

import { BELLS, SCHEDULE_DB, PEOPLE } from './schedule-data.js';

/**
 * Преобразование минут от начала дня в формат ЧЧ:ММ
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Преобразование строки ЧЧ:ММ в минуты от начала дня
 */
export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Получить список пар для человека на конкретный день с учетом черты
 */
export function getPersonLessons(personId, dayId, parity) {
  const allDayLessons = SCHEDULE_DB[personId]?.[dayId] || [];
  return allDayLessons
    .filter(lesson => lesson.parity === 'both' || lesson.parity === parity)
    .map(lesson => {
      const bell = BELLS.find(b => b.pair === lesson.pair);
      return {
        ...lesson,
        start: bell.start,
        end: bell.end,
        startMinutes: bell.startMinutes,
        endMinutes: bell.endMinutes,
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

/**
 * Получить статус нахождения в университете для человека в указанный день
 */
export function getPersonDayPresence(personId, dayId, parity) {
  const lessons = getPersonLessons(personId, dayId, parity);
  const person = PEOPLE[personId];

  if (!lessons.length) {
    return {
      personId,
      person,
      hasLessons: false,
      lessons: [],
      presenceStartMinutes: null,
      presenceEndMinutes: null,
      presenceStart: null,
      presenceEnd: null,
      summary: 'Нет пар в этот день',
    };
  }

  const presenceStartMinutes = lessons[0].startMinutes;
  const presenceEndMinutes = lessons[lessons.length - 1].endMinutes;

  return {
    personId,
    person,
    hasLessons: true,
    lessons,
    presenceStartMinutes,
    presenceEndMinutes,
    presenceStart: minutesToTime(presenceStartMinutes),
    presenceEnd: minutesToTime(presenceEndMinutes),
    summary: `В вузе с ${minutesToTime(presenceStartMinutes)} до ${minutesToTime(presenceEndMinutes)} (${lessons.length} ${getNoun(lessons.length, 'пара', 'пары', 'пар')})`,
  };
}

/**
 * Вспомогательная функция склонения слов
 */
export function getNoun(number, one, two, five) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) return five;
  n %= 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return two;
  return five;
}

/**
 * Определение текущего статуса человека в конкретное время дня
 * @param {string} personId
 * @param {number} dayId (0..6)
 * @param {'above'|'below'} parity
 * @param {number} currentMinutes (время в минутах от начала дня)
 */
export function getPersonCurrentStatus(personId, dayId, parity, currentMinutes) {
  const presence = getPersonDayPresence(personId, dayId, parity);
  const person = PEOPLE[personId];

  if (!presence.hasLessons) {
    return {
      person,
      status: 'off',
      badgeClass: 'badge-off',
      title: 'Выходной / Нет пар',
      detail: 'Сегодня нет занятий в университете',
      room: null,
      activeLesson: null,
    };
  }

  // До первой пары
  if (currentMinutes < presence.presenceStartMinutes) {
    const diff = presence.presenceStartMinutes - currentMinutes;
    const firstLesson = presence.lessons[0];
    return {
      person,
      status: 'upcoming',
      badgeClass: 'badge-upcoming',
      title: 'Не в вузе (ещё не приехал)',
      detail: `Первая пара в ${firstLesson.start} (${firstLesson.pair} пара: ${firstLesson.subject})`,
      timeToStart: diff,
      room: firstLesson.room,
      activeLesson: null,
    };
  }

  // После последней пары
  if (currentMinutes >= presence.presenceEndMinutes) {
    const lastLesson = presence.lessons[presence.lessons.length - 1];
    return {
      person,
      status: 'finished',
      badgeClass: 'badge-finished',
      title: 'Уже освободился',
      detail: `Пары закончились в ${lastLesson.end}`,
      room: null,
      activeLesson: null,
    };
  }

  // Внутри учебного дня: проверяем, идет ли пара или перерыв
  for (const lesson of presence.lessons) {
    if (currentMinutes >= lesson.startMinutes && currentMinutes < lesson.endMinutes) {
      const remaining = lesson.endMinutes - currentMinutes;
      return {
        person,
        status: 'in_class',
        badgeClass: 'badge-in-class',
        title: `На паре (${lesson.pair} пара)`,
        detail: `${lesson.subject} (${lesson.type})`,
        room: lesson.room,
        teacher: lesson.teacher,
        activeLesson: lesson,
        remainingMinutes: remaining,
      };
    }
  }

  // Человек на перерыве между парами в университете
  // Найдем следующую пару
  const nextLesson = presence.lessons.find(l => l.startMinutes > currentMinutes);
  const prevLesson = [...presence.lessons].reverse().find(l => l.endMinutes <= currentMinutes);

  const isBigBreak = prevLesson?.pair === 2 && nextLesson?.pair === 3;
  const breakEnd = nextLesson ? nextLesson.startMinutes : presence.presenceEndMinutes;
  const remaining = breakEnd - currentMinutes;

  return {
    person,
    status: 'on_break',
    badgeClass: 'badge-break',
    title: isBigBreak ? '🍱 Большой перерыв (в вузе)' : '☕ На перерыве (в вузе)',
    detail: nextLesson
      ? `Следующая: ${nextLesson.pair} пара в ${nextLesson.start} (ауд. ${nextLesson.room})`
      : 'Ожидание пар',
    room: nextLesson?.room || prevLesson?.room || null,
    activeLesson: null,
    remainingMinutes: remaining,
  };
}

/**
 * Найти все возможности для встреч в указанный день для выбранных участников
 * @param {Array<string>} selectedPersonIds
 * @param {number} dayId
 * @param {'above'|'below'} parity
 */
export function findMeetupOpportunities(selectedPersonIds, dayId, parity) {
  if (selectedPersonIds.length < 2) {
    return [];
  }

  const presences = {};
  for (const id of selectedPersonIds) {
    presences[id] = getPersonDayPresence(id, dayId, parity);
  }

  const opportunities = [];

  // 1. ПРОВЕРКА БОЛЬШОГО ПЕРЕРЫВА (11:30 - 12:00)
  const BIG_BREAK_START = 11 * 60 + 30; // 11:30
  const BIG_BREAK_END = 12 * 60;        // 12:00

  // Кто из участников В ВУЗЕ и СВОБОДЕН во время большого перерыва?
  // Чтобы быть в вузе на большом перерыве, человек должен:
  // - Иметь пары в этот день, начавшиеся до или в 11:30, и заканчивающиеся в 12:00 или позже
  // - И не иметь занятий ровно в этот промежуток (по сетке пар 11:30-12:00 свободен)
  const bigBreakAvailablePeople = [];
  for (const id of selectedPersonIds) {
    const p = presences[id];
    if (p.hasLessons) {
      const arrivedByBreak = p.presenceStartMinutes <= BIG_BREAK_START;
      const staysAfterBreak = p.presenceEndMinutes >= BIG_BREAK_END;
      // Также проверяем, если пара закончилась ровно в 11:30, они ещё здесь минимум 30 мин
      if (arrivedByBreak && (staysAfterBreak || p.presenceEndMinutes === BIG_BREAK_START)) {
        bigBreakAvailablePeople.push(id);
      }
    }
  }

  if (bigBreakAvailablePeople.length >= 2) {
    opportunities.push({
      type: 'big_break',
      title: '🍱 Большой перерыв (Обед / Кофе)',
      timeStart: '11:30',
      timeEnd: '12:00',
      startMinutes: BIG_BREAK_START,
      endMinutes: BIG_BREAK_END,
      duration: '30 минут',
      priority: 1,
      participantIds: bigBreakAvailablePeople,
      description: 'Идеальное окно для обеда или совместного кофе между 2 и 3 парами.',
      isMatchAll: bigBreakAvailablePeople.length === selectedPersonIds.length,
    });
  }

  // 2. ПРОВЕРКА ПЕРЕСМЕНКИ ДНЕВНИКОВ И ВЕЧЕРНИКОВ (17:10 - 17:20)
  // Например, YU/AN/AR заканчивают 5 пару в 17:10, а VO & NA приходят на 6 пару к 17:20
  const SHIFT_START = 17 * 60 + 10; // 17:10
  const SHIFT_END = 17 * 60 + 20;   // 17:20

  const finishingAt1710 = [];
  const startingAt1720 = [];

  for (const id of selectedPersonIds) {
    const p = presences[id];
    if (p.hasLessons) {
      const has5th = p.lessons.some(l => l.endMinutes === SHIFT_START);
      const has6th = p.lessons.some(l => l.startMinutes === SHIFT_END);

      // Заканчивает на 5-й паре и освобождается
      if (has5th && !has6th) {
        finishingAt1710.push(id);
      }
      // Приезжает на 6-ю пару (ранее не был на 5-й)
      if (has6th && !has5th) {
        startingAt1720.push(id);
      }
    }
  }

  if (finishingAt1710.length > 0 && startingAt1720.length > 0) {
    const shiftParticipants = [...new Set([...finishingAt1710, ...startingAt1720])];
    opportunities.push({
      type: 'shift_change',
      title: '🔄 Пересменка (Дневные ↔ Вечерние)',
      timeStart: '17:10',
      timeEnd: '17:20',
      startMinutes: SHIFT_START,
      endMinutes: SHIFT_END,
      duration: '10 минут',
      priority: 2,
      participantIds: shiftParticipants,
      description: `${finishingAt1710.map(id => PEOPLE[id].name).join(', ')} заканчивают пары, а ${startingAt1720.map(id => PEOPLE[id].name).join(', ')} заходят на 6 пару! Встреча в холле / у входа.`,
      isMatchAll: shiftParticipants.length === selectedPersonIds.length,
    });
  }

  // 3. ПОИСК ОБЩИХ ПЕРЕРЫВОВ И ОКОН МЕЖДУ ПАРАМИ В ТЕЧЕНИЕ ДНЯ
  // Стандартные перерывы звонков:
  const standardBreaks = [
    { start: '09:45', end: '10:00', startMinutes: 9 * 60 + 45, endMinutes: 10 * 60, title: 'Перерыв между 1 и 2 парой (15 мин)' },
    { start: '13:30', end: '13:55', startMinutes: 13 * 60 + 30, endMinutes: 13 * 60 + 55, title: 'Перерыв между 3 и 4 парой (25 мин)' },
    { start: '15:25', end: '15:40', startMinutes: 15 * 60 + 25, endMinutes: 15 * 60 + 40, title: 'Перерыв между 4 и 5 парой (15 мин)' },
    { start: '18:50', end: '18:55', startMinutes: 18 * 60 + 50, endMinutes: 18 * 60 + 55, title: 'Перерыв между 6 и 7 парой (5 мин)' },
    { start: '20:25', end: '20:30', startMinutes: 20 * 60 + 25, endMinutes: 20 * 60 + 30, title: 'Перерыв между 7 и 8 парой (5 мин)' },
  ];

  for (const brk of standardBreaks) {
    const available = [];
    for (const id of selectedPersonIds) {
      const p = presences[id];
      if (p.hasLessons) {
        // Человек уже в вузе и ещё не ушёл
        const inCampus = p.presenceStartMinutes <= brk.startMinutes && p.presenceEndMinutes >= brk.endMinutes;
        // И не на паре
        const hasClass = p.lessons.some(l => l.startMinutes < brk.endMinutes && l.endMinutes > brk.startMinutes);
        if (inCampus && !hasClass) {
          available.push(id);
        }
      }
    }

    if (available.length >= 2) {
      const dur = brk.endMinutes - brk.startMinutes;
      opportunities.push({
        type: 'break',
        title: `☕ ${brk.title}`,
        timeStart: brk.start,
        timeEnd: brk.end,
        startMinutes: brk.startMinutes,
        endMinutes: brk.endMinutes,
        duration: `${dur} минут`,
        priority: 3,
        participantIds: available,
        description: `Одновременный перерыв в корпусах университета.`,
        isMatchAll: available.length === selectedPersonIds.length,
      });
    }
  }

  // 4. ПОИСК ДЛИННЫХ ОКОН (СВОБОДНЫЕ ПАРЫ МЕЖДУ ДРУГИМИ ПАРАМИ)
  // Например, если у кого-то окно в 12:00-13:30, а другой свободен
  for (const bell of BELLS) {
    const available = [];
    for (const id of selectedPersonIds) {
      const p = presences[id];
      if (p.hasLessons) {
        const inCampus = p.presenceStartMinutes <= bell.startMinutes && p.presenceEndMinutes >= bell.endMinutes;
        const hasClass = p.lessons.some(l => l.pair === bell.pair);
        if (inCampus && !hasClass) {
          available.push(id);
        }
      }
    }

    if (available.length >= 2) {
      // Исключаем большой перерыв, так как он уже отдельно учтен
      opportunities.push({
        type: 'window',
        title: `🕒 Свободное окно на время ${bell.pair} пары`,
        timeStart: bell.start,
        timeEnd: bell.end,
        startMinutes: bell.startMinutes,
        endMinutes: bell.endMinutes,
        duration: '1 час 30 минут',
        priority: 2,
        participantIds: available,
        description: `У участников образовалось совместное окно (нет занятий на ${bell.pair} паре).`,
        isMatchAll: available.length === selectedPersonIds.length,
      });
    }
  }

  // Сортировка по времени начала, затем по приоритету
  return opportunities.sort((a, b) => a.startMinutes - b.startMinutes || a.priority - b.priority);
}
