import jwt from 'jsonwebtoken';

// Middleware para verificar token JWT
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_aqui');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para verificar rol
export const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' });
    }

    next();
  };
};

// Middleware para manejo de errores
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
};
