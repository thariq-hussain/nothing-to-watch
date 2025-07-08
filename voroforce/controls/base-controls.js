import { isTouchDevice } from '../utils'
import { CustomEventTarget } from '../utils/custom-event-target'
import {
  CellFocusedEvent,
  CellSelectedEvent,
  PointerFrozenChangeEvent,
} from './controls-events'

const { pow, sqrt, random, min, max } = Math

let randomNumber
const getRandomNumberOnce = () => {
  if (randomNumber === undefined) {
    randomNumber = random()
  }
  return randomNumber
}

export default class BaseControls extends CustomEventTarget {
  pointerFrozen = true

  constructor(store, display) {
    super()
    this.initGlobals(store, display)
    this.initProperties()
    this.initEventListeners()
    this.handleConfig()
    this.reset()
  }

  reset() {
    this.pointerFrozen = true
    this.rawPosition = null
    this.frozenPointer = null
    this.pointerPinned = false
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

    if (
      this.config.autoFocusCenter?.enabled &&
      (this.config.autoFocusCenter.enabled !== 'touch' || isTouchDevice)
    )
      this.update = this.handleAutoFocusUpdate
  }

  handleConfig() {}

  updateConfig(config) {
    this.config = config
    this.globalConfig.controls = config
    this.handleConfig()
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

    if (!this.rawPosition) return

    if (this.pointerFrozen) {
      this.getCellIndices(this.rawPosition, (primaryIndex) => {
        if (this.cells.focusedIndex === primaryIndex) {
          this.unfreezePointer()
        }
      })
    } else {
      this.assignPointer({
        x: this.rawPosition.x,
        y: this.rawPosition.y,
        // speedScale: this.avgSpeedTotal / this.options.maxSpeed,
      })

      this.getCellIndices(this.rawPosition, (primaryIndex, indices) => {
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

  getCellIndices(position, cb) {
    // if (!position?.x && !position?.y) {
    //   cb(undefined, undefined)
    // }
    this.display.getPositionCellIndices(position).then((indices) => {
      const primaryIndex = indices?.[0]
      if (primaryIndex === undefined) {
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
      x:
        width / 2 +
        (randomOffset ? (0.5 - getRandomNumberOnce()) * 0.1 * width : 0),
      y:
        height / 2 +
        (randomOffset ? (0.5 - getRandomNumberOnce()) * 0.1 * height : 0),
    }
  }

  handleAutoFocusUpdate() {
    if (this.cells.focused) {
      this.update = this.handleUpdate
    } else {
      this.assignPointer(this.getAutoFocusCenter())
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

  freezePointer(frozenPointer) {
    if (this.pointerPinned) {
      this.unpinPointer()
    }
    this.pointerFrozen = true
    this.pointer.speedScale = 0
    this.frozenPointer ??= frozenPointer ?? this.savePointer()

    this.dispatchEvent(
      new PointerFrozenChangeEvent({
        pointer: this.pointer,
        frozen: this.pointerFrozen,
      }),
    )
  }

  unfreezePointer() {
    this.pointerFrozen = false
    if (this.frozenPointer) {
      this.lastPosition = {
        x: this.frozenPointer.x,
        y: this.frozenPointer.y,
      }
    }
    this.frozenPointer = null

    this.dispatchEvent(
      new PointerFrozenChangeEvent({
        pointer: this.pointer,
        frozen: this.pointerFrozen,
      }),
    )
  }

  pinPointer() {
    this.speed.total = 0
    this.pointerPinned = true
  }

  unpinPointer() {
    this.pointerPinned = false
  }

  onPointerDown(e) {
    this.pointer.down = true
  }

  onPointerUp(e) {
    this.pointer.down = false
    this.handlePointerClick()
  }

  onPointerMove(e) {
    this.rawPosition = {
      x: e.x,
      y: e.y,
    }
  }

  onPointerOut(event) {
    this.handlePointerOut()
  }

  handlePointerOut() {
    console.log('handlePointerOut')
    if (this.cells.focused) {
      this.freezePointer()
    }
    this.reset()
  }

  handlePointerClick(e) {
    if (this.pointerFrozen) {
      // Object.assign(this.pointer, this.frozenPointer)
      this.unfreezePointer()
      // this.assignPointer({
      //   speedScale: 1,
      // })
      // this.onPointerMove(e)
    } else {
      // if (this.speed.total < this.options.selectSpeedLimit) {
      this.cells.selectedIndex =
        this.cells.selectedIndex !== this.cells.focusedIndex
          ? this.cells.focusedIndex
          : undefined

      this.dispatchEvent(new CellSelectedEvent(this.cells.selected))
      // }
    }
  }

  deselect() {
    this.cells.selectedIndex = undefined
    this.dispatchEvent(new CellSelectedEvent(undefined))
  }

  initEventListeners() {
    window.addEventListener('blur', this.onPointerOut.bind(this))

    this.container.addEventListener(
      'pointerdown',
      this.onPointerDown.bind(this),
    )
    this.container.addEventListener('pointerup', this.onPointerUp.bind(this))

    // if (isTouchDevice) {
    // } else {
    this.container.addEventListener(
      'pointermove',
      this.onPointerMove.bind(this),
    )
    this.container.addEventListener('pointerout', this.onPointerOut.bind(this))
    // }
  }

  removeEventListeners() {
    window.removeEventListener('blur', this.onPointerOut)

    // if (isTouchDevice) {
    // } else {
    this.container.removeEventListener('pointermove', this.onPointerMove)
    this.container.removeEventListener('pointerout', this.onPointerOut)
    // }

    this.container.removeEventListener('pointerdown', this.onPointerDown)
    this.container.removeEventListener('pointerup', this.onPointerUp)
  }

  startResize(dimensions) {
    if (!this.cells.focused) return
    this.assignPointer({
      x: undefined,
      y: undefined,
      indices: undefined,
    })
    this.reset()
  }

  postResizeTimeout
  endResize(dimensions) {
    if (!this.cells.focused) return
    this.assignPointer({
      x: this.cells.focused.x,
      y: this.cells.focused.y,
      speedScale: 1,
      // speedScale: 0,
    })

    // todo
    if (this.postResizeTimeout) {
      clearTimeout(this.postResizeTimeout)
    }
    this.postResizeTimeout = setTimeout(() => {
      if (this.pointerFrozen) {
        this.pointer.speedScale = 0
      }
    }, 1500)

    this.dispatchEvent(new CellFocusedEvent(this.cells.focused, this.cells))
  }

  resize(dimensions) {
    this.startResize()
    this.endResize()
  }

  dispose() {
    this.removeEventListeners()
  }
}
