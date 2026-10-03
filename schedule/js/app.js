// ==========================================================================
// MATCH SCHEDULE — Координатор встреч между парами РГУПС
// ==========================================================================

const BELLS = [
  { pair: 1, start: '08:15', end: '09:45', startMinutes: 8 * 60 + 15, endMinutes: 9 * 60 + 45 },
  { pair: 2, start: '10:00', end: '11:30', startMinutes: 10 * 60, endMinutes: 11 * 60 + 30 },
  // Большой перерыв: 11:30 - 12:00
  { pair: 3, start: '12:00', end: '13:30', startMinutes: 12 * 60, endMinutes: 13 * 60 + 30 },
  // Перерыв: 13:30 - 13:55
  { pair: 4, start: '13:55', end: '15:25', startMinutes: 13 * 60 + 55, endMinutes: 15 * 60 + 25 },
  // Перерыв: 15:25 - 15:40
  { pair: 5, start: '15:40', end: '17:10', startMinutes: 15 * 60 + 40, endMinutes: 17 * 60 + 10 },
  // Пересменка: 17:10 - 17:20
  { pair: 6, start: '17:20', end: '18:50', startMinutes: 17 * 60 + 20, endMinutes: 18 * 60 + 50 },
  { pair: 7, start: '18:55', end: '20:25', startMinutes: 18 * 60 + 55, endMinutes: 20 * 60 + 25 },
  { pair: 8, start: '20:30', end: '22:00', startMinutes: 20 * 60 + 30, endMinutes: 22 * 60 },
];

const DAYS_OF_WEEK = [
  { id: 1, name: 'Понедельник', short: 'Пн' },
  { id: 2, name: 'Вторник', short: 'Вт' },
  { id: 3, name: 'Среда', short: 'Ср' },
  { id: 4, name: 'Четверг', short: 'Чт' },
  { id: 5, name: 'Пятница', short: 'Пт' },
  { id: 6, name: 'Суббота', short: 'Сб' },
  { id: 0, name: 'Воскресенье', short: 'Вс' },
];

const PEOPLE = {
  YU: { id: 'YU', name: 'Юра', color: '#60a5fa' },
  VO_AND_NA: { id: 'VO_AND_NA', name: 'Вова и Наташа', color: '#34d399' },
  AN: { id: 'AN', name: 'Андрей', color: '#f59e0b' },
  AR: { id: 'AR', name: 'Артур', color: '#c084fc' },
};

