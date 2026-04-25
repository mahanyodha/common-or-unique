console.log("JS LOADED");
function createRoom() {
  console.log("Create clicked"); // DEBUG

  name = document.getElementById("name").value;

  if (!name) {
    alert("Enter your name");
    return;
  }

  room = Math.random().toString(36).substring(2, 7).toUpperCase();

  console.log("Room created:", room);

socket.emit("join", { room, name });
  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");

  document.getElementById("roomDisplay").innerText = "Room: " + room;
}const socket = io();

let room, name, isHost = false, myEntries = [];
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function createRoom() {
  name = document.getElementById("name").value;

  if (!name) {
    alert("Enter your name first");
    return;
  }

  room = generateRoomCode();

  socket.emit("join", { room, name });

  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");

  alert("Room Code: " + room + " (Share this with friends)");
}
function join() {
  console.log("Join clicked"); // DEBUG

  name = document.getElementById("name").value;
  room = document.getElementById("room").value.toUpperCase();

  if (!name || !room) {
    alert("Enter name and room code");
    return;
  }

  socket.emit("join", { room, name });

  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
}
  socket.emit("join", { room, name });

  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");


socket.on("players", (data) => {

  console.log("PLAYERS:", data); // 👈 DEBUG

  let div = document.getElementById("players");

  div.innerHTML = "";

  data.players.forEach(p => {
    if (p && p.name) {
      div.innerHTML += `<p>${p.name}</p>`;
    }
  });


  isHost = data.host === socket.id;

  if (isHost) {
    document.getElementById("hostControls").classList.remove("hidden");
  }
});

function start() {
  socket.emit("start", {
    room,
    prompt: document.getElementById("prompt").value,
    timer: document.getElementById("timer").value
  });
}

socket.on("startGame", data => {
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  document.getElementById("promptDisplay").innerText = data.prompt;
  document.getElementById("roundInfo").innerText = "Round " + data.round;

  startTimer(data.timer);
});

function startTimer(t) {
  let d = document.getElementById("timerDisplay");

  let i = setInterval(() => {
    d.innerText = "⏱ " + t;
    t--;

    if (t < 0) {
      clearInterval(i);
      submitEntries();
    }
  }, 1000);
}

function submitEntries() {
  myEntries = document.getElementById("entries").value.split(",").map(e => e.trim());

  socket.emit("submitEntries", {room, name, entries: myEntries});
}

socket.on("allSubmitted", () => {
  document.getElementById("game").classList.add("hidden");
});

socket.on("turnPlayer", p => {
  document.getElementById("turn").classList.remove("hidden");
  document.getElementById("turnPlayer").innerText = p + "'s Turn";
});

socket.on("yourTurn", data => {
  let role = document.getElementById("roleReveal");
  role.innerText = data.role;
  role.style.animation = "pop 0.5s";

  let select = document.getElementById("choices");
  select.innerHTML = "";

  myEntries.forEach(e => {
    select.innerHTML += `<option>${e}</option>`;
  });
});

function submitChoice() {
  let choice = document.getElementById("choices").value;
  socket.emit("choose", {room, name, choice});
}

socket.on("roundResult", data => {
  updateLeaderboard(data.scores);
});

socket.on("newRound", data => {
  document.getElementById("leaderboard").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  document.getElementById("roundInfo").innerText = "Round " + data.round;
});

socket.on("gameOver", scores => {
  updateLeaderboard(scores);
});

function updateLeaderboard(scores) {
  document.getElementById("leaderboard").classList.remove("hidden");

  let sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]);

  let html = sorted.map((p,i) =>
    `<p style="font-size:${24 - i*2}px">${i+1}. ${p[0]} - ${p[1]}</p>`
  ).join("");

  document.getElementById("scores").innerHTML = html;
}
