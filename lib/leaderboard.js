module.exports = () => {
  var fs = require("fs");

  var readScores, writeScores;

  // If the stats folder does not exist, create it.
  function initStatFolder() {
    try {
      fs.mkdirSync("./Scores");
    }
    catch(err) {
      // Ignore error if it's a "directory already exists" error
      if(err.code !== "EEXIST") {
        throw err;
      }
    }
  }

  // # makeScoreStr # //
  // Formerly fetchFinalScores
  // Returns a string containing a game's complete leaderboard.
  function makeScoreStr(scores, totalParticipants, largeMode) {
    var scoreArray = [];
    var finalStr = "";

    for(var user in scores) {
      scoreArray.push(user);
    }

    var scoreA, scoreB;
    scoreArray.sort((a, b) => {
      scoreA = scores[a] || 0;
      scoreB = scores[b] || 0;

      return scoreB - scoreA;
    });

    // TEMPORARY: Cap the user count at 48 to prevent character overflow.
    // This will later be fixed so the bot splits the list instead of truncating it.
    var scoreArrayFull;
    var scoreArrayTruncate = 0;
    if(scoreArray.length > 48) {
      scoreArrayFull = scoreArray;
      scoreArray = scoreArray.slice(0,48);

      scoreArrayTruncate = 1;
    }

    scoreArray.forEach((userB) => {
      var score;
      if(typeof scores[userB] === "undefined") {
        score = 0;
      }
      else {
        score = scores[userB];
      }

      if(largeMode) {
        finalStr = `${finalStr}${finalStr!==""?"\n":""}**${totalParticipants[userB]}** - ${score.toLocaleString()} points`;
      } else {
        finalStr = `${finalStr}${finalStr!==""?"\n":""}${totalParticipants[userB]}: ${score.toLocaleString()}`;
      }
    });

    if(scoreArrayTruncate) {
      finalStr = `${finalStr}\n*+ ${scoreArrayFull.length-48} more*`;
    }

    return finalStr;
  }

  // # readScores # //
  // Reads scores from file and passes them through as JSON data.
  readScores = (guildId, section, includeProperties) => {
    if(typeof section === "undefined") {
      section = "DEFAULT";
    }

    var json = JSON.parse(fs.readFileSync("./Scores/scores.json"));

    // Throw a unique error if the board is detected as empty.
    if(typeof json[guildId] === "undefined" || typeof json[guildId][section] === "undefined" || Object.keys(json[guildId][section]).length === 1) {
      throw new Error("Leaderboard is empty");
    }

    // Update the scores based on their properties.
    var prop = json[guildId][section]["Properties"];

    if(prop.expireDate !== "undefined") {
      if(new Date().getTime() > new Date(prop.expireDate)) {
        // Leaderboard has expired, so we'll treat it like it's empty.
        throw new Error("Leaderboard is empty");
      }
    }

    if(!includeProperties) {
      // Delete the properties before passing it.
      delete json[guildId][section]["Properties"];
    }

    return json[guildId][section];
  };

  // # writeScores # //
  // Appends an array of scores to an existing file, retaining persistent scores.
  writeScores = (scores, guildId, section) => {
    if(!fs.existsSync("./Scores/scores.json")) {
      initStatFolder();
    }

    if(typeof section === "undefined") {
      section = "DEFAULT";
    }

    var scoresOld = {};
    if(fs.existsSync("./Scores/scores.json")) {
      // Back up the leaderboard file before each write.
      fs.copyFileSync("./Scores/scores.json", "./Scores/scores.json.bak");

      try {
        scoresOld = readScores(guildId, section, true);
      }
      catch(err) {
        if(err.message !== "Leaderboard is empty") {
          throw err;
        }
      }
    }

    var scoresFinal = scoresOld;
    for(var user in scores) {
      if(typeof scoresFinal[user] !== "number") {
        scoresFinal[user] = 0;
      }

      if(typeof scores[user] !== "number") {
        scores[user] = 0;
      }

      scoresFinal[user] += scores[user];
    }

    // Initialization and passthrough of the properties object
    var propertiesOld = {};
    if(typeof scoresOld["Properties"] !== "undefined") {
      propertiesOld = scoresOld["Properties"];
      delete scoresOld["Properties"];
    }

    // Re-set the properties so they stay on the bottom.
    scoresFinal["Properties"] = propertiesOld;

    // Assign new properties where relevant.
    scoresFinal["Properties"].writeTime = new Date();

    // Section-specific tasks
    // For the Monthly section, assign an expiration date if there is none.
    if(section === "MONTHLY") {
      if(typeof scoresFinal["Properties"].expireDate === "undefined") {
        var dCurr = new Date();
        var dExp = new Date();
        dExp.setMonth(dCurr.getMonth()+1);
        dExp.setDate(1);
        dExp.setMinutes(0);
        dExp.setHours(0);
        dExp.setSeconds(0);
        dExp.setMilliseconds(0);
        scoresFinal["Properties"].expireDate = dExp;
      }
    }

    // Assign score data to the correct sections.
    var scoreData = {};
    scoreData[guildId] = {};
    scoreData[guildId][section] = scoresFinal;

    fs.writeFile("./Scores/scores.json", JSON.stringify(scoreData, null, "\t"), "utf8", (err) => {
      if(err) {
        console.error("Failed to write scores with error: " + err.message);
      }
    });
  };

  //

  return { writeScores, readScores, makeScoreStr };
};