import jwt from 'jsonwebtoken';

export const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'freshly_super_secure_jwt_secret_key_2026',
    {
      expiresIn: '30d',
    }
  );
};

