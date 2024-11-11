import express from 'express';
import dotenv from 'dotenv';
import DB from '../../models/model.js';
import jwt from 'jsonwebtoken';
import sanitize from 'mongo-sanitize';

// Variables de entorno

dotenv.config();
const SECRET = process.env.SECRET;
const WHITELIST = process.env.EMAIL_WHITELIST ? process.env.EMAIL_WHITELIST.split(',') : [];

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, username } = sanitize(req.body);

        const token = jwt.sign(
            { email, username },
            SECRET,
            { expiresIn: '6h' }
        );

        if (WHITELIST.length > 0 && !WHITELIST.includes(email)) {
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