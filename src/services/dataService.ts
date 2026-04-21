export async function loadSystemData() {
  return {
    estudiantes: [],
    maestros: [],
    notas: [],
    competenciasMinedu: ['Lee textos diversos', 'Produce textos escritos', 'Interactúa oralmente']
  };
}

export function getEstudiantes() {
  return [];
}

export function getMaestros() {
  return [];
}

export function getNotas() {
  return [];
}

export function guardarNota(nota: any) {
  return nota;
}
