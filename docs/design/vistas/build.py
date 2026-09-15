# -*- coding: utf-8 -*-
"""
Genera los artboards de la propuesta «cada vista, cómoda y entendible».

Reutiliza el shell y los tokens de `../cabeceras/build.py` —navbar de 64 px,
barra inferior, cabecera compacta, iconos— para que la propuesta parta de lo
que ya está aplicado y sólo cambie lo que se propone: secciones internas con
botones donde una pantalla junta demasiado, filas en vez de tarjetas donde
la lista es para buscar, y lo excepcional plegado o detrás de un botón.

Se ejecuta desde esta carpeta: `python build.py`.
"""
import io, sys, os, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
if __name__ == '__main__':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

spec = importlib.util.spec_from_file_location('cabeceras', os.path.join(HERE, '..', 'cabeceras', 'build.py'))
cab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cab)

BONE, INK, COBALT, EMBER = cab.BONE, cab.INK, cab.COBALT, cab.EMBER
TINT3, TINT2, TINT1 = cab.TINT3, cab.TINT2, cab.TINT1
INK60, INK45, INK35 = cab.INK60, cab.INK45, cab.INK35
DISPLAY, SANS = cab.DISPLAY, cab.SANS
MUTED = '#F1F5F9'          # --muted: la pista de las pestañas
SUCCESS = '#1B6E3C'
WARNING = '#B05A00'
DANGER = '#D93025'
SURFACE = '#FFFFFF'

# ---------------------------------------------------------------- iconos
EXTRA_ICONS = {
    'check': '<path d="M20 6 9 17l-5-5"></path>',
    'x': '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
    'lock': '<rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
    'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.03 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.32-2.2.9-3.1"></path>',
    'clock': '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>',
    'pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
    'pencil': '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path>',
    'chevron-up': '<path d="m18 15-6-6-6 6"></path>',
    'qr': '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><path d="M14 14h3v3"></path><path d="M21 14v7h-7"></path>',
    'copy': '<rect x="8" y="8" width="14" height="14" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>',
    'sun': '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>',
    'monitor': '<rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8"></path><path d="M12 17v4"></path>',
    'globe': '<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>',
    'volume': '<path d="M11 5 6 9H2v6h4l5 4z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path>',
    'logout': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path>',
    'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
    'trophy': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>',
    'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
    'card': '<rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20"></path>',
    'route': '<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle>',
    'award': '<circle cx="12" cy="8" r="6"></circle><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"></path>',
    'weight': '<path d="M12 3a4 4 0 0 1 4 4 4 4 0 0 1-1 2.6h2.2a2 2 0 0 1 2 1.6l1.7 8.5A2 2 0 0 1 19 22H5a2 2 0 0 1-2-2.3l1.7-8.5a2 2 0 0 1 2-1.6H9A4 4 0 0 1 8 7a4 4 0 0 1 4-4Z"></path>',
    'list': '<path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path>',
    'grip': '<circle cx="9" cy="6" r="1"></circle><circle cx="15" cy="6" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="18" r="1"></circle><circle cx="15" cy="18" r="1"></circle>',
    'link': '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5"></path>',
    'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>',
    'inbox': '<path d="M22 12h-6l-2 3h-4l-2-3H2"></path><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>',
}


ORIGINAL_ICON = cab.icon


def ic(name, size=20, stroke='currentColor', width=2):
    if name in EXTRA_ICONS:
        return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{stroke}" '
                f'stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0;">{EXTRA_ICONS[name]}</svg>')
    return ORIGINAL_ICON(name, size, stroke, width)


# Los ayudantes de cabecera del otro generador buscan `icon` en su módulo al
# llamarse: con esto encuentran también los iconos nuevos.
cab.icon = ic


# ------------------------------------------------------------ primitivas
def label(text, trailing='', color=INK60):
    tr = f'<span style="font-size: 13px; font-weight: 600; color: {COBALT};">{trailing}</span>' if trailing else ''
    return (f'<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 0 0 8px; border-bottom: 1px solid {TINT3};">'
            f'<span style="font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {color};">{text}</span>{tr}</div>')


def segmented(items, active):
    """Las pestañas del sistema (`TabsList`): pista `--muted`, la activa en blanco. Fijas bajo la cabecera."""
    cells = []
    for name in items:
        on = name == active
        style = (f'background: {SURFACE}; box-shadow: 0 1px 2px rgba(10,18,36,0.08); color: {INK};' if on
                 else f'background: transparent; color: {INK60};')
        cells.append(f'<button type="button" style="flex: 1; min-height: 40px; padding: 0 8px; border: 0; border-radius: 4px; font-family: {SANS}; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; {style}">{name}</button>')
    return (f'<div style="flex-shrink: 0; padding: 8px 20px 12px; background: {BONE};">'
            f'<div style="display: flex; gap: 2px; padding: 3px; border-radius: 6px; background: {MUTED};">{"".join(cells)}</div></div>')


def pill(text, color=COBALT, filled=False):
    bg = color if filled else 'transparent'
    fg = '#fff' if filled else color
    return (f'<span style="display: inline-flex; align-items: center; height: 22px; padding: 0 9px; border: 1px solid {color}; border-radius: 999px; '
            f'background: {bg}; color: {fg}; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap;">{text}</span>')


def chip(text, on=False):
    style = f'background: {COBALT}; color: #fff; border-color: {COBALT};' if on else f'background: {SURFACE}; color: {INK}; border-color: {TINT3};'
    return f'<span style="display: inline-flex; align-items: center; height: 32px; padding: 0 12px; border: 1px solid; border-radius: 999px; font-size: 13px; font-weight: 500; white-space: nowrap; {style}">{text}</span>'


def button(text, kind='primary', icon_name=None, full=False, small=False):
    height = 40 if small else 44
    width = 'width: 100%;' if full else ''
    if kind == 'primary':
        style = f'background: {COBALT}; color: #fff; border: 0;'
    elif kind == 'danger':
        style = f'background: transparent; color: {DANGER}; border: 1px solid {DANGER};'
    else:
        style = f'background: {SURFACE}; color: {INK}; border: 1px solid {TINT3};'
    icon_html = ic(icon_name, 18, 'currentColor', 2.25) if icon_name else ''
    return (f'<button type="button" style="{width} height: {height}px; padding: 0 16px; border-radius: 999px; font-family: {SANS}; font-size: 14px; font-weight: 600; '
            f'display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; white-space: nowrap; {style}">{icon_html}{text}</button>')


def avatar(initials, size=40, tone='tint'):
    bg, fg = (TINT2, COBALT) if tone == 'tint' else (COBALT, '#fff')
    return (f'<span style="width: {size}px; height: {size}px; border-radius: 999px; background: {bg}; color: {fg}; font-family: {DISPLAY}; font-weight: 700; '
            f'font-size: {max(12, size // 3)}px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">{initials}</span>')


def row(primary, secondary='', trailing='', leading='', min_height=64, chevron=True):
    """Fila de lista para ESCANEAR: una línea principal, una de apoyo y toda la fila es el enlace."""
    chev = f'<span style="color: {INK35}; display: flex;">{ic("chevron-right", 20)}</span>' if chevron else ''
    sec = f'<span style="font-size: 13px; color: {INK60}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{secondary}</span>' if secondary else ''
    return f"""
        <li style="display: flex; align-items: center; gap: 12px; min-height: {min_height}px; padding: 8px 0; border-bottom: 1px solid {TINT3};">
          {leading}
          <span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 15px; font-weight: 600; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{primary}</span>
            {sec}
          </span>
          {trailing}
          {chev}
        </li>"""


def strip(cells, columns=2):
    """La franja de cifras de `MetricStrip`: dos columnas, reglas de 1 px, cifra en Condensed."""
    out = []
    for i, (lab, value, unit) in enumerate(cells):
        unit_html = f'<span style="font-family: {SANS}; font-size: 12px; font-weight: 500; color: {INK45};"> {unit}</span>' if unit else ''
        out.append(f"""
          <div style="padding: 10px 14px; background: {BONE};">
            <dt style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">{lab}</dt>
            <dd style="margin: 4px 0 0; font-family: {DISPLAY}; font-size: 26px; font-weight: 800; line-height: 1;">{value}{unit_html}</dd>
          </div>""")
    return (f'<dl style="margin: 0; display: grid; grid-template-columns: repeat({columns}, minmax(0, 1fr)); gap: 1px; background: {TINT3}; border-top: 1px solid {TINT3}; border-bottom: 1px solid {TINT3};">'
            f'{"".join(out)}</dl>')


def accordion(title, meta, open_, body='', trailing_pill=''):
    """Bloque plegado: una fila de 56 px con lo que hay dentro resumido; abierto sólo el que se mira."""
    arrow = ic('chevron-up' if open_ else 'chevron-down', 20, INK45)
    content = f'<div style="padding: 0 0 12px;">{body}</div>' if open_ else ''
    return f"""
      <div style="border-bottom: 1px solid {TINT3};">
        <button type="button" style="width: 100%; min-height: 56px; padding: 8px 0; border: 0; background: transparent; display: flex; align-items: center; gap: 12px; cursor: pointer; font-family: {SANS}; text-align: left; color: {INK};">
          <span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 15px; font-weight: 600;">{title}</span>
            <span style="font-size: 12px; color: {INK60};">{meta}</span>
          </span>
          {trailing_pill}
          {arrow}
        </button>
        {content}
      </div>"""


def field(lab, value='', placeholder='', kind='input', width='100%'):
    text = value or placeholder
    color = INK if value else INK35
    trailing = ic('chevron-down', 16, INK45) if kind == 'select' else ''
    return f"""
      <label style="display: flex; flex-direction: column; gap: 6px; width: {width}; min-width: 0;">
        <span style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">{lab}</span>
        <span style="display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 44px; padding: 0 12px; border: 1px solid {TINT3}; border-radius: 6px; background: {SURFACE}; font-size: 15px; color: {color}; white-space: nowrap; overflow: hidden;">{text}{trailing}</span>
      </label>"""


def toggle(on=True):
    knob_x = 22 if on else 2
    bg = COBALT if on else TINT3
    return (f'<span style="position: relative; width: 44px; height: 24px; border-radius: 999px; background: {bg}; flex-shrink: 0; display: inline-block;">'
            f'<span style="position: absolute; top: 2px; left: {knob_x}px; width: 20px; height: 20px; border-radius: 999px; background: #fff;"></span></span>')


def progress(value, max_, color=COBALT):
    pct = int(round(100 * value / max_))
    return (f'<span style="display: block; height: 6px; border-radius: 999px; background: {TINT2}; overflow: hidden;">'
            f'<span style="display: block; height: 100%; width: {pct}%; background: {color};"></span></span>')


def back_link(text):
    return (f'<a href="#" style="display: inline-flex; align-items: center; gap: 6px; height: 44px; margin: 0 0 0 -8px; padding: 0 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK45};">'
            f'{ic("chevron-left", 16)}{text}</a>')


STUDENT_TABS = [('calendar', 'Calendario'), ('award', 'Progreso')]


def screen(active_tab, body, badge='2', height=844, tabs=None):
    """El teléfono entero: barra superior, cuerpo y barra de pestañas. Recorta a la altura del marco: lo que se ve sin desplazar ES la propuesta."""
    previous = cab.TABS
    if tabs is not None:
        cab.TABS = tabs
    bar = cab.tabbar(active_tab)
    cab.TABS = previous
    html = (cab.HEAD + f'<div style="width: 390px; height: {height}px; display: flex; flex-direction: column; background: {BONE}; overflow: hidden;">'
            + cab.navbar(badge) + '<main style="flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;">' + body + '</main>'
            + bar + '</div>' + cab.FOOT)
    return as_student(html) if tabs is STUDENT_TABS else html


def as_student(html):
    """La barra superior es la del entrenador; en las pantallas del alumno cambian su papel y su avatar."""
    return html.replace('Crew · Administrador', 'Crew · Alumno').replace('center;">MS</span>', 'center;">JP</span>')


def scroll(inner, gap=20):
    return f'<div style="flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: {gap}px; padding: 0 20px 20px;">{inner}</div>'


def session_row(time, who, what, status, color, done=False):
    op = 'opacity: 0.55;' if done else ''
    return f"""
        <li style="display: grid; grid-template-columns: 52px minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 64px; padding: 8px 0; border-bottom: 1px solid {TINT3}; {op}">
          <span style="font-family: {DISPLAY}; font-size: 18px; font-weight: 800; color: {INK};">{time}</span>
          <span style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
            <span style="font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{who}</span>
            <span style="font-size: 13px; color: {INK60}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{what}</span>
          </span>
          {pill(status, color)}
        </li>"""


# ============================================================ pantallas

def dashboard():
    body = cab.header('Tu actividad', 'Dashboard') + f"""
    <dl style="margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: {TINT3}; border-top: 1px solid {TINT3}; border-bottom: 1px solid {TINT3};">
      <div style="padding: 14px 16px; background: {BONE};"><dt style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Estudiantes {ic('users', 16, COBALT)}</dt><dd style="margin: 8px 0 0; font-family: {DISPLAY}; font-size: 34px; font-weight: 800; line-height: 1;">4</dd></div>
      <div style="padding: 14px 16px; background: {BONE};"><dt style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Sesiones esta semana {ic('calendar', 16, COBALT)}</dt><dd style="margin: 8px 0 0; font-family: {DISPLAY}; font-size: 34px; font-weight: 800; line-height: 1;">6</dd></div>
      <div style="grid-column: span 2; padding: 10px 16px; background: {BONE}; display: flex; align-items: center; justify-content: space-between;"><dt style="display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">{ic('bicep', 16, COBALT)}Rutinas creadas</dt><dd style="margin: 0; font-family: {DISPLAY}; font-size: 26px; font-weight: 800; line-height: 1;">3</dd></div>
    </dl>
    {scroll(f'''
      <section style="padding-top: 20px; display: flex; flex-direction: column; gap: 4px;">
        {label('Pendientes', '5')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {row('1 cuota vencida', 'Juan Pérez · venció hace 5 días', leading=f'<span style="color: {EMBER}; display: flex;">{ic("alert", 20)}</span>', min_height=56)}
          {row('4 alumnos sin cuenta', 'Envíales la invitación desde su ficha', leading=f'<span style="color: {EMBER}; display: flex;">{ic("userplus", 20)}</span>', min_height=56)}
        </ul>
      </section>

      <!-- Próximas sesiones y actividad reciente son dos listas que se miran,
           no se atienden; juntas doblaban la página. Una a la vista, la otra a un toque. -->
      <section style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; gap: 2px; padding: 3px; border-radius: 6px; background: {MUTED};">
          <button type="button" style="flex: 1; min-height: 40px; border: 0; border-radius: 4px; background: {SURFACE}; box-shadow: 0 1px 2px rgba(10,18,36,0.08); font-family: {SANS}; font-size: 13px; font-weight: 600; color: {INK};">Próximas sesiones · 3</button>
          <button type="button" style="flex: 1; min-height: 40px; border: 0; border-radius: 4px; background: transparent; font-family: {SANS}; font-size: 13px; font-weight: 600; color: {INK60};">Actividad reciente</button>
        </div>
        <ul style="margin: 8px 0 0; padding: 0; list-style: none;">
          {session_row('09:00', 'María Gómez', 'Entrenamiento personal · Gimnasio', 'Confirmada', SUCCESS)}
          {session_row('10:30', 'Carlos López', 'Evaluación inicial · Sala de evaluación', 'Pendiente', WARNING)}
          {session_row('18:00', 'Clase grupal', 'Entrenamiento grupal · Sala grupal', 'Confirmada', SUCCESS)}
        </ul>
        <a href="#" style="display: inline-flex; align-items: center; gap: 4px; min-height: 44px; font-size: 13px; font-weight: 600;">Ver la agenda {ic('arrow-up-right', 16)}</a>
      </section>''', gap=24)}"""
    return screen('Dashboard', body, badge='5')


