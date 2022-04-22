import {
  MSG_INIT_ROUNDS,
  MSG_PLAY,
  MSG_PLAY_ROUND_INCREMENT,
  MSG_PLAY_ROUND_PROGRESS, MSG_PLAY_ROUND_UPDATE,
  MSG_PLAY_TOGGLE
} from "./constants";

const defaultInterval = 16

class Player {
  constructor(messageBus) {
    this.rounds = []

    this.loading = true

    this.playing = true
    this.currentTickI = 0
    this.playingRoundI = 0

    this.player = {}
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
            this.playRound(msg.round)
            break
          case MSG_PLAY_TOGGLE:
            if (this.playing) {
              this.stop()
            } else {
              this.play()
            }
            break
          case MSG_PLAY_ROUND_INCREMENT:
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
    this.play()
  }

  stop() {
    this.playing = false
    clearInterval(this.player)
  }

  play() {
    this.playing = true;
    let round = this.rounds[this.playingRoundI]
    // handleScoreUpdate(round.TeamState)
    this.highlightActiveRound(this.playingRoundI)
    clearInterval(this.player)
    this.player = setInterval(function () {
      if (this.currentTickI >= round.Ticks.length) {
        if (this.playingRoundI >= this.rounds.length) {
          this.stop()
        } else {
          this.playingRoundI++;
          round = this.rounds[this.playingRoundI];
          this.currentTickI = 0;
          // handleScoreUpdate(round.TeamState)
          this.highlightActiveRound(this.playingRoundI)
        }
      }
      if (!this.playing) {
        clearInterval(this.player);
      }
      this.playTick(round.Ticks[this.currentTickI]);
      this.messageBus.emit({
        msgType: MSG_PLAY_ROUND_PROGRESS,
        progress: this.currentTickI / round.Ticks.length
      })

      this.currentTickI++
    }.bind(this), this.interval)
  }

  highlightActiveRound(round) {
    this.messageBus.emit({
      msgType: MSG_PLAY_ROUND_UPDATE,
      round: round,
    })
  }

  playTick(tickMessages) {
    tickMessages.forEach(msg => this.messageBus.emit(msg))
  }

  playRound(roundI) {
    this.stop()
    this.playingRoundI = roundI
    this.currentTickI = 0
    this.play()
    this.highlightActiveRound(roundI)
  }
}

export default Player
