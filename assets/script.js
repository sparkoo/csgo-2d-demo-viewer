let socket = new WebSocket("ws://localhost:8080/ws")

socket.onopen = function(e) {
  console.log("[open] Connection established");
  socket.send("parse");
};

socket.onmessage = function(event) {
  console.log(`[message] Data received from server: ${event.data}`);
  let position = JSON.parse(event.data)
  console.log(`${position.x}`)
  let player = document.getElementById('player11');
  player.style.left=position.x + "%";
  player.style.top=position.y + "%";
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
