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
  
  /*
    Flip a coin. Pass in the side (heads or tails) and a random number will be chosen
    indicating whether the flip was heads or tails. If you got it right, you get a point.
  */
  @call({ payableFunction: true })
  flip_coin({ player_guess }: { player_guess: Side }) {
    // Get who is calling the method and how much $NEAR they attached
    let amount: bigint = near.attachedDeposit() as bigint;
    let doubleReward = 3;
    let percentReward = 95;

    // Send the money to the beneficiary
    const promise = near.promiseBatchCreate(this.beneficiary);
    near.promiseBatchActionTransfer(promise, amount);
    
    // Check who called the method
    const player: AccountId = near.predecessorAccountId();
    near.log(`${player} chose ${player_guess}`);

    // Simulate a Coin Flip
    const outcome = simulateCoinFlip();
    // Get the current player points
    let player_points: number = this.points.get(player, { defaultValue: 0 })
    
    
    // Check if their guess was right and modify the points accordingly
    if (player_guess == outcome) {
      near.log(`The result was ${outcome}, you get a point!`);
      player_points += 1;
      let rewardAmount = ((amount + amount) * BigInt(percentReward) / BigInt(100)) - STORAGE_COST;
      
      if (player_points == doubleReward){
        player_points = 0;

        rewardAmount = rewardAmount + amount;
        near.log(`Congratulations points is ${doubleReward}, you get x2 reward!`);
      }
      // Store the new points
      this.points.set(player, player_points);

      near.log(`Transfer to ${player}, amount = ${rewardAmount} success!`);
      return NearPromise.new(player).transfer(rewardAmount);
    } 
    else {
      near.log(`The result was ${outcome}, you lost a point`);
      player_points = player_points ? player_points - 1 : 0;
      this.points.set(player, player_points);
      return;
    }

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