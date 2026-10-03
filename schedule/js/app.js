// ==========================================================================
// MATCH SCHEDULE — Координатор встреч между парами РГУПС
// ==========================================================================

const BELLS = [
  { pair: 1, start: '08:15', end: '09:45', startMinutes: 8 * 60 + 15, endMinutes: 9 * 60 + 45 },
  { pair: 2, start: '10:00', end: '11:30', startMinutes: 10 * 60, endMinutes: 11 * 60 + 30 },
  // Большой перерыв: 11:30 - 12:00 (30 мин)
  { pair: 3, start: '12:00', end: '13:30', startMinutes: 12 * 60, endMinutes: 13 * 60 + 30 },
  // Перерыв: 13:30 - 13:55 (25 мин)
  { pair: 4, start: '13:55', end: '15:25', startMinutes: 13 * 60 + 55, endMinutes: 15 * 60 + 25 },
  // Перерыв: 15:25 - 15:40 (15 мин)
  { pair: 5, start: '15:40', end: '17:10', startMinutes: 15 * 60 + 40, endMinutes: 17 * 60 + 10 },
  // Пересменка дневных и вечерников: 17:10 - 17:20 (10 мин)
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
  YU: {
    id: 'YU',
    name: 'YU',
    fullName: 'Я (YU)',
    role: 'Дневное отд.',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
    avatar: '👨‍🎓',
  },
  VO_AND_NA: {
    id: 'VO_AND_NA',
    name: 'VO & NA',
    fullName: 'VO & NA',
    role: 'Вечернее отд.',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.4)',
    avatar: '👥',
  },
  AN: {
    id: 'AN',
    name: 'AN',
    fullName: 'Друг 3 (AN)',
    role: 'Дневное отд.',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.4)',
    avatar: '👷‍♂️',
  },
  AR: {
    id: 'AR',
    name: 'AR',
    fullName: 'Друг 4 (AR)',
    role: 'Дневное отд.',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.15)',
    border: 'rgba(192, 132, 252, 0.4)',
    avatar: '🚆',
  },
};

