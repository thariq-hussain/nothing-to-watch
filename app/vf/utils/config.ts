import { getGPUTier } from 'detect-gpu'
import { mergeConfigs } from '√'
import baseConfig from '../config'
import presets from '../presets'

import { down, matchMediaQuery } from '../../utils/mq'

import type { THEME } from '../../consts'
import type { StoreState } from '../../store'
import { DEVICE_CLASS, type VOROFORCE_MODE, VOROFORCE_PRESET } from '../consts'
import type { VoroforceCell, VoroforceInstance } from '../types'
import type { Film } from './films'
import type { ConfigUniform } from './uniforms'

export type CustomLink = {
  name: string
  baseUrl: string
  slug: boolean
  property: 'title' | 'tmdbId' | 'imdbId'
}

export type UserConfig = {
  cells?: number
  noPostEffects?: boolean
  forceHigherQuality?: boolean
  devTools?: boolean
  customLinks?: CustomLink[]
  favorites?: {
    [key: Film['tmdbId']]: {
      cellId: VoroforceCell['id']
      title: Film['title']
      year: Film['year']
      tagline: Film['tagline']
      tmdbId: Film['tmdbId']
      imdbId?: Film['imdbId']
      poster?: Film['poster']
    }
  }
}

const handleCustomLinkParam = (
  customLinkBase64Param: string,
  state: StoreState,
) => {
  const { userConfig, setUserConfig } = state
  try {
    const customLink = JSON.parse(window.atob(customLinkBase64Param))
    userConfig.customLinks = [...(userConfig.customLinks ?? [])]
    const sameNameIndex = userConfig.customLinks.findIndex(
      ({ name }) => name === customLink.name,
    )
    if (sameNameIndex !== -1) {
      userConfig.customLinks[sameNameIndex] = customLink
    } else {
      userConfig.customLinks.push(customLink)
    }
    setUserConfig(userConfig)
    window.history.replaceState({}, document.title, '/')
  } catch (e) {}
}

export const getConfig = async (state: StoreState) => {
  const {
    userConfig,
    preset: initialPreset,
    cellLimit: initialCellLimit,
    deviceClass: initialDeviceClass,
    estimatedDeviceClass: initialEstimatedDeviceClass,
    setEstimatedDeviceClass,
    setDeviceClass,
    ua,
    mode,
  } = state
  const urlParams = new URLSearchParams(window.location.search)
  const presetOverrideParam = urlParams.get('preset') as VOROFORCE_PRESET
  const cellsOverrideParam = urlParams.get('cells')
  const customLinkBase64Param = urlParams.get('customLinkBase64')

  const device = ua.getDevice()

  let preset = initialPreset
  const deviceClass = initialDeviceClass
  let estimatedDeviceClass = initialEstimatedDeviceClass

  if (!preset && !deviceClass && !estimatedDeviceClass) {
    const isMobile = device.is('mobile')
    const isTablet = device.is('tablet')
    const isSmallScreen = matchMediaQuery(down('md')).matches
    if (isMobile) {
      estimatedDeviceClass = DEVICE_CLASS.mobile
    } else if (isSmallScreen || isTablet) {
      estimatedDeviceClass = DEVICE_CLASS.low
    } else {
      const gpuTier = await getGPUTier()
      console.log('gpuTier', gpuTier)
      switch (gpuTier.tier) {
        case 3:
          estimatedDeviceClass = DEVICE_CLASS.high
          break
        case 2:
          estimatedDeviceClass = DEVICE_CLASS.mid
          break
        default:
          estimatedDeviceClass = DEVICE_CLASS.low
      }
    }

    if (isSmallScreen) setDeviceClass(estimatedDeviceClass)
    setEstimatedDeviceClass(estimatedDeviceClass)
  }

  if (presetOverrideParam && VOROFORCE_PRESET[presetOverrideParam]) {
    preset = presetOverrideParam
  }

  let config = baseConfig
  if (preset) {
    config = mergeConfigs(
      config,
      (presets as unknown as Record<VOROFORCE_PRESET, typeof baseConfig>)[
        preset
      ],
    )
  }
  if (config.modes?.[mode]) {
    config = mergeConfigs(config, config.modes?.[mode])
  }

  if (customLinkBase64Param) {
    handleCustomLinkParam(customLinkBase64Param, state)
  }

  config.cells = cellsOverrideParam
    ? Number.parseInt(cellsOverrideParam)
    : (initialCellLimit ?? config.cells)

  if ('devTools' in userConfig) {
    config.devTools.enabled = !!userConfig.devTools
  }

  return config
}

const processVoroforceStageConfigUniforms = (
  stageConfigUniforms: Record<string, ConfigUniform>,
  transitioning: Map<string, ConfigUniform>,
  mode: VOROFORCE_MODE,
  theme: THEME,
) => {
  return new Map<string, ConfigUniform>(
    Object.entries(stageConfigUniforms).map(([key, uniform]) => {
      if (typeof uniform.value === 'undefined') {
        const uniformValue = uniform.modes
          ? typeof uniform.modes?.[mode]?.value !== 'undefined'
            ? uniform.modes[mode].value
            : (uniform.modes?.default?.value ?? 0)
          : typeof uniform.themes?.[theme]?.value !== 'undefined'
            ? uniform.themes[theme].value
            : (uniform.themes?.default?.value ?? 0)

        if (
          uniform.transition &&
          typeof uniform.initial?.value === 'number' &&
          typeof uniformValue === 'number'
        ) {
          uniform.value = uniform.initial.value

          uniform.targetValue = uniformValue
          if (!transitioning.has(key)) {
            transitioning.set(key, uniform)
          }
        } else {
          uniform.value = uniformValue as number
        }
      }
      return [key, uniform]
    }),
  )
}

const getVoroforceConfigUniforms = (
  config: VoroforceInstance['config'],
  mode: VOROFORCE_MODE,
  theme: THEME,
) => {
  const {
    display: {
      scene: {
        main: { uniforms: mainConfigUniforms = {} },
        post: { uniforms: postConfigUniforms = {} },
      },
    },
  } = config

  const transitioning = new Map<string, ConfigUniform>()

  return {
    main: processVoroforceStageConfigUniforms(
      mainConfigUniforms,
      transitioning,
      mode,
      theme,
    ),
    post: processVoroforceStageConfigUniforms(
      postConfigUniforms,
      transitioning,
      mode,
      theme,
    ),
    transitioning,
  }
}

export const getVoroforceConfigProps = async (state: StoreState) => {
  const config = await getConfig(state)
  return {
    config,
    configUniforms: getVoroforceConfigUniforms(config, state.mode, state.theme),
  }
}