def estudiantes():
    def student(initials, name, meta, status, color):
        return row(name, meta, trailing=pill(status, color), leading=avatar(initials), min_height=68)
    body = cab.header('Tu equipo · 4', 'Estudiantes', cab.primary_pill('plus', 'Alumno')) + cab.search_and_filter('Buscar estudiante…', 'Nivel') + f"""
    {scroll(f'''
      <!-- Filas y no tarjetas: esta lista es para ENCONTRAR a alguien, no para
           leer su ficha. Antes cada alumno ocupaba 320 px y cabía uno y medio;
           ahora caben los cuatro y sobra sitio. Lo que la tarjeta enseñaba
           —edad, grasa, nivel, objetivos, progreso— está a un toque, en la ficha. -->
      <ul style="margin: 12px 0 0; padding: 0; list-style: none;">
        {student('JP', 'Juan Pérez', 'Intermedio · 10 sesiones · cuota vencida', 'Vencida', DANGER)}
        {student('MG', 'María Gómez', 'Avanzado · 3 sesiones', 'Sin cuenta', EMBER)}
        {student('CL', 'Carlos López', 'Principiante · 1 sesión', 'Sin cuenta', EMBER)}
        {student('AT', 'Ana Torres', 'Intermedio · sin sesiones', 'Sin cuenta', EMBER)}
      </ul>
      <p style="margin: 0; font-size: 13px; color: {INK45};">Toca un alumno para ver su ficha, agendarle o asignarle un plan.</p>''', gap=12)}"""
    return screen('Estudiantes', body, badge='5')


def ficha_hero(section):
    actions = cab.primary_pill('calendar', 'Agendar')
    return f"""
    <header style="flex-shrink: 0; padding: 4px 20px 0; display: flex; flex-direction: column; gap: 6px;">
      {back_link('Estudiantes')}
      <div style="display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: 'avatar eyebrow actions' 'avatar title title'; column-gap: 12px; row-gap: 4px; align-items: center;">
        <span style="grid-area: avatar;">{avatar('JP', 56)}</span>
        <p style="grid-area: eyebrow; margin: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {INK45}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">jperez@gmail.com</p>
        <div style="grid-area: actions; display: flex; justify-content: flex-end;">{actions}</div>
        <h1 style="grid-area: title; margin: 0; font-family: {DISPLAY}; font-size: 30px; font-weight: 800; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase;">Juan Pérez</h1>
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap; padding: 6px 0 2px;">{pill('Intermedio')}{pill('28 años', INK60)}{pill('Cuota vencida', DANGER)}</div>
    </header>
    {segmented(['Resumen', 'Progreso', 'Sesiones', 'Cuota'], section)}"""


def ficha_resumen():
    body = ficha_hero('Resumen') + scroll(f'''
      <!-- Lo que hoy es una página de 4.332 px, en cuatro secciones. «Resumen»
           responde lo primero que se pregunta al abrir una ficha: cómo está,
           qué tiene asignado y qué le toca. -->
      {strip([('Edad', '28', 'años'), ('Grasa corporal', '22', '%'), ('Sesiones', '10', 'hechas'), ('Racha', '7', 'días')])}

      <section style="display: flex; flex-direction: column; gap: 10px;">
        {label('Objetivos')}
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">{chip('Perder peso')}{chip('Ganar músculo')}</div>
      </section>

      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Asignado', 'Asignar')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {row('Base de fuerza · 4 semanas', 'Semana 2 de 4 · empezó el 8 de septiembre', leading=f'<span style="color: {COBALT}; display: flex;">{ic("route", 20)}</span>')}
        </ul>
      </section>

      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Le toca')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {row('Cuota vencida hace 5 días', 'Mensual · registrar el pago o avisar', trailing=pill('Vencida', DANGER), leading=f'<span style="color: {DANGER}; display: flex;">{ic("card", 20)}</span>')}
          {row('Siguiente hito: Consolidación', 'Espera tu validación', trailing=pill('Validar'), leading=f'<span style="color: {COBALT}; display: flex;">{ic("award", 20)}</span>')}
          {row('Próxima sesión · mañana 18:00', 'Entrenamiento personal · Gimnasio', leading=f'<span style="color: {COBALT}; display: flex;">{ic("clock", 20)}</span>')}
        </ul>
      </section>''', gap=18)
    return screen('Estudiantes', body, badge='5')


def ficha_progreso():
    def load(name, kg, delta):
        return f"""
          <li style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3};">
            <span style="font-size: 15px; font-weight: 600;">{name}</span>
            <span style="display: flex; align-items: baseline; gap: 8px;"><span style="font-family: {DISPLAY}; font-size: 22px; font-weight: 800;">{kg}<span style="font-family: {SANS}; font-size: 12px; font-weight: 500; color: {INK45};"> kg</span></span><span style="font-size: 12px; font-weight: 600; color: {SUCCESS};">{delta}</span></span>
          </li>"""
    body = ficha_hero('Progreso') + scroll(f'''
      <section style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between;">
          <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Nivel 3</span>
          <span style="font-size: 12px; color: {INK45};">76 / 200 XP</span>
        </div>
        {progress(76, 200)}
      </section>

      <!-- La ruta: nodo actual y lo que falta para el siguiente. Los dos
           formularios que hoy van abiertos aquí —validar el hito, pausar la
           racha— pasan a botones que abren una hoja: se usan una vez al mes. -->
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Ruta Hybrid', 'Cambiar')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {row('Iniciación', 'Completado', leading=f'<span style="width: 28px; height: 28px; border-radius: 999px; background: {COBALT}; color: #fff; display: flex; align-items: center; justify-content: center;">{ic("check", 16, "#fff", 2.5)}</span>', chevron=False, min_height=52)}
          <li style="display: flex; flex-direction: column; gap: 10px; padding: 12px 0; border-bottom: 1px solid {TINT3};">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="width: 28px; height: 28px; border-radius: 999px; background: {EMBER}; display: flex; align-items: center; justify-content: center;"><span style="width: 10px; height: 10px; border-radius: 999px; background: #fff;"></span></span>
              <span style="flex: 1; font-size: 15px; font-weight: 600;">Consolidación <span style="font-weight: 500; color: {INK60};">· nodo actual</span></span>
              {button('Validar hito', 'secondary', 'award', small=True)}
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding-left: 40px;">
              <span style="display: flex; flex-direction: column; gap: 6px;"><span style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK60};"><span>Puntos</span><span>326 / 300</span></span>{progress(300, 300, SUCCESS)}</span>
              <span style="display: flex; flex-direction: column; gap: 6px;"><span style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK60};"><span>Semanas</span><span>0 / 4</span></span>{progress(0, 4)}</span>
            </div>
          </li>
          {row('Dominio', 'Más puntos, seis semanas cumpliendo y una evaluación', leading=f'<span style="width: 28px; height: 28px; border-radius: 999px; border: 1px solid {TINT3}; color: {INK35}; display: flex; align-items: center; justify-content: center;">{ic("lock", 14)}</span>', chevron=False, min_height=52)}
        </ul>
      </section>

      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Racha · 7 días', 'Pausar')}
        <p style="margin: 6px 0 0; font-size: 13px; color: {INK60};">Lesión o viaje: los días sin entrenar no rompen la racha mientras dure la pausa.</p>
      </section>

      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Cargas', 'Ver gráfica')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {load('Sentadilla con barra', '77,5', '+2,5')}
          {load('Press de banca con barra', '57,5', '+2,5')}
          {load('Remo con barra', '62,5', '+2,5')}
        </ul>
      </section>''', gap=18)
    return screen('Estudiantes', body, badge='5')


def entrenamientos():
    def routine(title, meta, preview, chips):
        return f"""
        <article style="border: 1px solid {TINT3}; background: {SURFACE}; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <span style="font-family: {DISPLAY}; font-size: 22px; font-weight: 800; line-height: 1; text-transform: uppercase; letter-spacing: -0.01em;">{title}</span>
            <span style="color: {INK35}; display: flex; margin: -6px -8px 0 0; width: 44px; height: 32px; align-items: center; justify-content: center;">{ic('more', 18)}</span>
          </div>
          <span style="font-size: 13px; color: {INK60};">{meta}</span>
          <span style="font-size: 13px; color: {INK}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{preview}</span>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; padding-top: 2px;">{chips}</div>
        </article>"""
    body = cab.header('Lo que asignas', 'Entrenamientos', cab.icon_button('library', 'Catálogo') + cab.primary_pill('plus', 'Rutina')) + f"""
    {segmented(['Rutinas · 3', 'Planes · 1'], 'Rutinas · 3')}
    {cab.search_and_filter('Buscar rutinas…', 'Nivel')}
    {scroll(f'''
      <!-- La tarjeta de rutina conserva lo que la distingue —qué ejercicios
           lleva— pero en una línea, no en una lista de cuatro filas con series y
           RIR: eso es de la ficha. De una rutina y media por pantalla a tres. -->
      <div style="display: flex; flex-direction: column; gap: 12px; padding-top: 12px;">
        {routine('Full body · Principiante', '4 ejercicios · 25 min · 12 series', 'Sentadilla · Press de banca · Remo · Plancha', pill('Principiante'))}
        {routine('Empuje · Intermedio', '4 ejercicios · 24 min · 12 series', 'Press de banca · Press militar · Press inclinado · Fondos', pill('Intermedio') + pill('Superserie', EMBER))}
        {routine('Torso · Empuje y tracción', '5 ejercicios · 32 min · 16 series', 'Press de banca · Jalón al pecho · Curl de bíceps · …', pill('Intermedio') + pill('Superserie', EMBER))}
      </div>''', gap=12)}"""
    return screen('Entrenamientos', body, badge='5')


def rutina():
    def exercise(order, name, dose, rest):
        return f"""
        <li style="display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 52px; border-bottom: 1px solid {TINT3};">
          <span style="font-family: {DISPLAY}; font-size: 16px; font-weight: 800; color: {COBALT};">{order}</span>
          <span style="display: flex; flex-direction: column; gap: 2px; min-width: 0;"><span style="font-size: 15px; font-weight: 600;">{name}</span><span style="font-size: 12px; color: {INK60};">descanso {rest}</span></span>
          <span style="font-family: {DISPLAY}; font-size: 16px; font-weight: 700; white-space: nowrap;">{dose}</span>
        </li>"""
    body = f"""
    <header style="flex-shrink: 0; padding: 4px 20px 12px; display: flex; flex-direction: column; gap: 6px;">
      {back_link('Rutinas')}
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px;">
        {cab.eyebrow('Rutina')}
        <div style="display: flex; align-items: center; gap: 8px;">{cab.icon_button('trash', 'Eliminar')}{cab.icon_button('pencil', 'Editar')}{cab.primary_pill('copy', 'Usar')}</div>
      </div>
      {cab.title('Full body · Principiante')}
      <p style="margin: 4px 0 0; font-size: 14px; color: {INK60};">Base de fuerza con los patrones fundamentales.</p>
    </header>
    {strip([('Ejercicios', '4', ''), ('Duración', '25', 'min'), ('Series', '12', 'en total'), ('Nivel', 'Principiante', '')])}
    {scroll(f'''
      <!-- Las cuatro cifras iban apiladas —una fila de 70 px cada una— y los
           bloques debajo del pliegue. En franja caben arriba, y los ejercicios,
           que son la rutina, se ven desde el primer momento. -->
      <section style="padding-top: 16px; display: flex; flex-direction: column; gap: 4px;">
        {label('Bloque 01 · Serie simple', '4 ejercicios')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {exercise('01', 'Sentadilla con barra', '3 × 8-10 · RIR 3', '1:30')}
          {exercise('02', 'Press de banca con barra', '3 × 8-10 · RIR 3', '1:30')}
          {exercise('03', 'Remo con barra', '3 × 10-12 · RIR 3', '1:30')}
          {exercise('04', 'Plancha', '3 × 30 s', '1:00')}
        </ul>
      </section>
      <p style="margin: 0; font-size: 13px; color: {INK45};">Se asigna desde la ficha de cada alumno, o se agenda con «Usar».</p>''', gap=12)}"""
    return screen('Entrenamientos', body, badge='5')


