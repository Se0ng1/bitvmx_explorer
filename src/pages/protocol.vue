<template>
  <div class="protocol">
    <h1>Protocol explorer</h1>
    <ProtocolInput @submit="handleProtocolSubmit" />
    <TransactionInfo
      v-for="(transaction, index) in transactionData"
      :key="index"
      :transactionData="transaction"
      :position="index % 2"
      v-if="transactionData && transactionData.length > 0"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ProtocolInput from '@/components/ProtocolInput.vue'
import TransactionInfo from '@/components/TransactionInfo.vue'

const transactionData = ref(null)

const handleProtocolSubmit = (data) => {
  transactionData.value = data
}
</script>

<style scoped>
.protocol {
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
}
</style>
