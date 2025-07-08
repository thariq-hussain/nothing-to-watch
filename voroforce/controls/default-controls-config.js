export const defaultControlsConfig = {
  autoFocusCenter: {
    enabled: 'touch', // true, false or 'touch'
    random: false,
  },

  raw: false,
  maxSpeed: 10,
  // Minimum speed to maintain when close to target (prevents snapping)
  minSpeed: 2,
  ease: 0.15, // smoothing factor

  capValues: true,
  freezeOnShake: {
    enabled: true,
  },
  freezeOnJolt: {
    enabled: true,
  },
}
