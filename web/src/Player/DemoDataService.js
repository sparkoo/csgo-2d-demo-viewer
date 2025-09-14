class DemoDataService {
  constructor() {
    this.map = "";
    this.rounds = [];
  }

  init(matchInfo) {
    this.map = matchInfo.mapname;
  }

  addRound(round) {
    this.rounds.push(round);
  }

  getRound(roundNo) {
    return this.rounds[roundNo];
  }

  roundsSize() {
    return this.rounds.length;
  }
}

export default DemoDataService;
