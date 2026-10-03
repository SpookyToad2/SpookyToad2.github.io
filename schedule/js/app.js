// ==========================================================================
// MATCH SCHEDULE — Координатор пар и встреч РГУПС
// Полностью автономный скрипт: работает как при локальном открытии через file://
// так и на GitHub Pages без сборщиков и CORS-ограничений.
// ==========================================================================

// 1. СЕТКА ЗВОНКОВ РГУПС
const BELLS = [
  { pair: 1, start: '08:15', end: '09:45', startMinutes: 8 * 60 + 15, endMinutes: 9 * 60 + 45 },
  { pair: 2, start: '10:00', end: '11:30', startMinutes: 10 * 60, endMinutes: 11 * 60 + 30 },
  // Большой перерыв: 11:30 - 12:00 (30 мин)
  { pair: 3, start: '12:00', end: '13:30', startMinutes: 12 * 60, endMinutes: 13 * 60 + 30 },
  // Перерыв: 13:30 - 13:55 (25 мин)
  { pair: 4, start: '13:55', end: '15:25', startMinutes: 13 * 60 + 55, endMinutes: 15 * 60 + 25 },
  // Перерыв: 15:25 - 15:40 (15 мин)
  { pair: 5, start: '15:40', end: '17:10', startMinutes: 15 * 60 + 40, endMinutes: 17 * 60 + 10 },
  // Пересменка дневников и вечерников: 17:10 - 17:20 (10 мин)
  { pair: 6, start: '17:20', end: '18:50', startMinutes: 17 * 60 + 20, endMinutes: 18 * 60 + 50 },
  // Перерыв: 18:50 - 18:55 (5 мин)
  { pair: 7, start: '18:55', end: '20:25', startMinutes: 18 * 60 + 55, endMinutes: 20 * 60 + 25 },
  // Перерыв: 20:25 - 20:30 (5 мин)
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
    role: 'Дневное отделение (1 поток)',
    color: '#38bdf8',
    bgLight: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
    avatar: '👨‍🎓',
  },
  VO_AND_NA: {
    id: 'VO_AND_NA',
    name: 'VO & NA',
    fullName: 'VO & NA',
    role: 'Вечернее отделение (ИТ)',
    color: '#34d399',
    bgLight: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.4)',
    avatar: '👥',
  },
  AN: {
    id: 'AN',
    name: 'AN',
    fullName: 'Друг 3 (AN)',
    role: 'Дневное отделение (Машины)',
    color: '#fbbf24',
    bgLight: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.4)',
    avatar: '👷‍♂️',
  },
  AR: {
    id: 'AR',
    name: 'AR',
    fullName: 'Друг 4 (AR)',
    role: 'Дневное отделение (Локомотивы)',
    color: '#c084fc',
    bgLight: 'rgba(192, 132, 252, 0.15)',
    border: 'rgba(192, 132, 252, 0.4)',
    avatar: '🚆',
  },
};

