import express from 'express';
import DB from '../../models/model.js';
import GenerateRoundRobinPairings from '../../services/round-robin-pairings.js';
import GenerateSwissPairings from '../../services/swiss-pairings.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// GET TOURNAMENTS

router.get('/:userId/tournaments', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const user = await DB.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const tournaments = user.tournaments;
        res.status(200).json(tournaments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los torneos del usuario' });
    }
});

// GET TOURNAMENT BY ID

router.get('/:userId/tournaments/:tournamentId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const tournamentId = new mongoose.Types.ObjectId(req.params.tournamentId);
        const user = await DB.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const tournament = user.tournaments.find(tournament => tournament._id.equals(tournamentId));
        if (!tournament) {
            return res.status(404).json({ error: 'Torneo no encontrado' });
        }
        res.status(200).json(tournament);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el torneo del usuario' });
    }
});

// CREATE TOURNAMENT

router.post('/:userId/tournaments', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const user = await DB.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (!req.body.name || !req.body.date) {
            return res.status(400).json({ error: 'Datos de torneo incompletos' });
        }
        const newTournament = {
            name: req.body.name,
            date: req.body.date,
        };
        user.tournaments.push(newTournament);
        await user.save()
        const createdTournament = user.tournaments[user.tournaments.length - 1];
        res.status(200).json(createdTournament);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el torneo' });
    }
});

// DELETE TOURNAMENT BY ID

router.delete('/:userId/tournaments/:tournamentId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const tournamentId = new mongoose.Types.ObjectId(req.params.tournamentId);
        const user = await DB.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const tournamentIndex = user.tournaments.findIndex(tournament => tournament._id.equals(tournamentId));
        if (tournamentIndex === -1) {
            return res.status(404).json({ error: 'Torneo no encontrado' });
        }
        user.tournaments.splice(tournamentIndex, 1);
        await user.save({ validateBeforeSave: false });
        const updatedUser = await DB.findOne({ _id: userId });
        res.status(200).json(updatedUser.tournaments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el torneo' });
    }
});

// EDIT TOURNAMENT BY ID

router.put('/:userId/tournaments/:tournamentId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const tournamentId = new mongoose.Types.ObjectId(req.params.tournamentId);
        const user = await DB.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const tournamentIndex = user.tournaments.findIndex(tournament => tournament._id.equals(tournamentId));
        if (tournamentIndex === -1) {
            return res.status(404).json({ error: 'Torneo no encontrado' });
        }
        for (const field in req.body) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                user.tournaments[tournamentIndex][field] = req.body[field];
            }
        }
        await user.save();
        res.status(200).json({ message: 'Torneo actualizado con éxito', user: user });
    } catch (error) {
    }
});

// START TOURNAMENT BY ID

router.post('/:userId/tournaments/:tournamentId/start', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const user = await DB.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const bodyTournament = { ...req.body };

        let updatedTournament = { ...bodyTournament }

        updatedTournament.started = true;

        const GenerateRounds = (cantidad) => {
            const arrayRounds = Array.from({ length: cantidad }, (_, index) => {
                const isLast = index === cantidad - 1
                return {
                    round: Number(index + 1),
                    winners: [],
                    pairings: [],
                    started: index === 0,
                    finished: false,
                    isLast: isLast,
                    players: index === 0 ? updatedTournament.players : []
                }
            })
            return arrayRounds
        }

        updatedTournament.results = updatedTournament.players.map(player => {
            return { ...player, points: 0 };
        });

        // EMPAREJAR PRIMERA RONDA

        switch (bodyTournament.type) {
            case 'Americano': {
                let roundsQuantity = 0;
                if (updatedTournament.players.length % 2 === 0) {
                    if (updatedTournament.repeat) {
                        roundsQuantity = (updatedTournament.players.length - 1) * 2
                        updatedTournament.rounds = GenerateRounds(roundsQuantity);
                    } else {
                        updatedTournament.rounds = GenerateRounds(updatedTournament.players.length - 1);
                    }
                } else if (updatedTournament.players.length % 2 !== 0) {
                    if (updatedTournament.repeat) {
                        roundsQuantity = (updatedTournament.players.length) * 2
                        updatedTournament.rounds = GenerateRounds(roundsQuantity);
                    } else {
                        updatedTournament.rounds = GenerateRounds(updatedTournament.players.length);
                    }
                }
                updatedTournament.rounds[0].pairings = GenerateRoundRobinPairings(updatedTournament.results, [], 0);
                updatedTournament.roundsQuantity = Number(updatedTournament.rounds.length);
                break;
            }
            case 'Suizo': {
                updatedTournament.rounds = GenerateRounds(updatedTournament.roundsQuantity);
                updatedTournament.rounds[0].pairings = GenerateSwissPairings(updatedTournament.results, [], 0);
                break;
            }
            default: {
                updatedTournament.rounds = GenerateRounds(updatedTournament.roundsQuantity);
                updatedTournament.rounds[0].pairings = GenerateSwissPairings(updatedTournament.results, [], 0);
            }
        }

        const updatedUser = await DB.findOneAndUpdate(
            { _id: userId, 'tournaments._id': updatedTournament._id },
            { $set: { 'tournaments.$': updatedTournament } },
            { new: true, useFindAndModify: false }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario o torneo no encontrado' });
        }

        res.status(200).json(updatedUser.tournaments);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el torneo' });
    }
});

