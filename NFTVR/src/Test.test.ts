import { A, B } from './contracts/Contract';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Provable,
  TokenId,
  provable,
} from 'o1js';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false;

describe('Testing', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    APrivateKey: PrivateKey,
    AAddress: PublicKey,
    BAddress: PublicKey,
    BPrivateKey: PrivateKey,
    contractA: A,
    contractAA: A,
    contractB: B;

  beforeAll(async () => {
    if (proofsEnabled) {
      await A.compile();
      await B.compile();
    }
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    APrivateKey = PrivateKey.random();
    BPrivateKey = PrivateKey.random();

    AAddress = APrivateKey.toPublicKey();
    BAddress = BPrivateKey.toPublicKey();

    contractA = new A(AAddress);
    contractAA = new A(AAddress, TokenId.derive(AAddress));
    contractB = new B(BAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount, 3);
      contractA.deploy();

      contractAA.deploy();
      contractA.approve(contractAA.self);

      contractB.deploy();
      contractB.addressA.set(AAddress);
    });
    await txn.prove();
    await txn.sign([deployerKey, APrivateKey, BPrivateKey]).send();
  }

  it('Test contract A call contract B', async () => {
    await localDeploy();

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      contractAA.setNumberInB(BAddress, Field(69));
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedNum = contractB.num.get();
    expect(updatedNum).toEqual(Field(69));
  });
  it('Call direct contract B will fail', async () => {
    await localDeploy();

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      contractB.setNumber(Field(96));
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedNum = contractB.num.get();
    expect(updatedNum).toEqual(Field(0));
  });
});
