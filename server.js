const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

function normalize(t) {
  return t.trim().toLowerCase();
}

io.on("connection", socket => {

  socket.on("join", ({room, name}) => {
    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        host: socket.id,
        entries: {},
        roles: {},
        scores: {},
        turnIndex: 0,
        round: 1,
        maxRounds: 3,
        prompt: "",
        timer: 30,
        locked: false
      };
    }

    let r = rooms[room];

    r.players.push({id: socket.id, name});
    r.scores[name] = 0;

    io.to(room).emit("players", {
      players: r.players,
      host: r.host
    });
  });

  socket.on("start", ({room, prompt, timer}) => {
    let r = rooms[room];

    if (socket.id !== r.host) return; // only host

    r.prompt = prompt;
    r.timer = timer;
    r.entries = {};
    r.turnIndex = 0;
    r.locked = false;

    r.players.forEach(p => {
      r.roles[p.name] = Math.random() > 0.5 ? "COMMON" : "UNIQUE";
    });

    io.to(room).emit("startGame", {
      prompt,
      timer,
      round: r.round
    });
  });

  socket.on("submitEntries", ({room, name, entries}) => {
    let r = rooms[room];

    if (r.locked) return;

    r.entries[name] = entries.map(normalize);

    if (Object.keys(r.entries).length === r.players.length) {
      r.locked = true;
      io.to(room).emit("allSubmitted");
      startTurn(room);
    }
  });

  function startTurn(room) {
    let r = rooms[room];
    let player = r.players[r.turnIndex];

    io.to(player.id).emit("yourTurn", {
      role: r.roles[player.name]
    });

    io.to(room).emit("turnPlayer", player.name);
  }

  socket.on("choose", ({room, name, choice}) => {
    let r = rooms[room];
    if (!r.locked) return;

    choice = normalize(choice);

    let count = 0;

    Object.values(r.entries).forEach(arr => {
      if (arr.includes(choice)) count++;
    });

    let gain =
      r.roles[name] === "COMMON"
        ? count
        : (r.players.length - count);

    r.scores[name] += gain;

    io.to(room).emit("roundResult", {
      name,
      choice,
      gain,
      scores: r.scores
    });

    r.turnIndex++;

    if (r.turnIndex < r.players.length) {
      setTimeout(() => startTurn(room), 2000);
    } else {
      setTimeout(() => nextRound(room), 3000);
    }
  });

  function nextRound(room) {
    let r = rooms[room];

    if (r.round < r.maxRounds) {
      r.round++;
      r.turnIndex = 0;
      r.entries = {};
      r.locked = false;

      io.to(room).emit("newRound", {
        round: r.round
      });
    } else {
      io.to(room).emit("gameOver", r.scores);
    }
  }

});

http.listen(3000, () => console.log("Running on 3000"));