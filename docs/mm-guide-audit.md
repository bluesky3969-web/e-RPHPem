# Semakan Matematik - Buku Panduan Program Pemulihan Khas 2019

Sumber pengguna: Buku Panduan Matematik Program Pemulihan Khas 2019 (Terkini).pdf.
SHA-256: `69d29303d9e6a9a4d5bbbf9bdfec583cf70dc8de6e80c11480e197c800b44bc7`.

- Pemetaan lengkap: hlm. cetakan 31-38, PDF 38-45.
- Objektif: Dokumen Penghubung, hlm. cetakan 40-225, PDF 47-232.
- 20 entri kemahiran/subkemahiran; 213 kemunculan objektif rasmi, termasuk pengulangan dalam buku.
- Objektif sama dipaparkan sekali dalam pilihan dengan semua rujukan halaman; data sumber tidak dibuang.
- SK/SP diasingkan mengikut tahun, terutama kod berulang bagi Darab, Bahagi dan Masa dan Waktu.
- Objektif pada UI turut ditapis mengikut tahun SK. Pertukaran SK mengosongkan objektif
  dan kriteria terdahulu supaya pilihan berlainan tahun tidak terbawa secara senyap.

## Penemuan dan pembetulan

SK 5.1 bagi Masa dan Waktu sebelum ini mempunyai 10 SP bercampur dalam setiap pilihan tahun.
Kini tahun 1, 2 dan 3 masing-masing mempunyai 4, 4 dan 2 SP seperti pemetaan buku.
SK 2.3 Darab kini mempunyai 2 SP Tahun 2 dan 1 SP Tahun 3, bukan salinan bercampur.
Objektif `4.Membaca kalendar` pada hlm. 214 dipulihkan sebagai pilihan berasingan.
Simbol bahagi dan sama dengan pada hlm. 166 ialah grafik; ditranskripsi sebagai
`÷` dan `=` selepas semakan imej halaman, bukan dibiarkan sebagai kurungan kosong.

## Batas sumber yang dikekalkan

- Pra Nombor: buku meletakkan tanda `-` untuk SK/SP. Aplikasi memaparkan keterangan
  tidak ditetapkan, tanpa mencipta kod, dan membenarkan aliran berasaskan objektif sahaja.
- Lingkungan KP tidak semestinya sama dengan lingkungan SK/SP. Contohnya KP 4.3
  hingga 100 dipetakan kepada Tahun 2 SK/SP hingga 1000. Jangan tukar teks rasmi.
  Prompt menghadkan aktiviti kepada lingkungan KP dan objektif pilihan guru.
- Hlm. 32: `1.2.2 Menentukan nilai nombor hingga 100: (iii) Membandingkan nilai dua nombor`
  dikekalkan di bawah Tahun 2 SK 1.2 seperti cetakan pemetaan.
- Nombor objektif berulang/mula semula pada Darab, Bahagi dan Masa dan Waktu
  dikekalkan, termasuk dua objektif bernombor 5 pada hlm. 167-168.
- Dokumen Penghubung kadangkala mempunyai label tahun yang tidak konsisten dengan
  pemetaan (contoh PDF 156, 204 dan 220). Tahun objektif disandarkan pada kumpulan
  kemahiran dan urutan set bernombor dalam Dokumen Penghubung, kemudian ditally
  kepada tahun dalam jadual pemetaan PDF 38-45; label salah itu tidak disalin.
- Tiada hubungan satu-ke-satu SP-objektif direka. Rujukan lajur SK pada halaman
  objektif disimpan sebagai `standardCodes`; guru tetap memilih objektif yang sesuai.

## Keselamatan data dan ujian

Semua ID kemahiran dan indeks SK lama dikekalkan (bukan indeks 0 sahaja).
SP lama kekal kelihatan dan boleh dinyahpilih untuk disemak sendiri. Tiada migrasi
rekod pengguna, perubahan Supabase atau perubahan data katalog BM.

Ujian: `node scripts/test-bm-guide.cjs` dan `node scripts/test-mm-guide.cjs`.
Bina semula daripada PDF yang hash-nya disahkan: `python scripts/rebuild-mm-guide.py`.
Semakan sumber meliputi semua jadual pemetaan dan semua lajur objektif; halaman
berkod berulang dan simbol grafik turut disemak sebagai imej.
