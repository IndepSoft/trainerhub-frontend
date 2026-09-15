# -*- coding: utf-8 -*-
"""
Genera los artboards de la exploración «barra inferior como píldora flotante».

Cinco variantes de la misma barra sobre la misma pantalla —el panel, con la
cabecera compacta ya aplicada— para que lo único que cambie entre artboards
sea la barra. Reutiliza el shell de `../cabeceras` y las pantallas de
`../vistas`; sólo se sustituye el `<nav>` de abajo.

Se ejecuta desde esta carpeta: `python build.py`.
"""
import io, sys, os, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
if __name__ == '__main__':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def load(name, relative):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, relative))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


vistas = load('vistas', '../vistas/build.py')
cab = vistas.cab
ic = vistas.ic
BONE, INK, COBALT, EMBER = vistas.BONE, vistas.INK, vistas.COBALT, vistas.EMBER
TINT3, TINT2, INK60, INK45 = vistas.TINT3, vistas.TINT2, vistas.INK60, vistas.INK45
DISPLAY, SANS, SURFACE = vistas.DISPLAY, vistas.SANS, vistas.SURFACE
SHADOW = '0 8px 24px rgba(10,18,36,0.12)'

TABS = cab.TABS  # (icono, etiqueta) × 5, en el orden de la app
PHONE_OPEN = f'<div style="width: 390px; height: 844px; display: flex; flex-direction: column; background: {BONE}; overflow: hidden;">'
PHONE_OPEN_RELATIVE = f'<div style="position: relative; width: 390px; height: 844px; display: flex; flex-direction: column; background: {BONE}; overflow: hidden;">'


def badge(count):
    return (f'<span style="position: absolute; top: -6px; right: -10px; min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box; border-radius: 999px; '
            f'background: {EMBER}; color: #fff; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center;">{count}</span>')


def pill_item(name, label, on, labels, dark, badge_count=''):
    """
    Un destino de la píldora.

    `labels`: 'active' —sólo el activo lleva palabra, dentro de su cápsula—,
    'none' —sólo iconos—, o 'all' —todos con etiqueta, como la barra de hoy—.
    """
    if dark:
        color = '#fff' if on else 'rgba(250,248,245,0.6)'
        capsule = f'background: {COBALT};' if on else ''
    else:
        color = COBALT if on else INK45
        capsule = f'background: {TINT2};' if on else ''
    show_label = labels == 'all' or (labels == 'active' and on)
    label_html = (f'<span style="font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap;">{label}</span>'
                  if show_label else '')
    icon_html = f'<span style="position: relative; display: flex;">{ic(name, 20, "currentColor", 2.5 if on else 2)}{badge(badge_count) if badge_count else ""}</span>'
    if labels == 'all':
        inner = f'<span style="display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 0 2px;">{icon_html}{label_html}</span>'
    else:
        inner = f'<span style="display: flex; align-items: center; justify-content: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 999px; {capsule}">{icon_html}{label_html}</span>'
    grow = 'flex: 1;' if labels == 'all' or not on else 'flex: 1 0 auto;'
    return (f'<li style="{grow} display: flex; justify-content: center;"><a href="#" aria-label="{label}" style="display: flex; align-items: center; justify-content: center; height: 56px; padding: 0 2px; color: {color};">{inner}</a></li>')


def pill(active, labels='active', dark=False, items=None):
    items = items or TABS
    bg = INK if dark else SURFACE
    border = 'rgba(250,248,245,0.12)' if dark else TINT3
    cells = ''.join(pill_item(name, label, label == active, labels, dark, '5' if name == 'home' else '') for name, label in items)
    return (f'<ul style="margin: 0; padding: 0 4px; list-style: none; display: flex; align-items: center; border-radius: 999px; '
            f'border: 1px solid {border}; background: {bg}; box-shadow: {SHADOW};">{cells}</ul>')


def in_flow(pill_html):
    """La píldora dentro del flujo: el contenido termina encima; cuesta 76 px."""
    return f'<nav aria-label="Navegación principal" style="flex-shrink: 0; padding: 8px 12px 12px; background: {BONE};">{pill_html}</nav>'


def floating(pill_html):
    """La píldora sobre el contenido: cuesta 0 px de flujo y 84 px de relleno al final de cada lista."""
    return (f'<div aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 120px; pointer-events: none; '
            f'background: linear-gradient(to top, {BONE} 35%, rgba(250,248,245,0));"></div>'
            f'<nav aria-label="Navegación principal" style="position: absolute; left: 12px; right: 12px; bottom: 12px;">{pill_html}</nav>')


def fab():
    return (f'<a href="#" aria-label="Añadir alumno" style="width: 56px; height: 56px; border-radius: 999px; background: {COBALT}; color: #fff; '
            f'display: flex; align-items: center; justify-content: center; box-shadow: {SHADOW}; flex-shrink: 0;">{ic("plus", 24, "#fff", 2.5)}</a>')


