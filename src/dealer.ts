import {Hand, Reason} from './hand';
import {Player} from './player';
import {Card} from './deck';
import {Actions} from './actions';

interface Deck {
  length: number;
  draw(): Card;
  reset(): void;
}

interface Wallet {
  [playerId: string]: number;
}

interface Bid {
  [playerId: string]: {
    [handIndex: number]: number;
  };
}

interface Options {
  deck: Deck;
  shufflePerc: number;
  balances: Wallet;
}

export class Dealer {
  deck: Deck;
  deckStartingLength: number;
  shufflePerc: number;
  balances: Wallet;
  players: Player[] = [];
  bids: Bid = {};
  minBet = 1;
  maxBet = 100;

  constructor(opt: Options) {
    this.deck = opt.deck;
    this.deckStartingLength = opt.deck.length;
    this.shufflePerc = opt.shufflePerc;
    this.balances = opt.balances;
  }

  addPlayer(player: Player) {
    this.players.push(player);
  }

  newHand(): Hand {
    this.reset();
    return new Hand();
  }

  drawCard(): Card {
    const card = this.deck.draw();

    const shuffleLimit = this.shufflePerc * this.deckStartingLength / 100;
    if (this.deck.length < shuffleLimit) this.deck.reset();

    return card;
  }

  getBalance(player: Player): number {
    const balance = this.balances[player.id];

    if (Number.isNaN(balance) || balance < 0) {
      throw new TypeError(`balance for player "${player.id}" is not a valid number`);
    }

    return balance;
  }

  setBalance(player: Player, amount: number) {
    this.balances[player.id] = amount;
  }

  bid(player: Player, amount: number) {
    const {id, currentHandIndex} = player;

    if (this.getBalance(player) < amount) throw new Error('not enough money to make that bid');

    if (!Array.isArray(this.bids[id])) this.bids[id] = [];
    if (!this.bids[id][currentHandIndex]) this.bids[id][currentHandIndex] = 0;

    this.balances[id] -= amount;
    this.bids[id][currentHandIndex] += amount;
  }

  getBidAmount(player: Player, handIndex = 0): number {
    const {id} = player;

    if (!Array.isArray(this.bids[id])) this.bids[id] = [];
    if (!this.bids[id][handIndex]) this.bids[id][handIndex] = 0;

    return this.bids[id][handIndex];
  }

  canDouble(player: Player): boolean {
    const bid = this.getBidAmount(player, player.currentHandIndex);

    return this.balances[player.id] >= bid;
  }

  bidDouble(player: Player) {
    const bidAmount = this.getBidAmount(player, player.currentHandIndex);
    this.bid(player, bidAmount);
  }

  playerHandLose(player: Player, handIndex: number, reason: Reason) {
    const hand = player.hands[handIndex];
    const amountLose = this.getBidAmount(player, handIndex);
    hand.lose(reason);
    player.loss(amountLose);
  }

  playerHandDraw(player: Player, handIndex: number, reason?: Reason) {
    const {id} = player;
    const hand = player.hands[handIndex];
    const bidAmount = this.getBidAmount(player, handIndex);
    this.balances[id] += bidAmount;
    hand.push(reason);
    player.draw();
  }

  playerHandWon(player: Player, handIndex: number, reason: Reason) {
    const {id} = player;
    const hand = player.hands[handIndex];
    const isBlackjack = reason === 'BLACKJACK';
    const bidAmount = this.getBidAmount(player, handIndex);
    const amountWon = bidAmount + (isBlackjack ? bidAmount * 1.5 : bidAmount);
    this.balances[id] += amountWon;
    hand.won(isBlackjack ? 'BLACKJACK' : 'DEALER_WON');
    player.win(amountWon);
  }

  getWaitingPlayers(): Player[] {
    return this.players.filter((player) => player.status === 'WAITING');
  }

