import {Card} from './deck';

type Status = 'WAITING' | 'PLAYING' | 'DRAW' | 'LOSE' | 'WON';
export type Reason = 'BLACKJACK' | 'BUST' | 'DEALER_WON' | 'DEALER_BUST' | 'DEALER_LOST';

interface Score {
  low: number;
  high: number;
}

export class Hand {
  status: Status = 'WAITING';
  reason: Reason | undefined;

  cards: Card[] = [];

  get numOfCards(): number {
    return this.cards.length;
  }

  get score(): Score {
    const {cards} = this;
    return cards.reduce<Score>((acc, card) => {
      if (Array.isArray(card.val)) {
        if (acc.high + card.val[1] > 21) {
          acc.low += 1;
          acc.high += 1;
        } else {
          acc.low += card.val[0];
          acc.high += card.val[1];
        }
      } else {
        acc.low += card.val;
        acc.high += card.val;
      }
      return acc;
    }, {low: 0, high: 0});
  }

  get isBlackjack(): boolean {
    const {cards} = this;
    if (cards.length !== 2) return false;

    const firstCard = cards[0];
    const secondCard = cards[1];

    const got10 = firstCard.val === 10 || secondCard.val === 10;
    const gotAce = firstCard.desc === 'ace' || secondCard.desc === 'ace';
    return got10 && gotAce;
  }

  get hasPairs(): boolean {
    const {cards} = this;
    if (cards.length !== 2) return false;

    const firstCard = cards[0];
    const secondCard = cards[1];

    const gotPairs =
      firstCard.val === secondCard.val ||
      firstCard.desc === 'ace' && secondCard.desc === 'ace';

    return gotPairs;
  }

  pairsOf(): number {
    const {cards} = this;
    if (cards.length !== 2) throw new RangeError('pairsOf should only be called when there is two cards');
    if (!this.hasPairs) throw new Error('pairsOf should only be called when there is pairs');
    return cards[0].absoluteVal();
  }

  get isSoft(): boolean {
    const {cards} = this;
    if (cards.length !== 2) return false;

    return cards.some((card) => card.desc === 'ace');
  }

  softOf(): number {
    const {cards} = this;
    if (cards.length !== 2) throw new RangeError('softOf should only be called when there is two cards');
    if (!this.isSoft) throw new Error('softOf should only be called when there is an ace');

    const firstCard = cards[0];
    const secondCard = cards[1];

    return firstCard.desc === 'ace' ? secondCard.absoluteVal() : firstCard.absoluteVal();
  }

  addCard(card: Card) {
    this.cards.push(card);
  }

  setState(state: Status, reason?: Reason) {
    this.status = state;
    this.reason = reason;
  }

  lose(reason: Reason) {
    this.setState('LOSE', reason);
  }

  push(reason?: Reason) {
    this.setState('DRAW', reason);
  }

  won(reason: Reason) {
    this.setState('WON', reason);
  }

  reset() {
    this.status = 'WAITING';
    this.reason = undefined;
    this.cards = [];
  }
}