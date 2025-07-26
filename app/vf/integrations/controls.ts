import { mergeConfigs } from '√'
import { store } from '../../store'
import controlsConfig, { controlModeConfigs } from '../config/controls/controls'
import { VOROFORCE_MODE } from '../consts'
import type { VoroforceInstance } from '../types'
import { type VoroforceCell, getCellFilm } from '../utils'

export const handleControls = () => {
  const {
    setFilm,
    voroforce: { controls },
    filmBatches,
    configUniforms: {
      main: mainUniforms,
      transitioning: transitioningUniforms,
    },
    mode,
  } = store.getState()

  controls.listen('focused', (async ({ cell }: { cell: VoroforceCell }) => {
    if (cell) setFilm(await getCellFilm(cell, filmBatches))
  }) as unknown as EventListener)

  controls.listen('selected', (async ({ cell }: { cell: VoroforceCell }) => {
    if (cell) {
      setFilm(await getCellFilm(cell, filmBatches))
      controls.pinPointer()
    } else {
      controls.unpinPointer()
    }
  }) as unknown as EventListener)

  controls.listen('pointerFrozenChange', (async ({
    frozen,
  }: { frozen: boolean }) => {
    const uniformKey = 'fUnweightedEffectMod'
    const uniform = mainUniforms.get(uniformKey)
    if (!uniform) return
    const value =
      [VOROFORCE_MODE.preview, VOROFORCE_MODE.select].includes(mode) && frozen
        ? 1
        : 0
    if (transitioningUniforms && uniform.transition) {
      if (uniform.value !== value) {
        uniform.targetValue = value
        if (!transitioningUniforms.has(uniformKey)) {
          transitioningUniforms.set(uniformKey, uniform)
        }
      }
    } else {
      uniform.value = value
    }
  }) as unknown as EventListener)
}

export const updateControlsByMode = (
  controls: VoroforceInstance['controls'],
  mode: VOROFORCE_MODE,
) => {
  controls.updateConfig(
    mergeConfigs(
      controlsConfig,
      controlModeConfigs[mode] ? controlModeConfigs[mode] : {},
    ),
  )
}
