import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'

dotenv.config();

const SECRET = process.env.SECRET;

const authMiddleware = (req, res, next) => {
    const authorization = req.headers['authorization'];
    if (!authorization) {
      return res.status(401).json({ Error: 'Acceso No Autorizado - Requiere Token' });
    }
    try {
      const bearer = authorization.split(' ')[0];
      if(bearer.toLowerCase() !== 'bearer' ){
        return res.status(401).json({ Error: 'Acceso No Autorizado - Header Authorization con formato incorrecto' });
      }
      const token = authorization.split(' ')[1];
      const decoded = jwt.verify(token, SECRET);
      req.usuario = decoded;
      next();
    } catch (error) {
        const errorMessage = 
        error.name === 'TokenExpiredError' 
          ? 'Acceso No Autorizado - Token Expirado' 
          : 'Acceso No Autorizado - Token Inválido';
          
      return res.status(401).json({ Error: errorMessage });
    }
  }

export default authMiddleware;