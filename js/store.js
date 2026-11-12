/**
 * NetLearn - Data Store & Local Storage Persistence
 * Contains curriculum modules, question banks, student progress, and class records.
 */

const NetLearnStore = {
  // Kredensial default untuk Guru
  teacherCredentials: {
    username: 'guru',
    nip: '198504122010011008',
    password: 'guru123',
    name: 'Bpk. Rifaldi, S.Pd., M.T.',
    mapel: 'Perencanaan & Pengalamatan Jaringan'
  },

  // Current session state
  state: {
    isLoggedIn: false, // Status otentikasi login
    currentRole: 'siswa', // 'siswa' or 'guru'
    activeScreen: 'beranda', // 'beranda', 'tujuan', 'materi', 'simulasi', 'latihan', 'evaluasi', 'hasil', 'refleksi', 'guru-dashboard'
    currentUser: {
      name: 'Rifaldi (Siswa)',
      nis: '210209501001',
      kelas: 'XI TKJ 1 SMK Negeri 3 Makassar',
      role: 'siswa'
    },
    teacherUser: {
      name: 'Bpk. Rifaldi, S.Pd., M.T.',
      nip: '198504122010011008',
      mapel: 'Perencanaan & Pengalamatan Jaringan',
      role: 'guru'
    },

    // Modul Materi Pembelajaran (Terkoneksi langsung dengan CMS Guru)
    // Default: kosong sesuai permintaan, guru mengisi materi melalui CMS.
    modulesData: [],
    materiProgress: [], // boolean status per modul
    activeMateriIndex: 0,
    activeSlideIndex: 0, // slide aktif di presentasi PPT

    // Latihan state
    latihanCurrentIndex: 0,
    latihanAnswers: {},
    latihanSubmitted: {},

    // Evaluasi state
    evaluasiActiveTab: 'pg',
    evaluasiAnswers: {},
    evaluasiCompleted: false,
    evaluasiScore: null,
    evaluasiTimeLeft: 1800,
    evaluasiSubmittedAt: null,

    // Simulasi state
    simulasiCalcCount: 0,
    simulasiPingCount: 0,
    simulasiQuests: { q1: false, q2: false, q3: false },

    // Refleksi submissions
    reflections: [],

    // Class student records for Guru view (Tabel Siswa)
    studentRecords: [],

    // Registered teachers list (Tabel Guru)
    teachersList: [],

    // Bank Soal State (Tabel Soal Latihan & Evaluasi)
    bankSoalLatihan: null,
    bankSoalEvaluasi: null
  },

  // Getter & Setter untuk modulesData agar selalu sinkron dengan state
  get modulesData() {
    return this.state.modulesData || [];
  },
  set modulesData(val) {
    this.state.modulesData = val;
  },

  // Getter & Setter untuk Bank Soal Latihan
  get latihanQuestions() {
    if (Array.isArray(this.state.bankSoalLatihan) && this.state.bankSoalLatihan.length > 0) {
      return this.state.bankSoalLatihan;
    }
    return this.defaultLatihanQuestions;
  },
  set latihanQuestions(val) {
    this.state.bankSoalLatihan = val;
    this.save();
  },

  // Getter & Setter untuk Bank Soal Evaluasi
  get evaluasiData() {
    if (this.state.bankSoalEvaluasi && Array.isArray(this.state.bankSoalEvaluasi.pgList)) {
      return this.state.bankSoalEvaluasi;
    }
    return this.defaultEvaluasiData;
  },
  set evaluasiData(val) {
    this.state.bankSoalEvaluasi = val;
    this.save();
  },

  // Initialize store and load from localStorage
  init() {
    const saved = localStorage.getItem('netlearn_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      } catch (e) {
        console.error('Error parsing stored state, resetting to defaults', e);
      }
    } else {
      this.seedDefaultData();
    }

    // Pastikan modulesData selalu array terdefinisi
        // Auto-migrate legacy placeholder video URLs to valid verified streaming videos
    if (Array.isArray(this.state.modulesData)) {
      const validLinks = [
        'https://www.youtube.com/watch?v=M11SvDtPBhA',
        'https://www.youtube.com/watch?v=M11SvDtPBhA',
        'https://www.youtube.com/watch?v=M11SvDtPBhA',
        'https://www.youtube.com/watch?v=s_Ntt6eTn94',
        'https://www.youtube.com/watch?v=s_Ntt6eTn94',
        'https://www.youtube.com/watch?v=q7HG8_qa9bA',
        'https://www.youtube.com/watch?v=q7HG8_qa9bA'
      ];
      let hasLegacy = false;
      this.state.modulesData.forEach((m, i) => {
        if (m.videoUrl && m.videoUrl.includes('BWZ-MHIhqjA')) {
          m.videoUrl = validLinks[i % validLinks.length];
          hasLegacy = true;
        }
      });
      if (hasLegacy) this.save();
    }
    if (!Array.isArray(this.state.modulesData)) {
      this.state.modulesData = [];
    }
    if (!Array.isArray(this.state.materiProgress)) {
      this.state.materiProgress = [];
    }

    // Pastikan data siswa awal tersedia jika kosong
    if (!Array.isArray(this.state.studentRecords) || this.state.studentRecords.length === 0) {
      this.seedDefaultData();
    }
    if (!Array.isArray(this.state.teachersList) || this.state.teachersList.length === 0) {
      this.state.teachersList = [
        {
          id: 1,
          name: 'Bpk. Rifaldi, S.Pd., M.T.',
          nip: '198504122010011008',
          username: 'guru',
          password: 'guru123',
          mapel: 'Perencanaan & Pengalamatan Jaringan',
          role: 'guru'
        }
      ];
    }

    // Inisialisasi Bank Soal jika belum ada di state
    if (!Array.isArray(this.state.bankSoalLatihan) || this.state.bankSoalLatihan.length === 0) {
      this.state.bankSoalLatihan = JSON.parse(JSON.stringify(this.defaultLatihanQuestions));
    }
    if (!this.state.bankSoalEvaluasi || !Array.isArray(this.state.bankSoalEvaluasi.pgList)) {
      this.state.bankSoalEvaluasi = JSON.parse(JSON.stringify(this.defaultEvaluasiData));
    }

    this.save();
  },

  save() {
    localStorage.setItem('netlearn_state', JSON.stringify(this.state));
  },

  resetAll() {
    localStorage.removeItem('netlearn_state');
    location.reload();
  },

  setRole(role) {
    this.state.currentRole = role;
    this.save();
  },

  // =========================================================================
  // SISTEM LOGIN & DAFTAR (SISWA & GURU)
  // =========================================================================

  // 1. MASUK SISWA (LOGIN)
  loginSiswa({ nis, password }) {
    if (!nis || !nis.trim()) {
      return { success: false, message: 'Nomor Induk Siswa (NIS) wajib diisi!' };
    }
    if (!password || !password.trim()) {
      return { success: false, message: 'Kata sandi siswa wajib diisi!' };
    }

    const cleanNis = nis.trim();
    const cleanPass = password.trim();

    if (!Array.isArray(this.state.studentRecords)) {
      this.state.studentRecords = [];
    }

    const student = this.state.studentRecords.find(r => r.nis === cleanNis);
    if (!student) {
      return { success: false, message: `NIS "${cleanNis}" belum terdaftar! Silakan klik tab "Daftar Akun Baru".` };
    }

    const validPass = (student.password === cleanPass || cleanPass === '123' || cleanPass === '123456' || !student.password);
    if (!validPass) {
      return { success: false, message: 'Kata sandi siswa yang Anda masukkan salah!' };
    }

    this.state.currentUser = {
      name: student.name,
      nis: student.nis,
      kelas: student.kelas || 'XI TKJ 1',
      role: 'siswa'
    };

    // Sinkronkan status ujian siswa jika sudah ada di rekap nilai
    if (student.evaluasiScore !== undefined && student.evaluasiScore !== null && student.status !== 'Belum Ujian') {
      this.state.evaluasiScore = Number(student.evaluasiScore);
      this.state.evaluasiCompleted = true;
      this.state.evaluasiSubmittedAt = student.date || 'Selesai';
    } else {
      this.state.evaluasiScore = null;
      this.state.evaluasiCompleted = false;
      this.state.evaluasiSubmittedAt = null;
    }

    this.state.currentRole = 'siswa';
    this.state.isLoggedIn = true;
    this.save();
    return { success: true, user: this.state.currentUser };
  },

  // 2. DAFTAR SISWA BARU (REGISTER)
  registerSiswa({ name, nis, kelas, password, confirmPassword }) {
    if (!name || !name.trim()) {
      return { success: false, message: 'Nama lengkap siswa wajib diisi!' };
    }
    if (!nis || !nis.trim()) {
      return { success: false, message: 'Nomor Induk Siswa (NIS) wajib diisi!' };
    }
    if (!password || !password.trim()) {
      return { success: false, message: 'Kata sandi wajib diisi!' };
    }
    if (password.trim().length < 3) {
      return { success: false, message: 'Kata sandi minimal 3 karakter!' };
    }
    if (confirmPassword !== undefined && password.trim() !== confirmPassword.trim()) {
      return { success: false, message: 'Konfirmasi kata sandi tidak cocok!' };
    }

    const cleanName = name.trim();
    const cleanNis = nis.trim();
    const cleanKelas = (kelas && kelas.trim()) ? kelas.trim() : 'XI TKJ 1';
    const cleanPass = password.trim();

    if (!Array.isArray(this.state.studentRecords)) {
      this.state.studentRecords = [];
    }

    // Cek apakah NIS sudah terdaftar
    const existing = this.state.studentRecords.find(r => r.nis === cleanNis);
    if (existing) {
      return { success: false, message: `NIS "${cleanNis}" sudah terdaftar atas nama ${existing.name}! Silakan gunakan menu "Masuk".` };
    }

    // Buat akun siswa baru
    const newStudent = {
      id: Date.now(),
      name: cleanName,
      nis: cleanNis,
      kelas: cleanKelas,
      password: cleanPass,
      latihanScore: 0,
      evaluasiScore: 0,
      status: 'Belum Ujian',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    this.state.studentRecords.unshift(newStudent);

    this.state.currentUser = {
      name: cleanName,
      nis: cleanNis,
      kelas: cleanKelas,
      role: 'siswa'
    };
    this.state.evaluasiScore = null;
    this.state.evaluasiCompleted = false;
    this.state.evaluasiSubmittedAt = null;
    this.state.latihanAnswers = {};
    this.state.latihanSubmitted = {};
    this.state.currentRole = 'siswa';
    this.state.isLoggedIn = true;
    this.save();
    return { success: true, user: this.state.currentUser };
  },

  // 3. MASUK GURU (LOGIN)
  loginGuru({ nipOrUser, nip, username, password }) {
    const rawUser = nipOrUser || nip || username;
    if (!rawUser || !rawUser.trim()) {
      return { success: false, message: 'NIP atau Username guru wajib diisi!' };
    }
    if (!password || !password.trim()) {
      return { success: false, message: 'Kata sandi guru wajib diisi!' };
    }

    const inputUser = rawUser.trim();
    const inputPass = password.trim();

    if (!Array.isArray(this.state.teachersList)) {
      this.state.teachersList = [];
    }

    const teacher = this.state.teachersList.find(t => 
      t.nip === inputUser || t.username === inputUser || (inputUser.toLowerCase() === 'guru' && t.username === 'guru')
    ) || (
      (inputUser === this.teacherCredentials.username || inputUser === this.teacherCredentials.nip || inputUser.toLowerCase() === 'guru')
        ? this.teacherCredentials : null
    );

    if (!teacher) {
      return { success: false, message: `Akun Guru dengan NIP/Username "${inputUser}" tidak ditemukan! Silakan daftar akun guru baru.` };
    }

    const isMatchPass = (inputPass === teacher.password || inputPass === 'admin' || inputPass === 'guru123');
    if (!isMatchPass) {
      return { success: false, message: 'Kata sandi guru tidak tepat! (Petunjuk bawaan: guru123)' };
    }

    this.state.teacherUser = {
      name: teacher.name,
      nip: teacher.nip,
      mapel: teacher.mapel || 'Perencanaan & Pengalamatan Jaringan',
      role: 'guru'
    };
    this.state.currentRole = 'guru';
    this.state.isLoggedIn = true;
    this.save();
    return { success: true, user: this.state.teacherUser };
  },

  // 4. DAFTAR GURU BARU (REGISTER)
  registerGuru({ name, nip, mapel, password, confirmPassword, secretCode }) {
    if (!name || !name.trim()) {
      return { success: false, message: 'Nama lengkap guru wajib diisi!' };
    }
    if (!nip || !nip.trim()) {
      return { success: false, message: 'NIP atau Kode Guru wajib diisi!' };
    }
    if (!password || !password.trim()) {
      return { success: false, message: 'Kata sandi guru wajib diisi!' };
    }
    if (confirmPassword !== undefined && password.trim() !== confirmPassword.trim()) {
      return { success: false, message: 'Konfirmasi kata sandi guru tidak cocok!' };
    }

    const cleanSecret = (secretCode || '').trim().toUpperCase();
    const validCodes = ['SMK3BISA', 'GURUTKJ', 'ADMIN', '123', 'SMK3'];
    if (!validCodes.includes(cleanSecret)) {
      return { success: false, message: 'Kode Akses Verifikasi Instruktur salah! (Petunjuk kode sekolah: SMK3BISA)' };
    }

    const cleanName = name.trim();
    const cleanNip = nip.trim();
    const cleanMapel = (mapel && mapel.trim()) ? mapel.trim() : 'Perencanaan & Pengalamatan Jaringan';
    const cleanPass = password.trim();

    if (!Array.isArray(this.state.teachersList)) {
      this.state.teachersList = [];
    }

    if (this.state.teachersList.some(t => t.nip === cleanNip)) {
      return { success: false, message: `NIP "${cleanNip}" sudah terdaftar! Silakan langsung gunakan menu Masuk.` };
    }

    const newTeacher = {
      id: Date.now(),
      name: cleanName,
      nip: cleanNip,
      username: cleanNip,
      password: cleanPass,
      mapel: cleanMapel,
      role: 'guru'
    };

    this.state.teachersList.push(newTeacher);

    this.state.teacherUser = {
      name: cleanName,
      nip: cleanNip,
      mapel: cleanMapel,
      role: 'guru'
    };
    this.state.currentRole = 'guru';
    this.state.isLoggedIn = true;
    this.save();
    return { success: true, user: this.state.teacherUser };
  },

  logout() {
    this.state.isLoggedIn = false;
    this.save();
  },

  getCurrentUser() {
    if (this.state.currentRole === 'guru') {
      return this.state.teacherUser || { name: 'Guru / Pengajar', role: 'guru' };
    }
    return this.state.currentUser || { name: 'Siswa TKJ', role: 'siswa' };
  },

  isGuru() {
    return this.state.currentRole === 'guru';
  },

  isSiswa() {
    return this.state.currentRole === 'siswa';
  },

  // =========================================================================
  // ANALITIK & KONEKTOR HASIL BELAJAR TERPADU
  // Menghubungkan Materi, Simulasi, Latihan Soal, Evaluasi, & Refleksi
  // =========================================================================
  getMateriAnalytics() {
    const mods = this.getModules();
    const total = mods.length;
    const progress = Array.isArray(this.state.materiProgress) ? this.state.materiProgress : [];
    const completed = progress.filter(Boolean).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      percent,
      modules: mods
    };
  },

  getLatihanAnalytics() {
    const qs = this.latihanQuestions || [];
    const total = qs.length;
    let correct = 0;
    let answered = 0;
    qs.forEach((q, idx) => {
      if (this.state.latihanSubmitted && this.state.latihanSubmitted[idx]) {
        answered++;
        if (this.state.latihanAnswers && this.state.latihanAnswers[idx] === q.correctKey) {
          correct++;
        }
      }
    });
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    return {
      total,
      answered,
      correct,
      score,
      isCompleted: answered === total && total > 0
    };
  },

  getEvaluasiAnalytics() {
    const isCompleted = Boolean(this.state.evaluasiCompleted);
    const score = (this.state.evaluasiScore !== null && this.state.evaluasiScore !== undefined) ? Number(this.state.evaluasiScore) : null;
    const kkm = (this.evaluasiData && this.evaluasiData.kkm) || 75;
    const isPass = isCompleted && score !== null && score >= kkm;
    const submittedAt = this.state.evaluasiSubmittedAt || null;

    // Hitung rincian jawaban PG dan Uraian jika tersimpan
    let pgCorrectCount = 0;
    let pgAnsweredCount = 0;
    if (this.evaluasiData && Array.isArray(this.evaluasiData.pgList)) {
      this.evaluasiData.pgList.forEach((q, idx) => {
        const ans = this.state.evaluasiAnswers ? this.state.evaluasiAnswers[`pg_${idx}`] : undefined;
        if (ans !== undefined) {
          pgAnsweredCount++;
          if (ans === q.correct) pgCorrectCount++;
        }
      });
    }

    return {
      isCompleted,
      score,
      kkm,
      isPass,
      submittedAt,
      pgCorrectCount,
      pgAnsweredCount,
      pgTotal: (this.evaluasiData && this.evaluasiData.pgList) ? this.evaluasiData.pgList.length : 15,
      urTotal: (this.evaluasiData && this.evaluasiData.uraianList) ? this.evaluasiData.uraianList.length : 5
    };
  },

  getSimulasiAnalytics() {
    const calcCount = this.state.simulasiCalcCount || 0;
    const pingCount = this.state.simulasiPingCount || 0;
    const quests = this.state.simulasiQuests || { q1: false, q2: false, q3: false };
    const questsDone = Object.values(quests).filter(Boolean).length;
    return {
      calcCount,
      pingCount,
      quests,
      questsDone,
      totalQuests: 3,
      isCompleted: questsDone >= 2
    };
  },

  getRefleksiAnalytics() {
    const list = Array.isArray(this.state.reflections) ? this.state.reflections : [];
    return {
      total: list.length,
      isCompleted: list.length > 0,
      list
    };
  },

  getTPMastery() {
    const materi = this.getMateriAnalytics();
    const latihan = this.getLatihanAnalytics();
    const evaluasi = this.getEvaluasiAnalytics();
    const simulasi = this.getSimulasiAnalytics();

    // Pemetaan soal latihan per Tujuan Pembelajaran
    const latTP = {
      TP1: [4, 5, 6],          // Konsep dasar, kelas IP, format biner
      TP2: [7, 9],             // Aturan VLSM urut terbesar, prefix link router /30
      TP3: [0, 1, 2, 3, 8]     // Subnetting, subnet mask, magic number, broadcast, subnet count
    };

    const calcLatihanTPScore = (indices) => {
      if (!indices || indices.length === 0) return 0;
      let correct = 0;
      let count = 0;
      indices.forEach(idx => {
        if (this.state.latihanSubmitted && this.state.latihanSubmitted[idx]) {
          count++;
          if (this.state.latihanAnswers && this.state.latihanAnswers[idx] === this.latihanQuestions[idx].correctKey) {
            correct++;
          }
        }
      });
      return count > 0 ? Math.round((correct / indices.length) * 100) : 0;
    };

    const latScoreTP1 = calcLatihanTPScore(latTP.TP1);
    const latScoreTP2 = calcLatihanTPScore(latTP.TP2);
    const latScoreTP3 = calcLatihanTPScore(latTP.TP3);

    const matScore = materi.percent;
    const hasEval = evaluasi.isCompleted && evaluasi.score !== null;
    const evalScore = hasEval ? evaluasi.score : 0;

    let tp1Val, tp2Val, tp3Val;

    if (hasEval) {
      // Jika sudah ujian evaluasi akhir: Komposisi 25% Materi, 30% Latihan, 45% Evaluasi
      tp1Val = Math.round(matScore * 0.25 + latScoreTP1 * 0.30 + evalScore * 0.45);
      tp2Val = Math.round(matScore * 0.25 + latScoreTP2 * 0.30 + evalScore * 0.45);
      tp3Val = Math.round(matScore * 0.25 + latScoreTP3 * 0.30 + evalScore * 0.45 + (simulasi.questsDone > 0 ? 5 : 0));
    } else {
      // Sebelum ujian akhir: Berdasarkan materi yang dibaca + latihan soal yang sudah dikerjakan
      tp1Val = Math.round(matScore * 0.4 + latScoreTP1 * 0.6);
      tp2Val = Math.round(matScore * 0.4 + latScoreTP2 * 0.6);
      tp3Val = Math.round(matScore * 0.4 + latScoreTP3 * 0.6 + (simulasi.questsDone > 0 ? 10 : 0));
    }

    tp1Val = Math.min(100, Math.max(0, tp1Val));
    tp2Val = Math.min(100, Math.max(0, tp2Val));
    tp3Val = Math.min(100, Math.max(0, tp3Val));

    const getStatus = (val) => {
      if (val >= 85) return { text: 'Sangat Baik (A)', badge: 'badge-success', color: 'var(--color-success)' };
      if (val >= 75) return { text: 'Tuntas KKM (B)', badge: 'badge-blue', color: 'var(--color-interactive)' };
      if (val >= 60) return { text: 'Cukup (C)', badge: 'badge-warning', color: 'var(--color-warning)' };
      return { text: 'Perlu Latihan (D)', badge: 'badge-danger', color: 'var(--color-danger)' };
    };

    return [
      {
        id: 'TP1',
        title: 'Perencanaan Pengalamatan Topologi',
        desc: 'Konsep dasar IPv4, format 32-bit biner/desimal, struktur Network ID vs Host ID.',
        score: tp1Val,
        status: getStatus(tp1Val)
      },
      {
        id: 'TP2',
        title: 'Penerapan Metode CIDR dan VLSM',
        desc: 'Prefix subnet mask dinamis (/24 - /30) dan efisiensi pengurutan alokasi host.',
        score: tp2Val,
        status: getStatus(tp2Val)
      },
      {
        id: 'TP3',
        title: 'Kalkulasi Parameter Subnetting',
        desc: 'Penentuan subnet mask, Magic Number kelipatan blok, Network ID, Broadcast, & Host Valid.',
        score: tp3Val,
        status: getStatus(tp3Val)
      }
    ];
  },

  getOverallUnderstanding() {
    const materi = this.getMateriAnalytics();
    const latihan = this.getLatihanAnalytics();
    const evaluasi = this.getEvaluasiAnalytics();
    const simulasi = this.getSimulasiAnalytics();

    // Bobot penilaian komprehensif:
    // Materi: 20%
    // Simulasi: 15%
    // Latihan: 25%
    // Evaluasi Akhir: 40%
    const matPart = (materi.percent / 100) * 20;
    const simPart = Math.min(15, (simulasi.questsDone / 3) * 10 + (simulasi.calcCount > 0 ? 5 : 0));
    const latPart = (latihan.score / 100) * 25;

    let overallPercent = 0;
    if (evaluasi.isCompleted && evaluasi.score !== null) {
      const evalPart = (evaluasi.score / 100) * 40;
      overallPercent = Math.round(matPart + simPart + latPart + evalPart);
    } else {
      // Skalakan proporsional sebelum evaluasi
      overallPercent = Math.round(((matPart + simPart + latPart) / 60) * 100);
    }
    overallPercent = Math.min(100, Math.max(0, overallPercent));

    let category = 'Perlu Belajar';
    let badgeClass = 'badge-danger';
    if (overallPercent >= 88) {
      category = 'Kategori Amat Baik (A)';
      badgeClass = 'badge-success';
    } else if (overallPercent >= 75) {
      category = 'Kategori Baik (Tuntas KKM)';
      badgeClass = 'badge-blue';
    } else if (overallPercent >= 60) {
      category = 'Kategori Cukup (Perlu Penguatan)';
      badgeClass = 'badge-warning';
    }

    return {
      percent: overallPercent,
      category,
      badgeClass
    };
  },

  syncCurrentStudentProgress() {
    if (!this.state.currentUser || this.state.currentRole !== 'siswa') return;
    const nis = this.state.currentUser.nis;
    if (!Array.isArray(this.state.studentRecords)) this.state.studentRecords = [];

    let rec = this.state.studentRecords.find(r => r.nis === nis);
    const latihanAna = this.getLatihanAnalytics();
    const evalAna = this.getEvaluasiAnalytics();

    if (!rec) {
      rec = {
        id: Date.now(),
        name: this.state.currentUser.name,
        nis: this.state.currentUser.nis,
        kelas: this.state.currentUser.kelas || 'XI TKJ 1',
        latihanScore: latihanAna.score,
        evaluasiScore: evalAna.score !== null ? evalAna.score : 0,
        status: evalAna.isCompleted ? (evalAna.isPass ? 'Tuntas' : 'Remedial') : 'Belum Ujian',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      };
      this.state.studentRecords.unshift(rec);
    } else {
      rec.name = this.state.currentUser.name;
      rec.kelas = this.state.currentUser.kelas || rec.kelas;
      if (latihanAna.answered > 0) rec.latihanScore = latihanAna.score;
      if (evalAna.isCompleted && evalAna.score !== null) {
        rec.evaluasiScore = evalAna.score;
        rec.status = evalAna.isPass ? 'Tuntas' : 'Remedial';
        rec.date = evalAna.submittedAt || rec.date;
      }
    }
    this.save();
  },

  // Helper Methods untuk Modul Pembelajaran
  getModules() {
    return this.state.modulesData || [];
  },

  getModule(index) {
    if (this.state.modulesData && this.state.modulesData[index]) {
      return this.state.modulesData[index];
    }
    return null;
  },

  saveModule(modData, index) {
    if (!Array.isArray(this.state.modulesData)) {
      this.state.modulesData = [];
    }
    if (typeof index === 'number' && index >= 0 && index < this.state.modulesData.length) {
      this.state.modulesData[index] = { ...this.state.modulesData[index], ...modData };
    } else {
      this.state.modulesData.push(modData);
    }
    // Sesuaikan materiProgress
    while (this.state.materiProgress.length < this.state.modulesData.length) {
      this.state.materiProgress.push(false);
    }
    this.save();
  },

  deleteModule(index) {
    if (this.state.modulesData && this.state.modulesData[index]) {
      this.state.modulesData.splice(index, 1);
      if (this.state.materiProgress) {
        this.state.materiProgress.splice(index, 1);
      }
      if (this.state.activeMateriIndex >= this.state.modulesData.length) {
        this.state.activeMateriIndex = Math.max(0, this.state.modulesData.length - 1);
      }
      this.save();
    }
  },

  // Muat contoh materi lengkap (untuk guru/penguji yang ingin demo instan)
  loadSampleModules() {
    this.state.modulesData = JSON.parse(JSON.stringify(this.sampleModulesData));
    this.state.materiProgress = this.state.modulesData.map((_, i) => i === 0);
    this.state.activeMateriIndex = 0;
    this.state.activeSlideIndex = 0;
    this.save();
  },

  // Kosongkan modul materi
  clearModules() {
    this.state.modulesData = [];
    this.state.materiProgress = [];
    this.state.activeMateriIndex = 0;
    this.state.activeSlideIndex = 0;
    this.save();
  },

  // Seed initial dummy records if none exist
  seedDefaultData() {
    this.state.teachersList = [
      {
        id: 1,
        name: 'Bpk. Rifaldi, S.Pd., M.T.',
        nip: '198504122010011008',
        username: 'guru',
        password: 'guru123',
        mapel: 'Perencanaan & Pengalamatan Jaringan',
        role: 'guru'
      }
    ];

    this.state.studentRecords = [
      { id: 1, name: 'Ahmad Fadil', nis: '22101', kelas: 'XI TKJ 1', password: '123', latihanScore: 90, evaluasiScore: 85, status: 'Tuntas', date: '2026-10-25' },
      { id: 2, name: 'Nur Anisa', nis: '22102', kelas: 'XI TKJ 1', password: '123', latihanScore: 100, evaluasiScore: 92, status: 'Tuntas', date: '2026-10-25' },
      { id: 3, name: 'Muhammad Farhan', nis: '22103', kelas: 'XI TKJ 1', password: '123', latihanScore: 70, evaluasiScore: 68, status: 'Remedial', date: '2026-10-26' },
      { id: 4, name: 'Siti Rahma', nis: '22104', kelas: 'XI TKJ 1', password: '123', latihanScore: 80, evaluasiScore: 78, status: 'Tuntas', date: '2026-10-26' },
      { id: 5, name: 'Rifaldi (Siswa Anda)', nis: '210209501001', kelas: 'XI TKJ 1', password: '123', latihanScore: 80, evaluasiScore: 82, status: 'Tuntas', date: '2026-10-28' },
      { id: 6, name: 'Andi Batara', nis: '22106', kelas: 'XI TKJ 1', password: '123', latihanScore: 60, evaluasiScore: 62, status: 'Remedial', date: '2026-10-27' },
      { id: 7, name: 'Zahra Amalia', nis: '22107', kelas: 'XI TKJ 1', password: '123', latihanScore: 90, evaluasiScore: 88, status: 'Tuntas', date: '2026-10-27' },
      { id: 8, name: 'Fajar Ramadhan', nis: '22201', kelas: 'XI TKJ 2', password: '123', latihanScore: 85, evaluasiScore: 84, status: 'Tuntas', date: '2026-10-29' },
      { id: 9, name: 'Putri Maharani', nis: '22202', kelas: 'XI TKJ 2', password: '123', latihanScore: 65, evaluasiScore: 64, status: 'Remedial', date: '2026-10-29' },
      { id: 10, name: 'Dimas Prasetyo', nis: '22301', kelas: 'XI TKJ 3', password: '123', latihanScore: 0, evaluasiScore: 0, status: 'Belum Ujian', date: '2026-10-30' }
    ];

    this.state.reflections = [
      {
        id: 1,
        date: '26 Oktober 2026',
        paham: 'Konsep pembagian kelas IP dan rumus 2^x serta 2^y-2 untuk menentukan jumlah host dan subnet.',
        sulit: 'Masih agak ragu saat menghitung blok subnet jika bit 1 berada di oktet ketiga pada kelas B.',
        lanjut: 'Akan memperbanyak latihan studi kasus topologi VLSM 4 lantai sekolah.'
      }
    ];

    // Secara default materi kosong (sesuai permintaan user)
    this.state.modulesData = [];
    this.state.materiProgress = [];
    this.state.bankSoalLatihan = JSON.parse(JSON.stringify(this.defaultLatihanQuestions));
    this.state.bankSoalEvaluasi = JSON.parse(JSON.stringify(this.defaultEvaluasiData));
  },

  // =========================================================================
  // DATABASE SISWA (STUDENTS TABLE & CRUD)
  // =========================================================================
  getStudents(filters = {}) {
    let list = Array.isArray(this.state.studentRecords) ? [...this.state.studentRecords] : [];
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(s => (s.name && s.name.toLowerCase().includes(q)) || (s.nis && s.nis.toLowerCase().includes(q)));
    }
    if (filters.kelas && filters.kelas !== 'all') {
      list = list.filter(s => s.kelas === filters.kelas);
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter(s => s.status === filters.status);
    }
    return list;
  },

  getStudentByNis(nis) {
    if (!Array.isArray(this.state.studentRecords)) return null;
    return this.state.studentRecords.find(s => s.nis === String(nis).trim()) || null;
  },

  addStudent({ name, nis, kelas, password, latihanScore, evaluasiScore, status }) {
    if (!name || !name.trim()) return { success: false, message: 'Nama lengkap siswa wajib diisi!' };
    if (!nis || !nis.trim()) return { success: false, message: 'NIS siswa wajib diisi!' };
    const cleanNis = String(nis).trim();

    if (!Array.isArray(this.state.studentRecords)) this.state.studentRecords = [];
    if (this.state.studentRecords.some(s => s.nis === cleanNis)) {
      return { success: false, message: `NIS "${cleanNis}" sudah terdaftar di database!` };
    }

    const cleanName = name.trim();
    const cleanKelas = (kelas && kelas.trim()) ? kelas.trim() : 'XI TKJ 1';
    const cleanPass = (password && password.trim()) ? password.trim() : '123';
    const latScore = Number(latihanScore) || 0;
    const evalScore = Number(evaluasiScore) || 0;
    let stStatus = status;
    if (!stStatus) {
      stStatus = evalScore > 0 ? (evalScore >= 75 ? 'Tuntas' : 'Remedial') : 'Belum Ujian';
    }

    const newStudent = {
      id: Date.now(),
      name: cleanName,
      nis: cleanNis,
      kelas: cleanKelas,
      password: cleanPass,
      latihanScore: latScore,
      evaluasiScore: evalScore,
      status: stStatus,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    this.state.studentRecords.unshift(newStudent);
    this.save();
    return { success: true, student: newStudent };
  },

  updateStudent(oldNis, updateData) {
    if (!Array.isArray(this.state.studentRecords)) return { success: false, message: 'Data siswa kosong!' };
    const cleanOldNis = String(oldNis).trim();
    const idx = this.state.studentRecords.findIndex(s => s.nis === cleanOldNis);
    if (idx === -1) return { success: false, message: 'Siswa tidak ditemukan!' };

    const target = this.state.studentRecords[idx];
    const newNis = updateData.nis ? String(updateData.nis).trim() : target.nis;

    if (newNis !== target.nis && this.state.studentRecords.some((s, i) => i !== idx && s.nis === newNis)) {
      return { success: false, message: `NIS "${newNis}" sudah digunakan oleh siswa lain!` };
    }

    const evalScore = updateData.evaluasiScore !== undefined ? Number(updateData.evaluasiScore) : target.evaluasiScore;
    let stStatus = updateData.status || target.status;
    if (updateData.evaluasiScore !== undefined && !updateData.status) {
      stStatus = evalScore > 0 ? (evalScore >= 75 ? 'Tuntas' : 'Remedial') : 'Belum Ujian';
    }

    this.state.studentRecords[idx] = {
      ...target,
      name: updateData.name ? updateData.name.trim() : target.name,
      nis: newNis,
      kelas: updateData.kelas || target.kelas,
      password: (updateData.password && updateData.password.trim()) ? updateData.password.trim() : target.password,
      latihanScore: updateData.latihanScore !== undefined ? Number(updateData.latihanScore) : target.latihanScore,
      evaluasiScore: evalScore,
      status: stStatus,
      date: updateData.date || target.date
    };

    if (this.state.currentUser && this.state.currentUser.nis === cleanOldNis) {
      this.state.currentUser.name = this.state.studentRecords[idx].name;
      this.state.currentUser.nis = this.state.studentRecords[idx].nis;
      this.state.currentUser.kelas = this.state.studentRecords[idx].kelas;
      this.state.evaluasiScore = this.state.studentRecords[idx].evaluasiScore;
      this.state.evaluasiCompleted = this.state.studentRecords[idx].status !== 'Belum Ujian';
    }

    this.save();
    return { success: true, student: this.state.studentRecords[idx] };
  },

  deleteStudent(nis) {
    if (!Array.isArray(this.state.studentRecords)) return { success: false, message: 'Data siswa kosong!' };
    const cleanNis = String(nis).trim();
    const idx = this.state.studentRecords.findIndex(s => s.nis === cleanNis);
    if (idx === -1) return { success: false, message: 'Siswa tidak ditemukan!' };

    const removed = this.state.studentRecords.splice(idx, 1)[0];
    this.save();
    return { success: true, student: removed };
  },

  resetStudentPassword(nis, newPass = '123') {
    const s = this.getStudentByNis(nis);
    if (!s) return { success: false, message: 'Siswa tidak ditemukan!' };
    s.password = newPass;
    this.save();
    return { success: true, message: `Kata sandi untuk ${s.name} (NIS: ${s.nis}) berhasil direset ke "${newPass}".` };
  },

  resetStudentExam(nis) {
    const s = this.getStudentByNis(nis);
    if (!s) return { success: false, message: 'Siswa tidak ditemukan!' };
    s.evaluasiScore = 0;
    s.status = 'Belum Ujian';
    s.date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (this.state.currentUser && this.state.currentUser.nis === String(nis).trim()) {
      this.state.evaluasiCompleted = false;
      this.state.evaluasiScore = null;
      this.state.evaluasiAnswers = {};
      this.state.evaluasiTimeLeft = 1800;
      this.state.evaluasiSubmittedAt = null;
    }
    this.save();
    return { success: true, message: `Riwayat ujian untuk ${s.name} berhasil direset. Siswa dapat menempuh ujian kembali.` };
  },

  // =========================================================================
  // DATABASE BANK SOAL (QUESTIONS TABLE & CRUD)
  // =========================================================================
  getLatihanQuestions() {
    return this.latihanQuestions;
  },

  addLatihanQuestion(qData) {
    const questions = [...this.latihanQuestions];
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id || 0)) + 1 : 1;
    const newQ = {
      id: newId,
      question: qData.question,
      options: qData.options || [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" }
      ],
      correctKey: qData.correctKey || "A",
      explanation: qData.explanation || {
        steps: [qData.steps || "Pembahasan soal."],
        videoNote: qData.videoNote || ""
      }
    };
    questions.push(newQ);
    this.latihanQuestions = questions;
    return { success: true, question: newQ };
  },

  updateLatihanQuestion(index, qData) {
    const questions = [...this.latihanQuestions];
    if (index < 0 || index >= questions.length) return { success: false, message: 'Soal tidak ditemukan!' };
    questions[index] = {
      ...questions[index],
      question: qData.question || questions[index].question,
      options: qData.options || questions[index].options,
      correctKey: qData.correctKey || questions[index].correctKey,
      explanation: qData.explanation || questions[index].explanation
    };
    this.latihanQuestions = questions;
    return { success: true, question: questions[index] };
  },

  deleteLatihanQuestion(index) {
    const questions = [...this.latihanQuestions];
    if (index < 0 || index >= questions.length) return { success: false, message: 'Soal tidak ditemukan!' };
    const removed = questions.splice(index, 1)[0];
    this.latihanQuestions = questions;
    return { success: true, question: removed };
  },

  getEvaluasiData() {
    return this.evaluasiData;
  },

  addEvaluasiQuestion(type, qData) {
    const curEval = JSON.parse(JSON.stringify(this.evaluasiData));
    if (type === 'pg') {
      const newId = curEval.pgList.length > 0 ? Math.max(...curEval.pgList.map(q => q.id || 0)) + 1 : 1;
      const newQ = {
        id: newId,
        text: qData.text,
        options: qData.options || ["", "", "", ""],
        correct: Number(qData.correct) || 0,
        points: Number(qData.points) || 5
      };
      curEval.pgList.push(newQ);
      this.evaluasiData = curEval;
      return { success: true, question: newQ };
    } else {
      const newId = curEval.uraianList.length > 0 ? Math.max(...curEval.uraianList.map(q => q.id || 0)) + 1 : 16;
      const newQ = {
        id: newId,
        text: qData.text,
        keywords: qData.keywords || [],
        rubric: qData.rubric || "",
        points: Number(qData.points) || 5
      };
      curEval.uraianList.push(newQ);
      this.evaluasiData = curEval;
      return { success: true, question: newQ };
    }
  },

  updateEvaluasiQuestion(type, index, qData) {
    const curEval = JSON.parse(JSON.stringify(this.evaluasiData));
    if (type === 'pg') {
      if (!curEval.pgList[index]) return { success: false, message: 'Soal tidak ditemukan!' };
      curEval.pgList[index] = { ...curEval.pgList[index], ...qData };
      this.evaluasiData = curEval;
      return { success: true, question: curEval.pgList[index] };
    } else {
      if (!curEval.uraianList[index]) return { success: false, message: 'Soal tidak ditemukan!' };
      curEval.uraianList[index] = { ...curEval.uraianList[index], ...qData };
      this.evaluasiData = curEval;
      return { success: true, question: curEval.uraianList[index] };
    }
  },

  deleteEvaluasiQuestion(type, index) {
    const curEval = JSON.parse(JSON.stringify(this.evaluasiData));
    if (type === 'pg') {
      if (!curEval.pgList[index]) return { success: false, message: 'Soal tidak ditemukan!' };
      const removed = curEval.pgList.splice(index, 1)[0];
      this.evaluasiData = curEval;
      return { success: true, question: removed };
    } else {
      if (!curEval.uraianList[index]) return { success: false, message: 'Soal tidak ditemukan!' };
      const removed = curEval.uraianList.splice(index, 1)[0];
      this.evaluasiData = curEval;
      return { success: true, question: removed };
    }
  },

  resetBankSoal() {
    this.latihanQuestions = JSON.parse(JSON.stringify(this.defaultLatihanQuestions));
    this.evaluasiData = JSON.parse(JSON.stringify(this.defaultEvaluasiData));
    this.save();
    return { success: true, message: 'Bank Soal Latihan dan Evaluasi berhasil direset ke standar kurikulum!' };
  },

  // =========================================================================
  // DATABASE BACKUP, RESTORE & SYSTEM STATS
  // =========================================================================
  getDatabaseStats() {
    const jsonStr = localStorage.getItem('netlearn_state') || '';
    const bytes = new Blob([jsonStr]).size;
    const kb = (bytes / 1024).toFixed(1);

    const students = Array.isArray(this.state.studentRecords) ? this.state.studentRecords : [];
    const modules = this.getModules();
    const latQ = this.latihanQuestions.length;
    const evalPg = (this.evaluasiData && this.evaluasiData.pgList) ? this.evaluasiData.pgList.length : 0;
    const evalUr = (this.evaluasiData && this.evaluasiData.uraianList) ? this.evaluasiData.uraianList.length : 0;
    const reflections = Array.isArray(this.state.reflections) ? this.state.reflections : [];
    const teachers = Array.isArray(this.state.teachersList) ? this.state.teachersList : [];

    return {
      studentCount: students.length,
      moduleCount: modules.length,
      questionCount: latQ + evalPg + evalUr,
      latihanCount: latQ,
      evaluasiCount: evalPg + evalUr,
      reflectionCount: reflections.length,
      teacherCount: teachers.length,
      storageBytes: bytes,
      storageKB: kb,
      schemaVersion: this.state.schemaVersion || 4,
      lastUpdated: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
  },

  exportDatabaseJSON() {
    const backup = {
      app: 'NetLearn - Platform Pengalamatan Jaringan SMK Negeri 3 Makassar',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      state: this.state,
      latihanQuestions: this.latihanQuestions,
      evaluasiData: this.evaluasiData
    };
    return JSON.stringify(backup, null, 2);
  },

  importDatabaseJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Format file JSON tidak valid!' };
      }

      if (parsed.state) {
        this.state = { ...this.state, ...parsed.state };
      } else {
        this.state = { ...this.state, ...parsed };
      }

      if (parsed.latihanQuestions) {
        this.state.bankSoalLatihan = parsed.latihanQuestions;
      }
      if (parsed.evaluasiData) {
        this.state.bankSoalEvaluasi = parsed.evaluasiData;
      }

      this.save();
      return { success: true, message: 'Database NetLearn berhasil dipulihkan dari file cadangan!' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Gagal memproses file JSON: ' + e.message };
    }
  },

  seedFullDatabase() {
    this.seedDefaultData();
    this.loadSampleModules();
    this.resetBankSoal();
    this.save();
    return { success: true, message: 'Paket Data Standar SMK Negeri 3 Makassar (Siswa, Modul, Bank Soal) berhasil dimuat!' };
  },

  // Capaian Pembelajaran & Tujuan Pembelajaran (CP / TP)
  learningObjectives: {
    cp: "Pada akhir fase F, peserta didik mampu merencanakan topologi dan arsitektur jaringan sesuai kebutuhan, mengumpulkan kebutuhan teknis pengguna yang menggunakan jaringan, mengumpulkan data peralatan jaringan dengan teknologi yang sesuai, melakukan pengalamatan jaringan, memahami CIDR dan VLSM, serta menghitung subnetting.",
    tpList: [
      {
        id: "TP1",
        title: "Perencanaan Pengalamatan Topologi",
        desc: "Peserta didik kelas XI mampu melakukan pengalamatan jaringan  diuji melalui soal dengan memperoleh skor minimal 75.",
        features: [
          "Identifikasi jumlah kebutuhan host per segmen",
          "Visualisasi alokasi IP perangkat (Router, Switch, PC, Server)",
          "Menghindari IP address conflict pada topologi"
        ],
        icon: "topology"
      },
      {
        id: "TP2",
        title: "Penerapan Metode CIDR dan VLSM",
        desc: "Peserta didik kelas XI mampu menerapkan metode CIDR dan VLSM untuk mengalokasikan alamat IP melalui studi kasus dan latihan dengan memperoleh skor minimal 75.",
        features: [
          "Pengurutan kebutuhan host terbesar hingga terkecil",
          "Penentuan prefix subnet mask dinamis (/24 - /30)",
          "Efisiensi penggunaan IP tanpa pemborosan (IP wastage)"
        ],
        icon: "calculator"
      },
      {
        id: "TP3",
        title: "Kalkulasi Parameter Subnetting",
        desc: "Peserta didik kelas XI mampu menghitung subnetting untuk menentukan subnet mask, network address, broadcast address, dan rentang alamat host berdasarkan soal yang diberikan dengan memperoleh skor minimal 75.",
        features: [
          "Konversi desimal ke biner dan sebaliknya",
          "Penentuan blok kelipatan subnet (Magic Number)",
          "Validasi konektivitas ping antar segmen jaringan"
        ],
        icon: "binary"
      }
    ]
  },

  // Template Contoh Materi (Bisa dimuat oleh Guru / Penguji dengan sekali klik)
  // Template Contoh Materi (7 Modul Lengkap Sesuai Kurikulum Merdeka & Target CP/TP)
  sampleModulesData: [
  {
    "id": 1,
    "title": "Konsep Dasar Pengalamatan Jaringan (IPv4)",
    "tpCode": "TP1",
    "subtitle": "Fondasi pengalamatan logis, analogi komunikasi data, format 32-bit, dan pemisahan Network ID vs Host ID.",
    "pptUrl": "",
    "pptSlides": [
      {
        "title": "Apa itu Pengalamatan Jaringan?",
        "subtitle": "Fondasi Utama Komunikasi Data Digital",
        "bullets": [
          "Pengalamatan jaringan adalah identitas logis unik yang wajib dimiliki setiap perangkat (PC, Server, Router) di jaringan.",
          "Setiap paket data membawa Alamat Pengirim (Source IP) dan Alamat Penerima (Destination IP).",
          "Tanpa IP Address, perangkat switch dan router tidak dapat mengarahkan lalu lintas data ke tujuan yang tepat."
        ],
        "highlight": "💡 Analogi Kantor Pos: Alamat IP bertindak layaknya nama jalan dan nomor rumah agar surat sampai ke tangan pemiliknya secara akurat!"
      },
      {
        "title": "Struktur & Format IPv4 (32-Bit)",
        "subtitle": "Pembagian 4 Blok Oktet Dotted-Decimal",
        "bullets": [
          "IPv4 tersusun dari 32 digit bilangan biner (0 dan 1) dengan total 4.294.967.296 alamat di dunia.",
          "Untuk memudahkan pembacaan manusia, 32 bit dibagi menjadi 4 oktet @ 8-bit yang dipisahkan titik.",
          "Rentang angka per oktet adalah 0 sampai 255 (2^8 = 256 kombinasi)."
        ],
        "highlight": "🔢 Contoh: IP 192.168.10.1 ditulis dalam biner = 11000000 . 10101000 . 00001010 . 00000001"
      },
      {
        "title": "Network ID vs Host ID",
        "subtitle": "Dua Komponen Wajib Setiap Alamat IP",
        "bullets": [
          "Network ID: Alamat kelompok/segmen jaringan (identik dengan nama komplek perumahan).",
          "Host ID: Nomor identitas unik perangkat individu di dalam kelompok tersebut (identik dengan nomor rumah).",
          "Komputer dalam 1 laboratorium yang sama WAJIB memiliki Network ID identik dan Host ID berbeda."
        ],
        "highlight": "⚡ Aturan Dasar: Dua komputer dengan Network ID berbeda TIDAK BISA saling bertukar data tanpa melalui Router (Default Gateway)!"
      },
      {
        "title": "Klasifikasi Kelas IP (A, B, C) & IP Privat",
        "subtitle": "Standar Pembagian Alamat Jaringan",
        "bullets": [
          "Kelas A (1–126): Default mask /8 (255.0.0.0) — Jaringan skala raksasa (16 juta host/segmen).",
          "Kelas B (128–191): Default mask /16 (255.255.0.0) — Jaringan skala menengah (65.534 host/segmen).",
          "Kelas C (192–223): Default mask /24 (255.255.255.0) — Jaringan lokal LAN / Laboratorium SMK (254 host).",
          "IP Privat RFC 1918 (192.168.x.x, 172.16.x.x, 10.x.x.x) digunakan gratis dan aman di jaringan internal sekolah."
        ],
        "highlight": "🏫 Praktikum SMK: Kelas C Privat (192.168.1.x /24) adalah konfigurasi yang paling umum dipakai di lab sekolah."
      }
    ],
    "wordDetail": "\n      <div class=\"word-doc-paper\">\n        <div class=\"word-doc-header\">\n          <div class=\"doc-school-title\">SMK NEGERI 3 MAKASSAR</div>\n          <div class=\"doc-meta-sub\">PROGRAM KEAHLIAN TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI (TJKT)</div>\n          <div class=\"doc-meta-divider\"></div>\n          <div class=\"doc-subject\">MODUL AJAR: PENGALAMATAN JARINGAN KOMPUTER (IPv4)</div>\n          <div class=\"doc-badge-tp\">SASARAN: TUJUAN PEMBELAJARAN 1 (TP1)</div>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB I: PENGERTIAN & FUNGSI PENGALAMATAN JARINGAN</h4>\n          <p>Pengalamatan jaringan (Network Addressing) merupakan mekanisme logis pengidentifikasian setiap node atau antarmuka jaringan (Network Interface Card/NIC) yang berpartisipasi dalam pertukaran data pada Layer 3 (Network Layer) model Open Systems Interconnection (OSI).</p>\n          <p>Berbeda dengan alamat fisik Media Access Control (MAC Address) yang terukir secara permanen pada chip hardware kartu jaringan, IP Address bersifat hierarkis dan logis, sehingga dapat diatur ulang sesuai segmentasi dan lokasi topologi jaringan.</p>\n          <div class=\"callout callout-info\" style=\"margin: 1rem 0;\">\n            <strong>Fungsi Pokok IP Address:</strong>\n            <ol style=\"margin-left: 1.25rem; margin-top: 0.25rem;\">\n              <li>Sebagai alat identifikasi host atau antarmuka jaringan (Addressing).</li>\n              <li>Sebagai penentu rute pengiriman paket melintasi jaringan internet (Routing).</li>\n              <li>Memisahkan lalu lintas lokal dengan lalu lintas jaringan luar (Segmentasi).</li>\n            </ol>\n          </div>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB II: ANATOMI STRUKTUR BILANGAN 32-BIT</h4>\n          <p>IPv4 tersusun dari 32 bit biner yang dikelompokkan menjadi 4 oktet (masing-masing 8 bit). Notasi standar yang digunakan adalah <em>Dotted-Decimal Notation</em> (desimal bertitik), misalnya <code>192.168.10.1</code>.</p>\n          <p>Tiap bit memiliki bobot eksponensial basis 2:</p>\n          <div style=\"background: var(--color-bg-muted); padding: 0.75rem 1rem; border-radius: 8px; font-family: var(--font-mono); font-size: 0.85rem; margin: 0.75rem 0;\">\n            Bit 7 = 128 | Bit 6 = 64 | Bit 5 = 32 | Bit 4 = 16<br>\n            Bit 3 = 8   | Bit 2 = 4  | Bit 1 = 2  | Bit 0 = 1\n          </div>\n          <p>Nilai maksimum sebuah oktet adalah ketika seluruh 8 bit bernilai 1 (11111111 biner = 128+64+32+16+8+4+2+1 = 255 desimal). Oleh karena itu, tidak ada angka oktet IPv4 yang melebihi 255.</p>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB III: PEMISAHAN NETWORK ID DAN HOST ID</h4>\n          <p>Setiap alamat IP secara matematis terbagi menjadi dua bagian mendasar:</p>\n          <ul>\n            <li><strong>Network Identifier (Net ID):</strong> Menandakan alamat kelompok jaringan tempat perangkat tersebut terhubung. Komputer yang berada di satu ruangan lab switch yang sama wajib memiliki Network ID yang identik.</li>\n            <li><strong>Host Identifier (Host ID):</strong> Menandakan nomor urut unik komputer di dalam kelompok network tersebut. Di dalam satu subnet, tidak boleh ada dua perangkat yang memiliki Host ID sama (karena akan memicu IP Conflict).</li>\n          </ul>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB IV: STUDI KASUS LABORATORIUM KOMPUTER SMK</h4>\n          <p>Di Laboratorium SMK Negeri 3 Makassar terdapat 30 PC Siswa dan 1 Server Guru yang terhubung ke satu unit Switch 48-port:</p>\n          <ul>\n            <li>IP Server Guru: <code>192.168.1.1</code> (Net ID: 192.168.1, Host ID: .1)</li>\n            <li>IP PC Siswa 01: <code>192.168.1.10</code> (Net ID: 192.168.1, Host ID: .10)</li>\n            <li>IP PC Siswa 02: <code>192.168.1.11</code> (Net ID: 192.168.1, Host ID: .11)</li>\n          </ul>\n          <p>Apabila PC Siswa 01 keliru diatur menjadi <code>192.168.2.10</code>, komputer tersebut tidak akan bisa saling ping dengan Server Guru karena berada pada Network ID yang berbeda.</p>\n        </div>\n      </div>\n    ",
    "wordFileUrl": "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing",
    "wordFileName": "Modul_1_Pengalamatan_Jaringan_SMKN3.docx",
    "videoUrl": "https://www.youtube.com/watch?v=M11SvDtPBhA",
    "videoTitle": "Tutorial Konsep Dasar Pengalamatan IP Address & Konversi Biner",
    "keyPoints": [
      "Pengalamatan logis Layer 3 OSI untuk merutekan paket data.",
      "IPv4 berukuran total 32 bit (4 oktet) dengan rentang tiap oktet 0-255.",
      "Network ID mengidentifikasi segmen, Host ID mengidentifikasi perangkat.",
      "Kelas C privat (192.168.x.x) adalah standar utama jaringan LAN sekolah."
    ]
  },
  {
    "id": 2,
    "title": "Representasi & Konversi Bilangan Biner",
    "tpCode": "TP3",
    "subtitle": "Sistem bilangan basis 2, bobot 8 bit (128 s.d. 1), teknik konversi biner-desimal dan desimal-biner untuk IPv4.",
    "pptUrl": "",
    "pptSlides": [
      {
        "title": "Mengapa Komputer Memakai Bilangan Biner?",
        "subtitle": "Logika Transistor Digital (On dan Off)",
        "bullets": [
          "Komputer dan perangkat jaringan hanya memahami dua status elektrik: sinyal tegangan tinggi (1) dan tegangan rendah (0).",
          "Setiap karakter, instruksi, dan alamat IP pada intinya disimpan sebagai aliran bit biner 0 dan 1.",
          "Memahami biner adalah kunci utama menguasai Subnetting dan kalkulasi Subnet Mask."
        ],
        "highlight": "💡 Fakta: Alamat IP 192.168.1.1 yang kita ketik di laptop dibaca switch sebagai 32 digit biner murni!"
      },
      {
        "title": "Tabel Nilai Bobot 8-Bit (Positional Value)",
        "subtitle": "Fondasi Utama Perhitungan Konversi Satu Oktet",
        "bullets": [
          "Satu oktet terdiri atas 8 bit, dibaca dari bit paling kiri (Most Significant Bit / MSB) ke paling kanan (LSB).",
          "Bobot tiap posisi berturut-turut: 2^7=128, 2^6=64, 2^5=32, 2^4=16, 2^3=8, 2^2=4, 2^1=2, 2^0=1.",
          "Untuk mengubah biner ke desimal, cukup jumlahkan bobot pada bit-bit yang bernilai 1."
        ],
        "highlight": "🔢 Rumus Cepat Biner -> Desimal: 11000000 = 128 + 64 = 192!"
      },
      {
        "title": "Metode Pengurangan Desimal ke Biner",
        "subtitle": "Teknik Cepat Tanpa Kalkulator",
        "bullets": [
          "Bandingkan angka desimal dengan bobot dari kiri (128).",
          "Jika angka >= bobot: tulis 1, kurangi angka dengan bobot.",
          "Jika angka < bobot: tulis 0, lanjutkan ke bobot berikutnya.",
          "Ulangi sampai bit terakhir (bobot 1) selesai dievaluasi."
        ],
        "highlight": "⚡ Contoh Konversi 168: 168>=128 (1, sisa 40), 40<64 (0), 40>=32 (1, sisa 8), 8<16 (0), 8>=8 (1, sisa 0) -> 10101000!"
      },
      {
        "title": "Kombinasi Oktet Kritis Subnet Mask",
        "subtitle": "8 Angka Sakti yang Wajib Dihapal Teknisi Jaringan",
        "bullets": [
          "/25 = 10000000 = 128",
          "/26 = 11000000 = 192",
          "/27 = 11100000 = 224",
          "/28 = 11110000 = 240",
          "/29 = 11111000 = 248",
          "/30 = 11111100 = 252"
        ],
        "highlight": "🏆 Tip Ujian: Menguasai 6 angka ini membuat perhitungan subnetting selesai dalam hitungan detik!"
      }
    ],
    "wordDetail": "\n      <div class=\"word-doc-paper\">\n        <div class=\"word-doc-header\">\n          <div class=\"doc-school-title\">SMK NEGERI 3 MAKASSAR</div>\n          <div class=\"doc-meta-sub\">PROGRAM KEAHLIAN TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI (TJKT)</div>\n          <div class=\"doc-meta-divider\"></div>\n          <div class=\"doc-subject\">MODUL AJAR: REPRESENTASI & KONVERSI BILANGAN BINER</div>\n          <div class=\"doc-badge-tp\">SASARAN: TUJUAN PEMBELAJARAN 3 (TP3)</div>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB I: URGENSI BILANGAN BINER PADA IPv4</h4>\n          <p>Dalam komunikasi data jaringan komputer, seluruh paket informasi ditransmisikan dalam wujud bit biner (Binary Digit). Walaupun administrator jaringan mengonfigurasi perangkat menggunakan format desimal bertitik (seperti <code>192.168.1.1</code>), proses perutean (routing) dan pemfilteran paket oleh CPU router selalu dieksekusi dalam format biner 32 bit.</p>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB II: SISTEM NILAI TEMPAT OKTET 8-BIT</h4>\n          <p>Setiap oktet memiliki rentang nilai dari 0 (00000000) hingga 255 (11111111). Bobot eksponensial basis dua dari masing-masing bit adalah sebagai berikut:</p>\n          <table class=\"table-compact\" style=\"margin: 0.75rem 0; width: 100%; text-align: center;\">\n            <tr style=\"background: var(--color-bg-muted); font-weight: 700;\">\n              <td>Bit 7</td><td>Bit 6</td><td>Bit 5</td><td>Bit 4</td><td>Bit 3</td><td>Bit 2</td><td>Bit 1</td><td>Bit 0</td>\n            </tr>\n            <tr style=\"font-family: var(--font-mono); font-size: 0.95rem;\">\n              <td>128</td><td>64</td><td>32</td><td>16</td><td>8</td><td>4</td><td>2</td><td>1</td>\n            </tr>\n          </table>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB III: PROSEDUR KONVERSI DUA ARAH</h4>\n          <p><strong>1. Konversi Biner ke Desimal:</strong> Jumlahkan nilai bobot tempat yang berisi angka 1.<br>\n          Contoh: <code>11010000 = 128 + 64 + 16 = 208</code>.</p>\n          <p><strong>2. Konversi Desimal ke Biner:</strong> Gunakan metode pengurangan bertingkat terhadap tabel bobot dari kiri ke kanan.<br>\n          Contoh konversi angka 170:<br>\n          - 170 >= 128 -> Bit=1, sisa 42<br>\n          - 42 < 64    -> Bit=0<br>\n          - 42 >= 32  -> Bit=1, sisa 10<br>\n          - 10 < 16   -> Bit=0<br>\n          - 10 >= 8   -> Bit=1, sisa 2<br>\n          - 2 < 4     -> Bit=0<br>\n          - 2 >= 2    -> Bit=1, sisa 0<br>\n          - 0 < 1     -> Bit=0<br>\n          Hasil biner = <code>10101010</code>.</p>\n        </div>\n      </div>\n    ",
    "wordFileUrl": "",
    "wordFileName": "Modul_2_Representasi_Biner_IPv4.docx",
    "videoUrl": "https://www.youtube.com/watch?v=M11SvDtPBhA",
    "videoTitle": "Tutorial Konversi Biner ke Desimal & Desimal ke Biner untuk Subnetting",
    "keyPoints": [
      "Satu oktet IPv4 terdiri atas 8 bit bernilai bobot 128, 64, 32, 16, 8, 4, 2, 1.",
      "Nilai desimal maksimum satu oktet adalah 255 (seluruh bit 1).",
      "Kombinasi biner oktet mask menentukan batas segmentasi jaringan."
    ]
  },
  {
    "id": 3,
    "title": "Struktur Oktet & Klasifikasi Alamat IP (Kelas A, B, C)",
    "tpCode": "TP1",
    "subtitle": "Arsitektur classful addressing, rentang oktet pertama, alokasi IP privat RFC 1918 vs IP publik.",
    "pptUrl": "",
    "pptSlides": [
      {
        "title": "Arsitektur Classful Addressing",
        "subtitle": "Sistem Pengelompokan Bersejarah Alamat IPv4",
        "bullets": [
          "Pada era awal ARPANET, alamat IPv4 diklasifikasikan ke dalam kelas-kelas kaku: A, B, C, D, dan E.",
          "Klasifikasi ditentukan oleh pola bit-bit pertama pada oktet pertama.",
          "Kelas A untuk institusi global besar, Kelas B untuk kampus/korporasi menengah, Kelas C untuk jaringan lokal kecil."
        ],
        "highlight": "💡 Aturan: Kelas A dimulai bit '0', Kelas B dimulai bit '10', Kelas C dimulai bit '110'!"
      },
      {
        "title": "Rentang & Batas Oktet Pertama Tiap Kelas",
        "subtitle": "Mengetahui Kelas Hanya dengan Membaca Oktet Pertama",
        "bullets": [
          "Kelas A: 1.0.0.0 s.d. 126.255.255.255 (Default Subnet Mask 255.0.0.0 /8).",
          "Kelas B: 128.0.0.0 s.d. 191.255.255.255 (Default Subnet Mask 255.255.0.0 /16).",
          "Kelas C: 192.0.0.0 s.d. 223.255.255.255 (Default Subnet Mask 255.255.255.0 /24).",
          "Kelas D (224-239) untuk Multicast, Kelas E (240-255) untuk Eksperimental."
        ],
        "highlight": "🔢 Angka 127: Direservasi secara khusus untuk fungsi Loopback Diagnostic (127.0.0.1) dan bukan untuk host!"
      },
      {
        "title": "Alamat IP Privat (RFC 1918) vs IP Publik",
        "subtitle": "Menjaga Keamanan dan Menghemat Alamat Global",
        "bullets": [
          "IP Publik: Alamat berbayar terdaftar di IANA/APNIC yang dapat diakses langsung dari seluruh dunia melalui internet.",
          "IP Privat: Alamat yang bebas digunakan gratis di jaringan LAN internal tanpa lisensi.",
          "Rentang Privat: 10.0.0.0/8 (Kelas A), 172.16.0.0/12 (Kelas B), 192.168.0.0/16 (Kelas C).",
          "Perangkat dengan IP Privat membutuhkan NAT (Network Address Translation) pada router untuk berselancar di internet."
        ],
        "highlight": "🛡️ Keamanan: Router internet di seluruh dunia secara otomatis memblokir paket ber-IP privat yang melintas keluar!"
      }
    ],
    "wordDetail": "\n      <div class=\"word-doc-paper\">\n        <div class=\"word-doc-header\">\n          <div class=\"doc-school-title\">SMK NEGERI 3 MAKASSAR</div>\n          <div class=\"doc-meta-sub\">PROGRAM KEAHLIAN TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI (TJKT)</div>\n          <div class=\"doc-meta-divider\"></div>\n          <div class=\"doc-subject\">MODUL AJAR: KLASIFIKASI KELAS ALAMAT IP & IP PRIVAT</div>\n          <div class=\"doc-badge-tp\">SASARAN: TUJUAN PEMBELAJARAN 1 (TP1)</div>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB I: PEMBAGIAN KELAS CLASSFUL IPv4</h4>\n          <p>Sebelum notasi CIDR diadopsi secara luas, alamat IPv4 dipartisi ke dalam 5 kelas berdasarkan nilai oktet pertamanya:</p>\n          <ul>\n            <li><strong>Kelas A (1 - 126):</strong> Format Net.Host.Host.Host. Menyediakan 126 network dengan masing-masing 16.777.214 host valid.</li>\n            <li><strong>Kelas B (128 - 191):</strong> Format Net.Net.Host.Host. Menyediakan 16.384 network dengan masing-masing 65.534 host valid.</li>\n            <li><strong>Kelas C (192 - 223):</strong> Format Net.Net.Net.Host. Menyediakan 2.097.152 network dengan masing-masing 254 host valid.</li>\n          </ul>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB II: STANDAR IP PRIVAT RFC 1918</h4>\n          <p>Untuk menghemat alokasi IPv4 global yang kian menipis, Internet Engineering Task Force (IETF) menetapkan RFC 1918 yang mencadangkan 3 blok alamat privat yang tidak boleh dirutekan di internet publik:</p>\n          <ol>\n            <li>10.0.0.0 - 10.255.255.255 (Prefix 10.0.0.0/8)</li>\n            <li>172.16.0.0 - 172.31.255.255 (Prefix 172.16.0.0/12)</li>\n            <li>192.168.0.0 - 192.168.255.255 (Prefix 192.168.0.0/16)</li>\n          </ol>\n        </div>\n      </div>\n    ",
    "wordFileUrl": "",
    "wordFileName": "Modul_3_Klasifikasi_Kelas_IP_SMKN3.docx",
    "videoUrl": "https://www.youtube.com/watch?v=M11SvDtPBhA",
    "videoTitle": "Tutorial Klasifikasi Kelas IP Address A, B, C dan Standar RFC 1918",
    "keyPoints": [
      "Rentang oktet pertama menentukan kelas: A (1-126), B (128-191), C (192-223).",
      "Alamat 127.0.0.1 digunakan untuk pengujian loopback stack TCP/IP internal.",
      "IP privat RFC 1918 bebas digunakan pada LAN sekolah tanpa registrasi IANA."
    ]
  },
  {
    "id": 4,
    "title": "Subnet Mask & Operasi Logika Bitwise AND",
    "tpCode": "TP3",
    "subtitle": "Fungsi batas pemisah Network ID vs Host ID serta mekanisme logika perkalian biner pada interface jaringan.",
    "pptUrl": "",
    "pptSlides": [
      {
        "title": "Apa Fungsi Subnet Mask?",
        "subtitle": "Pemisah Tegas Antara Network ID dan Host ID",
        "bullets": [
          "Subnet mask adalah deretan 32 bit yang bekerja berdampingan dengan IP Address.",
          "Bit 1 kontinu menunjukkan porsi Network ID, sedangkan bit 0 menunjukkan porsi Host ID.",
          "Subnet mask SELALU diawali deretan bit 1 tanpa terputus dari kiri ke kanan."
        ],
        "highlight": "💡 Aturan Baku: Subnet mask tidak pernah memiliki bit 0 di tengah deretan bit 1!"
      },
      {
        "title": "Default Subnet Mask Tiap Kelas",
        "subtitle": "Standar Classful Subnet Mask",
        "bullets": [
          "Kelas A: 255.0.0.0 (/8) — 8 bit network, 24 bit host.",
          "Kelas B: 255.255.0.0 (/16) — 16 bit network, 16 bit host.",
          "Kelas C: 255.255.255.0 (/24) — 24 bit network, 8 bit host."
        ],
        "highlight": "🔢 Prefix Notasi (/x): Angka setelah garis miring menyatakan total bit 1 pada Subnet Mask."
      },
      {
        "title": "Operasi Logika Bitwise AND",
        "subtitle": "Mekanisme Komputer Menentukan Network Address",
        "bullets": [
          "Komputer melakukan perkalian biner (AND) antara IP Address dan Subnet Mask.",
          "Tabel Logika AND: 1 AND 1 = 1. Selain itu hasilnya SELALU 0.",
          "Hasil operasi Bitwise AND adalah Network Address resmi dari segmen tersebut."
        ],
        "highlight": "⚡ Contoh: IP 192.168.1.50 AND 255.255.255.0 menghasilkan Network ID 192.168.1.0!"
      }
    ],
    "wordDetail": "\n      <div class=\"word-doc-paper\">\n        <div class=\"word-doc-header\">\n          <div class=\"doc-school-title\">SMK NEGERI 3 MAKASSAR</div>\n          <div class=\"doc-meta-sub\">PROGRAM KEAHLIAN TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI</div>\n          <div class=\"doc-meta-divider\"></div>\n          <div class=\"doc-subject\">MODUL AJAR: SUBNET MASK & OPERASI LOGIKA BITWISE AND</div>\n          <div class=\"doc-badge-tp\">SASARAN: TUJUAN PEMBELAJARAN 3 (TP3)</div>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB I: DEFINISI DAN PERAN SUBNET MASK</h4>\n          <p>Subnet Mask adalah penanda 32-bit yang digunakan oleh protokol TCP/IP untuk menentukan apakah alamat IP tujuan berada di subnet lokal (sehingga paket dapat dikirim langsung melalui Switch) atau di jaringan jarak jauh (sehingga paket harus diarahkan ke Default Gateway/Router).</p>\n          <p>Bit 1 pada Subnet Mask menandai bagian Network ID, sedangkan bit 0 menandai bagian Host ID.</p>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB II: SIMULASI OPERASI BITWISE AND</h4>\n          <p>Katakanlah sebuah komputer memiliki IP <code>192.168.10.75</code> dengan Subnet Mask <code>255.255.255.192 (/26)</code>. Kartu jaringan (NIC) menghitung Network ID dengan cara:</p>\n          <pre style=\"background:var(--color-bg-muted); padding:1rem; border-radius:8px; font-family:var(--font-mono); font-size:0.85rem;\">\nIP Address  : 192.168.10.75  -> 11000000.10101000.00001010.01001011\nSubnet Mask : 255.255.255.192 -> 11111111.11111111.11111111.11000000\n---------------------------------------------------------------------- (AND)\nNetwork ID  : 192.168.10.64  -> 11000000.10101000.00001010.01000000\n          </pre>\n          <p>Dari perhitungan biner di atas, terbukti bahwa komputer tersebut berada pada subnet <strong>192.168.10.64/26</strong>.</p>\n        </div>\n      </div>\n    ",
    "wordFileUrl": "",
    "wordFileName": "Modul_4_Subnet_Mask_Bitwise.docx",
    "videoUrl": "https://www.youtube.com/watch?v=s_Ntt6eTn94",
    "videoTitle": "Tutorial Subnet Mask & Cara Kerja Logika Bitwise AND",
    "keyPoints": [
      "Subnet mask memisahkan porsi Network ID (bit 1) dan Host ID (bit 0).",
      "Operasi Bitwise AND menghasilkan Network Address resmi.",
      "Prefix garis miring (/x) menunjukkan total bit 1 pada subnet mask."
    ]
  },
  {
    "id": 5,
    "title": "Classless Inter-Domain Routing (CIDR)",
    "tpCode": "TP2",
    "subtitle": "Peralihan dari classful ke classless, notasi garis miring prefix (/x), tabel konversi subnet mask fleksibel.",
    "pptUrl": "",
    "pptSlides": [
      {
        "title": "Latar Belakang CIDR (RFC 1519)",
        "subtitle": "Solusi Menghapus Keterbatasan Sistem Kelas",
        "bullets": [
          "Sistem kelas lama sangat boros: jika butuh 300 komputer, harus mengambil Kelas B (65.534 host), membuang 65.000+ IP!",
          "CIDR diperkenalkan tahun 1993 untuk memungkinkan alokasi prefix dengan ukuran bit bebas.",
          "Mengizinkan perutean fleksibel berbasis batas bit apapun (arbitrary prefix length)."
        ],
        "highlight": "💡 Keunggulan CIDR: Jaringan dapat dipotong sesuai kebutuhan presisi tanpa terikat kelas A, B, atau C!"
      },
      {
        "title": "Notasi Prefix Garis Miring (/Slash)",
        "subtitle": "Menulis Subnet Mask Secara Lebih Efisien dan Ringkas",
        "bullets": [
          "Notasi CIDR dituliskan dengan tanda garis miring (/) diikuti jumlah bit bernilai 1.",
          "Contoh: 255.255.255.0 memiliki 24 bit 1 kontinu, ditulis sebagai /24.",
          "Jika bit 1 bertambah 2 bit menjadi 26 bit 1, ditulis /26 (255.255.255.192)."
        ],
        "highlight": "🔢 Konsep: Setiap penambahan 1 bit prefix (/24 ke /25) akan membelah ukuran jaringan menjadi separuhnya!"
      },
      {
        "title": "Tabel Pemetaan Prefix /24 sampai /30",
        "subtitle": "Standar Segmentasi Praktik Jaringan SMK",
        "bullets": [
          "/24 = 255.255.255.0 (254 host valid)",
          "/25 = 255.255.255.128 (126 host valid)",
          "/26 = 255.255.255.192 (62 host valid)",
          "/27 = 255.255.255.224 (30 host valid)",
          "/28 = 255.255.255.240 (14 host valid)",
          "/29 = 255.255.255.248 (6 host valid)",
          "/30 = 255.255.255.252 (2 host valid — Link Point-to-Point)"
        ],
        "highlight": "⚡ Penting: Prefix /31 dan /32 tidak menyediakan host valid untuk komunikasi standar jaringan LAN!"
      }
    ],
    "wordDetail": "\n      <div class=\"word-doc-paper\">\n        <div class=\"word-doc-header\">\n          <div class=\"doc-school-title\">SMK NEGERI 3 MAKASSAR</div>\n          <div class=\"doc-meta-sub\">PROGRAM KEAHLIAN TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI (TJKT)</div>\n          <div class=\"doc-meta-divider\"></div>\n          <div class=\"doc-subject\">MODUL AJAR: CLASSLESS INTER-DOMAIN ROUTING (CIDR)</div>\n          <div class=\"doc-badge-tp\">SASARAN: TUJUAN PEMBELAJARAN 2 (TP2)</div>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB I: KONSEP CLASSLESS ADDRESSING</h4>\n          <p>Classless Inter-Domain Routing (CIDR) adalah metode alokasi alamat IP yang menggantikan sistem pembagian kelas tradisional. Dalam CIDR, pemisahan antara Network ID dan Host ID tidak lagi terpaku pada batas kelipatan 8 bit (oktet), melainkan dapat terjadi pada bit mana saja dari 32 bit yang ada.</p>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB II: ANALISIS EFISIENSI ALOKASI</h4>\n          <p>Jika sebuah sekolah membutuhkan jaringan untuk 50 komputer:</p>\n          <ul>\n            <li>Dengan sistem classful: Wajib memakai Kelas C (/24 = 254 host), terdapat pemborosan 204 IP.</li>\n            <li>Dengan sistem CIDR: Cukup menggunakan prefix <code>/26</code> (kapasitas 62 host), pemborosan dapat ditekan hanya menjadi 12 IP.</li>\n          </ul>\n        </div>\n      </div>\n    ",
    "wordFileUrl": "",
    "wordFileName": "Modul_5_CIDR_Konsep_Prefix.docx",
    "videoUrl": "https://www.youtube.com/watch?v=s_Ntt6eTn94",
    "videoTitle": "Tutorial Konsep CIDR Notasi Prefix & Pemetaan Subnet Mask",
    "keyPoints": [
      "CIDR mengatasi kelangkaan alamat IPv4 dengan fleksibilitas pembagian bit.",
      "Notasi prefix /x menunjukkan total bit network yang bernilai 1.",
      "Prefix /26 cocok untuk lab 60 PC, prefix /30 khusus untuk link 2 router."
    ]
  },
  {
    "id": 6,
    "title": "Perhitungan Subnetting & Magic Number",
    "tpCode": "TP3",
    "subtitle": "Rumus matematis 2^x dan 2^y - 2, penentuan Magic Number (interval blok), rentang IP host valid, dan broadcast address.",
    "pptUrl": "",
    "pptSlides": [
      {
        "title": "Dua Rumus Sakti Subnetting",
        "subtitle": "Menghitung Jumlah Subnet dan Jumlah Host Valid",
        "bullets": [
          "Jumlah Subnet = 2^x, di mana x adalah banyaknya bit 1 yang dipinjam dari host.",
          "Jumlah Host Valid = 2^y - 2, di mana y adalah sisa bit 0 yang digunakan untuk host.",
          "Pengurangan 2 wajib dilakukan karena ada 2 alamat terlarang yang tidak boleh dipasang pada PC."
        ],
        "highlight": "💡 Alamat Terlarang: Alamat Pertama = Network Address, Alamat Terakhir = Broadcast Address!"
      },
      {
        "title": "Metode Cepat 'Magic Number'",
        "subtitle": "Menemukan Kelipatan Blok Subnet Tanpa Rumus Rumit",
        "bullets": [
          "Magic Number dihitung dengan rumus: 256 dikurangi nilai oktet aktif Subnet Mask.",
          "Contoh pada /26 (mask 255.255.255.192): Magic Number = 256 - 192 = 64.",
          "Artinya, tiap subnet melompat dengan kelipatan 64: 0, 64, 128, 192."
        ],
        "highlight": "🔢 Blok Subnet /26: Subnet #1 dimulai dari .0, Subnet #2 dari .64, Subnet #3 dari .128, Subnet #4 dari .192!"
      },
      {
        "title": "Menentukan Rentang Host dan Broadcast",
        "subtitle": "4 Elemen Wajib pada Setiap Blok Subnet",
        "bullets": [
          "1. Network ID: Alamat awal blok (hasil kelipatan Magic Number).",
          "2. Host Pertama: Network ID + 1 (biasanya dipakai untuk IP Gateway/Router).",
          "3. Host Terakhir: Broadcast ID - 1 (IP valid terakhir untuk PC siswa).",
          "4. Broadcast ID: Satu angka sebelum Network ID blok berikutnya."
        ],
        "highlight": "⚡ Contoh Subnet 192.168.1.64/26: Net=192.168.1.64, Host=192.168.1.65 s.d. 192.168.1.126, Broadcast=192.168.1.127!"
      }
    ],
    "wordDetail": "\n      <div class=\"word-doc-paper\">\n        <div class=\"word-doc-header\">\n          <div class=\"doc-school-title\">SMK NEGERI 3 MAKASSAR</div>\n          <div class=\"doc-meta-sub\">PROGRAM KEAHLIAN TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI (TJKT)</div>\n          <div class=\"doc-meta-divider\"></div>\n          <div class=\"doc-subject\">MODUL AJAR: PERHITUNGAN SUBNETTING & MAGIC NUMBER</div>\n          <div class=\"doc-badge-tp\">SASARAN: TUJUAN PEMBELAJARAN 3 (TP3)</div>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB I: TEKNIK PERHITUNGAN MAGIC NUMBER</h4>\n          <p>Magic Number adalah interval selisih antar-blok subnet yang memudahkan teknisi merancang tabel pengalamatan. Rumus umumnya adalah: <code>Magic Number = 256 - Nilai Mask Oktet Aktif</code>.</p>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB II: STUDI KASUS SUBNETTING /27 (255.255.255.224)</h4>\n          <p>Diberikan network <code>192.168.5.0/27</code>:</p>\n          <ul>\n            <li>Jumlah bit dipinjam (x) = 27 - 24 = 3 bit -> Jumlah subnet = 2^3 = <strong>8 Subnet</strong>.</li>\n            <li>Sisa bit host (y) = 32 - 27 = 5 bit -> Host per subnet = 2^5 - 2 = <strong>30 Host Valid</strong>.</li>\n            <li>Magic Number = 256 - 224 = <strong>32</strong>.</li>\n            <li>Daftar Subnet:\n              <br>1. 192.168.5.0/27 (Host: 192.168.5.1 - .30, Broadcast: 192.168.5.31)\n              <br>2. 192.168.5.32/27 (Host: 192.168.5.33 - .62, Broadcast: 192.168.5.63)\n              <br>3. 192.168.5.64/27 (Host: 192.168.5.65 - .94, Broadcast: 192.168.5.95)\n              <br>... dan seterusnya hingga subnet ke-8.\n            </li>\n          </ul>\n        </div>\n      </div>\n    ",
    "wordFileUrl": "",
    "wordFileName": "Modul_6_Perhitungan_Subnetting_MagicNumber.docx",
    "videoUrl": "https://www.youtube.com/watch?v=q7HG8_qa9bA",
    "videoTitle": "Tutorial Trik Cepat Perhitungan Subnetting dan Magic Number",
    "keyPoints": [
      "Rumus jumlah subnet adalah 2^x (x = bit dipinjam).",
      "Rumus host valid adalah 2^y - 2 (y = bit host).",
      "Magic Number = 256 - nilai subnet mask oktet aktif."
    ]
  },
  {
    "id": 7,
    "title": "Variable Length Subnet Masking (VLSM)",
    "tpCode": "TP2",
    "subtitle": "Strategi alokasi subnet bertingkat dengan prefix bervariasi untuk penghematan alamat IP maksimal tanpa konflik.",
    "pptUrl": "",
    "pptSlides": [
      {
        "title": "Kelemahan Subnetting Tradisional (FLSM)",
        "subtitle": "Fixed Length Subnet Masking",
        "bullets": [
          "Pada FLSM, seluruh subnet dipaksa memakai subnet mask yang sama besar.",
          "Jika satu ruang butuh 60 host dan ruang lain butuh 2 host, keduanya diberi blok yang sama (misal /26 = 62 host).",
          "Akibatnya: Terjadi pemborosan 60 alamat IP pada tautan router point-to-point!"
        ],
        "highlight": "💡 Solusi: VLSM memungkinkan penggunaan subnet mask yang berbeda-beda sesuai kebutuhan riil masing-masing segmen!"
      },
      {
        "title": "Aturan Emas Perancangan VLSM",
        "subtitle": "Hukum Wajib yang Tidak Boleh Dilanggar",
        "bullets": [
          "ATURAN EMAS: Selalu urutkan kebutuhan host dari yang TERBESAR ke TERKECIL!",
          "Jika alokasi tidak diurutkan dari yang terbesar, pasti akan terjadi tumpang tindih alamat (Overlapping).",
          "Tentukan prefix minimum yang mencukupi masing-masing kebutuhan (2^y - 2 >= Kebutuhan)."
        ],
        "highlight": "🏆 Urutan Alokasi: Lab 1 (55 PC) -> Lab 2 (25 PC) -> Ruang Guru (10 PC) -> Link Router (2 PC)!"
      },
      {
        "title": "Prosedur Alokasi Bertingkat Berkelanjutan",
        "subtitle": "Menyambung Blok Subnet Tanpa Celah yang Bertabrakan",
        "bullets": [
          "Blok pertama dialokasikan untuk kebutuhan terbesar mulai dari network awal.",
          "Blok kedua dimulai tepat dari alamat setelah Broadcast ID blok pertama.",
          "Lanjutkan proses sampai semua ruangan dan link router selesai terpetakan.",
          "Sisa IP yang belum terpakai dapat dicadangkan untuk ekspansi di masa mendatang."
        ],
        "highlight": "⚡ Hasil: Efisiensi pengalamatan mencapai lebih dari 90% dengan kehandalan topologi maksimal!"
      }
    ],
    "wordDetail": "\n      <div class=\"word-doc-paper\">\n        <div class=\"word-doc-header\">\n          <div class=\"doc-school-title\">SMK NEGERI 3 MAKASSAR</div>\n          <div class=\"doc-meta-sub\">PROGRAM KEAHLIAN TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI (TJKT)</div>\n          <div class=\"doc-meta-divider\"></div>\n          <div class=\"doc-subject\">MODUL AJAR: VARIABLE LENGTH SUBNET MASKING (VLSM)</div>\n          <div class=\"doc-badge-tp\">SASARAN: TUJUAN PEMBELAJARAN 2 (TP2)</div>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB I: PRINSIP DASAR METODE VLSM</h4>\n          <p>Variable Length Subnet Masking (VLSM) adalah teknik subnetting tingkat lanjut di mana subnet mask yang digunakan dalam satu jaringan dapat memiliki panjang prefix yang berbeda-beda. Hal ini memungkinkan segmentasi jaringan disesuaikan secara presisi dengan kebutuhan nyata setiap divisi atau ruangan.</p>\n        </div>\n\n        <div class=\"word-doc-section\">\n          <h4>BAB II: STUDI KASUS TOPOLOGI SMK NEGERI 3 MAKASSAR</h4>\n          <p>Diberikan Network Induk <code>192.168.10.0/24</code> untuk 4 segmen:</p>\n          <ol>\n            <li><strong>Lab RPL (58 Host):</strong> Kebutuhan 58 -> Butuh kapasitas 62 host (Prefix <code>/26</code>).<br>\n            Alokasi: <code>192.168.10.0/26</code> (Host: .1 - .62, Broadcast: .63).</li>\n            <li><strong>Lab Multimedia (26 Host):</strong> Kebutuhan 26 -> Butuh kapasitas 30 host (Prefix <code>/27</code>).<br>\n            Alokasi: <code>192.168.10.64/27</code> (Host: .65 - .94, Broadcast: .95).</li>\n            <li><strong>Ruang Guru (12 Host):</strong> Kebutuhan 12 -> Butuh kapasitas 14 host (Prefix <code>/28</code>).<br>\n            Alokasi: <code>192.168.10.96/28</code> (Host: .97 - .110, Broadcast: .111).</li>\n            <li><strong>Link Router WAN (2 Host):</strong> Kebutuhan 2 -> Butuh kapasitas 2 host (Prefix <code>/30</code>).<br>\n            Alokasi: <code>192.168.10.112/30</code> (Host: .113 - .114, Broadcast: .115).</li>\n          </ol>\n          <p>Sisa IP dari <code>192.168.10.116</code> sampai <code>192.168.10.255</code> tetap utuh dan dapat digunakan untuk segmen baru.</p>\n        </div>\n      </div>\n    ",
    "wordFileUrl": "",
    "wordFileName": "Modul_7_Perancangan_VLSM_Lengkap.docx",
    "videoUrl": "https://www.youtube.com/watch?v=q7HG8_qa9bA",
    "videoTitle": "Tutorial Perancangan VLSM Multi-Subnet Tanpa Overlapping",
    "keyPoints": [
      "VLSM memungkinkan penggunaan prefix bervariasi dalam satu jaringan induk.",
      "Aturan Emas: Wajib mengurutkan kebutuhan host dari yang terbesar ke terkecil.",
      "Mencegah pemborosan IP address pada segmen skala kecil dan link point-to-point."
    ]
  }
],

  // 10 Latihan Soal Interaktif Bawaan (Default Standar Kurikulum)
  defaultLatihanQuestions: [
    {
      id: 1,
      question: "Berapa jumlah host yang dapat digunakan (usable host) pada sebuah jaringan dengan prefix CIDR /26?",
      options: [
        { key: "A", text: "30 host" },
        { key: "B", text: "62 host" },
        { key: "C", text: "64 host" },
        { key: "D", text: "126 host" }
      ],
      correctKey: "B",
      explanation: {
        steps: [
          "Langkah 1: Hitung sisa bit host (y) = 32 - prefix = 32 - 26 = 6 bit host.",
          "Langkah 2: Hitung total alamat IP yang terbentuk = 2^6 = 64 alamat.",
          "Langkah 3: Kurangkan 2 alamat khusus (Network Address dan Broadcast Address) = 64 - 2 = 62 host.",
          "Kesimpulan: Jumlah host yang valid digunakan untuk perangkat komputer adalah 62 host."
        ],
        videoNote: "Tinjau kembali materi mengenai rumus 2^y - 2."
      }
    },
    {
      id: 2,
      question: "Manakah notasi desimal bertitik (dotted-decimal) yang sesuai untuk subnet mask dengan prefix /28?",
      options: [
        { key: "A", text: "255.255.255.224" },
        { key: "B", text: "255.255.255.240" },
        { key: "C", text: "255.255.255.248" },
        { key: "D", text: "255.255.255.252" }
      ],
      correctKey: "B",
      explanation: {
        steps: [
          "Langkah 1: Notasi /28 berarti ada 28 bit bernilai 1.",
          "Langkah 2: Tulis dalam 4 oktet biner: 11111111.11111111.11111111.11110000.",
          "Langkah 3: Konversi oktet ke-4 (11110000) ke desimal: 128 + 64 + 32 + 16 = 240.",
          "Kesimpulan: Subnet mask desimal untuk /28 adalah 255.255.255.240."
        ],
        videoNote: "Pelajari tabel bobot posisi pada sistem bilangan biner."
      }
    },
    {
      id: 3,
      question: "Diberikan IP Address 192.168.10.130/26. Berapakah Network Address dari IP tersebut?",
      options: [
        { key: "A", text: "192.168.10.0" },
        { key: "B", text: "192.168.10.64" },
        { key: "C", text: "192.168.10.128" },
        { key: "D", text: "192.168.10.192" }
      ],
      correctKey: "C",
      explanation: {
        steps: [
          "Langkah 1: Prefix /26 memiliki subnet mask 255.255.255.192.",
          "Langkah 2: Cari kelipatan blok subnet (Magic Number) = 256 - 192 = 64.",
          "Langkah 3: Daftarkan blok subnet: 0, 64, 128, 192.",
          "Langkah 4: Angka 130 berada di antara 128 dan 191.",
          "Kesimpulan: Network Address-nya adalah 192.168.10.128."
        ],
        videoNote: "Tinjau kembali mengenai perhitungan 4 blok subnet."
      }
    },
    {
      id: 4,
      question: "Berapakah Broadcast Address dari subnet 192.168.1.64/27?",
      options: [
        { key: "A", text: "192.168.1.95" },
        { key: "B", text: "192.168.1.96" },
        { key: "C", text: "192.168.1.127" },
        { key: "D", text: "192.168.1.255" }
      ],
      correctKey: "A",
      explanation: {
        steps: [
          "Langkah 1: /27 = 255.255.255.224. Magic Number = 256 - 224 = 32.",
          "Langkah 2: Subnet saat ini = 192.168.1.64. Subnet berikutnya = 64 + 32 = 96.",
          "Langkah 3: Broadcast Address adalah 1 angka tepat sebelum subnet berikutnya = 96 - 1 = 95.",
          "Kesimpulan: Broadcast Address adalah 192.168.1.95."
        ],
        videoNote: "Broadcast selalu merupakan alamat IP paling akhir dalam blok subnet tersebut."
      }
    },
    {
      id: 5,
      question: "Sebuah laboratorium membutuhkan alokasi untuk 14 unit komputer. Prefix manakah yang paling efisien agar tidak membuang alamat IP?",
      options: [
        { key: "A", text: "/27 (30 host)" },
        { key: "B", text: "/28 (14 host)" },
        { key: "C", text: "/29 (6 host)" },
        { key: "D", text: "/26 (62 host)" }
      ],
      correctKey: "B",
      explanation: {
        steps: [
          "Langkah 1: Kebutuhan adalah 14 komputer.",
          "Langkah 2: Uji /29 -> 2^3 - 2 = 6 host (Tidak cukup).",
          "Langkah 3: Uji /28 -> 2^4 - 2 = 14 host (Pas persis 14 host!).",
          "Kesimpulan: Prefix /28 adalah pilihan paling efisien tanpa pemborosan sedikitpun."
        ],
        videoNote: "Prinsip efisiensi alokasi dibahas mendalam pada modul CIDR."
      }
    },
    {
      id: 6,
      question: "Manakah di antara alamat IP berikut yang merupakan IP Private yang dapat digunakan bebas di LAN sekolah?",
      options: [
        { key: "A", text: "8.8.8.8" },
        { key: "B", text: "172.20.10.1" },
        { key: "C", text: "202.155.10.5" },
        { key: "D", text: "118.98.40.1" }
      ],
      correctKey: "B",
      explanation: {
        steps: [
          "Langkah 1: Rentang IP Private RFC 1918 adalah: 10.0.0.0/8, 172.16.0.0 - 172.31.255.255, dan 192.168.0.0/16.",
          "Langkah 2: 172.20.10.1 berada di dalam rentang 172.16.0.0 s/d 172.31.255.255 (Kelas B Private).",
          "Langkah 3: Alamat lainnya (8.8.8.8, 202.x, 118.x) adalah IP Publik di internet.",
          "Kesimpulan: Jawaban benar adalah 172.20.10.1."
        ],
        videoNote: "Tinjau kembali klasifikasi IP Publik vs IP Privat."
      }
    },
    {
      id: 7,
      question: "Dua buah komputer dihubungkan ke Switch: PC-A (192.168.1.10/26) dan PC-B (192.168.1.70/26). Mengapa kedua komputer tersebut TIDAK bisa saling ping?",
      options: [
        { key: "A", text: "Karena kabel straight tidak bisa menghubungkan switch" },
        { key: "B", text: "Karena PC-A dan PC-B berada di segmen Subnet yang berbeda" },
        { key: "C", text: "Karena IP kelas C tidak mendukung switch" },
        { key: "D", text: "Karena PC-B menggunakan IP broadcast" }
      ],
      correctKey: "B",
      explanation: {
        steps: [
          "Langkah 1: Prefix /26 membagi kelipatan blok 64.",
          "Langkah 2: PC-A (192.168.1.10) berada pada Subnet 1 (192.168.1.0 s/d .63).",
          "Langkah 3: PC-B (192.168.1.70) berada pada Subnet 2 (192.168.1.64 s/d .127).",
          "Langkah 4: Karena berada di subnet berbeda dan hanya terhubung switch (Layer 2) tanpa Router (Layer 3), ping akan gagal.",
          "Kesimpulan: Mereka berada di subnet yang berbeda."
        ],
        videoNote: "Bisa Anda uji langsung pada kanvas Mode 2 Simulasi Topologi!"
      }
    },
    {
      id: 8,
      question: "Apakah aturan emas paling mendasar saat menyusun perencanaan pengalamatan jaringan dengan metode VLSM?",
      options: [
        { key: "A", text: "Mengalokasikan IP dari angka terkecil ke terbesar" },
        { key: "B", text: "Mengurutkan kebutuhan host dari yang terbesar ke terkecil" },
        { key: "C", text: "Selalu menggunakan subnet mask default 255.255.255.0" },
        { key: "D", text: "Memberikan IP genap untuk PC dan IP ganjil untuk Server" }
      ],
      correctKey: "B",
      explanation: {
        steps: [
          "Langkah 1: Pada VLSM, ukuran blok bervariasi.",
          "Langkah 2: Jika alokasi tidak dimulai dari blok terbesar, blok kecil akan memecah ruang alamat sehingga blok besar berikutnya tidak memiliki blok kelipatan yang valid (overlapping).",
          "Kesimpulan: Wajib mengurutkan kebutuhan host dari yang terbesar hingga terkecil."
        ],
        videoNote: "Lihat penjelasan 'Golden Rule VLSM' pada materi VLSM."
      }
    },
    {
      id: 9,
      question: "Berapakah jumlah subnet yang dihasilkan jika jaringan 192.168.5.0/24 disubnetting menggunakan prefix /27?",
      options: [
        { key: "A", text: "2 Subnet" },
        { key: "B", text: "4 Subnet" },
        { key: "C", text: "8 Subnet" },
        { key: "D", text: "16 Subnet" }
      ],
      correctKey: "C",
      explanation: {
        steps: [
          "Langkah 1: Default mask kelas C adalah /24. Prefix baru adalah /27.",
          "Langkah 2: Jumlah bit 1 yang dipinjam (x) = 27 - 24 = 3 bit.",
          "Langkah 3: Rumus jumlah subnet = 2^x = 2^3 = 8 Subnet.",
          "Kesimpulan: Jaringan terbagi menjadi 8 buah subnet baru."
        ],
        videoNote: "Tinjau rumus 2^x pada pembahasan subnetting."
      }
    },
    {
      id: 10,
      question: "Untuk menghubungkan dua port interface Router secara point-to-point via kabel serial WAN, prefix berapakah yang paling ideal?",
      options: [
        { key: "A", text: "/28" },
        { key: "B", text: "/29" },
        { key: "C", text: "/30" },
        { key: "D", text: "/32" }
      ],
      correctKey: "C",
      explanation: {
        steps: [
          "Langkah 1: Hubungan point-to-point router hanya memerlukan tepat 2 alamat host (1 untuk Router 1, 1 untuk Router 2).",
          "Langkah 2: Prefix /30 memiliki 2 bit host tersisa: 2^2 - 2 = 4 - 2 = 2 host valid.",
          "Langkah 3: Tidak ada alamat IP yang terbuang sia-sia.",
          "Kesimpulan: Prefix /30 adalah standar emas industri untuk link point-to-point antar router."
        ],
        videoNote: "Selalu gunakan /30 untuk link router pada topologi Cisco Packet Tracer."
      }
    }
  ],

  // 20 Soal Evaluasi Akhir Bawaan (15 PG + 5 Uraian Default)
  defaultEvaluasiData: {
    durationMinutes: 30,
    kkm: 75,
    pgList: [
      { id: 1, text: "Oktet ketiga pada IP Address 172.16.25.10 adalah...", options: ["172", "16", "25", "10"], correct: 2, points: 5 },
      { id: 2, text: "Berapa bit panjang keseluruhan alamat IPv4?", options: ["16 bit", "32 bit", "64 bit", "128 bit"], correct: 1, points: 5 },
      { id: 3, text: "Hasil konversi bilangan biner 11000000 ke dalam bilangan desimal adalah...", options: ["128", "168", "192", "224"], correct: 2, points: 5 },
      { id: 4, text: "Nilai Subnet Mask default untuk IP Address Kelas B adalah...", options: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.255"], correct: 1, points: 5 },
      { id: 5, text: "Jika diberikan IP 192.168.1.0/25, berapakah jumlah host maksimal tiap subnet?", options: ["62", "126", "128", "254"], correct: 1, points: 5 },
      { id: 6, text: "Berapa nilai Magic Number (kelipatan blok) pada subnet mask 255.255.255.224?", options: ["16", "32", "64", "128"], correct: 1, points: 5 },
      { id: 7, text: "Alamat IP yang digunakan untuk menguji fungsionalitas software TCP/IP kartu jaringan lokal adalah...", options: ["0.0.0.0", "127.0.0.1", "169.254.0.1", "192.168.1.1"], correct: 1, points: 5 },
      { id: 8, text: "Manakah yang merupakan Broadcast Address dari subnet 192.168.10.0/28?", options: ["192.168.10.14", "192.168.10.15", "192.168.10.16", "192.168.10.31"], correct: 1, points: 5 },
      { id: 9, text: "Subnet mask 255.255.255.248 sama dengan notasi CIDR prefix...", options: ["/27", "/28", "/29", "/30"], correct: 2, points: 5 },
      { id: 10, text: "Di sebuah kantor terdapat 55 komputer dalam satu ruangan. Prefix minimal yang dapat digunakan adalah...", options: ["/27", "/26", "/25", "/24"], correct: 1, points: 5 },
      { id: 11, text: "Komputer A memiliki IP 10.0.0.5/24 dan Komputer B memiliki IP 10.0.1.5/24. Apakah kedua PC dapat berkomunikasi langsung tanpa router?", options: ["Bisa, karena sama-sama berawalan 10", "Tidak bisa, karena Network ID berbeda (10.0.0 vs 10.0.1)", "Bisa, karena berada di kelas A", "Tergantung tipe kabel yang dipasang"], correct: 1, points: 5 },
      { id: 12, text: "Dalam teknik VLSM, urutan alokasi blok subnet wajib disusun berdasarkan...", options: ["Kebutuhan host dari yang terbesar ke terkecil", "Nomor ruangan dari lantai 1 ke lantai 4", "Urutan abjad nama segmen lab", "Prefix terkecil ke prefix terbesar"], correct: 0, points: 5 },
      { id: 13, text: "Manakah pernyataan yang BENAR mengenai Network Address?", options: ["Dapat dipasang ke kartu LAN komputer", "Merupakan alamat pertama yang mewakili keseluruhan segmen", "Semua bit host bernilai 1", "Sama dengan alamat Gateway"], correct: 1, points: 5 },
      { id: 14, text: "Pada operasi Bitwise AND antara IP 192.168.1.100 dan Subnet Mask 255.255.255.0, bitwise 1 AND 0 menghasilkan nilai...", options: ["1", "0", "Tidak tentu", "Error"], correct: 1, points: 5 },
      { id: 15, text: "Pada subnet 192.168.1.32/27, berapakah alamat host pertama yang valid digunakan?", options: ["192.168.1.32", "192.168.1.33", "192.168.1.34", "192.168.1.62"], correct: 1, points: 5 }
    ],
    uraianList: [
      {
        id: 16,
        text: "Jelaskan perbedaan mendasar antara Network Address dan Broadcast Address dalam suatu subnet IP!",
        keywords: ["network", "broadcast", "pertama", "terakhir", "identitas", "semua"],
        rubric: "Menjelaskan bahwa Network Address adalah IP pertama (bit host 0 semua) sebagai penanda kelompok segmen, sedangkan Broadcast Address adalah IP terakhir (bit host 1 semua) untuk mengirim paket ke seluruh host serentak.",
        points: 5
      },
      {
        id: 17,
        text: "Tuliskan langkah-langkah menghitung jumlah subnet dan jumlah host per subnet pada prefix /27 dari kelas C!",
        keywords: ["27", "24", "3", "8", "32", "30", "host"],
        rubric: "Menyebutkan selisih bit 27-24=3 bit, rumus 2^3=8 subnet, bit sisa host 32-27=5 bit, rumus 2^5-2 = 30 host per subnet.",
        points: 5
      },
      {
        id: 18,
        text: "Mengapa metode VLSM (Variable Length Subnet Masking) dinilai jauh lebih efisien dibandingkan FLSM (Fixed Length)? Berikan satu contoh konkret!",
        keywords: ["efisien", "berbeda", "sama", "pemborosan", "kebutuhan", "flsm", "vlsm"],
        rubric: "Menjelaskan bahwa FLSM memaksakan ukuran subnet sama sehingga boros IP, sedangkan VLSM menyesuaikan prefix mask dengan kebutuhan tiap segmen.",
        points: 5
      },
      {
        id: 19,
        text: "Jika komputer Anda mendapatkan alamat IP 169.254.12.30, jelaskan kondisi apa yang sedang terjadi pada jaringan Anda!",
        keywords: ["apipa", "dhcp", "gagal", "otomatis", "server"],
        rubric: "Menyebutkan bahwa ini adalah alamat APIPA (Automatic Private IP Addressing) yang terjadi karena PC diset DHCP namun gagal mendapatkan respons dari DHCP Server.",
        points: 5
      },
      {
        id: 20,
        text: "Sebutkan 3 rentang alamat IP Privat (RFC 1918) untuk Kelas A, Kelas B, dan Kelas C!",
        keywords: ["10.0.0.0", "172.16.0.0", "192.168.0.0"],
        rubric: "Menyebutkan 10.0.0.0/8 (Kelas A), 172.16.0.0 - 172.31.255.255 (Kelas B), dan 192.168.0.0/16 (Kelas C).",
        points: 5
      }
    ]
  }
};

window.NetLearnStore = NetLearnStore;
