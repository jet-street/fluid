class Wave {
  constructor(x, speed, waveLength, maxHeight) {
    this.x = x
    this.speed = speed
    this.waveLength = waveLength
    this.maxHeight = maxHeight
  }

  accumulateWaveToHeightField(heightField) {
    const quarterWaveLength = 0.25 * this.waveLength
    const start = Math.round((this.x - quarterWaveLength) * kBufferSize)
    const end = Math.round((this.x + quarterWaveLength) * kBufferSize)

    for (let i = start; i < end; i++) {
      let iNew = i
      if (i < 0) {
        iNew = -i - 1
      } else if (i >= kBufferSize) {
        iNew = 2 * kBufferSize - i - 1
      }

      let distance = Math.abs((i + 0.5) / kBufferSize - this.x)
      let height = this.maxHeight * 0.5 * (Math.cos(Math.min(distance * Math.PI / quarterWaveLength, Math.PI)) + 1)
      heightField[iNew] += height
    }
  }

  update(timeInterval) {
    this.x += timeInterval * this.speed

    // Boundary reflection
    if (this.x > 1) {
      this.speed *= -1
      this.x = 1 + timeInterval * this.speed
    } else if (this.x < 0) {
      this.speed *= -1
      this.x = timeInterval * this.speed
    }
  }
}

function draw(heightField) {
  let buffer = new Array(kBufferSize).fill(' ', 0, kBufferSize)

  for (let i = 0; i < kBufferSize; ++i) {
    let height = heightField[i]
    let tableIndex = Math.min(Math.floor(kGrayScaleTableSize * height), kGrayScaleTableSize - 1)
    buffer[i] = kGrayScaleTable[tableIndex]
  }

  // Clear old prints
  clear()

  // Draw new buffer
  console.log(buffer.join(''))
}

const kBufferSize = 80

const kGrayScaleTable = ' .:-=+*#%@'
const kGrayScaleTableSize = kGrayScaleTable.length

const wave1 = new Wave(0, 1, 0.8, 0.5)
const wave2 = new Wave(1, -0.5, 1.2, 0.4)

const fps = 60
const timeInterval = 1 / fps

let heightField = new Array(kBufferSize).fill(0, 0, kBufferSize)

setInterval(() => {
  // March through time
  wave1.update(timeInterval)
  wave2.update(timeInterval)

  // Clear height field
  heightField.fill(0, 0, kBufferSize)

  // Accumulate waves for each center point
  wave1.accumulateWaveToHeightField(heightField)
  wave2.accumulateWaveToHeightField(heightField)

  // Draw height field
  draw(heightField)    
}, 1000 / fps)