def nueva_rutina():
    def exercise_row(order, name, dose):
        return f"""
        <li style="display: grid; grid-template-columns: 24px minmax(0, 1fr) auto 44px; align-items: center; gap: 8px; min-height: 52px; border-bottom: 1px solid {TINT3};">
          <span style="color: {INK35}; display: flex;">{ic('grip', 18)}</span>
          <span style="font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{name}</span>
          <span style="font-family: {DISPLAY}; font-size: 15px; font-weight: 700; white-space: nowrap;">{dose}</span>
          <span style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: {INK45};">{ic('chevron-down', 18)}</span>
        </li>"""
    body = f"""
    <header style="flex-shrink: 0; padding: 4px 20px 8px; display: flex; flex-direction: column; gap: 6px;">
      {back_link('Rutinas')}
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px;">
        {cab.eyebrow('Lo que asignas')}
        <div style="display: flex; align-items: center; gap: 8px;">{cab.icon_button('x', 'Cancelar')}{cab.primary_pill('check', 'Guardar')}</div>
      </div>
      {cab.title('Nueva rutina')}
    </header>
    <!-- El formulario en dos pasos con selector, no en una página de 2.189 px:
         primero qué es la rutina, después qué lleva. El paso 1 avisa con un
         punto si falta el nombre. -->
    {segmented(['1 · La rutina', '2 · Bloques'], '2 · Bloques')}
    {scroll(f'''
      <div style="display: flex; align-items: baseline; justify-content: space-between; font-size: 12px; color: {INK60};"><span><strong style="color: {INK};">Full body · Principiante</strong> · Principiante</span><span>6 min · 3 series</span></div>

      <section style="border: 1px solid {TINT3}; background: {SURFACE}; padding: 12px 16px 14px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-family: {DISPLAY}; font-size: 20px; font-weight: 800; text-transform: uppercase;"><span style="color: {COBALT};">01</span> Bloque</span>
          <span style="display: flex; gap: 6px;">{chip('Serie simple')}{chip('90 s')}</span>
        </div>
        <ul style="margin: 0; padding: 0; list-style: none;">
          {exercise_row('01', 'Sentadilla con barra', '3 × 8-10')}
          <li style="padding: 12px 0 14px; border-bottom: 1px solid {TINT3}; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: grid; grid-template-columns: 24px minmax(0, 1fr) 44px; align-items: center; gap: 8px;">
              <span style="color: {INK35}; display: flex;">{ic('grip', 18)}</span>
              <span style="font-size: 15px; font-weight: 600;">Press de banca con barra</span>
              <span style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: {INK45};">{ic('chevron-up', 18)}</span>
            </div>
            <!-- Lo que se decide siempre, en una fila; lo que se decide a veces
                 —peso de referencia, descanso propio, tempo, indicaciones—
                 detrás de «Más ajustes». -->
            <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">{field('Series', '3')}{field('Reps', '8-10')}{field('RIR', '2')}</div>
            <button type="button" style="display: flex; align-items: center; gap: 6px; height: 40px; padding: 0; border: 0; background: transparent; font-family: {SANS}; font-size: 13px; font-weight: 600; color: {COBALT};">{ic('chevron-down', 16)} Más ajustes · peso, descanso, tempo, indicaciones</button>
          </li>
          {exercise_row('03', 'Remo con barra', '3 × 10-12')}
        </ul>
        {button('Añadir ejercicio', 'secondary', 'plus', full=True, small=True)}
      </section>

      <div style="display: flex; gap: 8px;">{button('Añadir bloque', 'secondary', 'plus', full=True)}{button('Insertar guardado', 'secondary', 'library', full=True)}</div>''', gap=14)}"""
    return screen('Entrenamientos', body, badge='5')


def plan():
    def day(name, what, mins):
        color = INK if what != 'Descanso' else INK45
        return f'<li style="display: flex; justify-content: space-between; gap: 8px; min-height: 36px; align-items: center; font-size: 14px;"><span style="color: {INK60}; width: 80px;">{name}</span><span style="flex: 1; color: {color};">{what}</span><span style="font-size: 12px; color: {INK45};">{mins}</span></li>'
    week_open = f"""
        <ul style="margin: 0; padding: 0 0 0 4px; list-style: none;">
          {day('Lunes', 'Full body · Principiante', '25 min')}
          {day('Miércoles', 'Full body · Principiante', '25 min')}
          {day('Viernes', 'Full body · Principiante', '25 min')}
          {day('Resto', 'Descanso', '4 días')}
        </ul>"""
    body = f"""
    <header style="flex-shrink: 0; padding: 4px 20px 12px; display: flex; flex-direction: column; gap: 6px;">
      {back_link('Planes')}
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px;">
        {cab.eyebrow('Plan')}
        <div style="display: flex; align-items: center; gap: 8px;">{cab.icon_button('trash', 'Eliminar')}{cab.primary_pill('pencil', 'Editar')}</div>
      </div>
      {cab.title('Base de fuerza · 4 semanas')}
      <p style="margin: 4px 0 0; font-size: 14px; color: {INK60};">Adaptación anatómica y técnica antes de subir cargas.</p>
    </header>
    {strip([('Semanas', '4', '1 de descarga'), ('Sesiones', '11', ''), ('Frecuencia', '3', '/sem'), ('Nivel', 'Principiante', '')])}
    {scroll(f'''
      <section style="padding-top: 14px; display: flex; flex-direction: column; gap: 4px;">
        <ul style="margin: 0; padding: 0; list-style: none;">
          <li style="display: flex; justify-content: space-between; gap: 12px; min-height: 40px; align-items: center; border-bottom: 1px solid {TINT3}; font-size: 14px;"><span style="color: {INK60};">Objetivo</span><span style="font-weight: 600;">Acondicionamiento general</span></li>
          <li style="display: flex; justify-content: space-between; gap: 12px; min-height: 40px; align-items: center; border-bottom: 1px solid {TINT3}; font-size: 14px;"><span style="color: {INK60};">División</span><span style="font-weight: 600;">Full body</span></li>
        </ul>
      </section>

      <!-- Las cuatro semanas eran 28 filas de días seguidas, descansos
           incluidos: 1.700 px para decir «lunes, miércoles y viernes». Cada
           semana es un pliegue con su resumen, abierta la que se mira, y los
           descansos se cuentan en vez de listarse. -->
      <section style="display: flex; flex-direction: column; gap: 0;">
        {label('Microciclos', '4 semanas')}
        {accordion('Semana 01', '3 sesiones · lunes, miércoles y viernes', True, week_open)}
        {accordion('Semana 02', '3 sesiones · lunes, miércoles y viernes', False)}
        {accordion('Semana 03', '3 sesiones · lunes, miércoles y viernes', False)}
        {accordion('Semana 04', '3 sesiones · carga al 60 %', False, trailing_pill=pill('Descarga', EMBER))}
      </section>
      <p style="margin: 0; font-size: 13px; color: {INK45};">Un plan se asigna desde la ficha de cada alumno.</p>''', gap=16)}"""
    return screen('Entrenamientos', body, badge='5')


def agenda():
    def free(text):
        return f'<li style="display: flex; align-items: center; gap: 12px; min-height: 36px; color: {INK35}; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;"><span style="flex: 1; height: 1px; background: {TINT3};"></span>{text}<span style="flex: 1; height: 1px; background: {TINT3};"></span></li>'
    def summary(items):
        cells = ''.join(f'<span style="display: inline-flex; align-items: baseline; gap: 5px; height: 32px; padding: 0 12px; border: 1px solid {TINT3}; border-radius: 999px; background: {SURFACE}; font-size: 13px; color: {INK60};"><span style="font-family: {DISPLAY}; font-size: 18px; font-weight: 800; color: {c};">{n}</span>{l}</span>' for n, l, c in items)
        return f'<div style="display: flex; flex-wrap: wrap; gap: 6px;">{cells}</div>'
    body = f"""
    <header style="flex-shrink: 0; padding: 12px 20px 12px; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px;">
        {cab.eyebrow('Agenda')}
        <div style="display: flex; align-items: center; gap: 8px;"><button type="button" style="height: 44px; padding: 0 16px; border: 1px solid {COBALT}; border-radius: 999px; background: transparent; color: {COBALT}; font-family: {SANS}; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">Hoy</button>{cab.primary_pill('plus', 'Sesión')}</div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        {cab.title('Mar, 15 sept')}
        <div style="display: flex; gap: 4px;">{cab.icon_button('chevron-left', 'Día anterior')}{cab.icon_button('chevron-right', 'Día siguiente')}</div>
      </div>
    </header>
    <!-- El día como LISTA, no como rejilla de horas: de 08:00 a 21:00 son
         catorce franjas de 56 px, once vacías, y las sesiones quedaban repartidas
         en 2.300 px de desplazamiento. Lo vacío se cuenta en una línea. -->
    {segmented(['Lista', 'Horario'], 'Lista')}
    {scroll(f'''
      <ul style="margin: 0; padding: 0; list-style: none;">
        {session_row('09:00', 'María Gómez', 'Entrenamiento personal · 60 min · Gimnasio', 'Confirmada', SUCCESS)}
        {session_row('10:30', 'Carlos López', 'Evaluación inicial · 45 min · Sala de evaluación', 'Pendiente', WARNING)}
        {free('Libre hasta las 18:00')}
        {session_row('18:00', 'Clase grupal', 'Entrenamiento grupal · 45 min · Sala grupal', 'Confirmada', SUCCESS)}
        {session_row('18:00', 'Juan Pérez', 'Entrenamiento personal · 60 min · Gimnasio', 'Completada', COBALT, done=True)}
      </ul>
      <section style="display: flex; flex-direction: column; gap: 8px;">
        {label('Esta semana')}
        {summary([('1', 'pendiente', WARNING), ('3', 'confirmadas', SUCCESS), ('10', 'completadas', COBALT), ('1', 'cancelada', DANGER), ('1', 'no ocurrió', INK45)])}
      </section>''', gap=20)}"""
    return screen('Calendario', body, badge='5')


def equipo_hero(section):
    actions = cab.icon_button('users', 'Equipo técnico') + cab.icon_button('settings', 'Ajustes') + cab.icon_button('userplus', 'Gestionar alumnos')
    return cab.header('Crew · 4 miembros', 'Hierro y Asfalto', actions) + segmented(['Muro', 'Miembros', 'Ranking', 'Invitar'], section)


def equipo_muro():
    def post(who, when, text):
        return f"""
        <article style="border: 1px solid {TINT3}; background: {SURFACE}; padding: 12px 14px 4px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK45};"><span>{who}</span><span style="letter-spacing: 0; text-transform: none; font-weight: 500;">{when}</span></div>
          <p style="margin: 0; font-size: 15px; line-height: 1.45;">{text}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 0 -8px;">
            <button type="button" aria-label="Me gusta" style="width: 44px; height: 44px; border: 0; background: transparent; color: {INK45}; display: flex; align-items: center; justify-content: center;">{ic('heart', 20)}</button>
            <button type="button" aria-label="Borrar" style="width: 44px; height: 44px; border: 0; background: transparent; color: {INK45}; display: flex; align-items: center; justify-content: center;">{ic('trash', 18)}</button>
          </div>
        </article>"""
    body = equipo_hero('Muro') + scroll(f'''
      <!-- Muro, miembros, solicitudes, QR y ranking iban seguidos en 1.920 px,
           y la lista de miembros salía dos veces —como miembros y como ranking—.
           Cuatro secciones: cada una cabe en una pantalla y se elige arriba. -->
      <div style="display: flex; gap: 8px; align-items: flex-end;">
        <textarea placeholder="Cuéntale algo a tu equipo…" rows="2" style="flex: 1; min-height: 64px; padding: 12px 14px; border: 1px solid {TINT3}; border-radius: 6px; background: {SURFACE}; font-family: {SANS}; font-size: 15px; resize: none; outline: none; color: {INK};"></textarea>
        <button type="button" aria-label="Publicar" style="width: 44px; height: 44px; border: 0; border-radius: 999px; background: {COBALT}; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">{ic('megaphone', 20, '#fff', 2.25)}</button>
      </div>
      {post('Marco Salas', 'Hace 5 h', 'El sábado hacemos la salida larga por el cerro. Salimos a las 8:00 del gimnasio, llevad agua para hora y media.')}
      {post('Marco Salas', '13 de septiembre', 'Recordad que esta semana toca descarga: bajad la carga un 40 % y centraos en la técnica. Descansar también es entrenar.')}''', gap=14)
    return screen('Equipo', body, badge='')


def equipo_miembros():
    def member(initials, name, meta, trailing):
        return row(name, meta, trailing=trailing, leading=avatar(initials), min_height=64)
    body = equipo_hero('Miembros') + scroll(f'''
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Solicitudes', '1')}
        <li style="list-style: none; display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 8px 0; border-bottom: 1px solid {TINT3};">
          {avatar('LR')}
          <span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 15px; font-weight: 600;">Lucía Rey</span><span style="font-size: 13px; color: {INK60};">Pidió entrar ayer · lrey@gmail.com</span></span>
          <button type="button" aria-label="Rechazar" style="width: 44px; height: 44px; border: 1px solid {TINT3}; border-radius: 999px; background: transparent; color: {INK}; display: flex; align-items: center; justify-content: center;">{ic('x', 18)}</button>
          <button type="button" aria-label="Aprobar" style="width: 44px; height: 44px; border: 0; border-radius: 999px; background: {COBALT}; color: #fff; display: flex; align-items: center; justify-content: center;">{ic('check', 18, '#fff', 2.5)}</button>
        </li>
      </section>
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Miembros', '4')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {member('JP', 'Juan Pérez', 'Intermedio · con cuenta', pill('Activo', SUCCESS))}
          {member('MG', 'María Gómez', 'Avanzado · sin cuenta', button('Invitar', 'secondary', 'link', small=True))}
          {member('CL', 'Carlos López', 'Principiante · sin cuenta', button('Invitar', 'secondary', 'link', small=True))}
          {member('AT', 'Ana Torres', 'Intermedio · sin cuenta', button('Invitar', 'secondary', 'link', small=True))}
        </ul>
      </section>''', gap=18)
    return screen('Equipo', body, badge='')