// ==========================================================================
// БАЗА РАСПИСАНИЯ
// ==========================================================================
const SCHEDULE_DB = {
  YU: {
    1: [
      { pair: 1, parity: 'both', subject: 'Информатика и программирование', type: 'ЛАБ', room: 'Г302' },
      { pair: 2, parity: 'both', subject: 'Русский язык и деловые коммуникации', type: 'ПРАК', room: 'С209' },
      { pair: 3, parity: 'below', subject: 'Начертательная геометрия и КГ', type: 'ЛЕК', room: 'Б317' },
    ],
    2: [
      { pair: 1, parity: 'below', subject: 'Физкультура и спорт', type: 'ПРАК', room: '1141' },
      { pair: 2, parity: 'above', subject: 'Информатика и программирование', type: 'ПРАК', room: 'Д413' },
      { pair: 2, parity: 'below', subject: 'Русский язык и деловые коммуникации', type: 'ЛЕК', room: 'М215' },
      { pair: 3, parity: 'both', subject: 'Основы рос. государственности', type: 'ПРАК', room: 'Г408' },
      { pair: 4, parity: 'both', subject: 'Математика', type: 'ЛЕК', room: 'А322' },
      { pair: 5, parity: 'below', subject: 'Основы рос. государственности', type: 'ЛЕК', room: 'С204' },
    ],
    3: [
      { pair: 2, parity: 'above', subject: 'Начертательная геометрия и КГ', type: 'ПРАК', room: 'Б502' },
      { pair: 3, parity: 'above', subject: 'Математика', type: 'ПРАК', room: 'Б502' },
      { pair: 4, parity: 'both', subject: 'История России', type: 'ЛЕК', room: 'Э237' },
      { pair: 5, parity: 'above', subject: 'История России', type: 'ЛЕК', room: 'Э237' },
      { pair: 5, parity: 'below', subject: 'История России', type: 'ПРАК', room: 'Г408' },
    ],
    4: [
      { pair: 1, parity: 'both', subject: 'Физика', type: 'ЛЕК', room: 'А322' },
      { pair: 2, parity: 'above', subject: 'Физика', type: 'ПРАК', room: 'В309' },
      { pair: 2, parity: 'below', subject: 'Физика', type: 'ЛАБ', room: 'В306 / В307' },
      { pair: 3, parity: 'above', subject: 'Математика', type: 'ПРАК', room: 'Б511' },
      { pair: 3, parity: 'below', subject: 'Начертательная геометрия и КГ', type: 'ЛАБ', room: 'Б508' },
      { pair: 4, parity: 'above', subject: 'Физкультура и спорт', type: 'ЛЕК', room: 'Б310' },
    ],
    5: [
      { pair: 1, parity: 'both', subject: 'Иностранный язык', type: 'ПРАК', room: 'Г415' },
      { pair: 2, parity: 'both', subject: 'Иностранный язык', type: 'ПРАК', room: 'Г415' },
      { pair: 3, parity: 'both', subject: 'Информатика и программирование', type: 'ЛЕК', room: 'Б313' },
      { pair: 4, parity: 'both', subject: 'Информатика и программирование', type: 'ЛАБ', room: 'Д412' },
    ],
    6: [],
    0: [],
  },

  VO_AND_NA: {
    1: [
      { pair: 6, parity: 'above', subject: 'Информационные технологии', type: 'ЛАБ', room: 'Г316' },
      { pair: 7, parity: 'above', subject: 'Информационные технологии', type: 'ЛАБ', room: 'Г316' },
      { pair: 7, parity: 'below', subject: 'Информационные технологии', type: 'ЛЕК', room: 'Э220' },
    ],
    2: [
      { pair: 6, parity: 'both', subject: 'Системы и технологии ИИ', type: 'ЛЕК', room: 'Б117' },
    ],
    3: [
      { pair: 6, parity: 'both', subject: 'Технология разработки ПО', type: 'ЛЕК', room: 'Б317' },
      { pair: 7, parity: 'both', subject: 'Иностранный язык', type: 'ПРАК', room: 'Л104' },
      { pair: 8, parity: 'both', subject: 'Иностранный язык', type: 'ПРАК', room: 'Л104' },
    ],
    4: [
      { pair: 6, parity: 'below', subject: 'Системы и технологии ИИ', type: 'ЛАБ', room: 'Г316' },
      { pair: 7, parity: 'above', subject: 'Управление проектами', type: 'ЛЕК', room: 'Б317' },
      { pair: 7, parity: 'below', subject: 'Системы и технологии ИИ', type: 'ЛАБ', room: 'Г316' },
      { pair: 8, parity: 'above', subject: 'Управление проектами', type: 'ПРАК', room: 'Б317' },
    ],
    5: [
      { pair: 6, parity: 'both', subject: 'Системы и технологии ИИ', type: 'ЛАБ', room: 'Г316' },
      { pair: 7, parity: 'both', subject: 'Методы мат. статистики и ТВ', type: 'ЛЕК', room: 'Г313' },
      { pair: 8, parity: 'both', subject: 'Методы мат. статистики и ТВ', type: 'ПРАК', room: 'Г313' },
    ],
    6: [
      { pair: 1, parity: 'both', subject: 'Технология разработки ПО', type: 'ЛАБ', room: 'Г316а' },
      { pair: 2, parity: 'both', subject: 'Технология разработки ПО', type: 'ЛАБ', room: 'Г316а' },
      { pair: 3, parity: 'both', subject: 'Защита информации', type: 'ЛЕК', room: 'Г313' },
      { pair: 4, parity: 'both', subject: 'Защита информации', type: 'ЛАБ', room: 'Г316' },
      { pair: 5, parity: 'both', subject: 'Защита информации', type: 'ЛАБ', room: 'Г316' },
    ],
    0: [],
  },

  AN: {
    1: [
      { pair: 4, parity: 'both', subject: 'Автоматизация типовых техпроцессов', type: 'ЛЕК', room: 'У202' },
      { pair: 5, parity: 'both', subject: 'Строительные и дорожные машины', type: 'ПРАК', room: 'У202' },
      { pair: 6, parity: 'below', subject: 'Гидравлические и пневматические системы', type: 'ЛАБ', room: 'У202' },
    ],
    2: [
      { pair: 2, parity: 'both', subject: 'Строительные и дорожные машины', type: 'ЛЕК', room: 'У202' },
      { pair: 3, parity: 'both', subject: 'САПР подъемно-транспортных машин', type: 'ЛАБ', room: 'У129' },
      { pair: 4, parity: 'both', subject: 'Гидравлические и пневматические системы', type: 'ЛЕК', room: 'У202' },
      { pair: 5, parity: 'above', subject: 'Гидравлические и пневматические системы', type: 'ПРАК', room: 'У202' },
      { pair: 5, parity: 'below', subject: 'Ресурсосберегающие технологии', type: 'ПРАК', room: 'У202' },
    ],
    3: [
      { pair: 2, parity: 'above', subject: 'Автоматизация типовых техпроцессов', type: 'ПРАК', room: 'У202' },
      { pair: 3, parity: 'both', subject: 'Ресурсосберегающие технологии', type: 'ЛЕК', room: 'У202' },
      { pair: 4, parity: 'both', subject: 'Эксплуатационные материалы', type: 'ЛЕК', room: 'У202' },
      { pair: 5, parity: 'both', subject: 'САПР подъемно-транспортных машин', type: 'ЛЕК', room: 'Б312' },
    ],
    4: [
      { pair: 1, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', room: 'ВУЦ' },
      { pair: 2, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', room: 'ВУЦ' },
      { pair: 3, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', room: 'ВУЦ' },
    ],
    5: [
      { pair: 1, parity: 'both', subject: 'Организация производства средств механизации', type: 'ЛЕК', room: 'Д301' },
      { pair: 2, parity: 'both', subject: 'Организация производства средств механизации', type: 'ПРАК', room: 'Д301' },
      { pair: 3, parity: 'both', subject: 'Эксплуатационные материалы', type: 'ПРАК', room: 'У102' },
    ],
    6: [],
    0: [],
  },

  AR: {
    1: [
      { pair: 2, parity: 'both', subject: 'Электрические передачи локомотивов', type: 'ЛЕК', room: 'М222' },
      { pair: 3, parity: 'both', subject: 'АРМ предприятий транспорта', type: 'ЛЕК', room: 'М307' },
      { pair: 4, parity: 'both', subject: 'Методология проектирования подвижного состава', type: 'ЛЕК', room: 'М215' },
      { pair: 5, parity: 'above', subject: 'Методология проектирования подвижного состава', type: 'ПРАК', room: 'М211' },
      { pair: 5, parity: 'below', subject: 'Электрическое оборудование локомотивов', type: 'ЛЕК', room: 'М124' },
      { pair: 6, parity: 'above', subject: 'Электрическое оборудование локомотивов', type: 'ЛЕК', room: 'М124' },
    ],
    2: [
      { pair: 2, parity: 'both', subject: 'Техническая диагностика подвижного состава', type: 'ЛЕК', room: 'М124' },
      { pair: 3, parity: 'above', subject: 'Техническая диагностика подвижного состава', type: 'ПРАК', room: 'М137' },
      { pair: 3, parity: 'below', subject: 'АРМ предприятий транспорта', type: 'ПРАК', room: 'М121' },
    ],
    3: [],
    4: [
      { pair: 1, parity: 'both', subject: 'Локомотивное хозяйство', type: 'ЛЕК', room: 'М222' },
      { pair: 2, parity: 'above', subject: 'Локомотивное хозяйство', type: 'ПРАК', room: 'М222' },
      { pair: 2, parity: 'below', subject: 'Локомотивное хозяйство', type: 'ЛАБ', room: 'М222' },
      { pair: 3, parity: 'above', subject: 'Электрические передачи локомотивов', type: 'ПРАК', room: 'М222' },
      { pair: 3, parity: 'below', subject: 'Инженерная экология', type: 'ПРАК', room: 'М158' },
      { pair: 4, parity: 'above', subject: 'Инженерная экология', type: 'ЛЕК', room: 'М307' },
      { pair: 4, parity: 'below', subject: 'Электрические передачи локомотивов', type: 'ПРАК', room: 'М222' },
      { pair: 5, parity: 'above', subject: 'Электрическое оборудование локомотивов', type: 'ПРАК', room: 'М124' },
      { pair: 5, parity: 'below', subject: 'Электрическое оборудование локомотивов', type: 'ЛАБ', room: 'М124' },
    ],
    5: [],
    6: [],
    0: [],
  },
};

// ==========================================================================
// ЛОГИКА ЦИКЛА ЧЕТНОСТИ НЕДЕЛЬ
// ==========================================================================
const REF_MONDAY = new Date(2026, 9, 5, 0, 0, 0, 0);

function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

function getParityForDate(date = new Date()) {
  const monday = getMondayOfWeek(date);
  const diffMs = monday.getTime() - REF_MONDAY.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const mod = ((diffWeeks % 2) + 2) % 2;
  return mod === 0 ? 'below' : 'above';
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getPersonLessons(personId, dayId, parity) {
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

function getPersonDayPresence(personId, dayId, parity) {
  const lessons = getPersonLessons(personId, dayId, parity);

  if (!lessons.length) {
    return {
      personId,
      hasLessons: false,
      lessons: [],
      presenceStart: null,
      presenceEnd: null,
      lastRoom: null,
    };
  }

  const presenceStartMinutes = lessons[0].startMinutes;
  const presenceEndMinutes = lessons[lessons.length - 1].endMinutes;
  const lastLesson = lessons[lessons.length - 1];

  return {
    personId,
    hasLessons: true,
    lessons,
    presenceStartMinutes,
    presenceEndMinutes,
    presenceStart: minutesToTime(presenceStartMinutes),
    presenceEnd: minutesToTime(presenceEndMinutes),
    lastRoom: lastLesson.room,
  };
}

function getPersonCurrentStatus(personId, dayId, parity, currentMinutes) {
  const presence = getPersonDayPresence(personId, dayId, parity);

  if (!presence.hasLessons) {
    return {
      badgeClass: 'badge-off',
      badgeText: 'Выходной',
      mainText: 'Сегодня нет пар',
      roomText: '',
    };
  }

  if (currentMinutes < presence.presenceStartMinutes) {
    const first = presence.lessons[0];
    return {
      badgeClass: 'badge-upcoming',
      badgeText: `С ${first.start}`,
      mainText: `${presence.presenceStart} — ${presence.presenceEnd} (${presence.lessons.length} п.)`,
      roomText: `Первая: ауд. ${first.room}`,
    };
  }

  if (currentMinutes >= presence.presenceEndMinutes) {
    return {
      badgeClass: 'badge-off',
      badgeText: 'Освободился',
      mainText: `Пары были до ${presence.presenceEnd}`,
      roomText: `Закончил в ауд. ${presence.lastRoom}`,
    };
  }

  for (const lesson of presence.lessons) {
    if (currentMinutes >= lesson.startMinutes && currentMinutes < lesson.endMinutes) {
      return {
        badgeClass: 'badge-class',
        badgeText: `${lesson.pair} пара`,
        mainText: `${lesson.subject}`,
        roomText: `Сейчас в ауд. ${lesson.room}`,
      };
    }
  }

  return {
    badgeClass: 'badge-break',
    badgeText: 'Перерыв',
    mainText: `В вузе до ${presence.presenceEnd}`,
    roomText: `Закончит в ауд. ${presence.lastRoom}`,
  };
}

// ==========================================================================
// ПОИСК ВСТРЕЧ
// ==========================================================================
function findMeetupsForDay(dayId, parity, currentMinutes) {
  const allIds = ['YU', 'VO_AND_NA', 'AN', 'AR'];
  const presences = {};
  for (const id of allIds) {
    presences[id] = getPersonDayPresence(id, dayId, parity);
  }

  const meetups = [];

  // 1. Большой перерыв: 11:30 - 12:00
  const BIG_BREAK_START = 11 * 60 + 30;
  const BIG_BREAK_END = 12 * 60;
  const bigBreakList = [];

  for (const id of allIds) {
    const p = presences[id];
    if (p.hasLessons) {
      const inCampus = p.presenceStartMinutes <= BIG_BREAK_START && p.presenceEndMinutes >= BIG_BREAK_END;
      const endsAt1130 = p.presenceEndMinutes === BIG_BREAK_START;
      if (inCampus || endsAt1130) {
        const pair2 = p.lessons.find(l => l.endMinutes === BIG_BREAK_START);
        const pair3 = p.lessons.find(l => l.startMinutes === BIG_BREAK_END);
        bigBreakList.push({
          person: PEOPLE[id],
          roomFrom: pair2 ? pair2.room : '—',
          roomNext: pair3 ? pair3.room : null,
        });
      }
    }
  }

  if (bigBreakList.length >= 2) {
    const isNow = currentMinutes >= BIG_BREAK_START && currentMinutes < BIG_BREAK_END;
    meetups.push({
      type: 'big-break',
      tag: 'Большой перерыв',
      time: '11:30 — 12:00',
      duration: '30 мин',
      isNow,
      persons: bigBreakList.map(item => item.person),
      items: bigBreakList.map(item => {
        const next = item.roomNext ? ` ➔ след. ауд. <b>${item.roomNext}</b>` : '';
        return `выходит из ауд. <b>${item.roomFrom}</b>${next}`;
      }),
    });
  }

  // 2. Пересменка: 17:10 - 17:20
  const SHIFT_START = 17 * 60 + 10;
  const SHIFT_END = 17 * 60 + 20;

  const finishing = [];
  const starting = [];

  for (const id of allIds) {
    const p = presences[id];
    if (p.hasLessons) {
      const has5th = p.lessons.some(l => l.endMinutes === SHIFT_START);
      const has6th = p.lessons.some(l => l.startMinutes === SHIFT_END);

      if (has5th && !has6th) {
        const pair5 = p.lessons.find(l => l.endMinutes === SHIFT_START);
        finishing.push({
          person: PEOPLE[id],
          action: `закончил пары, выходит из ауд. <b>${pair5.room}</b>`,
        });
      }
      if (has6th && !has5th) {
        const pair6 = p.lessons.find(l => l.startMinutes === SHIFT_END);
        starting.push({
          person: PEOPLE[id],
          action: `пришли на 6 пару в ауд. <b>${pair6.room}</b>`,
        });
      }
    }
  }

  if (finishing.length > 0 && starting.length > 0) {
    const isNow = currentMinutes >= SHIFT_START && currentMinutes < SHIFT_END;
    meetups.push({
      type: 'shift-change',
      tag: 'Пересменка',
      time: '17:10 — 17:20',
      duration: '10 мин',
      isNow,
      isShift: true,
      finishingPersons: finishing.map(f => f.person),
      startingPersons: starting.map(s => s.person),
      finishingItems: finishing,
      startingItems: starting,
    });
  }

  // 3. Окна между парами
  const otherBreaks = [
    { start: '13:30', end: '13:55', sMin: 13 * 60 + 30, eMin: 13 * 60 + 55, name: 'Перерыв между 3 и 4 парой' },
    { start: '15:25', end: '15:40', sMin: 15 * 60 + 25, eMin: 15 * 60 + 40, name: 'Перерыв между 4 и 5 парой' },
  ];

  for (const brk of otherBreaks) {
    const avail = [];
    for (const id of allIds) {
      const p = presences[id];
      if (p.hasLessons) {
        const inCampus = p.presenceStartMinutes <= brk.sMin && p.presenceEndMinutes >= brk.eMin;
        const hasClass = p.lessons.some(l => l.startMinutes < brk.eMin && l.endMinutes > brk.sMin);
        if (inCampus && !hasClass) {
          const prevLesson = [...p.lessons].reverse().find(l => l.endMinutes <= brk.sMin);
          avail.push({
            person: PEOPLE[id],
            action: `выходит из ауд. <b>${prevLesson ? prevLesson.room : '—'}</b>`,
          });
        }
      }
    }
    if (avail.length >= 2) {
      const isNow = currentMinutes >= brk.sMin && currentMinutes < brk.eMin;
      meetups.push({
        type: 'break',
        tag: brk.name,
        time: `${brk.start} — ${brk.end}`,
        duration: `${brk.eMin - brk.sMin} мин`,
        isNow,
        persons: avail.map(a => a.person),
        items: avail.map(a => a.action),
      });
    }
  }

  return meetups;
}

// ==========================================================================
// UI КОНТРОЛЛЕР
// ==========================================================================
const state = {
  currentDate: new Date(),
  todayDayId: new Date().getDay(),
  selectedDay: new Date().getDay(),
  parity: getParityForDate(new Date()),
  isManuallyOverridden: false,
  isTimelineExpanded: false, // Скрыто по умолчанию в кнопку-меню
  theme: localStorage.getItem('match_theme') || 'dark',
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderDaySelector();
  updateHeader();
  renderMeetups();
  renderPresence();
  renderTimelineAndTables();
  setupEvents();

  setInterval(() => {
    state.currentDate = new Date();
    updateLiveClock();
    updateTimelineNowMarker();
  }, 1000);
});

function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = state.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
}

function updateLiveClock() {
  const el = document.getElementById('live-clock');
  if (el) {
    const d = state.currentDate;
    el.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

function updateHeader() {
  const d = state.currentDate;
  const dayName = DAYS_OF_WEEK.find(day => day.id === state.selectedDay)?.name;
  const isSelectedToday = state.selectedDay === state.todayDayId;

  const subEl = document.getElementById('header-today-label');
  if (subEl) {
    subEl.textContent = isSelectedToday
      ? `Сегодня: ${dayName}, ${d.getDate()} октября`
      : `Выбран день: ${dayName}`;
  }

  const weekBtn = document.getElementById('week-toggle-btn');
  const weekText = document.getElementById('week-badge-text');
  const isBelow = state.parity === 'below';

  if (weekBtn) weekBtn.className = `header-control week-pill-btn ${state.parity}`;
  if (weekText) weekText.textContent = isBelow ? 'ПОД ЧЕРТОЙ' : 'НАД ЧЕРТОЙ';

  const meetupsHeading = document.getElementById('meetups-heading');
  const presenceHeading = document.getElementById('presence-heading');
  if (meetupsHeading) {
    meetupsHeading.textContent = isSelectedToday ? 'Встречи сегодня' : `Встречи на ${dayName.toLowerCase()}`;
  }
  if (presenceHeading) {
    presenceHeading.textContent = isSelectedToday ? 'Где кто сегодня' : `Где кто в ${dayName.toLowerCase()}`;
  }
}

function renderDaySelector() {
  const container = document.getElementById('day-selector-bar');
  if (!container) return;

  container.innerHTML = DAYS_OF_WEEK.map(d => {
    const isActive = d.id === state.selectedDay;
    const isToday = d.id === state.todayDayId;
    return `
      <button class="day-btn ${isActive ? 'active' : ''}" data-day="${d.id}">
        <span class="day-code">${d.short}</span>
        <span class="day-note">${isToday ? 'Сегодня' : d.name.slice(0, 3)}</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedDay = Number(btn.dataset.day);

      if (!state.isManuallyOverridden) {
        const isWeekendNow = state.todayDayId === 0 || state.todayDayId === 6;
        if (isWeekendNow && state.selectedDay >= 1 && state.selectedDay <= 5) {
          state.parity = 'below';
        } else {
          state.parity = getParityForDate(state.currentDate);
        }
      }

      renderDaySelector();
      updateHeader();
      renderMeetups();
      renderPresence();
      renderTimelineAndTables();
    });
  });
}

function renderMeetups() {
  const container = document.getElementById('meetup-cards-grid');
  const countBadge = document.getElementById('meetups-count-badge');
  if (!container) return;

  const currentMinutes = state.currentDate.getHours() * 60 + state.currentDate.getMinutes();
  const meetups = findMeetupsForDay(state.selectedDay, state.parity, currentMinutes);
  const isSelectedToday = state.selectedDay === state.todayDayId;

  if (countBadge) {
    countBadge.textContent = `${meetups.length} ${meetups.length === 1 ? 'окно' : 'окон'}`;
  }

  if (!meetups.length) {
    const dayName = DAYS_OF_WEEK.find(d => d.id === state.selectedDay)?.name.toLowerCase();
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-title">${isSelectedToday ? 'Сегодня совместных окон нет' : `В ${dayName} совместных окон нет`}</div>
        <p class="empty-sub">У студентов не пересекаются перерывы или пересменки.</p>
        <button class="btn-primary" id="btn-jump-monday">
          Посмотреть встречи на понедельник ➔
        </button>
      </div>
    `;

    document.getElementById('btn-jump-monday')?.addEventListener('click', () => {
      state.selectedDay = 1;
      if (!state.isManuallyOverridden) state.parity = 'below';
      renderDaySelector();
      updateHeader();
      renderMeetups();
      renderPresence();
      renderTimelineAndTables();
    });
    return;
  }

  container.innerHTML = meetups.map(m => {
    const borderClass = m.type === 'shift-change' ? 'border-shift' : 'border-break';
    const nowBadge = (isSelectedToday && m.isNow) ? `<span class="badge-now">● СЕЙЧАС</span>` : '';

    // Пересменка: четко показываем Дневные -> Вечерние
    if (m.isShift) {
      const finishingChips = m.finishingPersons.map(p => `
        <span class="person-chip">
          <span class="person-dot" style="background-color: ${p.color};"></span>
          <span>${p.name}</span>
        </span>
      `).join(' ');

      const startingChips = m.startingPersons.map(p => `
        <span class="person-chip">
          <span class="person-dot" style="background-color: ${p.color};"></span>
          <span>${p.name}</span>
        </span>
      `).join(' ');

      const rows = [
        ...m.finishingItems.map(f => `
          <div class="meetup-row">
            <span class="name-bullet">
              <span class="person-dot" style="background-color: ${f.person.color};"></span>
              ${f.person.name}:
            </span>
            ${f.action}
          </div>
        `),
        ...m.startingItems.map(s => `
          <div class="meetup-row">
            <span class="name-bullet">
              <span class="person-dot" style="background-color: ${s.person.color};"></span>
              ${s.person.name}:
            </span>
            ${s.action}
          </div>
        `),
      ].join('');

      return `
        <div class="meetup-card ${borderClass} ${m.isNow ? 'card-active-now' : ''}">
          <div class="meetup-top-row">
            <div class="persons-callout">
              ${finishingChips}
              <span class="shift-arrow">➔</span>
              ${startingChips}
            </div>
            <div class="time-meta-right">
              ${nowBadge}
              <span class="meetup-time-text">${m.time}</span>
              <span class="duration-pill">${m.duration}</span>
            </div>
          </div>
          <div class="meetup-tag-title">[${m.tag}]</div>
          <div class="meetup-details-box">
            ${rows}
          </div>
        </div>
      `;
    }

    // Большой перерыв и обычные окна
    const personChips = m.persons.map(p => `
      <span class="person-chip">
        <span class="person-dot" style="background-color: ${p.color};"></span>
        <span>${p.name}</span>
      </span>
    `).join(' ');

    const rows = m.persons.map((p, idx) => `
      <div class="meetup-row">
        <span class="name-bullet">
          <span class="person-dot" style="background-color: ${p.color};"></span>
          ${p.name}:
        </span>
        ${m.items[idx]}
      </div>
    `).join('');

    return `
      <div class="meetup-card ${borderClass} ${m.isNow ? 'card-active-now' : ''}">
        <div class="meetup-top-row">
          <div class="persons-callout">
            ${personChips}
          </div>
          <div class="time-meta-right">
            ${nowBadge}
            <span class="meetup-time-text">${m.time}</span>
            <span class="duration-pill">${m.duration}</span>
          </div>
        </div>
        <div class="meetup-tag-title">[${m.tag}]</div>
        <div class="meetup-details-box">
          ${rows}
        </div>
      </div>
    `;
  }).join('');
}

function renderPresence() {
  const container = document.getElementById('people-presence-grid');
  if (!container) return;

  const currentMinutes = state.currentDate.getHours() * 60 + state.currentDate.getMinutes();

  container.innerHTML = Object.values(PEOPLE).map(p => {
    const status = getPersonCurrentStatus(p.id, state.selectedDay, state.parity, currentMinutes);

    let roomHtml = '';
    if (status.roomText) {
      roomHtml = `<div class="person-loc-text">${status.roomText}</div>`;
    }

    return `
      <div class="person-card">
        <div class="person-header">
          <div class="person-title-wrap">
            <span class="person-dot" style="background-color: ${p.color};"></span>
            <span class="person-name">${p.name}</span>
          </div>
          <span class="status-badge ${status.badgeClass}">${status.badgeText}</span>
        </div>
        <div class="person-detail-text">${status.mainText}</div>
        ${roomHtml}
      </div>
    `;
  }).join('');
}

// ==========================================================================
// НАГЛЯДНЫЙ ТАЙМЛАЙН С ЧЕТКОЙ СЕТКОЙ И ЗОНАМИ ВСТРЕЧ
// ==========================================================================
const TIMELINE_START = 8 * 60; // 08:00
const TIMELINE_END = 22 * 60;  // 22:00
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START; // 14 hours = 840 min

function renderTimelineAndTables() {
  const timelineEl = document.getElementById('timeline-visual-area');
  const tablesEl = document.getElementById('timetables-grid');
  if (!timelineEl || !tablesEl) return;

  // Расчет зон встреч на таймлайне в этот день
  const bigBreakLeft = ((11 * 60 + 30 - TIMELINE_START) / TIMELINE_SPAN) * 100;
  const bigBreakWidth = (30 / TIMELINE_SPAN) * 100;
  const shiftLeft = ((17 * 60 + 10 - TIMELINE_START) / TIMELINE_SPAN) * 100;
  const shiftWidth = (10 / TIMELINE_SPAN) * 100;

  // Сетка часов (08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00)
  const hourTicks = [8, 10, 12, 14, 16, 18, 20, 22];
  const gridLinesHtml = hourTicks.map(h => {
    const left = ((h * 60 - TIMELINE_START) / TIMELINE_SPAN) * 100;
    return `
      <div class="grid-line" style="left: ${left}%;">
        <span class="grid-time-label">${h}:00</span>
      </div>
    `;
  }).join('');

  // Дорожки для каждого человека
  const tracksHtml = Object.values(PEOPLE).map(p => {
    const lessons = getPersonLessons(p.id, state.selectedDay, state.parity);

    const blocks = lessons.map(l => {
      const left = ((l.startMinutes - TIMELINE_START) / TIMELINE_SPAN) * 100;
      const width = ((l.endMinutes - l.startMinutes) / TIMELINE_SPAN) * 100;
      return `
        <div class="timeline-block" 
             style="left: ${left}%; width: ${width}%; background: ${p.bg}; border-color: ${p.border}; color: ${p.color};"
             title="${l.pair} пара (${l.start}-${l.end}): ${l.subject} в ауд. ${l.room}">
          <span class="b-pair">${l.pair}п</span>
          <span class="b-room">${l.room}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="timeline-lane-row">
        <div class="lane-name" style="color: ${p.color};">${p.name}</div>
        <div class="lane-track">
          ${blocks}
        </div>
      </div>
    `;
  }).join('');

  timelineEl.innerHTML = `
    <div class="timeline-canvas">
      <!-- Вертикальная сетка часов -->
      <div class="timeline-grid-overlay">
        ${gridLinesHtml}
      </div>

      <!-- Зона Большого перерыва -->
      <div class="timeline-zone-banner zone-big-break" style="left: calc(100px + (100% - 100px) * ${bigBreakLeft / 100}); width: calc((100% - 100px) * ${bigBreakWidth / 100});">
        <span class="zone-label-top">11:30 Обед</span>
      </div>

      <!-- Зона Пересменки -->
      <div class="timeline-zone-banner zone-shift-change" style="left: calc(100px + (100% - 100px) * ${shiftLeft / 100}); width: calc((100% - 100px) * ${shiftWidth / 100});">
        <span class="zone-label-top">17:10 Смена</span>
      </div>

      <!-- Дорожки студентов -->
      <div class="timeline-lanes">
        ${tracksHtml}
      </div>

      <!-- Линия текущего времени -->
      <div class="timeline-now-line" id="timeline-now-line" style="display: none;">
        <span class="now-pin-label">СЕЙЧАС</span>
      </div>
    </div>
  `;

  updateTimelineNowMarker();

  // Таблицы подробного расписания
  tablesEl.innerHTML = Object.values(PEOPLE).map(p => {
    const presence = getPersonDayPresence(p.id, state.selectedDay, state.parity);
    let lessonsHtml = '';

    if (!presence.hasLessons) {
      lessonsHtml = `<div class="table-empty">Выходной день (нет пар)</div>`;
    } else {
      lessonsHtml = presence.lessons.map(l => `
        <div class="table-item-row">
          <div class="col-pair" style="color: ${p.color};">${l.pair} п.</div>
          <div class="col-info">
            <div class="subj-name">${l.subject}</div>
            <div class="subj-type">${l.type}</div>
          </div>
          <div class="col-meta">
            <div>${l.start} - ${l.end}</div>
            <div class="room-tag">${l.room}</div>
          </div>
        </div>
      `).join('');
    }

    return `
      <div class="schedule-table-box" style="border-top: 2px solid ${p.color};">
        <div class="table-header">
          <strong style="color: ${p.color};">${p.name}</strong>
          <span class="header-time">${presence.hasLessons ? `${presence.presenceStart} - ${presence.presenceEnd}` : 'Выходной'}</span>
        </div>
        ${lessonsHtml}
      </div>
    `;
  }).join('');
}

function updateTimelineNowMarker() {
  const line = document.getElementById('timeline-now-line');
  if (!line) return;

  const currentMinutes = state.currentDate.getHours() * 60 + state.currentDate.getMinutes();
  const isSelectedToday = state.selectedDay === state.todayDayId;

  if (!isSelectedToday || currentMinutes < TIMELINE_START || currentMinutes > TIMELINE_END) {
    line.style.display = 'none';
    return;
  }

  const leftPercent = ((currentMinutes - TIMELINE_START) / TIMELINE_SPAN) * 100;
  line.style.display = 'block';
  line.style.left = `calc(100px + (100% - 100px) * ${leftPercent / 100})`;
}

function setupEvents() {
  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('match_theme', state.theme);
    initTheme();
  });

  document.getElementById('week-toggle-btn')?.addEventListener('click', () => {
    state.parity = state.parity === 'below' ? 'above' : 'below';
    state.isManuallyOverridden = true;
    updateHeader();
    renderMeetups();
    renderPresence();
    renderTimelineAndTables();
  });

  const collapseBtn = document.getElementById('collapse-toggle-btn');
  const collapseContent = document.getElementById('collapsible-content');
  const collapseText = document.getElementById('collapse-btn-text');
  const collapseArrow = document.getElementById('collapse-arrow');

  collapseBtn?.addEventListener('click', () => {
    state.isTimelineExpanded = !state.isTimelineExpanded;
    collapseBtn.classList.toggle('open', state.isTimelineExpanded);
    if (collapseContent) {
      collapseContent.style.display = state.isTimelineExpanded ? 'block' : 'none';
      if (state.isTimelineExpanded) renderTimelineAndTables();
    }
    if (collapseText) {
      collapseText.textContent = state.isTimelineExpanded
        ? 'Скрыть таймлайн и расписание пар'
        : 'Показать таймлайн и полное расписание пар';
    }
    if (collapseArrow) {
      collapseArrow.textContent = state.isTimelineExpanded ? '[−]' : '[+]';
    }
  });
}
