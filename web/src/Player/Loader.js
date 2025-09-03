import MessageBus from "./MessageBus.js";

class LoaderService {
  constructor(worker, demoDataService, setIsWasmLoaded) {
    this.isLoading = false;
    this.messageBus = new MessageBus();
    this.worker = worker;
    this.demoDataService = demoDataService;
    this.setIsWasmLoaded = setIsWasmLoaded;

    this.worker.onmessage = (e) => {
      console.log("Message received from worker", e);
      if (e.data === "ready") {
        this.setIsWasmLoaded(true);
      } else {
        const msg = proto.Message.deserializeBinary(e.data).toObject();
        this.messageBus.emit(msg);
      }
    };

    this.messageBus.listen([5, 6, 13], (msg) => {
      if (this.isLoading) {
        switch (msg.msgtype) {
          case 5:
            this.loadingDone();
            break;
          case 6:
            this.handleAddRound(msg.round);
            break;
          case 13:
            alert(msg.message);
            break;
        }
      }
    });
  }

  handleAddRound(roundMsg) {
    let roundTicks = [];
    let tickMessages = [];
    let currentTick = roundMsg.ticksList[0].tick;
    roundMsg.ticksList.forEach((tick) => {
      if (tick.tick !== currentTick) {
        roundTicks.push(tickMessages);
        tickMessages = [];
        currentTick = tick.tick;
      }
      tickMessages.push(tick);
    });

    roundMsg.ticksList = roundTicks;
    this.demoDataService.addRound(roundMsg);
  }

  loadingDone() {
    this.isLoading = false;
  }
}

export default LoaderService;
