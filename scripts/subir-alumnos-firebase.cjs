// scripts/subir-alumnos-firebase.js
// Sube tu archivo Excel de alumnos DIRECTAMENTE a Firebase Firestore
// Uso: node scripts/subir-alumnos-firebase.js "ruta/al/archivo.xlsx"

const fs = require('fs');
const path = require('path');

// ── Leer config de Firebase desde .env.local ────────────────────────────────
function leerEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^VITE_(\w+)=(.+)$/);
    if (match) vars[match[1]] = match[2].trim();
  });
  return vars;
}

const env = leerEnv();
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

console.log('Firebase project:', firebaseConfig.projectId);

// ── Importar Firebase ───────────────────────────────────────────────────────
const { initializeApp } = require('firebase/app');
const { getFirestore, writeBatch, doc } = require('firebase/firestore');
const XLSX = require('xlsx');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Funciones helper ────────────────────────────────────────────────────────
function normGrado(g) {
  if (!g) return '';
  const s = String(g).trim();
  const map = { 'primero': '1', '1°': '1', '1º': '1', 'segundo': '2', '2°': '2', '2º': '2', 'tercero': '3', '3°': '3', '3º': '3', 'cuarto': '4', '4°': '4', '4º': '4', 'quinto': '5', '5°': '5', '5º': '5' };
  return map[s.toLowerCase()] || s.replace(/[°º]/g, '').trim();
}

function normSeccion(s) {
  if (!s) return '';
  return String(s).trim().replace(/^\d+/, '').replace(/[^A-Za-z]/g, '').toUpperCase();
}

function calcularEdad(fechaNac) {
  if (!fechaNac) return 0;
  try {
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  } catch { return 0; }
}

// ── Procesar Excel ──────────────────────────────────────────────────────────
async function subirAlumnos(archivoExcel) {
  if (!fs.existsSync(archivoExcel)) {
    console.error('❌ Archivo no encontrado:', archivoExcel);
    process.exit(1);
  }

  console.log('📖 Leyendo Excel...');
  const workbook = XLSX.readFile(archivoExcel);
  
  // Buscar en todas las hojas la que tenga más alumnos válidos
  let mejorHoja = null;
  let mejorAlumnos = [];
  
  for (const hojaNombre of workbook.SheetNames) {
    const sheet = workbook.Sheets[hojaNombre];
    
    // Intentar desde la primera fila (range: 0)
    let rows = XLSX.utils.sheet_to_json(sheet, { range: 0 });
    if (rows.length === 0) continue;
    
    // Contar filas con DNI y nombre válidos
    let validos = 0;
    for (const r of rows.slice(0, Math.min(20, rows.length))) {
      const dni = String(r['N° DNI DEL ALUMNO'] || r['DNI'] || r['dni'] || '').trim();
      const nombre = String(r['APELLIDOS Y NOMBRES'] || r['apellidos_nombres'] || '').trim();
      if (dni && nombre) validos++;
    }
    
    // Si no hay válidos, intentar desde la segunda fila (range: 1) — algunos Excels tienen título en fila 1
    if (validos === 0) {
      rows = XLSX.utils.sheet_to_json(sheet, { range: 1 });
      if (rows.length > 0) {
        for (const r of rows.slice(0, Math.min(20, rows.length))) {
          const dni = String(r['N° DNI DEL ALUMNO'] || r['DNI'] || r['dni'] || '').trim();
          const nombre = String(r['APELLIDOS Y NOMBRES'] || r['apellidos_nombres'] || '').trim();
          if (dni && nombre) validos++;
        }
      }
    }
    
    console.log(`  📄 Hoja "${hojaNombre}": ${rows.length} filas, ${validos} válidas en muestra`);
    
    if (validos > 0 && validos > mejorAlumnos.length) {
      // Procesar esta hoja completamente
      const alumnosHoja = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const dni = String(r['N° DNI DEL ALUMNO'] || r['DNI'] || r['dni'] || '').trim();
        const nombre = String(r['APELLIDOS Y NOMBRES'] || r['apellidos_nombres'] || '').trim();
        if (!dni || !nombre) continue;
        
        alumnosHoja.push({
          id: `alu-dni-${dni}`,
          apellidos_nombres: nombre,
          dni: dni,
          fecha_nacimiento: String(r['Fecha de nacimiento'] || r['FECHA DE NACIMIENTO'] || '').trim(),
          edad: Number(r['Edad'] || r['EDAD'] || calcularEdad(r['Fecha de nacimiento'])) || 0,
          sexo: String(r['Sexo'] || r['SEXO'] || '').trim(),
          grado: normGrado(r['Grado de estudios'] || r['GRADO'] || r['grado']),
          seccion: normSeccion(r['Sección'] || r['SECCIÓN'] || r['seccion']),
          madre_nombres: String(r['Apellidos y Nombres de la Madre'] || r['madre_nombres'] || '').trim(),
          madre_dni: String(r['DNI Madre'] || r['madre_dni'] || '').trim(),
          madre_celular: String(r['N° de Celular  de la madre'] || r['madre_celular'] || '').trim(),
          padre_nombres: String(r['Apellidos y Nombres del Padre'] || r['padre_nombres'] || '').trim(),
          padre_dni: String(r['DNI Padre'] || r['padre_dni'] || '').trim(),
          padre_celular: String(r['N° de Celular del padre'] || r['padre_celular'] || '').trim(),
          creado: new Date().toISOString(),
        });
      }
      
      if (alumnosHoja.length > mejorAlumnos.length) {
        mejorAlumnos = alumnosHoja;
        mejorHoja = hojaNombre;
      }
    }
  }
  
  if (!mejorHoja) {
    console.error('❌ Ninguna hoja tiene alumnos válidos. Revisa las columnas.');
    process.exit(1);
  }
  
  console.log(`\n✅ Usando hoja "${mejorHoja}" con ${mejorAlumnos.length} alumnos`);
  
  const alumnos = mejorAlumnos;

  console.log(`✅ ${alumnos.length} alumnos válidos para subir`);
  if (alumnos.length === 0) {
    console.log('❌ No hay alumnos válidos. Revisa las columnas del Excel.');
    process.exit(1);
  }

  // ── Subir a Firebase en batches ───────────────────────────────────────────
  console.log('☁️  Subiendo a Firebase...');
  let batch = writeBatch(db);
  let count = 0;
  let total = 0;

  for (const alumno of alumnos) {
    batch.set(doc(db, 'alumnos', alumno.id), alumno);
    count++;
    total++;
    if (count >= 400) {
      await batch.commit();
      console.log(`  ✅ ${total} alumnos subidos...`);
      batch = writeBatch(db);
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`\n🎉 ¡LISTO! ${total} alumnos subidos a Firebase Firestore.`);
  console.log(`🔗 Ve a: https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/data`);
  process.exit(0);
}

// ── Ejecutar ────────────────────────────────────────────────────────────────
const archivo = process.argv[2];
if (!archivo) {
  console.log('Uso: node scripts/subir-alumnos-firebase.js "ruta/al/archivo.xlsx"');
  console.log('Ejemplo: node scripts/subir-alumnos-firebase.js "/Users/osmer/Desktop/alumnos.xlsx"');
  process.exit(1);
}

subirAlumnos(archivo).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
