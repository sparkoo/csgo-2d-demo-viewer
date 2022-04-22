class MessageBus {
  constructor() {
    this.listeners = {}
    this.listenersAll = []
  }

  listen(msgTypes, callback) {
    msgTypes.forEach(msgType => {
      if (!this.listeners[msgType]) {
        this.listeners[msgType] = []
      }
      this.listeners[msgType].push(callback)
    })
    if (msgTypes.length === 0) {
      this.listenersAll.push(callback)
    }
  }

  emit(message) {
    if (this.listeners[message.msgType]) {
      this.listeners[message.msgType].forEach(c => c(message))
    }
    this.listenersAll.forEach(c => c(message))
  }
}

export default MessageBus
