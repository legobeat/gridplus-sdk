import ethers from 'ethers';
import config from '../config.js';
import { pad64, unpad } from '../util.js';
import { BigNumber } from 'bignumber.js';
import { BN } from 'bn.js';

const erc20Decimals = {};

export default class Ethereum {
  constructor (opts) {
    this.name = 'ethereum';
    this.shortcode = 'ETH';
    if (opts && opts.etherscan === true) {
      this.etherscan = true;
      this.network = opts.network || 'homestead'; // No idea why mainnet is still being called homestead...
      this.provider = new ethers.providers.EtherscanProvider(this.network, config.etherscanApiKey);
    } else {
      this.etherscan = false;
      this.network = null;
      const url = typeof opts === 'string' ? opts : (opts && opts.host && opts.port ? `http://${opts.host}:${opts.port}` : 'http://localhost:8545');
      this.provider = new ethers.providers.JsonRpcProvider(url);
    }
  }

  broadcast (data, cb) {
    this.provider.sendTransaction(data.tx)
    .then((txHash) => {
      this._getTx(txHash, (err, tx) => {
        if (err) return cb(err);
        tx.timestamp = new Date().getTime() / 1000;
        tx.in = 0;
        return cb(null, tx);
      });
    })
    .catch((err) => { 
      return cb(err);
    })
  }

  buildTx (from, to, value, opts = {}, cb) {
    if (typeof from !== 'string') {
      cb('Please specify a single address to transfer from');
    } else {
      this.getNonce(from)
        .then((nonce) => {
          const tx = [ nonce, null, null, to, null, null ];
          // Fill in `value` and `data` if this is an ERC20 transfer
          if (opts.ERC20Token !== undefined) {
            tx[5] = config.erc20.transfer(to, value);
            tx[4] = 0;
            tx[3] = opts.ERC20Token;
            tx[2] = 100000; // gas=100,000 to be safe
          } else {
            tx[5] = '';
            tx[4] = value;
            tx[2] = 22000; // gas=22000 for ETH transfers
          }
          // Check for a specified gas price (should be in decimal)
          if (opts.gasPrice !== undefined) {
            tx[1] = opts.gasPrice;
          } else {
            tx[1] = config.defaults.gasPrice;
          }
          cb(null, tx);
        })
        .catch((err) => {
          cb(err);
        });
    }
  }

  getBalance ({ address, erc20Address = null}, cb) {
    const data = {
      balance: 0,
      transfers: {}
    };
    if (erc20Address !== null) {
      if (erc20Decimals[erc20Address] === undefined) {
        // Save the contract as an object
        this.provider.call({ to: erc20Address, data: config.erc20.decimals() })
        .then((decimals) => {
          erc20Decimals[erc20Address] = parseInt(decimals);
          data.decimals = parseInt(decimals);
          // Get the balance
          return this.provider.call({ to: erc20Address, data: config.erc20.balanceOf(address) })
        })
        .then((balance) => {
          data.balance = parseInt(balance) / Math.pow(10, erc20Decimals[erc20Address]);
          cb(null, data);
        })
        .catch((err) => { cb(err); });
      } else {
        // If the decimals are cached, we can just query the balance
        this.provider.call({ to: erc20Address, data: config.erc20.balanceOf(address) })
        .then((balance) => {
          data.decimals = erc20Decimals[erc20Address];
          data.balance = parseInt(balance);
          return this.provider.getTransactionCount(address)
        })
        .then((nonce) => {
          data.nonce = parseInt(nonce);
          cb(null, data);
        })
        .catch((err) => { cb(err); });
      }
    } else {
      // Otherwise query for the ETH balance
      this.provider.getBalance(address)
      .then((balance) => {
        data.balance = parseInt(balance);
        return this.provider.getTransactionCount(address)
      })
      .then((nonce) => {
        data.nonce = parseInt(nonce);
        cb(null, data);
      })
      .catch((err) => { cb(err); })
    }
  }

  getTx(hashes, cb, opts={}, filled=[]) {
    if (typeof hashes === 'string') {
      return this._getTx(hashes, cb);
    } else if (hashes.length === 0) {
      return cb(null, filled);
    } else {
      const hash = hashes.shift();
      return this._getTx(hash, (err, tx) => {
        if (err) return cb(err);
        if (tx) filled.push(tx);
        return this.getTx(hashes, cb, opts, filled);
      });
    }
  }

  initialize (cb) {
    return cb(null, this.provider);
  }

