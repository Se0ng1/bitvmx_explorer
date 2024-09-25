import axios from 'axios'

const baseUrl = 'https://mutinynet.com'

export const fetchTransactionData = async (txid) => {
  const response = await axios.get(`${baseUrl}/api/tx/${txid}`, {
    headers: {
      Accept: 'application/json, text/plain, */*'
    }
  })
  return response.data
}

export const fetchAddressData = async (txid, address) => {
  const response = await axios.get(`${baseUrl}/api/address/${address}/txs`, {
    headers: {
      Accept: 'application/json, text/plain, */*'
    }
  })
  return response.data.filter((item) => item.vin[0].txid === txid)[0] || null
}
