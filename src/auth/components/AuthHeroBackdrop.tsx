/**
 * El fondo del bloque de imagen de las pantallas de acceso.
 *
 * ES EL SITIO DE UNA FOTO, Y MIENTRAS NO LA HAYA, ESTO. No hay fotografía del
 * equipo en el repositorio y una imagen de banco sería mentir sobre quién usa la
 * aplicación. Lo que sí se decide aquí y se queda cuando llegue la foto es el
 * TRATAMIENTO: fondo Ink, foco de luz Cobalt arriba, viñeta hacia abajo para que
 * el titular blanco lea sobre cualquier cosa, y grano.
 *
 * Para poner la foto: un `<img>` con `object-cover` debajo de este SVG, y
 * dejar el degradado de sombra y el grano encima. Las formas oscuras —el hombro
 * y el brazo recortados— se quitan; existen sólo para que el bloque no sea un
 * degradado plano.
 *
 * `preserveAspectRatio="slice"` hace que el SVG llene el bloque como lo haría
 * una foto: recorta, no deforma.
 */
export function AuthHeroBackdrop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 390 420"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 block size-full"
    >
      <defs>
        <radialGradient id="auth-hero-glow" cx="0.68" cy="0.36" r="0.62">
          <stop offset="0" stopColor="#3B7BF0" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#0B4BCC" stopOpacity="0.4" />
          <stop offset="1" stopColor="#0A1224" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="auth-hero-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor="#0A1224" stopOpacity="0" />
          <stop offset="1" stopColor="#0A1224" stopOpacity="0.9" />
        </linearGradient>
        <filter id="auth-hero-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="390" height="420" fill="#0A1224" />
      <rect width="390" height="420" fill="url(#auth-hero-glow)" />
      <ellipse cx="300" cy="245" rx="175" ry="125" fill="#060B16" opacity="0.92" />
      <path d="M110 420 C150 300 240 255 340 285 L390 305 L390 420 Z" fill="#050A14" />
      <path d="M40 420 C80 355 140 335 205 348 L265 420 Z" fill="#0E1E42" opacity="0.75" />
      <rect width="390" height="420" fill="url(#auth-hero-shade)" />
      <rect
        width="390"
        height="420"
        filter="url(#auth-hero-grain)"
        opacity="0.14"
        style={{ mixBlendMode: 'overlay' }}
      />
    </svg>
  )
}
