import { PointerShakeEvent } from './controls-events'
import BaseControls from './base-controls'

const { pow, sqrt, max } = Math

const getAverageSpeedTotal = (array) =>
  array.reduce((a, b) => a + b.total, 0) / array.length

const MAX_SPEED_HISTORY = 10

export default class Controls extends BaseControls {
  pointerFrozen = true

  reset() {
    super.reset()

    this.speedHistory = []
    this.rawSpeedHistory = []
    this.position = null
    this.lastPosition = null
    this.lastRawPosition = null
    this.speed = { x: 0, y: 0, total: 0 }
    this.rawSpeed = { x: 0, y: 0, total: 0 }
    this.avgRawSpeedTotal = 0
    this.avgSpeedTotal = 0
  }

  handleConfig() {
    this.options = {
      raw: this.config.raw || false,

      maxSpeed: this.config.maxSpeed || 10,
      ease: this.config.ease || 0.15,

      unfreezePointerSpeedLimit: this.config.unfreezePointerSpeedLimit || 5,
      selectSpeedLimit: this.config.selectSpeedLimit || 2,

      freezeOnJolt: {
        enabled: this.config.freezeOnJolt?.enabled || false,
        factor: this.config.freezeOnJolt?.factor || 10,
        minSpeedValue: this.config.freezeOnJolt?.minSpeedValue || 2,
      },
      freezeOnShake: {
        enabled: this.config.freezeOnShake?.enabled || false,
        minSpeed: this.config.freezeOnShake?.minSpeed || 2, // Minimum velocity to count as a shake
        dirChangeTimeout: this.config.freezeOnShake?.dirChangeTimeout || 250, // Reset after this many ms of no dir change
        minShakes: this.config.freezeOnShake?.minShakes || 3, // Minimum direction changes to trigger a shake
        cooldown: this.config.freezeOnShake?.cooldown || 2000, // Minimum time between shake events
      },
    }
  }

  handleUpdate() {
    if (this.pointerFrozen) {
      this.getCellIndices(this.pointer, (primaryIndex, indices) => {
        this.assignPointer({
          indices,
        })
        this.focusCell(primaryIndex)
      })
    }

    this.handleRawPosition()

    if (!this.position) return

    if (this.pointerFrozen) {
      if (this.avgSpeedTotal < this.options.unfreezePointerSpeedLimit) {
        this.getCellIndices(this.rawPosition, (primaryIndex) => {
          if (this.cells.focusedIndex === primaryIndex) {
            this.unfreezePointer()
          }
        })
      }
    } else {
      this.assignPointer({
        x: this.position.x,
        y: this.position.y,
        speedScale: this.avgSpeedTotal / this.options.maxSpeed,
      })

      this.getCellIndices(this.position, (primaryIndex, indices) => {
        if (this.pointerPinned && this.cells.focusedIndex !== primaryIndex) {
          this.freezePointer()
        } else {
          this.assignPointer({
            indices,
          })
          this.focusCell(primaryIndex)
        }
      })
    }
  }

  handleRawPosition() {
    if (!this.rawPosition) return

    this.assignPointer({
      rawX: this.rawPosition.x,
      rawY: this.rawPosition.y,
    })

    // Process the position with capping if needed
    this.position = this.processPosition(this.rawPosition)

    this.speedHistory.push({
      ...this.speed,
    })
    // Keep array at max size
    if (this.speedHistory.length > MAX_SPEED_HISTORY) {
      this.speedHistory.shift()
      this.avgSpeedTotal = getAverageSpeedTotal(this.speedHistory)
    }

    this.rawSpeedHistory.push({
      ...this.rawSpeed,
    })
    // Keep array at max size
    if (this.rawSpeedHistory.length > MAX_SPEED_HISTORY) {
      this.rawSpeedHistory.shift()
      this.avgRawSpeedTotal = getAverageSpeedTotal(this.rawSpeedHistory)
    }

    // Save last processed values for next calculation
    this.lastPosition = { ...this.position }
    this.lastRawPosition = { ...this.rawPosition }
  }

