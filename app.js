const STORAGE_KEY = "inventario_app_v1";

const state = {
  meta: {
    empresa: "",
    almacen: "",
    responsable: "",
    fecha: "",
  },
  items: [],
  editingId: null,
  search: "",
  statusFilter: "todos",
};

const refs = {
  empresa: document.getElementById("empresa"),
  almacen: document.getElementById("almacen"),
  responsable: document.getElementById("responsable"),
  fecha: document.getElementById("fecha"),
  form: document.getElementById("item-form"),
  codigo: document.getElementById("codigo"),
  descripcion: document.getElementById("descripcion"),
  categoria: document.getElementById("categoria"),
  ubicacion: document.getElementById("ubicacion"),
  esperado: document.getElementById("esperado"),
  contado: document.getElementById("contado"),
  observaciones: document.getElementById("observaciones"),
  submitBtn: document.getElementById("submit-btn"),
  cancelEditBtn: document.getElementById("cancel-edit-btn"),
  buscar: document.getElementById("buscar"),
  filtroEstado: document.getElementById("filtro-estado"),
  exportarCsvBtn: document.getElementById("exportar-csv"),
  exportarJsonBtn: document.getElementById("exportar-json"),
  importarJsonBtn: document.getElementById("importar-json-btn"),
  importarJson: document.getElementById("importar-json"),
  limpiarDatosBtn: document.getElementById("limpiar-datos"),
  tablaProductos: document.getElementById("tabla-productos"),
  totalProductos: document.getElementById("total-productos"),
  totalEsperado: document.getElementById("total-esperado"),
  totalContado: document.getElementById("total-contado"),
  totalDiferencia: document.getElementById("total-diferencia"),
};

function toInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getDiff(item) {
  return item.contado - item.esperado;
}

function getStatus(diff) {
  if (diff === 0) return "igual";
  if (diff < 0) return "faltante";
  return "sobrante";
}

function getStatusLabel(status) {
  if (status === "igual") return "Cuadra";
  if (status === "faltante") return "Faltante";
  return "Sobrante";
}

function getStatusClass(status) {
  if (status === "igual") return "badge badge--ok";
  if (status === "faltante") return "badge badge--error";
  return "badge badge--warn";
}

function clearForm() {
  refs.form.reset();
  refs.esperado.value = "0";
  state.editingId = null;
  refs.submitBtn.textContent = "Agregar producto";
  refs.cancelEditBtn.hidden = true;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      refs.fecha.valueAsDate = new Date();
      return;
    }
    const parsed = JSON.parse(raw);
    state.meta = {
      empresa: parsed?.meta?.empresa || "",
      almacen: parsed?.meta?.almacen || "",
      responsable: parsed?.meta?.responsable || "",
      fecha: parsed?.meta?.fecha || "",
    };
    state.items = Array.isArray(parsed?.items) ? parsed.items : [];
    refs.empresa.value = state.meta.empresa;
    refs.almacen.value = state.meta.almacen;
    refs.responsable.value = state.meta.responsable;
    refs.fecha.value = state.meta.fecha;
    if (!refs.fecha.value) {
      refs.fecha.valueAsDate = new Date();
    }
  } catch (error) {
    console.error("No se pudo cargar la información guardada.", error);
    refs.fecha.valueAsDate = new Date();
  }
}

function persist() {
  state.meta = {
    empresa: refs.empresa.value.trim(),
    almacen: refs.almacen.value.trim(),
    responsable: refs.responsable.value.trim(),
    fecha: refs.fecha.value,
  };
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      meta: state.meta,
      items: state.items,
    })
  );
}

function filteredItems() {
  return state.items.filter((item) => {
    const diff = getDiff(item);
    const status = getStatus(diff);
    const text = `${item.codigo} ${item.descripcion} ${item.categoria} ${item.ubicacion}`.toLowerCase();
    const matchesSearch = text.includes(state.search);
    const matchesStatus =
      state.statusFilter === "todos" ? true : status === state.statusFilter;
    return matchesSearch && matchesStatus;
  });
}

function renderSummary() {
  const totalProductos = state.items.length;
  const totalEsperado = state.items.reduce((acc, item) => acc + item.esperado, 0);
  const totalContado = state.items.reduce((acc, item) => acc + item.contado, 0);
  const totalDiferencia = totalContado - totalEsperado;

  refs.totalProductos.textContent = String(totalProductos);
  refs.totalEsperado.textContent = String(totalEsperado);
  refs.totalContado.textContent = String(totalContado);
  refs.totalDiferencia.textContent = String(totalDiferencia);
}

