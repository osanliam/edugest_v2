/**
 * REGISTRO DE CALIFICACIONES v2
 * Gestión de competencias e instrumentos con lógica MINEDU
 */

// Estado global
const estado = {
  estudiante: '',
  periodo: '',
  grado: '',
  competencias: {
    comp1: {
      nombre: 'Lee textos diversos',
      criterios: ['Criterio 1', 'Criterio 2', 'Criterio 3', 'Criterio 4', 'Criterio 5'],
      respuestas: [null, null, null, null, null],
      instrumentos: [],
      calificativo: null,
      porcentaje: 0
    },
    comp2: {
      nombre: 'Produce textos escritos',
      criterios: ['Criterio 1', 'Criterio 2', 'Criterio 3', 'Criterio 4', 'Criterio 5'],
      respuestas: [null, null, null, null, null],
      instrumentos: [],
      calificativo: null,
      porcentaje: 0
    },
    comp3: {
      nombre: 'Interactúa oralmente',
      criterios: ['Criterio 1', 'Criterio 2', 'Criterio 3', 'Criterio 4', 'Criterio 5'],
      respuestas: [null, null, null, null, null],
      instrumentos: [],
      calificativo: null,
      porcentaje: 0
    }
  },
  instrumentoActual: {
    competencia: null,
    tipo: null,
    respuestas: null
  }
};

// Inicializar
window.addEventListener('load', () => {
  inicializarCriterios();
  cargarFecha();
});

function cargarFecha() {
  const fecha = new Date().toISOString().split('T')[0];
  document.getElementById('periodo').value = '';
  document.getElementById('grado').value = '';
}

function inicializarCriterios() {
  for (const comp in estado.competencias) {
    generarCriterios(comp);
    actualizarVistaInstrumentos(comp);
  }
}

function generarCriterios(compId) {
  const comp = estado.competencias[compId];
  const container = document.getElementById(`${compId}-criterios`);
  container.innerHTML = '';

  comp.criterios.forEach((criterio, index) => {
    const div = document.createElement('div');
    div.className = 'criterio';
    div.innerHTML = `
      <label>${criterio}</label>
      <div class="criterio-opciones">
        <label>
          <input type="radio" name="${compId}-criterio${index}" value="C"
                 onchange="actualizarCriterio('${compId}', ${index}, 'C')">
          C (Inicio)
        </label>
        <label>
          <input type="radio" name="${compId}-criterio${index}" value="B"
                 onchange="actualizarCriterio('${compId}', ${index}, 'B')">
          B (Proceso)
        </label>
        <label>
          <input type="radio" name="${compId}-criterio${index}" value="A"
                 onchange="actualizarCriterio('${compId}', ${index}, 'A')">
          A (Esperado)
        </label>
        <label>
          <input type="radio" name="${compId}-criterio${index}" value="AD"
                 onchange="actualizarCriterio('${compId}', ${index}, 'AD')">
          AD (Destacado)
        </label>
      </div>
    `;
    container.appendChild(div);
  });
}

function actualizarCriterio(compId, index, valor) {
  estado.competencias[compId].respuestas[index] = valor;
  calcularCalificativoCompetencia(compId);
}

function calcularCalificativoCompetencia(compId) {
  const comp = estado.competencias[compId];
  const respuestas = comp.respuestas.filter(r => r !== null);

  if (respuestas.length === 0) {
    comp.calificativo = null;
    comp.porcentaje = 0;
  } else {
    const resultado = CalculosMINEDU.calcularCalificativo(respuestas);
    comp.calificativo = resultado.calificativo;
    comp.porcentaje = resultado.porcentaje;
  }

  actualizarVista(compId);
}

function actualizarVista(compId) {
  const comp = estado.competencias[compId];
  document.getElementById(`${compId}-calif`).textContent = comp.calificativo || '--';
  document.getElementById(`${compId}-pct`).textContent = comp.porcentaje + '%';
}

function abrirInstrumento(compId) {
  const selector = document.getElementById(`${compId}-selector`);
  const tipoInstrumento = selector.value;

  if (!tipoInstrumento) {
    alert('Selecciona un instrumento');
    return;
  }

  estado.instrumentoActual.competencia = compId;
  estado.instrumentoActual.tipo = tipoInstrumento;
  estado.instrumentoActual.respuestas = [null, null, null, null, null];

  // Cargar contenido del instrumento
  cargarInstrumentoEnModal(tipoInstrumento);

  // Abrir modal
  document.getElementById('instrumentoModal').classList.add('active');
}

