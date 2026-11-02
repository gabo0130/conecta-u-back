"""Hoja de cálculo del puntaje SUS (F4-02). Ejecutar: python3 09-sus-xlsx.py"""
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).resolve().parent.parent / 'documentos' / 'F4-02 Puntaje SUS.xlsx'
RED = PatternFill('solid', fgColor='AA1916')
WHITE = Font(bold=True, color='FFFFFF')
ROWS = 40  # participantes

wb = Workbook()
ws = wb.active
ws.title = 'Respuestas'
headers = ['Código', 'Rol'] + [f'Ítem {i}' for i in range(1, 11)] + ['Completo', 'Puntaje SUS']
ws.append(headers)
for cell in ws[1]:
    cell.fill, cell.font = RED, WHITE
    cell.alignment = Alignment(horizontal='center', wrap_text=True)
for r in range(2, ROWS + 2):
    ws.cell(r, 1, f'P{r - 1:02d}')
    # Completo: las 10 respuestas entre 1 y 5.
    ws.cell(r, 13, f'=IF(AND(COUNT(C{r}:L{r})=10,MIN(C{r}:L{r})>=1,MAX(C{r}:L{r})<=5),"Sí","")')
    odd = '+'.join(f'({c}{r}-1)' for c in 'CEGIK')
    even = '+'.join(f'(5-{c}{r})' for c in 'DFHJL')
    ws.cell(r, 14, f'=IF(M{r}="Sí",2.5*({odd}+{even}),"")')
answers = DataValidation(type='whole', operator='between', formula1='1', formula2='5', showErrorMessage=True,
                         errorTitle='Respuesta inválida', error='Escribe un número entero de 1 a 5.')
ws.add_data_validation(answers)
answers.add(f'C2:L{ROWS + 1}')
roles = DataValidation(type='list', formula1='"Formulador,Estudiante,Docente,Administrador"', allow_blank=True)
ws.add_data_validation(roles)
roles.add(f'B2:B{ROWS + 1}')
ws.column_dimensions['A'].width = 9
ws.column_dimensions['B'].width = 15
for col in 'CDEFGHIJKL':
    ws.column_dimensions[col].width = 7
ws.column_dimensions['M'].width = 10
ws.column_dimensions['N'].width = 12
ws.freeze_panes = 'C2'

s = wb.create_sheet('Resumen')
s.append(['Indicador', 'Total', 'Formulador', 'Estudiante', 'Docente', 'Administrador'])
for cell in s[1]:
    cell.fill, cell.font = RED, WHITE
rng = f'Respuestas!$N$2:$N${ROWS + 1}'
roles_rng = f'Respuestas!$B$2:$B${ROWS + 1}'
role_cols = {'C': 'Formulador', 'D': 'Estudiante', 'E': 'Docente', 'F': 'Administrador'}
rows = [
    ('n (cuestionarios completos)', f'=COUNT({rng})', lambda role: f'=COUNTIFS({roles_rng},"{role}",{rng},">=0")'),
    ('Media', f'=IFERROR(AVERAGE({rng}),"")', lambda role: f'=IFERROR(AVERAGEIFS({rng},{roles_rng},"{role}"),"")'),
    ('Desviación estándar', f'=IFERROR(STDEV({rng}),"")', None),
    ('Mediana', f'=IFERROR(MEDIAN({rng}),"")', None),
    ('Mínimo', f'=IFERROR(MIN({rng}),"")', None),
    ('Máximo', f'=IFERROR(MAX({rng}),"")', None),
    ('IC 95 % de la media (±)', f'=IFERROR(_xlfn.CONFIDENCE.T(0.05,STDEV({rng}),COUNT({rng})),"")', None),
    ('Lectura (referencia: 68 = promedio)', '=IF(B3="","",IF(B3>=85,"Excelente",IF(B3>=71,"Buena",IF(B3>=68,"Promedio",IF(B3>50,"Marginal","Pobre")))))', None),
]
for label, total, per_role in rows:
    s.append([label, total] + ([per_role(role) for role in role_cols.values()] if per_role else ['', '', '', '']))
s.column_dimensions['A'].width = 36
for col in 'BCDEF':
    s.column_dimensions[col].width = 14
s.append([])
s.append(['Cálculo: impares (1,3,5,7,9) aportan respuesta − 1; pares (2,4,6,8,10) aportan 5 − respuesta; SUS = 2,5 × suma. Va de 0 a 100 (no es porcentaje).'])
s.append(['Solo se cuentan cuestionarios con las 10 respuestas. Datos reales del piloto: no registrar datos de prueba en esta hoja.'])
wb.save(OUT)
print('escrito', OUT.name)
