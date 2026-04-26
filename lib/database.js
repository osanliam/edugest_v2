// lib/database.js — Wrapper que usa PostgreSQL o Turso según el entorno
import { query as pgQuery, execute as pgExecute, initializeDatabase as pgInit } from './postgres.js';
import { query as tursoQuery, execute as tursoExecute, initializeDatabase as tursoInit } from './turso.js';

const isGCP = process.env.K_SERVICE !== undefined || process.env.DB_HOST !== undefined;

export async function query(sql, params = []) {
  if (isGCP) {
    return pgQuery(sql, params);
  }
  return tursoQuery(sql, params);
}

export async function execute(sql, params = []) {
  if (isGCP) {
    return pgExecute(sql, params);
  }
  return tursoExecute(sql, params);
}

export async function initializeDatabase() {
  if (isGCP) {
    return pgInit();
  }
  return tursoInit();
}

export function getDatabase() {
  if (isGCP) {
    return { type: 'postgres' };
  }
  return { type: 'turso' };
}
