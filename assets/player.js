let socket = new WebSocket("ws://localhost:8080/ws")

socket.onopen = function (e) {
  console.log("[open] Connection established");
  const urlParams = new URLSearchParams(window.location.search);
  socket.send(JSON.stringify(
      {
        "msgType": 12,
        "demo": {
          "matchId": urlParams.get("matchId")
        }
      }));
};

let messages = []
let playing = true
let currentTickI = 0
let ticks = new Set()

let rounds = []
let playingRoundI = 0
let player

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
      progressDone();
      handleInitMessage(msg.init);
      initRounds();
      play();
      break;
    case 6:
      handleAddRound(msg.round)
      // msg.round.Ticks.forEach(addTick);
      break;
    case 7:
      updateLoadProgress(msg);
      break;
    case 13:
      alert(msg.error.message);
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

function initRounds() {
  let roundNavBar = document.getElementById("roundNavBar");
  rounds.forEach(function (round) {
    let roundNavItem = document.createElement("a");
    roundNavItem.href = "#"
    roundNavItem.className = `w3-button roundNav ${round.Winner}`
    roundNavItem.onclick = function () {
      playRound(round.RoundNo - 1)
    }
    roundNavItem.innerHTML = `${round.RoundNo}`
    roundNavItem.id = `roundNav${round.RoundNo}`

    roundNavBar.appendChild(roundNavItem)

    if (round.RoundNo <= 30 && round.RoundNo % 15 === 0) {
      roundNavBar.appendChild(document.createElement("br"))
    } else if (round.RoundNo > 30 && round.RoundNo % 6 === 0) {
      roundNavBar.appendChild(document.createElement("br"))
    }
  })
}

function updateLoadProgress(msg) {
  document.getElementById("loadingProgress").hidden = false;
  document.getElementById("controlPanel").hidden = true;
  document.getElementById(
      "loadingProgressValue").style.width = `${msg.progress.Progress}%`;
  document.getElementById(
      "loadingProgressMessage").innerHTML = msg.progress.Message;
}

function progressDone() {
  document.getElementById("loadingProgress").hidden = true;
  document.getElementById("controlPanel").hidden = false;
}

function addTick(msg) {
  if (!messages[msg.tick]) {
    messages[msg.tick] = [];
  }
  messages[msg.tick].push(msg);
  ticks.add(msg.tick)
}

function playRound(roundI) {
  playing = false
  clearInterval(player)
  playingRoundI = roundI
  currentTickI = 0
  highlightActiveRound(roundI)
  play()
}

function play() {
  playing = true;
  let round = rounds[playingRoundI]
  handleScoreUpdate(round.TeamState)
  highlightActiveRound(playingRoundI)
  player = setInterval(function () {
    if (currentTickI >= round.Ticks.length) {
      if (playingRoundI >= rounds.length) {
        playing = false;
      } else {
        playingRoundI++;
        round = rounds[playingRoundI];
        currentTickI = 0;
        handleScoreUpdate(round.TeamState)
        highlightActiveRound(playingRoundI)
      }
    }
    if (!playing) {
      clearInterval(player);
    }
    playTick(round.Ticks[currentTickI]);
    currentTickI++
  }, interval)
}

function highlightActiveRound(roundI) {
  Array.from(document.getElementsByClassName("roundNav")).forEach((item) => {
    item.classList.remove("active");
  })
  let roundNavItem = document.getElementById(`roundNav${roundI + 1}`)
  if (roundNavItem) {
    roundNavItem.classList.add("active")
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
      case 1:
        playerUpdate(msg.playerUpdate);
        break
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
      `playerListItem${msg.PlayerId}`)
  if (listItem) {
    if (msg.Alive) {
      listItem.style.opacity = "1"
    } else {
      listItem.style.opacity = ".5"
    }
    return;
  }

  // first remove the player to avoid duplicates
  removePlayer(msg.PlayerId)

  // add player to the list
  listItem = document.createElement("li");
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

  let playerNameTag = document.createElement("div");
  playerNameTag.id = `playerNameTag${msg.PlayerId}`
  playerNameTag.innerHTML = msg.Name
  playerNameTag.className = "playerNameTag"

  let playerWeapon = document.createElement("img")
  playerWeapon.id = `playerMapWeapon${msg.PlayerId}`
  playerWeapon.src = `/assets/icons/csgo/${msg.Weapon}.svg`
  playerWeapon.className = `playerMapWeapon ${msg.Weapon}`

  playerArrowContainer.appendChild(playerArrow);
  mapItemPlayer.appendChild(playerArrowContainer);
  mapItemPlayer.appendChild(playerNameTag);
  mapItemPlayer.appendChild(playerWeapon);
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
  console.log("removing ", playerId)
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
  removeOrphanedPlayers(playerUpdate.Players);
  playerUpdate.Players.forEach(updatePlayer);

  function updatePlayer(player) {
    handleAddPlayer(player);

    let mapItem = document.getElementById(`playerMap${player.PlayerId}`);
    if (mapItem) {
      mapItem.style.left = player.X + "%";
      mapItem.style.top = player.Y + "%";
      if (player.Alive) {
        mapItem.style.opacity = "1";
        let playerArrow = document.getElementById(
            `playerArrow${player.PlayerId}`);
        if (playerArrow) {
          playerArrow.style.transform = `rotate(${player.Rotation}deg) translateY(-40%)`;
        }

        document.getElementById(
            `playerNameTag${player.PlayerId}`).innerHTML = player.Name

        let playerWeapon = document.getElementById(
            `playerMapWeapon${player.PlayerId}`)
        playerWeapon.src = `/assets/icons/csgo/${player.Weapon}.svg`
        playerWeapon.className = `playerMapWeapon ${player.Weapon}`
        playerWeapon.hidden = false
      } else {
        document.getElementById(
            `playerMapWeapon${player.PlayerId}`).hidden = true
        mapItem.style.opacity = ".2";
      }
    }
  }
}

function removeOrphanedPlayers(players) {
  Array.from(document.getElementById("TList").children).forEach(
      function (playerItem) {
        playerItem.classList.add("deletePlayer");
      })
  Array.from(document.getElementById("CTList").children).forEach(
      function (playerItem) {
        playerItem.classList.add("deletePlayer");
      })
  players.forEach(function (player) {
    let playerItem = document.getElementById(`playerListItem${player.PlayerId}`)
    if (playerItem && playerItem.parentElement.classList.contains(
        player.Team)) {
      playerItem.classList.remove("deletePlayer")
    }
  })
  Array.from(document.getElementsByClassName("deletePlayer")).forEach(
      function (playerToDelete) {
        removePlayer(playerToDelete.id.replace("playerListItem", ""))
      })
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
  // let player = document.getElementById(`playerMap${kill.VictimId}`);
  // if (player) {
  //   player.style.opacity = ".2";
  // }
}
