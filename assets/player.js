let websocketScheme = "wss"
if (location.host.includes("localhost")) {
  websocketScheme = "ws"
}
let socket = new WebSocket(`${websocketScheme}://${location.host}/ws`)

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

const defaultInterval = 16
let interval = defaultInterval

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

let roundProgressbar = document.getElementById("timerContainer")
let roundProgress = document.getElementById("timer")
roundProgressbar.onmousemove = function (e) {
  if (e.buttons === 1) {
    roundProgressUpdate(e.x)
  }
}
roundProgressbar.onmousedown = function (e) {
  roundProgressUpdate(e.x)
}
roundProgressbar.onmouseup = function () {
  play()
}
roundProgressbar.onmouseleave = function (e) {
  if (e.buttons === 1) {
    play()
  }
}

function stop() {
  playing = false
  clearInterval(player)
  document.getElementById("playToggleButton").innerHTML = "&#xe037;";
}

function roundProgressUpdate(x) {
  stop()
  let progressWidth = roundProgressbar.getBoundingClientRect().right
      - roundProgressbar.getBoundingClientRect().left
  x = x - roundProgressbar.getBoundingClientRect().left
  let progress = (x / progressWidth)
  roundProgress.style.width = `${progress * 100}%`

  let round = rounds[playingRoundI]
  currentTickI = Math.round(round.Ticks.length * progress)
  playTick(round.Ticks[currentTickI]);
}

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
  stop()
  playingRoundI = roundI
  currentTickI = 0
  highlightActiveRound(roundI)
  play()
}

function playRoundIncrement(increment) {
  stop()
  let shouldPlayRoundI = playingRoundI + increment
  if (shouldPlayRoundI < rounds.length && shouldPlayRoundI >= 0) {
    playRound(shouldPlayRoundI)
  } else {
    playRound(playingRoundI)
  }
}

