"""Extract Matematik catalogue from the supplied official 2019 guide only."""
import copy
import hashlib
import json
import re
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / 'reference/Buku Panduan Matematik Program Pemulihan Khas 2019 (Terkini).pdf'
HASH = '69d29303d9e6a9a4d5bbbf9bdfec583cf70dc8de6e80c11480e197c800b44bc7'
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == HASH
def clean(text):
    return re.sub(r'\s+', ' ', text or '').strip()
def identity(number):
    return 'MM-K'+(number.replace('.', '-') if '.' in number else number.zfill(2))

catalogue = {}
objectives = {}
with pdfplumber.open(PDF) as pdf:
    skills, year = [], None
    for page in range(38, 46):
        for table in pdf.pages[page-1].extract_tables():
            for row in table[1:]:
                assert len(row) == 9
                if row[0]:
                    codes = re.findall(r'Kemahiran\s+(\d+(?:\.\d+)?)\s*-', row[0])
                    assert codes, (page, row[0])
                    skills = [identity(c) for c in codes if '.' in c] or [identity(codes[0])]
                for key in skills:
                    catalogue.setdefault(key, {})
                content = row[3] or ''
                if content.strip() == '-':
                    assert skills == ['MM-K01'] and row[6].strip() == '-'
                    continue
                years = re.findall(r'Tahun\s+([123])', content)
                if years:
                    year = int(years[0])
                content = clean(re.sub(r'KSSR Semakan 2017|Tahun\s+[123]', '', content))
                code = re.match(r'\d\.\d', content)[0]
                learning = re.sub(r'^Tahun\s+[123]\s*\n', '', row[6])
                entries = re.findall(r'(?m)^\d\.\d\.\d+[\s\S]*?(?=^\d\.\d\.\d|\Z)', learning)
                assert entries and year in [1, 2, 3]
                for key in skills:
                    sk = catalogue[key].setdefault((year, code), {'code': code, 'year': year, 'content': f'Tahun {year} — {content}', 'learning': [], 'learningSources': []})
                    for text in entries:
                        text = clean(text)
                        assert text.startswith(code+'.'), (page, text, code)
                        value = f'Tahun {year} — {text}'
                        assert value not in sk['learning'], (page, key, value)
                        sk['learning'].append(value)
                        sk['learningSources'].append({'year': year, 'text': text, 'pdfPage': page, 'bookPage': page-7})
    key = None
    for page in range(47, 233):
        tables = [t for t in pdf.pages[page-1].extract_tables() if len(t[0]) == 6 and 'OBJEKTIF' in (t[0][2] or '')]
        assert len(tables) == 1, (page, len(tables))
        for row in tables[0][1:]:
            if row[0]:
                sub = re.search(r'(?m)^(\d\.\d)\s*:', row[0])
                main = re.search(r'KP\s+(\d+)\s*:', row[0])
                assert sub or main, (page, row[0])
                key = identity((sub or main)[1])
            assert key in catalogue, (page, key)
            target = objectives.setdefault(key, [])
            cell = re.sub(r'Pada akhir PdP, murid\s*berupaya:\s*', '', row[2] or '').strip()
            if not cell:
                continue
            # Some official numbers omit a full stop (e.g. objectives 13/14 on PDF 75).
            if page == 75:
                cell = re.sub(r'(?m)^(13|14) ', r'\1. ', cell)
            if page == 173:
                # Symbols are drawings, confirmed against the rendered source page.
                cell = cell.replace('bahagi ( )', 'bahagi (÷)').replace('sama dengan ( )', 'sama dengan (=)')
            parts = list(re.finditer(r'(?m)^(\d{1,2})\.[ \t]*(?=[A-Za-z])', cell))
            if not parts:
                assert target, (page, cell)
                target[-1]['text'] += ' '+clean(cell)
                target[-1].setdefault('continuationPdfPages', []).append(page)
                continue
            assert parts[0].start() == 0, (page, cell)
            for n, match in enumerate(parts):
                end = parts[n+1].start() if n+1 < len(parts) else len(cell)
                text = clean(cell[match.end():end])
                number = int(match[1])
                fixed_year = ({
                    'MM-K01': None, 'MM-K02': 1, 'MM-K3-1': 1, 'MM-K3-2': 1,
                    'MM-K3-3': 2, 'MM-K3-4': 3, 'MM-K4-1': 1, 'MM-K4-2': 1,
                    'MM-K4-3': 2, 'MM-K4-4': 3, 'MM-K5-1': 1, 'MM-K5-2': 1,
                    'MM-K5-3': 2, 'MM-K5-4': 3, 'MM-K8-1': 1, 'MM-K8-2': 2,
                    'MM-K8-3': 3,
                }).get(key)
                if key == 'MM-K06': fixed_year = 2 if page <= 155 else 3
                if key == 'MM-K07': fixed_year = 2 if page <= 185 else 3
                if key == 'MM-K09': fixed_year = 1 if page <= 215 else 2 if page <= 219 else 3
                target.append({'text': f'{number}. {text}', 'pdfPage': page, 'bookPage': page-7, 'sourceNumber': number,
                               'objectiveYear': fixed_year,
                               'standardCodes': re.findall(r'(?m)^(\d\.[1-9])\s', row[1] or '')})