function renderTable() {
  const visibleItems = filteredItems();
  if (visibleItems.length === 0) {
    refs.tablaProductos.innerHTML =
      '<tr><td colspan="11" class="empty-row">No hay resultados para los filtros aplicados.</td></tr>';
    return;
  }

  refs.tablaProductos.innerHTML = visibleItems
    .map((item, index) => {
      const diff = getDiff(item);
      const status = getStatus(diff);
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.codigo)}</td>
        <td>${escapeHtml(item.descripcion)}</td>
        <td>${escapeHtml(item.categoria || "-")}</td>
        <td>${escapeHtml(item.ubicacion || "-")}</td>
        <td>${item.esperado}</td>
        <td>${item.contado}</td>
        <td>${diff}</td>
        <td><span class="${getStatusClass(status)}">${getStatusLabel(status)}</span></td>
        <td>${escapeHtml(item.observaciones || "-")}</td>
        <td>
          <div class="row-actions">
            <button data-action="edit" data-id="${item.id}" type="button">Editar</button>
            <button data-action="delete" data-id="${item.id}" type="button" class="delete-btn">Eliminar</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function startEditing(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  state.editingId = id;
  refs.codigo.value = item.codigo;
  refs.descripcion.value = item.descripcion;
  refs.categoria.value = item.categoria;
  refs.ubicacion.value = item.ubicacion;
  refs.esperado.value = String(item.esperado);
  refs.contado.value = String(item.contado);
  refs.observaciones.value = item.observaciones;
  refs.submitBtn.textContent = "Guardar cambios";
  refs.cancelEditBtn.hidden = false;
  refs.codigo.focus();
}

function upsertItem(formData) {
  const item = {
    id: state.editingId || crypto.randomUUID(),
    codigo: formData.get("codigo").toString().trim(),
    descripcion: formData.get("descripcion").toString().trim(),
    categoria: formData.get("categoria").toString().trim(),
    ubicacion: formData.get("ubicacion").toString().trim(),
    esperado: toInteger(formData.get("esperado")),
    contado: toInteger(formData.get("contado")),
    observaciones: formData.get("observaciones").toString().trim(),
    updatedAt: new Date().toISOString(),
  };

  if (!item.codigo || !item.descripcion) {
    alert("Código y descripción son obligatorios.");
    return;
  }

  if (state.editingId) {
    state.items = state.items.map((entry) => (entry.id === item.id ? item : entry));
  } else {
    state.items.unshift(item);
  }
  clearForm();
  persist();
  renderSummary();
  renderTable();
}

function deleteItem(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  const confirmed = confirm(`¿Eliminar ${item.codigo} - ${item.descripcion}?`);
  if (!confirmed) return;
  state.items = state.items.filter((entry) => entry.id !== id);
  if (state.editingId === id) {
    clearForm();
  }
  persist();
  renderSummary();
  renderTable();
}

function exportCsv() {
  if (state.items.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  const headers = [
    "codigo",
    "descripcion",
    "categoria",
    "ubicacion",
    "esperado",
    "contado",
    "diferencia",
    "estado",
    "observaciones",
    "actualizado",
  ];

  const rows = state.items.map((item) => {
    const diff = getDiff(item);
    const status = getStatusLabel(getStatus(diff));
    return [
      item.codigo,
      item.descripcion,
      item.categoria,
      item.ubicacion,
      item.esperado,
      item.contado,
      diff,
      status,
      item.observaciones,
      item.updatedAt,
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");

  downloadFile(csvContent, "inventario.csv", "text/csv;charset=utf-8;");
}

function exportJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    meta: {
      empresa: refs.empresa.value.trim(),
      almacen: refs.almacen.value.trim(),
      responsable: refs.responsable.value.trim(),
      fecha: refs.fecha.value,
    },
    items: state.items,
  };
  downloadFile(JSON.stringify(payload, null, 2), "inventario.json", "application/json");
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!Array.isArray(parsed.items)) {
        alert("El archivo no tiene el formato esperado.");
        return;
      }
      state.meta = {
        empresa: parsed?.meta?.empresa || "",
        almacen: parsed?.meta?.almacen || "",
        responsable: parsed?.meta?.responsable || "",
        fecha: parsed?.meta?.fecha || "",
      };
      state.items = parsed.items.map((item) => ({
        id: item.id || crypto.randomUUID(),
        codigo: String(item.codigo || "").trim(),
        descripcion: String(item.descripcion || "").trim(),
        categoria: String(item.categoria || "").trim(),
        ubicacion: String(item.ubicacion || "").trim(),
        esperado: toInteger(item.esperado),
        contado: toInteger(item.contado),
        observaciones: String(item.observaciones || "").trim(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));
      refs.empresa.value = state.meta.empresa;
      refs.almacen.value = state.meta.almacen;
      refs.responsable.value = state.meta.responsable;
      refs.fecha.value = state.meta.fecha;
      persist();
      renderSummary();
      renderTable();
      clearForm();
      alert("Datos importados correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo leer el archivo JSON.");
    }
  };
  reader.readAsText(file);
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setListeners() {
  refs.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(refs.form);
    upsertItem(formData);
  });

  refs.cancelEditBtn.addEventListener("click", () => {
    clearForm();
  });

  refs.tablaProductos.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (!id) return;
    if (action === "edit") startEditing(id);
    if (action === "delete") deleteItem(id);
  });

  refs.buscar.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderTable();
  });

  refs.filtroEstado.addEventListener("change", (event) => {
    state.statusFilter = event.target.value;
    renderTable();
  });

  [refs.empresa, refs.almacen, refs.responsable, refs.fecha].forEach((field) => {
    field.addEventListener("change", persist);
    field.addEventListener("input", persist);
  });

  refs.exportarCsvBtn.addEventListener("click", exportCsv);
  refs.exportarJsonBtn.addEventListener("click", exportJson);
  refs.importarJsonBtn.addEventListener("click", () => refs.importarJson.click());
  refs.importarJson.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    importJson(file);
    refs.importarJson.value = "";
  });

  refs.limpiarDatosBtn.addEventListener("click", () => {
    if (!confirm("¿Seguro que deseas borrar todos los datos del inventario?")) return;
    state.items = [];
    state.meta = {
      empresa: "",
      almacen: "",
      responsable: "",
      fecha: refs.fecha.value || "",
    };
    refs.empresa.value = "";
    refs.almacen.value = "";
    refs.responsable.value = "";
    clearForm();
    persist();
    renderSummary();
    renderTable();
  });
}

function init() {
  loadFromStorage();
  renderSummary();
  renderTable();
  setListeners();
}

init();