function cargarInstrumentoEnModal(tipo) {
  const modalBody = document.getElementById('modalBody');
  const modalTitulo = document.getElementById('modalTitulo');

  modalTitulo.textContent = tipo;

  // Crear contenido del instrumento
  let contenido = `
    <div style="padding: 20px;">
      <h4>5 Criterios de Evaluación</h4>
      <div style="display: grid; gap: 15px; margin-top: 15px;">
  `;

  for (let i = 0; i < 5; i++) {
    contenido += `
      <div style="background: #f8f9fa; padding: 12px; border-radius: 6px;">
        <label style="display: block; font-weight: 600; margin-bottom: 8px;">
          Criterio ${i + 1}
        </label>
        <div style="display: flex; gap: 10px;">
          <label style="display: flex; align-items: center;">
            <input type="radio" name="inst-criterio${i}" value="C"
                   onchange="actualizarInstrumentoCriterio(${i}, 'C')">
            <span style="margin-left: 6px;">C</span>
          </label>
          <label style="display: flex; align-items: center;">
            <input type="radio" name="inst-criterio${i}" value="B"
                   onchange="actualizarInstrumentoCriterio(${i}, 'B')">
            <span style="margin-left: 6px;">B</span>
          </label>
          <label style="display: flex; align-items: center;">
            <input type="radio" name="inst-criterio${i}" value="A"
                   onchange="actualizarInstrumentoCriterio(${i}, 'A')">
            <span style="margin-left: 6px;">A</span>
          </label>
          <label style="display: flex; align-items: center;">
            <input type="radio" name="inst-criterio${i}" value="AD"
                   onchange="actualizarInstrumentoCriterio(${i}, 'AD')">
            <span style="margin-left: 6px;">AD</span>
          </label>
        </div>
      </div>
    `;
  }

  contenido += `
      </div>
    </div>
  `;

  modalBody.innerHTML = contenido;
}

function actualizarInstrumentoCriterio(index, valor) {
  estado.instrumentoActual.respuestas[index] = valor;
}

function guardarInstrumento() {
  const compId = estado.instrumentoActual.competencia;
  const tipo = estado.instrumentoActual.tipo;
  const respuestas = estado.instrumentoActual.respuestas;

  if (respuestas.filter(r => r !== null).length === 0) {
    alert('Completa al menos un criterio');
    return;
  }

  // Calcular resultado del instrumento
  const resultado = CalculosMINEDU.calcularCalificativo(respuestas);

  // Agregar instrumento a la competencia
  const instrumento = {
    id: Date.now(),
    tipo: tipo,
    respuestas: respuestas,
    resultado: resultado
  };

  estado.competencias[compId].instrumentos.push(instrumento);

  // Recalcular competencia con todos los instrumentos
  calcularCalificativoConInstrumentos(compId);

  // Cerrar modal
  cerrarModal();

  // Actualizar vista
  actualizarVistaInstrumentos(compId);
}

function calcularCalificativoConInstrumentos(compId) {
  const comp = estado.competencias[compId];
  const resultado = CalculosMINEDU.calcularNotaCompetencia(comp.instrumentos);

  comp.calificativo = resultado.calificativo;
  comp.porcentaje = resultado.porcentaje;

  actualizarVista(compId);
}

function actualizarVistaInstrumentos(compId) {
  const comp = estado.competencias[compId];
  const container = document.getElementById(`${compId}-instrumentos`);
  container.innerHTML = '';

  if (comp.instrumentos.length === 0) {
    container.innerHTML = '<p style="color: #999; font-size: 13px;">Sin instrumentos aplicados aún</p>';
    return;
  }

  comp.instrumentos.forEach((inst, idx) => {
    const div = document.createElement('div');
    div.className = 'instrumento-item';
    div.innerHTML = `
      <div class="tipo">${inst.tipo}</div>
      <div class="nota">${inst.resultado.calificativo} (${inst.resultado.porcentaje}%)</div>
      <div class="acciones">
        <button class="btn-small btn-editar" onclick="editarInstrumento('${compId}', ${idx})">Editar</button>
        <button class="btn-small btn-eliminar" onclick="eliminarInstrumento('${compId}', ${idx})">Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function editarInstrumento(compId, idx) {
  alert('Función de edición a implementar');
}

function eliminarInstrumento(compId, idx) {
  if (confirm('¿Eliminar este instrumento?')) {
    estado.competencias[compId].instrumentos.splice(idx, 1);
    calcularCalificativoConInstrumentos(compId);
    actualizarVistaInstrumentos(compId);
  }
}

function cerrarModal() {
  document.getElementById('instrumentoModal').classList.remove('active');
  estado.instrumentoActual = {
    competencia: null,
    tipo: null,
    respuestas: null
  };
}

function guardar() {
  estado.estudiante = document.getElementById('estudiante').value;
  estado.periodo = document.getElementById('periodo').value;
  estado.grado = document.getElementById('grado').value;

  const json = JSON.stringify(estado, null, 2);
  descargarJSON('registro_calificaciones.json', json);

  alert('✓ Registro guardado exitosamente');
}

function limpiar() {
  if (confirm('¿Limpiar todo el registro?')) {
    document.getElementById('estudiante').value = '';
    document.getElementById('periodo').value = '';
    document.getElementById('grado').value = '';

    for (const comp in estado.competencias) {
      estado.competencias[comp].respuestas = [null, null, null, null, null];
      estado.competencias[comp].instrumentos = [];
      estado.competencias[comp].calificativo = null;
      estado.competencias[comp].porcentaje = 0;
      generarCriterios(comp);
      actualizarVista(comp);
      actualizarVistaInstrumentos(comp);
    }
  }
}

function cerrar() {
  if (confirm('¿Cerrar sin guardar?')) {
    window.close();
  }
}

function descargarJSON(nombre, contenido) {
  const blob = new Blob([contenido], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