// parity: 'both' (обе недели), 'above' (над чертой), 'below' (под чертой)
const SCHEDULE_DB = {
  // ==================== YU ====================
  YU: {
    1: [ // Пн
      { pair: 1, parity: 'both', subject: 'Информатика и программирование', type: 'ЛАБ', teacher: 'Гречко К.Э. [2]', room: 'Г302' },
      { pair: 2, parity: 'both', subject: 'Русский язык и деловые коммуникации', type: 'ПРАК', teacher: 'Силютина Е.Н.', room: 'С209' },
      { pair: 3, parity: 'below', subject: 'Начертательная геометрия и компьютерная графика', type: 'ЛЕК', teacher: 'Шумун Н.М.', room: 'Б317' },
    ],
    2: [ // Вт
      { pair: 1, parity: 'below', subject: 'Физическая культура и спорт', type: 'ПРАК', teacher: 'Тимченко М.И.', room: '1141' },
      { pair: 2, parity: 'above', subject: 'Информатика и программирование', type: 'ПРАК', teacher: 'Щербакова К.С.', room: 'Д413' },
      { pair: 2, parity: 'below', subject: 'Русский язык и деловые коммуникации', type: 'ЛЕК', teacher: 'Покотыло М.В.', room: 'М215' },
      { pair: 3, parity: 'both', subject: 'Основы российской государственности', type: 'ПРАК', teacher: 'Багрова Н.А.', room: 'Г408' },
      { pair: 4, parity: 'both', subject: 'Математика', type: 'ЛЕК', teacher: 'Лагунова Е.О.', room: 'А322' },
      { pair: 5, parity: 'below', subject: 'Основы российской государственности', type: 'ЛЕК', teacher: 'Тованчова Е.Н.', room: 'С204' },
    ],
    3: [ // Ср
      { pair: 2, parity: 'above', subject: 'Начертательная геометрия и компьютерная графика', type: 'ПРАК', teacher: 'Шумун Н.М.', room: 'Б502' },
      { pair: 3, parity: 'above', subject: 'Математика', type: 'ПРАК', teacher: 'Молька О.В.', room: 'Б502' },
      { pair: 4, parity: 'both', subject: 'История России', type: 'ЛЕК', teacher: 'Харченко Л.Н.', room: 'Э237' },
      { pair: 5, parity: 'above', subject: 'История России', type: 'ЛЕК', teacher: 'Харченко Л.Н.', room: 'Э237' },
      { pair: 5, parity: 'below', subject: 'История России', type: 'ПРАК', teacher: 'Харченко Л.Н.', room: 'Г408' },
    ],
    4: [ // Чт
      { pair: 1, parity: 'both', subject: 'Физика', type: 'ЛЕК', teacher: 'Гребенюк Т.И.', room: 'А322' },
      { pair: 2, parity: 'above', subject: 'Физика', type: 'ПРАК', teacher: 'Гребенюк Т.И.', room: 'В309' },
      { pair: 2, parity: 'below', subject: 'Физика', type: 'ЛАБ', teacher: 'Гребенюк Т.И. [1] / Рябыш Д.А. [2]', room: 'В306 / В307' },
      { pair: 3, parity: 'above', subject: 'Математика', type: 'ПРАК', teacher: 'Молька О.В.', room: 'Б511' },
      { pair: 3, parity: 'below', subject: 'Начертательная геометрия и компьютерная графика', type: 'ЛАБ', teacher: 'Шумун Н.М. [1] / Замятина Е.А. [2]', room: 'Б508' },
      { pair: 4, parity: 'above', subject: 'Физическая культура и спорт', type: 'ЛЕК', teacher: 'Шенгелая С.А.', room: 'Б310' },
    ],
    5: [ // Пт
      { pair: 1, parity: 'both', subject: 'Иностранный язык', type: 'ПРАК', teacher: 'Колесниченко А.Н. [1] / Чуриков М.П. [2]', room: 'Г415 / Д307' },
      { pair: 2, parity: 'both', subject: 'Иностранный язык', type: 'ПРАК', teacher: 'Колесниченко А.Н. [1] / Чуриков М.П. [2]', room: 'Г415 / Д307' },
      { pair: 3, parity: 'both', subject: 'Информатика и программирование', type: 'ЛЕК', teacher: 'Игнатьева О.В.', room: 'Б313' },
      { pair: 4, parity: 'both', subject: 'Информатика и программирование', type: 'ЛАБ', teacher: 'Игнатьева О.В. [1]', room: 'Д412' },
    ],
    6: [],
    0: [],
  },

  // ==================== VO_AND_NA ====================
  VO_AND_NA: {
    1: [ // Пн
      { pair: 6, parity: 'above', subject: 'Информационные технологии', type: 'ЛАБ', teacher: 'Ильичева В.В. [1] / Нечитайло Н.М. [1]', room: 'Г316' },
      { pair: 7, parity: 'above', subject: 'Информационные технологии', type: 'ЛАБ', teacher: 'Ильичева В.В. [2] / Нечитайло Н.М. [2]', room: 'Г316' },
      { pair: 7, parity: 'below', subject: 'Информационные технологии', type: 'ЛЕК', teacher: 'Дергачева И.В.', room: 'Э220' },
    ],
    2: [ // Вт
      { pair: 6, parity: 'both', subject: 'Системы и технологии искусственного интеллекта', type: 'ЛЕК', teacher: 'Доманский В.В.', room: 'Б117' },
    ],
    3: [ // Ср
      { pair: 6, parity: 'both', subject: 'Технология разработки программного обеспечения', type: 'ЛЕК', teacher: 'Панасов В.Л.', room: 'Б317' },
      { pair: 7, parity: 'both', subject: 'Иностранный язык (академическое взаимодействие)', type: 'ПРАК', teacher: 'Шефиева Э.Ш.', room: 'Л104' },
      { pair: 8, parity: 'both', subject: 'Иностранный язык (академическое взаимодействие)', type: 'ПРАК', teacher: 'Шефиева Э.Ш.', room: 'Л104' },
    ],
    4: [ // Чт
      { pair: 6, parity: 'below', subject: 'Системы и технологии искусственного интеллекта', type: 'ЛАБ', teacher: 'Доманский В.В. [1]', room: 'Г316' },
      { pair: 7, parity: 'above', subject: 'Управление проектами', type: 'ЛЕК', teacher: 'Мейтова А.Н.', room: 'Б317' },
      { pair: 7, parity: 'below', subject: 'Системы и технологии искусственного интеллекта', type: 'ЛАБ', teacher: 'Доманский В.В. [1]', room: 'Г316' },
      { pair: 8, parity: 'above', subject: 'Управление проектами', type: 'ПРАК', teacher: 'Мейтова А.Н.', room: 'Б317' },
    ],
    5: [ // Пт
      { pair: 6, parity: 'both', subject: 'Системы и технологии искусственного интеллекта', type: 'ЛАБ', teacher: 'Доманский В.В. [2]', room: 'Г316' },
      { pair: 7, parity: 'both', subject: 'Методы математической статистики и ТВ', type: 'ЛЕК', teacher: 'Богачев В.А. / Чуб Е.Г.', room: 'Г313' },
      { pair: 8, parity: 'both', subject: 'Методы математической статистики и ТВ', type: 'ПРАК', teacher: 'Богачев В.А. / Чуб Е.Г.', room: 'Г313' },
    ],
    6: [ // Сб
      { pair: 1, parity: 'both', subject: 'Технология разработки ПО', type: 'ЛАБ', teacher: 'Панасов В.Л.', room: 'Г316а' },
      { pair: 2, parity: 'both', subject: 'Технология разработки ПО', type: 'ЛАБ', teacher: 'Панасов В.Л.', room: 'Г316а' },
      { pair: 3, parity: 'both', subject: 'Защита информации и интеллектуальной собственности', type: 'ЛЕК', teacher: 'Шевчук П.С.', room: 'Г313' },
      { pair: 4, parity: 'both', subject: 'Защита информации и интеллектуальной собственности', type: 'ЛАБ', teacher: 'Шевчук П.С.', room: 'Г316' },
      { pair: 5, parity: 'both', subject: 'Защита информации и интеллектуальной собственности', type: 'ЛАБ', teacher: 'Шевчук П.С.', room: 'Г316' },
    ],
    0: [],
  },

  // ==================== AN ====================
  AN: {
    1: [ // Пн
      { pair: 4, parity: 'both', subject: 'Автоматизация типовых технологических процессов', type: 'ЛЕК', teacher: 'Хачкинаян А.Е.', room: 'У202' },
      { pair: 5, parity: 'both', subject: 'Строительные и дорожные машины', type: 'ПРАК', teacher: 'Хачкинаян А.Е.', room: 'У202' },
      { pair: 6, parity: 'below', subject: 'Гидравлические и пневматические системы', type: 'ЛАБ', teacher: 'Санамян Г.В.', room: 'У202' },
    ],
    2: [ // Вт
      { pair: 2, parity: 'both', subject: 'Строительные и дорожные машины', type: 'ЛЕК', teacher: 'Каргин Р.В.', room: 'У202' },
      { pair: 3, parity: 'both', subject: 'САПР подъемно-транспортных, строит., дорожных средств', type: 'ЛАБ', teacher: 'Мищиненко В.Б.', room: 'У129' },
      { pair: 4, parity: 'both', subject: 'Гидравлические и пневматические системы', type: 'ЛЕК', teacher: 'Хачкинаян А.Е.', room: 'У202' },
      { pair: 5, parity: 'above', subject: 'Гидравлические и пневматические системы', type: 'ПРАК', teacher: 'Хачкинаян А.Е.', room: 'У202' },
      { pair: 5, parity: 'below', subject: 'Ресурсосберегающие технологии в отрасли', type: 'ПРАК', teacher: 'Фисенко К.С.', room: 'У202' },
    ],
    3: [ // Ср
      { pair: 2, parity: 'above', subject: 'Автоматизация типовых технологических процессов', type: 'ПРАК', teacher: 'Фисенко К.С.', room: 'У202' },
      { pair: 3, parity: 'both', subject: 'Ресурсосберегающие технологии в отрасли', type: 'ЛЕК', teacher: 'Фисенко К.С.', room: 'У202' },
      { pair: 4, parity: 'both', subject: 'Эксплуатационные материалы', type: 'ЛЕК', teacher: 'Зиновьев В.Е.', room: 'У202' },
      { pair: 5, parity: 'both', subject: 'САПР подъемно-транспортных, строит., дорожных средств', type: 'ЛЕК', teacher: 'Майба И.А.', room: 'Б312' },
    ],
    4: [ // Чт
      { pair: 1, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', teacher: 'Военная кафедра', room: 'ВУЦ' },
      { pair: 2, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', teacher: 'Военная кафедра', room: 'ВУЦ' },
      { pair: 3, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', teacher: 'Военная кафедра', room: 'ВУЦ' },
      { pair: 4, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', teacher: 'Военная кафедра', room: 'ВУЦ' },
      { pair: 5, parity: 'both', subject: 'Военная подготовка', type: 'ВУЦ', teacher: 'Военная кафедра', room: 'ВУЦ' },
    ],
    5: [ // Пт
      { pair: 1, parity: 'both', subject: 'Организация производства средств механизации', type: 'ЛЕК', teacher: 'Зиновьева Ю.С.', room: 'Д301' },
      { pair: 2, parity: 'both', subject: 'Организация производства средств механизации', type: 'ПРАК', teacher: 'Зиновьева Ю.С.', room: 'Д301' },
      { pair: 3, parity: 'both', subject: 'Эксплуатационные материалы', type: 'ПРАК', teacher: 'Зиновьев В.Е.', room: 'У102' },
    ],
    6: [],
    0: [],
  },

  // ==================== AR ====================
  AR: {
    1: [ // Пн
      { pair: 2, parity: 'both', subject: 'Электрические передачи локомотивов', type: 'ЛЕК', teacher: 'Донченко А.В.', room: 'М222' },
      { pair: 3, parity: 'both', subject: 'Автоматизированные рабочие места предприятий транспорта', type: 'ЛЕК', teacher: 'Губарев П.В.', room: 'М307' },
      { pair: 4, parity: 'both', subject: 'Методология проектирования перспективного подвижного состава', type: 'ЛЕК', teacher: 'Гребенников Н.В.', room: 'М215' },
      { pair: 5, parity: 'above', subject: 'Методология проектирования перспективного подвижного состава', type: 'ПРАК', teacher: 'Гребенников Н.В.', room: 'М211' },
      { pair: 5, parity: 'below', subject: 'Электрическое оборудование локомотивов', type: 'ЛЕК', teacher: 'Донченко А.В.', room: 'М124' },
      { pair: 6, parity: 'above', subject: 'Электрическое оборудование локомотивов', type: 'ЛЕК', teacher: 'Донченко А.В.', room: 'М124' },
    ],
    2: [ // Вт
      { pair: 2, parity: 'both', subject: 'Техническая диагностика и испытания подвижного состава', type: 'ЛЕК', teacher: 'Игнатьев О.Л.', room: 'М124' },
      { pair: 3, parity: 'above', subject: 'Техническая диагностика и испытания подвижного состава', type: 'ПРАК', teacher: 'Игнатьев О.Л.', room: 'М137' },
      { pair: 3, parity: 'below', subject: 'Автоматизированные рабочие места предприятий транспорта', type: 'ПРАК', teacher: 'Романенко Ю.Ю.', room: 'М121' },
    ],
    3: [],
    4: [ // Чт
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
// Опорный понедельник: 5 октября 2026 = "ПОД ЧЕРТОЙ"
// Сегодня (Суббота 3 окт) и завтра (Воскресенье 4 окт) — НАД ЧЕРТОЙ
// Послезавтра (Понедельник 5 окт) — начинается неделя ПОД ЧЕРТОЙ
// ==========================================================================
const REF_MONDAY = new Date(2026, 9, 5, 0, 0, 0, 0);

function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Вс, 1 = Пн
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

function getSundayOfWeek(date = new Date()) {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function getParityForDate(date = new Date()) {
  const monday = getMondayOfWeek(date);
  const diffMs = monday.getTime() - REF_MONDAY.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const mod = ((diffWeeks % 2) + 2) % 2;

  // mod === 0 -> ПОД ЧЕРТОЙ (below)
  // mod === 1 -> НАД ЧЕРТОЙ (above)
  return mod === 0 ? 'below' : 'above';
}

function getWeekCycleInfo(date = new Date()) {
  const currentParity = getParityForDate(date);
  const monday = getMondayOfWeek(date);
  const sunday = getSundayOfWeek(date);

  const nextMonday = new Date(sunday);
  nextMonday.setMilliseconds(nextMonday.getMilliseconds() + 1);
  const nextParity = currentParity === 'below' ? 'above' : 'below';

  const now = new Date(date);
  const msUntilNext = Math.max(0, nextMonday.getTime() - now.getTime());
  const hoursTotal = Math.floor(msUntilNext / (1000 * 60 * 60));
  const daysUntilNext = Math.floor(hoursTotal / 24);
  const hoursUntilNext = hoursTotal % 24;

  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  return {
    currentParity,
    currentLabel: currentParity === 'below' ? 'ПОД ЧЕРТОЙ' : 'НАД ЧЕРТОЙ',
    currentSub: currentParity === 'below' ? 'Чётная неделя' : 'Нечётная неделя',
    monday,
    sunday,
    nextMonday,
    nextParity,
    nextLabel: nextParity === 'below' ? 'ПОД ЧЕРТОЙ' : 'НАД ЧЕРТОЙ',
    daysUntilNext,
    hoursUntilNext,
    isWeekend,
  };
}

// ==========================================================================
// 3. АЛГОРИТМ ПОИСКА ВСТРЕЧ И ПРИСУТСТВИЯ В УНИВЕРСИТЕТЕ
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
      presenceStartMinutes: null,
      presenceEndMinutes: null,
      presenceStart: null,
      presenceEnd: null,
      summary: 'Нет пар в этот день (выходной)',
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
    summary: `В вузе с ${minutesToTime(presenceStartMinutes)} до ${minutesToTime(presenceEndMinutes)} (${lessons.length} пары/пар)`,
  };
}

function getPersonCurrentStatus(personId, dayId, parity, currentMinutes) {
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

  if (currentMinutes < presence.presenceStartMinutes) {
    const diff = presence.presenceStartMinutes - currentMinutes;
    const first = presence.lessons[0];
    return {
      person,
      status: 'upcoming',
      badgeClass: 'badge-upcoming',
      title: 'Не в вузе (ещё не приехал)',
      detail: `Первая пара в ${first.start} (${first.pair} п.: ${first.subject})`,
      timeToStart: diff,
      room: first.room,
      activeLesson: null,
    };
  }

  if (currentMinutes >= presence.presenceEndMinutes) {
    const last = presence.lessons[presence.lessons.length - 1];
    return {
      person,
      status: 'finished',
      badgeClass: 'badge-finished',
      title: 'Уже освободился',
      detail: `Пары закончились в ${last.end}`,
      room: null,
      activeLesson: null,
    };
  }

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

function findMeetupOpportunities(selectedPersonIds, dayId, parity) {
  if (selectedPersonIds.length < 2) return [];

  const presences = {};
  for (const id of selectedPersonIds) {
    presences[id] = getPersonDayPresence(id, dayId, parity);
  }

  const opportunities = [];

  // 1. БОЛЬШОЙ ПЕРЕРЫВ (11:30 - 12:00)
  const BIG_BREAK_START = 11 * 60 + 30;
  const BIG_BREAK_END = 12 * 60;

  const bigBreakPeople = [];
  for (const id of selectedPersonIds) {
    const p = presences[id];
    if (p.hasLessons) {
      const arrivedByBreak = p.presenceStartMinutes <= BIG_BREAK_START;
      const staysAfterBreak = p.presenceEndMinutes >= BIG_BREAK_END;
      if (arrivedByBreak && (staysAfterBreak || p.presenceEndMinutes === BIG_BREAK_START)) {
        bigBreakPeople.push(id);
      }
    }
  }

  if (bigBreakPeople.length >= 2) {
    opportunities.push({
      type: 'big_break',
      title: '🍱 Большой перерыв (Обед / Кофе)',
      timeStart: '11:30',
      timeEnd: '12:00',
      startMinutes: BIG_BREAK_START,
      endMinutes: BIG_BREAK_END,
      duration: '30 минут',
      priority: 1,
      participantIds: bigBreakPeople,
      description: 'Идеальное окно для обеда или кофе между 2 и 3 парами. Все участники находятся в университете.',
    });
  }

  // 2. ПЕРЕСМЕНКА ДНЕВНИКОВ И ВЕЧЕРНИКОВ (17:10 - 17:20)
  const SHIFT_START = 17 * 60 + 10;
  const SHIFT_END = 17 * 60 + 20;

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
      // Приезжает на 6-ю пару к 17:20 (ранее не был на 5-й)
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
      description: `${finishingAt1710.map(id => PEOPLE[id].name).join(', ')} заканчивают 5 пару, а ${startingAt1720.map(id => PEOPLE[id].name).join(', ')} заходят на 6 пару! Встреча в холле / у входа.`,
    });
  }

  // 3. СТАНДАРТНЫЕ ПЕРЕРЫВЫ МЕЖДУ ПАРАМИ
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
        const inCampus = p.presenceStartMinutes <= brk.startMinutes && p.presenceEndMinutes >= brk.endMinutes;
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
        description: 'Одновременный перерыв в корпусах университета.',
      });
    }
  }

  // 4. ДЛИННЫЕ СВОБОДНЫЕ ОКНА НА ВРЕМЯ ЦЕЛОЙ ПАРЫ
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
      opportunities.push({
        type: 'window',
        title: `🕒 Окно на время ${bell.pair} пары`,
        timeStart: bell.start,
        timeEnd: bell.end,
        startMinutes: bell.startMinutes,
        endMinutes: bell.endMinutes,
        duration: '1 час 30 минут',
        priority: 2,
        participantIds: available,
        description: `У участников совпало свободное окно (нет занятий на ${bell.pair} паре).`,
      });
    }
  }

  return opportunities.sort((a, b) => a.startMinutes - b.startMinutes || a.priority - b.priority);
}

