import { useEffect } from "react";

const LoaderService = (messageBus) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rounds, setRounds] = useState([]);

  const handleAddRound = (roundMsg) => {
    let roundTicks = [];
    let tickMessages = [];
    let currentTick = roundMsg.ticksList[0].tick;
    roundMsg.ticksList.forEach(function (tick) {
      if (tick.tick !== currentTick) {
        roundTicks.push(tickMessages);
        tickMessages = [];
        currentTick = tick.tick;
      }
      tickMessages.push(tick);
    });

    roundMsg.ticksList = roundTicks;
    this.rounds.push(roundMsg);
    this.messageBus.emit({
      msgtype: MSG_INIT_ROUNDS,
      rounds: this.rounds,
    });
  };

  const loadingDone = () => {
    setIsLoading(false);
  };

  messageBus.listen([5, 6], function (msg) {
    if (this.loading) {
      switch (msg.msgtype) {
        case 5:
          loadingDone();
          break;
        case 6:
          handleAddRound(msg.round);
          break;
      }
    }
  });

  return { isLoading, rounds };
};

export default LoaderService;
