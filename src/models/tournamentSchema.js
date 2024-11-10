import {playerSchema, resultSchema, roundSchema} from './index.js'


const tournamentSchema = {
    name: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        default: 'Suizo',
    },
    roundsQuantity: {
        type: Number,
        default: 6,
    },
    repeat: {
        type: Boolean,
        default: false,
    },
    status: {
        type: Number,
        deafult: 0
    },
    bye: {
        type: Number,
        default: 0,
    },
    players: [playerSchema],
    rounds: [roundSchema],
    results: [resultSchema]
};

export default tournamentSchema;

