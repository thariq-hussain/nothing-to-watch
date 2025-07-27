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
        },
      },
      post: {
        enabled: false,
      },
    },
  },
}
