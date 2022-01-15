let socket = new WebSocket("ws://localhost:8080/ws")

socket.onopen = function (e) {
  console.log("[open] Connection established");
  socket.send("parse");
};

let messages = []
let currentTickI = 0
let playing = true
let ticks = new Set()

socket.onmessage = function (event) {
  // console.log(`[message] Data received from server: ${event.data}`);
  let msg = JSON.parse(event.data)

  switch (msg.msgType) {
    case 4:
      handleInitMessage(msg.init);
      break
    case 5:
      console.log("done loading, playing demo now");
      document.getElementById("loadingProgress").remove()
      handleInitMessage(msg.init);
      play();
      break;
    case 6:
      msg.round.Ticks.forEach(addTick);
      break;
    case 7:
      updateLoadProgress(msg);
      break;
    default:
      addTick(msg)
  }
};

function updateLoadProgress(msg) {
  document.getElementById("loadingProgress").setAttribute("value",
      msg.progress.Progress);
}

function addTick(msg) {
  if (!messages[msg.tick]) {
    messages[msg.tick] = [];
  }
  messages[msg.tick].push(msg);
  ticks.add(msg.tick)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function play() {
  const interval = 15;
  let promise = Promise.resolve();

  promise.then(function () {
    console.log('Loop finished.');
  });

  let tickArray = Array.from(ticks)
  for (; currentTickI < tickArray.length && playing; currentTickI++) {
    let tickMessages = messages[tickArray[currentTickI]]
    playTick(tickMessages);
    await sleep(interval);
  }
}

function togglePlay() {
  playing = !playing
  if (playing) {
    play()
  }
}

function playTick(tickMessages) {
  tickMessages.forEach(function (msg) {
    switch (msg.msgType) {
      case 0:
        handleScoreUpdate(msg.teamUpdate);
        break
      case 1:
        playerUpdate(msg.playerUpdate);
        break
      case 2:
        handleAddPlayer(msg.addPlayer);
        break
      case 3:
        removePlayer(msg.removePlayer.PlayerId);
        break;
      case 8:
        updateTime(msg.roundTime);
        break;
      case 9:
        handleShot(msg.shot);
        break;
      default:
        console.log(`I don't know this message type ${msg.msgType}`);
        console.log(msg);
    }
  })
}

socket.onclose = function (event) {
  if (event.wasClean) {
    console.log(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    console.log('[close] Connection died');
  }
};

socket.onerror = function (error) {
  console.log(`[error] ${error.message}`);
};

function handleScoreUpdate(msg) {
  document.getElementById("TName").innerHTML = msg.TName
  document.getElementById("CTName").innerHTML = msg.CTName
  document.getElementById("TScore").innerHTML = msg.TScore
  document.getElementById("CTScore").innerHTML = msg.CTScore
}

function updateTime(roundTime) {
  document.getElementById("timer").innerHTML = roundTime.RoundTime;
}

function handleAddPlayer(msg) {
  // first remove the player to avoid duplicates
  removePlayer(msg.PlayerId)

  // add player to the list
  let listItem = document.createElement("li");
  listItem.id = `playerListItem${msg.PlayerId}`;
  listItem.innerHTML = `${msg.Name} (${msg.PlayerId})`;

  document.getElementById(msg.Team + "List").appendChild(listItem);

  // add player to the map
  let mapItemPlayer = document.createElement("div");
  mapItemPlayer.className = `player ${msg.Team}`;
  mapItemPlayer.id = `playerMap${msg.PlayerId}`;
  mapItemPlayer.style.left = msg.X + "%";
  mapItemPlayer.style.top = msg.Y + "%";

  let playerArrowContainer = document.createElement("div");
  playerArrowContainer.id = `playerContainer${msg.PlayerId}`;
  playerArrowContainer.className = `playerArrowContainer ${msg.Team}`;

  let playerArrow = document.createElement("div");
  playerArrow.id = `playerArrow${msg.PlayerId}`;
  playerArrow.className = `playerArrow ${msg.Team}`;

  playerArrowContainer.appendChild(playerArrow);
  mapItemPlayer.appendChild(playerArrowContainer);
  document.getElementById("map").appendChild(mapItemPlayer);
}

function handleInitMessage(msg) {
  console.log("init", msg);
  document.getElementById("TName").innerHTML = msg.TName
  document.getElementById("CTName").innerHTML = msg.CTName
  document.getElementById(
      "map").style.backgroundImage = `url(\"https://raw.githubusercontent.com/zoidbergwill/csgo-overviews/master/overviews/${msg.mapName}.jpg\")`
}

function removePlayer(playerId) {
  let playerListItem = document.getElementById(`playerListItem${playerId}`)
  if (document.contains(playerListItem)) {
    playerListItem.remove();
  }

  let playerMap = document.getElementById(`playerMap${playerId}`)
  if (document.contains(playerMap)) {
    playerMap.remove();
  }
}

function playerUpdate(playerUpdate) {
  playerUpdate.Players.forEach(updatePlayer);

  function updatePlayer(player) {
    let mapItem = document.getElementById(`playerMap${player.PlayerId}`);
    if (mapItem) {
      mapItem.style.left = player.X + "%";
      mapItem.style.top = player.Y + "%";
    }

    let playerArrow = document.getElementById(`playerArrow${player.PlayerId}`);
    if (playerArrow) {
      playerArrow.style.transform = `rotate(${player.Rotation}deg) translateY(-35%)`;
    }

    let playerShot = document.getElementById(`playerShot${player.PlayerId}`);
    if (playerShot) {
      playerShot.style.transform = `rotate(${player.Rotation}deg) translateY(-100%)`;
    }
  }
}

function handleShot(shotMsg) {
  console.log(shotMsg);
  let shot = document.createElement("div");
  shot.className = "playerShot";
  shot.style.top = shotMsg.Y + "%";
  shot.style.left = shotMsg.X + "%";
  shot.style.transform = `rotate(${shotMsg.Rotation}deg) translateY(-100%)`

  document.getElementById("map").appendChild(shot);
  setTimeout(function () {
    shot.style.transform = `rotate(${shotMsg.Rotation}deg) translateY(-1000%)`
  }, 10)
}