def progreso():
    body = cab.header('Tu evolución', 'Progreso') + f"""
    <!-- Lo que un alumno viene a ver: cuánto lleva y qué le falta. Nivel y racha
         fijos arriba; ruta, insignias e historial en secciones. Las 21 insignias
         en cuadrícula, 18 de ellas cerradas, ya no son la pantalla entera. -->
    <div style="flex-shrink: 0; padding: 0 20px 4px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between;"><span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Nivel 3</span><span style="font-size: 12px; color: {INK45};">76 / 200 XP</span></div>
        {progress(76, 200)}
      </div>
      <div style="display: flex; align-items: center; gap: 6px; color: {EMBER};">{ic('flame', 22, EMBER, 2.25)}<span style="font-family: {DISPLAY}; font-size: 30px; font-weight: 800; color: {INK};">7</span><span style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: {INK60};">días</span></div>
    </div>
    {segmented(['Ruta', 'Insignias', 'Historial'], 'Ruta')}
    {scroll(f'''
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Ruta Hybrid', 'Rendimiento mixto')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          <li style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3};"><span style="width: 28px; height: 28px; border-radius: 999px; background: {COBALT}; color: #fff; display: flex; align-items: center; justify-content: center;">{ic('check', 16, '#fff', 2.5)}</span><span style="flex: 1; font-size: 15px; font-weight: 600;">Iniciación</span><span style="font-size: 12px; color: {INK45};">Hecho</span></li>
          <li style="display: flex; flex-direction: column; gap: 10px; padding: 12px 0; border-bottom: 1px solid {TINT3};">
            <div style="display: flex; align-items: center; gap: 12px;"><span style="width: 28px; height: 28px; border-radius: 999px; background: {EMBER}; display: flex; align-items: center; justify-content: center;"><span style="width: 10px; height: 10px; border-radius: 999px; background: #fff;"></span></span><span style="flex: 1; font-size: 15px; font-weight: 600;">Consolidación</span><span style="font-size: 12px; color: {INK45};">Estás aquí</span></div>
            <p style="margin: 0; padding-left: 40px; font-size: 13px; color: {INK60};">Te faltan 4 semanas cumpliendo y el visto bueno de tu entrenador.</p>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding-left: 40px;">
              <span style="display: flex; flex-direction: column; gap: 6px;"><span style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK60};"><span>Puntos</span><span>326 / 300</span></span>{progress(300, 300, SUCCESS)}</span>
              <span style="display: flex; flex-direction: column; gap: 6px;"><span style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK60};"><span>Semanas</span><span>0 / 4</span></span>{progress(0, 4)}</span>
            </div>
          </li>
          <li style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3}; color: {INK45};"><span style="width: 28px; height: 28px; border-radius: 999px; border: 1px solid {TINT3}; display: flex; align-items: center; justify-content: center;">{ic('lock', 14)}</span><span style="flex: 1; font-size: 15px; font-weight: 600;">Dominio</span><span style="font-size: 12px;">6 semanas</span></li>
          <li style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3}; color: {INK45};"><span style="width: 28px; height: 28px; border-radius: 999px; border: 1px solid {TINT3}; display: flex; align-items: center; justify-content: center;">{ic('lock', 14)}</span><span style="flex: 1; font-size: 15px; font-weight: 600;">Maestro</span><span style="font-size: 12px;">8 semanas</span></li>
        </ul>
      </section>
      {strip([('Logros', '3', '/ 21'), ('Puntos', '326', 'XP')])}''', gap=16)}"""
    return screen('Progreso', body, badge='', tabs=STUDENT_TABS)


def insignias():
    def badge(name, sub, earned=True):
        border = f'1px solid {COBALT}' if earned else f'1px dashed {TINT3}'
        color = INK if earned else INK45
        icon_html = ic('award', 22, COBALT, 2) if earned else ic('lock', 18, INK35)
        return f'<li style="border: {border}; background: {SURFACE if earned else "transparent"}; padding: 12px 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; color: {color};">{icon_html}<span style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; line-height: 1.3;">{name}</span><span style="font-size: 11px; color: {INK45};">{sub}</span></li>'
    body = cab.header('Tu evolución', 'Progreso') + f"""
    <div style="flex-shrink: 0; padding: 0 20px 4px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between;"><span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Nivel 3</span><span style="font-size: 12px; color: {INK45};">76 / 200 XP</span></div>
        {progress(76, 200)}
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">{ic('flame', 22, EMBER, 2.25)}<span style="font-family: {DISPLAY}; font-size: 30px; font-weight: 800;">7</span><span style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: {INK60};">días</span></div>
    </div>
    {segmented(['Ruta', 'Insignias', 'Historial'], 'Insignias')}
    {scroll(f'''
      <!-- Primero lo conseguido, después las TRES más cercanas con lo que
           falta. Las otras quince siguen ahí, tras «Ver las 21»: una pared de
           candados no motiva, esconde las que sí se pueden alcanzar. -->
      <section style="display: flex; flex-direction: column; gap: 10px;">
        {label('Conseguidas', '3 de 21')}
        <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">
          {badge('Primera sesión', '4 sept')}
          {badge('Primer kilo', '8 sept')}
          {badge('Semana perfecta', '14 sept')}
        </ul>
      </section>
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Las más cerca', 'Ver las 21')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          <li style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-bottom: 1px solid {TINT3};"><div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 600;"><span>Hábito formado</span><span style="font-size: 12px; font-weight: 500; color: {INK60};">7 de 10 sesiones</span></div>{progress(7, 10)}</li>
          <li style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-bottom: 1px solid {TINT3};"><div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 600;"><span>Cien series</span><span style="font-size: 12px; font-weight: 500; color: {INK60};">78 de 100</span></div>{progress(78, 100)}</li>
          <li style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-bottom: 1px solid {TINT3};"><div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 600;"><span>Todos los lunes</span><span style="font-size: 12px; font-weight: 500; color: {INK60};">2 de 4</span></div>{progress(2, 4)}</li>
        </ul>
      </section>''', gap=18)}"""
    return screen('Progreso', body, badge='', tabs=STUDENT_TABS)


def configuracion():
    def setting(icon_name, name, value='', trailing=None, danger=False):
        color = DANGER if danger else INK
        tr = trailing if trailing is not None else (f'<span style="font-size: 14px; color: {INK60};">{value}</span>' + f'<span style="color: {INK35}; display: flex;">{ic("chevron-right", 20)}</span>')
        return f"""
        <li style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3}; color: {color};">
          <span style="color: {COBALT if not danger else DANGER}; display: flex;">{ic(icon_name, 20)}</span>
          <span style="flex: 1; font-size: 15px; font-weight: 600;">{name}</span>
          {tr}
        </li>"""
    body = cab.header('Tu cuenta', 'Configuración') + scroll(f'''
      <!-- De 2.189 px de formularios siempre abiertos a una lista de ajustes con
           su valor actual a la derecha. Cada fila abre SU pantalla; el tema y el
           idioma, que son de tres opciones, se cambian ahí sin salir. -->
      <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0 4px;">
        {avatar('MS', 56)}
        <span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;"><span style="font-family: {DISPLAY}; font-size: 24px; font-weight: 800; text-transform: uppercase; line-height: 1;">Marco Salas</span><span style="font-size: 13px; color: {INK60};">entrenador@indepsoft.com</span></span>
        {button('Editar', 'secondary', 'pencil', small=True)}
      </div>
      <section style="display: flex; flex-direction: column; gap: 0;">
        {label('Apariencia')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {setting('monitor', 'Tema', 'Sistema')}
          {setting('globe', 'Idioma', 'Español')}
        </ul>
      </section>
      <section style="display: flex; flex-direction: column; gap: 0;">
        {label('Entrenamiento')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {setting('volume', 'Avisar al terminar el descanso', trailing=toggle(True))}
        </ul>
      </section>
      <section style="display: flex; flex-direction: column; gap: 0;">
        {label('Equipo')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {setting('users', 'Hierro y Asfalto', 'Administrador')}
          {setting('plus', 'Crear otro equipo', '')}
        </ul>
      </section>
      <section style="display: flex; flex-direction: column; gap: 0;">
        {label('Cuenta')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {setting('lock', 'Cambiar la contraseña', '')}
          {setting('logout', 'Cerrar sesión', '')}
          {setting('trash', 'Eliminar la cuenta', '', danger=True)}
        </ul>
      </section>''', gap=14)
    return screen('', body, badge='5')


def patrones():
    """Los seis patrones que sostienen la propuesta, con su regla: para quien la implemente."""
    def block(name, rule, sample):
        return f"""
      <section style="display: flex; flex-direction: column; gap: 10px;">
        <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: {EMBER};">{name}</span>
        <div style="border: 1px dashed {TINT3}; background: {BONE}; padding: 12px 16px;">{sample}</div>
        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: {INK60};">{rule}</p>
      </section>"""
    seg_sample = f'<div style="display: flex; gap: 2px; padding: 3px; border-radius: 6px; background: {MUTED};"><button type="button" style="flex: 1; min-height: 40px; border: 0; border-radius: 4px; background: {SURFACE}; box-shadow: 0 1px 2px rgba(10,18,36,0.08); font-family: {SANS}; font-size: 13px; font-weight: 600; color: {INK};">Resumen</button><button type="button" style="flex: 1; min-height: 40px; border: 0; border-radius: 4px; background: transparent; font-family: {SANS}; font-size: 13px; font-weight: 600; color: {INK60};">Progreso</button><button type="button" style="flex: 1; min-height: 40px; border: 0; border-radius: 4px; background: transparent; font-family: {SANS}; font-size: 13px; font-weight: 600; color: {INK60};">Sesiones</button><button type="button" style="flex: 1; min-height: 40px; border: 0; border-radius: 4px; background: transparent; font-family: {SANS}; font-size: 13px; font-weight: 600; color: {INK60};">Cuota</button></div>'
    row_sample = f'<ul style="margin: 0; padding: 0; list-style: none;">{row("María Gómez", "Avanzado · 3 sesiones", trailing=pill("Sin cuenta", EMBER), leading=avatar("MG"))}</ul>'
    acc_sample = accordion('Semana 02', '3 sesiones · lunes, miércoles y viernes', False)
    disc_sample = f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">{field("Series", "3")}{field("Reps", "8-10")}{field("RIR", "2")}</div><button type="button" style="display: flex; align-items: center; gap: 6px; height: 40px; padding: 0; border: 0; background: transparent; font-family: {SANS}; font-size: 13px; font-weight: 600; color: {COBALT};">{ic("chevron-down", 16)} Más ajustes</button>'
    sheet_sample = f"""<div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between;"><span style="font-size: 15px; font-weight: 600;">Racha · 7 días</span>{button('Pausar', 'secondary', 'clock', small=True)}</div>
        <div style="border: 1px solid {TINT3}; border-radius: 12px 12px 0 0; background: {SURFACE}; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
          <span style="align-self: center; width: 36px; height: 4px; border-radius: 999px; background: {TINT3};"></span>
          <span style="font-family: {DISPLAY}; font-size: 20px; font-weight: 800; text-transform: uppercase;">Pausar la racha</span>
          <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">{field('Desde', '15/09/2026')}{field('Hasta', '', 'dd/mm/aaaa')}</div>
          {field('Motivo', 'Lesión', kind='select')}
          {button('Pausar', 'primary', full=True)}
        </div></div>"""
    strip_sample = strip([('Edad', '28', 'años'), ('Grasa', '22', '%')])
    body = f"""
    <div style="width: 390px; box-sizing: border-box; padding: 24px 20px 32px; background: {BONE}; display: flex; flex-direction: column; gap: 28px;">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        {cab.eyebrow('Para quien lo implemente')}
        {cab.title('Los seis patrones')}
        <p style="margin: 6px 0 0; font-size: 14px; line-height: 1.5; color: {INK60};">Todo lo de la propuesta se hace con estas seis piezas. Cuatro ya existen en el código —<code>Tabs</code>, <code>MetricStrip</code>, las píldoras, los diálogos—; las filas de lista y el pliegue son nuevas.</p>
      </div>
      {block('1 · Secciones con botones', 'Cuando una pantalla junta más de tres bloques distintos, se parte en secciones y se elige con el selector fijo bajo la cabecera. Es el `Tabs` del sistema. Nunca más de cuatro; la primera es siempre el resumen, y lo que está en otra sección se enlaza desde el resumen cuando pide atención.', seg_sample)}
      {block('2 · Fila, no tarjeta', 'Una lista para ENCONTRAR usa filas de 64 px: nombre, una línea de apoyo, un estado y toda la fila es el enlace. La tarjeta se reserva para donde el objeto es el contenido, como la rutina con sus ejercicios.', row_sample)}
      {block('3 · Pliegue con resumen', 'Lo largo y repetido —semanas de un plan, bloques de una rutina— se pliega. La fila cerrada dice lo que hay dentro para que no haga falta abrirla; abierta sólo la que se mira.', acc_sample)}
      {block('4 · Lo de siempre a la vista, lo de a veces detrás', 'En un formulario, los campos que se rellenan siempre van en una fila; los que se rellenan a veces —peso, tempo, indicaciones— detrás de «Más ajustes». Se abre por ejercicio, no para todo el formulario.', disc_sample)}
      {block('5 · Lo excepcional, en una hoja', 'Una acción que se hace una vez al mes —validar un hito, pausar la racha, registrar un pago— no lleva su formulario siempre abierto en la página: es un botón que abre una hoja desde abajo, y la página queda como estaba al cerrarla.', sheet_sample)}
      {block('6 · Las cifras en franja', 'Cuatro datos de una ficha no son cuatro filas de 70 px: son una franja de dos columnas con reglas, como en el panel. Se mira de un golpe.', strip_sample)}
    </div>"""
    return cab.HEAD + body + cab.FOOT


# ============================================================ hojas (modales)

def sheet(title, body_html, primary, secondary='Cancelar', danger=False, hint=''):
    """
    La hoja desde abajo. En móvil TODO diálogo es esto: asa arriba, título en
    Condensed, el botón primario abajo del todo —donde llega el pulgar— y a
    todo el ancho. Como mucho el 90 % del alto; si no cabe, desplaza por dentro.
    """
    primary_button = button(primary, 'danger' if danger else 'primary', full=True) if not danger else \
        f'<button type="button" style="width: 100%; height: 44px; border: 0; border-radius: 999px; background: {DANGER}; color: #fff; font-family: {SANS}; font-size: 14px; font-weight: 600;">{primary}</button>'
    hint_html = f'<p style="margin: 0; font-size: 13px; color: {INK60}; line-height: 1.45;">{hint}</p>' if hint else ''
    return f"""
      <div style="position: absolute; inset: 0; background: rgba(10,18,36,0.45);"></div>
      <div style="position: absolute; left: 0; right: 0; bottom: 0; max-height: 90%; background: {SURFACE}; border-radius: 16px 16px 0 0; display: flex; flex-direction: column; gap: 14px; padding: 8px 20px 20px; box-shadow: 0 -8px 32px rgba(10,18,36,0.18);">
        <span style="align-self: center; width: 36px; height: 4px; border-radius: 999px; background: {TINT3};"></span>
        <h2 style="margin: 0; font-family: {DISPLAY}; font-size: 24px; font-weight: 800; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase;">{title}</h2>
        {hint_html}
        {body_html}
        <div style="display: flex; flex-direction: column; gap: 8px; padding-top: 4px;">
          {primary_button}
          {button(secondary, 'secondary', full=True)}
        </div>
      </div>"""