// ==========================================================================
// 4. ГЛАВНОЕ СОСТОЯНИЕ И РЕАКТИВНЫЙ ИНТЕРФЕЙС
// ==========================================================================
const state = {
  currentDate: new Date(),
  simulatedMinutes: null,
  selectedDay: (new Date().getDay() === 0 || new Date().getDay() === 6) ? 1 : new Date().getDay(),
  // Если сегодня выходные (Сб или Вс), при переходе на вкладку Пн мы смотрим наступающую неделю ПОД ЧЕРТОЙ!
  parity: (new Date().getDay() === 0 || new Date().getDay() === 6)
    ? (getParityForDate(new Date()) === 'below' ? 'above' : 'below')
    : getParityForDate(new Date()),
  isParityManuallyOverridden: false,
  selectedFriends: new Set(['YU', 'VO_AND_NA', 'AN', 'AR']),
  theme: localStorage.getItem('match_theme') || 'dark',
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderDaysBar();
  renderFriendsFilter();
  updateWeekBanner();
  updateAllViews();
  setupEventListeners();

  // Живые часы и проверка наступления нового дня / смены черты
  setInterval(() => {
    state.currentDate = new Date();
    updateLiveClock();

    if (!state.isParityManuallyOverridden) {
      const cycleInfo = getWeekCycleInfo(state.currentDate);
      // Если смотрим рабочий день Пн-Сб
      const targetParity = (cycleInfo.isWeekend && state.selectedDay >= 1 && state.selectedDay <= 5)
        ? cycleInfo.nextParity
        : cycleInfo.currentParity;

      if (state.parity !== targetParity && !state.isParityManuallyOverridden) {
        state.parity = targetParity;
        updateWeekBanner();
        updateAllViews();
      }
    }

    if (state.simulatedMinutes === null) {
      updateLiveStatusSection();
      updateTimelineNowMarker();
    }
  }, 1000);
});

