import axios from 'axios'

const baseUrl = '/regtest-rpc'

export const fetchTransactionData = async (txid) => {
  try {
    console.log('Fetching transaction:', txid)
    const response = await axios.post(baseUrl, {
      jsonrpc: '1.0',
      id: 'bitvmx-explorer',
      method: 'getrawtransaction',
      params: [txid, true]  // true for verbose output instead of 2
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('RPC Response:', response.data)
    
    if (response.data.error) {
      throw new Error(response.data.error.message || 'RPC error occurred')
    }
  
  const tx = response.data.result
  
  const formattedTx = {
    txid: tx.txid || tx.hash,
    version: tx.version,
    locktime: tx.locktime,
    vin: tx.vin.map(input => ({
      txid: input.txid,
      vout: input.vout,
      sequence: input.sequence,
      prevout: null,  // Will be filled later
      witness: input.txinwitness || []
    })),
    vout: tx.vout.map(output => ({
      scriptpubkey: output.scriptPubKey?.hex,
      scriptpubkey_type: output.scriptPubKey?.type === 'witness_v1_taproot' ? 'v1_p2tr' : output.scriptPubKey?.type,
      scriptpubkey_address: output.scriptPubKey?.addresses ? output.scriptPubKey.addresses[0] : output.scriptPubKey?.address,
      value: Math.round(output.value * 100000000)
    })),
    size: tx.size || tx.vsize,
    weight: tx.weight || (tx.vsize * 4),
    fee: 0,  // Will be calculated if possible
    status: {
      confirmed: tx.confirmations && tx.confirmations > 0,
      block_height: tx.blockheight || tx.height,
      block_hash: tx.blockhash,
      block_time: tx.blocktime || tx.time
    }
  }
  
  // Fetch prevout for first input if not coinbase
  if (formattedTx.vin[0] && formattedTx.vin[0].txid) {
    try {
      const prevTxResponse = await axios.post(baseUrl, {
        jsonrpc: '1.0',
        id: 'bitvmx-explorer',
        method: 'getrawtransaction',
        params: [formattedTx.vin[0].txid, true]
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const prevTx = prevTxResponse.data.result
      const prevOut = prevTx.vout[formattedTx.vin[0].vout]
      
      if (prevOut) {
        formattedTx.vin[0].prevout = {
          scriptpubkey: prevOut.scriptPubKey?.hex,
          scriptpubkey_type: prevOut.scriptPubKey?.type === 'witness_v1_taproot' ? 'v1_p2tr' : prevOut.scriptPubKey?.type,
          scriptpubkey_address: prevOut.scriptPubKey?.addresses ? prevOut.scriptPubKey.addresses[0] : prevOut.scriptPubKey?.address,
          value: Math.round(prevOut.value * 100000000)
        }
      }
    } catch (prevError) {
      console.error('Error fetching previous transaction:', prevError)
    }
  }
  
  return formattedTx
  } catch (error) {
    console.error('Error fetching transaction data:', error)
    console.error('Error response:', error.response?.data)
    
    if (error.response?.status === 500) {
      // Check if it's an RPC error
      if (error.response?.data?.error) {
        const rpcError = error.response.data.error
        if (rpcError.code === -5) {
          throw new Error('Transaction not found in regtest node')
        }
        throw new Error(`RPC Error: ${rpcError.message}`)
      }
      throw new Error('Bitcoin RPC server error. Check your node configuration and ensure RPC is enabled')
    } else if (error.response?.status === 404) {
      throw new Error('Transaction not found')
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to regtest node. Make sure your Bitcoin regtest node is running on localhost:8332')
    }
    throw error
  }
}

export const fetchAddressData = async (txid, address) => {
  try {
    const response = await axios.post(baseUrl, {
    jsonrpc: '1.0',
    id: 'bitvmx-explorer',
    method: 'scantxoutset',
    params: ['start', [`addr(${address})`]]
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
    auth: {
      username: 'bitcoin',
      password: 'bitcoin'
    }
  })
  
  const utxos = response.data.result.unspents || []
  
  for (const utxo of utxos) {
    const spendingTxResponse = await axios.post(baseUrl, {
      jsonrpc: '1.0',
      id: 'bitvmx-explorer',
      method: 'gettxspendingprevout',
      params: [[{ txid: utxo.txid, vout: utxo.vout }]]
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    }).catch(() => null)
    
    if (spendingTxResponse && spendingTxResponse.data.result[0].spendingtxid) {
      const spendingTx = await fetchTransactionData(spendingTxResponse.data.result[0].spendingtxid)
      if (spendingTx.vin[0].txid === txid) {
        return spendingTx
      }
    }
  }
  
  return null
  } catch (error) {
    console.error('Error fetching address data:', error)
    return null
  }
}

export const fetchTransactionURL = (txid) => {
  return `#${txid}` // No explorer for regtest, just return hash
}