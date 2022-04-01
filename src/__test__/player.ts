import {Actions} from "../actions";
import {Card, myDeck} from "../deck";
import {Hand} from "../hand";
import {Player} from "../player";

function getCard(desc: string): Card {
  const card = myDeck.find((card) => card.desc === desc);
  if (!card) throw new Error(`could not found a ${desc} card`);
  return card;
}

function getCardByValue(value: number): Card {
  const card = myDeck.find((card) => card.absoluteVal() === value);
  if (!card) throw new Error(`could not found a ${value} card`);
  return card;
}

describe('player', () => {
  const player = new Player('yo');

  const twoCard = getCard('two');
  const fiveCard = getCard('five');
  const eightCard = getCard('eight');
  const tenCard = getCard('ten');
  const aceCard = getCard('ace');

  const actions: Actions = {
    stand: jest.fn(() => {}),
    hit: jest.fn(() => {}),
    split: jest.fn(() => {}),
    double: jest.fn(() => {}),
  };

  beforeEach(() => {
    player.clear()
    jest.clearAllMocks();
  });

  test('hand', () => {
    expect(player.currentHand).toBeUndefined();
    expect(player.hasSecondHand).toBeFalsy();

    player.addCard(fiveCard);

    expect(player.currentHand).toBeInstanceOf(Hand);
    expect(player.currentHand.numOfCards).toBe(1);
    expect(player.currentHand.cards[0]).toEqual(fiveCard);

    player.addCard(fiveCard);
    player.split();
    player.addCard(tenCard);

    expect(player.hasSecondHand).toBeTruthy();
    expect(player.currentHand.cards).toEqual([fiveCard, tenCard]);

    player.selectSecondHand();

    expect(player.hasSecondHand).toBeFalsy();
    expect(player.currentHand.cards).toEqual([fiveCard]);

    expect(player.selectSecondHand).toThrow();
  });

 test('bid', async () => {
    const player = new Player('yo');
    const playerBalance = 100;

    const {originalBid, bidMultiplier, bidLimit: limit} = player;

    expect(player.bid(playerBalance)).toBe(originalBid);

    player.lastBid = originalBid * bidMultiplier;
    player.lostBalance = player.lastBid;
    expect(player.bid(playerBalance)).toBe(originalBid);

    player.lastBid = originalBid * bidMultiplier;
    player.lostBalance = 0;
    expect(player.bid(playerBalance)).toBe(player.lastBid);

    player.lastBid = originalBid;
    player.lostBalance = -(player.lastBid);
    expect(player.bid(playerBalance)).toBe(originalBid * bidMultiplier);

    player.lastBid = limit;
    player.lostBalance = -(limit)
    expect(player.bid(playerBalance)).toBe(limit);
  });

  test('stand on 17 or more', () => {
    for (let i = 7; i <= 11; i++) {
      const card = getCardByValue(i);

      player.addCard(tenCard);
      player.addCard(card);

      jest.clearAllMocks();
      player.play(10, actions);

      expect(actions.stand).toBeCalledTimes(1);

      player.clear();
    }
  });

  test('hit until 17 or more', () => {
    player.addCard(twoCard);
    player.addCard(twoCard);

    for (let i = 0; i < 7; i++) {
      jest.clearAllMocks();
      player.play(10, actions);

      expect(actions.hit).toBeCalledTimes(1);

      player.addCard(twoCard);
    }
  });

  it('should split', () => {
    player.addCard(eightCard);
    player.addCard(eightCard);

    player.play(10, actions);

    expect(actions.split).toBeCalledTimes(1);
  });

  it('should double', () => {
    player.addCard(fiveCard);
    player.addCard(aceCard);

    player.play(6, actions);

    expect(actions.double).toBeCalledTimes(1);
  });
});