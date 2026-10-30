import "./protos/Message_pb.js";

// Decode and prepare playback data off the UI thread, once per parser message.
export function decodeMessage(data) {
  const msg = globalThis.proto.Message.deserializeBinary(data).toObject();
  if (msg.msgtype === 6) {
    const ticks = [];
    let currentTick;
    let messages;
    for (const tick of msg.round.ticksList) {
      if (!messages || tick.tick !== currentTick) {
        messages = [];
        ticks.push(messages);
        currentTick = tick.tick;
      }
      messages.push(tick);
    }
    msg.round.ticksList = ticks;
  }
  return msg;
}
