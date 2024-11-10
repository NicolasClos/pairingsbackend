export default function GenerateRoundRobinPairings(roundPlayers, prevPairings, roundNumber) {

    let players = roundPlayers.slice();

    let prevPairingsReverse = new Set([
        ...prevPairings.map(pairing => [pairing.firstPlayer._id, pairing.secondPlayer._id].sort().join('-')),
        ...prevPairings.map(pairing => [pairing.secondPlayer._id, pairing.firstPlayer._id].sort().join('-'))
    ]);

    players = players.slice().sort(() => Math.random() - 0.5);

    if (players.length % 2 !== 0) {
        const byePlayer = { _id: 'BYE', name: 'BYE', surname: '', blacks: 0, whites: 0, points: 0 };
        players.push(byePlayer);
    }

    let pairings = [];
    for (let i = 0; i < players.length; i++) {
        let firstPlayer = players[i];

        for (let j = i + 1; j < players.length; j++) {
            let secondPlayer = players[j];
            if (firstPlayer._id !== secondPlayer._id) {
                const pairingId = [firstPlayer._id, secondPlayer._id].sort().join('-');
                if (!prevPairingsReverse.has(pairingId)) {
                    pairings.push({ firstPlayer: firstPlayer, secondPlayer: secondPlayer });
                }
            }
        }
    }

    function generate() {
        let roundPairings = [];
        let addedPlayers = new Set();

        pairings.sort(() => Math.random() - 0.5).forEach(pairing => {
            if (
                !addedPlayers.has(pairing.firstPlayer._id) &&
                !addedPlayers.has(pairing.secondPlayer._id)
            ) {
                roundPairings.push(pairing);
                addedPlayers.add(pairing.firstPlayer._id);
                addedPlayers.add(pairing.secondPlayer._id);
            }
        });

        for(let i = 0; i<25;i++){
            if ((roundPairings.length !== players.length / 2)) {
                addedPlayers.clear();
                roundPairings = [];
    
                pairings.sort(() => Math.random() - 0.5).forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.push(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                });
            } else {
                break;
            }
        }

        for(let i = 0; i<25;i++){
            if ((roundPairings.length !== players.length / 2)) {
                addedPlayers.clear();
                roundPairings = [];
    
                pairings.forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.push(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                });
            } else {
                break;
            }
        }

        for(let i = 0; i<25;i++){
            if ((roundPairings.length !== players.length / 2)) {
                addedPlayers.clear();
                roundPairings = [];
    
                pairings.sort(() => Math.random() - 0.5).forEach(pairing => {
                    if (
                        !addedPlayers.has(pairing.firstPlayer._id) &&
                        !addedPlayers.has(pairing.secondPlayer._id)
                    ) {
                        roundPairings.push(pairing);
                        addedPlayers.add(pairing.firstPlayer._id);
                        addedPlayers.add(pairing.secondPlayer._id);
                    }
                });
            } else {
                break;
            }
        }

        return roundPairings
            .sort((a, b) => {
                if (roundNumber === 1) {
                    const maxEloA = Math.max(a.firstPlayer.elo, a.secondPlayer.elo);
                    const maxEloB = Math.max(b.firstPlayer.elo, b.secondPlayer.elo);
                    return maxEloB - maxEloA;
                } else {
                    const maxPointsA = Math.max(a.firstPlayer.points, a.secondPlayer.points);
                    const maxPointsB = Math.max(b.firstPlayer.points, b.secondPlayer.points);
                    return maxPointsB - maxPointsA;
                }
            })
            .sort((a, b) => {
                if (a.secondPlayer._id === 'BYE') {
                    return 1;
                } else if (b.secondPlayer._id === 'BYE') {
                    return -1;
                } else {
                    return 0;
                }
            });
    }

    return generate();
}