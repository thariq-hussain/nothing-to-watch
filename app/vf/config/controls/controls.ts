import { VOROFORCE_MODE } from '../../consts'
import type { VoroforceInstance } from '../../types'

export const controlModeConfigs: {
  [K in VOROFORCE_MODE]?: VoroforceInstance['controls']['config']
} = {
  [VOROFORCE_MODE.select]: {
    maxSpeed: 4,
    ease: 0.01,
    freezeOnShake: {
      enabled: false,
    },
    freezeOnJolt: {
      enabled: false,
    },
  },
}

const defaultControlsConfig = {
  autoFocusCenter: {
    enabled: true,
    random: true,
  },
  maxSpeed: 10,
  // maxSpeedPinned: 3,
  ease: 0.15,
  freezeOnShake: {
    enabled: true,
  },
  freezeOnJolt: {
    enabled: true,
  },
}

export default Object.assign(
  {
    default: defaultControlsConfig,
    modes: controlModeConfigs,
  },
  defaultControlsConfig,
)
