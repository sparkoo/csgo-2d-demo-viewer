function Connect(messageBus) {
  console.log("initializing websocket connection")

  let websocketServerUrl = `wss://${window.location.host}/ws`
  if (window.location.host.includes("localhost")) {
    websocketServerUrl = `ws://localhost:8080/ws`
  }

  let socket = new WebSocket(websocketServerUrl)

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

  socket.onmessage = function (event) {
    // console.log(`[message] Data received from server: ${event.data}`);
    let msg = JSON.parse(event.data)
    messageBus.emit(msg)
  }
}

export default Connect
