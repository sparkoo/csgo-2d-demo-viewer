let socket = new WebSocket("ws://localhost:8080/ws")

socket.onopen = function (e) {
  console.log("[open] Connection established");
  const urlParams = new URLSearchParams(window.location.search);
  socket.send(JSON.stringify(
      {
        "msgType": 12,
        "demo": {
          "filename": urlParams.get("demo")
        }
      }));
};

let messages = []
let currentTickI = 0
let playing = true
let ticks = new Set()

let rounds = []
let playingRoundI = 0
let playingTickI = 0

let interval = 15;

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
      handleAddRound(msg.round)
      // msg.round.Ticks.forEach(addTick);
      break;
    case 7:
      updateLoadProgress(msg);
      break;
    default:
      addTick(msg);
  }
};

function handleAddRound(roundMsg) {
  let roundTicks = []
  let tickMessages = []
  let currentTick = roundMsg.Ticks[0].tick
  roundMsg.Ticks.forEach(function (tick) {
    if (tick.tick !== currentTick) {
      roundTicks.push(tickMessages);
      tickMessages = []
      currentTick = tick.tick;
    }
    tickMessages.push(tick);
  })

  roundMsg.Ticks = roundTicks;
  rounds.push(roundMsg);
}

function updateLoadProgress(msg) {
  let progressValue = document.getElementById("loadingProgressValue");
  if (progressValue) {
    progressValue.style.width = `${msg.progress.Progress}%`;
  }
}

function addTick(msg) {
  if (!messages[msg.tick]) {
    messages[msg.tick] = [];
  }
  messages[msg.tick].push(msg);
  ticks.add(msg.tick)
}

function play() {
  let promise = Promise.resolve();

  promise.then(function () {
    console.log('Loop finished.');
  });

  let round = rounds[playingRoundI]
  playRound(round)
}

function playRound(round) {
  let player = setInterval(function () {
    if (currentTickI >= round.Ticks.length + 1) {
      if (playingRoundI >= rounds.length) {
        playing = false;
      } else {
        //TODO: somehow play next round, this does not work
        playingRoundI++;
        round = rounds[playingRoundI];
      }
    }
    if (!playing) {
      clearInterval(player);
    }
    //TODO: it fails here and I'm not sure why, index overflow should be handled at the top
    playTick(round.Ticks[currentTickI]);
    currentTickI++
  }, interval)
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
        // case 0:
        //   handleScoreUpdate(msg.teamUpdate);
        //   break
      case 1:
        playerUpdate(msg.playerUpdate);
        break
        // case 2:
        //   handleAddPlayer(msg.addPlayer);
        //   break
        // case 3:
        //   removePlayer(msg.removePlayer.PlayerId);
        //   break;
      case 8:
        updateTime(msg.roundTime);
        break;
      case 9:
        handleShot(msg.shot);
        break;
      case 11:
        handleKill(msg.kill);
        break;
      case 10:
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
  // if player is already there and in correct team, we do nothing
  // TODO: we should update stats when it's there
  let listItem = document.getElementById(
      `${msg.Team}playerListItem${msg.PlayerId}`)
  if (listItem) {
    return;
  }

  // first remove the player to avoid duplicates
  removePlayer(msg.PlayerId)

  // add player to the list
  listItem = document.createElement("li");
  listItem.id = `${msg.Team}playerListItem${msg.PlayerId}`;
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
    handleAddPlayer(player);

    let mapItem = document.getElementById(`playerMap${player.PlayerId}`);
    if (mapItem) {
      mapItem.style.left = player.X + "%";
      mapItem.style.top = player.Y + "%";
      mapItem.style.opacity = "1";
    }

    let playerArrow = document.getElementById(`playerArrow${player.PlayerId}`);
    if (playerArrow) {
      playerArrow.style.transform = `rotate(${player.Rotation}deg) translateY(-40%)`;
    }

    let playerShot = document.getElementById(`playerShot${player.PlayerId}`);
    if (playerShot) {
      playerShot.style.transform = `rotate(${player.Rotation}deg) translateY(-100%)`;
    }
  }
}

function handleShot(shotMsg) {
  let shot = document.createElement("div");
  shot.className = "playerShot";
  shot.style.top = shotMsg.Y + "%";
  shot.style.left = shotMsg.X + "%";
  shot.style.transform = `rotate(${shotMsg.Rotation}deg) translateY(-100%)`

  document.getElementById("map").appendChild(shot);
  setTimeout(function () {
    shot.style.transform = `rotate(${shotMsg.Rotation}deg) translateY(-500%)`
  }, 10)
  setTimeout(function () {
    shot.remove();
  }, 100)
}

function handleKill(kill) {
  let player = document.getElementById(`playerMap${kill.VictimId}`);
  if (player) {
    player.style.opacity = ".2";
  }
}
