import {Hand} from "../hand";
import {myDeck} from "../deck";

describe('hand', () => {
  const fiveCard = myDeck.find((card) => card.desc === 'five');
  const tenCard = myDeck.find((card) => card.desc === 'ten');
  const aceCard = myDeck.find((card) => card.desc === 'ace');

  if (!fiveCard) throw new Error('could not found a FIVE card');
  if (!tenCard) throw new Error('could not found a TEN card');
  if (!aceCard) throw new Error('could not found an ACE card');

  it('should add a card', () => {
    const hand = new Hand();

    hand.addCard(fiveCard);
    expect(hand.cards.length).toBe(1);
    expect(hand.numOfCards).toBe(1);
  });
  
  test('correct score', () => {
    const hand = new Hand();
    const hand2 = new Hand();
    const hand3 = new Hand();
    const hand4 = new Hand();

    hand.addCard(fiveCard);
    expect(hand.score).toEqual({low: 5, high: 5});

    hand2.addCard(aceCard);
    expect(hand2.score).toEqual({low: 1, high: 11});

    hand3.addCard(fiveCard);
    hand3.addCard(aceCard);

    expect(hand3.score).toEqual({low: 6, high: 16});

    hand3.addCard(aceCard);

    expect(hand3.score).toEqual({low: 7, high: 17});

    hand4.addCard(fiveCard);
    hand4.addCard(tenCard);

    expect(hand4.score).toEqual({low: 15, high: 15});
  });

  test('blackjack', () => {
    const hand = new Hand();
    const hand2 = new Hand();

    hand.addCard(tenCard);
    hand.addCard(tenCard);

    expect(hand.isBlackjack).toBeFalsy();

    hand2.addCard(tenCard);
    hand2.addCard(aceCard);

    expect(hand2.isBlackjack).toBeTruthy();
  });

  test('pairs', () => {
    const hand = new Hand();
    const hand2 = new Hand();

    hand.addCard(fiveCard);
    hand.addCard(fiveCard);

    expect(hand.hasPairs).toBeTruthy();
    expect(hand.pairsOf()).toBe(5);

    hand2.addCard(aceCard);
    hand2.addCard(aceCard);

    expect(hand2.hasPairs).toBeTruthy();
    expect(hand2.pairsOf()).toBe(11);

    hand2.addCard(tenCard);

    expect(hand2.hasPairs).toBeFalsy();
    expect(hand2.pairsOf).toThrow();
  });

  test('soft', () => {
    const hand = new Hand();
    const hand2 = new Hand();

    hand.addCard(fiveCard);
    hand.addCard(fiveCard);

    expect(hand.isSoft).toBeFalsy();
    expect(hand.softOf).toThrow();

    hand2.addCard(fiveCard);
    hand2.addCard(aceCard);
    
    expect(hand2.isSoft).toBeTruthy();
    expect(hand2.softOf()).toBe(5);

    hand2.addCard(tenCard);

    expect(hand2.isSoft).toBeFalsy();
    expect(hand2.softOf).toThrow();
  });
});