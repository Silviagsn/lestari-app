CREATE TABLE user_profiles (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
  headline text NOT NULL DEFAULT '' CHECK (char_length(headline) <= 120),
  location text NOT NULL DEFAULT '' CHECK (char_length(location) <= 100),
  about text NOT NULL DEFAULT '' CHECK (char_length(about) <= 600),
  communication text NOT NULL DEFAULT '' CHECK (
    communication IN ('', 'Email', 'Chat tertulis', 'BISINDO', 'Video dengan juru bahasa isyarat')
  ),
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  is_demo boolean NOT NULL DEFAULT false
);

INSERT INTO user_profiles (user_id, display_name, headline, location, about, communication, details, is_demo)
SELECT users.id, samples.display_name, samples.headline, samples.location, samples.about,
       samples.communication, samples.details::jsonb, true
FROM users
JOIN (VALUES
  (
    'pencari-kerja@lestari.example', 'jobseeker', 'Nara Pradipta', 'Desainer visual junior', 'Bandung',
    'Saya tertarik membuat materi digital yang mudah dipahami dan diakses. Saya senang bekerja dengan tim yang terbiasa memberi arahan tertulis dan umpan balik yang konkret.',
    'Chat tertulis',
    '{"skills":"Figma, Desain visual, Aksesibilitas digital","experience":"Membuat poster kegiatan komunitas dan prototipe aplikasi sebagai bagian dari portofolio.","goal":"Mencari posisi desain junior dan mengikuti workshop desain antarmuka."}'
  ),
  (
    'perusahaan@lestari.example', 'company', 'Studio Ruang Inklusif', 'Studio desain dan produk digital', 'Jakarta',
    'Kami membantu organisasi merancang layanan yang lebih mudah digunakan. Tim kami bekerja lintas disiplin dengan dokumentasi yang bisa dibaca semua anggota.',
    'Email',
    '{"industry":"Desain dan teknologi","accessibility":"Instruksi kerja dan agenda rapat dibagikan dalam bentuk tertulis. Wawancara dapat dilakukan lewat chat atau video dengan juru bahasa isyarat sesuai kebutuhan."}'
  ),
  (
    'admin@lestari.example', 'admin', 'Tim Operasional Lestari', 'Administrator portal', 'Indonesia',
    'Profil contoh untuk akun pengelola Lestari. Fokus tim operasional adalah menjaga informasi portal mudah ditemukan dan dipahami.',
    'Chat tertulis',
    '{"team":"Operasional Portal","responsibilities":"Memantau konten portal, meninjau informasi lowongan, dan mengarahkan pertanyaan pengguna ke tim yang sesuai."}'
  )
) AS samples(email, role, display_name, headline, location, about, communication, details)
ON samples.email = users.email AND samples.role = users.role
ON CONFLICT (user_id) DO NOTHING;
