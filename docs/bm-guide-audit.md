# Semakan BM - Buku Panduan Program Pemulihan Khas 2019

Sumber: Buku Panduan BM Program Pemulihan Khas 2019 (Terkini).pdf yang dibekalkan pengguna.
SHA-256: `0734f26d46c1fcd27d2a8c7f7517029f27c5af4ed21a1b4b0b6cf029916f46de`.

Pemetaan: halaman cetakan 28-49 (PDF 35-56).
Objektif: Dokumen Penghubung, halaman cetakan 51-114 (PDF 58-121).
33 kemahiran termasuk Pra; 476 objektif bernombor. Teks hanya dinormalkan ruang/baris.

| Kumpulan dalam buku | Kemahiran | SK | SP mengikut tahun |
|---|---|---:|---:|
| Pra | Pra | 1 | 1 |
| Abjad | 1, 2, 3 | 6 | 13 |
| Suku kata | 4, 9, 17 | 6 | 12 |
| Perkataan | 5-30 kecuali 9, 17 | 10 | 117 |
| Ayat | 31, 32 | 13 | 162 |

Bilangan SP ialah bagi setiap kumpulan pemetaan, bukan jumlah unik seluruh buku.
Senarai kemahiran Perkataan bersambung merentasi halaman, bukan pemetaan berasingan
bagi setiap muka surat. Set SK setiap KP juga disemak terhadap lajur SK dalam
Dokumen Penghubung. Tahun 1/2/3 dikekalkan kerana kod sama boleh mempunyai teks berbeza.

## Objektif dan batas padanan

Buku menyenaraikan objektif mengikut KP, bukan hubungan satu-ke-satu SP-objektif.
Aplikasi tidak mereka hubungan itu. Guru memilih objektif rasmi yang sesuai dengan
SK/SP terpilih; prompt mengekalkan pilihan tersebut dan meminta semakan jika tidak
selaras. Janaan BM memerlukan SP katalog semasa dan objektif rasmi KP berkenaan.
Kriteria kejayaan dan aktiviti AI adalah cadangan, bukan teks rasmi buku.

## Kejanggalan sumber dikekalkan

- Hlm. 34 dan 42: Tahun 3, 2.3.1 (i) digunakan untuk label dan manual.
- Hlm. 38: 1.1.2 (ii b./i) untuk pesanan, seperti dicetak.
- Ejaan sumber seperti `digraph` dan `dimlak` tidak ditukar melalui andaian.

## Perlindungan data

ID kemahiran dan SK pada indeks 0 dikekalkan untuk RPH lama. Dropdown disusun
secara visual mengikut kod tanpa menukar indeks simpanan. SP lama tidak dipadam:
ia dipaparkan bertanda perlu semak dan guru memilih pengganti rasmi sendiri.
Objektif lama yang berbeza hanya pada baris/ruang masih ditandakan terpilih.
Tiada migrasi pangkalan data atau perubahan katalog Matematik.

## Ujian boleh diulang

- `python scripts/rebuild-bm-guide.py` (memerlukan pdfplumber dan PDF sumber di reference/).
- `node scripts/test-bm-guide.cjs`.
- Rujukan halaman bagi setiap SP dan objektif tersimpan dalam master-data.js.
