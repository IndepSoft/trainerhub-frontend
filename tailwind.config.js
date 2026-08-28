import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        // Cada particula recibe su propia trayectoria por variables CSS, asi
        // que un unico fotograma clave sirve para todas: sin esto harian falta
        // treinta keyframes distintos o una animacion en JavaScript.
        'confetti-burst': {
          '0%': { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: '1' },
          '100%': {
            transform:
              'translate3d(var(--confetti-x), var(--confetti-y), 0) rotate(var(--confetti-rotation))',
            opacity: '0',
          },
        },
      },
      animation: {
        'confetti-burst': 'confetti-burst var(--confetti-duration) cubic-bezier(0.2,0.6,0.3,1) forwards',
      },
      fontFamily: {
        // Barlow para toda la interfaz; su corte Condensed para el registro
        // display. Misma familia, dos anchos: la app se siente una sola.
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        display: ['Barlow Condensed', 'Barlow', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // Dos radios, no una escala uniforme: los bloques van a escuadra y las
        // acciones en pildora. Un `--radius` igual para todo es la firma
        // reconocible de shadcn sin tematizar.
        block: 'var(--radius-block)',
        action: 'var(--radius-action)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // Identidad. Los tintes son el mismo Cobalt a distinta opacidad,
        // porque eso es lo que en realidad eran los 17 `bg-blue-50/100`
        // repartidos por los dominios.
        cobalt: {
          DEFAULT: 'hsl(var(--cobalt))',
          lift: 'hsl(var(--cobalt-lift))',
          tint: 'hsl(var(--cobalt-tint-1))',
          'tint-2': 'hsl(var(--cobalt-tint-2))',
          'tint-3': 'hsl(var(--cobalt-tint-3))',
        },
        ember: {
          DEFAULT: 'hsl(var(--ember))',
          deep: 'hsl(var(--ember-deep))',
        },
        ink: 'hsl(var(--ink))',
        bone: 'hsl(var(--bone))',
        // Escala de dificultad, fuera de la marca a proposito.
        scale: {
          1: 'hsl(var(--scale-1))',
          2: 'hsl(var(--scale-2))',
          3: 'hsl(var(--scale-3))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
    },
  },
  plugins: [animate],
}
