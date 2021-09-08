const EventEmitter = require("events");
const Leaderboard = require("./leaderboard.js");
const Game = require("./game.js");
const HangmanGame = require("./game_hangman.js");

class GameHandler extends EventEmitter {
  constructor(Trivia) {
    super();
    
    this.Trivia = Trivia;
    this.leaderboard = new Leaderboard();

    this.activeGames = {};
  }

  getActiveGame(id) {
    return this.activeGames[id];
  }

  getGameCount() {
    return Object.keys(this.activeGames).length;
  }

  dumpGames() {
    return this.activeGames;
  }

  createGame(GameHandler, channelId, groupID, ownerID, options, gameMode) {
    if(gameMode === "hangman") {
      var game = new HangmanGame(GameHandler, channelId, groupID, ownerID, options, gameMode);
      return game;
    }
    else {
      return new Game(GameHandler, channelId, groupID, ownerID, options, gameMode);
    }
  }
}

module.exports = GameHandler;