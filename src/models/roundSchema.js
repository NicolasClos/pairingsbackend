import { playerSchema } from "./index.js";

const roundSchema = {
    id: {
        type: Number,
        required: true
    },
    players: [playerSchema]
};

export default roundSchema;