path = ROOT/'master-data.js'
data = json.loads(path.read_text(encoding='utf-8').split('window.ERPH_MASTER_DATA = ', 1)[1].strip().rstrip(';'))
bm = copy.deepcopy(data['subjects']['Bahasa Melayu'])
assert set(catalogue) == {item['id'] for item in data['subjects']['Matematik']}
for item in data['subjects']['Matematik']:
    key = item['id']
    standards = catalogue[key]
    if key == 'MM-K01':
        # A UI placeholder, not an invented curriculum standard.
        item['standardContent'] = [{'code': '', 'content': 'Tidak ditetapkan dalam buku panduan (Pra Nombor)', 'learning': [], 'notApplicable': True}]
        item['standardsNotApplicable'] = True
    else:
        # Preserve every saved index, including repeated codes for different years.
        remaining = copy.deepcopy(standards)
        ordered = []
        for previous in item['standardContent']:
            choices = [k for k in remaining if k[1] == previous['code']]
            assert choices, (key, previous)
            chosen = choices[0]
            ordered.append(remaining.pop(chosen))
        assert not remaining, (key, remaining)
        item['standardContent'] = ordered
    item['objectiveSources'] = objectives[key]
    item['suggestedObjectives'] = [o['text'] for o in objectives[key]]
    item['focus'] = objectives[key][0]['text']
    assert len(objectives[key]) == {'MM-K01':1, 'MM-K02':4, 'MM-K3-1':11, 'MM-K3-2':5, 'MM-K3-3':14, 'MM-K3-4':16, 'MM-K4-1':8, 'MM-K4-2':6, 'MM-K4-3':8, 'MM-K4-4':4, 'MM-K5-1':5, 'MM-K5-2':8, 'MM-K5-3':8, 'MM-K5-4':8, 'MM-K06':29, 'MM-K07':28, 'MM-K8-1':5, 'MM-K8-2':7, 'MM-K8-3':9, 'MM-K09':29}[key], key
    item['sourceSha256'] = HASH
    item['standardKandungan'] = '\n'.join(sk['content'] for sk in item['standardContent'])
    item['standardPembelajaran'] = [sp for sk in item['standardContent'] for sp in sk['learning']]
assert data['subjects']['Bahasa Melayu'] == bm
data['mmGuideRevision'] = '2019-verified-2026-09-18'
path.write_text('/* Data berstruktur daripada buku panduan rasmi Pemulihan Khas 2019. */\nwindow.ERPH_MASTER_DATA = '+json.dumps(data, ensure_ascii=False, indent=2)+';\n', encoding='utf-8')
(ROOT/'data-mm.json').write_text(json.dumps([{k: item[k] for k in ['kemahiran', 'standardKandungan', 'standardPembelajaran', 'standardContent', 'suggestedObjectives']} for item in data['subjects']['Matematik']], ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
for item in data['subjects']['Matematik']:
    print(item['id'], len(catalogue[item['id']]), sum(len(s['learning']) for s in item['standardContent']), len(item['suggestedObjectives']))
print('TOTAL OBJECTIVES', sum(map(len, objectives.values())))
