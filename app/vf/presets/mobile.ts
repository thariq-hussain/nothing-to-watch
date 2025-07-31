import { VOROFORCE_MODE } from '../consts'

export default {
  cells: 5000,
  multiThreading: {
    enabled: false, // TODO headers seem to be in order (SharedArrayBuffer exists) but black screen, used to work, needs triage (it works in local network though?!?)
    renderInParallel: true,
  },
  media: {
    compressionFormat: 'ktx',
  },
  display: {
    scene: {
      main: {
        uniforms: {
          bPixelSearch: { value: false },
          fBorderRoundnessMod: {
            value: 1,
            transition: true,
            modes: {
              default: {
                value: 1,
              },
              select: {
                value: 1,
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
                value: 1.5,
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
                value: 0.75,
              },
            },
          },
          fCenterForceBulgeStrength: {
            transition: true,
            targetFactor: 0.0125,
            initial: {
              value: 1,
            },
            modes: {
              default: {
                value: 0,
              },
              [VOROFORCE_MODE.preview]: {
                value: 1,
              },
              [VOROFORCE_MODE.select]: {
                value: 1,
              },
            },
          },
          fCenterForceBulgeRadius: {
            transition: true,
            targetFactor: 0.0125,
            initial: {
              value: 1,
            },
            modes: {
              default: {
                value: 0,
              },
              [VOROFORCE_MODE.preview]: {
                value: 1,
              },
              [VOROFORCE_MODE.select]: {
                value: 1.5,
              },
            },
          },
        },
      },
      post: {
        enabled: false,
      },
    },
  },
}
