# Lightning Twitter

## bitcoind docker
Origin README [uimarinho/docker-bitcoin-core's README](https://github.com/ruimarinho/docker-bitcoin-core/blob/master/README.md)

## Quick Start (with regtest mode)

```
$ git clone git@github.com:egapool/docker-bitcoind-lnd.git
$ cd docker-bitcoind-lnd
$ docker-compose build
$ docker-compose up -d

// Make genesis block
$ docker exec --user bitcoin bitcoin-server bitcoin-cli -regtest generate 1 
```

## Document

### start mining
```
$ docker exec --user bitcoin bitcoin-server bitcoin-cli -regtest generate 1
[
  "764e9777c9b9a2a5023759e64e2d51b98584eb90f501cfd3f336e1247e3863f8"
]
```

### get mininginfo
```
$docker exec --user bitcoin bitcoin-server bitcoin-cli -regtest getmininginfo
{
  "blocks": 102,
  "currentblockweight": 4000,
  "currentblocktx": 0,
  "difficulty": 4.656542373906925e-10,
  "networkhashps": 8.026730334062129e-07,
  "pooledtx": 0,
  "chain": "regtest",
  "warnings": ""
}
```

### create new address
```
$docker exec --user bitcoin bitcoin-server bitcoin-cli -regtest getnewaddress user_name
```
`user_name` is account name.

### mining
```
$docker exec --user bitcoin bitcoin-server bitcoin-cli -regtest generatetoaddress 2 2N8fXXXXXXXXXXXXXXXXXXXXXXXXXXXX 500000
$docker exec --user bitcoin bitcoin-server bitcoin-cli -regtest generate 100
```
マイニング報酬は100ブロック経過後付与される

## LND
### Generate new address in lightning wallet and get BTC by mining
```
// host
$ docker exec -it alice bash

// container
bash-4.4# lncli --macaroonpath=/root/.lnd/data/chain/bitcoin/regtest/admin.macaroon newaddress np2wkh
xxxxxxxxx-address-xxxxxxxxxxxx
```

At another terminal

```
// host
$ docker exec --user bitcoin bitcoin-server bitcoin-cli -regtest generatetoaddress 101 xxxxxxxxx-address-xxxxxxxxxxxx
$ docker exec -it alice bash

// container
bash-4.4# lncli --macaroonpath=/root/.lnd/data/chain/bitcoin/regtest/admin.macaroon walletbalance
{
    "total_balance": "5000000000",
    "confirmed_balance": "5000000000",
    "unconfirmed_balance": "0"
}
```

```
bash-4.4# lncli --network=simnet openchannel --node_key=<bob_identity_pubkey> --local_amt=1000000
bash-4.4# lncli --macaroonpath=/root/.lnd/data/chain/bitcoin/regtest/admin.macaroon connect <pub_key>@<remote_host>
bash-4.4# lncli --macaroonpath=/root/.lnd/data/chain/bitcoin/regtest/admin.macaroon addinvoice --amt=100




