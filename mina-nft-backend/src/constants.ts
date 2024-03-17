import { Mina } from 'o1js';

export const MinaScanNetwork = Mina.Network({
    mina: process.env.MINA_SCAN_MINA,
    archive: process.env.MINA_SCAN_ARCHIVE,
});

export const MaxRetries = 5;

export const NFT_TREE_HEIGHT = 5;

export const MAX_NFT_ITEM = 2 ** NFT_TREE_HEIGHT;
