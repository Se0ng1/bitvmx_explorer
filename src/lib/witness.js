import CryptoJS from 'crypto-js'

export const detectNextWinternitz = (code) => {
  const regexWinternitzHashing = /a3766b6b(76a9)+6c/
  const matchWinternitz = code.match(regexWinternitzHashing)
  if (matchWinternitz && matchWinternitz.length > 0) {
    const init = matchWinternitz['index']
    const matchHash = /(76a9)+/
    const length = matchWinternitz[0].match(matchHash)[0].length
    const d0 = length / 4
    const digitLength = Math.log2(d0)
    const regexWordEnd = /6c768f.*?93.*?88/
    const matchWordEnd = code.match(regexWordEnd)
    return {
      init: init,
      digitLength: digitLength,
      d0: d0,
      endWord: matchWordEnd['index'] + 6
    }
  } else {
    return null
  }
}

export const fromHexArrayToHex = (digits, digitLength) => {
  let binSolution = ''
  for (let i = 0; i < digits.length; i++) {
    binSolution += parseInt(digits[i], 16).toString(2).padStart(digitLength, '0')
  }
  const totalLength = Math.ceil((digits.length * digitLength) / 8)
  binSolution = binSolution.padStart(totalLength * 8, '0')
  let hexSolution = ''
  for (let i = 0; i < binSolution.length; i += 4) {
    hexSolution += parseInt(binSolution.slice(i, i + 4), 2).toString(16)
  }
  return hexSolution
}

export const computeChecksum = (digits, d0) => {
  let checksum = 0
  for (let i = 0; i < digits.length; i++) {
    checksum += d0 - parseInt(digits[i], 16) - 1
  }
  return checksum
}

export const computeWinternitzWord = (digits, d0) => {
  const digitLength = Math.ceil(Math.log2(d0))
  let amountOfDigitsChecksum = 1
  let checksumValue = null
  let computedChecksum = null
  let valueDigits
  do {
    valueDigits = digits.slice(0, digits.length - amountOfDigitsChecksum)
    let checksumDigits = digits.slice(digits.length - amountOfDigitsChecksum, digits.length)
    checksumValue = parseInt(fromHexArrayToHex(checksumDigits, digitLength), 16)
    computedChecksum = computeChecksum(valueDigits, d0)
    amountOfDigitsChecksum += 1
  } while (
    checksumValue === null ||
    computedChecksum === null ||
    (checksumValue != computedChecksum && amountOfDigitsChecksum <= valueDigits.length)
  )
  if (checksumValue === computedChecksum) {
    return fromHexArrayToHex(valueDigits.reverse(), digitLength)
  } else {
    return null
  }
}

export const decryptWinternitzWitness = (witness, code) => {
  let pendingWitnessDigits = witness
    .filter((_, index) => index % 2 === 1)
    .map((item) => (item === '' ? '00' : item))
  let pendingWitnessKeys = witness
    .filter((_, index) => index % 2 === 0)
    .map((item) => (item === '' ? '00' : item))
  let resultArray = []
  let currentCode = code
  while (pendingWitnessDigits.length > 0) {
    let nextWinternitzProps = detectNextWinternitz(currentCode)
    const amountOfDigits = [
      ...currentCode.slice(0, nextWinternitzProps.endWord).matchAll('a3766b6b(76a9)+6c')
    ].length
    let currentWitnessDigits = pendingWitnessDigits.slice(
      pendingWitnessDigits.length - amountOfDigits,
      pendingWitnessDigits.length
    )
    let currentWitnessKeys = pendingWitnessKeys
      .slice(pendingWitnessDigits.length - amountOfDigits, pendingWitnessDigits.length)
      .join('')
    //currentWitnessKeys = createHash('sha256').update(currentWitnessKeys).digest('hex')
    //currentWitnessKeys = createHash('ripemd160').update(currentWitnessKeys).digest('hex')
    const hash = CryptoJS.RIPEMD160(
      CryptoJS.SHA256(currentWitnessKeys).toString(CryptoJS.enc.Hex)
    ).toString(CryptoJS.enc.Hex)
    let currentValue = computeWinternitzWord(currentWitnessDigits, nextWinternitzProps.d0)
    resultArray.push({ value: currentValue, hash: hash })
    pendingWitnessDigits = pendingWitnessDigits.slice(
      0,
      pendingWitnessDigits.length - amountOfDigits
    )
    currentCode = currentCode.slice(nextWinternitzProps.endWord, currentCode.length)
  }
  return resultArray
}
