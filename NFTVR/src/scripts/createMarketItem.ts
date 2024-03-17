import { Mina, PrivateKey, AccountUpdate, Field, UInt64 } from 'o1js';
import {
  IpfsHash,
  NFT,
  NftWitness,
  IpfsHashStorage,
  OwnerStorage,
  PriceStorage,
} from '../contracts/NFT.js';
import axios from 'axios';

export async function createMarketItem() {

  let feepayerKeysBase58 = {
    privateKey: 'EKENwvei3vNdNdYEx1GXkcQB8F9AVE8qD1eQ8bD8Hp29TUsRUBbV',
    publicKey: 'B62qm2JwhNpwsSBqqgQKZkYK3h1b87uWS24FTbzEPpQSCQ83qA4Vu76',
  };
  let zkAppKeysBase58 = {
    privateKey: 'EKFHUHXnBHk5b5VNiXYNrn7L8PWgtE62QRQzxeM7g5PrVi8bTPtY',
    publicKey: 'B62qkMWcHqp3xFZR6Ywmieekg3T2cH1kYMFV7wtvjW86VqwUZyLeDZo',
  };

  let feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
  let zkAppKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);

  // set up Mina instance and contract we interact with
  const fee = 0.101 * 1e9; // in nanomina (1 billion = 1.0 mina)

  const MINAURL = 'https://api.minascan.io/node/berkeley/v1/graphql';
  const ARCHIVEURL = 'https://api.minascan.io/archive/berkeley/v1/graphql/';

  const network = Mina.Network({
    mina: MINAURL,
    archive: ARCHIVEURL,
  });
  Mina.setActiveInstance(network);

  let feepayerAddress = feepayerKey.toPublicKey();
  let zkAppAddress = zkAppKey.toPublicKey();
  let zkApp = new NFT(zkAppAddress);

  // compile the contract to create prover keys
  console.log('compile the contract...');
  await NFT.compile();

  let ownerStorage = new OwnerStorage();
  let ipfsHashStorage = new IpfsHashStorage();
  let priceStorage = new PriceStorage();

  const [ownerLeafs, ipfsHashLeafs, priceLeafs] = await Promise.all([
    (await axios.get(`http://172.168.10.76:4444/leafs/owner`)).data,
    (await axios.get('http://172.168.10.76:4444/leafs/ipfs-hash')).data,
    (await axios.get(`http://172.168.10.76:4444/leafs/price`)).data,
  ]);

  console.log('ownerLeafs: ', ownerLeafs);

  for (let key in ownerLeafs) {
    console.log('key: ', key);
    console.log('ownerLeafs[key]: ', ownerLeafs[key]);
    ownerStorage.updateLeaf(Field(key), Field(ownerLeafs[key]));
  }
  for (let key in ipfsHashLeafs) {
    ipfsHashStorage.updateLeaf(Field(key), Field(ipfsHashLeafs[key]));
  }
  for (let key in priceLeafs) {
    priceStorage.updateLeaf(Field(key), Field(priceLeafs[key]));
  }

  try {
    // call update() and send transaction
    console.log('build transaction and create proof...');
    let tx = await Mina.transaction({ sender: feepayerAddress, fee }, () => {
      zkApp.createMarketItem(
        Field(0),
        UInt64.from(0.69 * 1e9),
        ownerStorage.getWitness(Field(0)),
        priceStorage.getWitness(Field(0))
      );
    });
    await tx.prove();
    await tx.sign([feepayerKey]).send();

    console.log('send transaction...');
    const sentTx = await tx.sign([feepayerKey]).send();
    if (sentTx.status === 'pending') {
      console.log(
        '\nSuccess! Update transaction sent.\n' + '\n Txhash: ' + sentTx.hash
      );
    }
  } catch (err) {
    console.log(err);
  }
}
