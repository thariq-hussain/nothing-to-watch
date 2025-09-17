const mediaConfig = {
  enabled: true,
  baseUrl: import.meta.env.VITE_TEXTURES_BASE_URL ?? '/media',
  preload:
    (import.meta.env.VITE_MEDIA_PRELOAD as 'v0' | 'first' | 'false' | undefined) ===
    'v0'
      ? 'v0'
      : (import.meta.env
          .VITE_MEDIA_PRELOAD as 'v0' | 'first' | 'false' | undefined) === 'first'
        ? 'first'
        : false, // default to false for perf
  compressionFormat: 'dds', // or 'ktx'
  versions: [
    {
      cols: 512,
      rows: 104,
      width: 2048,
      height: 624,
      layers: Number.parseInt(import.meta.env.VITE_MEDIA_VERSION_0_LAYERS) ?? 1,
      layerSrcFormat: '/low/{EXT}/{INDEX}.{EXT}',
      type: 'compressed-grid',
    },
    {
      cols: 90,
      rows: 60,
      width: 1980,
      height: 1980,
      layers:
        Number.parseInt(import.meta.env.VITE_MEDIA_VERSION_1_LAYERS) ?? 10,
      layerSrcFormat: '/mid/{EXT}/{INDEX}.{EXT}',
      type: 'compressed-grid',
    },
    {
      cols: 18,
      rows: 12,
      width: 1980,
      height: 1980,
      layers:
        Number.parseInt(import.meta.env.VITE_MEDIA_VERSION_2_LAYERS) ?? 241,
      layerSrcFormat: '/high/{EXT}/{INDEX}.{EXT}',
      type: 'compressed-grid',
    },
  ],
}

export default mediaConfig

export const uncompressedSingleMediaVersionConfig = {
  cols: 1,
  rows: 1,
  virtualCols: 9,
  virtualRows: 6,
  tileWidth: 220,
  tileHeight: 330,
  width: 1980,
  height: 1980,

  layers: 50000, // real layer count for 50000/54: 925.9 = 926
  virtualLayers: 50,
  layerIndexStart: 0,
  layerSrcFormat: '/single/{INDEX}.jpg',
  type: 'uncompressed-single',
}

export const mediaConfigWithUncompressedSingleVersion = {
  ...mediaConfig,
  versions: [
    ...mediaConfig.versions,
    ...(import.meta.env.VITE_EXPERIMENTAL_MEDIA_VERSION_3_ENABLED
      ? [uncompressedSingleMediaVersionConfig]
      : []),
  ],
}
