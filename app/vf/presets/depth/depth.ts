import { mediaConfigWithUncompressedSingleVersion } from '../../config/media'
import { DEFAULT_VOROFORCE_MODE, VOROFORCE_MODE } from '../../consts'
import postFrag from './post-depth.frag'

const forceSimulationStepConfigs = {
  [VOROFORCE_MODE.preview]: {
    forces: {
      push: {
        // centerXStretchMod: 0.8,
        centerXStretchMod: 1.6,
        // centerXStretchMod: 3.2,
      },
      requestMediaVersions: {
        enabled: true,
        v2ColLevelAdjacencyThreshold: 3,
        v2RowLevelAdjacencyThreshold: 3,
        v1ColLevelAdjacencyThreshold: 6,
        v1RowLevelAdjacencyThreshold: 6,
      },
    },
  },
  // [VOROFORCE_MODE.select]: {
  //   manageWeights: true,
  //   requestMediaVersions: {
  //     enabled: true,
  //     v3ColLevelAdjacencyThreshold: 1,
  //     v3RowLevelAdjacencyThreshold: 1,
  //     v2ColLevelAdjacencyThreshold: 18,
  //     v2RowLevelAdjacencyThreshold: 18,
  //   },
  //   breathing: {
  //     enabled: true,
  //   },
  //   push: {
  //     // strength: 0.1, // for smaller push radius
  //     // strength: 0.05,
  //     strength: 0.0025,
  //     // strength: 0.25,
  //     selector: 'focused',
  //     yFactor: 2.5,
  //     centerXStretchMod: 2.5,
  //     alignmentMaxLevelsX: 40,
  //   },
  //   lattice: {
  //     strength: 0.8,
  //     yFactor: 2.75,
  //     xFactor: 1,
  //     maxLevelsFromPrimary: 50,
  //     // cellSizeMod: 10,
  //   },
  //   origin: {
  //     strength: 2.8,
  //     // yFactor: 1.5,
  //     // latticeScale: 5,
  //     // latticeScale: 1,
  //   },
  // },
  [VOROFORCE_MODE.select]: {
    alpha: 0.15,
    velocityDecay: 0.7,
    velocityDecayBase: 0.7,
    forces: {
      manageWeights: true,
      primaryCellWeightPushFactorEnabled: false,
      // handlePointerSpeedScale: false,
      smoothPrimaryCell: false,
      requestMediaVersions: {
        enabled: true,
        handleMediaSpeedLimits: false,
        v3ColLevelAdjacencyThreshold: 1,
        v3RowLevelAdjacencyThreshold: 1,
        v2ColLevelAdjacencyThreshold: 18,
        v2RowLevelAdjacencyThreshold: 18,
      },
      breathing: {
        enabled: false,
      },
      push: {
        // strength: 0.1, // for smaller push radius
        // strength: 0.05,
        // strength: 0.0025,
        strength: 0.05,
        // strength: 0,
        selector: 'focused',
        // yFactor: 2.5,
        yFactor: 1.5,
        // centerXStretchMod: 0,
        // centerXStretchMod: 0.4,
      },
      lattice: {
        strength: 1,
        yFactor: 1.5,
        xFactor: 1,
        maxLevelsFromPrimary: 50,
        // cellSizeMod: 10,
      },
      origin: {
        strength: 0.1,
        // yFactor: 1.5,
        latticeScale: 10,
        // latticeScale: 1,
      },
    },
  },
  [VOROFORCE_MODE.intro]: {},
}

export default {
  cells: 50000,
  media: mediaConfigWithUncompressedSingleVersion,
  display: {
    scene: {
      post: {
        enabled: true,
        fragmentShader: postFrag,
        voroIndexBuffer: true,
      },
      main: {
        uniforms: {
          fMediaBboxScale: { value: 0.8 },
          fCenterForceBulgeStrength: {
            modes: {
              [VOROFORCE_MODE.preview]: {
                value: 1.0,
              },
              [VOROFORCE_MODE.select]: {
                value: 0.5,
              },
            },
          },
          fCenterForceBulgeRadius: {
            modes: {
              [VOROFORCE_MODE.select]: {
                value: 2,
              },
            },
          },
        },
      },
    },
  },
  simulation: {
    steps: {
      force: forceSimulationStepConfigs[DEFAULT_VOROFORCE_MODE],
    },
    forceStepModeConfigs: forceSimulationStepConfigs,
  },
}
