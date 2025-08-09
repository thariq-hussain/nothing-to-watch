import type { RectReadOnly } from 'react-use-measure'
import { UAParser } from 'ua-parser-js'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import {
  getPersistentSettings,
  updatePersistentSetting,
} from './utils/settings'
import type {
  CELL_LIMIT,
  ConfigUniforms,
  DEVICE_CLASS,
  Film,
  FilmBatch,
  FilmData,
  PerformanceMonitorApi,
  UserConfig,
  VOROFORCE_PRESET,
  VoroforceInstance,
} from './vf'
import { DEFAULT_VOROFORCE_MODE, VOROFORCE_MODE } from './vf/consts'

import type { DialogProps } from 'vaul'
import type { THEME } from './consts'

export type StoreState = {
  theme: THEME
  setTheme: (theme: THEME) => void
  ua: UAParser
  container: HTMLElement
  setContainer: (container: HTMLElement) => void
  voroforce: VoroforceInstance
  setVoroforce: (instance: VoroforceInstance) => void
  config: VoroforceInstance['config']
  setConfig: (instance: VoroforceInstance['config']) => void
  voroforceMediaPreloaded: boolean
  setVoroforceMediaPreloaded: (preloaded: boolean) => void
  film?: Film
  setFilm: (film?: Film) => void
  filmBatches: Map<number, FilmData[]>
  mode: VOROFORCE_MODE
  setMode: (mode: VOROFORCE_MODE) => void
  exitSelectMode: () => void
  isSelectMode: boolean
  isPreviewMode: boolean
  isIntroMode: boolean
  voroforceDevSceneEnabled: boolean
  setVoroforceDevSceneEnabled: (enabled: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (settingsOpen: boolean) => void
  toggleSettingsOpen: () => void
  aboutOpen: boolean
  setAboutOpen: (aboutOpen: boolean) => void
  toggleAboutOpen: () => void
  favoritesOpen: boolean
  setFavoritesOpen: (favoritesOpen: boolean) => void
  toggleFavoritesOpen: () => void
  addCustomLinkTypeOpen: boolean | DialogProps['direction']
  setAddCustomLinkTypeOpen: (open: boolean | DialogProps['direction']) => void
  toggleAddCustomLinkTypeOpen: () => void
  playedIntro: boolean
  setPlayedIntro: (playedIntro: boolean) => void
  preset?: VOROFORCE_PRESET
  setPreset: (preset: VOROFORCE_PRESET) => void
  cellLimit?: CELL_LIMIT
  setCellLimit: (cellLimit: CELL_LIMIT) => void
  deviceClass?: DEVICE_CLASS
  setDeviceClass: (deviceClass: DEVICE_CLASS) => void
  estimatedDeviceClass?: DEVICE_CLASS
  setEstimatedDeviceClass: (deviceClass: DEVICE_CLASS) => void
  filmViewBounds?: RectReadOnly
  setFilmViewBounds: (filmViewBounds: RectReadOnly) => void
  userConfig: UserConfig
  setUserConfig: (userConfig: UserConfig) => void
  configUniforms: {
    main: ConfigUniforms
    post: ConfigUniforms
    transitioning: ConfigUniforms
  }
  performanceMonitor?: PerformanceMonitorApi
  setPerformanceMonitor: (performanceMonitor: PerformanceMonitorApi) => void
}
// Load persistent settings once at startup
const persistentSettings = getPersistentSettings()
const initialMode = persistentSettings.playedIntro
  ? DEFAULT_VOROFORCE_MODE
  : VOROFORCE_MODE.intro

export const store = create(
  subscribeWithSelector<StoreState>(
    (set, get) =>
      ({
        theme: persistentSettings.theme,
        setTheme: (theme: THEME) => {
          updatePersistentSetting('theme', theme)
          set({ theme })
        },
        ua: new UAParser(),
        setVoroforce: (instance: VoroforceInstance) =>
          set({ voroforce: instance }),
        setConfig: (config: VoroforceInstance['config']) => set({ config }),
        voroforceMediaPreloaded: false,
        setVoroforceMediaPreloaded: (voroforceMediaPreloaded: boolean) => {
          set({
            voroforceMediaPreloaded,
          })
        },
        setContainer: (container: HTMLElement) => set({ container }),
        setFilm: (film?: Film) => set({ film }),
        filmBatches: new Map<number, FilmBatch>(),
        mode: initialMode,
        isPreviewMode: initialMode === VOROFORCE_MODE.preview,
        isSelectMode: initialMode === VOROFORCE_MODE.select,
        isIntroMode: initialMode === VOROFORCE_MODE.intro,
        setMode: (mode: VOROFORCE_MODE) =>
          set({
            mode,
            isSelectMode: mode === VOROFORCE_MODE.select,
            isPreviewMode: mode === VOROFORCE_MODE.preview,
            isIntroMode: mode === VOROFORCE_MODE.intro,
          }),
        exitSelectMode: () => {
          get().voroforce?.controls?.deselectAndPin()
        },
        voroforceDevSceneEnabled: false,
        setVoroforceDevSceneEnabled: (voroforceDevSceneEnabled: boolean) => {
          get().voroforce.config.display.scene.dev.enabled =
            voroforceDevSceneEnabled

          if (voroforceDevSceneEnabled) {
            get().voroforce.display.scene.initDev()
          } else {
            get().voroforce.display.scene.stopDev()
          }

          set({
            voroforceDevSceneEnabled,
          })
        },
        settingsOpen: false,
        setSettingsOpen: (settingsOpen: boolean) => {
          set({
            settingsOpen,
          })
        },
        toggleSettingsOpen: () => {
          set({
            settingsOpen: !get().settingsOpen,
          })
        },
        aboutOpen: false,
        setAboutOpen: (aboutOpen: boolean) => {
          set({
            aboutOpen,
          })
        },
        toggleAboutOpen: () => {
          set({
            aboutOpen: !get().aboutOpen,
          })
        },
        favoritesOpen: false,
        setFavoritesOpen: (favoritesOpen: boolean) => {
          set({
            favoritesOpen,
          })
        },
        toggleFavoritesOpen: () => {
          set({
            favoritesOpen: !get().favoritesOpen,
          })
        },

        addCustomLinkTypeOpen: false,
        setAddCustomLinkTypeOpen: (
          addCustomLinkTypeOpen: boolean | DialogProps['direction'],
        ) => {
          set({
            addCustomLinkTypeOpen,
          })
        },
        toggleAddCustomLinkTypeOpen: () => {
          set({
            addCustomLinkTypeOpen: !get().addCustomLinkTypeOpen,
          })
        },
        playedIntro: persistentSettings.playedIntro,
        setPlayedIntro: (playedIntro: boolean) => {
          updatePersistentSetting('playedIntro', playedIntro)
          set({ playedIntro })
        },
        preset: persistentSettings.preset,
        setPreset: (preset: VOROFORCE_PRESET) => {
          updatePersistentSetting('preset', preset)
          set({ preset })
        },
        cellLimit: persistentSettings.cellLimit,
        setCellLimit: (cellLimit: CELL_LIMIT) => {
          updatePersistentSetting('cellLimit', cellLimit)
          set({ cellLimit })
        },
        deviceClass: persistentSettings.deviceClass,
        setDeviceClass: (deviceClass: DEVICE_CLASS) => {
          updatePersistentSetting('deviceClass', deviceClass)
          set({ deviceClass })
        },
        estimatedDeviceClass: persistentSettings.estimatedDeviceClass,
        setEstimatedDeviceClass: (estimatedDeviceClass: DEVICE_CLASS) => {
          updatePersistentSetting('estimatedDeviceClass', estimatedDeviceClass)
          set({ estimatedDeviceClass })
        },
        setFilmViewBounds: (filmViewBounds: RectReadOnly) => {
          set({
            filmViewBounds,
          })
        },
        userConfig: persistentSettings.userConfig,
        setUserConfig: (userConfig: UserConfig) => {
          updatePersistentSetting('userConfig', userConfig)
          set({ userConfig })
        },
        setPerformanceMonitor: (performanceMonitor) => {
          set({
            performanceMonitor,
          })
        },
      }) as StoreState,
  ),
)

export const useShallowState = <U>(selector: (state: StoreState) => U) =>
  store(useShallow(selector))