  async playHand() {
    const dealerHand = this.newHand();

    const players = this.players.filter((player) => player.status !== 'DISABLED');
    if (!players.length) return console.log('no players available');

    for (const player of players) {
      const balance = this.getBalance(player);
      const amount = player.bid(balance);

      if (amount < this.minBet) {
        console.log(`player "${player.id}" is out`);
        player.status = 'DISABLED';
        continue;
      }

      this.bid(player, amount);
    }

    for (let i = 0; i < 2; i++) {
      players.forEach((player) => player.addCard(this.drawCard()));
      dealerHand.addCard(this.drawCard());
    }

    for (const player of players) {
      const hand = player.currentHand;

      player.status = 'PLAYING';

      if (hand.isBlackjack) player.status = 'WAITING';

      while (player.status === 'PLAYING') {
        const hand = player.currentHand;
        const isFirstTurn = hand.numOfCards === 2;
        let handScore = hand.score.high;

        const actions: Partial<Actions> = {
          stand: () => {
            hand.status = 'WAITING';
            if (player.hasSecondHand) player.selectSecondHand();
          },
          hit: () => hand.addCard(this.drawCard()),
          split: () => {
            player.split();
            hand.addCard(this.drawCard());
          },
          double: () => {
            this.bidDouble(player);
            hand.addCard(this.drawCard());
            hand.status = 'WAITING';
            if (player.hasSecondHand) player.selectSecondHand();
          },
        };

        if (isFirstTurn) {
          if (!hand.hasPairs) delete actions.split;
          if (
            !this.canDouble(player) ||
            (!hand.isSoft || (handScore < 8 || handScore > 11))
          ) delete actions.double;
        }

        const dealerFirstCardValue = dealerHand.cards[0].absoluteVal();
        player.play(dealerFirstCardValue, actions as Actions);

        handScore = hand.score.high;

        if (handScore > 21) {
          hand.lose('BUST');
          if (player.hasSecondHand) player.selectSecondHand();
        }

        const isPlayerDone = !player.hands.some((hand) => hand.status === 'PLAYING');

        if (isPlayerDone) {
          const lossAmount = player.hands
            .filter((hand) => hand.status === 'LOSE')
            .reduce((acc, hand, index) => {
              return acc += this.getBidAmount(player, index);
            }, 0);

          if (lossAmount > 0) player.loss(lossAmount);
          player.status = 'WAITING';
        }
      }
    }

    let dealerScore = dealerHand.score.high;
    const waitingPlayers = this.getWaitingPlayers();

    if (dealerScore === 21) {
      waitingPlayers.forEach((player) => {
        player.hands.forEach((hand, index) => {
          if (hand.status !== 'WAITING') return;
          this.playerHandLose(player, index, 'DEALER_WON')
        });
      });
    } else {
      waitingPlayers.forEach((player) => {
        player.hands.forEach((hand, index) => {
          if (hand.status !== 'WAITING') return;
          if (hand.isBlackjack) this.playerHandWon(player, index, 'BLACKJACK');
        });
      });

      while (dealerScore < 17) {
        dealerHand.addCard(this.drawCard());
        dealerScore = dealerHand.score.high;
      }

      if (dealerScore > 21) {
        dealerHand.lose('BUST');
        waitingPlayers.forEach((player) => {
          player.hands.forEach((hand, index) => {
            if (hand.status !== 'WAITING') return;
            this.playerHandWon(player, index, 'DEALER_BUST');
          });
        });
      } else {
        waitingPlayers.forEach((player) => {
          player.hands.forEach((hand, index) => {
            if (hand.status !== 'WAITING') return;

            const playerScore = hand.score.high;

            if (dealerScore > playerScore) this.playerHandLose(player, index, 'DEALER_WON');
            else if (dealerScore < playerScore) this.playerHandWon(player, index, 'DEALER_LOST');
            else this.playerHandDraw(player, index);
          });
        });
      }
    }
  }

  reset() {
    this.bids = {};
    this.players.forEach((player) => player.clear());
  }
}