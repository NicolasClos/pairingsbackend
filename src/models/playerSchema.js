const playerSchema = {
    name: {
        type: String,
        required: true,
    },
    surname: {
        type: String,
        required: true,
    },
    elo: {
        type: Number,
        default: 1500,
    },
    games: {
        type: Number,
        default: 0,
    },
    wins: {
        type: Number,
        default: 0,
    },
    loses: {
        type: Number,
        default: 0,
    },
    draws: {
        type: Number,
        default: 0,
    },
    enteredWithBye: {
        type: Number,
        default: 0
    }
};

export default playerSchema;
