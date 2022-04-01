import {shuffle} from 'shuffle';
import {myDeck} from './deck';
import {Dealer} from './dealer';
import {Player} from './player';

const deck = shuffle({
  deck: myDeck,
  numberOfDecks: 4,
});

const simulations = 2800;
const shufflePerc = 50;

const balances = {
  yo: 100,
};

const dealer = new Dealer({deck, shufflePerc, balances});
const yo = new Player('yo');

dealer.addPlayer(yo);

(() => {
  let currentSimulation = 1;

  try {
    while (
      currentSimulation < simulations &&
      Object.entries(balances).some(([key, val]) => val > 0)
    ) {
      dealer.playHand();
      currentSimulation++;
    }
  } catch (err) {
    console.log('there was an error while runnign the simulation', (<Error>err).message);
  }

  console.log(balances);

  console.log(`That's all Folks!`);
  console.log(`Finished after ${currentSimulation} simulations`);
})();