def screen_with_sheet(active_tab, body, sheet_html, badge='5', tabs=None):
    previous = cab.TABS
    if tabs is not None:
        cab.TABS = tabs
    bar = cab.tabbar(active_tab)
    cab.TABS = previous
    html = (cab.HEAD + f'<div style="position: relative; width: 390px; height: 844px; display: flex; flex-direction: column; background: {BONE}; overflow: hidden;">'
            + cab.navbar(badge) + '<main style="flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;">' + body + '</main>'
            + bar + sheet_html + '</div>' + cab.FOOT)
    return as_student(html) if tabs is STUDENT_TABS else html


def option_row(text, meta='', on=False):
    ring = f'border: 2px solid {COBALT};' if on else f'border: 1px solid {TINT3};'
    dot = (f'<span style="width: 20px; height: 20px; border-radius: 999px; border: 6px solid {COBALT}; box-sizing: border-box; background: #fff;"></span>' if on
           else f'<span style="width: 20px; height: 20px; border-radius: 999px; border: 1px solid {TINT3}; box-sizing: border-box;"></span>')
    meta_html = f'<span style="font-size: 12px; color: {INK60};">{meta}</span>' if meta else ''
    return f'<label style="display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 14px; border-radius: 6px; background: {SURFACE}; {ring}">{dot}<span style="flex: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 15px; font-weight: 600;">{text}</span>{meta_html}</span></label>'


def ficha_cuota_body():
    return ficha_hero('Cuota') + scroll(f'''
      <!-- La cuota: primero en qué estado está, después las dos cosas que se
           pueden hacer, y la periodicidad. Sin formularios abiertos: registrar
           un pago abre su hoja. -->
      <div style="border: 1px solid {DANGER}; background: {SURFACE}; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">{pill('Vencida hace 5 días', DANGER, filled=True)}<span style="font-size: 12px; color: {INK60};">Mensual</span></div>
        <span style="font-family: {DISPLAY}; font-size: 22px; font-weight: 800; text-transform: uppercase;">Pagada hasta el jueves 10</span>
        <span style="font-size: 13px; color: {INK60};">Sin cuenta: verá el aviso en su campana cuando se registre con este correo.</span>
      </div>
      <div style="display: flex; gap: 8px;">{button('Registrar pago', 'primary', 'card', full=True)}{button('Avisar', 'secondary', 'bell', full=True)}</div>
      <section style="display: flex; flex-direction: column; gap: 10px;">
        {label('Cada cuánto paga')}
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">{chip('Mensual', on=True)}{chip('Trimestral')}{chip('Semestral')}{chip('Anual')}</div>
        <p style="margin: 0; font-size: 13px; color: {INK45};">Cambiarlo no cobra nada: sólo dice cuándo vence la próxima.</p>
      </section>''', gap=16)


def ficha_cuota():
    return screen('Estudiantes', ficha_cuota_body(), badge='5')


def ficha_sesiones():
    def item(date, what, meta, status, color, done=False):
        op = 'opacity: 0.6;' if done else ''
        return f'<li style="display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 56px; border-bottom: 1px solid {TINT3}; {op}"><span style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: {INK60};">{date}</span><span style="display: flex; flex-direction: column; gap: 2px; min-width: 0;"><span style="font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{what}</span><span style="font-size: 12px; color: {INK60};">{meta}</span></span>{pill(status, color)}</li>'
    body = ficha_hero('Sesiones') + scroll(f'''
      <!-- Doce filas de tres líneas y 90 px eran 1.100 px; fecha, título y
           estado en una fila de 56. Agrupadas por mes, lo próximo arriba. -->
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Próximas', '1')}
        <ul style="margin: 0; padding: 0; list-style: none;">{item('Mié 16', 'Entrenamiento personal', '18:00 · 60 min · Gimnasio', 'Confirmada', SUCCESS)}</ul>
      </section>
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Septiembre', '9 hechas')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {item('Mar 15', 'Entrenamiento personal', '12/12 series · 52 min', 'Completada', COBALT, True)}
          {item('Lun 14', 'Entrenamiento personal', '10/12 series · 44 min', 'Completada', COBALT, True)}
          {item('Dom 13', 'Entrenamiento personal', '12/12 series · 58 min', 'Completada', COBALT, True)}
          {item('Sáb 12', 'Entrenamiento personal', '9/9 series · 41 min', 'Completada', COBALT, True)}
          {item('Vie 11', 'Entrenamiento personal', '12/12 series · 55 min', 'Completada', COBALT, True)}
          {item('Jue 10', 'Entrenamiento personal', '12/12 series · 61 min', 'Completada', COBALT, True)}
        </ul>
      </section>
      <a href="#" style="display: inline-flex; align-items: center; gap: 4px; min-height: 44px; font-size: 13px; font-weight: 600;">Ver la agenda completa {ic('arrow-up-right', 16)}</a>''', gap=16)
    return screen('Estudiantes', body, badge='5')


def equipo_ranking():
    def rank(position, initials, name, xp, meta, top=False):
        number_style = f'background: {COBALT}; color: #fff;' if top else f'background: {TINT2}; color: {COBALT};'
        return f'<li style="display: flex; align-items: center; gap: 12px; min-height: 60px; border-bottom: 1px solid {TINT3};"><span style="width: 28px; height: 28px; border-radius: 999px; font-family: {DISPLAY}; font-size: 15px; font-weight: 800; display: flex; align-items: center; justify-content: center; {number_style}">{position}</span>{avatar(initials, 36)}<span style="flex: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 15px; font-weight: 600;">{name}</span><span style="font-size: 12px; color: {INK60};">{meta}</span></span><span style="font-family: {DISPLAY}; font-size: 20px; font-weight: 800; color: {COBALT};">{xp}<span style="font-size: 12px; font-family: {SANS}; font-weight: 600;"> XP</span></span></li>'
    body = equipo_hero('Ranking') + scroll(f'''
      <div style="display: flex; gap: 6px;">{chip('Esta semana', on=True)}{chip('Este mes')}{chip('Siempre')}</div>
      <ul style="margin: 0; padding: 0; list-style: none;">
        {rank('1', 'JP', 'Juan Pérez', '66', '2 sesiones · racha de 7', True)}
        {rank('2', 'MG', 'María Gómez', '31', '1 sesión')}
        {rank('3', 'CL', 'Carlos López', '0', 'Sin sesiones esta semana')}
        {rank('4', 'AT', 'Ana Torres', '0', 'Sin sesiones esta semana')}
      </ul>
      <p style="margin: 0; font-size: 13px; color: {INK45};">Compara entre iguales: cada alumno ve a los de su cohorte. Tú ves a todos.</p>''', gap=16)
    return screen('Equipo', body, badge='')


def equipo_invitar():
    import random
    pattern = random.Random(24)
    qr_cells = ''.join(f'<span style="background: {INK if pattern.random() < 0.48 else "transparent"};"></span>' for _ in range(21 * 21))
    body = equipo_hero('Invitar') + scroll(f'''
      <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0 0;">
        <div style="width: 200px; height: 200px; padding: 12px; box-sizing: border-box; background: #fff; border: 1px solid {TINT3}; display: grid; grid-template-columns: repeat(21, minmax(0, 1fr)); grid-template-rows: repeat(21, minmax(0, 1fr));">{qr_cells}</div>
        <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK45};">O que escriba este código</span>
        <span style="font-family: {DISPLAY}; font-size: 34px; font-weight: 800; letter-spacing: 0.06em;">HIER-R024</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">{button('Copiar enlace', 'secondary', 'copy', full=True)}{button('Generar uno nuevo', 'secondary', 'link', full=True)}</div>
      <p style="margin: 0; font-size: 13px; color: {INK45}; text-align: center;">Generar uno nuevo deja de funcionar el anterior al instante.</p>''', gap=18)
    return screen('Equipo', body, badge='')


def progreso_historial():
    def item(date, what, sets, minutes, xp):
        return f'<li style="display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 56px; border-bottom: 1px solid {TINT3};"><span style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: {INK60};">{date}</span><span style="display: flex; flex-direction: column; gap: 2px; min-width: 0;"><span style="font-size: 15px; font-weight: 600;">{what}</span><span style="font-size: 12px; color: {INK60};">{sets} series · {minutes} min</span></span><span style="font-family: {DISPLAY}; font-size: 18px; font-weight: 800; color: {SUCCESS};">+{xp}<span style="font-size: 11px; font-family: {SANS}; font-weight: 600;"> XP</span></span></li>'
    hero = f"""
    <div style="flex-shrink: 0; padding: 0 20px 4px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between;"><span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Nivel 3</span><span style="font-size: 12px; color: {INK45};">76 / 200 XP</span></div>
        {progress(76, 200)}
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">{ic('flame', 22, EMBER, 2.25)}<span style="font-family: {DISPLAY}; font-size: 30px; font-weight: 800;">7</span><span style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: {INK60};">días</span></div>
    </div>"""
    body = cab.header('Tu evolución', 'Progreso') + hero + segmented(['Ruta', 'Insignias', 'Historial'], 'Historial') + scroll(f'''
      {strip([('Sesiones', '10', 'hechas'), ('Este mes', '9', 'sesiones')])}
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Septiembre', '326 XP')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {item('Mar 15', 'Entrenamiento personal', '12/12', 52, 34)}
          {item('Lun 14', 'Entrenamiento personal', '10/12', 44, 29)}
          {item('Dom 13', 'Entrenamiento personal', '12/12', 58, 34)}
          {item('Sáb 12', 'Entrenamiento personal', '9/9', 41, 33)}
          {item('Vie 11', 'Entrenamiento personal', '12/12', 55, 34)}
        </ul>
      </section>''', gap=16)
    return screen('Progreso', body, badge='', tabs=STUDENT_TABS)


def hoja_sesion():
    fields = f"""
      <div style="display: flex; flex-direction: column; gap: 12px;">
        {field('Tipo', 'Entrenamiento personal', kind='select')}
        {field('Alumno', 'María Gómez', kind='select')}
        <div style="display: flex; flex-direction: column; gap: 6px;"><span style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Modalidad</span><div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">{option_row('Fuerza', on=True)}{option_row('Cardio')}</div></div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">{field('Fecha', 'Mié 16 sept')}{field('Hora', '18:00')}</div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">{field('Duración', '60 min', kind='select')}{field('Lugar', 'Gimnasio', kind='select')}</div>
        {field('Rutina', 'Full body · Principiante', kind='select')}
      </div>"""
    base = cab.header('Agenda', 'Mar, 15 sept', cab.primary_pill('plus', 'Sesión')) + segmented(['Lista', 'Horario'], 'Lista')
    return screen_with_sheet('Calendario', base, sheet('Nueva sesión', fields, 'Agendar', hint='Las notas y el aviso de choque de horario aparecen al elegir la hora.'))


def hoja_pago():
    fields = f"""
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">{field('Pagado el', '15/09/2026')}{field('Cubre hasta', '15/10/2026')}</div>
        <div style="display: flex; flex-direction: column; gap: 6px;"><span style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Cada cuánto</span><div style="display: flex; gap: 6px; flex-wrap: wrap;">{chip('Mensual', on=True)}{chip('Trimestral')}{chip('Semestral')}{chip('Anual')}</div></div>
      </div>"""
    return screen_with_sheet('Estudiantes', ficha_cuota_body(), sheet('Registrar pago', fields, 'Registrar', hint='Juan Pérez · la cuota deja de estar vencida y el aviso desaparece de su campana.'))


def hoja_asignar():
    fields = f"""
      <div style="display: flex; flex-direction: column; gap: 8px;">
        {option_row('Base de fuerza · 4 semanas', 'Principiante · 3 sesiones por semana', on=True)}
        {option_row('Hipertrofia · 6 semanas', 'Intermedio · 4 sesiones por semana')}
        {field('Empieza el', 'Lun 21 sept')}
      </div>"""
    return screen_with_sheet('Estudiantes', ficha_hero('Resumen') + scroll(strip([('Edad', '28', 'años'), ('Grasa corporal', '22', '%'), ('Sesiones', '10', 'hechas'), ('Racha', '7', 'días')])),
                             sheet('Asignar un plan', fields, 'Asignar', hint='Sustituye a «Base de fuerza», que va por la semana 2. Las sesiones ya agendadas se quedan.'))


def hoja_eliminar():
    body = f'<p style="margin: 0; font-size: 15px; line-height: 1.5;">«Full body · Principiante» está en el plan <strong>Base de fuerza</strong> y en 2 sesiones agendadas. Se quitará de las dos.</p>'
    base = f"""
    <header style="flex-shrink: 0; padding: 4px 20px 12px; display: flex; flex-direction: column; gap: 6px;">
      {back_link('Rutinas')}
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px;">{cab.eyebrow('Rutina')}<div style="display: flex; gap: 8px;">{cab.icon_button('trash', 'Eliminar')}{cab.icon_button('pencil', 'Editar')}{cab.primary_pill('copy', 'Usar')}</div></div>
      {cab.title('Full body · Principiante')}
    </header>
    {strip([('Ejercicios', '4', ''), ('Duración', '25', 'min'), ('Series', '12', 'en total'), ('Nivel', 'Principiante', '')])}"""
    return screen_with_sheet('Entrenamientos', base, sheet('¿Eliminar la rutina?', body, 'Eliminar', danger=True))


# ============================================================ escritorio

DESKTOP_NAV = [('home', 'Dashboard', '5'), ('users', 'Estudiantes', ''), ('dumbbell', 'Entrenamientos', ''), ('calendar', 'Calendario', ''), ('users', 'Equipo', ''), ('list', 'Reportes', ''), ('settings', 'Configuración', '')]
STUDENT_NAV = [('calendar', 'Calendario', ''), ('award', 'Progreso', ''), ('users', 'Equipo', ''), ('settings', 'Configuración', '')]


