import express from 'express';
import dotenv from 'dotenv';
import DB from '../../models/model.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

dotenv.config();

const router = express.Router();

// GET USERS

router.get('/', authMiddleware, async (req, res) => {
    try {
        const records = await DB.find({});
        res.status(200).json(records);
    } catch (err) {
        res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    }
});

// GET USER BY ID

router.get('/:id', async (req, res) => {
    try {
        const id = new mongoose.Types.ObjectId(req.params.id);
        const records = await DB.find({ _id: id });
        if (records) {
            res.status(200).json(records[0]);
        } else {
            res.status(404)
        }
    } catch (err) {
        res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    }
});

// CREATE USER

router.post('/', async (req, res) => {
    try {
        const info = req.body;
        await DB.create(info);
        res.status(200).send({ message: 'Usuario agregado con éxito' });
    } catch (err) {
        res.status(500).send(err);
    }
});

// DELETE ALL USERS

router.delete('/', async (req, res) => {
    try {
        await DB.deleteMany({});
        res.sendStatus(200);
    }
    catch (err) {
        res.sendStatus(500)
    }
})

// DELETE USER BY ID

router.delete('/:id', async (req, res) => {
    try {
        const id = new mongoose.Types.ObjectId(req.params.id);
        await DB.deleteOne({ _id: id });
        res.sendStatus(200);
    }
    catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// BY HAS RESULTS

router.get('/hasresults', async (req, res) => {
    try {
        const records = await DB.find({ hasResults: true });
        if (records.length > 0) {
            res.status(200).json(records.map(record => {
                return { tournaments: record.tournaments, players: record.players, hasResults: record.hasResults, company: record.company, hasToast: record.hasToast }
            }));
        } else {
            res.status(200).json([]);
        }
    } catch (err) {
        res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    }
});

// BY COMPANY NAME

router.get('/:company/getUserByCompanyName', async (req, res) => {
    try {
        const company = req.params.company;
        const records = await DB.find({ company: { $regex: new RegExp(company, 'i') } });
        if (records) {
            res.status(200).json(records[0]);
        } else {
            res.status(404)
        }
    } catch (err) {
        res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    }
});


export default router;