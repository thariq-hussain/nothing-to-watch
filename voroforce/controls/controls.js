import { distance } from '../utils'
import BaseControls from './base-controls'
import {
  PointerFrozenChangeEvent,
  PointerPinnedChangeEvent,
  PointerShakeEvent,
} from './controls-events'

const { pow, sqrt, max } = Math

const getAverageSpeedTotal = (array) =>
  array.reduce((a, b) => a + b.total, 0) / array.length

const MAX_SPEED_HISTORY = 10

export default class Controls extends BaseControls {
  pointerFrozen = true
  pointerPinned = false

  speedHistory = []
  rawSpeedHistory = []
  position = null
  lastPosition = null
  lastRawPosition = null
  speed = { x: 0, y: 0, total: 0 }
  rawSpeed = { x: 0, y: 0, total: 0 }
  avgRawSpeedTotal = 0
  avgSpeedTotal = 0

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
    super.handleConfig()
    this.options = {
      maxSpeed: this.config.maxSpeed || 10,
      maxSpeedPinned: this.config.maxSpeedPinned || this.config.maxSpeed || 30,
      ease: this.config.ease || 0.15,
      easePinned: this.config.easePinned || this.config.ease || 0.05,
      unfreezePointerMaxSpeed: this.config.unfreezePointerMaxSpeed || 5,
      selectionMaxSpeed: this.config.selectionMaxSpeed || 2,
      freezeOnJolt: {
        enabled: this.config.freezeOnJolt?.enabled || false,
        factor: this.config.freezeOnJolt?.factor || 7,
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

  handleAutoFocusUpdate() {
    if (this.cells.focused) {
      // this.reset()
      this.pinPointer()
      this.update = this.handleFirstUpdate
      return
    }

    this.handleUpdate()
  }

  handleUpdate() {
    this.handlePositions()
    this.handleCursor()

    if (!this.pointerIdle && (this.pointerFrozen || this.pointerPinned)) {
      if (
        this.rawPosition &&
        this.avgSpeedTotal < this.options.unfreezePointerMaxSpeed
      ) {
        // only check pixels if raw speed exists and speed is reasonable
        if (
          this.hasSelection() ||
          !this.frozenPosition ||
          distance(this.rawPosition, this.frozenPosition) < 50
        ) {
          // only check pixels if the raw position is close to the frozen position
          this.getCellIndices(this.rawPosition, (index, indices) => {
            if (!this.rawPosition) return
            this.rawPosition.indices = indices
            this.rawPosition.index = index
            if (this.cells.focusedIndex === index) {
              this.unfreezePointer()
            }
          })
        }
      }
    }

    if (!this.pointerFrozen) {
      if (!this.position) return
      this.assignPointer({
        x: this.position.x,
        y: this.position.y,
        speedScale: this.avgSpeedTotal / this.options.maxSpeed,
        // speedScale:
        //   this.avgSpeedTotal /
        //   (this.pointerPinned
        //     ? this.options.maxSpeedPinned
        //     : this.options.maxSpeed),
      })
    }

    this.getCellIndices(this.pointer, (index, indices) => {
      this.assignPointer({
        indices,
      })
      this.focusCell(index)
    })
  }

  handlePositions() {
    this.handleRawPosition()
    this.handleMainPosition()
  }

  handleMainPosition() {
    let targetPosition = this.rawPosition

    if (this.pinnedPosition) {
      targetPosition = this.pinnedPosition
      if (this.outOfBounds(targetPosition)) {
        this.freezePointer()
        return
      }
    }

    if (!targetPosition) return

    // Process the position with capping if needed
    this.position = this.calcMainPosition(targetPosition)

    this.speedHistory.push({
      ...this.speed,
    })
    // Keep array at max size
    if (this.speedHistory.length > MAX_SPEED_HISTORY) {
      this.speedHistory.shift()
      this.avgSpeedTotal = getAverageSpeedTotal(this.speedHistory)
    }

    // Save last processed values for next calculation
    this.lastPosition = {
      x: this.position.x,
      y: this.position.y,
    }
  }

  calcMainPosition(targetPosition) {
    // If this is the first position, just return target position
    if (!this.lastPosition) return targetPosition

    if (!this.pointerPinned && !this.pointerFrozen) {
      if ((!this.isTouching && this.detectJolt()) || this.detectShake()) {
        this.freezePointer()
        return this.lastPosition
      }
    }

    if (this.pointerFrozen) {
      this.speed.x = 0
      this.speed.y = 0
      this.speed.total = 0
      return targetPosition
    }

    // Calculate position delta
    const deltaX = targetPosition.x - this.lastPosition.x
    const deltaY = targetPosition.y - this.lastPosition.y

    const distance = sqrt(pow(deltaX, 2) + pow(deltaY, 2))

    // Small threshold to stop when extremely close
    if (distance < 0.1) {
      this.speed.x = 0
      this.speed.y = 0
      this.speed.total = 0
      return targetPosition
    }

    const ease = this.pointerPinned
      ? this.options.easePinned
      : this.options.ease
    const maxSpeed = this.pointerPinned
      ? this.options.maxSpeedPinned
      : this.options.maxSpeed

    // Calculate the movement for this frame
    let cappedDeltaX = deltaX * ease
    let cappedDeltaY = deltaY * ease

    let speed = sqrt(cappedDeltaX * cappedDeltaX + cappedDeltaY * cappedDeltaY)

    // Apply speed limit while maintaining direction
    if (speed > maxSpeed) {
      const ratio = maxSpeed / speed
      cappedDeltaX *= ratio
      cappedDeltaY *= ratio
      speed = maxSpeed
    }

    this.speed.x = cappedDeltaX
    this.speed.y = cappedDeltaY
    this.speed.total = speed

    return {
      x: this.lastPosition.x + cappedDeltaX,
      y: this.lastPosition.y + cappedDeltaY,
    }
  }

  handleRawPosition() {
    if (!this.rawPosition) return

    this.assignPointer({
      rawX: this.rawPosition.x,
      rawY: this.rawPosition.y,
    })

    if (this.lastRawPosition) {
      // raw speed
      this.rawSpeed.x = this.rawPosition.x - this.lastRawPosition.x
      this.rawSpeed.y = this.rawPosition.y - this.lastRawPosition.y
      this.rawSpeed.total = sqrt(
        pow(this.rawSpeed.x, 2) + pow(this.rawSpeed.y, 2),
      )

      this.rawSpeedHistory.push({
        ...this.rawSpeed,
      })
      // Keep array at max size
      if (this.rawSpeedHistory.length > MAX_SPEED_HISTORY) {
        this.rawSpeedHistory.shift()
        this.avgRawSpeedTotal = getAverageSpeedTotal(this.rawSpeedHistory)
      }
    }

    this.lastRawPosition = { ...this.rawPosition }
  }

  handleCursor() {
    if (this.isTouching) {
      this.setCursor('default')
    } else if (this.isPinned() && this.hasSelection()) {
      if (this.focusedIsPinned()) {
        this.setCursor('zoom-out')
      } else {
        this.setCursor('pointer')
      }

      // if () {
      //   if (this.focusedIsPinned()) {
      //     this.setCursor('zoom-out')
      //   } else {
      //   }
      // } else {
      //   this.setCursor('default')
      // }
    } else {
      if (!this.pointerFrozen) {
        if (this.hasSelection()) {
          this.setCursor('pointer')
        } else {
          if (this.avgSpeedTotal < this.options.selectionMaxSpeed) {
            this.setCursor('pointer')
          } else {
            this.setCursor('default')
          }
        }
      } else {
        if (this.hasSelection()) {
          this.setCursor('pointer')
        } else {
          this.setCursor('default')
        }
      }
    }
  }

  onPointerMove(e) {
    super.onPointerMove(e)
    this.pointerIdle = false

    if (this.isTouching) {
      if (this.pointerPinned) {
        this.unpinPointer()
      }
      if (this.pointerFrozen) {
        this.unfreezePointer()
      }
    } else if (this.isPinned()) {
      if (this.hasSelection()) {
        if (!this.focusedIsRaw()) {
          this.freezePointer()
        }
      } else {
        if (this.focusedIsPinned()) this.freezePointer()
      }
    }
  }

  handlePointerOut() {
    this.pinPointer()
  }

  onPointerClick(e) {
    this.pointerIdle = false
    this.updateRawPositionFromEvent(e)

    this.getCellIndices(this.rawPosition, (index, indices) => {
      Object.assign(this.rawPosition, {
        index,
        indices,
      })
      if (
        !this.isTouching &&
        (this.pointerFrozen ||
          (this.pointerPinned &&
            this.pinnedPosition.index !== this.rawPosition.index))
      ) {
        this.navigateToCell(this.rawPosition.index)
      } else {
        this.requestSelection(this.rawPosition)
      }
    })
  }

  freezePointer(frozenPosition) {
    this.pointerIdle = true
    if (this.pointerPinned) this.unpinPointer()
    this.pointerFrozen = true
    this.pointer.speedScale = 0
    this.frozenPosition =
      frozenPosition ?? this.frozenPosition ?? this.savePointer()

    this.dispatchEvent(
      new PointerFrozenChangeEvent({
        frozen: true,
        pointer: this.pointer,
        frozenPosition: this.frozenPosition,
      }),
    )
    this.logger?.debug('freeze pointer')
  }

  unfreezePointer() {
    if (!this.pointerFrozen) return
    if (this.frozenPosition) {
      this.lastPosition = {
        x: this.frozenPosition.x,
        y: this.frozenPosition.y,
      }
      this.frozenPosition = null
    }
    this.pointerFrozen = false
    this.dispatchEvent(
      new PointerFrozenChangeEvent({
        frozen: false,
        pointer: this.pointer,
      }),
    )
    this.logger?.debug('unfreeze pointer')
  }

  pinPointer(pinnedPosition) {
    this.pointerIdle = true
    this.pinnedPosition =
      pinnedPosition ?? this.pinnedPosition ?? this.cells.focused
    if (!this.pinnedPosition) return
    if (this.pointerFrozen) this.unfreezePointer()
    this.pointerPinned = true
    this.dispatchEvent(
      new PointerPinnedChangeEvent({
        pinned: true,
        pointer: this.pointer,
        pinnedPosition: this.pinnedPosition,
      }),
    )
    this.logger?.debug('pin pointer')
  }

  unpinPointer() {
    if (!this.pointerPinned) return
    this.pointerPinned = false
    this.pinnedPosition = null

    this.dispatchEvent(
      new PointerPinnedChangeEvent({
        pinned: false,
        pointer: this.pointer,
      }),
    )
    this.logger?.debug('unpin pointer')
  }

  // handleSelectRequest() {
  //   let selectedCellIndex
  //   if (!this.cells.selectedIndex) {
  //     if (
  //       this.pointer.speedScale < 0.5 &&
  //       this.pointer.index === this.cells.focusedIndex
  //     ) {
  //       selectedCellIndex = this.cells.focusedIndex
  //     }
  //   } else {
  //     if (this.cells.selectedIndex !== this.cells.focusedIndex) {
  //       selectedCellIndex = this.pointer.index
  //     } else {
  //       this.deselect()
  //     }
  //   }
  //
  //   if (selectedCellIndex) {
  //     this.cells.selectedIndex = selectedCellIndex
  //     this.dispatchEvent(new CellSelectedEvent(this.cells.selected))
  //     this.pinPointer()
  //     this.logger?.debug('select cell', this.cells.selectedIndex)
  //     return selectedCellIndex
  //   }
  // }

  requestSelection(customPointer) {
    const pointer = customPointer ?? this.pointer
    this.logger?.debug('handleSelectRequest', pointer)
    this.logger?.debug('this.cells.focusedIndex', this.cells.focusedIndex)
    let selectCellIndex
    if (!this.hasSelection()) {
      if (
        this.avgSpeedTotal < this.options.selectionMaxSpeed &&
        pointer.index === this.cells.focusedIndex
      ) {
        selectCellIndex = this.cells.focusedIndex
      }
    } else {
      if (pointer.index !== this.cells.selectedIndex) {
        selectCellIndex = pointer.index
      } else {
        this.deselect()
      }
    }

    if (selectCellIndex) {
      this.selectCell(selectCellIndex)
      this.pinPointer(this.cells.selected)
      return selectCellIndex
    }
  }

  deselect() {
    this.logger?.debug('deselecting cell')
    super.deselect()
    this.pinPointer()
  }

  getDirectionalNeighborCell(cell, direction) {
    const { cols, rows } = this.globalConfig.lattice
    const currentRow = cell.row
    const currentCol = cell.col

    let targetRow = currentRow
    let targetCol = currentCol

    switch (direction) {
      case 'up':
        targetRow = Math.max(0, currentRow - 1)
        break
      case 'down':
        targetRow = Math.min(rows - 1, currentRow + 1)
        break
      case 'left':
        targetCol = Math.max(0, currentCol - 1)
        break
      case 'right':
        targetCol = Math.min(cols - 1, currentCol + 1)
        break
    }

    if (targetRow === currentRow && targetCol === currentCol) {
      return null
    }

    return this.cells[targetRow * cols + targetCol]
  }

  navigateToCell(cellOrCellIndex) {
    if (cellOrCellIndex === null || cellOrCellIndex === undefined) return

    const cell =
      typeof cellOrCellIndex === 'number'
        ? this.cells[cellOrCellIndex]
        : cellOrCellIndex

    if (!cell) return
    this.pinPointer(cell)
  }

  navigateToCellById(id) {
    return this.navigateToCell(this.cells.find((cell) => cell.id === id))
  }

  onKeyDown(e) {
    if (!this.globalConfig.lattice?.enabled) return
    if (!this.cells.focusedIndex) return

    switch (e.code) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
        const directionMap = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right',
        }
        const direction = directionMap[e.key]
        e.preventDefault()
        const neighbor = this.getDirectionalNeighborCell(
          this.cells.focused,
          direction,
        )
        if (neighbor) {
          this.navigateToCell(neighbor)
        }
        break
      }
      case 'Space':
      case 'Enter': {
        e.preventDefault()
        this.requestSelection()
        break
      }
      default:
        return
    }
  }

  initEventListeners() {
    super.initEventListeners()
    this.initKeyboardEventListeners()
  }

  removeEventListeners() {
    super.removeEventListeners()
    this.removeKeyboardEventListeners()
  }

  initKeyboardEventListeners() {
    if (this.boundOnKeyDown) return
    this.boundOnKeyDown = this.onKeyDown.bind(this)
    window.addEventListener('keydown', this.boundOnKeyDown)
  }

  removeKeyboardEventListeners() {
    if (!this.boundOnKeyDown) return
    window.removeEventListener('keydown', this.boundOnKeyDown)
    this.boundOnKeyDown = undefined
  }

  startResize(dimensions) {
    super.startResize(dimensions)
    this.freezePointer()
  }

  endResize(dimensions) {
    super.endResize(dimensions)
    this.freezePointer(this.pointer)
  }

  isPinned() {
    return this.pointerPinned
  }

  focusedIsPinned() {
    return this.cells.focusedIndex === this.pinnedPosition?.index
  }

  focusedIsRaw() {
    return this.cells.focusedIndex === this.rawPosition?.index
  }

  setCursor(cursor) {
    switch (cursor) {
      case 'zoom-in':
        this.container.style.cursor = 'zoom-in'
        break
      case 'zoom-out':
        this.container.style.cursor = 'zoom-out'
        break
      case 'pointer':
        this.container.style.cursor = 'pointer'
        break
      default:
        this.container.style.cursor = 'default'
        break
    }
  }

  detectJolt() {
    if (!this.options.freezeOnJolt?.enabled) return

    const detectedJolt =
      this.rawSpeed.total >
      max(this.avgRawSpeedTotal, this.options.freezeOnJolt.minSpeedValue) *
        this.options.freezeOnJolt.factor
    if (detectedJolt) this.logger?.debug('detected jolt')
    return detectedJolt
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
