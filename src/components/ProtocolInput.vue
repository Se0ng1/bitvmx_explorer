<script setup>
import { ref, onMounted } from 'vue'
import { fetchProtocolData } from '@/lib/transactions'
import { useTransactionStore } from '@/stores/transactions'

const transactionStore = useTransactionStore()
const inputValue = ref(transactionStore.txId) // Initialize with the store value
const errorMessage = ref('')
const emit = defineEmits(['submit'])

const isValidTxId = (txid) => {
  const txidRegex = /^[a-fA-F0-9]{64}$/
  return txidRegex.test(txid)
}

const handleSubmit = async () => {
  if (isValidTxId(inputValue.value)) {
    try {
      const transactions = await fetchProtocolData(inputValue.value)
      emit('submit', transactions)
      errorMessage.value = ''
      transactionStore.setTxId(inputValue.value) // Save the transaction ID to the store
    } catch (error) {
      errorMessage.value = error.message
      emit('submit', null)
    }
  } else {
    errorMessage.value = 'Invalid Bitcoin transaction ID format'
    emit('submit', null)
  }
}

onMounted(() => {
  // Load the transaction ID from the store on mount
  inputValue.value = transactionStore.txId
  if (isValidTxId(inputValue.value)) {
    handleSubmit() // Automatically submit if a valid transaction ID exists
  }
})
</script>

<template>
  <div class="protocol-input">
    <v-text-field
      v-model="inputValue"
      label="Enter a Bitcoin transaction ID that is part of the protocol"
      outlined
    />
    <v-btn @click="handleSubmit" color="primary">Submit</v-btn>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.protocol-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

input {
  padding: 5px;
}

.error-message {
  color: red;
}
</style>
