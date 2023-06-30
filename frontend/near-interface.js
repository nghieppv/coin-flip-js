/* Talking with a contract often involves transforming data, we recommend you to encapsulate that logic into a class */

//https://docs.near.org/tools/near-api-js/quick-reference#key-store
import * as nearAPI from "near-api-js";
const { connect, KeyPair, keyStores, utils } = nearAPI;
const networkId = "testnet";
const sender = "luckymoneytest.testnet";
const myKeyStore = new keyStores.BrowserLocalStorageKeyStore();
// Tìm ở đây: https://docs.near.org/integrator/create-transactions#access-keys
//const SENDER_PRIVATE_KEY = 'ed25519:67ijmz8du6Hi1tXjb8MgWsEEwsTN9wFK4c8y9d2VVAt9VsFt4EHjwRco1yTf3gqHwQn5kVZEKy8Jm7H7SRu82pYr';

const connectionConfig = {
  networkId: networkId,
  keyStore: myKeyStore, // first create a key store 
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
};

export class Contract {

  constructor({ contractId, walletToUse }) {
    this.contractId = contractId;
    this.wallet = walletToUse;
  }

  async getAcountTotal(accountId){
    const nearConnection = await connect(connectionConfig);
    const account = await nearConnection.account(accountId);
    
    let am = await account.getAccountBalance();
    console.log("am: " + JSON. stringify(am));
    return utils.format.formatNearAmount(am.total, 2);
  }

  async getBeneficiary() {
    return await this.wallet.viewMethod({ contractId: this.contractId, method: "get_beneficiary" })
  }

  async latestDonations() {
    const number_of_donors = await this.wallet.viewMethod({ contractId: this.contractId, method: "number_of_donors" })
    const min = number_of_donors > 10 ? number_of_donors - 9 : 0

    let donations = await this.wallet.viewMethod({ contractId: this.contractId, method: "get_donations", args: { from_index: min.toString(), limit: number_of_donors } })

    donations.forEach(elem => {
      elem.total_amount = utils.format.formatNearAmount(elem.total_amount);
    })

    return donations
  }

  async getDonationFromTransaction(txhash) {
    let donation_amount = await this.wallet.getTransactionResult(txhash);
    return utils.format.formatNearAmount(donation_amount);
  }

  async donate(amount) {
    let deposit = utils.format.parseNearAmount(amount.toString())
    let response = await this.wallet.callMethod({ contractId: this.contractId, method: "donate", deposit })
    return response
  }

}