import type { RectReadOnly } from 'react-use-measure'
import { UAParser } from 'ua-parser-js'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import {
  type ConfigUniforms,
  DEFAULT_VOROFORCE_MODE,
  type Film,
  type FilmBatch,
  type FilmData,
  type PerformanceMonitorApi,
  type UserConfig,
  VOROFORCE_MODE,
  type VOROFORCE_PRESET,
  type VoroforceInstance,
} from './vf'

import { THEME } from './consts'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from './utils/storage'
import type { CELL_LIMIT, DEVICE_CLASS } from './vf/consts'

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
  film?: Film
  setFilm: (film?: Film) => void
  filmBatches: Map<number, FilmData[]>
  mode: VOROFORCE_MODE
  setMode: (mode: VOROFORCE_MODE) => void
  exitSelectMode: () => void
  isSelectMode: boolean
  isPreviewMode: boolean
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
  newLinkTypeOpen: boolean
  setNewLinkTypeOpen: (open: boolean) => void
  toggleNewLinkTypeOpen: () => void
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
const playedIntro = getStorageItem(STORAGE_KEYS.PLAYED_INTRO) ?? false
const initialMode = playedIntro ? DEFAULT_VOROFORCE_MODE : VOROFORCE_MODE.intro

export const store = create(
  subscribeWithSelector<StoreState>(
    (set, get) =>
      ({
        theme: getStorageItem(STORAGE_KEYS.THEME) ?? THEME.dark,
        setTheme: (theme: THEME) => {
          setStorageItem(STORAGE_KEYS.THEME, theme)
          set({ theme })
        },
        ua: new UAParser(),
        setVoroforce: (instance: VoroforceInstance) =>
          set({ voroforce: instance }),
        setConfig: (config: VoroforceInstance['config']) => set({ config }),
        setContainer: (container: HTMLElement) => set({ container }),
        setFilm: (film?: Film) => set({ film }),
        filmBatches: new Map<number, FilmBatch>(),
        mode: initialMode,
        isPreviewMode: initialMode === VOROFORCE_MODE.preview,
        isSelectMode: initialMode === VOROFORCE_MODE.select,
        setMode: (mode: VOROFORCE_MODE) =>
          set({
            mode,
            isSelectMode: mode === VOROFORCE_MODE.select,
            isPreviewMode: mode === VOROFORCE_MODE.preview,
          }),
        exitSelectMode: () => {
          get().voroforce?.controls?.deselect()
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

        newLinkTypeOpen: false,
        setNewLinkTypeOpen: (newLinkTypeOpen: boolean) => {
          set({
            newLinkTypeOpen,
          })
        },
        toggleNewLinkTypeOpen: () => {
          set({
            newLinkTypeOpen: !get().newLinkTypeOpen,
          })
        },
        playedIntro,
        setPlayedIntro: (playedIntro: boolean) => {
          set({
            playedIntro,
          })
          setStorageItem(STORAGE_KEYS.PLAYED_INTRO, playedIntro)
        },
        preset: getStorageItem(STORAGE_KEYS.PRESET) ?? undefined,
        setPreset: (preset: VOROFORCE_PRESET) => {
          set({
            preset,
          })
          setStorageItem(STORAGE_KEYS.PRESET, preset)
        },
        cellLimit: getStorageItem(STORAGE_KEYS.CELL_LIMIT) ?? undefined,
        setCellLimit: (cellLimit: CELL_LIMIT) => {
          set({
            cellLimit,
          })
          setStorageItem(STORAGE_KEYS.CELL_LIMIT, cellLimit)
        },
        deviceClass: getStorageItem(STORAGE_KEYS.DEVICE_CLASS) ?? undefined,
        setDeviceClass: (deviceClass: DEVICE_CLASS) => {
          set({
            deviceClass,
          })
          setStorageItem(STORAGE_KEYS.DEVICE_CLASS, deviceClass)
        },
        estimatedDeviceClass:
          getStorageItem(STORAGE_KEYS.ESTIMATED_DEVICE_CLASS) ?? undefined,
        setEstimatedDeviceClass: (estimatedDeviceClass: DEVICE_CLASS) => {
          set({
            estimatedDeviceClass,
          })
          setStorageItem(
            STORAGE_KEYS.ESTIMATED_DEVICE_CLASS,
            estimatedDeviceClass,
          )
        },
        setFilmViewBounds: (filmViewBounds: RectReadOnly) => {
          set({
            filmViewBounds,
          })
        },
        userConfig: getStorageItem(STORAGE_KEYS.USER_CONFIG) ?? {},
        setUserConfig: (userConfig: UserConfig) => {
          set({
            userConfig,
          })
          setStorageItem(STORAGE_KEYS.USER_CONFIG, userConfig)
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