def desktop(active, body, nav=None, badge='5', person=('MS', 'Marco Salas'), role='Administrador'):
    """El shell de escritorio, calcado: barra lateral de 256 px con el equipo y la navegación, barra superior de 64 px, contenido con 36 px de margen."""
    items = []
    for name, text, count in (nav or DESKTOP_NAV):
        on = text == active
        style = f'background: {COBALT}; color: #fff; box-shadow: 0 1px 2px rgba(10,18,36,0.1);' if on else f'color: {INK60};'
        badge_html = f'<span style="margin-left: auto; padding: 2px 8px; border-radius: 999px; background: {"rgba(255,255,255,0.2)" if on else MUTED}; font-size: 12px; font-weight: 500;">{count}</span>' if count else ''
        items.append(f'<a href="#" style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; {style}">{ic(name, 16)}<span>{text}</span>{badge_html}</a>')
    sidebar = f"""
    <aside style="width: 256px; flex-shrink: 0; display: flex; flex-direction: column; background: {BONE}; border-right: 1px solid {TINT3};">
      <div style="padding: 12px 16px 0;">
        <div style="height: 48px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; letter-spacing: 0.02em;">TrainerHub</div>
        <div style="margin: 4px 0; border-top: 1px solid {TINT3};"></div>
        <div style="padding: 16px 8px; border-top: 1px solid {TINT3}; border-bottom: 1px solid {TINT3}; display: flex; align-items: center; gap: 12px;">
          <span style="position: relative; width: 40px; height: 40px; border-radius: 999px; background: {COBALT}; color: #fff; font-family: {DISPLAY}; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center;">HY<span style="position: absolute; top: -4px; right: -6px; min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; background: {EMBER}; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;">{badge}</span></span>
          <span style="flex: 1; display: flex; flex-direction: column;"><span style="font-size: 15px; font-weight: 600;">Hierro y Asfalto</span><span style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK45};">Crew · {role}</span></span>
          <span style="color: {INK45}; display: flex;">{ic('chevrons', 16)}</span>
        </div>
      </div>
      <nav style="display: flex; flex-direction: column; gap: 4px; padding: 16px 16px;">{''.join(items)}</nav>
      <div style="margin-top: auto; border-top: 1px solid {TINT3}; background: {TINT1}; padding: 8px; text-align: center; font-size: 13px; color: {INK45};">v1.0.0</div>
    </aside>"""
    topbar = f"""
    <header style="height: 64px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; border-bottom: 1px solid {TINT3};">
      <span style="color: {INK60}; display: flex;">{ic('list', 20)}</span>
      <div style="display: flex; align-items: center; gap: 16px;"><span style="color: {INK}; display: flex;">{ic('bell', 20)}</span>{avatar(person[0], 36)}<span style="font-size: 14px; font-weight: 500;">{person[1]}</span></div>
    </header>"""
    return (cab.HEAD + f'<div style="width: 1440px; height: 900px; display: flex; background: {BONE}; overflow: hidden;">' + sidebar
            + f'<div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">' + topbar
            + f'<main style="flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;">{body}</main></div></div>' + cab.FOOT)


def desktop_header(eyebrow_text, title_text, actions_html='', back=''):
    back_html = back_link(back) if back else ''
    return f"""
    <header style="flex-shrink: 0; padding: 24px 36px 20px; display: flex; flex-direction: column; gap: 4px;">
      {back_html}
      <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 24px;">
        <div style="display: flex; flex-direction: column; gap: 2px;">{cab.eyebrow(eyebrow_text)}{cab.title(title_text)}</div>
        <div style="display: flex; align-items: center; gap: 8px;">{actions_html}</div>
      </div>
    </header>"""


def desktop_button(text, kind='primary', icon_name=None):
    style = f'background: {COBALT}; color: #fff; border: 0;' if kind == 'primary' else (f'background: {SURFACE}; color: {INK}; border: 1px solid {TINT3};' if kind == 'secondary' else f'background: transparent; color: {DANGER}; border: 1px solid {DANGER};')
    icon_html = ic(icon_name, 16, 'currentColor', 2.25) if icon_name else ''
    return f'<button type="button" style="height: 36px; padding: 0 16px; border-radius: 999px; font-family: {SANS}; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; {style}">{icon_html}{text}</button>'


def desktop_tabs(items, active):
    cells = ''.join(f'<button type="button" style="min-width: 120px; height: 34px; padding: 0 16px; border: 0; border-radius: 4px; font-family: {SANS}; font-size: 14px; font-weight: 500; cursor: pointer; {"background: " + SURFACE + "; box-shadow: 0 1px 2px rgba(10,18,36,0.08); color: " + INK + ";" if name == active else "background: transparent; color: " + INK60 + ";"}">{name}</button>' for name in items)
    return f'<div style="display: inline-flex; gap: 2px; padding: 3px; border-radius: 6px; background: {MUTED}; width: fit-content;">{cells}</div>'


def d_estudiantes():
    def trow(initials, name, email, level, sessions, due, due_color, account, account_color):
        return f"""
          <tr style="height: 60px; border-bottom: 1px solid {TINT3};">
            <td style="padding: 0 16px;"><span style="display: flex; align-items: center; gap: 12px;">{avatar(initials, 36)}<span style="display: flex; flex-direction: column;"><span style="font-size: 15px; font-weight: 600;">{name}</span><span style="font-size: 12px; color: {INK60};">{email}</span></span></span></td>
            <td style="padding: 0 16px;">{pill(level)}</td>
            <td style="padding: 0 16px; font-family: {DISPLAY}; font-size: 20px; font-weight: 800;">{sessions}</td>
            <td style="padding: 0 16px;">{pill(due, due_color)}</td>
            <td style="padding: 0 16px;">{pill(account, account_color)}</td>
            <td style="padding: 0 16px; text-align: right; color: {INK35};">{ic('chevron-right', 18)}</td>
          </tr>"""
    head = ''.join(f'<th style="padding: 0 16px; text-align: {"right" if h == "" else "left"}; font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">{h}</th>' for h in ['Alumno', 'Nivel', 'Sesiones', 'Cuota', 'Cuenta', ''])
    body = desktop_header('Tu equipo · 4', 'Estudiantes', desktop_button('Añadir alumno', 'primary', 'plus')) + f"""
    <div style="padding: 0 36px 36px; display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: space-between; gap: 16px;">
        <label style="width: 380px; display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 12px; border: 1px solid {TINT3}; border-radius: 6px; background: {SURFACE}; color: {INK45};">{ic('search', 16)}<span style="font-size: 14px;">Buscar estudiante…</span></label>
        <span style="display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border: 1px solid {TINT3}; border-radius: 6px; background: {SURFACE}; font-size: 14px;">Todos los niveles {ic('chevron-down', 16, INK45)}</span>
      </div>
      <!-- En escritorio la lista es una TABLA: los mismos datos de la fila móvil,
           cada uno en su columna, ordenables. No una fila de móvil estirada a 1.100 px. -->
      <table style="width: 100%; border-collapse: collapse; border-top: 1px solid {TINT3};">
        <thead><tr style="height: 40px; border-bottom: 1px solid {TINT3};">{head}</tr></thead>
        <tbody>
          {trow('JP', 'Juan Pérez', 'jperez@gmail.com', 'Intermedio', '10', 'Vencida hace 5 días', DANGER, 'Con cuenta', SUCCESS)}
          {trow('MG', 'María Gómez', 'mgomez@gmail.com', 'Avanzado', '3', 'Vence en 3 días', WARNING, 'Sin cuenta', EMBER)}
          {trow('CL', 'Carlos López', 'clopez@gmail.com', 'Principiante', '1', 'Vence en 54 días', INK60, 'Sin cuenta', EMBER)}
          {trow('AT', 'Ana Torres', 'atorrez@gmail.com', 'Intermedio', '0', 'Sin cuota', INK45, 'Sin cuenta', EMBER)}
        </tbody>
      </table>
    </div>"""
    return desktop('Estudiantes', body)


def d_ficha():
    identity = f"""
      <aside style="width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 18px;">
        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
          {avatar('JP', 72)}
          <h1 style="margin: 0; font-family: {DISPLAY}; font-size: 34px; font-weight: 800; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase;">Juan Pérez</h1>
          <span style="font-size: 13px; color: {INK60};">jperez@gmail.com</span>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">{pill('Intermedio')}{pill('28 años', INK60)}{pill('Cuota vencida', DANGER)}</div>
        </div>
        {desktop_button('Agendar sesión', 'primary', 'calendar')}
        {strip([('Edad', '28', 'años'), ('Grasa corporal', '22', '%'), ('Sesiones', '10', 'hechas'), ('Racha', '7', 'días')])}
        <section style="display: flex; flex-direction: column; gap: 10px;">{label('Objetivos')}<div style="display: flex; gap: 6px; flex-wrap: wrap;">{chip('Perder peso')}{chip('Ganar músculo')}</div></section>
        <section style="display: flex; flex-direction: column; gap: 4px;">
          {label('Le toca')}
          <ul style="margin: 0; padding: 0; list-style: none;">
            {row('Cuota vencida hace 5 días', 'Registrar el pago o avisar', leading=f'<span style="color: {DANGER}; display: flex;">{ic("card", 18)}</span>', min_height=52)}
            {row('Siguiente hito: Consolidación', 'Espera tu validación', leading=f'<span style="color: {COBALT}; display: flex;">{ic("award", 18)}</span>', min_height=52)}
          </ul>
        </section>
      </aside>"""
    def load(name, kg, delta):
        return f'<li style="display: flex; align-items: center; justify-content: space-between; min-height: 48px; border-bottom: 1px solid {TINT3};"><span style="font-size: 15px; font-weight: 600;">{name}</span><span style="display: flex; align-items: baseline; gap: 8px;"><span style="font-family: {DISPLAY}; font-size: 22px; font-weight: 800;">{kg}<span style="font-family: {SANS}; font-size: 12px; font-weight: 500; color: {INK45};"> kg</span></span><span style="font-size: 12px; font-weight: 600; color: {SUCCESS};">{delta}</span></span></li>'
    content = f"""
      <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px;">
        {desktop_tabs(['Progreso', 'Sesiones', 'Cuota'], 'Progreso')}
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 36px;">
          <section style="display: flex; flex-direction: column; gap: 4px;">
            {label('Ruta Hybrid', 'Cambiar')}
            <ul style="margin: 0; padding: 0; list-style: none;">
              <li style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3};"><span style="width: 28px; height: 28px; border-radius: 999px; background: {COBALT}; color: #fff; display: flex; align-items: center; justify-content: center;">{ic('check', 16, '#fff', 2.5)}</span><span style="flex: 1; font-size: 15px; font-weight: 600;">Iniciación</span><span style="font-size: 12px; color: {INK45};">Completado</span></li>
              <li style="display: flex; flex-direction: column; gap: 10px; padding: 12px 0; border-bottom: 1px solid {TINT3};">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="width: 28px; height: 28px; border-radius: 999px; background: {EMBER}; display: flex; align-items: center; justify-content: center;"><span style="width: 10px; height: 10px; border-radius: 999px; background: #fff;"></span></span><span style="flex: 1; font-size: 15px; font-weight: 600;">Consolidación <span style="font-weight: 500; color: {INK60};">· nodo actual</span></span>{desktop_button('Validar hito', 'secondary', 'award')}</div>
                <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding-left: 40px;">
                  <span style="display: flex; flex-direction: column; gap: 6px;"><span style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK60};"><span>Puntos</span><span>326 / 300</span></span>{progress(300, 300, SUCCESS)}</span>
                  <span style="display: flex; flex-direction: column; gap: 6px;"><span style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK60};"><span>Semanas</span><span>0 / 4</span></span>{progress(0, 4)}</span>
                </div>
              </li>
              <li style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3}; color: {INK45};"><span style="width: 28px; height: 28px; border-radius: 999px; border: 1px solid {TINT3}; display: flex; align-items: center; justify-content: center;">{ic('lock', 14)}</span><span style="flex: 1; font-size: 15px; font-weight: 600;">Dominio</span><span style="font-size: 12px;">6 semanas</span></li>
              <li style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3}; color: {INK45};"><span style="width: 28px; height: 28px; border-radius: 999px; border: 1px solid {TINT3}; display: flex; align-items: center; justify-content: center;">{ic('lock', 14)}</span><span style="flex: 1; font-size: 15px; font-weight: 600;">Maestro</span><span style="font-size: 12px;">8 semanas</span></li>
            </ul>
          </section>
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <section style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: baseline; justify-content: space-between;"><span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Nivel 3</span><span style="font-size: 12px; color: {INK45};">76 / 200 XP</span></div>
              {progress(76, 200)}
            </section>
            <section style="display: flex; flex-direction: column; gap: 4px;">
              {label('Racha · 7 días', 'Pausar')}
              <p style="margin: 6px 0 0; font-size: 13px; color: {INK60};">Lesión o viaje: los días sin entrenar no rompen la racha mientras dure la pausa.</p>
            </section>
            <section style="display: flex; flex-direction: column; gap: 4px;">
              {label('Cargas', 'Ver gráfica')}
              <ul style="margin: 0; padding: 0; list-style: none;">{load('Sentadilla con barra', '77,5', '+2,5')}{load('Press de banca con barra', '57,5', '+2,5')}{load('Remo con barra', '62,5', '+2,5')}</ul>
            </section>
          </div>
        </div>
      </div>"""
    body = f"""
    <div style="padding: 20px 36px 0;">{back_link('Estudiantes')}</div>
    <!-- A 1440 px el «Resumen» deja de ser una sección: es la COLUMNA de
         identidad, siempre a la vista, y las otras tres secciones van a su
         derecha. Lo que en el móvil se elige, aquí cabe a la vez. -->
    <div style="display: flex; gap: 48px; padding: 8px 36px 36px;">{identity}{content}</div>"""
    return desktop('Estudiantes', body)


