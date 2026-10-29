import assert from "node:assert/strict";
import test from "node:test";
import { decodeMessage } from "./decodeMessage.js";

const { Message, Round, Init } = globalThis.proto;

function roundPayload(tickNumbers) {
  const round = new Round();
  round.setTicksList(tickNumbers.map((number) => {
    const tick = new Message();
    tick.setTick(number);
    tick.setMsgtype(0);
    return tick;
  }));
  const message = new Message();
  message.setMsgtype(6);
  message.setRound(round);
  return message.serializeBinary();
}

test("groups round messages in order and retains the final tick", () => {
  // Include an event-only tick and a final tick with multiple messages.
  const message = structuredClone(decodeMessage(roundPayload([0, 0, 4, 8, 8])));
  assert.equal(message.msgtype, 6);
  assert.deepEqual(
    message.round.ticksList.map((ticks) => ticks.map((tick) => tick.tick)),
    [[0, 0], [4], [8, 8]]
  );
});

test("handles empty rounds and rounds containing only one tick", () => {
  assert.deepEqual(decodeMessage(roundPayload([])).round.ticksList, []);
  assert.equal(decodeMessage(roundPayload([12])).round.ticksList[0][0].tick, 12);
});

test("preserves initialization and completion messages", () => {
  const init = new Init();
  init.setMapname("de_mirage");
  const message = new Message();
  message.setMsgtype(4);
  message.setInit(init);
  assert.deepEqual(decodeMessage(message.serializeBinary()), message.toObject());

  const end = new Message();
  end.setMsgtype(5);
  assert.deepEqual(decodeMessage(end.serializeBinary()), end.toObject());
});
