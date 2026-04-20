// Cargar datos del JSON al iniciar
export async function loadSystemData() {
  try {
    // Intentar cargar desde el archivo JSON
    const response = await fetch('/sistemita_datos_final.json');
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('sistemita_datos', JSON.stringify(data));
      console.log('✅ Datos cargados:', {
        estudiantes: data.estudiantes?.length,
        maestros: data.maestros?.length,
        notas: data.notas?.length
      });
      return data;
    }
  } catch (e) {
    console.warn('No se pudo cargar JSON:', e);
  }

  // Si no existe JSON, usar datos de localStorage
  const stored = localStorage.getItem('sistemita_datos');
  if (stored) {
    return JSON.parse(stored);
  }

  // Datos por defecto vacíos
  return {
    estudiantes: [],
    maestros: [],
    notas: [],
    competenciasMinedu: ['Lee textos diversos', 'Produce textos escritos', 'Interactúa oralmente']
  };
}

export function getEstudiantes() {
  const data = localStorage.getItem('sistemita_datos');
  if (data) {
    return JSON.parse(data).estudiantes || [];
  }
  return [];
}

export function getMaestros() {
  const data = localStorage.getItem('sistemita_datos');
  if (data) {
    return JSON.parse(data).maestros || [];
  }
  return [];
}

export function getNotas() {
  const data = localStorage.getItem('sistemita_datos');
  if (data) {
    return JSON.parse(data).notas || [];
  }
  return [];
}

export function guardarNota(nota: any) {
  const data = JSON.parse(localStorage.getItem('sistemita_datos') || '{}');
  if (!data.notas) data.notas = [];
  data.notas.push({
    ...nota,
    id: Date.now().toString(),
    fecha: new Date().toISOString()
  });
  localStorage.setItem('sistemita_datos', JSON.stringify(data));
  return nota;
}
