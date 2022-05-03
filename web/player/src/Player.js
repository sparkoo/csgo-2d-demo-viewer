import {
  MSG_INIT_ROUNDS,
  MSG_PLAY, MSG_PLAY_CHANGE, MSG_TEAMSTATE_UPDATE,
  MSG_PLAY_ROUND_INCREMENT,
  MSG_PLAY_ROUND_PROGRESS, MSG_PLAY_ROUND_UPDATE, MSG_PLAY_SPEED,
  MSG_PLAY_TOGGLE, MSG_PROGRESS_MOVE
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
        switch (msg.msgtype) {
          case 4:
          case 7:
          case 13:
          case MSG_INIT_ROUNDS:
            break
          case 5:
            this.loadingDone()
            break
          case 6:
            this.handleAddRound(msg.round)
            break
          default:
            console.log("unknown message", msg)
        }
      } else {
        switch (msg.msgtype) {
          case MSG_PLAY:
            if (msg.round) {
              this.playRound(msg.round)
            } else {
              this.play()
            }
            break
          case MSG_PLAY_TOGGLE:
            if (this.playing) {
              this.stop()
            } else {
              this.play()
            }
            break
          case MSG_PLAY_ROUND_INCREMENT:
            this.playRound(this.playingRoundI + msg.increment + 1)
            break
          case MSG_PLAY_SPEED:
            this.stop()
            this.interval = defaultInterval / msg.speed
            this.play()
            console.log(this.interval)
            break
          case MSG_PROGRESS_MOVE:
            this.stop()
            let round = this.rounds[this.playingRoundI]
            this.currentTickI = Math.round(round.ticksList.length * msg.progress)
            this.playTick(round.ticksList[this.currentTickI]);
            break
          default:
            // console.log("unknown message [Player.js]", msg)
        }
      }
    }.bind(this))
  }

  handleAddRound(roundMsg) {
    let roundTicks = []
    let tickMessages = []
    let currentTick = roundMsg.ticksList[0].tick
    roundMsg.ticksList.forEach(function (tick) {
      if (tick.tick !== currentTick) {
        roundTicks.push(tickMessages)
        tickMessages = []
        currentTick = tick.tick
      }
      tickMessages.push(tick)
    })

    roundMsg.ticksList = roundTicks
    this.rounds.push(roundMsg)
    this.messageBus.emit({
      msgtype: MSG_INIT_ROUNDS,
      rounds: this.rounds,
    })
  }

  loadingDone() {
    this.loading = false
    this.playRound(1)
  }

  switchPlaying(playing) {
    this.playing = playing
    this.messageBus.emit({
      msgtype: MSG_PLAY_CHANGE,
      playing: playing,
    })
  }

  stop() {
    this.switchPlaying(false)
    clearInterval(this.player)
  }

  play() {
    this.switchPlaying(true)
    let round = this.rounds[this.playingRoundI]
    // handleScoreUpdate(round.TeamState)
    // this.highlightActiveRound(this.playingRoundI)
    clearInterval(this.player)
    this.player = setInterval(function () {
      if (this.currentTickI >= round.ticksList.length) {
        if (this.playingRoundI + 1 >= this.rounds.length) {
          this.stop()
        } else {
          this.playRound(this.playingRoundI + 2)
        }
      }
      if (!this.playing) {
        clearInterval(this.player);
        return
      }
      this.playTick(round.ticksList[this.currentTickI]);
      this.messageBus.emit({
        msgtype: MSG_PLAY_ROUND_PROGRESS,
        progress: this.currentTickI / round.ticksList.length
      })

      this.currentTickI++
    }.bind(this), this.interval)
  }

  highlightActiveRound(round) {
    this.messageBus.emit({
      msgtype: MSG_PLAY_ROUND_UPDATE,
      round: round,
    })
  }

  playTick(tickMessages) {
    tickMessages.forEach(msg => this.messageBus.emit(msg))
  }

  playRound(round) {
    let roundI = round - 1
    if (roundI < 0) {
      roundI = 0
    } else if (roundI >= this.rounds.length) {
      roundI = this.rounds.length - 1
    }
    round = roundI + 1

    this.stop()
    this.playingRoundI = roundI
    this.currentTickI = 0
    this.play()
    this.highlightActiveRound(round)
    this.emitPlayRoundEvent()
  }

  emitPlayRoundEvent() {
    this.messageBus.emit({
      msgtype: MSG_TEAMSTATE_UPDATE,
      teamstate: this.rounds[this.playingRoundI].teamstate,
    })
  }
}

export default Player
