import { NearBindgen, near, call, view, bytes, initialize, UnorderedMap, NearPromise } from 'near-sdk-js';
import { AccountId } from 'near-sdk-js/lib/types';
import { assert } from './utils'
import { STORAGE_COST } from './model'

type Side = 'heads' | 'tails'
const CALL_GAS: bigint = BigInt("10000000000000");
function simulateCoinFlip(): Side {
  // randomSeed creates a random string, learn more about it in the README
  const randomString: string = near.randomSeed().toString();
  near.log(`RandomString is ${randomString}`);
  // If the last charCode is even we choose heads, otherwise tails
  return randomString.charCodeAt(0) % 2 ? 'heads' : 'tails';
}


@NearBindgen({})
export class CoinFlip {
  beneficiary: string = "luckymoneytest.testnet";
  points: UnorderedMap<number> = new UnorderedMap<number>("points");


  @initialize({ privateFunction: true })
  init({ beneficiary }: { beneficiary: string }) {
    this.beneficiary = beneficiary
  }

  pay({ amount, to }) {
    near.log(`2. Transfer to ${to}, amount = ${amount} success!`);
    return NearPromise.new(to).transfer(amount);
  }

  pay2({ amount, to }) {
    return NearPromise.new(to).functionCall("set_awa", "howdy", amount, CALL_GAS);
  }

  @call({ payableFunction: true })
  transfer({ to, amount }: { to: AccountId, amount: bigint }) {
    NearPromise.new(to).transfer(amount);
    //******************************************* */
    // chưa chuyển tiền từ contract tới accountid được
    //https://docs.near.org/sdk/js/promises/token-tx
  }
  
  /*@call({ payableFunction: true })
  flip_coin({ player_guess }: { player_guess: Side }): Side {
    this.flip_coin2({player_guess: player_guess}).
  }*/
  /*
    Flip a coin. Pass in the side (heads or tails) and a random number will be chosen
    indicating whether the flip was heads or tails. If you got it right, you get a point.
  */
  @call({ payableFunction: true })
  flip_coin({ player_guess }: { player_guess: Side }) {
    // Get who is calling the method and how much $NEAR they attached
    //let donor = near.predecessorAccountId();
    let donationAmount: bigint = near.attachedDeposit() as bigint;
    // Send the money to the beneficiary
    const promise = near.promiseBatchCreate(this.beneficiary);
    near.promiseBatchActionTransfer(promise, donationAmount);
    
    // Check who called the method
    const player: AccountId = near.predecessorAccountId();
    near.log(`${player} chose ${player_guess}`);

    // Simulate a Coin Flip
    const outcome = simulateCoinFlip();
    // Get the current player points
    let player_points: number = this.points.get(player, { defaultValue: 0 })
    let amount = donationAmount + donationAmount - STORAGE_COST;
    // Check if their guess was right and modify the points accordingly
    if (player_guess == outcome) {
      near.log(`The result was ${outcome}, you get a point!`);
      player_points += 1;
      //NearPromise.new(near.currentAccountId()).transfer(donationAmount + donationAmount);
      //var amo = donationAmount + donationAmount;
      var ple = near.currentAccountId();
      
      //this.transfer({to: player, amount: amount});
      

      near.log(`Transfer to ${player} / ${ple}, amount = ${amount} success!`);
      if (player_points == 5){
        player_points = 0;
        amount = amount + donationAmount;
        near.log(`player_points = 5, you get more money!`);
      }
      // Store the new points
      this.points.set(player, player_points);
      return NearPromise.new(player).transfer(amount);
    } else {
      near.log(`The result was ${outcome}, you lost a point`);
      player_points = player_points ? player_points - 1 : 0;
      this.points.set(player, player_points);
      return;
    }
    //this.pay({ "amount": amount, "to": player});
    //this.pay2({ "amount": amount, "to": player});

    
   // return outcome
  }

  @call({ privateFunction: true })
  change_beneficiary(beneficiary) {
    this.beneficiary = beneficiary;
  }

  @view({})
  get_beneficiary(): string { return this.beneficiary }

  // View how many points a specific player has
  @view({})
  points_of({ player }: { player: AccountId }): number {
    const points = this.points.get(player, {defaultValue: 0})
    near.log(`Points for ${player}: ${points}`)
    return points
  }
}