/**
 * LÓGICA DE CÁLCULOS MINEDU
 * Conversión de criterios a calificativos
 * C = Inicio, B = En Proceso, A = Logro Esperado, AD = Logro Destacado
 */

class CalculosMINEDU {
  /**
   * Calcula el calificativo basado en respuestas de criterios
   * @param {Array} respuestas - Array de respuestas ['C', 'B', 'A', 'AD', 'A']
   * @returns {Object} {calificativo: 'A', porcentaje: 100, detalles: {...}}
   */
  static calcularCalificativo(respuestas) {
    if (!respuestas || respuestas.length === 0) {
      return {
        calificativo: null,
        porcentaje: 0,
        detalles: { C: 0, B: 0, A: 0, AD: 0 }
      };
    }

    // Contar cada tipo de respuesta
    const contar = {
      C: respuestas.filter(r => r === 'C').length,
      B: respuestas.filter(r => r === 'B').length,
      A: respuestas.filter(r => r === 'A').length,
      AD: respuestas.filter(r => r === 'AD').length
    };

    const total = respuestas.length;

    // LÓGICA MINEDU
    let calificativo = null;
    let porcentaje = 0;

    // AD: Más del 100% - significa que al menos 1 criterio está en AD y el resto en A o mejor
    if (contar.AD > 0 && contar.C === 0 && contar.B === 0) {
      // Todos son A o AD
      calificativo = 'AD';
      porcentaje = 100 + (contar.AD * 25); // Mayor a 100%
    }
    // A: 100% - Todos en A (sin AD)
    else if (contar.A === total && contar.AD === 0) {
      calificativo = 'A';
      porcentaje = 100;
    }
    // B: 99% a 55% - Mayormente A con algunos B, o mezcla que sume entre 55-99%
    else if ((contar.A >= 3 && contar.B <= 2 && contar.C === 0) ||
             (contar.A + contar.B + contar.AD >= 3 && contar.C === 0)) {
      calificativo = 'B';
      porcentaje = this.calcularPorcentaje(contar);
    }
    // C: Menos de 55% - Muchos en C o pocos en A
    else {
      calificativo = 'C';
      porcentaje = this.calcularPorcentaje(contar);
    }

    return {
      calificativo,
      porcentaje: Math.round(porcentaje),
      detalles: contar
    };
  }

  /**
   * Calcula porcentaje de logro
   * A = 100%, B = 75%, C = 50%, AD = 125%
   */
  static calcularPorcentaje(contar) {
    const valores = {
      AD: 125,
      A: 100,
      B: 75,
      C: 50
    };

    const total = contar.C + contar.B + contar.A + contar.AD;
    if (total === 0) return 0;

    const suma = (contar.AD * valores.AD) +
                 (contar.A * valores.A) +
                 (contar.B * valores.B) +
                 (contar.C * valores.C);

    return suma / total;
  }

  /**
   * Determina el rango de porcentaje
   */
  static determinarRango(porcentaje) {
    if (porcentaje > 100) return 'AD (Logro Destacado)';
    if (porcentaje === 100) return 'A (Logro Esperado)';
    if (porcentaje >= 55) return 'B (En Proceso)';
    return 'C (Inicio)';
  }

  /**
   * Convierte múltiples instrumentos de una competencia a una nota final
   * La RÚBRICA siempre domina
   */
  static calcularNotaCompetencia(instrumentos) {
    if (!instrumentos || instrumentos.length === 0) {
      return { calificativo: null, porcentaje: 0, detalles: null };
    }

    // Buscar si hay Rúbrica
    const rubrica = instrumentos.find(inst => inst.tipo === 'Rúbrica');

    if (rubrica) {
      // La Rúbrica decide
      return rubrica.resultado;
    }

    // Si no hay Rúbrica, promediar los demás (máximo A)
    let totalPorcentaje = 0;
    let contador = 0;

    for (const inst of instrumentos) {
      if (inst.resultado && inst.resultado.porcentaje) {
        totalPorcentaje += inst.resultado.porcentaje;
        contador++;
      }
    }

    const porcentajePromedio = contador > 0 ? totalPorcentaje / contador : 0;

    // Limitar a máximo A (100%)
    const porcentajeLimitado = Math.min(porcentajePromedio, 100);

    const calificativo = this.determinarCalificativoPorPorcentaje(porcentajeLimitado);

    return {
      calificativo,
      porcentaje: Math.round(porcentajeLimitado),
      detalles: { promedio: true, instrumentos: contador }
    };
  }

  /**
   * Convierte porcentaje a calificativo
   */
  static determinarCalificativoPorPorcentaje(porcentaje) {
    if (porcentaje > 100) return 'AD';
    if (porcentaje === 100) return 'A';
    if (porcentaje >= 55) return 'B';
    return 'C';
  }
}

// Exportar para uso en navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculosMINEDU;
}
