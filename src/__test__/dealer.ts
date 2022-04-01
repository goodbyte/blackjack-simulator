import {shuffle} from 'shuffle';
import {Dealer} from '../dealer';
import {Card, myDeck} from '../deck';
import {Player} from '../player';

describe('dealer', () => {
  const deck = shuffle({
    deck: myDeck as [],
    numberOfDecks: 8,
  });

  const shufflePerc = 50;
  const balances = {
    yo: 100,
  };

  const dealer = new Dealer({deck, shufflePerc, balances});
  const yo = new Player('yo');

  const fiveCard = myDeck.find((card) => card.val === 5);
  if (!fiveCard) throw new Error('could not find a card with value 5');

  beforeEach(() => {
    balances.yo = 100;
    dealer.reset();
  });

  it('should create a new instance', () => {
    expect(dealer).toBeInstanceOf(Dealer);
  });

  test('balance for player yo should be 100', () => {
    expect(dealer.getBalance(yo)).toBe(100);
  });

  it('should add a new player', () => {
    dealer.addPlayer(yo);

    expect(dealer.players.length).toBe(1);
  });

  it('should return a new card', () => {
    const length = dealer.deck.length;
    const card = dealer.drawCard();

    expect(card).toMatchObject<Card>(card);
    expect(dealer.deck.length).toBeLessThan(length);
  });

  test('bid', () => {
    const currentBalance = dealer.getBalance(yo);
    const bidAmount = 1;

    dealer.bid(yo, bidAmount);

    expect(dealer.getBalance(yo)).toBe(currentBalance - bidAmount);
    expect(dealer.getBidAmount(yo)).toBe(bidAmount);

    const myBalance = dealer.getBalance(yo);
    const bidFn = dealer.bid.bind(dealer, yo, myBalance + 1);

    expect(bidFn).toThrow();
  });

  test('double', () => {
    const balance = dealer.getBalance(yo);

    dealer.bid(yo, 50);

    expect(dealer.canDouble(yo)).toBeTruthy();

    const bid = dealer.getBidAmount(yo);

    dealer.bidDouble(yo);

    expect(dealer.getBalance(yo)).toBe(balance - (bid * 2));
    expect(dealer.getBidAmount(yo)).toBe(bid * 2);

    dealer.reset();
    dealer.setBalance(yo, 100);
    dealer.bid(yo, 100);

    expect(dealer.canDouble(yo)).toBeFalsy();

    const bidFn = dealer.bidDouble.bind(dealer, yo);
    expect(bidFn).toThrow();
  });

  test('player won', () => {
    const {currentHandIndex} = yo;
    const bidAmount = 100;

    dealer.bid(yo, bidAmount);

    yo.addCard(fiveCard);

    dealer.playerHandWon(yo, currentHandIndex, 'DEALER_WON');
    expect(dealer.getBalance(yo)).toBe(bidAmount * 2);
  });

  test('player won blackjack', () => {
    const {currentHandIndex} = yo;
    const bidAmount = 100;

    dealer.bid(yo, bidAmount);

    yo.addCard(fiveCard);

    dealer.playerHandWon(yo, currentHandIndex, 'BLACKJACK');
    expect(dealer.getBalance(yo)).toBe(bidAmount * 2.5);
  });
});