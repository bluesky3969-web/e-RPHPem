# e-RPH Pemulihan Khas

Aplikasi web e-RPH Pemulihan Khas REDOX untuk merancang, menjana, menyimpan dan mencetak RPH berdasarkan jadual guru.

## Menjalankan aplikasi

Aplikasi ini ialah laman web statik. Jalankan folder ini menggunakan pelayan web tempatan, kemudian buka `index.html` melalui alamat pelayan tersebut.

Contoh menggunakan Python:

```powershell
python -m http.server 8765
```

Kemudian buka `http://127.0.0.1:8765/index.html`.

## Supabase

1. Jalankan kandungan `supabase-setup.sql` dalam SQL Editor projek Supabase.
2. Dalam aplikasi, buka **Tetapan > Supabase Cloud**.
3. Masukkan Project URL dan **Publishable Key** sahaja.
4. Daftar atau log masuk. Data tempatan yang berisi akan dihantar secara automatik sebagai salinan pertama apabila akaun Supabase masih kosong. Periksa mesej **Disahkan di Supabase** sebelum menganggap data tersedia di peranti lain.

Jika kedua-dua salinan tempatan dan awan berisi tetapi berbeza, aplikasi menghentikan penyelarasan dan meminta pengguna menyemak kedua-duanya. Akaun kosong tidak menghantar rekod kosong ke awan. Simpan fail **Export Backup** sebelum memilih pemulihan atau penggantian data.

Jangan gunakan atau simpan `service_role`/Secret Key di dalam aplikasi ini.

## Fail utama

- `index.html` — antaramuka dan logik aplikasi.
- `master-data.js` — data kurikulum aplikasi.
- `data-bm.json` dan `data-mm.json` — data rujukan mata pelajaran.
- `assets/redox-logo.png` — logo REDOX.
- `supabase-setup.sql` — struktur pangkalan data dan polisi keselamatan.

Data RPH pengguna tidak disimpan dalam repo ini. Data tersebut kekal dalam pelayar atau akaun Supabase pengguna.

## Penggunaan ramai guru

- Setiap guru mesti mendaftar atau log masuk sebelum membuka aplikasi.
- Data cloud diasingkan mengikut ID pengguna melalui Supabase Auth dan polisi RLS.
- Cache pada pelayar turut diasingkan bagi setiap akaun supaya pertukaran guru pada peranti yang sama tidak mencampurkan RPH.
- Data tempatan lama yang berisi hanya dipautkan kepada akaun pertama pada peranti tersebut. Selepas log masuk, salinan pertama dihantar secara automatik jika akaun awan masih kosong; paparan aplikasi hanya menyatakan berjaya selepas semakan baca semula Supabase.
