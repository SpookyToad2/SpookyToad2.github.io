// schedule-data.js
// Расписание занятий РГУПС: YU, VO & NA, AN, AR

export const BELLS = [
  { pair: 1, start: '08:15', end: '09:45', startMinutes: 8 * 60 + 15, endMinutes: 9 * 60 + 45 },
  { pair: 2, start: '10:00', end: '11:30', startMinutes: 10 * 60, endMinutes: 11 * 60 + 30 },
  // Большой перерыв: 11:30 - 12:00 (30 мин)
  { pair: 3, start: '12:00', end: '13:30', startMinutes: 12 * 60, endMinutes: 13 * 60 + 30 },
  // Перерыв: 13:30 - 13:55 (25 мин)
  { pair: 4, start: '13:55', end: '15:25', startMinutes: 13 * 60 + 55, endMinutes: 15 * 60 + 25 },
  // Перерыв: 15:25 - 15:40 (15 мин)
  { pair: 5, start: '15:40', end: '17:10', startMinutes: 15 * 60 + 40, endMinutes: 17 * 60 + 10 },
  // Пересменка: 17:10 - 17:20 (10 мин)
  { pair: 6, start: '17:20', end: '18:50', startMinutes: 17 * 60 + 20, endMinutes: 18 * 60 + 50 },
  // Перерыв: 18:50 - 18:55 (5 мин)
  { pair: 7, start: '18:55', end: '20:25', startMinutes: 18 * 60 + 55, endMinutes: 20 * 60 + 25 },
  // Перерыв: 20:25 - 20:30 (5 мин)
  { pair: 8, start: '20:30', end: '22:00', startMinutes: 20 * 60 + 30, endMinutes: 22 * 60 },
];

export const DAYS_OF_WEEK = [
  { id: 1, name: 'Понедельник', short: 'Пн' },
  { id: 2, name: 'Вторник', short: 'Вт' },
  { id: 3, name: 'Среда', short: 'Ср' },
  { id: 4, name: 'Четверг', short: 'Чт' },
  { id: 5, name: 'Пятница', short: 'Пт' },
  { id: 6, name: 'Суббота', short: 'Сб' },
  { id: 0, name: 'Воскресенье', short: 'Вс' },
];

export const PEOPLE = {
  YU: {
    id: 'YU',
    name: 'YU',
    fullName: 'Я (YU)',
    role: 'Дневное отделение (1 поток)',
    color: '#3b82f6', // Blue
    bgLight: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.4)',
    avatar: '👨‍🎓',
  },
  VO_AND_NA: {
    id: 'VO_AND_NA',
    name: 'VO & NA',
    fullName: 'VO & NA',
    role: 'Вечернее отделение (ИТ)',
    color: '#10b981', // Emerald green
    bgLight: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
    avatar: '👥',
  },
  AN: {
    id: 'AN',
    name: 'AN',
    fullName: 'Друг 3 (AN)',
    role: 'Дневное отделение (Машины)',
    color: '#f59e0b', // Amber/orange
    bgLight: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    avatar: '👷‍♂️',
  },
  AR: {
    id: 'AR',
    name: 'AR',
    fullName: 'Друг 4 (AR)',
    role: 'Дневное отделение (Локомотивы)',
    color: '#8b5cf6', // Violet
    bgLight: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.4)',
    avatar: '🚆',
  },
};

// parity: 'both' (обе недели), 'above' (над чертой / нечетная), 'below' (под чертой / четная)
export const SCHEDULE_DB = {
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
    6: [], // Сб - Нет пар
    0: [], // Вс - Выходной
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
    0: [], // Вс - Выходной
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
    6: [], // Сб - Нет пар
    0: [], // Вс - Выходной
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
    3: [], // Ср - Нет пар
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
    5: [], // Пт - Нет пар
    6: [], // Сб - Нет пар
    0: [], // Вс - Выходной
  },
};
