class MessageBus {
  constructor() {
    this.listeners = {}
    this.listenersAll = []
  }

  listen(msgtypes, callback) {
    msgtypes.forEach(msgtype => {
      if (!this.listeners[msgtype]) {
        this.listeners[msgtype] = []
      }
      this.listeners[msgtype].push(callback)
    })
    if (msgtypes.length === 0) {
      this.listenersAll.push(callback)
    }
  }

  emit(message) {
    if (this.listeners[message.msgtype]) {
      this.listeners[message.msgtype].forEach(c => c(message))
    }
    this.listenersAll.forEach(c => c(message))
  }
}

export default MessageBus
