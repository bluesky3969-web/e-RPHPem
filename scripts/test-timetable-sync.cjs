const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
function source(name) {
  const match = html.match(new RegExp(`function ${name}\\([^]*?(?=\\nfunction |\\n/\\* |\\nconst |\\nlet )`));
  assert.ok(match, `Function ${name} found`);
  return match[0];
}

const days = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];
const slot = (id, masa, kelas = '3 Bestari') => ({id, masa, kelas, mataPelajaran: 'Bahasa Melayu', classId: 'class-1', subjectId: 'bm', studentCount: 8});
const old = {id: 'rph-old', tarikh: '2026-09-21', hari: 'Isnin', minggu: 38, slotId: 'slot-old', kelas: '3 Bestari', masa: '8.00-9.00', mataPelajaran: 'Bahasa Melayu', classId: 'class-1', subjectId: 'bm', dariJadual: true, groups: [{objektif: 'Kandungan guru tidak boleh hilang'}]};
const timetable = Object.fromEntries(days.map(day => [day, []]));
timetable.Isnin.push(slot('slot-old', '8.00-9.00'));
const store = {settings: {timetable}, days: [structuredClone(old)], ui: {viewedWeekMonday: '2026-09-21'}};
let sequence = 0;
const context = vm.createContext({
  store, HARI_LIST: days,
  isninBagiTarikh: value => value,
  tambahHariISO: (value, count) => {const date = new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + count); return date.toISOString().slice(0, 10);},
  migrateSettingsCatalog: () => {}, susunSlotJadualIkutMasa: () => {}, susunHariIkutTarikh: () => {},
  slotPdpcSah: item => Boolean(item && item.id && item.classId && item.subjectId && item.kelas && item.mataPelajaran && item.masa),
  buatHariKosong: (date, settings, item) => ({id: `rph-new-${++sequence}`, tarikh: date, hari: 'Isnin', groups: []}),
  viewedWeekMonday: () => '2026-09-21',
});
for (const name of ['kunciPadananSlot', 'rekodDalamJadual', 'janaRekodMinggu', 'mingguAktif']) vm.runInContext(source(name), context);

let result = vm.runInContext("janaRekodMinggu('2026-09-21', 38)", context);
assert.equal(result.ditambah, 0);
assert.equal(result.diarkib, 0);
assert.equal(store.days.length, 1);

timetable.Isnin[0].masa = '9.00-10.00';
result = vm.runInContext("janaRekodMinggu('2026-09-21', 38)", context);
assert.equal(result.ditambah, 0, 'Changing time on the same slot must not duplicate RPH');
assert.equal(store.days[0].masa, '9.00-10.00');
assert.equal(store.days[0].groups[0].objektif, old.groups[0].objektif);

timetable.Isnin.splice(0, 1, slot('slot-new', '10.00-11.00'));
result = vm.runInContext("janaRekodMinggu('2026-09-21', 38)", context);
assert.equal(result.ditambah, 1);
assert.equal(result.diarkib, 1);
assert.equal(store.days.length, 2, 'Old RPH must remain recoverable');
assert.equal(store.days.find(day => day.id === old.id).jadualDikeluarkan, true);
assert.equal(vm.runInContext('mingguAktif().length', context), 1);

result = vm.runInContext("janaRekodMinggu('2026-09-21', 38)", context);
assert.equal(result.ditambah, 0, 'Repeated sync must be idempotent');
assert.equal(result.diarkib, 0);

timetable.Isnin.push({id: 'incomplete', masa: '', classId: '', subjectId: ''});
timetable.Isnin.splice(0, 1);
result = vm.runInContext("janaRekodMinggu('2026-09-21', 38)", context);
assert.equal(result.diarkib, 0, 'Incomplete schedule must not archive valid RPH');
assert.equal(vm.runInContext('mingguAktif().length', context), 1);

console.log('Timetable sync tests passed.');