  processPosition(rawPosition) {
    // If this is the first position, just return raw position
    if (!this.lastPosition || !this.lastRawPosition) return rawPosition

    // raw speed
    this.rawSpeed.x = rawPosition.x - this.lastRawPosition.x
    this.rawSpeed.y = rawPosition.y - this.lastRawPosition.y
    this.rawSpeed.total = sqrt(
      pow(this.rawSpeed.x, 2) + pow(this.rawSpeed.y, 2),
    )

    if (this.options.raw) {
      this.speed = this.rawSpeed
      return rawPosition
    }

    if (this.detectJolt() || this.detectShake()) {
      this.pinPointer()
      return this.lastPosition
    }

    if (this.pointerFrozen) {
      this.speed.x = 0
      this.speed.y = 0
      this.speed.total = 0
      return rawPosition
    }

    // Calculate position delta
    const deltaX = rawPosition.x - this.lastPosition.x
    const deltaY = rawPosition.y - this.lastPosition.y

    const distance = sqrt(pow(deltaX, 2) + pow(deltaY, 2))

    // Small threshold to stop when extremely close
    if (distance < 0.1) {
      this.speed.x = 0
      this.speed.y = 0
      this.speed.total = 0
      return rawPosition
    }

    const easeAmount = this.options.ease

    // Calculate the movement for this frame
    let cappedDeltaX = deltaX * easeAmount
    let cappedDeltaY = deltaY * easeAmount

    let speed = sqrt(cappedDeltaX * cappedDeltaX + cappedDeltaY * cappedDeltaY)

    // Apply speed limit while maintaining direction
    if (speed > this.options.maxSpeed) {
      const ratio = this.options.maxSpeed / speed
      cappedDeltaX *= ratio
      cappedDeltaY *= ratio
      speed = this.options.maxSpeed
    }

    this.speed.x = cappedDeltaX
    this.speed.y = cappedDeltaY
    this.speed.total = speed

    return {
      x: this.lastPosition.x + cappedDeltaX,
      y: this.lastPosition.y + cappedDeltaY,
    }
  }

  detectJolt() {
    if (!this.options.freezeOnJolt?.enabled) return
    if (this.pointerPinned || this.pointerFrozen) return

    return (
      this.rawSpeed.total >
      max(this.avgRawSpeedTotal, this.options.freezeOnJolt.minSpeedValue) *
        this.options.freezeOnJolt.factor
    )
  }

  detectShake() {
    if (!this.options.freezeOnShake?.enabled) return

    if (
      this.pointerFrozen ||
      this.rawSpeed.total <= this.options.freezeOnShake.minSpeed
    ) {
      this.resetShake()
      return
    }

    const directionX =
      this.rawSpeed.x > 0 ? 'right' : this.rawSpeed.x < 0 ? 'left' : null
    const directionY =
      this.rawSpeed.y > 0 ? 'down' : this.rawSpeed.y < 0 ? 'up' : null

    if (
      this.lastShakeDirectionX &&
      directionX &&
      directionX !== this.lastShakeDirectionX
    ) {
      this.shakeDirectionXChangeCount++
      this.refreshShakeDirChangeTimeout()
    }
    if (
      this.lastShakeDirectionY &&
      directionY &&
      directionY !== this.lastShakeDirectionY
    ) {
      this.shakeDirectionYChangeCount++
      this.refreshShakeDirChangeTimeout()
    }

    this.lastShakeDirectionX = directionX
    this.lastShakeDirectionY = directionY

    // Check if we've reached the threshold for a shake
    if (
      (this.shakeDirectionXChangeCount >=
        this.options.freezeOnShake.minShakes ||
        this.shakeDirectionYChangeCount >=
          this.options.freezeOnShake.minShakes) &&
      !this.shakeCooldownActive
    ) {
      // Trigger shake event
      this.dispatchEvent(
        new PointerShakeEvent({
          pointer: this.pointer,
          speed: this.rawSpeed.total,
          directionXChanges: this.shakeDirectionXChangeCount,
          directionYChanges: this.shakeDirectionYChangeCount,
        }),
      )

      // Reset
      this.resetShake()

      // Set cooldown
      this.shakeCooldownActive = true
      setTimeout(() => {
        this.shakeCooldownActive = false
      }, this.options.freezeOnShake.cooldown)

      return true
    }
  }

  resetShake() {
    this.shakeDirectionXChangeCount = 0
    this.shakeDirectionYChangeCount = 0
    this.lastShakeDirectionX = null
    this.lastShakeDirectionX = null
  }

  clearShakeDirChangeTimeout() {
    if (this.shakeDirChangeTimeout) {
      clearTimeout(this.shakeDirChangeTimeout)
    }
  }

  refreshShakeDirChangeTimeout() {
    this.clearShakeDirChangeTimeout()
    this.shakeDirChangeTimeout = setTimeout(() => {
      this.resetShake()
    }, this.options.freezeOnShake.dirChangeTimeout)
  }
}
