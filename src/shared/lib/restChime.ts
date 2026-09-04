/**
 * El aviso sonoro de fin de descanso.
 *
 * SIN FICHERO DE AUDIO: se sintetiza con la Web Audio API. Un `.mp3` habría que
 * descargarlo, cachearlo para que sonara sin red —esto va a ser una PWA— y
 * versionarlo con el resto de los recursos; dos tonos de menos de medio segundo
 * no necesitan nada de eso, y lo que se pide de ellos es avisar, no sonar bien.
 *
 * ES LA MITAD QUE FALTABA DEL AVISO. La vibración no existe en iOS —Apple nunca
 * implementó la Vibration API— y el color no llega a quien tiene el teléfono en
 * el bolsillo, que es justo la postura normal durante un descanso de dos
 * minutos. El sonido es lo único que alcanza a las dos situaciones.
 *
 * SE PUEDE APAGAR, y por eso existe: un pitido que no se puede silenciar en una
 * sala compartida es peor que ninguno. La preferencia vive en Ajustes; ver
 * `soundPreference.ts`. Y por debajo manda el silenciador del propio teléfono,
 * que el navegador respeta: con el móvil en silencio esto no suena aunque la
 * preferencia esté puesta.
 */

/**
 * Los dos tonos del aviso, en hercios. La5 y Re6: una cuarta ascendente.
 *
 * DOS Y NO UNO porque un tono suelto se confunde con cualquier notificación del
 * teléfono; un intervalo ascendente se reconoce como «esto es la aplicación» a
 * la tercera vez. Ascendente y no descendente porque lo que anuncia es volver a
 * empezar, no terminar.
 */
const CHIME_TONES = [880, 1174.66] as const

/** Cuánto suena cada tono y cuánto se calla entre uno y otro, en segundos. */
const TONE_SECONDS = 0.18
const TONE_GAP_SECONDS = 0.12

/**
 * Volumen de pico, de 0 a 1.
 *
 * Bajo a propósito: esto suena en un gimnasio con el teléfono a un metro, no en
 * unos auriculares. Un aviso que sobresalta se acaba apagando, y entonces no
 * avisa de nada.
 */
const PEAK_GAIN = 0.18

/** Rampa de entrada, en segundos. Un tono que arranca en seco chasquea. */
const ATTACK_SECONDS = 0.01

/*
 * UN SOLO CONTEXTO PARA TODA LA APLICACIÓN. Los navegadores limitan cuántos
 * puede haber abiertos —Chrome corta sobre los seis— y una sesión con veinte
 * descansos crearía veinte. Además, el desbloqueo por gesto se pierde con cada
 * contexto nuevo: habría que volver a pedirlo y el aviso no sonaría.
 */
let sharedContext: AudioContext | null = null

/** Lo que hay programado y todavía no ha sonado, para poder cancelarlo. */
let scheduledTones: OscillatorNode[] = []

/**
 * Cuenta de programaciones, para descartar las que se cancelaron mientras
 * esperaban a que el contexto se reanudara. Sin esto, cancelar durante esa
 * espera no cancelaría nada: el `then` seguiría y programaría igual.
 */
let generation = 0

function audioContext(): AudioContext | null {
  if (sharedContext !== null) return sharedContext
  if (typeof AudioContext === 'undefined') return null

  try {
    sharedContext = new AudioContext()
  } catch {
    // Sin audio la aplicación funciona igual: quedan el color y la vibración.
    return null
  }

  return sharedContext
}

/** Los dos tonos, encadenados a partir de un instante del reloj de audio. */
function armTones(context: AudioContext, startsAt: number): OscillatorNode[] {
  return CHIME_TONES.map((frequency, index) => {
    const toneStartsAt = startsAt + index * (TONE_SECONDS + TONE_GAP_SECONDS)
    const oscillator = context.createOscillator()
    const envelope = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency

    /*
     * La envolvente, no un volumen fijo. Un tono que empieza y termina de golpe
     * produce un chasquido —la discontinuidad de la onda— que se oye más que el
     * propio tono, y encima suena a fallo.
     */
    envelope.gain.setValueAtTime(0, toneStartsAt)
    envelope.gain.linearRampToValueAtTime(PEAK_GAIN, toneStartsAt + ATTACK_SECONDS)
    envelope.gain.linearRampToValueAtTime(0, toneStartsAt + TONE_SECONDS)

    oscillator.connect(envelope)
    envelope.connect(context.destination)

    oscillator.start(toneStartsAt)
    oscillator.stop(toneStartsAt + TONE_SECONDS)

    return oscillator
  })
}

