import { createLogger, isTouchDevice } from '../utils'
import { CustomEventTarget } from '../utils/custom-event-target'
import { CellFocusedEvent, CellSelectedEvent } from './controls-events'

export default class BaseControls extends CustomEventTarget {
  rawPosition = undefined

  constructor(store, display) {
    super()
    this.initGlobals(store, display)
    this.initProperties()
    this.handleFirstConfig()
  }

  reset() {
    this.rawPosition = undefined
  }

  initGlobals(store, display) {
    this.store = store
    this.store.set('controls', this)
    this.globalConfig = this.store.get('config')
    this.config = this.globalConfig.controls
    this.display = display
  }

  initProperties() {
    this.container = this.store.get('container')
    this.dimensions = this.store.get('dimensions')
    this.pointer = this.store.get('sharedPointer')
    this.cells = this.store.get('cells')
  }

  handleFirstUpdate() {
    this.initEventListeners()
    this.update = this.handleUpdate
    this.update()
  }

  isAutoFocusCenterEnabled() {
    return (
      this.config.autoFocusCenter?.enabled &&
      (this.config.autoFocusCenter.enabled !== 'touch' || isTouchDevice)
    )
  }

  handleFirstConfig() {
    if (this.config.logging) {
      this.logger = createLogger('controls')
    }

    if (this.isAutoFocusCenterEnabled()) {
      this.assignPointer(this.getAutoFocusCenter())
      this.update = this.handleAutoFocusUpdate
    } else {
      this.update = this.handleFirstUpdate
    }
    this.handleConfig()
  }

  handleConfig() {}

  updateConfig(config) {
    this.config = config
    this.globalConfig.controls = config
    this.handleConfig()
  }

  handleUpdate() {
    if (this.rawPosition) {
      this.assignPointer({
        x: this.rawPosition.x,
        y: this.rawPosition.y,
        speedScale: 0.2, // tmp hack for omni force
      })
    }

    this.getCellIndices(this.pointer, (primaryIndex, indices) => {
      this.assignPointer({
        indices,
      })
      this.focusCell(primaryIndex)
    })
  }

  getCellIndices(position, cb) {
    this.display.getPositionCellIndices(position).then((indices) => {
      if (this.isResizing) return
      const primaryIndex = indices?.[0]
      if (primaryIndex === undefined) {
        console.warn('No cell found at position', {
          x: position.x,
          y: position.y,
        })
        this.handlePointerOut()
        return false
      }
      cb(primaryIndex, indices)
    })
  }

  getAutoFocusCenter() {
    const { width, height } = this.dimensions.get()
    const randomOffset = this.config.autoFocusCenter?.random
    return {
      x: Math.floor(
        width / 2 + (randomOffset ? (0.5 - Math.random()) * 0.1 * width : 0),
      ),
      y: Math.floor(
        height / 2 + (randomOffset ? (0.5 - Math.random()) * 0.1 * height : 0),
      ),
    }
  }

  handleAutoFocusUpdate() {
    if (this.cells.focused) {
      // this.reset()
      this.update = this.handleFirstUpdate
      return
    }

    this.handleUpdate()
  }

  assignPointer(data) {
    Object.assign(this.pointer, data)
  }

  savePointer() {
    return {
      indices: this.pointer.indices,
      x: this.pointer.x,
      y: this.pointer.y,
      speedScale: 0,
    }
  }

  onPointerDown(e) {
    this.pointer.down = true
  }

  onPointerUp(e) {
    this.pointer.down = false
    this.onPointerClick()
  }

  updateRawPositionFromEvent(e) {
    if (!this.rawPosition) this.rawPosition = {}
    Object.assign(this.rawPosition, {
      x: e.clientX || e.x,
      y: e.clientY || e.y,
    })
  }

  onPointerMove(e) {
    this.updateRawPositionFromEvent(e)
  }

  onTouchMove(e) {
    if (e.touches.length === 1) {
      // Single touch - let pointer events handle it
      this.logger?.debug('onTouchMove')
      return
    }

    // Multi-touch gestures
    if (e.touches.length === 2) {
      this.handlePinchGesture(e)
    }

    e.preventDefault() // Prevent pointer events for multi-touch
  }

  isTouching = false
  onTouchStart(e) {
    this.isTouching = true
    this.logger?.debug('onTouchStart')
  }
  onTouchEnd(e) {
    this.isTouching = false
    this.logger?.debug('onTouchEnd')
  }

  // todo
  handlePinchGesture(e) {
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]

