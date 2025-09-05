class DemoDataService {
  constructor() {
    this.rounds = [];
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
