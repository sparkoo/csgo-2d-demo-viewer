import {MSG_INIT_ROUNDS, MSG_PLAY} from "./constants";

const defaultInterval = 16

class Player {
  constructor(messageBus) {
    this.rounds = []

    this.loading = true

    this.playing = true
    this.currentTickI = 0
    this.playingRoundI = 0

    // this.player
    this.interval = defaultInterval

    this.messageBus = messageBus
    this.messageBus.listen([], function (msg) {
      if (this.loading) {
        switch (msg.msgType) {
          case 4:
          case 7:
          case 13:
            break
          case 5:
            this.loadingDone()
            break
          case 6:
            this.handleAddRound(msg.round)
            break
          default:
            console.log("unknown message received", msg)
            alert("unknown message received");
        }
      } else {
        switch (msg.msgType) {
          case MSG_PLAY:
            console.log("I should play ", msg.round)
            break
        }
      }
    }.bind(this))
  }

  handleAddRound(roundMsg) {
    let roundTicks = []
    let tickMessages = []
    let currentTick = roundMsg.Ticks[0].tick
    roundMsg.Ticks.forEach(function (tick) {
      if (tick.tick !== currentTick) {
        roundTicks.push(tickMessages)
        tickMessages = []
        currentTick = tick.tick
      }
      tickMessages.push(tick)
    })

    roundMsg.Ticks = roundTicks
    this.rounds.push(roundMsg)
  }

  loadingDone() {
    this.loading = false
    this.messageBus.emit({
      msgType: MSG_INIT_ROUNDS,
      rounds: this.rounds,
    })
  }
}

export default Player
