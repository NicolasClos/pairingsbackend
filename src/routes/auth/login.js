import express from 'express';
import dotenv from 'dotenv';
import DB from '../../models/model.js';
import jwt from 'jsonwebtoken';

// Variables de entorno

dotenv.config();
const SECRET = process.env.SECRET;
const EMAIL_WHITELIST_ENV = process.env.EMAIL_WHITELIST;
const EMAIL_WHITELIST = EMAIL_WHITELIST_ENV ? EMAIL_WHITELIST_ENV.split(',') : [];

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, username } = req.body;

        const token = jwt.sign(
            { email, username },
            SECRET,
            { expiresIn: '6h' }
        );

        if (EMAIL_WHITELIST.length > 0 && !EMAIL_WHITELIST.includes(email)) {
            console.error(`El email ${email} no es permitido`)
            return res.status(403).json({ error: 'Email no permitido' });
        }
        let user = await DB.findOne({ email });
        if (!user) {
            user = await DB.create({ email, username });
        }
        res.json({ ...user._doc, token });
        
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor al realizar el login' });
    }
});

export default router;