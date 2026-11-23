export const indonesianCityGroups = {
  A: ['Ambon'],
  B: [
    'Balikpapan', 'Banda Aceh', 'Bandar Lampung', 'Bandung', 'Banjar',
    'Banjarbaru', 'Banjarmasin', 'Batam', 'Batu', 'Baubau', 'Bekasi',
    'Bengkulu', 'Bima', 'Binjai', 'Bitung', 'Blitar', 'Bogor', 'Bontang', 'Bukittinggi',
  ],
  C: ['Cilegon', 'Cimahi', 'Cirebon'],
  D: ['Denpasar', 'Depok', 'Dumai'],
  G: ['Gorontalo', 'Gunungsitoli'],
  J: ['Jakarta Barat', 'Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Utara', 'Jambi', 'Jayapura'],
  K: ['Kediri', 'Kendari', 'Kotamobagu', 'Kupang'],
  L: ['Langsa', 'Lhokseumawe', 'Lubuklinggau'],
  M: ['Madiun', 'Magelang', 'Makassar', 'Malang', 'Manado', 'Mataram', 'Medan', 'Metro', 'Mojokerto'],
  P: [
    'Padang', 'Padang Panjang', 'Padangsidimpuan', 'Pagar Alam', 'Palangka Raya',
    'Palembang', 'Palopo', 'Palu', 'Pangkalpinang', 'Parepare', 'Pariaman', 'Pasuruan',
    'Payakumbuh', 'Pekalongan', 'Pekanbaru', 'Pematangsiantar', 'Pontianak', 'Prabumulih', 'Probolinggo',
  ],
  S: [
    'Sabang', 'Salatiga', 'Samarinda', 'Sawahlunto', 'Semarang', 'Serang', 'Sibolga',
    'Singkawang', 'Solok', 'Sorong', 'Subulussalam', 'Sukabumi', 'Sungai Penuh', 'Surabaya', 'Surakarta',
  ],
  T: [
    'Tangerang', 'Tangerang Selatan', 'Tanjungbalai', 'Tanjungpinang', 'Tarakan',
    'Tasikmalaya', 'Tebing Tinggi', 'Tegal', 'Ternate', 'Tidore Kepulauan', 'Tomohon', 'Tual',
  ],
  Y: ['Yogyakarta'],
};

export const indonesianCities = new Set(Object.values(indonesianCityGroups).flat());
