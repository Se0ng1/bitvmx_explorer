<template>
  <div class="protocol">
    <v-row>
      <v-col cols="12" md="6">
        <h1>Protocol explorer</h1>
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          v-model="selectedNetwork"
          :items="networks"
          label="Network"
          @update:modelValue="setNetwork"
          class="network-dropdown"
        />
      </v-col>
    </v-row>
    <ProtocolInput @submit="handleProtocolSubmit" />
    <TransactionInfo
      v-if="transactionData && transactionData.length > 0"
      :transactionData="transactionData[0]"
      :position="null"
    />
    <template v-if="transactionData && transactionData.length > 0">
      <TransactionInfo
        v-for="(transaction, index) in transactionData.slice(1)"
        :key="index"
        :transactionData="transaction"
        :position="index % 2"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ProtocolInput from '@/components/ProtocolInput.vue'
import TransactionInfo from '@/components/TransactionInfo.vue'
import { useNetworkStore } from '@/stores/network'
import { useRouter } from 'vue-router' // Import the router

const networkStore = useNetworkStore()
const router = useRouter() // Initialize the router

const transactionData = ref(null)
const selectedNetwork = ref('')

onMounted(() => {
  const savedNetworkId = networkStore.networkId || 'mutinynet'
  selectedNetwork.value = savedNetworkId
})

const networks = ['mainnet', 'testnet', 'mutinynet']

const handleProtocolSubmit = (data) => {
  transactionData.value = data
}

const setNetwork = (network) => {
  networkStore.setNetworkId(network)
  router.go(0)
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
