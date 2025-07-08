import { THEME } from '../../../consts'
import { VOROFORCE_MODE } from '../../consts'
// import mainFrag from './main.frag'
// import mainFrag from './main2.frag'
// import mainFrag from './main22.frag'
// import mainFrag from './main3.frag'
import mainFrag from './main33.frag'
// import mainFrag from './main4.frag'

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
        fPixelSearchRadiusMod: {
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 2,
            },
          },
        },
        bMediaDistortion: { value: false },
        fBaseColor: {
          animatable: true,
          themes: {
            default: {
              value: [0, 0, 0],
            },
            [THEME.light]: {
              // value: [1, 1, 1],
              value: [
                0.6823529411764706, 0.6352941176470588, 0.5882352941176471,
              ],
            },
          },
        },
        fBorderRoundnessMod: {
          animatable: true,
          modes: {
            default: {
              // value: 1,
              value: 0.75,
            },
            [VOROFORCE_MODE.select]: {
              // value: 3,
              value: 0.75,
            },
          },
        },
        fBorderThicknessMod: {
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 1,
            },
          },
        },
        fBorderSmoothnessMod: {
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 0.75,
            },
          },
        },
        fCenterForceBulgeStrength: {
          animatable: true,
          targetFactor: 0.0125,
          initial: {
            value: 0.25,
          },
          modes: {
            default: {
              value: 0,
            },
            [VOROFORCE_MODE.preview]: {
              // value: 1.25,
              value: 0.75,
              // value: 0,
            },
            [VOROFORCE_MODE.select]: {
              value: 1.5,
            },
          },
        },
        fCenterForceBulgeRadius: {
          animatable: true,
          targetFactor: 0.0125,
          initial: {
            value: 0.25,
          },
          modes: {
            default: {
              value: 0,
            },
            [VOROFORCE_MODE.preview]: {
              value: 0.75,
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 2,
            },
          },
        },
        fWeightOffsetScaleMod: {
          animatable: true,
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
          animatable: true,
          initial: {
            value: 0,
          },
          modes: {
            [VOROFORCE_MODE.preview]: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 1,
            },
          },
        },
        fBaseXDistScale: {
          animatable: true,
          modes: {
            default: {
              value: 1.5, // 0 = undefined, will use fallback
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 1.5,
            },
          },
        },
        fWeightedXDistScale: {
          animatable: true,
          modes: {
            default: {
              value: 1.5, // 0 = undefined, will use fallback
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 1.5,
            },
          },
        },
        fRippleMod: {
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 0,
            },
          },
        },
        fNoiseOctaveMod: {
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 0,
            },
          },
        },
        fNoiseCenterOffsetMod: {
          animatable: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 0,
            },
          },
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
