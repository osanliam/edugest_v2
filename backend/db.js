import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.json');

let db = {
  users: [],
  grades: [],
  schools: []
};

// Cargar desde archivo si existe
if (fs.existsSync(dbPath)) {
  const data = fs.readFileSync(dbPath, 'utf-8');
  db = JSON.parse(data);
}

const save = () => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

export { db, save };
