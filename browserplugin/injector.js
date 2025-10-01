(function () {
  // In injector.js (add this inside the IIFE)
  window.addEventListener("message", function (event) {
    // Verify the message source to ensure it's from the content script
    if (
      event.source !== window ||
      event.data.source !== "2dsparko-extenstion-script"
    ) {
      return; // Ignore messages from other sources
    }

    console.log("Received message from content script:", event.data);

    window.turnstile.render(`#dsparko-turnstile`, {
      sitekey: event.data.sitekey,
      callback: (token) => {
        console.log("got token?", token);
        fetch("https://www.faceit.com/api/download/v2/demos/download-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resource_url: event.data.demourl,
            // captcha_token: token,
          }),
        })
          .then((resp) => {
            if (resp.ok) {
              return resp.json();
            } else {
              console.log("resp failed", resp);
            }
          })
          .then((respbody) => {
            console.log("hey there?", respbody.payload.download_url);
            fetch(
              "https://europe-west1-csgo-2d-demo-player.cloudfunctions.net/downloadDemo",
              {
                method: "POST",
                body: JSON.stringify({
                  demourl: respbody.payload.download_url,
                }),
              }
            )
              .then((response) => console.log("download started?", response))
              .catch((e) => {
                console.log("sthing wrong", e);
              });
          });
      },
    });
  });

  window.postMessage(
    {
      source: "my-extension-injector",
      turnstileLoaded: true,
      blabol: "blabolec",
    },
    "*"
  );
  const demoUrl =
    "https://demos-europe-central-faceit-cdn.s3.eu-central-003.backblazeb2.com/cs2/1-307fb563-abc0-45f7-9d2c-d60a4b40a220-1-1.dem.zst?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=0032bdbf06e20000000000001%2F20250926%2F%2Fs3%2Faws4_request&X-Amz-Date=20250926T043752Z&X-Amz-Expires=299&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=790e52523b6d455992d018247d03c4327e864e46927bea3e1a5e165b5b401343";
  fetch(demoUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  });

  // Check if the object exists on the main page's window
  if (window.turnstile) {
    // Send a message back to the content script's world
    window.postMessage(
      {
        source: "my-extension-injector",
        turnstileLoaded: true,
        // Example: You can send back specific data if needed
        // widgetId: window.turnstile.getWidgetId(),
      },
      "*"
    );
  }
})();
