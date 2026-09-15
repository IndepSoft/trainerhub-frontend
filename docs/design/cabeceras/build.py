# -*- coding: utf-8 -*-
"""
Genera los artboards de la propuesta de cabeceras compactas.

Un solo shell -navbar de 64 px, barra inferior de 60 px, tokens- y un cuerpo
por pantalla, para que las seis compartan exactamente el mismo cromo y lo
unico que cambie sea lo que se propone.
"""
import io, sys, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- tokens
BONE = '#FAF8F5'
INK = '#0A1224'
COBALT = '#0B4BCC'
EMBER = '#FF4F1A'
TINT3 = 'rgba(11,75,204,0.24)'   # cobalt-tint-3: bordes y reglas
TINT2 = 'rgba(11,75,204,0.12)'
TINT1 = 'rgba(11,75,204,0.06)'
INK60 = 'rgba(10,18,36,0.6)'
INK45 = 'rgba(10,18,36,0.45)'
INK35 = 'rgba(10,18,36,0.35)'

DISPLAY = "'Barlow Condensed', 'Arial Narrow', sans-serif"
SANS = "'Barlow', system-ui, sans-serif"

HEAD = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;500;600&display=swap">
  <style>
    body {{ margin: 0; background: {BONE}; font-family: {SANS}; -webkit-font-smoothing: antialiased; color: {INK}; }}
    a {{ color: {COBALT}; text-decoration: none; }}
    a:hover {{ color: #0A3FAE; }}
    input::placeholder {{ color: {INK35}; }}
  </style>
</helmet>
"""

FOOT = """</x-dc>
</body>
</html>
"""

# Iconos: trazo lucide, 24 en la rejilla, recolorean por currentColor
def icon(name, size=20, stroke='currentColor', width=2):
    paths = {
        'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>',
        'chevrons': '<path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path>',
        'home': '<path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path><path d="M10 21v-6h4v6"></path>',
        'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
        'dumbbell': '<path d="M6.5 6.5 17.5 17.5"></path><path d="m21 21-1-1"></path><path d="m3 3 1 1"></path><path d="m18 22 4-4"></path><path d="m2 6 4-4"></path><path d="m3 10 7-7"></path><path d="m14 21 7-7"></path>',
        'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h18"></path>',
        'plus': '<path d="M5 12h14"></path><path d="M12 5v14"></path>',
        'library': '<path d="m16 6 4 14"></path><path d="M12 6v14"></path><path d="M8 8v12"></path><path d="M4 4v16"></path>',
        'settings': '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
        'userplus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M19 8v6"></path><path d="M22 11h-6"></path>',
        'search': '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
        'chevron-down': '<path d="m6 9 6 6 6-6"></path>',
        'chevron-left': '<path d="m15 18-6-6 6-6"></path>',
        'chevron-right': '<path d="m9 18 6-6-6-6"></path>',
        'arrow-up-right': '<path d="M7 7h10v10"></path><path d="M7 17 17 7"></path>',
        'megaphone': '<path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>',
        'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>',
        'trash': '<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>',
        'more': '<circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle>',
        'bicep': '<path d="M12.4 3.2c-1.6-.7-3.4 0-4.2 1.5L5 11l-1.5 1c-1.3.9-1.9 2.5-1.4 4l.6 1.7c.6 1.7 2.2 2.8 4 2.8h5.6c2.6 0 5-1.6 5.9-4.1l1.3-3.5c.6-1.6-.2-3.4-1.8-4l-1.7-.6c-.9-.3-1.4-1.3-1.1-2.2l.5-1.5c.3-.9-.2-1.8-1-2.1Z"></path>',
    }
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{stroke}" '
            f'stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0;">{paths[name]}</svg>')


def navbar(badge='2'):
    """La barra superior de la app, calcada: 64 px, crew a la izquierda, campana y avatar a la derecha."""
    badge_html = (f'<span style="position: absolute; top: -4px; right: -6px; min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; background: {EMBER}; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;">{badge}</span>'
                  if badge else '')
    return f"""
  <header style="height: 64px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 16px; border-bottom: 1px solid {TINT3}; background: {BONE};">
    <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
      <span style="position: relative; width: 40px; height: 40px; border-radius: 999px; background: {COBALT}; color: #fff; font-family: {DISPLAY}; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">HY{badge_html}</span>
      <span style="display: flex; flex-direction: column; min-width: 0;">
        <span style="font-size: 15px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Hierro y Asfalto</span>
        <span style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK45}; line-height: 1.4;">Crew · Administrador</span>
      </span>
      <span style="color: {INK45}; display: flex;">{icon('chevrons', 16)}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
      <button type="button" aria-label="Avisos" style="width: 44px; height: 44px; border: 0; background: transparent; color: {INK}; display: flex; align-items: center; justify-content: center; cursor: pointer;">{icon('bell', 22)}</button>
      <span style="width: 40px; height: 40px; border-radius: 999px; background: {TINT2}; color: {COBALT}; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center;">MS</span>
    </div>
  </header>"""


TABS = [('home', 'Dashboard'), ('users', 'Estudiantes'), ('dumbbell', 'Entrenamientos'), ('calendar', 'Calendario'), ('users', 'Equipo')]


def tabbar(active):
    items = []
    for name, label in TABS:
        on = label == active
        color = COBALT if on else INK60
        bar = f'<span style="position: absolute; top: -1px; left: 12px; right: 12px; height: 2px; background: {COBALT};"></span>' if on else ''
        items.append(f"""
      <li style="flex: 1; position: relative;">{bar}
        <a href="#" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 58px; padding: 6px 2px; color: {color};">
          {icon(name, 24)}
          <span style="font-size: 9.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap;">{label}</span>
        </a>
      </li>""")
    return f"""
  <nav style="flex-shrink: 0; border-top: 1px solid {TINT3}; background: {BONE};">
    <ul style="display: flex; margin: 0; padding: 0; list-style: none;">{''.join(items)}
    </ul>
  </nav>"""


def eyebrow(text):
    return f'<p style="margin: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {INK45};">{text}</p>'


def title(text):
    return f'<h1 style="margin: 0; font-family: {DISPLAY}; font-size: 36px; font-weight: 800; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; color: {INK};">{text}</h1>'


def icon_button(name, label):
    """Acción secundaria: 44 px, solo icono, con nombre accesible."""
    return (f'<button type="button" aria-label="{label}" title="{label}" style="width: 44px; height: 44px; border: 1px solid {TINT3}; border-radius: 999px; '
            f'background: transparent; color: {INK}; display: flex; align-items: center; justify-content: center; cursor: pointer;">{icon(name, 20)}</button>')


def primary_pill(name, label):
    """Acción primaria: píldora Cobalt compacta, icono y una palabra."""
    return (f'<button type="button" style="height: 44px; padding: 0 16px 0 12px; border: 0; border-radius: 999px; background: {COBALT}; color: #fff; '
            f'font-family: {SANS}; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;">{icon(name, 18, "#fff", 2.25)}{label}</button>')


def header(eyebrow_text, title_text, actions_html=''):
    """
    LA CABECERA PROPUESTA. Una fila de eyebrow con las acciones a la derecha,
    y el título debajo a todo el ancho. Las acciones nunca apilan.
    """
    actions = f'<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">{actions_html}</div>' if actions_html else ''
    row_h = '44px' if actions_html else 'auto'
    return f"""
    <header style="flex-shrink: 0; padding: 12px 20px 14px; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: {row_h};">
        {eyebrow(eyebrow_text)}
        {actions}
      </div>
      {title(title_text)}
    </header>"""


def section_label(text, trailing=''):
    tr = f'<span style="font-size: 14px; font-weight: 600; color: {COBALT};">{trailing}</span>' if trailing else ''
    return f"""
      <div style="display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid {TINT3};">
        <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {INK60};">{text}</span>{tr}
      </div>"""


def shell(active_tab, body, badge='2'):
    return (HEAD + f'<div style="width: 390px; height: 844px; display: flex; flex-direction: column; background: {BONE}; overflow: hidden;">'
            + navbar(badge) + f'<main style="flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;">' + body + '</main>' + tabbar(active_tab) + '</div>' + FOOT)


def search_and_filter(placeholder, filter_label):
    """Buscador y filtro en UNA fila, no en dos: el filtro es corto y cabe al lado."""
    return f"""
      <div style="display: flex; gap: 8px; padding: 0 20px;">
        <label style="flex: 1; display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px; border: 1px solid {TINT3}; border-radius: 6px; background: #fff; color: {INK45};">
          {icon('search', 18)}
          <input type="search" placeholder="{placeholder}" style="flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font-family: {SANS}; font-size: 15px; color: {INK};">
        </label>
        <button type="button" style="height: 44px; padding: 0 12px; border: 1px solid {TINT3}; border-radius: 6px; background: #fff; color: {INK}; font-family: {SANS}; font-size: 14px; display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;">{filter_label}{icon('chevron-down', 16, INK45)}</button>
      </div>"""


# ============================================================ pantallas

def dashboard():
    def kpi(label, value, name):
        return f"""
          <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60}; line-height: 1.3;">{label}</span>
              <span style="color: {COBALT}; display: flex;">{icon(name, 16)}</span>
            </div>
            <span style="font-family: {DISPLAY}; font-size: 34px; font-weight: 800; line-height: 1; color: {INK};">{value}</span>
          </div>"""

    def pending(text):
        return f"""
        <li style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; padding: 0 4px; border-bottom: 1px solid {TINT3};">
          <span style="font-size: 15px;">{text}</span>
          <span style="color: {INK45}; display: flex;">{icon('arrow-up-right', 18)}</span>
        </li>"""

    def session(time, who, what, status, color):
        return f"""
        <li style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid {TINT3};">
          <span style="width: 10px; height: 10px; border-radius: 999px; background: {color}; margin-top: 5px; flex-shrink: 0;"></span>
          <span style="flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;">
            <span style="font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {INK45};">{time}</span>
            <span style="font-size: 15px; font-weight: 600;">{who}</span>
            <span style="font-size: 13px; color: {INK60};">{what}</span>
          </span>
          <span style="align-self: center; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: {color}; border: 1px solid {color}; border-radius: 999px; padding: 4px 10px; white-space: nowrap;">{status}</span>
        </li>"""

    body = header('Tu actividad', 'Dashboard') + f"""
    <div style="flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 22px; padding-bottom: 20px;">

      <!-- Las tres cifras en una franja, no en tres bloques apilados: es la
           rejilla de dos columnas con reglas que ya usan las tarjetas, y la
           tercera cierra la fila de abajo a todo el ancho en formato compacto. -->
      <dl style="margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid {TINT3}; border-bottom: 1px solid {TINT3};">
        <div style="border-right: 1px solid {TINT3};">{kpi('Estudiantes', '4', 'users')}</div>
        <div>{kpi('Sesiones esta semana', '6', 'calendar')}</div>
        <div style="grid-column: span 2; border-top: 1px solid {TINT3}; display: flex; align-items: center; justify-content: space-between; padding: 10px 16px;">
          <span style="display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">{icon('bicep', 16, COBALT)}Rutinas creadas</span>
          <span style="font-family: {DISPLAY}; font-size: 26px; font-weight: 800; line-height: 1;">3</span>
        </div>
      </dl>

      <section style="padding: 0 20px; display: flex; flex-direction: column; gap: 4px;">
        {section_label('Pendientes', '5')}
        <p style="margin: 8px 0 4px; font-size: 13px; color: {INK45};">Lo que espera una decisión tuya.</p>
        <ul style="margin: 0; padding: 0; list-style: none;">
          {pending('1 cuota vencida')}
          {pending('4 alumnos sin cuenta')}
        </ul>
      </section>

      <section style="padding: 0 20px; display: flex; flex-direction: column; gap: 4px;">
        {section_label('Próximas sesiones', '3')}
        <ul style="margin: 0; padding: 0; list-style: none;">
          {session('Mié, 9 sept · 09:00', 'María Gómez', 'Entrenamiento Personal', 'Confirmada', '#1B6E3C')}
          {session('Mié, 9 sept · 10:30', 'Carlos López', 'Evaluación Inicial', 'Pendiente', '#B05A00')}
          {session('Mié, 9 sept · 18:00', 'Clase grupal', 'Clase Grupal', 'Confirmada', '#1B6E3C')}
        </ul>
      </section>
    </div>"""
    return shell('Dashboard', body, badge='5')


def student_card(initials, name, email, age, fat, level, xp, sessions):
    return f"""
        <article style="border: 1px solid {TINT3}; background: #fff; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px 0;">
            <span style="width: 40px; height: 40px; border-radius: 999px; background: {TINT2}; color: {COBALT}; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">{initials}</span>
            <span style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
              <span style="font-family: {DISPLAY}; font-size: 24px; font-weight: 800; line-height: 1; text-transform: uppercase; letter-spacing: -0.01em;">{name}</span>
              <span style="font-size: 12px; color: {INK45};">{email}</span>
            </span>
            <button type="button" aria-label="Acciones" style="width: 44px; height: 44px; border: 0; background: transparent; color: {INK45}; display: flex; align-items: center; justify-content: center; cursor: pointer;">{icon('more', 20)}</button>
          </div>
          <dl style="margin: 14px 0 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid {TINT3};">
            <div style="padding: 10px 16px; border-right: 1px solid {TINT3};"><dt style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Edad</dt><dd style="margin: 4px 0 0; font-family: {DISPLAY}; font-size: 22px; font-weight: 800; line-height: 1;">{age} <span style="font-size: 12px; font-family: {SANS}; font-weight: 500; color: {INK45};">años</span></dd></div>
            <div style="padding: 10px 16px;"><dt style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Grasa</dt><dd style="margin: 4px 0 0; font-family: {DISPLAY}; font-size: 22px; font-weight: 800; line-height: 1;">{fat} <span style="font-size: 12px; font-family: {SANS}; font-weight: 500; color: {INK45};">%</span></dd></div>
          </dl>
          <div style="padding: 10px 16px 14px; border-top: 1px solid {TINT3}; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <span style="display: flex; flex-direction: column; gap: 6px; flex: 1;">
              <span style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};"><span>Nivel {level}</span><span style="text-transform: none; letter-spacing: 0; font-weight: 500; color: {INK45};">{sessions} sesiones</span></span>
              <span style="height: 6px; background: {TINT2}; border-radius: 999px; overflow: hidden; display: block;"><span style="display: block; height: 100%; width: {xp}%; background: {COBALT};"></span></span>
            </span>
          </div>
        </article>"""


def estudiantes():
    body = header('Tu equipo · 4', 'Estudiantes', primary_pill('plus', 'Alumno')) + f"""
    <div style="flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 20px;">
      {search_and_filter('Buscar estudiante…', 'Nivel')}
      <div style="padding: 0 20px; display: flex; flex-direction: column; gap: 12px;">
        {student_card('JP', 'Juan Pérez', 'jperez@gmail.com', '28', '22', '3', 38, '10')}
        {student_card('MG', 'María Gómez', 'mgomez@gmail.com', '34', '19', '5', 62, '24')}
      </div>
    </div>"""
    return shell('Estudiantes', body, badge='5')


def routine_card(name, exercises, minutes, rows):
    lines = ''.join(f'<li style="display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; font-size: 14px;"><span>{a}</span><span style="color: {INK45}; white-space: nowrap;">{b}</span></li>' for a, b in rows)
    return f"""
        <article style="border: 1px solid {TINT3}; background: #fff; position: relative; overflow: hidden; isolation: isolate;">
          <div aria-hidden="true" style="position: absolute; left: -15%; right: -15%; top: 26px; height: 60px; background: rgba(255,79,26,0.10); clip-path: polygon(0 42%, 100% 0, 100% 58%, 0 100%); z-index: -1;"></div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 0;">
            <span style="display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {INK45};">{icon('dumbbell', 14)}Rutina</span>
            <button type="button" aria-label="Acciones" style="width: 44px; height: 44px; margin: -10px -12px -10px 0; border: 0; background: transparent; color: {INK45}; display: flex; align-items: center; justify-content: center; cursor: pointer;">{icon('more', 20)}</button>
          </div>
          <h3 style="margin: 4px 16px 12px; font-family: {DISPLAY}; font-size: 26px; font-weight: 800; line-height: 1; text-transform: uppercase; letter-spacing: -0.01em;">{name}</h3>
          <dl style="margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid {TINT3};">
            <div style="padding: 10px 16px; border-right: 1px solid {TINT3};"><dt style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Ejercicios</dt><dd style="margin: 4px 0 0; font-family: {DISPLAY}; font-size: 22px; font-weight: 800; line-height: 1;">{exercises}</dd></div>
            <div style="padding: 10px 16px;"><dt style="font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {INK60};">Duración</dt><dd style="margin: 4px 0 0; font-family: {DISPLAY}; font-size: 22px; font-weight: 800; line-height: 1;">{minutes} <span style="font-size: 12px; font-family: {SANS}; font-weight: 500; color: {INK45};">min</span></dd></div>
          </dl>
          <ul style="margin: 0; padding: 6px 16px 10px; list-style: none; border-top: 1px solid {TINT3};">{lines}</ul>
        </article>"""


def tabs(items, active):
    cells = []
    for label in items:
        on = label == active
        style = (f'background: #fff; color: {INK}; box-shadow: 0 1px 2px rgba(10,18,36,0.08);' if on else f'background: transparent; color: {INK60};')
        cells.append(f'<button type="button" style="flex: 1; min-height: 40px; border: 0; border-radius: 6px; font-family: {SANS}; font-size: 14px; font-weight: 500; cursor: pointer; {style}">{label}</button>')
    return f'<div role="tablist" style="display: flex; gap: 2px; padding: 3px; margin: 0 20px; border-radius: 8px; background: {TINT1};">{"".join(cells)}</div>'


def entrenamientos():
    body = header('Lo que asignas', 'Entrenamientos', icon_button('library', 'Catálogo') + primary_pill('plus', 'Rutina')) + f"""
    <div style="flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 20px;">
      {tabs(['Rutinas (3)', 'Planes (1)'], 'Rutinas (3)')}
      {search_and_filter('Buscar rutinas…', 'Nivel')}
      <div style="padding: 0 20px; display: flex; flex-direction: column; gap: 12px;">
        {routine_card('Full Body · Principiante', '4', '25', [('Sentadilla con barra', '3 × 8–10 · RIR 3'), ('Press de banca con barra', '3 × 8–10 · RIR 3'), ('Remo con barra', '3 × 10–12 · RIR 3'), ('+1 ejercicio más', '')])}
        {routine_card('Empuje · Intermedio', '5', '40', [('Press militar', '4 × 6–8 · RIR 2'), ('Press inclinado', '3 × 8–10 · RIR 2'), ('+3 ejercicios más', '')])}
      </div>
    </div>"""
    return shell('Entrenamientos', body, badge='5')


def equipo():
    def post(author, when, text):
        return f"""
        <article style="border: 1px solid {TINT3}; background: #fff; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {INK60};">{author}</span>
            <span style="font-size: 12px; color: {INK45};">{when}</span>
          </div>
          <p style="margin: 0; font-size: 15px; line-height: 1.45;">{text}</p>
          <div style="display: flex; justify-content: space-between; margin: 0 -12px -8px;">
            <button type="button" aria-label="Me gusta" style="width: 44px; height: 44px; border: 0; background: transparent; color: {INK45}; display: flex; align-items: center; justify-content: center; cursor: pointer;">{icon('heart', 20)}</button>
            <button type="button" aria-label="Borrar" style="width: 44px; height: 44px; border: 0; background: transparent; color: {INK45}; display: flex; align-items: center; justify-content: center; cursor: pointer;">{icon('trash', 20)}</button>
          </div>
        </article>"""

    actions = icon_button('users', 'Equipo técnico') + icon_button('settings', 'Ajustes') + icon_button('userplus', 'Gestionar alumnos')
    body = header('Crew · 4 miembros', 'Hierro y Asfalto', actions) + f"""
    <div style="flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 14px; padding: 0 20px 20px;">
      {section_label('Muro')}
      <!-- Componer y publicar en UNA fila: el botón cabe al lado del cuadro
           y no hace falta una fila entera para él. -->
      <div style="display: flex; gap: 8px; align-items: flex-end;">
        <textarea placeholder="Cuéntale algo a tu equipo…" rows="2" style="flex: 1; min-height: 64px; padding: 12px 14px; border: 1px solid {TINT3}; border-radius: 6px; background: #fff; font-family: {SANS}; font-size: 15px; resize: none; outline: none; color: {INK};"></textarea>
        <button type="button" aria-label="Publicar" style="width: 44px; height: 44px; border: 0; border-radius: 999px; background: {COBALT}; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">{icon('megaphone', 20, '#fff', 2.25)}</button>
      </div>
      {post('Marco Salas', 'Hace 5 h', 'El sábado hacemos la salida larga por el cerro. Salimos a las 8:00 del gimnasio, llevad agua para hora y media.')}
      {post('Lucía Rey', 'Ayer', 'Recordad traer la banda elástica al bloque de movilidad del jueves.')}
    </div>"""
    return shell('Equipo', body, badge='')


def agenda():
    def slot(t, content=''):
        return f"""
        <li style="display: grid; grid-template-columns: 52px minmax(0, 1fr); min-height: 56px; border-top: 1px solid {TINT3};">
          <span style="padding-top: 6px; font-size: 11px; font-weight: 600; color: {INK45}; letter-spacing: 0.06em;">{t}</span>
          <div style="padding: 6px 0 6px 8px; border-left: 1px solid {TINT3};">{content}</div>
        </li>"""

    def block(initials, name, status, color, minutes, place):
        return f"""
          <div style="border: 1px solid {TINT3}; border-left: 3px solid {color}; background: #fff; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 26px; height: 26px; border-radius: 999px; background: {TINT2}; color: {COBALT}; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;">{initials}</span>
              <span style="font-family: {DISPLAY}; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em;">{name}</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center; font-size: 12px; color: {INK45};">
              <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: {color}; border: 1px solid {color}; border-radius: 999px; padding: 2px 8px;">{status}</span>
              <span>{minutes} min · {place}</span>
            </div>
          </div>"""

    body = header('Agenda', 'Mié, 9 sept', primary_pill('plus', 'Sesión')) + f"""
    <div style="flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; padding-bottom: 20px;">
      <!-- La navegación del día cabe en la misma fila que el atajo «Hoy»: era
           una fila propia con el título de la fecha en el medio; ahora la fecha
           ES el título de la pantalla, arriba, y aquí quedan solo los mandos. -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 20px 10px;">
        <div style="display: flex; gap: 4px;">
          <button type="button" aria-label="Día anterior" style="width: 44px; height: 44px; border: 1px solid {TINT3}; border-radius: 999px; background: transparent; color: {INK}; display: flex; align-items: center; justify-content: center; cursor: pointer;">{icon('chevron-left', 20)}</button>
          <button type="button" aria-label="Día siguiente" style="width: 44px; height: 44px; border: 1px solid {TINT3}; border-radius: 999px; background: transparent; color: {INK}; display: flex; align-items: center; justify-content: center; cursor: pointer;">{icon('chevron-right', 20)}</button>
        </div>
        <button type="button" style="height: 44px; padding: 0 16px; border: 1px solid {COBALT}; border-radius: 999px; background: transparent; color: {COBALT}; font-family: {SANS}; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;">Hoy</button>
      </div>
      <ul style="margin: 0; padding: 0 20px; list-style: none;">
        {slot('08:00')}
        {slot('09:00', block('MG', 'Entrenamiento personal', 'Confirmada', '#1B6E3C', '60', 'Gimnasio Principal'))}
        {slot('10:00', block('CL', 'Evaluación inicial', 'Pendiente', '#B05A00', '45', 'Sala de Evaluación'))}
        {slot('11:00')}
        {slot('12:00')}
        {slot('13:00')}
      </ul>
    </div>"""
    return shell('Calendario', body, badge='5')


def anatomia():
    """
    La cabecera sola, en sus cuatro estados, para quien la implemente: sin
    acciones, una primaria, primaria y secundaria, tres secundarias con
    título largo. Cada variante mide lo que ocupa.
    """
    def variant(label, h, note):
        return f"""
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {EMBER};">{label}</span>
        <div style="border: 1px dashed {TINT3}; background: {BONE};">{h}</div>
        <span style="font-size: 12px; color: {INK45};">{note}</span>
      </div>"""

    body = f"""
    <div style="padding: 24px 20px; display: flex; flex-direction: column; gap: 28px;">
      <div>
        <p style="margin: 0 0 4px; font-family: {DISPLAY}; font-size: 14px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: {EMBER};">Anatomía</p>
        <h2 style="margin: 0; font-family: {DISPLAY}; font-size: 36px; font-weight: 800; line-height: 0.95; text-transform: uppercase; letter-spacing: -0.01em;">La cabecera<br>compacta.</h2>
        <p style="margin: 10px 0 0; font-size: 14px; line-height: 1.45; color: {INK60}; max-width: 32ch;">Una fila para el eyebrow y las acciones; el título debajo a todo el ancho. Las acciones nunca apilan: la primaria es una píldora corta, las secundarias son iconos de 44 px con nombre accesible.</p>
      </div>
      {variant('Sin acciones · 82 px', header('Tu actividad', 'Dashboard'), 'Antes: 97 px. El relleno baja de 24/20 a 12/14.')}
      {variant('Una primaria · 116 px', header('Tu equipo · 4', 'Estudiantes', primary_pill('plus', 'Alumno')), 'Antes: 157 px. La píldora lleva icono y UNA palabra: el verbo lo pone el contexto de la pantalla.')}
      {variant('Primaria y secundaria · 116 px', header('Lo que asignas', 'Entrenamientos', icon_button('library', 'Catálogo') + primary_pill('plus', 'Rutina')), 'Antes: 209 px. Lo secundario pasa a icono: se entra al catálogo de vez en cuando.')}
      {variant('Tres secundarias, título largo · 116 px', header('Crew · 4 miembros', 'Hierro y Asfalto', icon_button('users', 'Equipo técnico') + icon_button('settings', 'Ajustes') + icon_button('userplus', 'Gestionar alumnos')), 'Antes: 261 px. Si el título no cabe en una línea, parte en dos: las acciones ya están arriba y no estorban.')}
    </div>"""
    return (HEAD + f'<div style="width: 390px; min-height: 844px; background: {BONE};">' + body + '</div>' + FOOT)


ARTBOARDS = {
    'Main.dc.html': dashboard,
    'Estudiantes.dc.html': estudiantes,
    'Entrenamientos.dc.html': entrenamientos,
    'Equipo.dc.html': equipo,
    'Agenda.dc.html': agenda,
    'Anatomia.dc.html': anatomia,
}

for name, build in ARTBOARDS.items():
    with open(os.path.join(HERE, name), 'w', encoding='utf-8') as f:
        f.write(build())
    print('escrito', name)
