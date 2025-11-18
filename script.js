const textarea = document.querySelector('#csvInput');
const form = document.querySelector('#csvForm');
const loadSampleBtn = document.querySelector('#loadSample');
const output = document.querySelector('#calendarOutput');
const collapsePeopleCheckbox = document.querySelector('#collapsePeople');

const state = {
  entries: []
};

const sampleData = `Fecha,Colaborador,Turno\n2025-01-02,María Díaz,Turno Día\n2025-01-03,Carlos Vega,Turno Noche\n2025-01-03,María Díaz,Turno Tarde\n2025-01-04,Ana Silva,Turno Día\n2025-01-07,Pedro López,Turno Día\n2025-01-07,Carlos Vega,Turno Noche\n2025-02-01,María Díaz,Turno Día\n2025-02-02,Ana Silva,Turno Tarde\n2025-02-03,Pedro López,Turno Noche`;

document.addEventListener('DOMContentLoaded', () => {
  textarea.value = sampleData;
  generateFromRaw(sampleData);
});

loadSampleBtn?.addEventListener('click', () => {
  textarea.value = sampleData;
  generateFromRaw(sampleData);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const raw = textarea.value.trim();
  if (!raw) {
    showErrors(['Pega contenido válido para comenzar.']);
    return;
  }
  generateFromRaw(raw);
});

collapsePeopleCheckbox.addEventListener('change', () => {
  if (state.entries.length) {
    renderCalendars(state.entries);
  }
});

function generateFromRaw(raw) {
  const { entries, errors } = buildEntries(raw);
  if (errors.length) {
    showErrors(errors);
    return;
  }

  state.entries = entries;
  renderCalendars(entries);
}

function buildEntries(raw) {
  const errors = [];
  const parsed = parseCsv(raw);

  if (parsed.errors.length) {
    return { entries: [], errors: parsed.errors };
  }

  const allowedHeaders = {
    date: ['fecha', 'date', 'dia', 'día'],
    person: ['colaborador', 'empleado', 'nombre', 'operario', 'trabajador'],
    shift: ['turno', 'shift', 'jornada', 'horario']
  };

  let headerMap;
  try {
    headerMap = mapHeaders(parsed.headers, allowedHeaders);
  } catch (error) {
    return { entries: [], errors: [error.message] };
  }

  const entries = [];

  parsed.data.forEach((row, index) => {
    const rawDate = row[headerMap.date];
    const rawPerson = row[headerMap.person];
    const rawShift = row[headerMap.shift];
    const parsedDate = parseDate(rawDate);

    if (!parsedDate || Number.isNaN(parsedDate.valueOf())) {
      errors.push(`Fila ${index + 2}: fecha inválida (${rawDate || 'vacía'})`);
      return;
    }

    entries.push({
      date: parsedDate,
      person: rawPerson || 'Sin asignar',
      shift: rawShift || 'Turno'
    });
  });

  if (!entries.length) {
    errors.push('No se detectaron registros válidos. Revisa las columnas o el formato.');
  }

  return { entries, errors };
}

function parseCsv(raw) {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length);
  if (!lines.length) {
    return { headers: [], data: [], errors: ['No hay datos.'] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = smartSplit(lines[0], delimiter).map(normalizeHeader);

  if (!headers.length) {
    return { headers: [], data: [], errors: ['Encabezados vacíos.'] };
  }

  const data = lines.slice(1).map((line) => {
    const cells = smartSplit(line, delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return row;
  });

  return { headers, data, errors: [] };
}

function detectDelimiter(line) {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

function smartSplit(line, delimiter) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(header) {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function mapHeaders(headers, allowed) {
  const map = {};
  Object.entries(allowed).forEach(([key, variants]) => {
    const found = headers.find((header) => variants.includes(header));
    if (!found) {
      throw new Error(`No se encontró una columna para "${key}".`);
    }
    map[key] = found;
  });
  return map;
}

function parseDate(raw) {
  if (!raw) return null;
  const cleaned = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const [y, m, d] = cleaned.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
    const [d, m, y] = cleaned.split('/').map(Number);
    return new Date(y, m - 1, d);
  }

  return new Date(cleaned);
}

function renderCalendars(entries) {
  if (!entries.length) {
    output.innerHTML = '<p class="helper">Sin datos para mostrar.</p>';
    return;
  }

  const grouped = groupByMonth(entries);
  output.innerHTML = '';

  grouped.forEach((records, key) => {
    const [year, month] = key.split('-').map(Number);
    const node = buildMonthNode(year, month, records);
    output.appendChild(node);
  });
}

function groupByMonth(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    const key = `${entry.date.getFullYear()}-${entry.date.getMonth() + 1}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(entry);
  });

  return new Map(
    [...map.entries()].sort(([a], [b]) => {
      const [aYear, aMonth] = a.split('-').map(Number);
      const [bYear, bMonth] = b.split('-').map(Number);
      return aYear - bYear || aMonth - bMonth;
    })
  );
}

function buildMonthNode(year, month, entries) {
  const template = document.querySelector('#monthTemplate');
  const node = template.content.firstElementChild.cloneNode(true);
  const title = node.querySelector('h3');
  const summary = node.querySelector('.month-summary');
  const tbody = node.querySelector('tbody');

  title.textContent = new Date(year, month - 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  summary.textContent = `${entries.length} asignación${entries.length !== 1 ? 'es' : ''}`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const normalizedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Lunes=0

  let dayNumber = 1;

  while (dayNumber <= daysInMonth) {
    const row = document.createElement('tr');
    for (let column = 0; column < 7; column += 1) {
      const cell = document.createElement('td');

      if ((tbody.children.length === 0 && column < normalizedFirstDay) || dayNumber > daysInMonth) {
        cell.classList.add('empty');
      } else {
        renderDayCell(cell, dayNumber, entries);
        dayNumber += 1;
      }

      row.appendChild(cell);
    }
    tbody.appendChild(row);
  }

  return node;
}

function renderDayCell(cell, dayNumber, entries) {
  const dayEntries = entries.filter((entry) => entry.date.getDate() === dayNumber);
  const label = document.createElement('div');
  label.className = 'day-number';
  label.textContent = dayNumber;
  cell.appendChild(label);

  if (!dayEntries.length) {
    return;
  }

  const list = document.createElement('ul');
  list.className = 'shift-list';

  dayEntries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = `shift-pill ${getShiftClass(entry.shift)}`;
    const showPerson = !collapsePeopleCheckbox.checked;

    if (showPerson) {
      const person = document.createElement('span');
      person.textContent = entry.person;
      item.appendChild(person);
      item.appendChild(document.createTextNode(' – '));
    }

    item.appendChild(document.createTextNode(entry.shift));
    list.appendChild(item);
  });

  cell.appendChild(list);
}

function getShiftClass(shift) {
  const value = shift.toLowerCase();
  if (value.includes('noche')) return 'tag-night';
  if (value.includes('tarde')) return 'tag-afternoon';
  if (value.includes('dia') || value.includes('día') || value.includes('mañana')) return 'tag-day';
  return 'tag-generic';
}

function showErrors(messages) {
  const unique = [...new Set(messages)];
  output.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'helper';
  unique.forEach((msg) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = msg;
    wrapper.appendChild(paragraph);
  });
  output.appendChild(wrapper);
}