    const distance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY,
    )

    if (this.lastPinchDistance) {
      const scale = distance / this.lastPinchDistance
      this.handleZoom(scale)
    }

    this.lastPinchDistance = distance
  }

  // todo
  handleZoom(scale) {}

  onPointerOut(event) {
    this.logger?.debug('onPointerOut')
    this.handlePointerOut()
  }

  handlePointerOut() {
    this.reset()
    // this.rawPosition = undefined
  }

  onPointerClick(e) {
    this.updateRawPositionFromEvent(e)
    this.requestSelection()
  }

  requestSelection() {
    let selectedCellIndex
    if (!this.cells.selectedIndex) {
      if (this.pointer.index === this.cells.focusedIndex) {
        selectedCellIndex = this.cells.focusedIndex
      }
    } else {
      if (this.cells.selectedIndex !== this.cells.focusedIndex) {
        selectedCellIndex = this.pointer.index
      } else {
        this.deselect()
      }
    }

    if (selectedCellIndex) {
      this.cells.selectedIndex = selectedCellIndex
      this.dispatchEvent(new CellSelectedEvent(this.cells.selected))
      this.logger?.debug('select cell', this.cells.selectedIndex)
      return selectedCellIndex
    }
  }

  deselect() {
    this.cells.selectedIndex = undefined
    this.dispatchEvent(new CellSelectedEvent(undefined))
  }

  initEventListeners() {
    // Store bound function references
    this.boundOnPointerOut = this.onPointerOut.bind(this)
    this.boundOnPointerClick = this.onPointerClick.bind(this)
    this.boundOnTouchMove = this.onTouchMove.bind(this)
    this.boundOnTouchStart = this.onTouchStart.bind(this)
    this.boundOnTouchEnd = this.onTouchEnd.bind(this)
    this.boundOnPointerMove = this.onPointerMove.bind(this)

    window.addEventListener('blur', this.boundOnPointerOut)
    this.container.addEventListener('pointerout', this.boundOnPointerOut)

    this.container.addEventListener('click', this.boundOnPointerClick)
    this.container.addEventListener('pointermove', this.boundOnPointerMove, {
      // passive: false,
    }) // Use pointer events for single-point interactions on touch devices as well

    if (isTouchDevice) {
      // Use touch events specifically for multi-touch gestures
      this.container.addEventListener('touchmove', this.boundOnTouchMove)
      this.container.addEventListener('touchstart', this.boundOnTouchStart)
      this.container.addEventListener('touchend', this.boundOnTouchEnd)
    }
  }

  removeEventListeners() {
    window.removeEventListener('blur', this.boundOnPointerOut)

    this.container.removeEventListener('click', this.boundOnPointerClick)
    this.container.removeEventListener('pointermove', this.boundOnPointerMove)
    this.container.removeEventListener('pointerout', this.boundOnPointerOut)

    if (isTouchDevice) {
      this.container.removeEventListener('touchmove', this.boundOnTouchMove)
      this.container.removeEventListener('touchstart', this.boundOnTouchStart)
      this.container.removeEventListener('touchend', this.boundOnTouchEnd)
    }
  }

  isResizing = false
  startResize(dimensions) {
    this.isResizing = true
    this.assignPointer({
      x: undefined,
      y: undefined,
      indices: undefined,
      speedScale: 0,
    })
    this.reset()
  }

  endResize(dimensions) {
    if (!this.cells.focused || this.outOfBounds(this.cells.focused)) {
      if (this.isAutoFocusCenterEnabled()) {
        this.assignPointer(this.getAutoFocusCenter())
      }
      return
    }
    this.assignPointer({
      x: this.cells.focused.x,
      y: this.cells.focused.y,
    })
    this.dispatchEvent(new CellFocusedEvent(this.cells.focused, this.cells))
    this.isResizing = false
  }

  outOfBounds(position) {
    const { width, height } = this.dimensions.get()
    return !(
      position.x >= 0 &&
      position.x <= width &&
      position.y >= 0 &&
      position.y <= height
    )
  }

  selectCell(cellOrCellIndex) {
    const cellIndex =
      typeof cellOrCellIndex === 'number'
        ? cellOrCellIndex
        : cellOrCellIndex.index
    if (this.cells.selectedIndex !== cellIndex) {
      this.cells.selectedIndex = cellIndex
      this.dispatchEvent(new CellSelectedEvent(this.cells.selected, this.cells))
      this.logger?.debug('select cell', this.cells.selectedIndex)
    }
  }

  focusCell(cellOrCellIndex) {
    const cellIndex =
      typeof cellOrCellIndex === 'number'
        ? cellOrCellIndex
        : cellOrCellIndex.index
    if (this.cells.focusedIndex !== cellIndex) {
      this.cells.focusedIndex = cellIndex
      this.dispatchEvent(new CellFocusedEvent(this.cells.focused, this.cells))
    }
  }

  hasSelection() {
    return this.cells.selectedIndex !== undefined
  }

  focusedIsSelected() {
    return this.cells.focusedIndex === this.cells.selectedIndex
  }

  resize(dimensions) {
    this.startResize()
    this.endResize()
  }

  dispose() {
    this.removeEventListeners()
  }
}
