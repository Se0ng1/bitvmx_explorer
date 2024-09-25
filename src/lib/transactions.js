import { useNetworkStore } from '../stores/network' // Import the network store

let fetchTransactionDataAPI
let fetchAddressDataAPI

const networkStore = useNetworkStore() // Create an instance of the network store
const currentNetwork = networkStore.networkId // Access the networkId from the store

const loadNetworkFunctions = async () => {
  if (currentNetwork === 'mainnet') {
    // Import mainnet functions
    const mainnet = await import('./networkTransactions/mainnet')
    fetchTransactionDataAPI = mainnet.fetchTransactionData
    fetchAddressDataAPI = mainnet.fetchAddressData
  } else if (currentNetwork === 'testnet') {
    // Import testnet functions
    const testnet = await import('./networkTransactions/testnet')
    fetchTransactionDataAPI = testnet.fetchTransactionData
    fetchAddressDataAPI = testnet.fetchAddressData
  } else {
    // Import mutinynet functions
    const mutinynet = await import('./networkTransactions/mutinynet')
    fetchTransactionDataAPI = mutinynet.fetchTransactionData
    fetchAddressDataAPI = mutinynet.fetchAddressData
  }
}

await loadNetworkFunctions() // Load the appropriate network functions

export const fetchTransactionData = async (txid) => {
  // Call the appropriate network implementation
  return fetchTransactionDataAPI(txid)
}

export const fetchAddressData = async (txid, address) => {
  // Call the appropriate network implementation
  return fetchAddressDataAPI(txid, address)
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