const SCHEDULE_DB = {
  YU: {
    1: [
      { pair: 1, parity: 'both', subject: 'Информатика и программирование', type: 'ЛАБ', teacher: 'Гречко К.Э. [2]', room: 'Г302' },
      { pair: 2, parity: 'both', subject: 'Русский язык и деловые коммуникации', type: 'ПРАК', teacher: 'Силютина Е.Н.', room: 'С209' },
      { pair: 3, parity: 'below', subject: 'Начертательная геометрия и компьютерная графика', type: 'ЛЕК', teacher: 'Шумун Н.М.', room: 'Б317' },
    ],
    2: [
      { pair: 1, parity: 'below', subject: 'Физическая культура и спорт', type: 'ПРАК', teacher: 'Тимченко М.И.', room: '1141' },
      { pair: 2, parity: 'above', subject: 'Информатика и программирование', type: 'ПРАК', teacher: 'Щербакова К.С.', room: 'Д413' },
      { pair: 2, parity: 'below', subject: 'Русский язык и деловые коммуникации', type: 'ЛЕК', teacher: 'Покотыло М.В.', room: 'М215' },
      { pair: 3, parity: 'both', subject: 'Основы российской государственности', type: 'ПРАК', teacher: 'Багрова Н.А.', room: 'Г408' },
      { pair: 4, parity: 'both', subject: 'Математика', type: 'ЛЕК', teacher: 'Лагунова Е.О.', room: 'А322' },
      { pair: 5, parity: 'below', subject: 'Основы российской государственности', type: 'ЛЕК', teacher: 'Тованчова Е.Н.', room: 'С204' },
    ],
    3: [
      { pair: 2, parity: 'above', subject: 'Начертательная геометрия и компьютерная графика', type: 'ПРАК', teacher: 'Шумун Н.М.', room: 'Б502' },
      { pair: 3, parity: 'above', subject: 'Математика', type: 'ПРАК', teacher: 'Молька О.В.', room: 'Б502' },
      { pair: 4, parity: 'both', subject: 'История России', type: 'ЛЕК', teacher: 'Харченко Л.Н.', room: 'Э237' },
      { pair: 5, parity: 'above', subject: 'История России', type: 'ЛЕК', teacher: 'Харченко Л.Н.', room: 'Э237' },
      { pair: 5, parity: 'below', subject: 'История России', type: 'ПРАК', teacher: 'Харченко Л.Н.', room: 'Г408' },
    ],
    4: [
      { pair: 1, parity: 'both', subject: 'Физика', type: 'ЛЕК', teacher: 'Гребенюк Т.И.', room: 'А322' },
      { pair: 2, parity: 'above', subject: 'Физика', type: 'ПРАК', teacher: 'Гребенюк Т.И.', room: 'В309' },
      { pair: 2, parity: 'below', subject: 'Физика', type: 'ЛАБ', teacher: 'Гребенюк Т.И. [1] / Рябыш Д.А. [2]', room: 'В306 / В307' },
      { pair: 3, parity: 'above', subject: 'Математика', type: 'ПРАК', teacher: 'Молька О.В.', room: 'Б511' },
      { pair: 3, parity: 'below', subject: 'Начертательная геометрия и компьютерная графика', type: 'ЛАБ', teacher: 'Шумун Н.М. [1] / Замятина Е.А. [2]', room: 'Б508' },
      { pair: 4, parity: 'above', subject: 'Физическая культура и спорт', type: 'ЛЕК', teacher: 'Шенгелая С.А.', room: 'Б310' },
    ],
    5: [
      { pair: 1, parity: 'both', subject: 'Иностранный язык', type: 'ПРАК', teacher: 'Колесниченко А.Н. [1] / Чуриков М.П. [2]', room: 'Г415 / Д307' },
      { pair: 2, parity: 'both', subject: 'Иностранный язык', type: 'ПРАК', teacher: 'Колесниченко А.Н. [1] / Чуриков М.П. [2]', room: 'Г415 / Д307' },
      { pair: 3, parity: 'both', subject: 'Информатика и программирование', type: 'ЛЕК', teacher: 'Игнатьева О.В.', room: 'Б313' },
      { pair: 4, parity: 'both', subject: 'Информатика и программирование', type: 'ЛАБ', teacher: 'Игнатьева О.В. [1]', room: 'Д412' },
    ],
    6: [],
    0: [],
  },

  VO_AND_NA: {
    1: [
      { pair: 6, parity: 'above', subject: 'Информационные технологии', type: 'ЛАБ', teacher: 'Ильичева В.В. [1] / Нечитайло Н.М. [1]', room: 'Г316' },
      { pair: 7, parity: 'above', subject: 'Информационные технологии', type: 'ЛАБ', teacher: 'Ильичева В.В. [2] / Нечитайло Н.М. [2]', room: 'Г316' },
      { pair: 7, parity: 'below', subject: 'Информационные технологии', type: 'ЛЕК', teacher: 'Дергачева И.В.', room: 'Э220' },
    ],
    2: [
      { pair: 6, parity: 'both', subject: 'Системы и технологии ИИ', type: 'ЛЕК', teacher: 'Доманский В.В.', room: 'Б117' },
    ],
    3: [
      { pair: 6, parity: 'both', subject: 'Технология разработки ПО', type: 'ЛЕК', teacher: 'Панасов В.Л.', room: 'Б317' },
      { pair: 7, parity: 'both', subject: 'Иностранный язык', type: 'ПРАК', teacher: 'Шефиева Э.Ш.', room: 'Л104' },
      { pair: 8, parity: 'both', subject: 'Иностранный язык', type: 'ПРАК', teacher: 'Шефиева Э.Ш.', room: 'Л104' },
    ],
    4: [
      { pair: 6, parity: 'below', subject: 'Системы и технологии ИИ', type: 'ЛАБ', teacher: 'Доманский В.В. [1]', room: 'Г316' },
      { pair: 7, parity: 'above', subject: 'Управление проектами', type: 'ЛЕК', teacher: 'Мейтова А.Н.', room: 'Б317' },
      { pair: 7, parity: 'below', subject: 'Системы и технологии ИИ', type: 'ЛАБ', teacher: 'Доманский В.В. [1]', room: 'Г316' },
      { pair: 8, parity: 'above', subject: 'Управление проектами', type: 'ПРАК', teacher: 'Мейтова А.Н.', room: 'Б317' },
    ],
    5: [
      { pair: 6, parity: 'both', subject: 'Системы и технологии ИИ', type: 'ЛАБ', teacher: 'Доманский В.В. [2]', room: 'Г316' },
      { pair: 7, parity: 'both', subject: 'Методы мат. статистики и ТВ', type: 'ЛЕК', teacher: 'Богачев В.А. / Чуб Е.Г.', room: 'Г313' },
      { pair: 8, parity: 'both', subject: 'Методы мат. статистики и ТВ', type: 'ПРАК', teacher: 'Богачев В.А. / Чуб Е.Г.', room: 'Г313' },
    ],
    6: [
      { pair: 1, parity: 'both', subject: 'Технология разработки ПО', type: 'ЛАБ', teacher: 'Панасов В.Л.', room: 'Г316а' },
      { pair: 2, parity: 'both', subject: 'Технология разработки ПО', type: 'ЛАБ', teacher: 'Панасов В.Л.', room: 'Г316а' },
      { pair: 3, parity: 'both', subject: 'Защита информации', type: 'ЛЕК', teacher: 'Шевчук П.С.', room: 'Г313' },
      { pair: 4, parity: 'both', subject: 'Защита информации', type: 'ЛАБ', teacher: 'Шевчук П.С.', room: 'Г316' },
      { pair: 5, parity: 'both', subject: 'Защита информации', type: 'ЛАБ', teacher: 'Шевчук П.С.', room: 'Г316' },
    ],
    0: [],
  },

  AN: {
    1: [
      { pair: 4, parity: 'both', subject: 'Автоматизация типовых техпроцессов', type: 'ЛЕК', teacher: 'Хачкинаян А.Е.', room: 'У202' },
      { pair: 5, parity: 'both', subject: 'Строительные и дорожные машины', type: 'ПРАК', teacher: 'Хачкинаян А.Е.', room: 'У202' },
      { pair: 6, parity: 'below', subject: 'Гидравлические и пневматические системы', type: 'ЛАБ', teacher: 'Санамян Г.В.', room: 'У202' },
    ],
    2: [
      { pair: 2, parity: 'both', subject: 'Строительные и дорожные машины', type: 'ЛЕК', teacher: 'Каргин Р.В.', room: 'У202' },
      { pair: 3, parity: 'both', subject: 'САПР подъемно-транспортных машин', type: 'ЛАБ', teacher: 'Мищиненко В.Б.', room: 'У129' },
      { pair: 4, parity: 'both', subject: 'Гидравлические и пневматические системы', type: 'ЛЕК', teacher: 'Хачкинаян А.Е.', room: 'У202' },
      { pair: 5, parity: 'above', subject: 'Гидравлические и пневматические системы', type: 'ПРАК', teacher: 'Хачкинаян А.Е.', room: 'У202' },
      { pair: 5, parity: 'below', subject: 'Ресурсосберегающие технологии', type: 'ПРАК', teacher: 'Фисенко К.С.', room: 'У202' },
    ],
    3: [
      { pair: 2, parity: 'above', subject: 'Автоматизация типовых техпроцессов', type: 'ПРАК', teacher: 'Фисенко К.С.', room: 'У202' },
      { pair: 3, parity: 'both', subject: 'Ресурсосберегающие технологии', type: 'ЛЕК', teacher: 'Фисенко К.С.', room: 'У202' },
      { pair: 4, parity: 'both', subject: 'Эксплуатационные материалы', type: 'ЛЕК', teacher: 'Зиновьев В.Е.', room: 'У202' },
      { pair: 5, parity: 'both', subject: 'САПР подъемно-транспортных машин', type: 'ЛЕК', teacher: 'Майба И.А.', room: 'Б312' },
    ],
    4: [
      { pair: 1, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', teacher: 'Военная кафедра', room: 'ВУЦ' },
      { pair: 2, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', teacher: 'Военная кафедра', room: 'ВУЦ' },
      { pair: 3, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', teacher: 'Военная кафедра', room: 'ВУЦ' },
      { pair: 4, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', teacher: 'Военная кафедра', room: 'ВУЦ' },
      { pair: 5, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', teacher: 'Военная кафедра', room: 'ВУЦ' },
    ],
    5: [
      { pair: 1, parity: 'both', subject: 'Организация производства средств механизации', type: 'ЛЕК', teacher: 'Зиновьева Ю.С.', room: 'Д301' },
      { pair: 2, parity: 'both', subject: 'Организация производства средств механизации', type: 'ПРАК', teacher: 'Зиновьева Ю.С.', room: 'Д301' },
      { pair: 3, parity: 'both', subject: 'Эксплуатационные материалы', type: 'ПРАК', teacher: 'Зиновьев В.Е.', room: 'У102' },
    ],
    6: [],
    0: [],
  },

  AR: {
    1: [
      { pair: 2, parity: 'both', subject: 'Электрические передачи локомотивов', type: 'ЛЕК', teacher: 'Донченко А.В.', room: 'М222' },
      { pair: 3, parity: 'both', subject: 'АРМ предприятий транспорта', type: 'ЛЕК', teacher: 'Губарев П.В.', room: 'М307' },
      { pair: 4, parity: 'both', subject: 'Методология проектирования подвижного состава', type: 'ЛЕК', teacher: 'Гребенников Н.В.', room: 'М215' },
      { pair: 5, parity: 'above', subject: 'Методология проектирования подвижного состава', type: 'ПРАК', teacher: 'Гребенников Н.В.', room: 'М211' },
      { pair: 5, parity: 'below', subject: 'Электрическое оборудование локомотивов', type: 'ЛЕК', teacher: 'Донченко А.В.', room: 'М124' },
      { pair: 6, parity: 'above', subject: 'Электрическое оборудование локомотивов', type: 'ЛЕК', teacher: 'Донченко А.В.', room: 'М124' },
    ],
    2: [
      { pair: 2, parity: 'both', subject: 'Техническая диагностика подвижного состава', type: 'ЛЕК', teacher: 'Игнатьев О.Л.', room: 'М124' },
      { pair: 3, parity: 'above', subject: 'Техническая диагностика подвижного состава', type: 'ПРАК', teacher: 'Игнатьев О.Л.', room: 'М137' },
      { pair: 3, parity: 'below', subject: 'АРМ предприятий транспорта', type: 'ПРАК', teacher: 'Романенко Ю.Ю.', room: 'М121' },
    ],
    3: [],
    4: [
      { pair: 1, parity: 'both', subject: 'Локомотивное хозяйство', type: 'ЛЕК', teacher: 'Больших И.В.', room: 'М222' },
      { pair: 2, parity: 'above', subject: 'Локомотивное хозяйство', type: 'ПРАК', teacher: 'Больших И.В.', room: 'М222' },
      { pair: 2, parity: 'below', subject: 'Локомотивное хозяйство', type: 'ЛАБ', teacher: 'Больших И.В.', room: 'М222' },
      { pair: 3, parity: 'above', subject: 'Электрические передачи локомотивов', type: 'ПРАК', teacher: 'Донченко А.В.', room: 'М222' },
      { pair: 3, parity: 'below', subject: 'Инженерная экология', type: 'ПРАК', teacher: 'Борисова А.В.', room: 'М158' },
      { pair: 4, parity: 'above', subject: 'Инженерная экология', type: 'ЛЕК', teacher: 'Борисова А.В.', room: 'М307' },
      { pair: 4, parity: 'below', subject: 'Электрические передачи локомотивов', type: 'ПРАК', teacher: 'Донченко А.В.', room: 'М222' },
      { pair: 5, parity: 'above', subject: 'Электрическое оборудование локомотивов', type: 'ПРАК', teacher: 'Донченко А.В.', room: 'М124' },
      { pair: 5, parity: 'below', subject: 'Электрическое оборудование локомотивов', type: 'ЛАБ', teacher: 'Донченко А.В.', room: 'М124' },
    ],
    5: [],
    6: [],
    0: [],
  },
};

// ==========================================================================
// 2. ЦИКЛ СМЕНЫ НЕДЕЛЬ («НАД ЧЕРТОЙ» / «ПОД ЧЕРТОЙ»)
// Опорная дата: Понедельник 05.10.2026 = ПОД ЧЕРТОЙ
// Сегодня (Сб) и завтра (Вс) = НАД ЧЕРТОЙ
// С понедельника = ПОД ЧЕРТОЙ
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

// ==========================================================================
// 3. ПРИСУТСТВИЕ И ПОИСК ВСТРЕЧ
// ==========================================================================
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
  const person = PEOPLE[personId];

  if (!lessons.length) {
    return {
      personId,
      person,
      hasLessons: false,
      lessons: [],
      presenceStart: null,
      presenceEnd: null,
      summary: 'Нет пар (выходной)',
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
    summary: `${minutesToTime(presenceStartMinutes)} — ${minutesToTime(presenceEndMinutes)} (${lessons.length} пары/пар)`,
  };
}

function getPersonCurrentStatus(personId, dayId, parity, currentMinutes) {
  const presence = getPersonDayPresence(personId, dayId, parity);
  const person = PEOPLE[personId];

  if (!presence.hasLessons) {
    return {
      person,
      badgeClass: 'status-badge-off',
      badgeText: 'Выходной',
      detail: 'Сегодня нет занятий',
    };
  }

  if (currentMinutes < presence.presenceStartMinutes) {
    const first = presence.lessons[0];
    return {
      person,
      badgeClass: 'status-badge-upcoming',
      badgeText: `С ${first.start}`,
      detail: `Первая: ${first.pair} п. (${first.room})`,
    };
  }

  if (currentMinutes >= presence.presenceEndMinutes) {
    return {
      person,
      badgeClass: 'status-badge-off',
      badgeText: 'Освободился',
      detail: `Пары окончены в ${presence.presenceEnd}`,
    };
  }

  for (const lesson of presence.lessons) {
    if (currentMinutes >= lesson.startMinutes && currentMinutes < lesson.endMinutes) {
      return {
        person,
        badgeClass: 'status-badge-class',
        badgeText: `${lesson.pair} пара`,
        detail: `${lesson.subject} (ауд. ${lesson.room})`,
      };
    }
  }

  return {
    person,
    badgeClass: 'status-badge-break',
    badgeText: 'На перерыве',
    detail: 'В университете между парами',
  };
}

function findMeetupsForDay(dayId, parity) {
  const allIds = ['YU', 'VO_AND_NA', 'AN', 'AR'];
  const presences = {};
  for (const id of allIds) {
    presences[id] = getPersonDayPresence(id, dayId, parity);
  }

  const meetups = [];

  // 1. Большой перерыв: 11:30 - 12:00
  const BIG_BREAK_START = 11 * 60 + 30;
  const BIG_BREAK_END = 12 * 60;
  const bigBreakPeople = [];

  for (const id of allIds) {
    const p = presences[id];
    if (p.hasLessons) {
      const inCampus = p.presenceStartMinutes <= BIG_BREAK_START && p.presenceEndMinutes >= BIG_BREAK_END;
      const endsAt1130 = p.presenceEndMinutes === BIG_BREAK_START;
      if (inCampus || endsAt1130) {
        bigBreakPeople.push(id);
      }
    }
  }

  if (bigBreakPeople.length >= 2) {
    meetups.push({
      type: 'big-break',
      title: '🍱 Большой перерыв (Обед / Кофе)',
      time: '11:30 — 12:00',
      duration: '30 минут',
      participants: bigBreakPeople,
      desc: 'Все эти участники находятся в вузе между парами. Идеальное время перекусить или пообщаться!',
    });
  }

  // 2. Пересменка: 17:10 - 17:20
  const SHIFT_START = 17 * 60 + 10;
  const SHIFT_END = 17 * 60 + 20;

  const finishing1710 = [];
  const starting1720 = [];

  for (const id of allIds) {
    const p = presences[id];
    if (p.hasLessons) {
      const has5th = p.lessons.some(l => l.endMinutes === SHIFT_START);
      const has6th = p.lessons.some(l => l.startMinutes === SHIFT_END);

      if (has5th && !has6th) finishing1710.push(id);
      if (has6th && !has5th) starting1720.push(id);
    }
  }

  if (finishing1710.length > 0 && starting1720.length > 0) {
    meetups.push({
      type: 'shift-change',
      title: '🔄 Пересменка (Дневные ↔ Вечерние)',
      time: '17:10 — 17:20',
      duration: '10 минут',
      participants: [...new Set([...finishing1710, ...starting1720])],
      desc: `${finishing1710.map(id => PEOPLE[id].name).join(', ')} закончили пары, а ${starting1720.map(id => PEOPLE[id].name).join(', ')} заходят на 6 пару! Встреча у входа / в холле.`,
    });
  }

  // 3. Другие совместные перерывы
  const standardBreaks = [
    { start: '13:30', end: '13:55', sMin: 13 * 60 + 30, eMin: 13 * 60 + 55, name: 'Перерыв между 3 и 4 парой (25 мин)' },
    { start: '15:25', end: '15:40', sMin: 15 * 60 + 25, eMin: 15 * 60 + 40, name: 'Перерыв между 4 и 5 парой (15 мин)' },
  ];

  for (const brk of standardBreaks) {
    const avail = [];
    for (const id of allIds) {
      const p = presences[id];
      if (p.hasLessons) {
        const inCampus = p.presenceStartMinutes <= brk.sMin && p.presenceEndMinutes >= brk.eMin;
        const hasClass = p.lessons.some(l => l.startMinutes < brk.eMin && l.endMinutes > brk.sMin);
        if (inCampus && !hasClass) avail.push(id);
      }
    }
    if (avail.length >= 2) {
      meetups.push({
        type: 'break',
        title: `☕ ${brk.name}`,
        time: `${brk.start} — ${brk.end}`,
        duration: `${brk.eMin - brk.sMin} мин`,
        participants: avail,
        desc: 'Одновременный перерыв между парами в корпусах университета.',
      });
    }
  }

  return meetups;
}

// ==========================================================================
// 4. UI СОСТОЯНИЕ И ЛОГИКА
// ==========================================================================
const state = {
  currentDate: new Date(),
  // Текущий день недели (0..6)
  todayDayId: new Date().getDay(),
  // Выбранный для просмотра день недели: по умолчанию СЕГОДНЯ
  selectedDay: new Date().getDay(),
  // Черта:
  parity: getParityForDate(new Date()),
  isManuallyOverridden: false,
  isTimelineExpanded: false,
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
  }, 1000);
});

function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = state.theme === 'dark' ? '☀️' : '🌙';
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

  // Subtitle
  const subEl = document.getElementById('header-today-label');
  if (subEl) {
    subEl.textContent = isSelectedToday
      ? `Сегодня: ${dayName}, ${d.getDate()} октября`
      : `Просмотр: ${dayName}`;
  }

  // Week pill button
  const weekBtn = document.getElementById('week-toggle-btn');
  const weekText = document.getElementById('week-badge-text');
  const isBelow = state.parity === 'below';

  if (weekBtn) {
    weekBtn.className = `week-pill-btn ${state.parity}`;
  }
  if (weekText) {
    weekText.textContent = isBelow ? 'ПОД ЧЕРТОЙ' : 'НАД ЧЕРТОЙ';
  }

  // Headings
  const meetupsHeading = document.getElementById('meetups-heading');
  const presenceHeading = document.getElementById('presence-heading');
  if (meetupsHeading) {
    meetupsHeading.textContent = isSelectedToday ? 'Встречи сегодня' : `Встречи на ${dayName.toLowerCase()}`;
  }
  if (presenceHeading) {
    presenceHeading.textContent = isSelectedToday ? 'Кто где сегодня' : `Кто где в ${dayName.toLowerCase()}`;
  }
}

function renderDaySelector() {
  const container = document.getElementById('day-selector-bar');
  if (!container) return;

  container.innerHTML = DAYS_OF_WEEK.map(d => {
    const isActive = d.id === state.selectedDay;
    const isToday = d.id === state.todayDayId;
    return `
      <button class="day-pill ${isActive ? 'active' : ''}" data-day="${d.id}">
        <span class="short-name">${d.short}</span>
        <span class="today-dot">${isToday ? 'Сегодня' : d.name.slice(0, 3)}</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.day-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedDay = Number(btn.dataset.day);

      // Если в выходные переключаемся на будни (Пн..Пт) и пользователь не нажимал ручной переключатель черты,
      // то показываем наступающую неделю (ПОД ЧЕРТОЙ)!
      if (!state.isManuallyOverridden) {
        const isWeekendNow = state.todayDayId === 0 || state.todayDayId === 6;
        if (isWeekendNow && state.selectedDay >= 1 && state.selectedDay <= 5) {
          state.parity = 'below'; // Послезавтра понедельник ПОД ЧЕРТОЙ
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

  const meetups = findMeetupsForDay(state.selectedDay, state.parity);
  const isSelectedToday = state.selectedDay === state.todayDayId;

  if (countBadge) {
    countBadge.textContent = `${meetups.length} ${meetups.length === 1 ? 'встреча' : meetups.length >= 2 && meetups.length <= 4 ? 'встречи' : 'встреч'}`;
  }

  if (!meetups.length) {
    const dayName = DAYS_OF_WEEK.find(d => d.id === state.selectedDay)?.name.toLowerCase();
    container.innerHTML = `
      <div class="empty-meetups-card">
        <div class="empty-icon">☕</div>
        <h3 class="empty-title">${isSelectedToday ? 'Сегодня совместных встреч нет' : `В ${dayName} совместных встреч нет`}</h3>
        <p class="empty-desc">
          В этот день у друзей не пересекаются свободные перерывы или пересменки в университете.
        </p>
        <button class="btn-jump-next" id="btn-jump-monday">
          Посмотреть встречи на понедельник ➔
        </button>
      </div>
    `;

    document.getElementById('btn-jump-monday')?.addEventListener('click', () => {
      state.selectedDay = 1; // Понедельник
      if (!state.isManuallyOverridden) state.parity = 'below'; // Понедельник под чертой
      renderDaySelector();
      updateHeader();
      renderMeetups();
      renderPresence();
      renderTimelineAndTables();
    });
    return;
  }

  container.innerHTML = meetups.map(m => {
    const typeClass = m.type === 'big-break' ? 'type-big-break' : m.type === 'shift-change' ? 'type-shift-change' : '';
    const participantPills = m.participants.map(id => {
      const p = PEOPLE[id];
      return `
        <span class="participant-mini-pill" style="background: ${p.bg}; color: ${p.color}; border: 1px solid ${p.border};">
          ${p.avatar} ${p.name}
        </span>
      `;
    }).join('');

    return `
      <div class="meetup-card ${typeClass}">
        <div>
          <div class="meetup-card-top">
            <h3 class="meetup-title">${m.title}</h3>
            <span class="meetup-time-chip">${m.time}</span>
          </div>
          <p class="meetup-description">${m.desc}</p>
        </div>
        <div class="meetup-card-bottom">
          <div class="participants-pill-group">
            ${participantPills}
          </div>
          <span class="duration-text">⏱ ${m.duration}</span>
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
    const presence = getPersonDayPresence(p.id, state.selectedDay, state.parity);
    const status = getPersonCurrentStatus(p.id, state.selectedDay, state.parity, currentMinutes);

    return `
      <div class="presence-person-card" style="--p-color: ${p.color};">
        <div class="presence-top">
          <span class="presence-name">
            <span>${p.avatar}</span>
            <span style="color: ${p.color};">${p.name}</span>
          </span>
          <span class="presence-status-badge ${status.badgeClass}">${status.badgeText}</span>
        </div>
        <div class="presence-detail">${status.detail}</div>
        <div class="presence-time-span">${presence.summary}</div>
      </div>
    `;
  }).join('');
}

function renderTimelineAndTables() {
  const hoursEl = document.getElementById('timeline-hours');
  const tracksEl = document.getElementById('timeline-tracks');
  const tablesEl = document.getElementById('timetables-grid');
  if (!hoursEl || !tracksEl || !tablesEl) return;

  const TIMELINE_START = 8 * 60;
  const TIMELINE_SPAN = 14 * 60; // 08:00 - 22:00

  // Hours
  let hHtml = '<div class="timeline-h-mark" style="font-weight: 700;">Имя</div>';
  for (let h = 8; h <= 21; h++) {
    hHtml += `<div class="timeline-h-mark">${h}:00</div>`;
  }
  hoursEl.innerHTML = hHtml;

  // Tracks
  tracksEl.innerHTML = Object.values(PEOPLE).map(p => {
    const lessons = getPersonLessons(p.id, state.selectedDay, state.parity);

    const blocks = lessons.map(l => {
      const left = ((l.startMinutes - TIMELINE_START) / TIMELINE_SPAN) * 100;
      const width = ((l.endMinutes - l.startMinutes) / TIMELINE_SPAN) * 100;
      return `
        <div class="timeline-lesson-block" style="left: ${left}%; width: ${width}%; background: ${p.color};" title="${l.pair} пара: ${l.subject}">
          ${l.pair} п. ${l.subject.slice(0, 14)} (${l.room})
        </div>
      `;
    }).join('');

    const bigBreakLeft = ((11 * 60 + 30 - TIMELINE_START) / TIMELINE_SPAN) * 100;
    const bigBreakWidth = (30 / TIMELINE_SPAN) * 100;
    const shiftLeft = ((17 * 60 + 10 - TIMELINE_START) / TIMELINE_SPAN) * 100;
    const shiftWidth = (10 / TIMELINE_SPAN) * 100;

    return `
      <div class="timeline-row">
        <span class="timeline-person-name" style="color: ${p.color};">${p.avatar} ${p.name}</span>
        <div class="timeline-track-bar">
          <div class="timeline-highlight-zone" style="left: ${bigBreakLeft}%; width: ${bigBreakWidth}%;"></div>
          <div class="timeline-highlight-zone" style="left: ${shiftLeft}%; width: ${shiftWidth}%; background: rgba(16, 185, 129, 0.1);"></div>
          ${blocks}
        </div>
      </div>
    `;
  }).join('');

  // Detailed Tables
  tablesEl.innerHTML = Object.values(PEOPLE).map(p => {
    const presence = getPersonDayPresence(p.id, state.selectedDay, state.parity);
    let lessonsHtml = '';

    if (!presence.hasLessons) {
      lessonsHtml = `<div class="empty-table-msg">🌴 Нет пар в этот день</div>`;
    } else {
      lessonsHtml = presence.lessons.map(l => `
        <div class="lesson-row-item">
          <span class="pair-num-chip">${l.pair}</span>
          <div class="lesson-mid">
            <div class="lesson-sub-name">${l.subject}</div>
            <div class="lesson-sub-meta">${l.type} • ${l.teacher}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-mono); font-size: 0.72rem;">${l.start}</div>
            <span class="lesson-room-chip">${l.room}</span>
          </div>
        </div>
      `).join('');
    }

    return `
      <div class="table-card">
        <div class="table-card-head">
          <span style="color: ${p.color};">${p.avatar} ${p.fullName}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${presence.presenceStart ? `${presence.presenceStart}-${presence.presenceEnd}` : 'Выходной'}</span>
        </div>
        ${lessonsHtml}
      </div>
    `;
  }).join('');
}

function setupEvents() {
  // Theme toggle
  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('match_theme', state.theme);
    initTheme();
  });

  // Week parity toggle
  document.getElementById('week-toggle-btn')?.addEventListener('click', () => {
    state.parity = state.parity === 'below' ? 'above' : 'below';
    state.isManuallyOverridden = true;
    updateHeader();
    renderMeetups();
    renderPresence();
    renderTimelineAndTables();
  });

  // Collapsible toggle
  const collapseBtn = document.getElementById('collapse-toggle-btn');
  const collapseContent = document.getElementById('collapsible-content');
  collapseBtn?.addEventListener('click', () => {
    state.isTimelineExpanded = !state.isTimelineExpanded;
    collapseBtn.classList.toggle('open', state.isTimelineExpanded);
    if (collapseContent) {
      collapseContent.style.display = state.isTimelineExpanded ? 'block' : 'none';
    }
  });
}
