const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup() {
  const requests = [];
  const opened = [];
  const errors = [];
  const response = deferred();
  const context = vm.createContext({
    console: { log() {} },
    document: { readyState: "complete" },
    navigator: { userAgent: "test" },
    window: {
      location: { href: "https://www.faceit.com" },
      postMessage() {},
      open: (...args) => opened.push(args),
    },
    URL,
    fetch: async (url) => {
      requests.push(url);
      if (url.includes("/api/match/")) return response.promise;
      return { ok: true, json: async () => ({ payload: { download_url: "https://cdn.example/demo.dem" } }) };
    },
  });
  // Run the content script with browser APIs stubbed, without starting DOM observers.
  const source = readFileSync(join(__dirname, "content-script.js"), "utf8")
    .replace('import browser from "webextension-polyfill";', "")
    .replace("new FACEITDemoViewer();", "globalThis.Viewer = FACEITDemoViewer;");
  vm.runInContext(source, context);
  context.Viewer.prototype.init = () => {};
  const viewer = new context.Viewer();
  viewer.debugMode = false;
  viewer.showPopupError = (...args) => errors.push(args);
  return { viewer, requests, opened, errors, response };
}

const button = () => ({ innerHTML: "2D", disabled: false });
const matchResponse = () => ({
  ok: true,
  json: async () => ({ payload: { demoURLs: ["demo-resource"] } }),
});

test("repeated clicks and a replacement button start only one download flow", async () => {
  const { viewer, requests, opened, response } = setup();
  const original = button();
  const replacement = button();
  const pending = viewer.handleReplayClick("match-1", original);
  const repeated = viewer.handleReplayClick("match-1", original);
  const replaced = viewer.handleReplayClick("match-1", replacement);
  assert.equal(requests.length, 1);
  assert.equal(original.disabled, true);
  assert.equal(replacement.innerHTML, "2D");
  assert.equal(replacement.disabled, false);

  response.resolve(matchResponse());
  await Promise.all([pending, repeated, replaced]);
  assert.equal(requests.length, 2);
  assert.equal(opened.length, 1);
  assert.equal(opened[0][0], "https://2d.sparko.cz/player?demourl=https%3A%2F%2Fcdn.example%2Fdemo.dem");
  assert.equal(original.innerHTML, "2D");
  assert.equal(original.disabled, false);

  await viewer.handleReplayClick("match-1", replacement);
  assert.equal(opened.length, 2, "a later intentional replay is allowed");
});

test("failed requests restore the button and allow retry", async () => {
  const { viewer, requests, opened, errors, response } = setup();
  const replay = button();
  const pending = viewer.handleReplayClick("match-1", replay);
  response.reject(new Error("network failure"));
  await pending;
  assert.equal(errors.length, 1);
  assert.equal(opened.length, 0);
  assert.equal(replay.innerHTML, "2D");
  assert.equal(replay.disabled, false);

  response.promise = Promise.resolve(matchResponse());
  await viewer.handleReplayClick("match-1", replay);
  assert.equal(requests.length, 3, "retry completes both API requests");
  assert.equal(opened.length, 1);
  assert.equal(errors.length, 1);
});

test("different matches can use the direct download flow independently", async () => {
  const { viewer, requests, opened, response } = setup();
  const first = viewer.handleReplayClick("match-1", button());
  const second = viewer.handleReplayClick("match-2", button());
  assert.equal(requests.length, 2);
  response.resolve(matchResponse());
  await Promise.all([first, second]);
  assert.equal(requests.length, 4);
  assert.equal(opened.length, 2);
});

test("match-room guard remains active through intercept and fallback", async () => {
  const { viewer, requests, opened, response } = setup();
  const intercept = deferred();
  const pageFetch = deferred();
  const watchDemoButton = {};
  let interceptCalls = 0;
  viewer.fetchDemoUrlViaIntercept = async (watchButton) => {
    assert.equal(watchButton, watchDemoButton);
    interceptCalls++;
    return intercept.promise;
  };
  viewer.fetchDemoUrlViaPageContext = () => pageFetch.promise;
  const pending = viewer.handleReplayClick("match-1", button(), null, watchDemoButton);
  const repeated = viewer.handleReplayClick("match-1", button(), null, watchDemoButton);
  assert.equal(interceptCalls, 1);
  intercept.resolve(null);
  await Promise.resolve();
  void viewer.handleReplayClick("match-1", button());
  assert.equal(requests.length, 0);
  pageFetch.resolve(null);
  // Let both async fallback stages settle before checking the direct request.
  await new Promise(setImmediate);
  assert.equal(requests.length, 1);
  void viewer.handleReplayClick("match-1", button());
  assert.equal(requests.length, 1);
  response.resolve(matchResponse());
  await Promise.all([pending, repeated]);
  assert.equal(opened.length, 1);
});
