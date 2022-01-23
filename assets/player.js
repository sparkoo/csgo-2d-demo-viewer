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
        tickState(msg.tickState);
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
      case 14:
        handleGrenadeEvent(msg.grenadeEvent);
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
  // first remove the player to avoid duplicates
  removePlayer(msg.PlayerId)

  // add player to the list
  listItem = document.createElement("li");
  listItem.id = `playerListItem${msg.PlayerId}`;
  listItem.innerHTML = `${msg.Name} (${msg.PlayerId})`;

  document.getElementById(msg.Team + "List").appendChild(listItem);

  // add player to the map
  let mapItemPlayer = document.createElement("div");
  mapItemPlayer.className = `player ${msg.Team} deletable`;
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

  let playerWeapon = document.createElement("div")
  playerWeapon.id = `playerMapWeapon${msg.PlayerId}`
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
  let playerListItem = document.getElementById(`playerListItem${playerId}`)
  if (playerListItem) {
    playerListItem.remove();
  }

  let playerMap = document.getElementById(`playerMap${playerId}`)
  if (playerMap) {
    playerMap.remove();
  }
}

function tickState(tick) {
  for (let nade of document.getElementsByClassName("deletable")) {
    nade.classList.add("toDelete");
  }

  tick.Players.forEach(updatePlayer);

  updateNades(tick.Nades);

  for (let toDeleteElement of document.getElementsByClassName("toDelete")) {
    toDeleteElement.remove();
  }

  function updatePlayer(player) {
    let mapItem = document.getElementById(`playerMap${player.PlayerId}`);
    if (mapItem) {
      // if player changed the ream, we add it again
      if (!mapItem.classList.contains(player.Team)) {
        handleAddPlayer(player)
      }

      mapItem.style.left = player.X + "%";
      mapItem.style.top = player.Y + "%";
      mapItem.classList.remove("toDelete")
      if (player.Alive) {
        mapItem.style.opacity = "1";
        let playerArrow = document.getElementById(
            `playerArrow${player.PlayerId}`);
        if (playerArrow) {
          playerArrow.style.transform = `rotate(${player.Rotation}deg) translateY(-40%)`;
        }

        if (player.Flashed) {
          mapItem.classList.add("flashed");
        } else {
          mapItem.classList.remove("flashed");
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
    } else {
      handleAddPlayer(player);
    }
  }
}

function updateNades(nades) {
  nades.forEach(updateNade);

  function updateNade(nade) {
    let nadeId = `mapNade${nade.id}`
    let mapItemNade = document.getElementById(nadeId)
    if (mapItemNade) {
      mapItemNade.style.left = nade.x + "%";
      mapItemNade.style.top = nade.y + "%";
      mapItemNade.classList.remove("toDelete")
      if (nade.action) {
        mapItemNade.classList.add(nade.action)
      }
    } else {
      mapItemNade = document.createElement("div");
      mapItemNade.className = `mapNade ${nade.kind} deletable ${nade.action}`;
      mapItemNade.id = `mapNade${nade.id}`
      mapItemNade.style.left = nade.x + "%";
      mapItemNade.style.top = nade.y + "%";
      document.getElementById("map").appendChild(mapItemNade);
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

function handleGrenadeEvent(nade) {
  let mapItemNade = document.createElement("div");
  mapItemNade.className = `mapNade ${nade.kind}`;
  mapItemNade.style.left = nade.x + "%";
  mapItemNade.style.top = nade.y + "%";
  document.getElementById("map").appendChild(mapItemNade);
  setTimeout(function () {
    mapItemNade.classList.add(nade.action)
  }, 10)
  setTimeout(function () {
    mapItemNade.remove()
  }, 300)
}

function handleKill(kill) {
  // let player = document.getElementById(`playerMap${kill.VictimId}`);
  // if (player) {
  //   player.style.opacity = ".2";
  // }
}
