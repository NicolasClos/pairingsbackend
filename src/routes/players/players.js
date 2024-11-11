import express from 'express';
import DB from '../../models/model.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import sanitize from 'mongo-sanitize';

const router = express.Router();

router.use(authMiddleware);

// GET PLAYERS

router.get('/:userId/players', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const user = await DB.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ Error: 'Usuario no encontrado' });
        }
        const players = user.players;
        res.status(200).json(players);
    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: 'Error al obtener los jugadores' });
    }
});

// GET PLAYER BY ID

router.get('/:userId/players/:playerId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const playerId = new mongoose.Types.ObjectId(req.params.playerId);
        const user = await DB.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ Error: 'Usuario no encontrado' });
        }
        const player = user.players.find(player => player._id.equals(playerId));
        if (!player) {
            return res.status(404).json({ Error: 'Jugador no encontrado' });
        }
        res.status(200).json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: 'Error al obtener el jugador' });
    }
});

// CREATE PLAYER

router.post('/:userId/players', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const reqBody = sanitize(req.body);
        if (!reqBody.name || !reqBody.surname) {
            return res.status(400).json({ Error: 'Datos de jugador incompletos' });
        }
        const updatedUser = await DB.findOneAndUpdate(
            { _id: userId },
            { $push: { players: req.body } },
            { new: true } // Esto hace que devuelva el documento modificado
        );

        const newPlayer = updatedUser.players.find(player =>
            player.name === req.body.name && player.surname === req.body.surname
        );

        res.status(200).json(newPlayer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: 'Error al agregar el jugador' });
    }
});

// DELETE PLAYER BY ID

router.delete('/:userId/players/:playerId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const playerId = new mongoose.Types.ObjectId(req.params.playerId);
        const updatedUser = await DB.updateOne(
            { _id: userId },
            { $pull: { players: { _id: playerId } } }
        );
        if (updatedUser.nModified === 0) {
            return res.status(404).json({ Error: 'Jugador no encontrado' });
        }
        res.status(200).json({ Message: 'Jugador eliminado con éxito', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: 'Error al eliminar el jugador' });
    }
});

// EDIT PLAYER BY ID

router.put('/:userId/players/:playerId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const playerId = new mongoose.Types.ObjectId(req.params.playerId);
        const user = await DB.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ Error: 'Usuario no encontrado' });
        }
        const playerIndex = user.players.findIndex(player => player._id.equals(playerId));
        if (playerIndex === -1) {
            return res.status(404).json({ Error: 'Jugador no encontrado' });
        }
        for (const field in req.body) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                user.players[playerIndex][field] = req.body[field];
            }
        }
        await user.save();
        res.status(200).json({ Message: 'Jugador actualizado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: 'Error al actualizar el jugador' });
    }
});

// EDIT ALL PLAYERS

router.put('/:userId/players', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const playersToUpdate = sanitize(req.body);
        const user = await DB.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ Error: 'Usuario no encontrado' });
        }
        user.players = user.players.map(player => {
            const playerToUpdate = playersToUpdate.find(p => p._id.toString() === player._id.toString());
            return playerToUpdate ? playerToUpdate : player;
        });
        await user.save();
        res.status(200).json({ Message: 'Jugadores actualizados exitosamente' });
    } catch (error) {

    }
});

router.post('/:userId/players/:playerId/changeFullname', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const user = await DB.findOne({ _id: userId });

        const playerId = new mongoose.Types.ObjectId(req.params.playerId);
        const newName = sanitize(req.body.name);
        const newSurname = sanitize(req.body.surname);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // EDITAR EN USER.PLAYERS
        const playerIndex = user.players.findIndex(p => {
            const id = p._id instanceof mongoose.Types.ObjectId ? p._id : new mongoose.Types.ObjectId(p._id);
            return id.equals(playerId);
        });

        if (playerIndex === -1) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }

        user.players[playerIndex].name = newName;
        user.players[playerIndex].surname = newSurname;

        // EDITAR EN CADA TOURNAMENT
        user.tournaments.forEach(tournament => {
            tournament.players.forEach(player => {
                const id = player._id instanceof mongoose.Types.ObjectId ? player._id : new mongoose.Types.ObjectId(player._id);
                if (id.equals(playerId)) {
                    player.name = newName;
                    player.surname = newSurname;
                }
            });

            tournament.results.forEach(player => {
                const id = player._id instanceof mongoose.Types.ObjectId ? player._id : new mongoose.Types.ObjectId(player._id);
                if (id.equals(playerId)) {
                    player.name = newName;
                    player.surname = newSurname;
                }
            });

            tournament.rounds.forEach(round => {
                round.players.forEach(player => {
                    const id = player._id instanceof mongoose.Types.ObjectId ? player._id : new mongoose.Types.ObjectId(player._id);
                    if (id.equals(playerId)) {
                        player.name = newName;
                        player.surname = newSurname;
                    }
                });

                function isValidObjectId(id) {
                    return mongoose.Types.ObjectId.isValid(id);
                }

                function updatePlayerIfMatches(player, playerId, newName, newSurname) {
                    if (player && player._id) {
                        let id;

                        if (isValidObjectId(player._id)) {
                            id = new mongoose.Types.ObjectId(player._id);
                        } else {
                            console.warn(`ID no válido: ${player._id}`);
                            return;
                        }

                        if (id.equals(playerId)) {
                            player.name = newName;
                            player.surname = newSurname;
                        }
                    }
                }

                round.pairings.forEach(pairing => {
                    updatePlayerIfMatches(pairing.firstPlayer, playerId, newName, newSurname);
                    updatePlayerIfMatches(pairing.secondPlayer, playerId, newName, newSurname);
                });
            });
        });

        await user.save();

        res.status(200).json(user);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cambiar el nombre del jugador.' });
    }
});

export default router;