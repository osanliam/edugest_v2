#!/usr/bin/env node

/**
 * Script para cargar notas migradas desde el backup antiguo
 * Uso: node cargar-notas.js
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN || '';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function cargarNotas() {
  console.log(`${colors.cyan}🔄 Iniciando carga de notas...${colors.reset}\n`);

  try {
    // Leer archivo de notas migradas
    const filePath = path.join(process.cwd(), 'cargar_notas_api.json');

    if (!fs.existsSync(filePath)) {
      console.log(`${colors.red}❌ No se encontró el archivo: ${filePath}${colors.reset}`);
      console.log(`${colors.yellow}💡 Primero ejecuta: python3 migrar-notas.py${colors.reset}`);
      process.exit(1);
    }

    const datosNotas = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const notas = datosNotas.notas || [];

    console.log(`${colors.cyan}📊 Total de notas a cargar: ${notas.length}${colors.reset}\n`);

    let cargadas = 0;
    let errores = 0;

    for (let i = 0; i < notas.length; i++) {
      const nota = notas[i];

      try {
        // Opción 1: Usar API HTTP (requiere servidor corriendo)
        if (API_BASE_URL && JWT_TOKEN) {
          const response = await fetch(`${API_BASE_URL}/api/grades`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify(nota)
          });

          if (response.ok) {
            cargadas++;
            console.log(`${colors.green}✓${colors.reset} [${i + 1}/${notas.length}] ${nota.competence} - ${nota.instrument}: ${nota.score}`);
          } else {
            errores++;
            console.log(`${colors.red}✗${colors.reset} [${i + 1}/${notas.length}] Error: ${response.statusText}`);
          }
        }
      } catch (error) {
        errores++;
        console.log(`${colors.red}✗${colors.reset} [${i + 1}/${notas.length}] Error de conexión: ${error.message}`);
      }
    }

    console.log(`\n${colors.green}✅ Carga completada${colors.reset}`);
    console.log(`   Cargadas: ${colors.green}${cargadas}${colors.reset}`);
    console.log(`   Errores:  ${colors.red}${errores}${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}Error fatal:${colors.reset}`, error);
    process.exit(1);
  }
}

// Ejecutar
cargarNotas();
