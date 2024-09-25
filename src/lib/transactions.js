import axios from 'axios'

export const fetchTransactionData = async (txid) => {
  try {
    const response = await axios.get(`https://mutinynet.com/api/tx/${txid}`, {
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    })
    return response.data // Return the response data
  } catch (error) {
    throw new Error('Error fetching transaction data: ' + error.message)
  }
}

export const fetchAddressData = async (txid, address) => {
  try {
    const response = await axios.get(`https://mutinynet.com/api/address/${address}/txs`, {
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    })
    const filteredData = response.data.filter((item) => item.vin[0].txid === txid)
    if (filteredData.length > 0) {
      return filteredData[0]
    } else {
      return null
    }
  } catch (error) {
    throw new Error('Error fetching address data: ' + error.message)
  }
}

export const fetchProtocolData = async (txid) => {
  let newTransaction = await fetchTransactionData(txid)
  let initialArray = [newTransaction]
  while (newTransaction.vin[0].prevout.scriptpubkey_type === 'v1_p2tr') {
    newTransaction = await fetchTransactionData(newTransaction.vin[0].txid)
    initialArray.unshift(newTransaction)
  }
  newTransaction = initialArray[initialArray.length - 1]
  while (newTransaction && newTransaction.vout[0].scriptpubkey_type === 'v1_p2tr') {
    newTransaction = await fetchAddressData(
      newTransaction.txid,
      newTransaction.vout[0].scriptpubkey_address
    )
    if (newTransaction) {
      initialArray.push(newTransaction)
    }
  }
  return initialArray
}
