// src/utils/uploadPhoto.ts
// Helper para subir fotos: intenta Firebase Storage primero, fallback a base64 en localStorage

import { subirFotoFirebase, isFirebaseConfigured } from '../lib/firebase';

const MAX_SIZE_MB = 2;

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      reject(new Error(`La imagen no puede superar ${MAX_SIZE_MB}MB`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function subirFoto(
  base64Data: string,
  entidad: 'docentes' | 'alumnos' | 'usuarios',
  id: string
): Promise<string> {
  // 1. Intentar Firebase Storage
  if (isFirebaseConfigured()) {
    try {
      const url = await subirFotoFirebase(base64Data, entidad, id);
      return url;
    } catch (err) {
      console.warn('Firebase Storage falló, usando base64 local:', err);
    }
  }
  // 2. Fallback: guardar base64 directamente (para local/dev sin Firebase Storage)
  // Comprimir si es muy grande
  if (base64Data.length > 500000) {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = base64Data;
    });
    const canvas = document.createElement('canvas');
    const maxDim = 400;
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      if (width > height) { height = (height / width) * maxDim; width = maxDim; }
      else { width = (width / height) * maxDim; height = maxDim; }
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, width, height);
    base64Data = canvas.toDataURL('image/jpeg', 0.7);
  }
  return base64Data;
}

export function esUrlFoto(valor?: string): boolean {
  if (!valor) return false;
  return valor.startsWith('http') || valor.startsWith('data:image');
}

export function getIniciales(nombre?: string): string {
  if (!nombre) return '?';
  return nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}
