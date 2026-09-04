/**
 * De qué crew se está trabajando ahora mismo.
 *
 * EL ÁMBITO VIVE EN EL ADAPTADOR, NO EN LA FIRMA DE CADA MÉTODO. La alternativa
 * era añadir `crewId` a `findAll`, a `create`, a `findByDate` y a los cuarenta
 * sitios que los llaman; el identificador acabaría viajando por los hooks, las
 * páginas y los componentes, y la multi-tenencia —que es un detalle de dónde
 * viven los datos— se habría repartido por toda la aplicación.
 *
 * Con esto, `container.students.findAll()` sigue significando «los alumnos», y
 * lo que cambia es quién los sirve.
 *
 * ES EL SUSTITUTO DE RLS. Con un backend real, el crew activo va en la sesión y
 * es Postgres quien filtra: ningún adaptador tendría que consultarlo, y un fallo
 * de filtrado en el cliente no expondría nada. Aquí no hay servidor, así que el
 * filtro lo hace el adaptador falso —y por eso este puerto existe sólo mientras
 * dure el simulacro—.
 *
 * `null` es un estado legítimo y frecuente: un alumno recién registrado todavía
 * no pertenece a ningún crew. Con el ámbito vacío, las consultas devuelven
 * vacío, que es exactamente lo que debe ver.
 */
export interface CrewScope {
  current(): string | null

  /**
   * La ficha del alumno con la que se está mirando, o `null` si se mira como
   * entrenador.
   *
   * PERTENECER A UN CREW NO ES VER TODO EL CREW. Sin esto, un alumno aceptado
   * abría la agenda y veía las sesiones de todos sus compañeros: con quién
   * entrena el entrenador, a qué hora, dónde. El crew acota de quién son los
   * datos; esto acota cuáles de ellos son asunto de quien mira.
   *
   * Es, otra vez, el sustituto de una política de RLS: `student_id = auth.uid()`
   * para el alumno, y sin restricción para quien entrena.
   */
  asStudent(): string | null
}
