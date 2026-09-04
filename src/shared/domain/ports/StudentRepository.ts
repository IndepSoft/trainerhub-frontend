import type { MembershipStatus } from '../entities/crew'
import type { Student } from '../entities/student'

/**
 * Puerto de acceso a estudiantes.
 *
 * Métodos con intención de negocio, nunca constructores de consulta. Es lo que
 * permite que el calendario pida «los alumnos que puedo agendar» sin saber si
 * detrás hay Postgres, un backend propio o datos simulados.
 *
 * `findById` devuelve `null` cuando no existe, no una excepción: la ausencia es
 * un resultado válido —un enlace viejo, un identificador escrito a mano— y así
 * lo declara también `TrainerRepository`.
 *
 * TODO LO DE AQUÍ ESTÁ ACOTADO AL CREW ACTIVO salvo donde se diga lo contrario.
 * El ámbito no aparece en ninguna firma a propósito: ver `CrewScope`.
 */
export interface StudentRepository {
  /**
   * Los ALUMNOS del crew activo. Vacío si no hay ninguno activo.
   *
   * Quien ha pedido entrar y espera aprobación NO está aquí, y la distinción no
   * es cosmética: el panel contaba «5 estudiantes» en cuanto alguien escaneaba
   * el QR, y a un desconocido pendiente de aceptar se le podía agendar una
   * sesión. Una solicitud es una petición, no una persona del equipo.
   */
  findAll(): Promise<Student[]>
  /**
   * Las solicitudes de entrada sin responder.
   *
   * Operación aparte y no un filtro sobre `findAll`: son la bandeja de entrada
   * del entrenador, no una vista de su padrón, y quien las pide es la única
   * pantalla que las necesita.
   */
  findRequests(): Promise<Student[]>
  findById(studentId: string): Promise<Student | null>
  /**
   * TODAS las fichas de una persona, en cualquier crew. **No está acotado.**
   *
   * Es la única lectura que cruza crews, y tiene que serlo por dos motivos: es
   * como se deriva el rol —si responde, quien ha iniciado sesión es alumno— y es
   * como un alumno descubre a qué crews pertenece, que es justo lo que necesita
   * saber antes de poder elegir uno.
   *
   * No es un agujero: lee las fichas de UNO MISMO. Con RLS es una política de
   * `profile_id = auth.uid()`, no una excepción al aislamiento.
   *
   * Devuelve varias porque una persona puede entrenar en más de un sitio, y
   * entonces tiene una ficha por crew —la libreta de cada entrenador es suya—.
   */
  findAllByProfileId(profileId: string): Promise<Student[]>
  /** El alumno con este correo, dentro del crew activo. */
  findByEmail(email: string): Promise<Student | null>
  /**
   * Ata a una cuenta recién creada TODAS las fichas que esperaban su correo, en
   * cualquier crew. **No está acotado**, y tiene que no estarlo: al registrarse
   * todavía no hay crew activo, así que el ámbito no puede decidir nada.
   *
   * Devuelve las que ha reclamado, para que quien registra sepa si esta persona
   * era ya alumno de alguien —y entonces no hay que crearle ficha de
   * entrenador—.
   *
   * DEVUELVE VARIAS PORQUE PUEDEN SER VARIAS: dos entrenadores distintos pueden
   * haber dado de alta a la misma persona con su correo, y al registrarse entra
   * en los dos equipos. Buscar sólo una era el fallo que introdujo el acotado:
   * `findByEmail` dejó de encontrar nada durante el alta, y todo el mundo
   * acababa siendo entrenador.
   */
  claimByEmail(email: string, profileId: string): Promise<Student[]>
  create(data: NewStudent): Promise<Student>
  update(studentId: string, data: NewStudent): Promise<void>
  /**
   * Ata la ficha de un alumno a la cuenta con la que acaba de registrarse.
   *
   * Operacion propia y no un `update` con la ficha entera: quien registra solo
   * sabe el identificador de la cuenta, y obligarle a leer al alumno para
   * volver a escribirlo completo abre una carrera -entre la lectura y la
   * escritura, el entrenador pudo cambiarle el nivel- y le hace conocer campos
   * que no le incumben.
   */
  linkAccount(studentId: string, profileId: string): Promise<void>
  /**
   * Cambia lo que un alumno dice de sí mismo: su nombre y su foto.
   *
   * OPERACIÓN APARTE Y NO `update`, y la diferencia es de propiedad. La ficha es
   * la libreta del entrenador —nivel, objetivos, grasa corporal son SU
   * valoración— y el alumno no debería poder reescribirla desde sus ajustes. Su
   * nombre y su cara sí son suyos.
   *
   * Con `update` bastaría pasar el resto de campos sin tocar, y ahí está la
   * trampa: quien llama tendría que leer la ficha entera antes de escribir, y
   * entre la lectura y la escritura cabe que el entrenador le cambie el nivel.
   */
  updateProfile(studentId: string, data: StudentProfile): Promise<void>

  /**
   * Acepta o rechaza una solicitud de entrada.
   *
   * Separado de `update` por lo mismo: aprobar a alguien es una decisión del
   * entrenador sobre la pertenencia, no una edición de su ficha, y quien aprueba
   * no debería poder cambiarle la edad de paso.
   */
  updateMembership(studentId: string, status: MembershipStatus): Promise<void>

  /**
   * Reclama la pertenencia de una persona a un crew EN EL QUE AÚN NO ESTÁ.
   *
   * Es la única escritura que nombra el crew explícitamente, y tiene que serlo:
   * cuando alguien escanea un QR, el crew activo es otro —o ninguno—, así que el
   * ámbito no puede decidirlo. Que sea la excepción declarada es mejor que
   * cambiar el ámbito a mitad de la operación para colar la escritura.
   *
   * BUSCA ANTES DE CREAR. Si el entrenador ya había hecho la ficha con este
   * correo, se reclama ESA —con sus datos, su historial y sus sesiones— en vez
   * de abrir otra: dos fichas de la misma persona en el mismo crew serían un
   * alumno duplicado el primer día. Por eso es una sola operación y no un
   * «busca, y si no crea» repartido por un hook.
   *
   * TODO: con backend esto es una función del servidor que además valida el
   * token dentro de la misma transacción. Aquí, entre leer el crew y escribir la
   * ficha cabe una rotación del token.
   */
  claimMembership(input: ClaimMembershipInput): Promise<Student>

  remove(studentId: string): Promise<void>
  onChange(listener: () => void): () => void
}

/** Lo que un alumno dice de sí mismo, y puede cambiar. */
export interface StudentProfile {
  firstName: string
  lastName: string
  photoUrl?: string
}

export interface ClaimMembershipInput {
  crewId: string
  profileId: string
  email: string
  /** `pending` si el crew pide aprobación; `active` si es abierto. */
  status: Extract<MembershipStatus, 'pending' | 'active'>
}

/**
 * Los datos de una ficha nueva.
 *
 * `crewId` NO está: lo pone el adaptador desde el crew activo. Si estuviera aquí
 * habría que pasarlo desde el formulario, y entonces el formulario tendría que
 * saber de multi-tenencia —y podría equivocarse de crew—.
 */
export type NewStudent = Omit<Student, 'id' | 'crewId'>
