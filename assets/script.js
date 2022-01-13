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
    case 2: handleAddPlayer(msg.addPlayer); break
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
  // add player to the list
  let playerListItemId = `playerListItem${msg.PlayerId}`;
  if (document.contains(document.getElementById(playerListItemId))) {
    document.getElementById(playerListItemId).remove();
  }

  let listItem = document.createElement("li");
  listItem.id = playerListItemId;
  listItem.innerHTML = `${msg.Name} (${msg.PlayerId})`;

  document.getElementById(msg.Team + "List").appendChild(listItem);


  // add player to the map
  let playerMapId = `playerMap${msg.PlayerId}`;
  if (document.contains(document.getElementById(playerMapId))) {
    document.getElementById(playerMapId).remove();
  }

  let mapItem = document.createElement("div");
  mapItem.className=`player ${msg.Team}`;
  mapItem.id = playerMapId;
  mapItem.style.left=msg.X + "%";
  mapItem.style.top=msg.Y + "%";
  document.getElementById("map").appendChild(mapItem);
}