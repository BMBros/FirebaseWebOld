// @flow

import firebase, {
  loadData,
  createGameHelper,
  checkIfGameExists,
  generateGameID,
  createGame,
  createQuestion,
  getQuestion,
  joinGame,
  createPlayer,
} from '../firebase';

import {
  noGames,
  oneGame,
  questions,
  empty,
} from './firebaseData/data';

describe('firebase', () => {
  beforeAll((done) => {
    // Prime Firebase connection so first test doesn't time out
    firebase.database().ref().once('value').then(() => {
      done();
    });
  }, 10000);
  describe('create player', () => {
    beforeEach(async () => {
      await loadData(empty);
    });

    it('should create a player and supply the key', async () => {
      const player = await createPlayer({ name: 'Steven' });
      expect(player.key).toBeDefined();
    });
  });

  describe('join game', () => {
    beforeEach(async () => {
      await loadData(oneGame);
    });
    it('should not let player join non-existant game', async () => {
      try {
        await joinGame('FAKE_KEY', 'Steven');
      } catch (error) {
        expect(error.message).toBe('Game does not exist');
      }
    });
    it('should not let fake player join real game', async () => {
      try {
        await joinGame('1234', 'Steven', 'Fake Player');
      } catch (error) {
        expect(error.message).toBe('Player does not exist');
      }
    });
  });
  describe('questions', () => {
    beforeEach(async () => {
      await loadData(questions);
    });
    it('should create a question', async () => {
      const question = await createQuestion({
        question: 'What color is mario?',
        answer: 'red',
      });
      expect(question.key).toBeDefined();
    });
    it('should read a question', async () => {
      const question = await getQuestion('-Ky237LlqjKRQ1WdxhIr');
      expect(question).toEqual({
        answer: 'red',
        question: 'What color is mario?',
      });
    });
  });
  describe('generateGameID', () => {
    it('should create a random game ID of length 5', () => {
      expect(generateGameID()).toBeTruthy();
      expect(generateGameID().length).toBe(5);
    });
  });
  describe('games', () => {
    const initalGameState = {
      questionnaire: 'FAKE_KEY',
      status: 'LOBBY',
      currentQuestionIndex: 0,
      totalQuestions: 0,
      players: {},
      hasSubmitted: {},
    };
    describe('no games present', () => {
      beforeEach(async () => {
        await loadData(noGames);
      });
      it('checkIfGameExists should be false', async () => {
        const game = await checkIfGameExists('1234');
        expect(game.keyExists).toBe(false);
      });
      it('createGameHelper should create game', async () => {
        const game = await createGameHelper(initalGameState, '1234');
        expect(game.key).toBeDefined();
      });
      it('creageGame should create game in Firebase with random game ID', async () => {
        const game = await createGame(initalGameState);
        expect(game.key).toBeDefined();
      });
    });
    describe('one game present', () => {
      beforeEach(async () => {
        await loadData(oneGame);
      });
      it('checkIfGameExists of proper ID should be true', async () => {
        const game = await checkIfGameExists('1234');
        expect(game.keyExists).toBe(true);
      });
      it('createGameHelper should not create game with same ID when it already exists', async () => {
        try {
          await createGameHelper(initalGameState, '1234');
        } catch (error) {
          expect(error.message).toBe('Game already exists');
        }
      });
      it('createGameHelper should be able to create game with different ID ', async () => {
        const game = await createGameHelper(initalGameState, '5342');
        expect(game.key).toBeDefined();
      });
      it('createGame should retry if existing game ID is taken', async () => {
        console.warn = jest.fn();
        expect(console.warn).not.toHaveBeenCalled();
        const success = await createGame(initalGameState, '1234');
        expect(success.key).toBeDefined();
        expect(console.warn).toHaveBeenCalled();
      });
    });
  });
});