/**
 * Deja el audio listo para sonar más tarde. Se llama DESDE UN GESTO del usuario.
 *
 * iOS y Chrome arrancan el contexto en `suspended` y sólo lo reanudan dentro del
 * manejador de un evento del usuario. Reanudarlo desde el temporizador que mide
 * el descanso llega tarde: la promesa se resuelve, pero el navegador ya ha
 * decidido que no hubo gesto y no suena nada.
 *
 * El sitio donde llamarlo es cerrar la serie, que es el gesto que SIEMPRE
 * precede a un descanso. No hay descanso que no venga de un toque.
 */
export function primeRestChime(): void {
  const context = audioContext()
  if (context === null) return
  if (context.state === 'suspended') void context.resume()
}

/**
 * Programa el aviso para dentro de `secondsFromNow`. Cancela lo que hubiera.
 *
 * SE PROGRAMA POR ADELANTADO Y NO SE TOCA CUANDO LLEGA LA HORA, y ésa es la
 * razón de que exista esta función en vez de un `playRestChime` disparado por el
 * temporizador.
 *
 * Medido en el navegador: con la pestaña en segundo plano, los temporizadores se
 * estrangulan a uno por minuto. El reloj de la sesión no se equivoca —mide
 * marcas de tiempo—, pero se REPINTA tarde, y con él llegaría tarde cualquier
 * aviso disparado desde el repintado. Justo en el caso para el que se puso el
 * sonido: el teléfono guardado en el bolsillo.
 *
 * El reloj de audio es otra cosa. `currentTime` corre en el hilo de audio, que
 * no se estrangula, y un oscilador programado para dentro de dos minutos suena
 * a los dos minutos aunque nadie haya mirado la pantalla.
 *
 * NO ES UNA CURA COMPLETA: con la pantalla apagada, iOS suspende el contexto y
 * ahí no suena nada. Eso ya no es un problema de temporizadores sino de que la
 * página deja de existir, y su solución son las notificaciones del sistema, que
 * son otro trabajo y otro consentimiento.
 */
export function scheduleRestChime(secondsFromNow: number): void {
  cancelRestChime()

  const context = audioContext()
  if (context === null) return

  const mine = generation

  const arm = () => {
    // Se canceló mientras se reanudaba el contexto: lo que iba a sonar ya no
    // corresponde a ningún descanso.
    if (mine !== generation) return
    scheduledTones = armTones(context, context.currentTime + Math.max(secondsFromNow, 0))
  }

  /*
   * Con el contexto dormido, `currentTime` no avanza, así que programar sobre él
   * daría un instante que no es. Se espera a que reanude y se programa entonces.
   * En la práctica ya está despierto: el gesto de cerrar la serie lo despertó.
   */
  if (context.state === 'suspended') {
    void context.resume().then(arm)
    return
  }

  arm()
}

/**
 * Cancela lo programado. Se llama al salir del descanso, por el motivo que sea.
 *
 * Empezar la siguiente serie antes de tiempo, deshacer, pausar: en los tres
 * casos el descanso deja de existir, y un pitido a destiempo es peor que no
 * avisar, porque enseña a desconfiar del aviso.
 */
export function cancelRestChime(): void {
  generation += 1

  for (const oscillator of scheduledTones) {
    try {
      oscillator.stop()
    } catch {
      // Ya había terminado de sonar. No hay nada que parar.
    }
    oscillator.disconnect()
  }

  scheduledTones = []
}

/**
 * Suena ahora mismo.
 *
 * Sólo lo usa el interruptor de Ajustes, para que se pueda oír lo que se está
 * encendiendo: un aviso sonoro que no se comprueba hasta que termine un descanso
 * de dos minutos es un ajuste a ciegas.
 */
export function playRestChime(): void {
  scheduleRestChime(0)
}
