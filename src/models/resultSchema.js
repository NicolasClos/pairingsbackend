import { playerSchema } from './index.js';

const resultSchema = {
    ...playerSchema,
    points: {
        type: Number
    },
};

export default resultSchema;

