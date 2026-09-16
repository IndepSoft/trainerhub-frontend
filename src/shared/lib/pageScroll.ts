/**
 * El contenedor que desplaza dentro de una página.
 *
 * ERA LA MISMA CADENA COPIADA VEINTIUNA VECES —`flex-1 overflow-auto`— con su
 * comentario al lado. Como constante, el día que el desplazamiento de una
 * página tenga que cambiar se cambia aquí y no en veinte ficheros, que es
 * exactamente lo que la píldora flotante necesitaba.
 *
 * ES UN `<div>` Y NO UN `<main>` a propósito: el landmark `<main>` ya lo pinta
 * `SidebarInset` desde `RootLayout`, y anidar uno dentro de otro es HTML
 * inválido —sólo se admite uno por documento— además de confundir a los
 * lectores de pantalla.
 *
 * EL RELLENO INFERIOR NO ES SUYO, LO HEREDA. `--bottom-bar-space` vale `0px`
 * en la raíz y lo sube `RootLayout` a la altura de la píldora sólo donde la
 * píldora existe: bajo `md` y en las rutas que llevan barras. Así la página no
 * sabe nada de la barra —ni tiene que acordarse de compensarla— y la sesión en
 * vivo, que va a pantalla completa, no se come un hueco que nadie ocupa.
 *
 * `scroll-padding-bottom` acompaña al relleno porque resuelve otra cosa: al
 * recorrer con el teclado, el navegador desplaza lo justo para que el elemento
 * enfocado entre en la vista, y sin esto «la vista» incluye lo que hay debajo
 * de la píldora.
 */
export const PAGE_SCROLL =
  'flex-1 overflow-auto pb-[var(--bottom-bar-space)] scroll-pb-[var(--bottom-bar-space)]'