def d_equipo():
    def post(who, when, text):
        return f'<article style="border: 1px solid {TINT3}; background: {SURFACE}; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;"><div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK45};"><span>{who}</span><span style="letter-spacing: 0; text-transform: none; font-weight: 500;">{when}</span></div><p style="margin: 0; font-size: 15px; line-height: 1.45;">{text}</p><div style="display: flex; gap: 4px; color: {INK45};">{ic("heart", 18)}<span style="font-size: 12px;">2</span></div></article>'
    def member(initials, name, meta, trailing):
        return row(name, meta, trailing=trailing, leading=avatar(initials, 36), min_height=56, chevron=False)
    body = desktop_header('Crew · 4 miembros', 'Hierro y Asfalto', desktop_button('Equipo técnico', 'secondary', 'users') + desktop_button('Ajustes', 'secondary', 'settings') + desktop_button('Gestionar alumnos', 'secondary', 'userplus')) + f"""
    <!-- Las cuatro secciones del móvil se reparten en dos columnas: el muro,
         que es lo que cambia cada día, ocupa; miembros, ranking e invitar van a
         un panel lateral con las mismas pestañas. -->
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 48px; padding: 0 36px 36px;">
      <section style="display: flex; flex-direction: column; gap: 14px;">
        {label('Muro')}
        <div style="display: flex; gap: 10px; align-items: flex-end;">
          <textarea placeholder="Cuéntale algo a tu equipo…" rows="2" style="flex: 1; min-height: 64px; padding: 12px 14px; border: 1px solid {TINT3}; border-radius: 6px; background: {SURFACE}; font-family: {SANS}; font-size: 15px; resize: none; outline: none;"></textarea>
          {desktop_button('Publicar', 'primary', 'megaphone')}
        </div>
        {post('Marco Salas', 'Hace 5 h', 'El sábado hacemos la salida larga por el cerro. Salimos a las 8:00 del gimnasio, llevad agua para hora y media.')}
        {post('Marco Salas', '13 de septiembre', 'Recordad que esta semana toca descarga: bajad la carga un 40 % y centraos en la técnica. Descansar también es entrenar.')}
      </section>
      <aside style="display: flex; flex-direction: column; gap: 14px;">
        {desktop_tabs(['Miembros · 4', 'Ranking', 'Invitar'], 'Miembros · 4')}
        <section style="display: flex; flex-direction: column; gap: 4px;">
          {label('Solicitudes', '1')}
          <div style="display: flex; align-items: center; gap: 12px; min-height: 56px; border-bottom: 1px solid {TINT3};">{avatar('LR', 36)}<span style="flex: 1; display: flex; flex-direction: column;"><span style="font-size: 15px; font-weight: 600;">Lucía Rey</span><span style="font-size: 12px; color: {INK60};">Pidió entrar ayer</span></span>{desktop_button('Rechazar', 'secondary')}{desktop_button('Aprobar', 'primary', 'check')}</div>
        </section>
        <ul style="margin: 0; padding: 0; list-style: none;">
          {member('JP', 'Juan Pérez', 'Intermedio · con cuenta', pill('Activo', SUCCESS))}
          {member('MG', 'María Gómez', 'Avanzado · sin cuenta', desktop_button('Invitar', 'secondary', 'link'))}
          {member('CL', 'Carlos López', 'Principiante · sin cuenta', desktop_button('Invitar', 'secondary', 'link'))}
          {member('AT', 'Ana Torres', 'Intermedio · sin cuenta', desktop_button('Invitar', 'secondary', 'link'))}
        </ul>
      </aside>
    </div>"""
    return desktop('Equipo', body, badge='')


def d_progreso():
    def badge(name, sub):
        return f'<li style="border: 1px solid {COBALT}; background: {SURFACE}; padding: 12px 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;">{ic("award", 22, COBALT)}<span style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; line-height: 1.3;">{name}</span><span style="font-size: 11px; color: {INK45};">{sub}</span></li>'
    def near(name, meta, value, max_):
        return f'<li style="display: flex; flex-direction: column; gap: 8px; padding: 10px 0; border-bottom: 1px solid {TINT3};"><div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 600;"><span>{name}</span><span style="font-size: 12px; font-weight: 500; color: {INK60};">{meta}</span></div>{progress(value, max_)}</li>'
    def item(date, what, xp):
        return f'<li style="display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 44px; border-bottom: 1px solid {TINT3};"><span style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: {INK60};">{date}</span><span style="font-size: 14px; font-weight: 600;">{what}</span><span style="font-family: {DISPLAY}; font-size: 16px; font-weight: 800; color: {SUCCESS};">+{xp} XP</span></li>'
    hero = f"""
      <div style="display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 36px; align-items: center; padding: 0 36px 20px;">
        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 520px;">
          <div style="display: flex; align-items: baseline; justify-content: space-between;"><span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Nivel 3</span><span style="font-size: 12px; color: {INK45};">76 / 200 XP</span></div>
          {progress(76, 200)}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">{ic('flame', 24, EMBER, 2.25)}<span style="font-family: {DISPLAY}; font-size: 34px; font-weight: 800;">7</span><span style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: {INK60};">días de racha</span></div>
        <div style="display: flex; align-items: center; gap: 8px;">{ic('trophy', 22, COBALT)}<span style="font-family: {DISPLAY}; font-size: 34px; font-weight: 800;">326</span><span style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: {INK60};">XP este mes</span></div>
      </div>"""
    body = desktop_header('Tu evolución', 'Progreso') + hero + f"""
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 360px; gap: 40px; padding: 0 36px 36px;">
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Ruta Hybrid', 'Rendimiento mixto')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          <li style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3};"><span style="width: 28px; height: 28px; border-radius: 999px; background: {COBALT}; color: #fff; display: flex; align-items: center; justify-content: center;">{ic('check', 16, '#fff', 2.5)}</span><span style="flex: 1; font-size: 15px; font-weight: 600;">Iniciación</span><span style="font-size: 12px; color: {INK45};">Hecho</span></li>
          <li style="display: flex; flex-direction: column; gap: 10px; padding: 12px 0; border-bottom: 1px solid {TINT3};">
            <div style="display: flex; align-items: center; gap: 12px;"><span style="width: 28px; height: 28px; border-radius: 999px; background: {EMBER}; display: flex; align-items: center; justify-content: center;"><span style="width: 10px; height: 10px; border-radius: 999px; background: #fff;"></span></span><span style="flex: 1; font-size: 15px; font-weight: 600;">Consolidación</span><span style="font-size: 12px; color: {INK45};">Estás aquí</span></div>
            <p style="margin: 0; padding-left: 40px; font-size: 13px; color: {INK60};">Te faltan 4 semanas cumpliendo y el visto bueno de tu entrenador.</p>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding-left: 40px;">
              <span style="display: flex; flex-direction: column; gap: 6px;"><span style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK60};"><span>Puntos</span><span>326 / 300</span></span>{progress(300, 300, SUCCESS)}</span>
              <span style="display: flex; flex-direction: column; gap: 6px;"><span style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK60};"><span>Semanas</span><span>0 / 4</span></span>{progress(0, 4)}</span>
            </div>
          </li>
          <li style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3}; color: {INK45};"><span style="width: 28px; height: 28px; border-radius: 999px; border: 1px solid {TINT3}; display: flex; align-items: center; justify-content: center;">{ic('lock', 14)}</span><span style="flex: 1; font-size: 15px; font-weight: 600;">Dominio</span><span style="font-size: 12px;">6 semanas</span></li>
          <li style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {TINT3}; color: {INK45};"><span style="width: 28px; height: 28px; border-radius: 999px; border: 1px solid {TINT3}; display: flex; align-items: center; justify-content: center;">{ic('lock', 14)}</span><span style="flex: 1; font-size: 15px; font-weight: 600;">Maestro</span><span style="font-size: 12px;">8 semanas</span></li>
        </ul>
      </section>
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <section style="display: flex; flex-direction: column; gap: 10px;">
          {label('Insignias conseguidas', '3 de 21')}
          <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">{badge('Primera sesión', '4 sept')}{badge('Primer kilo', '8 sept')}{badge('Semana perfecta', '14 sept')}</ul>
        </section>
        <section style="display: flex; flex-direction: column; gap: 4px;">
          {label('Las más cerca', 'Ver las 21')}
          <ul style="margin: 0; padding: 0; list-style: none;">{near('Hábito formado', '7 de 10 sesiones', 7, 10)}{near('Cien series', '78 de 100', 78, 100)}{near('Todos los lunes', '2 de 4', 2, 4)}</ul>
        </section>
      </div>
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Historial', 'Septiembre')}
        <ul style="margin: 0; padding: 0; list-style: none;">{item('Mar 15', 'Entrenamiento personal', 34)}{item('Lun 14', 'Entrenamiento personal', 29)}{item('Dom 13', 'Entrenamiento personal', 34)}{item('Sáb 12', 'Entrenamiento personal', 33)}{item('Vie 11', 'Entrenamiento personal', 34)}{item('Jue 10', 'Entrenamiento personal', 35)}</ul>
      </section>
    </div>"""
    return desktop('Progreso', body, nav=STUDENT_NAV, badge='', person=('JP', 'Juan Pérez'), role='Alumno')


def d_nueva_rutina():
    def exercise_row(name, dose):
        return f'<li style="display: grid; grid-template-columns: 24px minmax(0, 1fr) auto 36px; align-items: center; gap: 8px; min-height: 48px; border-bottom: 1px solid {TINT3};"><span style="color: {INK35}; display: flex;">{ic("grip", 18)}</span><span style="font-size: 15px; font-weight: 600;">{name}</span><span style="font-family: {DISPLAY}; font-size: 15px; font-weight: 700;">{dose}</span><span style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: {INK45};">{ic("chevron-down", 18)}</span></li>'
    identity = f"""
      <aside style="width: 360px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px;">
        {label('La rutina')}
        {field('Nombre', 'Full body · Principiante')}
        <label style="display: flex; flex-direction: column; gap: 6px;"><span style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Descripción</span><span style="display: block; min-height: 88px; padding: 10px 12px; border: 1px solid {TINT3}; border-radius: 6px; background: {SURFACE}; font-size: 15px; line-height: 1.4;">Base de fuerza con los patrones fundamentales.</span></label>
        {field('Nivel', 'Principiante', kind='select')}
        {strip([('Ejercicios', '3', ''), ('Duración', '6', 'min')])}
      </aside>"""
    blocks = f"""
      <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px;">
        {label('Bloques', '1')}
        <section style="border: 1px solid {TINT3}; background: {SURFACE}; padding: 14px 18px 16px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-family: {DISPLAY}; font-size: 20px; font-weight: 800; text-transform: uppercase;"><span style="color: {COBALT};">01</span> Bloque</span>
            <span style="display: flex; gap: 8px;">{field('Método', 'Serie simple', kind='select', width='200px')}{field('Descanso tras la ronda', '90 s', width='160px')}</span>
          </div>
          <ul style="margin: 0; padding: 0; list-style: none;">
            {exercise_row('Sentadilla con barra', '3 × 8-10 · RIR 2')}
            <li style="padding: 12px 0 14px; border-bottom: 1px solid {TINT3}; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: grid; grid-template-columns: 24px minmax(0, 1fr) 36px; align-items: center; gap: 8px;"><span style="color: {INK35}; display: flex;">{ic('grip', 18)}</span><span style="font-size: 15px; font-weight: 600;">Press de banca con barra</span><span style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: {INK45};">{ic('chevron-up', 18)}</span></div>
              <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px;">{field('Series', '3')}{field('Reps', '8-10')}{field('RIR', '2')}{field('Peso (kg)', '', 'Opcional')}{field('Descanso (s)', '90')}{field('Tempo', '', '3-1-1-0')}</div>
              {field('Indicaciones', '', 'Para el alumno: «sin rebote abajo»')}
            </li>
            {exercise_row('Remo con barra', '3 × 10-12 · RIR 2')}
          </ul>
          {desktop_button('Añadir ejercicio al bloque 1', 'secondary', 'plus')}
        </section>
        <div style="display: flex; gap: 8px;">{desktop_button('Añadir bloque', 'secondary', 'plus')}{desktop_button('Insertar guardado', 'secondary', 'library')}</div>
      </div>"""
    body = desktop_header('Lo que asignas', 'Nueva rutina', desktop_button('Cancelar', 'secondary') + desktop_button('Guardar rutina', 'primary', 'check'), back='Rutinas') + f"""
    <!-- Sin pasos en escritorio: la rutina a la izquierda, fija, y los bloques a
         la derecha. Y «Más ajustes» no hace falta: los seis campos del ejercicio
         caben en una fila de 1.000 px. -->
    <div style="display: flex; gap: 48px; padding: 0 36px 36px;">{identity}{blocks}</div>"""
    return desktop('Entrenamientos', body)


def d_configuracion():
    def rail_item(icon_name, text, on=False):
        style = f'background: {SURFACE}; box-shadow: 0 1px 2px rgba(10,18,36,0.08); color: {INK};' if on else f'color: {INK60};'
        return f'<a href="#" style="display: flex; align-items: center; gap: 12px; height: 40px; padding: 0 12px; border-radius: 6px; font-size: 14px; font-weight: 500; {style}">{ic(icon_name, 16)}{text}</a>'
    def theme_card(icon_name, text, on=False):
        ring = f'border: 2px solid {COBALT};' if on else f'border: 1px solid {TINT3};'
        return f'<label style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px 12px; border-radius: 6px; background: {SURFACE}; {ring}">{ic(icon_name, 22, COBALT if on else INK60)}<span style="font-size: 14px; font-weight: 600;">{text}</span></label>'
    body = desktop_header('Tu cuenta', 'Configuración') + f"""
    <!-- La lista de ajustes del móvil es aquí el carril de la izquierda; el
         grupo elegido se edita a la derecha, sin salir de la pantalla. -->
    <div style="display: grid; grid-template-columns: 240px minmax(0, 640px); gap: 48px; padding: 0 36px 36px;">
      <nav style="display: flex; flex-direction: column; gap: 2px; padding: 3px; border-radius: 6px; background: {MUTED}; height: fit-content;">
        {rail_item('user', 'Perfil')}{rail_item('monitor', 'Apariencia', True)}{rail_item('volume', 'Entrenamiento')}{rail_item('users', 'Equipo')}{rail_item('lock', 'Cuenta')}
      </nav>
      <div style="display: flex; flex-direction: column; gap: 28px;">
        <section style="display: flex; flex-direction: column; gap: 12px;">
          {label('Tema')}
          <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;">{theme_card('sun', 'Claro')}{theme_card('monitor', 'Sistema', True)}{theme_card('moon', 'Oscuro')}</div>
          <p style="margin: 0; font-size: 13px; color: {INK60};">Con «Sistema» sigue el modo de tu dispositivo y cambia solo.</p>
        </section>
        <section style="display: flex; flex-direction: column; gap: 12px;">
          {label('Idioma')}
          <div style="display: flex; gap: 8px;">{chip('Español', on=True)}{chip('English')}{chip('Português')}</div>
          <p style="margin: 0; font-size: 13px; color: {INK60};">Cambia lo que escribe la aplicación, no lo que hayas escrito tú: nombres, rutinas y anuncios se quedan como están.</p>
        </section>
      </div>
    </div>"""
    return desktop('Configuración', body)


