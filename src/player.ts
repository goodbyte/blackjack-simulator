import {Hand} from './hand';
import {Actions} from './actions';
import {
  Plays,
  hard as hardStrategy,
  soft as softStrategy,
  pairs as pairsStrategy,
} from './strategy';
import {Card} from './deck';

type PlayActions = {
  [K in Plays]: Function;
}

export class Player {
  status: 'DISABLED' | 'WAITING' | 'BIDING' | 'PLAYING' = 'WAITING';
  readonly originalBid = 1;
  readonly bidMultiplier = 2;
  readonly bidPowLimit = 5;
  readonly bidLimit = this.originalBid * this.bidMultiplier ** this.bidPowLimit;
  lastBid = this.originalBid;
  lostBalance = 0;
  hands: Hand[] = [];
  currentHandIndex = 0;

  constructor(public id: string) {}

  get currentHand(): Hand {
    return this.hands[this.currentHandIndex];
  }

  get hasSecondHand(): boolean {
    return this.currentHandIndex === 0 && this.hands.length === 2;
  }

  bid(balance: number): number {
    const {originalBid, lastBid, bidMultiplier, bidLimit: limit, lostBalance} = this;
    let currentBid = originalBid;

    this.status = 'BIDING';

    if (lostBalance < 0) {
      const nextBid = lastBid * bidMultiplier;
      currentBid = nextBid <= limit ? nextBid : lastBid;
    } else if (lostBalance === 0) {
      currentBid = lastBid;
    }

    if (currentBid > balance) {
      console.log('all in :(');
      currentBid = balance;
    }

    this.lastBid = currentBid;
    this.status = 'WAITING';
    return currentBid;
  }

  addCard(card: Card) {
    if (!this.currentHand) this.hands[this.currentHandIndex] = new Hand();
    this.currentHand.addCard(card);
  }

  selectSecondHand() {
    if (this.hasSecondHand) {
      this.currentHandIndex = 1;
      this.currentHand.status = 'PLAYING';
    } else {
      throw new Error('already on second hand');
    }
  }

  split() {
    const hand = this.currentHand;
    const card = hand.cards.pop();

    if (!card) throw new Error('invalid card when splitting');

    this.hands[1] = new Hand();
    this.hands[1].addCard(card);

    // this.hands[0].addCard(cards[0]);
    // this.hands[1].addCard(cards[1]);
  }

  play(dealerFirstCardValue: number, actions: Actions) {
    const hand = this.currentHand;
    let handScore = hand.score.high;
    let strategy = hardStrategy;

    hand.status = 'PLAYING';

    if (hand.hasPairs) {
      strategy = pairsStrategy;
      handScore = hand.pairsOf();
    } else if (hand.isSoft) {
      strategy = softStrategy;
      handScore = hand.softOf();
    } else if (handScore >= 17) {
      return actions.stand();
    }

    const availablePlays: PlayActions = {
      'S': actions.stand,
      'H': actions.hit,
      'D': actions.double,
      'T': actions.split,
    };

    let play = strategy[handScore][dealerFirstCardValue];

    if (!play) throw new Error('no strategy found');

    if (availablePlays[play]) {
      availablePlays[play]();
    } else {
      if (play === 'D') {
        actions.hit();
      } else if (play === 'T') {
        handScore = hand.score.high;

        if (handScore >= 17) {
          actions.stand();
        } else {
          play = hardStrategy[handScore][dealerFirstCardValue];

          if (!play) throw new Error('no strategy found');

          if (availablePlays[play]) {
            availablePlays[play]();
          } else if (play === 'D') {
            actions.hit();
          } else {
            actions.stand();
          }
        }
      } else {
        throw new Error('that action is not available');
      }
    }
  }

  loss(amount: number) {
    this.lostBalance -= amount;
  }

  draw() {
    if (this.lostBalance > 0) this.lostBalance = 0;
  }

  win(amount: number) {
    this.lostBalance += amount;
  }

  clear() {
    this.currentHandIndex = 0;
    this.hands = [];
    this.status = 'WAITING';
  }
}