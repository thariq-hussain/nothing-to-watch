import { THEME } from '../../../consts'
import { VOROFORCE_MODE } from '../../consts'
// import mainFrag from './main.frag'
import mainFrag from './main2.frag'

export default {
  scene: {
    dev: {
      enabled: false,
    },
    main: {
      fragmentShader: mainFrag,
      uniforms: {
        iForcedMaxNeighborLevel: { value: 0 },
        bPixelSearch: { value: true },
        bMediaDistortion: { value: false },
        fBaseColor: {
          transition: true,
          themes: {
            default: {
              value: [0, 0, 0],
            },
            [THEME.light]: {
              value: [1, 1, 1],
            },
          },
        },
        fBorderRoundnessMod: {
          transition: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              // value: 3,
              value: 1,
            },
          },
        },
        fBorderSmoothnessMod: {
          transition: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 5,
            },
          },
        },
        fBorderThicknessMod: {
          transition: true,
          modes: {
            default: {
              value: 1.5,
            },
            [VOROFORCE_MODE.select]: {
              value: 3,
            },
          },
        },
        fCenterForceBulgeStrength: {
          transition: true,
          initial: {
            value: 0,
          },
          modes: {
            default: {
              value: 0,
            },
            [VOROFORCE_MODE.preview]: {
              // value: 1.25,
              value: 1,
              // value: 0,
            },
            [VOROFORCE_MODE.select]: {
              value: 1.5,
            },
          },
        },
        fCenterForceBulgeRadius: {
          transition: true,
          initial: {
            value: 0,
          },
          modes: {
            default: {
              value: 0,
            },
            [VOROFORCE_MODE.preview]: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 3,
            },
          },
        },
        fWeightOffsetScaleMod: {
          transition: true,
          modes: {
            default: {
              value: 0.25,
              // value: 0,
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 0,
            },
          },
        },
        fUnweightedEffectMod: {
          transition: true,
          value: 1,
        },
        fBaseXDistScale: {
          transition: true,
          value: 1.5, // 0 = undefined, will use fallback
        },
        fWeightedXDistScale: {
          transition: true,
          value: 1.5, // 0 = undefined, will use fallback
        },
      },
    },
    post: {
      enabled: false,
      fragmentShader: undefined,
      uniforms: {},
    },
  },
}
