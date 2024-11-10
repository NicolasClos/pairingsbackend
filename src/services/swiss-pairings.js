export default function generatePairings(roundPlayers, prevPairings, roundNumber) {

    let players = roundPlayers.slice()

    let prevPairingsReverse = [
        ...prevPairings,
        ...prevPairings.map(pairing => ({
            firstPlayer: pairing.secondPlayer,
            secondPlayer: pairing.firstPlayer
        }))
    ];

    players = players.slice().sort(() => Math.random() - 0.5).sort((a, b) => { b.points - a.points })

    if (players.length % 2 !== 0) {
        const byePlayer = { _id: 'BYE', name: 'BYE', surname: '', blacks: 0, whites: 0, points: 0 }
        players.push(byePlayer)
    }

    let pairings = []
    for (let i = 0; i < players.length; i++) {
        let firstPlayer = players[i]

        for (let j = i + 1; j < players.length; j++) {
            let secondPlayer = players[j]
            if (firstPlayer._id !== secondPlayer._id) {
                pairings.push({ firstPlayer: firstPlayer, secondPlayer: secondPlayer })
            }
        }
    }

    pairings = pairings.map(pairing => {
        if (pairing.firstPlayer._id === 'BYE') {
            return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer };
        } else {
            return pairing;
        }
    });

    function removePreviousPairings(pairings, prevPairings) {
        const prevPairingsIds = prevPairings.map(pairing => {
            const id1 = pairing.firstPlayer._id;
            const id2 = pairing.secondPlayer._id;
            return [id1, id2].sort().join('-');
        });
        return pairings.filter(pairing => {
            const id1 = pairing.firstPlayer._id;
            const id2 = pairing.secondPlayer._id;
            const pairingId = [id1, id2].sort().join('-');
            return !prevPairingsIds.includes(pairingId);
        });
    }

    function countPlayerPositions(matchups) {
        const playerCounts = {};
        matchups.forEach(matchup => {
            const { firstPlayer, secondPlayer } = matchup;
            if (!playerCounts[firstPlayer._id]) {
                playerCounts[firstPlayer._id] = { name: firstPlayer.name, surname: firstPlayer.surname, _id: firstPlayer._id, whites: 0, blacks: 0 };
            }
            playerCounts[firstPlayer._id].whites++;
            if (!playerCounts[secondPlayer._id]) {
                playerCounts[secondPlayer._id] = { name: secondPlayer.name, surname: secondPlayer.surname, _id: secondPlayer._id, whites: 0, blacks: 0 };
            }
            playerCounts[secondPlayer._id].blacks++;
        });
        return Object.values(playerCounts);
    }

    const playersBlacksWhites = countPlayerPositions(prevPairings)

    function calculateBYEPairing(pairings) {
        const BYEPlayerPairings = pairings.filter(pairing => pairing.firstPlayer._id === 'BYE' || pairing.secondPlayer._id === 'BYE');

        const posiblePairings = removePreviousPairings(pairings, prevPairingsReverse).filter(pairing => pairing.secondPlayer._id === 'BYE');

        const minPointsPlayer = posiblePairings.reduce((minPlayer, pairing) => {
            if (pairing.firstPlayer.points < minPlayer.points) {
                return pairing.firstPlayer;
            } else {
                return minPlayer;
            }
        }, posiblePairings[0].firstPlayer);

        const selectedPairing = BYEPlayerPairings.find(pairing => pairing.firstPlayer._id === minPointsPlayer._id);

        return selectedPairing;
    }

    function generate() {

        const hasBYEPlayer = players && players.some(player => player._id === 'BYE');

        let BYEPairing = {}

        let posiblePairings = removePreviousPairings(pairings, prevPairingsReverse)
            .filter(pairing => pairing.secondPlayer._id !== 'BYE')
            .map(pairing => ({
                firstPlayer: { ...pairing.firstPlayer, points: parseFloat(pairing.firstPlayer.points) },
                secondPlayer: { ...pairing.secondPlayer, points: parseFloat(pairing.secondPlayer.points) }
            }))

        let roundPairings = new Set();

        let addedPlayers = new Set();

        if (hasBYEPlayer) {
            BYEPairing = calculateBYEPairing(pairings);
            if (BYEPairing) {
                roundPairings.add(BYEPairing);
                addedPlayers.add(BYEPairing.firstPlayer._id);
                addedPlayers.add(BYEPairing.secondPlayer._id);
            }
        }

        let possiblePairingsPerPlayer = players.map(player => {
            const pairingsForPlayer = posiblePairings.filter(pair =>
                pair.firstPlayer._id === player._id || pair.secondPlayer._id === player._id
            );
            const correctedPairings = pairingsForPlayer.map(pair =>
                pair.firstPlayer._id === player._id ? pair : { firstPlayer: pair.secondPlayer, secondPlayer: pair.firstPlayer }
            );
            correctedPairings.sort((a, b) => {
                const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                return diffA - diffB;
            });
            return correctedPairings;
        }).sort((a, b) => {
            const puntosA = a[0]?.firstPlayer.points || 0;
            const puntosB = b[0]?.firstPlayer.points || 0;
            return puntosB - puntosA;
        });

        switch (roundNumber) {
            case 1:
                posiblePairings.sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.elo - a.secondPlayer.elo);
                    const diffB = Math.abs(b.firstPlayer.elo - b.secondPlayer.elo);
                    return diffB - diffA;
                }).forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                });
                break;
            default:
                let usedPairings = []
                if (addedPlayers.size !== players.length) {
                    for (let i = 0; i < possiblePairingsPerPlayer.length; i++) {
                        const pairings = possiblePairingsPerPlayer[i];
                        for (let j = 0; j < pairings.length; j++) {
                            const pairing = pairings[j];
                            if (
                                !addedPlayers.has(pairing.firstPlayer._id) &&
                                !addedPlayers.has(pairing.secondPlayer._id) &&
                                !usedPairings.includes(pairing)
                            ) {
                                roundPairings.add(pairing);
                                addedPlayers.add(pairing.firstPlayer._id);
                                addedPlayers.add(pairing.secondPlayer._id);
                            }
                        }
                        if ((addedPlayers.size !== players.length) && i === possiblePairingsPerPlayer.length - 1) {
                            let myArray = Array.from(roundPairings);
                            let lastElement = {}
                            if (myArray.length > 0) {
                                lastElement = myArray.pop();
                                roundPairings = new Set(myArray);
                            }
                            usedPairings.push(lastElement)
                        }
                    }
                }
                break;
        }

        // TODOS ESTOS CONDICIONALES TIENEN EN CUENTA VARIAS POSIBILIDADES PARA QUE LOS EMPAREJAMIENTOS SEAN MEJORES, SE TIENE QUE HACER MAS OPTIMO PORQUE ESTA HORRIBLE ASI PERO POR LO MENOS FUNCIONA MAS O MENOS COMO QUEREMOS

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });

            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }

            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            let possiblePairingsPerPlayerInverted = [...possiblePairingsPerPlayer].reverse()

            for (let i = 0; i < possiblePairingsPerPlayerInverted.length; i++) {
                const pairings = possiblePairingsPerPlayerInverted[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 2); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffA - diffB;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 3); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffA - diffB;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 4); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffA - diffB;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 5); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffA - diffB;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 6); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffA - diffB;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 7); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffA - diffB;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 8); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffA - diffB;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        //

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 2); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 3); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 4); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 5); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 6); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 7); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 8); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        //

        if ((roundPairings.size !== players.length / 2)) {
            console.log('ES MEDIO RANDOM')
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 2); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort(() => Math.random() - 0.5)
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 3); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort(() => Math.random() - 0.5)
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 4); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 5); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort(() => Math.random() - 0.5)
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 6); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort(() => Math.random() - 0.5)
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 7); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort(() => Math.random() - 0.5)
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            for (let i = 0; i < (possiblePairingsPerPlayer.length / 8); i++) {
                const pairings = possiblePairingsPerPlayer[i];
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j];
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                }
            }

            posiblePairings && posiblePairings
                .sort(() => Math.random() - 0.5)
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        //

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });

            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffA - diffB;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        //

        // SE BUSCAN NUEVAS ALTERNATIVAS CON OTRA DIFERENCIA DE PUNTOS SI NO SE CUMPLEN LAS ANTERIORES

        if ((roundPairings.size !== players.length / 2)) {
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });
            // 2. SE UTILIZA OTRO FILTRADO CON UNA DIFERENCIA DE 0.5
            posiblePairings && posiblePairings
                .filter(pairing => {
                    const pointsDifference = Math.abs(pairing.firstPlayer.points - pairing.secondPlayer.points);
                    return pointsDifference <= 0.5;
                })
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        const firstPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.firstPlayer._id)
                        const secondPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.secondPlayer._id)
                        if (firstPlayerBlackWhite.whites > secondPlayerBlackWhite.whites || firstPlayerBlackWhite.whites === 3) {
                            pairing = { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        if (secondPlayerBlackWhite.blacks > firstPlayerBlackWhite.blacks || secondPlayerBlackWhite.blacks === 3) {
                            pairing = { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }
        if ((roundPairings.size !== players.length / 2)) {
            // SI NO SE CUMPLEN LOS CASOS DEL 1 AL 6 SE BUSCA OTRA ALTERNATIVA
            // 1. SE ELIMINA DE ADDEDPLAYERS Y DE ROUNDPAIRINGS TODO MENOS EL BYE
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });
            // 2. SE UTILIZA OTRO FILTRADO CON UNA DIFERENCIA DE 1.5
            posiblePairings && posiblePairings
                .filter(pairing => {
                    const pointsDifference = Math.abs(pairing.firstPlayer.points - pairing.secondPlayer.points);
                    return pointsDifference <= 1;
                })
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        const firstPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.firstPlayer._id)
                        const secondPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.secondPlayer._id)
                        if (firstPlayerBlackWhite.whites > secondPlayerBlackWhite.whites || firstPlayerBlackWhite.whites === 3) {
                            pairing = { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        if (secondPlayerBlackWhite.blacks > firstPlayerBlackWhite.blacks || secondPlayerBlackWhite.blacks === 3) {
                            pairing = { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }
        if ((roundPairings.size !== players.length / 2)) {
            // SI NO SE CUMPLEN LOS CASOS DEL 1 AL 6 SE BUSCA OTRA ALTERNATIVA
            // 1. SE ELIMINA DE ADDEDPLAYERS Y DE ROUNDPAIRINGS TODO MENOS EL BYE
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });
            // 2. SE UTILIZA OTRO FILTRADO CON UNA DIFERENCIA DE 0.5
            posiblePairings && posiblePairings
                .filter(pairing => {
                    const pointsDifference = Math.abs(pairing.firstPlayer.points - pairing.secondPlayer.points);
                    return pointsDifference <= 1.5;
                })
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        const firstPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.firstPlayer._id)
                        const secondPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.secondPlayer._id)
                        if (firstPlayerBlackWhite.whites > secondPlayerBlackWhite.whites || firstPlayerBlackWhite.whites === 3) {
                            pairing = { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        if (secondPlayerBlackWhite.blacks > firstPlayerBlackWhite.blacks || secondPlayerBlackWhite.blacks === 3) {
                            pairing = { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }
        if ((roundPairings.size !== players.length / 2)) {
            // SI NO SE CUMPLEN LOS CASOS DEL 1 AL 6 SE BUSCA OTRA ALTERNATIVA
            // 1. SE ELIMINA DE ADDEDPLAYERS Y DE ROUNDPAIRINGS TODO MENOS EL BYE
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });
            // 2. SE UTILIZA OTRO FILTRADO CON UNA DIFERENCIA DE 0.5
            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffB - diffA;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        const firstPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.firstPlayer._id)
                        const secondPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.secondPlayer._id)
                        if (firstPlayerBlackWhite.whites > secondPlayerBlackWhite.whites || firstPlayerBlackWhite.whites === 3) {
                            pairing = { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        if (secondPlayerBlackWhite.blacks > firstPlayerBlackWhite.blacks || secondPlayerBlackWhite.blacks === 3) {
                            pairing = { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }
        if ((roundPairings.size !== players.length / 2)) {
            // SI NO SE CUMPLEN LOS CASOS DEL 1 AL 6 SE BUSCA OTRA ALTERNATIVA
            // 1. SE ELIMINA DE ADDEDPLAYERS Y DE ROUNDPAIRINGS TODO MENOS EL BYE
            addedPlayers.forEach(player => {
                addedPlayers.delete(player)
            });
            if (hasBYEPlayer) {
                addedPlayers.add(BYEPairing.firstPlayer._id)
                addedPlayers.add('BYE')
            }
            roundPairings.forEach(pairing => {
                if (pairing.secondPlayer._id !== 'BYE') {
                    roundPairings.delete(pairing);
                }
            });
            // 2. SE UTILIZA OTRO FILTRADO CON UNA DIFERENCIA DE 0.5
            posiblePairings && posiblePairings
                .sort((a, b) => {
                    const diffA = Math.abs(a.firstPlayer.points - a.secondPlayer.points);
                    const diffB = Math.abs(b.firstPlayer.points - b.secondPlayer.points);
                    return diffA - diffB;
                })
                .forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        const firstPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.firstPlayer._id)
                        const secondPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.secondPlayer._id)
                        if (firstPlayerBlackWhite.whites > secondPlayerBlackWhite.whites || firstPlayerBlackWhite.whites === 3) {
                            pairing = { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        if (secondPlayerBlackWhite.blacks > firstPlayerBlackWhite.blacks || secondPlayerBlackWhite.blacks === 3) {
                            pairing = { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        roundPairings.add(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                })
        }

        // ORDENA LOS EMPAREJAMIENTOS SEGUN ELO EN LA PRIMERA RONDA
        if (roundNumber === 1) {
            return ([...roundPairings]
                .sort((a, b) => {
                    const maxEloA = Math.max(a.firstPlayer.elo, a.secondPlayer.elo);
                    const maxEloB = Math.max(b.firstPlayer.elo, b.secondPlayer.elo);
                    return maxEloB - maxEloA;
                })
                .sort((a, b) => {
                    if (a.secondPlayer._id === 'BYE') {
                        return 1;
                    } else if (b.secondPlayer._id === 'BYE') {
                        return -1;
                    } else {
                        return 0;
                    }
                }))
        }

        // ORDENA LOS EMPAREJAMIENTOS SEGUN PUNTOS EN LAS SIGUIENTES RONDAS

        return ([...roundPairings]
            .map(pairing => {
                const firstPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.firstPlayer._id)
                const secondPlayerBlackWhite = playersBlacksWhites.find(p => p._id === pairing.secondPlayer._id)
                if (secondPlayerBlackWhite && secondPlayerBlackWhite._id !== 'BYE') {
                    if (roundNumber === 2) {
                        if (secondPlayerBlackWhite && secondPlayerBlackWhite.blacks === 1) {
                            return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        if (firstPlayerBlackWhite && firstPlayerBlackWhite.whites === 1) {
                            return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                    } else if (roundNumber === 3 || roundNumber === 4) {
                        // SE VALIDA PRIMERO EN BASE A LA ULTIMA RONDA, SI COINCIDEN EN IGUAL VECES
                        if (secondPlayerBlackWhite && firstPlayerBlackWhite && secondPlayerBlackWhite.blacks == 2 && firstPlayerBlackWhite.blacks == 2) {
                            const wasBlack = prevPairings.slice(prevPairings.length - (players.length / 2), prevPairings.length).some(p => p.secondPlayer._id === pairing.secondPlayer._id);
                            if (wasBlack) {
                                return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                            } else {
                                return pairing
                            }
                        }
                        if (secondPlayerBlackWhite && firstPlayerBlackWhite && secondPlayerBlackWhite.whites == 2 && firstPlayerBlackWhite.whites == 2) {
                            const wasWhite = prevPairings.slice(prevPairings.length - (players.length / 2), prevPairings.length).some(p => p.firstPlayer._id === firstPlayerBlackWhite._id);
                            if (wasWhite) {
                                return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                            } else {
                                return pairing
                            }
                        }
                        if (secondPlayerBlackWhite && firstPlayerBlackWhite && secondPlayerBlackWhite.whites === 2 && firstPlayerBlackWhite.whites === 2) {
                            return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        if (secondPlayerBlackWhite && secondPlayerBlackWhite.blacks === 2) {
                            return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        if (firstPlayerBlackWhite && firstPlayerBlackWhite.whites === 2) {
                            return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                    } else {
                        if (secondPlayerBlackWhite && firstPlayerBlackWhite && secondPlayerBlackWhite.blacks == 3 && firstPlayerBlackWhite.blacks == 3) {
                            const wasBlack = prevPairings.slice(prevPairings.length - (players.length / 2), prevPairings.length).some(p => p.secondPlayer._id === pairing.secondPlayer._id);
                            if (wasBlack) {
                                return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                            } else {
                                return pairing
                            }
                        }
                        if (secondPlayerBlackWhite && firstPlayerBlackWhite && secondPlayerBlackWhite.whites == 3 && firstPlayerBlackWhite.whites == 3) {
                            const wasWhite = prevPairings.slice(prevPairings.length - (players.length / 2), prevPairings.length).some(p => p.firstPlayer._id === firstPlayerBlackWhite._id);
                            if (wasWhite) {
                                return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                            } else {
                                return pairing
                            }
                        }
                        if (secondPlayerBlackWhite && secondPlayerBlackWhite.blacks === 3) {
                            return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                        if (firstPlayerBlackWhite && firstPlayerBlackWhite.whites === 3) {
                            return { firstPlayer: pairing.secondPlayer, secondPlayer: pairing.firstPlayer }
                        }
                    }
                }
                return pairing
            })
            .sort((a, b) => {
                const maxPointsA = Math.max(a.firstPlayer.points, a.secondPlayer.points);
                const maxPointsB = Math.max(b.firstPlayer.points, b.secondPlayer.points);
                return maxPointsB - maxPointsA;
            })
            .sort((a, b) => {
                if (a.secondPlayer._id === 'BYE') {
                    return 1;
                } else if (b.secondPlayer._id === 'BYE') {
                    return -1;
                } else {
                    return 0;
                }
            })).map((pairing) => {
                return {
                    firstPlayer: { ...pairing.firstPlayer, points: 0, blacks: 0, whites: 0, draws: 0, eloChange: 0, wins: 0, loses: 0 },
                    secondPlayer: { ...pairing.secondPlayer, points: 0, blacks: 0, whites: 0, draws: 0, eloChange: 0, wins: 0, loses: 0 }
                }
            })
    }

    return generate()
}