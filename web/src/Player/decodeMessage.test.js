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

for (const withAssist of [false, true]) {
  test(`preserves kill assist data through round decoding (assist=${withAssist})`, () => {
    const frag = new globalThis.proto.Frag();
    frag.setKillername("Killer");
    frag.setVictimname("Victim");
    frag.setWeapon("ak47");
    frag.setAssistedflash(withAssist);
    if (withAssist) {
      frag.setAssistername("Assister");
      frag.setAssisterteam("CT");
    }
    const kill = new Message();
    kill.setMsgtype(11);
    kill.setTick(42);
    kill.setFrag(frag);
    const round = new Round();
    round.setTicksList([kill]);
    round.setEndreason(8);
    const message = new Message();
    message.setMsgtype(6);
    message.setRound(round);
    const decoded = structuredClone(decodeMessage(message.serializeBinary()));
    const actual = decoded.round.ticksList[0][0].frag;
    assert.equal(actual.assistername, withAssist ? "Assister" : "");
    assert.equal(actual.assisterteam, withAssist ? "CT" : "");
    assert.equal(actual.assistedflash, withAssist);
    assert.equal(actual.killername, "Killer");
    assert.equal(actual.victimname, "Victim");
    assert.equal(decoded.round.endreason, 8);
  });
}