def swap_bar(screen_html, bar_html, relative=False):
    """Sustituye la barra pegada del artboard original por la variante. Es lo ÚNICO que cambia."""
    original_bar = cab.tabbar(ACTIVE_OF[screen_html])
    assert original_bar in screen_html, 'la barra original no está donde se esperaba'
    html = screen_html.replace(original_bar, bar_html)
    if relative:
        assert PHONE_OPEN in html
        html = html.replace(PHONE_OPEN, PHONE_OPEN_RELATIVE)
    return html


DASHBOARD = vistas.dashboard()
ESTUDIANTES = vistas.estudiantes()
ACTIVE_OF = {DASHBOARD: 'Dashboard', ESTUDIANTES: 'Estudiantes'}


# ============================================================ variantes

def actual():
    """A · La barra de hoy, para comparar."""
    return DASHBOARD


def pildora_en_flujo():
    """B · Píldora en el flujo, iconos, etiqueta sólo en el activo."""
    return swap_bar(DASHBOARD, in_flow(pill('Dashboard')))


def pildora_flotante():
    """C · La misma píldora, flotando sobre el contenido con un degradado."""
    return swap_bar(DASHBOARD, floating(pill('Dashboard')), relative=True)


def pildora_con_accion():
    """D · Píldora de iconos + la acción primaria de la pantalla como botón redondo al lado."""
    header_action = cab.primary_pill('plus', 'Alumno')
    assert header_action in ESTUDIANTES
    without_header_action = ESTUDIANTES.replace(header_action, '')
    bar = (f'<nav aria-label="Navegación principal" style="position: absolute; left: 12px; right: 12px; bottom: 12px; display: flex; align-items: center; gap: 10px;">'
           f'<div style="flex: 1; min-width: 0;">{pill("Estudiantes", labels="none")}</div>{fab()}</nav>')
    scrim = (f'<div aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 120px; pointer-events: none; '
             f'background: linear-gradient(to top, {BONE} 35%, rgba(250,248,245,0));"></div>')
    original_bar = cab.tabbar('Estudiantes')
    html = without_header_action.replace(original_bar, scrim + bar).replace(PHONE_OPEN, PHONE_OPEN_RELATIVE)
    return html


def pildora_tinta():
    """E · Píldora en tinta: la barra como pieza de marca, no como cromo."""
    return swap_bar(DASHBOARD, floating(pill('Dashboard', dark=True)), relative=True)


def anatomia():
    """Medidas de la píldora B/C para quien la implemente, y lo que cuesta cada variante."""
    def spec(term, value):
        return f'<li style="display: flex; justify-content: space-between; gap: 12px; min-height: 36px; align-items: center; border-bottom: 1px solid {TINT3}; font-size: 14px;"><span style="color: {INK60};">{term}</span><span style="font-weight: 600; text-align: right;">{value}</span></li>'
    body = f"""
    <div style="width: 390px; box-sizing: border-box; padding: 24px 20px 32px; background: {BONE}; display: flex; flex-direction: column; gap: 22px;">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        {cab.eyebrow('Para quien la implemente')}
        {cab.title('La píldora, medida')}
      </div>
      <div style="padding: 16px 12px; border: 1px dashed {TINT3};">{pill('Estudiantes')}</div>
      <ul style="margin: 0; padding: 0; list-style: none;">
        {spec('Alto de la barra', '56 px (objetivo táctil 44)')}
        {spec('Margen lateral y bajo', '12 px + safe-area')}
        {spec('Radio', '999 px · `rounded-action`')}
        {spec('Fondo · borde', '`surface` · `cobalt-tint-3`')}
        {spec('Sombra', '0 8 24 · tinta al 12 %')}
        {spec('Cápsula del activo', '36 px · `cobalt-tint-2` · icono + palabra')}
        {spec('Icono', '20 px · trazo 2 / 2,5 activo')}
        {spec('Etiqueta', '10 px · 600 · versalitas · sólo en el activo')}
        {spec('Nombre accesible', '`aria-label` en los cinco, siempre')}
        {spec('Insignia', 'Ember 16 px sobre el icono del panel')}
      </ul>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        {cab.eyebrow('Lo que cuesta cada una')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {spec('A · pegada (hoy)', '56 px · 1 archivo · etiquetas siempre')}
          {spec('B · en el flujo', '76 px · 1 archivo · etiqueta sólo activo')}
          {spec('C · flotante', '0 px de flujo, 84 de relleno · 19 páginas')}
          {spec('D · con acción', 'como C + quitar la primaria de 9 cabeceras')}
          {spec('E · en tinta', 'como C · contraste 3,5:1 en el activo')}
        </ul>
      </div>
    </div>"""
    return cab.HEAD + body + cab.FOOT


ARTBOARDS = {
    'Main.dc.html': pildora_en_flujo,
    'Actual.dc.html': actual,
    'Flotante.dc.html': pildora_flotante,
    'ConAccion.dc.html': pildora_con_accion,
    'EnTinta.dc.html': pildora_tinta,
    'Anatomia.dc.html': anatomia,
}

if __name__ == '__main__':
    for name, build in ARTBOARDS.items():
        with io.open(os.path.join(HERE, name), 'w', encoding='utf-8', newline='\n') as handle:
            handle.write(build())
        print('escrito', name)