# ============================================================ lo que faltaba

def sheet_with_actions(title, body_html, actions_html, hint='', pill_html=''):
    """Como `sheet`, pero con el pie de acciones a medida: la ficha de sesión tiene cuatro y no dos."""
    hint_html = f'<p style="margin: 0; font-size: 13px; color: {INK60}; line-height: 1.45;">{hint}</p>' if hint else ''
    return f"""
      <div style="position: absolute; inset: 0; background: rgba(10,18,36,0.45);"></div>
      <div style="position: absolute; left: 0; right: 0; bottom: 0; max-height: 90%; background: {SURFACE}; border-radius: 16px 16px 0 0; display: flex; flex-direction: column; gap: 14px; padding: 8px 20px 20px; box-shadow: 0 -8px 32px rgba(10,18,36,0.18);">
        <span style="align-self: center; width: 36px; height: 4px; border-radius: 999px; background: {TINT3};"></span>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <h2 style="margin: 0; font-family: {DISPLAY}; font-size: 24px; font-weight: 800; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase;">{title}</h2>
          {pill_html}
        </div>
        {hint_html}
        {body_html}
        {actions_html}
      </div>"""


def hoja_sesion_detalle():
    def fact(lab, value):
        return f'<div style="display: flex; flex-direction: column; gap: 4px;"><span style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">{lab}</span><span style="font-size: 15px; font-weight: 600; line-height: 1.35;">{value}</span></div>'
    body = f"""
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px;">
        {fact('Cuándo', 'Mié 16 sept · 18:00<br><span style="font-weight: 500; color: ' + INK60 + ';">60 min</span>')}
        {fact('Dónde y con quién', 'Gimnasio Principal<br><span style="font-weight: 500; color: ' + INK60 + ';">María Gómez</span>')}
      </div>
      <ul style="margin: 0; padding: 0; list-style: none;">
        {row('Full body · Principiante', 'Rutina · 4 ejercicios · 25 min', leading=f'<span style="color: {COBALT}; display: flex;">{ic("dumbbell", 18)}</span>', min_height=52)}
      </ul>
      <label style="display: flex; flex-direction: column; gap: 6px;"><span style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Notas</span><span style="display: block; min-height: 56px; padding: 10px 12px; border: 1px solid {TINT3}; border-radius: 6px; background: {BONE}; font-size: 15px; line-height: 1.4;">Enfoque en tren superior.</span></label>"""
    actions = f"""
      <div style="display: flex; flex-direction: column; gap: 8px; padding-top: 4px;">
        {button('Iniciar sesión', 'primary', 'flame', full=True)}
        <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">
          {button('Recordar', 'secondary', 'bell', full=True)}
          {button('Editar', 'secondary', 'pencil', full=True)}
          <button type="button" style="height: 44px; padding: 0 12px; border: 1px solid {TINT3}; border-radius: 999px; background: {SURFACE}; color: {DANGER}; font-family: {SANS}; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">{ic('trash', 18)}Eliminar</button>
        </div>
      </div>"""
    base = cab.header('Agenda', 'Mié, 16 sept', cab.primary_pill('plus', 'Sesión')) + segmented(['Lista', 'Horario'], 'Lista') + scroll(f"""
      <ul style="margin: 0; padding: 0; list-style: none;">{session_row('18:00', 'María Gómez', 'Entrenamiento personal · 60 min · Gimnasio', 'Confirmada', SUCCESS)}</ul>""")
    return screen_with_sheet('Calendario', base, sheet_with_actions('Entrenamiento personal', body, actions, pill_html=pill('Confirmada', SUCCESS)))


def avisos():
    def notice(icon_name, color, title, text, when, unread=False):
        dot = f'<span style="width: 8px; height: 8px; border-radius: 999px; background: {EMBER}; flex-shrink: 0;"></span>' if unread else '<span style="width: 8px;"></span>'
        return f"""
        <li style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid {TINT3};">
          <span style="width: 40px; height: 40px; border-radius: 999px; background: {TINT2}; color: {color}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">{ic(icon_name, 18)}</span>
          <span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px;">
            <span style="display: flex; justify-content: space-between; gap: 8px;"><span style="font-size: 15px; font-weight: 600;">{title}</span><span style="font-size: 12px; color: {INK60}; white-space: nowrap;">{when}</span></span>
            <span style="font-size: 13px; color: {INK60}; line-height: 1.4;">{text}</span>
          </span>
          {dot}
        </li>"""
    body = cab.header('Tu campana · 2 sin leer', 'Avisos', cab.icon_button('check', 'Marcar todos como leídos')) + scroll(f'''
      <!-- En móvil la campana abre una PANTALLA, no el desplegable de 320 px
           de escritorio: a 390 px un popover es un cuadro con barras de
           desplazamiento propias y sin sitio para el texto de un aviso. Cada
           aviso dice de qué va (icono), qué toca hacer y cuándo llegó. -->
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Hoy')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {notice('card', WARNING, 'Tu cuota vence en 3 días', 'Mensual · hasta el viernes 18. Habla con Marco si necesitas cambiarla.', '09:12', True)}
          {notice('megaphone', COBALT, 'Marco te ha escrito', 'Trae la banda elástica al bloque de movilidad del jueves.', '08:40', True)}
        </ul>
      </section>
      <section style="display: flex; flex-direction: column; gap: 4px;">
        {label('Antes')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {notice('users', SUCCESS, 'Ya estás dentro de Hierro y Asfalto', 'Tu entrenador ya puede asignarte entrenamientos y agendarte sesiones.', 'Lun 7')}
          {notice('calendar', COBALT, 'Sesión movida al martes', 'Entrenamiento personal · martes 8 · 18:00, Gimnasio Principal.', 'Dom 6')}
        </ul>
      </section>''', gap=16)
    return screen('', body, badge='', tabs=STUDENT_TABS)


def empty_block(icon_name, title, text, primary_label, primary_icon, secondary_label):
    """Un estado vacío dice tres cosas: que no hay nada, qué hacer primero y por dónde. Ni ilustración ni chiste."""
    return f"""
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 14px; padding: 28px 0 0;">
        <span style="width: 56px; height: 56px; border-radius: 999px; background: {TINT2}; color: {COBALT}; display: flex; align-items: center; justify-content: center;">{ic(icon_name, 26, COBALT, 1.75)}</span>
        <span style="font-family: {DISPLAY}; font-size: 26px; font-weight: 800; line-height: 1; text-transform: uppercase; letter-spacing: -0.01em;">{title}</span>
        <p style="margin: 0; font-size: 15px; line-height: 1.5; color: {INK60}; max-width: 320px;">{text}</p>
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; padding-top: 6px;">
          {button(primary_label, 'primary', primary_icon, full=True)}
          <a href="#" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; font-size: 14px; font-weight: 600;">{secondary_label} {ic('arrow-up-right', 16)}</a>
        </div>
      </div>"""


def estudiantes_vacio():
    body = cab.header('Tu equipo · 0', 'Estudiantes', cab.primary_pill('plus', 'Alumno')) + scroll(
        empty_block('users', 'Todavía no hay nadie', 'Da de alta a tu primer alumno con su correo. Cuando se registre con ese mismo correo, su cuenta queda enlazada a la ficha sola.', 'Añadir alumno', 'plus', 'O comparte el código del equipo'))
    return screen('Estudiantes', body, badge='')


def entrenamientos_vacio():
    body = cab.header('Lo que asignas', 'Entrenamientos', cab.icon_button('library', 'Catálogo') + cab.primary_pill('plus', 'Rutina')) + segmented(['Rutinas · 0', 'Planes · 0'], 'Rutinas · 0') + scroll(
        empty_block('dumbbell', 'Tu primera rutina', 'Una rutina son bloques de ejercicios del catálogo, con sus series y repeticiones. Créala una vez y asígnala desde la ficha de cada alumno.', 'Nueva rutina', 'plus', 'Ver el catálogo de ejercicios'))
    return screen('Entrenamientos', body, badge='')


def agenda_vacia():
    header = f"""
    <header style="flex-shrink: 0; padding: 12px 20px 12px; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px;">
        {cab.eyebrow('Agenda')}
        <div style="display: flex; align-items: center; gap: 8px;"><button type="button" style="height: 44px; padding: 0 16px; border: 1px solid {COBALT}; border-radius: 999px; background: transparent; color: {COBALT}; font-family: {SANS}; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">Hoy</button>{cab.primary_pill('plus', 'Sesión')}</div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        {cab.title('Mar, 15 sept')}
        <div style="display: flex; gap: 4px;">{cab.icon_button('chevron-left', 'Día anterior')}{cab.icon_button('chevron-right', 'Día siguiente')}</div>
      </div>
    </header>"""
    body = header + segmented(['Lista', 'Horario'], 'Lista') + scroll(
        empty_block('calendar', 'Hoy no hay sesiones', 'Agenda una desde aquí, o vuelca un plan entero desde la ficha de un alumno y la agenda se llena sola.', 'Nueva sesión', 'plus', 'Ir a mañana'))
    return screen('Calendario', body, badge='')


# ---------------------------------------------------------------- oscuro

def hsl_hex(h, s, l):
    import colorsys
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return '#%02X%02X%02X' % (round(r * 255), round(g * 255), round(b * 255))


def hsl_rgb(h, s, l):
    import colorsys
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return round(r * 255), round(g * 255), round(b * 255)


DARK_BONE = hsl_hex(222, 30, 7)
DARK_INK = hsl_hex(36, 25, 93)
DARK_COBALT = hsl_hex(215, 88, 62)
DARK_SURFACE = hsl_hex(222, 26, 11)
DARK_MUTED = hsl_hex(222, 22, 16)
DARK_EMBER = hsl_hex(14, 100, 63)
DARK_SUCCESS = hsl_hex(142, 62, 52)
DARK_WARNING = hsl_hex(38, 92, 58)
DARK_DANGER = hsl_hex(0, 84, 65)
_cobalt = hsl_rgb(215, 88, 62)
_ink = hsl_rgb(36, 25, 93)


def darken(html):
    """
    El mismo artboard con los tokens del tema oscuro de `index.css` (`.dark`).
    Se sustituyen los valores literales, en el mismo orden en que los define
    el CSS: bone e ink intercambian papel, Cobalt sube de luminosidad, los
    tintes suben de opacidad y los estados se aclaran.
    """
    replacements = [
        (TINT3, f'rgba({_cobalt[0]},{_cobalt[1]},{_cobalt[2]},0.30)'),
        (TINT2, f'rgba({_cobalt[0]},{_cobalt[1]},{_cobalt[2]},0.18)'),
        (TINT1, f'rgba({_cobalt[0]},{_cobalt[1]},{_cobalt[2]},0.10)'),
        (INK60, f'rgba({_ink[0]},{_ink[1]},{_ink[2]},0.6)'),
        (INK45, f'rgba({_ink[0]},{_ink[1]},{_ink[2]},0.45)'),
        (INK35, f'rgba({_ink[0]},{_ink[1]},{_ink[2]},0.35)'),
        ('rgba(10,18,36,0.08)', 'rgba(0,0,0,0.4)'),
        (BONE, DARK_BONE),
        (INK, DARK_INK),
        (COBALT, DARK_COBALT),
        (SURFACE, DARK_SURFACE),
        (MUTED, DARK_MUTED),
        (EMBER, DARK_EMBER),
        (SUCCESS, DARK_SUCCESS),
        (WARNING, DARK_WARNING),
        (DANGER, DARK_DANGER),
    ]
    for old, new in replacements:
        html = html.replace(old, new)
    return html


def dashboard_oscuro():
    return darken(dashboard())


def ficha_oscura():
    return darken(ficha_resumen())


def agenda_oscura():
    return darken(agenda())


# ============================================================ salida

ARTBOARDS = {
    'Main.dc.html': dashboard,
    'Estudiantes.dc.html': estudiantes,
    'FichaAlumno.dc.html': ficha_resumen,
    'FichaAlumnoProgreso.dc.html': ficha_progreso,
    'Entrenamientos.dc.html': entrenamientos,
    'Rutina.dc.html': rutina,
    'NuevaRutina.dc.html': nueva_rutina,
    'Plan.dc.html': plan,
    'Agenda.dc.html': agenda,
    'Equipo.dc.html': equipo_muro,
    'EquipoMiembros.dc.html': equipo_miembros,
    'Progreso.dc.html': progreso,
    'Insignias.dc.html': insignias,
    'Configuracion.dc.html': configuracion,
    'Patrones.dc.html': patrones,
    # secciones que no se ven de primeras, y las hojas
    'FichaAlumnoSesiones.dc.html': ficha_sesiones,
    'FichaAlumnoCuota.dc.html': ficha_cuota,
    'EquipoRanking.dc.html': equipo_ranking,
    'EquipoInvitar.dc.html': equipo_invitar,
    'ProgresoHistorial.dc.html': progreso_historial,
    'HojaSesion.dc.html': hoja_sesion,
    'HojaPago.dc.html': hoja_pago,
    'HojaAsignar.dc.html': hoja_asignar,
    'HojaEliminar.dc.html': hoja_eliminar,
    # escritorio
    'EscritorioEstudiantes.dc.html': d_estudiantes,
    'EscritorioFicha.dc.html': d_ficha,
    'EscritorioEquipo.dc.html': d_equipo,
    'EscritorioProgreso.dc.html': d_progreso,
    'EscritorioNuevaRutina.dc.html': d_nueva_rutina,
    'EscritorioConfiguracion.dc.html': d_configuracion,
    # lo que faltaba: la hoja de sesión, la campana, los vacíos y el oscuro
    'HojaSesionDetalle.dc.html': hoja_sesion_detalle,
    'Avisos.dc.html': avisos,
    'EstudiantesVacio.dc.html': estudiantes_vacio,
    'EntrenamientosVacio.dc.html': entrenamientos_vacio,
    'AgendaVacia.dc.html': agenda_vacia,
    'OscuroDashboard.dc.html': dashboard_oscuro,
    'OscuroFicha.dc.html': ficha_oscura,
    'OscuroAgenda.dc.html': agenda_oscura,
}

if __name__ == '__main__':
    for name, build in ARTBOARDS.items():
        with io.open(os.path.join(HERE, name), 'w', encoding='utf-8', newline='\n') as handle:
            handle.write(build())
        print('escrito', name)