function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('match_theme', state.theme);
  initTheme();
}

function formatDate(d) {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function updateWeekBanner() {
  const cycle = getWeekCycleInfo(state.currentDate);
  const badge = document.getElementById('parity-badge');
  const title = document.getElementById('parity-title');
  const desc = document.getElementById('parity-desc');
  const countdown = document.getElementById('parity-countdown');

  const isBelow = state.parity === 'below';

  if (badge) {
    badge.className = `parity-badge ${state.parity}`;
    badge.textContent = isBelow ? 'ПОД ЧЕРТОЙ' : 'НАД ЧЕРТОЙ';
  }

  if (title) {
    title.textContent = isBelow
      ? 'Отображается расписание: «ПОД ЧЕРТОЙ» (чётная)'
      : 'Отображается расписание: «НАД ЧЕРТОЙ» (нечётная)';
  }

  if (desc) {
    if (state.isParityManuallyOverridden) {
      desc.textContent = '⚠️ Включен ручной режим просмотра (нажмите ↺ чтобы вернуть авто-расчет)';
    } else if (cycle.isWeekend) {
      desc.innerHTML = `Сегодня ${DAYS_OF_WEEK.find(d => d.id === state.currentDate.getDay())?.name} (${cycle.currentLabel}). <strong>С понедельника ${formatDate(cycle.nextMonday)} начинается неделя ${cycle.nextLabel}!</strong>`;
    } else {
      desc.textContent = `Текущая неделя (${formatDate(cycle.monday)} — ${formatDate(cycle.sunday)}): ${cycle.currentLabel}`;
    }
  }

  if (countdown) {
    countdown.innerHTML = `Смена черты в ночь на понедельник: <strong>через ${cycle.daysUntilNext} дн. ${cycle.hoursUntilNext} ч.</strong>`;
  }
}

function updateLiveClock() {
  const el = document.getElementById('live-clock-text');
  if (el) {
    const d = state.currentDate;
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    el.textContent = state.simulatedMinutes !== null
      ? `Симуляция: ${minutesToTime(state.simulatedMinutes)}`
      : `${timeStr}`;
  }
}

function renderDaysBar() {
  const container = document.getElementById('days-bar');
  if (!container) return;

  const todayDayId = state.currentDate.getDay();
  const displayDays = DAYS_OF_WEEK.filter(d => d.id >= 1 && d.id <= 6);

  container.innerHTML = displayDays.map(d => {
    const isActive = d.id === state.selectedDay;
    const isToday = d.id === todayDayId;
    return `
      <button class="day-btn ${isActive ? 'active' : ''} ${isToday ? 'is-today' : ''}" data-day="${d.id}">
        <span class="day-short">${d.short}</span>
        <span class="day-sub">${d.name}</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedDay = Number(btn.dataset.day);

      // Если в выходные переключаемся на учебные дни следующей недели
      if (!state.isParityManuallyOverridden) {
        const cycle = getWeekCycleInfo(state.currentDate);
        if (cycle.isWeekend) {
          state.parity = cycle.nextParity; // ПОД ЧЕРТОЙ
        } else {
          state.parity = cycle.currentParity;
        }
        updateWeekBanner();
      }

      renderDaysBar();
      updateAllViews();
    });
  });
}

function renderFriendsFilter() {
  const container = document.getElementById('friends-selector');
  if (!container) return;

  container.innerHTML = Object.values(PEOPLE).map(p => {
    const isChecked = state.selectedFriends.has(p.id);
    return `
      <button class="friend-checkbox-btn ${isChecked ? 'checked' : ''}" 
              data-id="${p.id}"
              style="--person-color: ${p.color}; --person-bg: ${p.bgLight};">
        <span>${p.avatar}</span>
        <span>${p.fullName}</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.friend-checkbox-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (state.selectedFriends.has(id)) {
        if (state.selectedFriends.size > 2) {
          state.selectedFriends.delete(id);
        } else {
          alert('Для поиска пересечений выберите минимум 2 участников!');
          return;
        }
      } else {
        state.selectedFriends.add(id);
      }
      renderFriendsFilter();
      updateMeetupOpportunities();
      updateTimelineView();
    });
  });
}