// GENERATE PAIRINGS

router.post('/:userId/tournaments/:tournamentId/generatePairings', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const tournamentId = new mongoose.Types.ObjectId(req.params.tournamentId);

        const user = await DB.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const bodyTournament = { ...req.body };
        const updatedTournament = { ...bodyTournament }
        let currentRoundIndex = updatedTournament.rounds
            .slice()
            .findIndex(round => round.pairings.length > 0 && round.started && !round.finished);

        if (currentRoundIndex === -1) {
            currentRoundIndex = 0;
        }

        let nextRoundIndex = currentRoundIndex + 1;

        updatedTournament.rounds[currentRoundIndex].finished = true;
        updatedTournament.rounds[nextRoundIndex].started = true;

        const previousPairings = updatedTournament.rounds.filter(round => round.started && round.finished).flatMap(round => round?.pairings)

        const updatedEloPlayers = updatedTournament.players.map(player => {
            const result = updatedTournament.results.find(result => result._id === player._id);
            if (result) {
                return {
                    ...player,
                    elo: result.elo,
                    points: player.points ? player.points : 0
                }
            } else {
                return { ...player, points: player.points ? player.points : 0 };
            }
        });

        function updatePlayersDB(players, results) {
            const playersSet = new Set(players.map(player => player._id));
            const filteredResults = results.filter(result => playersSet.has(result._id));
            return players.map(player => {
                let updatedPlayer = filteredResults.find(result => result._id === player._id);
                if (updatedPlayer) {
                    return { ...updatedPlayer, name: player.name, surname: player.surname };
                } else return { ...player, points: 0, whites: 0, blacks: 0, eloChange: 0 }
            }).filter(Boolean);
        }

        updatedTournament.players = updatedEloPlayers;

        const playersForNextRound = updatePlayersDB(updatedTournament.players, updatedTournament.results.map(player => {
            return {
                ...player,
                points: player.points ? player.points : 0,
                blacks: player.blacks ? player.blacks : 0,
                whites: player.whites ? player.whites : 0,
                draws: player.draws ? player.draws : 0,
                eloChange: player.eloChange ? player.eloChange : 0,
                wins: player.wins ? player.wins : 0,
                loses: player.loses ? player.loses : 0
            }
        }));

        let repeatRoundStart = 0;

        if (updatedTournament.players.length % 2 === 0) {
            repeatRoundStart = updatedTournament.players.length;
        } else {
            repeatRoundStart = updatedTournament.players.length + 1;
        }

        switch (bodyTournament.type) {
            case 'Americano': {
                if (updatedTournament.rounds[nextRoundIndex].round >= repeatRoundStart) {
                    updatedTournament.rounds[nextRoundIndex].pairings = updatedTournament.rounds[(nextRoundIndex - (repeatRoundStart - 1))].pairings.map(pairing => {
                        if (pairing.secondPlayer._id !== 'BYE') {
                            return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        } return pairing
                    })
                } else {
                    updatedTournament.rounds[nextRoundIndex].pairings = GenerateRoundRobinPairings(playersForNextRound, previousPairings, nextRoundIndex + 1);
                }
                updatedTournament.rounds[nextRoundIndex].players = playersForNextRound;
                break;
            }
            case 'Suizo': {
                updatedTournament.rounds[nextRoundIndex].pairings = GenerateSwissPairings(playersForNextRound, previousPairings, nextRoundIndex + 1);
                updatedTournament.rounds[nextRoundIndex].players = playersForNextRound;
                break;
            }
            default: {
                updatedTournament.rounds[nextRoundIndex].pairings = GenerateSwissPairings(playersForNextRound, previousPairings, nextRoundIndex + 1);
                updatedTournament.rounds[nextRoundIndex].players = playersForNextRound;
            }
        }

        const tournamentIndex = user.tournaments.findIndex(tournament => tournament._id.equals(tournamentId));

        if (tournamentIndex === -1) {
            return res.status(404).json({ error: 'Torneo no encontrado' });
        }

        user.tournaments[tournamentIndex] = updatedTournament;

        await user.save()

        res.status(200).json(updatedTournament);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Error al realizar el emparejamiento. ${error}` });
    }
});

// REPAIR

router.post('/:userId/tournaments/:tournamentId/repair', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const tournamentId = new mongoose.Types.ObjectId(req.params.tournamentId);

        const user = await DB.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const bodyTournament = { ...req.body };
        let updatedTournament = { ...bodyTournament }

        let currentRoundIndex = updatedTournament.rounds
            .slice()
            .findIndex(round => round.pairings.length > 0 && round.started && !round.finished);

        if (currentRoundIndex === -1) {
            throw new Error(`Ronda no encontrada.`)
        }

        const previousPairings = updatedTournament.rounds.filter(round => round.started && round.finished).flatMap(round => round?.pairings)

        const updatedEloPlayers = updatedTournament.players.map(player => {
            const result = updatedTournament.results.find(result => result._id === player._id);
            if (result) {
                return {
                    ...player,
                    elo: result.elo,
                    points: player.points ? player.points : 0
                }
            } else {
                return { ...player, points: player.points ? player.points : 0 };
            }
        });

        function updatePlayersDB(players, results) {
            const playersSet = new Set(players.map(player => player._id));
            const filteredResults = results.filter(result => playersSet.has(result._id));
            return players.map(player => {
                let updatedPlayer = filteredResults.find(result => result._id === player._id);
                if (updatedPlayer) {
                    return { ...updatedPlayer, name: player.name, surname: player.surname };
                } else return { ...player, points: 0, whites: 0, blacks: 0, eloChange: 0 }
            }).filter(Boolean);
        }

        updatedTournament.players = updatedEloPlayers;

        const playersForNextRound = updatePlayersDB(updatedTournament.players, updatedTournament.results.map(player => {
            return {
                ...player,
                points: player.enteredWithBye && player.points ? player.points + (updatedTournament.byeValue * player.enteredWithBye) : player.points ? player.points : 0,
                blacks: player.blacks ? player.blacks : 0,
                whites: player.whites ? player.whites : 0,
                draws: player.draws ? player.draws : 0,
                eloChange: player.eloChange ? player.eloChange : 0,
                wins: player.wins ? player.wins : 0,
                loses: player.loses ? player.loses : 0
            }
        }));

        let repeatRoundStart = 0;

        if (updatedTournament.players.length % 2 === 0) {
            repeatRoundStart = updatedTournament.players.length;
        } else {
            repeatRoundStart = updatedTournament.players.length + 1;
        }

        switch (bodyTournament.type) {
            case 'Americano': {
                if (updatedTournament.rounds[currentRoundIndex].round >= repeatRoundStart) {
                    updatedTournament.rounds[currentRoundIndex].pairings = updatedTournament.rounds[(currentRoundIndex - (repeatRoundStart - 1))].pairings.map(pairing => {
                        if (pairing.secondPlayer._id !== 'BYE') {
                            return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        } return pairing
                    })
                } else {
                    updatedTournament.rounds[currentRoundIndex].pairings = GenerateRoundRobinPairings(playersForNextRound, previousPairings, currentRoundIndex + 1);
                }
                updatedTournament.rounds[currentRoundIndex].players = playersForNextRound;
                break;
            }
            case 'Suizo': {
                updatedTournament.rounds[currentRoundIndex].pairings = GenerateSwissPairings(playersForNextRound, previousPairings, currentRoundIndex + 1);
                updatedTournament.rounds[currentRoundIndex].players = playersForNextRound;
                break;
            }
            default: {
                updatedTournament.rounds[currentRoundIndex].pairings = GenerateSwissPairings(playersForNextRound, previousPairings, currentRoundIndex + 1);
                updatedTournament.rounds[currentRoundIndex].players = playersForNextRound;
            }
        }

        updatedTournament.rounds[currentRoundIndex].winners = [];

        const tournamentIndex = user.tournaments.findIndex(tournament => tournament._id.equals(tournamentId));

        if (tournamentIndex === -1) {
            return res.status(404).json({ error: 'Torneo no encontrado' });
        }

        updatedTournament = {
            ...updatedTournament,
            results: updatedTournament.results.map(p => {
            if (p.enteredWithBye > 0) {
                const points = p.points ?? 0;
                return {
                    ...p,
                    points: (updatedTournament.byeValue * p.enteredWithBye) + points
                };
            }
            return p;
        })}

        user.tournaments[tournamentIndex] = updatedTournament;

        await user.save()

        res.status(200).json(updatedTournament);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Error al realizar el emparejamiento. ${error}` });
    }
});

