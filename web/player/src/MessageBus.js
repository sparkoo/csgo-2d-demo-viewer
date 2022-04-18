class MessageBus {
  constructor() {
    this.listeners = {}
  }

  listen(msgTypes, callback) {
    msgTypes.forEach(msgType => {
      if (!this.listeners[msgType]) {
        this.listeners[msgType] = []
      }
      this.listeners[msgType].push(callback)
    })
  }

  emit(message) {
    if (this.listeners[message.msgType]) {
      this.listeners[message.msgType].forEach(c => c(message))
    }
  }
}

export default MessageBus