function updateLiveStatusSection() {
  const container = document.getElementById('people-status-grid');
  if (!container) return;

  const currentMinutes = state.simulatedMinutes !== null
    ? state.simulatedMinutes
    : (state.currentDate.getHours() * 60 + state.currentDate.getMinutes());

  const dayId = state.selectedDay;

  container.innerHTML = Object.values(PEOPLE).map(person => {
    const status = getPersonCurrentStatus(person.id, dayId, state.parity, currentMinutes);
    const presence = getPersonDayPresence(person.id, dayId, state.parity);

    let roomBadge = '';
    if (status.room) {
      roomBadge = `<div class="status-room-pill">📍 Ауд. ${status.room}</div>`;
    }

    return `
      <div class="person-status-card" style="--person-color: ${person.color};">
        <div class="status-card-top">
          <div class="person-badge-name">
            <span>${person.avatar}</span>
            <span>${person.name}</span>
          </div>
          <span class="status-pill ${status.badgeClass}">${status.title}</span>
        </div>
        <div class="status-main-title">${status.detail}</div>
        <div class="status-sub-detail">${presence.summary}</div>
        ${roomBadge}
      </div>
    `;
  }).join('');
}

function updateMeetupOpportunities() {
  const container = document.getElementById('meetup-cards-container');
  if (!container) return;

  const selectedIds = Array.from(state.selectedFriends);
  const opportunities = findMeetupOpportunities(selectedIds, state.selectedDay, state.parity);

  if (!opportunities.length) {
    container.innerHTML = `
      <div class="no-meetup-alert">
        <p>😔 В выбранный день у указанных участников нет общих окон или пересменок в университете.</p>
        <p style="margin-top: 6px; font-size: 0.85rem; opacity: 0.8;">Попробуйте выбрать другой день или других участников.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = opportunities.map(opp => {
    const isBigBreak = opp.type === 'big_break';
    const isShiftChange = opp.type === 'shift_change';
    const cardClass = isBigBreak ? 'card-big-break' : isShiftChange ? 'card-shift-change' : '';

    const participantTags = opp.participantIds.map(id => {
      const p = PEOPLE[id];
      return `
        <span class="participant-tag" style="background: ${p.bgLight}; color: ${p.color}; border: 1px solid ${p.border};">
          ${p.avatar} ${p.name}
        </span>
      `;
    }).join('');

    return `
      <div class="meetup-card ${cardClass}">
        <div>
          <div class="meetup-card-header">
            <h3 class="meetup-card-title">${opp.title}</h3>
            <span class="meetup-time-badge">${opp.timeStart} — ${opp.timeEnd}</span>
          </div>
          <p class="meetup-desc">${opp.description}</p>
        </div>
        <div class="meetup-participants-row">
          <div class="participant-avatars">
            ${participantTags}
          </div>
          <span class="duration-tag">⏱ ${opp.duration}</span>
        </div>
      </div>
    `;
  }).join('');
}

const TIMELINE_START = 8 * 60; // 08:00
const TIMELINE_END = 22 * 60;  // 22:00
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START; // 840 min

function updateTimelineView() {
  const hoursContainer = document.getElementById('timeline-header-hours');
  const tracksContainer = document.getElementById('timeline-tracks');
  if (!hoursContainer || !tracksContainer) return;

  let hoursHtml = `<div class="timeline-hour-mark" style="font-weight: 700;">Участник</div>`;
  for (let h = 8; h <= 21; h++) {
    hoursHtml += `<div class="timeline-hour-mark">${String(h).padStart(2, '0')}:00</div>`;
  }
  hoursContainer.innerHTML = hoursHtml;

  tracksContainer.innerHTML = Object.values(PEOPLE).map(person => {
    const lessons = getPersonLessons(person.id, state.selectedDay, state.parity);

    const blocksHtml = lessons.map(l => {
      const left = ((l.startMinutes - TIMELINE_START) / TIMELINE_SPAN) * 100;
      const width = ((l.endMinutes - l.startMinutes) / TIMELINE_SPAN) * 100;

      return `
        <div class="timeline-block" 
             style="left: ${left}%; width: ${width}%; background: ${person.color};"
             title="${l.pair} пара (${l.start}-${l.end}): ${l.subject} [${l.type}] в ауд. ${l.room}">
          <span>${l.pair} п. ${l.subject.slice(0, 18)}...</span>
          <span class="room">ауд. ${l.room}</span>
        </div>
      `;
    }).join('');

    const bigBreakLeft = ((11 * 60 + 30 - TIMELINE_START) / TIMELINE_SPAN) * 100;
    const bigBreakWidth = ((30) / TIMELINE_SPAN) * 100;

    const shiftLeft = ((17 * 60 + 10 - TIMELINE_START) / TIMELINE_SPAN) * 100;
    const shiftWidth = ((10) / TIMELINE_SPAN) * 100;

    return `
      <div class="timeline-row">
        <div class="timeline-person-meta">
          <span>${person.avatar}</span>
          <span style="color: ${person.color};">${person.name}</span>
        </div>
        <div class="timeline-track">
          <div class="timeline-highlight-zone" style="left: ${bigBreakLeft}%; width: ${bigBreakWidth}%;" title="Большой перерыв (11:30 - 12:00)"></div>
          <div class="timeline-highlight-zone" style="left: ${shiftLeft}%; width: ${shiftWidth}%; border-color: rgba(16, 185, 129, 0.5);" title="Пересменка (17:10 - 17:20)"></div>
          ${blocksHtml}
        </div>
      </div>
    `;
  }).join('');

  updateTimelineNowMarker();
}

function updateTimelineNowMarker() {
  const tracksContainer = document.getElementById('timeline-tracks');
  if (!tracksContainer) return;

  let existing = tracksContainer.querySelector('.timeline-now-marker');
  const currentMinutes = state.simulatedMinutes !== null
    ? state.simulatedMinutes
    : (state.currentDate.getHours() * 60 + state.currentDate.getMinutes());

  if (currentMinutes < TIMELINE_START || currentMinutes > TIMELINE_END) {
    if (existing) existing.remove();
    return;
  }

  const leftPercent = ((currentMinutes - TIMELINE_START) / TIMELINE_SPAN) * 100;

  if (!existing) {
    existing = document.createElement('div');
    existing.className = 'timeline-now-marker';
    tracksContainer.appendChild(existing);
  }
  existing.style.left = `calc(140px + (100% - 140px) * ${leftPercent / 100})`;
}

function updateDetailedTimetables() {
  const container = document.getElementById('tables-grid');
  if (!container) return;

  container.innerHTML = Object.values(PEOPLE).map(person => {
    const presence = getPersonDayPresence(person.id, state.selectedDay, state.parity);

    let contentHtml = '';
    if (!presence.hasLessons) {
      contentHtml = `<div class="empty-schedule-state">🌴 Нет занятий в этот день (выходной)</div>`;
    } else {
      contentHtml = `
        <div class="lesson-list">
          ${presence.lessons.map(l => `
            <div class="lesson-item">
              <span class="lesson-pair-num">${l.pair}</span>
              <div class="lesson-info">
                <div class="lesson-title">
                  <span class="lesson-type-badge">${l.type}</span>
                  ${l.subject}
                </div>
                <div class="lesson-meta">👨‍🏫 ${l.teacher}</div>
              </div>
              <div style="text-align: right;">
                <div class="lesson-time">${l.start} - ${l.end}</div>
                <div class="lesson-room">${l.room}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="person-schedule-table-card">
        <div class="person-table-header">
          <h3>
            <span>${person.avatar}</span>
            <span style="color: ${person.color};">${person.fullName}</span>
          </h3>
          <span class="presence-span-badge">${presence.hasLessons ? `${presence.presenceStart} - ${presence.presenceEnd}` : 'Выходной'}</span>
        </div>
        ${contentHtml}
      </div>
    `;
  }).join('');
}

function updateAllViews() {
  updateLiveClock();
  updateLiveStatusSection();
  updateMeetupOpportunities();
  updateTimelineView();
  updateDetailedTimetables();
}

function setupEventListeners() {
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

  document.getElementById('parity-toggle-btn')?.addEventListener('click', () => {
    state.parity = state.parity === 'below' ? 'above' : 'below';
    state.isParityManuallyOverridden = true;
    updateWeekBanner();
    updateAllViews();
  });

  document.getElementById('parity-reset-btn')?.addEventListener('click', () => {
    state.isParityManuallyOverridden = false;
    const cycle = getWeekCycleInfo(state.currentDate);
    state.parity = (cycle.isWeekend && state.selectedDay >= 1 && state.selectedDay <= 5)
      ? cycle.nextParity
      : cycle.currentParity;
    updateWeekBanner();
    updateAllViews();
  });

  document.getElementById('btn-filter-all')?.addEventListener('click', () => {
    state.selectedFriends = new Set(['YU', 'VO_AND_NA', 'AN', 'AR']);
    renderFriendsFilter();
    updateMeetupOpportunities();
    updateTimelineView();
  });

  document.getElementById('btn-filter-vona')?.addEventListener('click', () => {
    state.selectedFriends = new Set(['YU', 'VO_AND_NA']);
    renderFriendsFilter();
    updateMeetupOpportunities();
    updateTimelineView();
  });

  document.getElementById('btn-filter-daytime')?.addEventListener('click', () => {
    state.selectedFriends = new Set(['YU', 'AN', 'AR']);
    renderFriendsFilter();
    updateMeetupOpportunities();
    updateTimelineView();
  });

  document.querySelectorAll('.sim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sim-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const timeVal = btn.dataset.time;
      if (timeVal === 'live') {
        state.simulatedMinutes = null;
      } else {
        const [h, m] = timeVal.split(':').map(Number);
        state.simulatedMinutes = h * 60 + m;
      }
      updateLiveClock();
      updateLiveStatusSection();
      updateTimelineNowMarker();
    });
  });
}