// GO ONE ROUND BACK

router.post('/:userId/tournaments/:tournamentId/goOneRoundBack', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const user = await DB.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const bodyTournament = { ...req.body };

        let updatedTournament = { ...bodyTournament };

        const roundIndex = updatedTournament.rounds.findIndex(round => round.started && !round.finished);

        if (roundIndex === -1) {
            return res.status(404).json({ error: 'No hay ninguna ronda en progreso para retroceder.' });
        }

        updatedTournament.rounds[roundIndex] = {
            ...updatedTournament.rounds[roundIndex],
            started: false,
            finished: false,
            winners: [],
            pairings: [],
            players: []
        };

        updatedTournament.rounds[roundIndex - 1] = {
            ...updatedTournament.rounds[roundIndex - 1],
            finished: false
        };

        const tournamentIndex = user.tournaments.findIndex(tournament => tournament._id.equals(bodyTournament._id));

        if (tournamentIndex === -1) {
            return res.status(404).json({ error: 'Torneo no encontrado' });
        }

        user.tournaments[tournamentIndex] = updatedTournament;

        await user.save();

        res.status(200).json(updatedTournament);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al retroceder la ronda del torneo.' });
    }
});

// AGREGAR EMPAREJAMIENTO MANUAL

router.post('/:userId/tournaments/:tournamentId/addManualPairing', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const user = await DB.findOne({ _id: userId });

        const tournamentId = new mongoose.Types.ObjectId(req.body.tournament._id);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const request = { ...req.body };

        let updatedTournament = { ...request.tournament };

        const roundIndex = updatedTournament.rounds.findIndex(round => round.started && !round.finished);

        if (roundIndex === -1) {
            return res.status(404).json({ error: 'No se encontro la ronda actual.' });
        }

        let firstPlayer = { ...request.firstPlayer }
        let secondPlayer = { ...request.secondPlayer }

        if (request.firstPlayer._id) {
            const firstPlayerId = new mongoose.Types.ObjectId(req.body.firstPlayer._id);
            const firstPlayer = user.players.find(p => p._id.equals(firstPlayerId));

            if (!firstPlayer) {
                throw new Error(`No se encontro el jugador ${request.firstPlayer.name} ${request.firstPlayer.surname} con id: ${request.firstPlayer._id}`)
            }
        } else {
            throw new Error(`No se recibe ningun id en el firstPlayer`)
        }

        if (request.firstPlayer._id) {
            const secondPlayerId = new mongoose.Types.ObjectId(req.body.secondPlayer._id);

            const secondPlayer = user.players.find(p => p._id.equals(secondPlayerId));

            if (!secondPlayer) {
                throw new Error(`No se encontro el jugador ${request.secondPlayer.name} ${request.secondPlayer.surname} con id: ${request.secondPlayer._id}`)
            }
        } else {
            throw new Error(`No se recibe ningun id en el secondPlayer`)
        }

        const newPairing = { firstPlayer: { ...firstPlayer, whites: 0, blacks: 0, eloChange: 0, points: 0 }, secondPlayer: { ...secondPlayer, whites: 0, blacks: 0, eloChange: 0, points: 0 } }

        updatedTournament.players.push(firstPlayer)
        updatedTournament.players.push(secondPlayer)

        updatedTournament.rounds[roundIndex].pairings.push(newPairing)

        updatedTournament.rounds[roundIndex].pairings.sort((a, b) => {
            const aIsBye = a.secondPlayer._id === 'BYE';
            const bIsBye = b.secondPlayer._id === 'BYE';
            if (aIsBye && !bIsBye) return 1;
            if (bIsBye && !aIsBye) return -1;
            return 0;
        });

        updatedTournament.rounds[roundIndex].players.push({ ...firstPlayer, whites: 0, blacks: 0 })
        updatedTournament.rounds[roundIndex].players.push({ ...secondPlayer, whites: 0, blacks: 0 })

        const removeEnteredWithByeAndResetPoints = (player) => {
            const { enteredWithBye, ...restPlayer } = player;
            return { ...restPlayer, points: 0 };
        };

        const updatedFirstPlayer = removeEnteredWithByeAndResetPoints(firstPlayer);
        const updatedSecondPlayer = removeEnteredWithByeAndResetPoints(secondPlayer);

        updatedTournament.results.push(updatedFirstPlayer)
        updatedTournament.results.push(updatedSecondPlayer)

        const tournamentIndex = user.tournaments.findIndex(tournament => tournament._id.equals(tournamentId));

        if (tournamentIndex === -1) {
            return res.status(404).json({ error: 'Torneo no encontrado' });
        }

        user.tournaments[tournamentIndex] = updatedTournament;

        await user.save();

        res.status(200).json(updatedTournament);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al agregar el emparejamiento.' });
    }
});

