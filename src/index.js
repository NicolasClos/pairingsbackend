import express from 'express';
import mongoose from 'mongoose';
import loginRouter from './routes/auth/login.js';
import usersRouter from './routes/users/users.js';
import playersRouter from './routes/players/players.js';
import tournamentsRouter from './routes/tournaments/tournaments.js';
import cors from 'cors';

const app = express();

const WHITELIST = process.env.URL_WHITELIST;
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;

app.use(cors({ origin: WHITELIST }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes

app.use('/api/v1/auth', loginRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/users', playersRouter);
app.use('/api/v1/users', tournamentsRouter);

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB: ', error);
  });