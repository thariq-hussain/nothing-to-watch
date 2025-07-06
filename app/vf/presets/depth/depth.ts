import { mergeConfigs } from '√'
import { DEFAULT_VOROFORCE_MODE, VOROFORCE_MODE } from '../../consts'
import midConfig from '../contours/contours'
import postFrag from './post-depth.frag'

const forceSimulationStepConfigs = {
  [VOROFORCE_MODE.preview]: {
    forces: {
      push: {
        centerXStretchMod: 0.8,
      },
    },
  },
  [VOROFORCE_MODE.select]: {},
  [VOROFORCE_MODE.intro]: {},
}

export default mergeConfigs(midConfig, {
  cells: 50000,
  display: {
    scene: {
      post: {
        fragmentShader: postFrag,
        voroIndexBuffer: true,
      },
    },
  },
  simulation: {
    steps: {
      force: forceSimulationStepConfigs[DEFAULT_VOROFORCE_MODE],
    },
    forceStepModeConfigs: forceSimulationStepConfigs,
  },
})