  getTxHistory(opts, cb) {
    const events = {}
    const { address, erc20Address } = opts;
    if (erc20Address) {
      // TODO: Token transfer output needs to conform to the same schema as the history from etherscan
      // This block is deprecated

      // Get transfer "out" events
      // this._getEvents(erc20Address, [ null, `0x${pad64(address)}`, null ])
      // .then((outEvents) => {
      //   events.out = outEvents;
      //   return this._getEvents(erc20Address, [ null, null, `0x${pad64(address)}` ])
      // })
      // .then((inEvents) => {
      //   events.in = inEvents;
      //   const data = this._parseTransferLogs(events, 'ERC20', erc20Decimals[erc20Address]);
      //   return cb(null, data);
      // })
      // .catch((err) => { 
      //   return cb(err); 
      // })
    } else if (this.etherscan === true) {
      this.provider.getHistory(address)
      .then((history) => { return cb(null, this._filterTxs(history, address)); })
      .catch((err) => { return cb(err); })
    } else {
      return cb(null, []);
    }
  }

  getNonce(user) {
    return new Promise((resolve, reject) => {
      this.provider.getTransactionCount(user)
      .then((nonce) => { 
        // Unclear why etherscan returns 1 lower than the nonce should be
        // TODO: Make sure this is the case
        if (this.etherscan === true) nonce += 1;  
        return resolve(nonce); 
      })
      .catch((err) => { return reject(err); })
    });
  }

  _filterTxs(txs, address) {
    const newTxs = [];
    const isArray = txs instanceof Array === true;
    if (!isArray) txs = [ txs ];
    const ethFactor = new BigNumber('1e18');
    txs.forEach((tx) => {
      const valString = tx.value.toString();
      const val = new BigNumber(valString);
      newTxs.push({
        to: tx.to,
        from: tx.from,
        fee: tx.gasPrice.mul(tx.gasLimit).toNumber(),
        in: tx.to.toLowerCase() === address.toLowerCase() ? 1 : 0,
        hash: tx.hash,
        currency: 'ETH',
        height: tx.blockNumber,
        timestamp: tx.timestamp,
        value: val.div(ethFactor).toNumber(),
        data: tx, 
      });
    });
    return newTxs;
  }

  _getEvents(address, topics, fromBlock=0, toBlock='latest') {
    return new Promise((resolve, reject) => {
      this.provider.getLogs({ address, topics, fromBlock, toBlock })
      .then((events) => { return resolve(events); })
      .catch((err) => { return reject(err); })
    });
  }

  _getTx(hash, cb) {
    let tx;
    return this.provider.getTransaction(hash)
    .then((txRaw) => {
      if (!txRaw) return cb(null, null);
      tx = {
        currency: 'ETH',
        hash: txRaw.hash,
        height: txRaw.blockNumber || -1,
        from: txRaw.from,
        to: txRaw.to,
        value: this._getValue(txRaw),
        fee: this._getFee(txRaw),
        in: 0,  // For now, we can assume any transactions are outgoing. TODO: figure a way to get incoming txs
        data: txRaw,
      }
      const fCode = txRaw.data.slice(2, 10);
      if (tx.value === 0 && fCode === config.ethFunctionCodes.ERC20Transfer) {
        return this._getERC20TransferValue(hash, (err, erc20Tx) => {
          if (err) return cb(err);
          tx.to = erc20Tx.to;
          tx.contract = erc20Tx.contract;
          tx.value = erc20Tx.value;
          tx.from = erc20Tx.from;
          return cb(null, tx);
        })
      } else {
        return cb(null, tx); 
      }
    })
    .catch((err) => { return cb(err); })
  }

  _getERC20TransferValue(hash, cb) {
    return this.provider.getTransactionReceipt(hash)
    .then((receipt) => {
      return cb(null, this._parseLog(receipt.logs[0], 'ERC20'));
    })
    .catch((err) => {
      return cb(err);
    })
  }

  _getValue(tx) {
    if (tx.value.toString() !== '0') {
      const factor = BigNumber('-1e18');
      const value = BigNumber(tx.value.toString());
      return value.div(factor).toString();
    } else {
      return 0;
    }
  }

  _getFee(tx) {
    const factor = BigNumber('-1e18');
    const weiFee = new BigNumber(tx.gasPrice.mul(tx.gasLimit).toString());
    return weiFee.div(factor).toString();
  }

  _parseLog(log, type, decimals=0) {
    switch (type) {
      case 'ERC20':
        return {
          transactionHash: log.transactionHash,
          contract: log.address,
          from: `0x${unpad(log.topics[1])}`,
          to: `0x${unpad(log.topics[2])}`,
          value: parseInt(log.data) / Math.pow(10, decimals),
        };
      default:
        return {};
    }
  }

  _parseTransferLogs(logs, type, decimals=0) {
    const newLogs = { in: [], out: [] };
    logs.out.forEach((log) => {
      newLogs.out.push(this._parseLog(log, type, decimals));
    });
    logs.in.forEach((log) => {
      newLogs.in.push(this._parseLog(log, type, decimals));
    });
    return newLogs;
  }

}