function play() {
  playing = true;
  document.getElementById("playToggleButton").innerHTML = "&#xe034;";
  let round = rounds[playingRoundI]
  handleScoreUpdate(round.TeamState)
  highlightActiveRound(playingRoundI)
  clearInterval(player)
  player = setInterval(function () {
    if (currentTickI >= round.Ticks.length) {
      if (playingRoundI >= rounds.length) {
        stop()
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

    let progress = currentTickI / round.Ticks.length
    roundProgress.style.width = `${progress * 100}%`

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
  if (playing) {
    stop()
  } else {
    play()
  }
}

function playSpeed(multiplier) {
  stop()
  interval = defaultInterval / multiplier
  play()
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

function handlePlayerListItemUpdate(player) {
  if (!document.getElementById(
      `playerListItem${player.PlayerId}`)) {
    // nothing to update yet
    return
  }
  document.getElementById(
      `playerListItemName${player.PlayerId}`).innerHTML = `${player.Name}`
  document.getElementById(
      `playerListHpValue${player.PlayerId}`).style.width = `${player.Hp}%`
  document.getElementById(
      `playerListHpText${player.PlayerId}`).innerHTML = player.Hp

  let bombDef = document.getElementById(`playerListBombDef${player.PlayerId}`)
  if (player.Defuse) {
    bombDef.className = "w3-col l1 defuse"
  } else if (player.Bomb) {
    bombDef.className = `w3-col l1 c4 ${player.Weapon === "c4" ? "active" : ""}`
  } else {
    bombDef.className = "w3-col l1"
  }

  document.getElementById(
      `playerListPrimary${player.PlayerId}`).className = `w3-col l3
      ${player.Primary} ${player.Primary === player.Weapon ? "active" : ""}`

  document.getElementById(
      `playerListSecondary${player.PlayerId}`).className = `w3-col l2
      ${player.Secondary} ${player.Secondary === player.Weapon ? "active" : ""}`

  document.getElementById(
      `playerListKnife${player.PlayerId}`).className = `w3-col l2 knife ${player.Weapon
  === "knife" ? "active" : ""}`

  for (let gi = 0; gi < 4; gi++) {
    if (player.Grenades && gi < player.Grenades.length) {
      document.getElementById(
          `playerListG${gi
          + 1}${player.PlayerId}`).className = `w3-col l1 ${player.Grenades[gi]} ${player.Weapon
      === player.Grenades[gi] ? "active" : ""}`
    } else {
      document.getElementById(
          `playerListG${gi + 1}${player.PlayerId}`).className = `w3-col l1`
    }
  }
}

function handleAddPlayer(msg) {
  // first remove the player to avoid duplicates
  removePlayer(msg.PlayerId)

  let listItem = createPlayerListItem(msg)
  document.getElementById(msg.Team + "List").appendChild(listItem);

  let mapItem = createMapPlayer(msg)
  document.getElementById("map").appendChild(mapItem);
}

function createPlayerListItem(player) {
  // add player to the list
  let listItem = document.createElement("div");
  listItem.id = `playerListItem${player.PlayerId}`;
  listItem.className = "playerListItemContainer w3-row"

  let playerListItemFirstRow = document.createElement("div")
  playerListItemFirstRow.className = "playerListItem w3-row"

  let playerHpBar = document.createElement("div")
  playerHpBar.classList.add("playerListHp")
  playerHpBar.classList.add("w3-dark-grey")
  let playerHpBarValue = document.createElement("div")
  playerHpBarValue.id = `playerListHpValue${player.PlayerId}`
  playerHpBarValue.classList.add("playerListHpValue")
  playerHpBarValue.classList.add(player.Team)
  playerHpBarValue.style.width = `${player.Hp}%`
  playerHpBar.appendChild(playerHpBarValue)

  let playerListName = document.createElement("div")
  playerListName.id = `playerListItemName${player.PlayerId}`
  playerListName.classList.add("playerListItemName")
  playerListName.classList.add("w3-col")
  playerListName.classList.add("l10")
  playerListName.classList.add(player.Team)
  playerListName.innerHTML = player.Name

  let playerListHpText = document.createElement("div")
  playerListHpText.id = `playerListHpText${player.PlayerId}`
  playerListHpText.classList.add("playerListHpText")
  playerListHpText.classList.add("w3-col")
  playerListHpText.classList.add("l2")
  playerListHpText.classList.add(player.Team)
  playerListHpText.innerHTML = player.Hp

  playerListItemFirstRow.appendChild(playerHpBar)

  if (player.Team === "T") {
    playerListItemFirstRow.append(playerListName, playerListHpText)
  } else {
    playerListItemFirstRow.append(playerListHpText, playerListName)
  }

  let playerListItemSecondRow = document.createElement("div")
  playerListItemSecondRow.className = "w3-row playerListWeapons"

  let playerListBombDefuse = document.createElement("div")
  playerListBombDefuse.id = `playerListBombDef${player.PlayerId}`
  playerListBombDefuse.className = "w3-col l1"
  playerListBombDefuse.innerHTML = "&nbsp;"

  let playerListPrimaryWeapon = document.createElement("div")
  playerListPrimaryWeapon.id = `playerListPrimary${player.PlayerId}`
  playerListPrimaryWeapon.className = "w3-col l3"
  playerListPrimaryWeapon.innerHTML = "&nbsp;"

  let playerListSecondaryWeapon = document.createElement("div")
  playerListSecondaryWeapon.id = `playerListSecondary${player.PlayerId}`
  playerListSecondaryWeapon.className = "w3-col l2"
  playerListSecondaryWeapon.innerHTML = "&nbsp;"

  let playerListKnifeWeapon = document.createElement("div")
  playerListKnifeWeapon.id = `playerListKnife${player.PlayerId}`
  playerListKnifeWeapon.className = "w3-col l2 knife"
  playerListKnifeWeapon.innerHTML = "&nbsp;"

  let playerListG1Weapon = document.createElement("div")
  playerListG1Weapon.id = `playerListG1${player.PlayerId}`
  playerListG1Weapon.className = "w3-col l1"
  playerListG1Weapon.innerHTML = "&nbsp;"

  let playerListG2Weapon = document.createElement("div")
  playerListG2Weapon.id = `playerListG2${player.PlayerId}`
  playerListG2Weapon.className = "w3-col l1"
  playerListG2Weapon.innerHTML = "&nbsp;"

  let playerListG3Weapon = document.createElement("div")
  playerListG3Weapon.id = `playerListG3${player.PlayerId}`
  playerListG3Weapon.className = "w3-col l1"
  playerListG3Weapon.innerHTML = "&nbsp;"

  let playerListG4Weapon = document.createElement("div")
  playerListG4Weapon.id = `playerListG4${player.PlayerId}`
  playerListG4Weapon.className = "w3-col l1"
  playerListG4Weapon.innerHTML = "&nbsp;"

  playerListItemSecondRow.append(playerListBombDefuse, playerListPrimaryWeapon,
      playerListSecondaryWeapon, playerListKnifeWeapon, playerListG1Weapon,
      playerListG2Weapon, playerListG3Weapon, playerListG4Weapon)

  listItem.append(playerListItemFirstRow, playerListItemSecondRow)

  return listItem
}

function createMapPlayer(player) {
  // add player to the map
  let mapItemPlayer = document.createElement("div");
  mapItemPlayer.className = `player ${player.Team} deletable`;
  mapItemPlayer.id = `playerMap${player.PlayerId}`;
  mapItemPlayer.style.left = player.X + "%";
  mapItemPlayer.style.top = player.Y + "%";

  let playerArrowContainer = document.createElement("div");
  playerArrowContainer.id = `playerContainer${player.PlayerId}`;
  playerArrowContainer.className = `playerArrowContainer ${player.Team}`;

  let playerArrow = document.createElement("div");
  playerArrow.id = `playerArrow${player.PlayerId}`;
  playerArrow.className = `playerArrow ${player.Team}`;

  let playerNameTag = document.createElement("div");
  playerNameTag.id = `playerNameTag${player.PlayerId}`
  playerNameTag.innerHTML = player.Name
  playerNameTag.className = "playerNameTag"

  let playerWeapon = document.createElement("div")
  playerWeapon.id = `playerMapWeapon${player.PlayerId}`
  playerWeapon.className = `playerMapWeapon ${player.Weapon}`

  playerArrowContainer.appendChild(playerArrow);
  mapItemPlayer.appendChild(playerArrowContainer);
  mapItemPlayer.appendChild(playerNameTag);
  mapItemPlayer.appendChild(playerWeapon);

  return mapItemPlayer
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
    handlePlayerListItemUpdate(player)
    let mapItem = document.getElementById(`playerMap${player.PlayerId}`);
    if (mapItem) {
      // if player changed the ream, we add it again
      if (!mapItem.classList.contains(player.Team)) {
        handleAddPlayer(player)
      }

      mapItem.style.left = player.X + "%";
      mapItem.style.top = player.Y + "%";
      mapItem.style.background = `linear-gradient(0deg, var(--${player.Team}Color) ${player.Hp}%, transparent 0%)`
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