// FINISH TOURNAMENT

router.post('/:userId/tournaments/:tournamentId/finish', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const tournamentId = new mongoose.Types.ObjectId(req.params.tournamentId);

        const user = await DB.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const bodyTournament = { ...req.body };

        let updatedTournament = { ...bodyTournament }

        updatedTournament.rounds = updatedTournament.rounds.map(round => {
            return { ...round, finished: true };
        });

        updatedTournament.rounds = updatedTournament.rounds.filter(round => round.pairings.length > 0);
        updatedTournament.finished = true;
        updatedTournament.roundsQuantity = updatedTournament.rounds.length

        const updatedUser = await DB.findOneAndUpdate(
            { _id: userId, 'tournaments._id': tournamentId },
            { $set: { 'tournaments.$': updatedTournament } },
            { new: true, useFindAndModify: false }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario o torneo no encontrado' });
        }

        res.status(200).json(updatedTournament);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al terminar el torneo.' });
    }
});

// ADD PLAYER WITH BYE

router.post('/:userId/tournaments/:tournamentId/addPlayerWithBye/:playerId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const playerId = new mongoose.Types.ObjectId(req.params.playerId);

        const tournamentId = new mongoose.Types.ObjectId(req.params.tournamentId);

        const user = await DB.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const tournamentIndex = user.tournaments.findIndex(t => t._id.equals(tournamentId))

        const updatedTournament = user.tournaments.find(t => t._id.equals(tournamentId))

        const newPlayer = user.players.find(p => p._id.equals(playerId))

        const bye = Number(req.body.points);

        const byes = Number(req.body.byes);

        updatedTournament.players = [...updatedTournament.players, { ...newPlayer, enteredWithBye: byes }];

        updatedTournament.results = [...updatedTournament.results, { ...newPlayer, games: 0, draws: 0, wins: 0, loses: 0, points: bye * byes }];

        updatedTournament.rounds = updatedTournament.rounds.map(round => {
            if (round.started) {
                const playerToAdd = {
                    ...newPlayer,
                    points: round.round === 1 ? bye * byes : 0,
                    blacks: 0,
                    whites: 0,
                };
                return {
                    ...round,
                    players: [...round.players, playerToAdd]
                };
            }
            return round;
        });

        user.tournaments[tournamentIndex] = updatedTournament;

        await user.save();

        res.status(200).json(updatedTournament);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al agregar jugador con bye.' });
    }
});

export default router;