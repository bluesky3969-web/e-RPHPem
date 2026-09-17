"""Rebuild BM only from the user's official 2019 PDF (pdfplumber required)."""
import copy
import hashlib
import json
import re
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / 'reference/Buku Panduan BM Program Pemulihan Khas 2019 (Terkini).pdf'
EXPECTED_HASH = '0734f26d46c1fcd27d2a8c7f7517029f27c5af4ed21a1b4b0b6cf029916f46de'
assert hashlib.sha256(PDF.read_bytes()).hexdigest() == EXPECTED_HASH

def clean(text):
    return re.sub(r'\s+', ' ', text or '').strip()

groups = {name: {} for name in ['pra', 'abjad', 'suku', 'perkataan', 'ayat']}
objectives = {n: [] for n in range(33)}
document_codes = {n: set() for n in range(33)}
with pdfplumber.open(PDF) as pdf:
    for page in range(35, 57):
        for table in pdf.pages[page-1].extract_tables():
            for row in table[1:]:
                assert len(row) == 9, (page, row)
                group = ('pra' if 'Prabacaan' in (row[0] or '') else 'abjad') if page == 35 else ('suku' if page == 36 else 'perkataan' if page <= 44 else 'ayat')
                content = clean((row[3] or '').replace('KSSR Semakan 2017', ''))
                match = re.match(r'(\d\.\d)\s', content)
                assert match, (page, content)
                code = match[1]
                sk = groups[group].setdefault(code, {'code': code, 'content': content, 'learning': [], 'learningSources': []})
                year, current = None, []
                def flush():
                    if not current:
                        return
                    text = clean(' '.join(current))
                    assert text.startswith(code + '.'), (page, code, text)
                    assert year in [1, 2, 3], (page, text)
                    value = f'Tahun {year} — {text}'
                    if value not in sk['learning']:
                        sk['learning'].append(value)
                        sk['learningSources'].append({'year': year, 'text': text, 'pdfPage': page, 'bookPage': page-7})
                for line in (row[6] or '').splitlines():
                    if re.match(r'^Tahun\s+[123]', line):
                        flush(); current = []; year = int(re.search(r'[123]', line)[0])
                    elif re.match(r'^\d\.\d\.\d', line):
                        flush(); current = [line]
                    else:
                        assert current or not line.strip(), (page, line)
                        current.append(line)
                flush()
    kp = None
    for page in range(58, 122):
        for table in pdf.pages[page-1].extract_tables():
            if len(table[0]) != 6:
                continue  # Nested activity examples, not the document-linking table.
            for row in table[1:]:
                assert len(row) == 6
                if row[0]:
                    match = re.search(r'KP\s+(\d+)', row[0])
                    kp = int(match[1]) if match else 0
                cell = row[2] or ''
                document_codes[kp].update(re.findall(r'(?m)^(\d\.\d)\s', row[1] or ''))
                for match in re.finditer(r'(?m)^(\d+)\.\s+([\s\S]*?)(?=^\d+\.\s|\Z)', cell):
                    number = int(match[1])
                    assert number == len(objectives[kp])+1, (page, kp, number)
                    text = clean(match[2]).replace('A- Z', 'A-Z')
                    objectives[kp].append({'text': f'{number}. {text}', 'pdfPage': page, 'bookPage': page-7})

path = ROOT / 'master-data.js'
data = json.loads(path.read_text(encoding='utf-8').split('window.ERPH_MASTER_DATA = ', 1)[1].strip().rstrip(';'))
math_before = copy.deepcopy(data['subjects']['Matematik'])
for n, item in enumerate(data['subjects']['Bahasa Melayu']):
    assert item['id'] == f'BM-K{n:02d}'
    group = 'pra' if n == 0 else 'abjad' if n <= 3 else 'suku' if n in [4, 9, 17] else 'ayat' if n >= 31 else 'perkataan'
    old_code = item['standardContent'][0]['code']
    standards = copy.deepcopy(groups[group])
    assert document_codes[n] == set(standards), (n, document_codes[n], set(standards))
    # Saved RPH uses standardIndex=0. Keep its original SK at index 0.
    item['standardContent'] = [standards.pop(old_code)] + list(standards.values())
    assert objectives[n]
    item['suggestedObjectives'] = [o['text'] for o in objectives[n]]
    item['objectiveSources'] = objectives[n]
    item['focus'] = objectives[n][0]['text']
    item['sourceMappingGroup'] = group
    item['sourceSha256'] = EXPECTED_HASH
    item['standardKandungan'] = '\n'.join(sk['content'] for sk in item['standardContent'])
    item['standardPembelajaran'] = [sp for sk in item['standardContent'] for sp in sk['learning']]
assert data['subjects']['Matematik'] == math_before
data['bmGuideRevision'] = '2019-verified-2026-09-17'
path.write_text('/* Data berstruktur daripada buku panduan rasmi Pemulihan Khas 2019. */\nwindow.ERPH_MASTER_DATA = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
(ROOT / 'data-bm.json').write_text(json.dumps([{key: item[key] for key in ['kemahiran', 'standardKandungan', 'standardPembelajaran', 'standardContent', 'suggestedObjectives']} for item in data['subjects']['Bahasa Melayu']], ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({g: {'sk': len(sks), 'sp': sum(len(s['learning']) for s in sks.values())} for g, sks in groups.items()}, indent=2))
print('Official objectives:', sum(map(len, objectives.values())), '; KP:', len(objectives))
