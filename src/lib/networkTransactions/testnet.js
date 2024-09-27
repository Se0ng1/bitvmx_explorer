import axios from 'axios'

const baseUrl = 'https://mempool.space/testnet/api'

export const fetchTransactionData = async (txid) => {
  const response = await axios.get(`${baseUrl}/tx/${txid}`, {
    headers: {
      Accept: 'application/json, text/plain, */*'
    }
  })
  await new Promise((resolve) => setTimeout(resolve, 100))
  return response.data
}

export const fetchAddressData = async (txid, address) => {
  const response = await axios.get(`${baseUrl}/address/${address}/txs`, {
    headers: {
      Accept: 'application/json, text/plain, */*'
    }
  })
  await new Promise((resolve) => setTimeout(resolve, 100))
  return response.data.filter((item) => item.vin[0].txid === txid)[0] || null
}

export const fetchTransactionURL = (txid) => {
  return `https://mempool.space/testnet/tx/${txid}`
}
