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
  [VOROFORCE_MODE.select]: {
    // manageWeights: true,
    // requestMediaVersions: {
    //   enabled: true,
    //   v3ColLevelAdjacencyThreshold: 1,
    //   v3RowLevelAdjacencyThreshold: 1,
    //   v2ColLevelAdjacencyThreshold: 18,
    //   v2RowLevelAdjacencyThreshold: 18,
    // },
    // breathing: {
    //   enabled: true,
    // },
    // push: {
    //   // strength: 0.1, // for smaller push radius
    //   // strength: 0.05,
    //   // strength: 0.0025,
    //   strength: 0.25,
    //   selector: 'focused',
    //   yFactor: 2.5,
    //   centerXStretchMod: 2.5,
    //   alignmentMaxLevelsX: 40,
    // },
    // lattice: {
    //   strength: 0.8,
    //   yFactor: 2.75,
    //   xFactor: 1,
    //   maxLevelsFromPrimary: 50,
    //   // cellSizeMod: 10,
    // },
    // origin: {
    //   strength: 2.8,
    //   // yFactor: 1.5,
    //   // latticeScale: 5,
    //   // latticeScale: 1,
    // },
  },
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
