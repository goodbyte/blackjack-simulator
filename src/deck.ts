type Suit = 'spade' | 'diamon' | 'club' | 'heart';
type CardDescription = 'two' | 'three' | 'four' | 'five' | 'six' | 'seven' | 'eight' | 'nine' | 'ten' | 'jack' | 'queen' | 'king' | 'ace';

export interface Card {
  val: number | [number, number];
  suit: Suit;
  desc: CardDescription;
  absoluteVal(): number;
  toEmojiString(): string;
}

const emojis = {
  spade: '♠',
  diamon: '♦',
  club: '♣',
  heart: '♥',
};

export class Card {
  constructor(
    public val: number | [number, number],
    public suit: Suit,
    public desc: CardDescription,
  ) {}

  absoluteVal(): number {
    return Array.isArray(this.val) ? this.val[1] : this.val;
  }

  toEmojiString(): string {
    const val = this.absoluteVal();
    const emoji = emojis[this.suit];

    return `[${val}${emoji}]`;
  }
}

function newSet(suit: Suit): Card[] {
  const set: Pick<Card, 'val' | 'desc'>[] = [
    {val: 2, desc: 'two'},
    {val: 3, desc: 'three'},
    {val: 4, desc: 'four'},
    {val: 5, desc: 'five'},
    {val: 6, desc: 'six'},
    {val: 7, desc: 'seven'},
    {val: 8, desc: 'eight'},
    {val: 9, desc: 'nine'},
    {val: 10, desc: 'ten'},
    {val: 10, desc: 'jack'},
    {val: 10, desc: 'queen'},
    {val: 10, desc: 'king'},
    {val: [1, 11], desc: 'ace'},
  ];
  return set.map((c) => new Card(c.val, suit, c.desc));
}

export const myDeck: ReadonlyArray<Card> = [
  ...newSet('spade'),
  ...newSet('diamon'),
  ...newSet('club'),
  ...newSet('heart'),
];