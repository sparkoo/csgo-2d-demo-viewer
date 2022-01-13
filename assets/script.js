let socket = new WebSocket("ws://localhost:8080/ws")

socket.onopen = function(e) {
  console.log("[open] Connection established");
  socket.send("parse");
};

socket.onmessage = function(event) {
  // console.log(`[message] Data received from server: ${event.data}`);
  let msg = JSON.parse(event.data)

  switch (msg.msgType) {
    case 0: handleTeamUpdate(msg.teamUpdate); break
    case 1: playerUpdate(msg.playerUpdate); break
    case 2: handleAddPlayer(msg.addPlayer); break
    case 3: removePlayer(msg.removePlayer.PlayerId); break;
    case 4: handleInitMessage(msg.init); break
    default: console.log(`I don't know this message type ${msg.msgType}`); console.log(msg);
  }
  // console.log(msg.MsgType)
  // console.log(msg.TeamUpdate.TScore)
  // let player = document.getElementById('player11');
  // player.style.left=position.x + "%";
  // player.style.top=position.y + "%";
};

socket.onclose = function(event) {
  if (event.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    console.log('[close] Connection died');
  }
};

socket.onerror = function(error) {
  console.log(`[error] ${error.message}`);
};

function handleTeamUpdate(msg) {
  document.getElementById("TName").innerHTML = msg.TName
  document.getElementById("CTName").innerHTML = msg.CTName
  document.getElementById("TScore").innerHTML = msg.TScore
  document.getElementById("CTScore").innerHTML = msg.CTScore
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
  let mapItem = document.createElement("div");
  mapItem.className=`player ${msg.Team}`;
  mapItem.id = `playerMap${msg.PlayerId}`;
  mapItem.style.left=msg.X + "%";
  mapItem.style.top=msg.Y + "%";
  document.getElementById("map").appendChild(mapItem);
}

function handleInitMessage(msg) {
  console.log("init", msg);
  document.getElementById("map").style.backgroundImage = `url(\"https://raw.githubusercontent.com/zoidbergwill/csgo-overviews/master/overviews/${msg.mapName}.jpg\")`
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
    mapItem.style.left=player.X + "%";
    mapItem.style.top=player.Y + "%";
  }
}
