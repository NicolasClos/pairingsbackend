import { tournamentSchema, playerSchema } from "./index.js";

const userSchema = {
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    company: {
        type: String,
        default: '',
        unique: true,
    },
    hasResults: {
        type: Boolean,
        default: false
    },
    hasToast: {
        type: Boolean,
        default: false,
    },
    tournaments: [tournamentSchema],
    players: [playerSchema]
};

export default userSchema;