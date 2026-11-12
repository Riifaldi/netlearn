/**
 * NetLearn - Supabase Cloud Database Integration Module
 * Menghubungkan platform NetLearn dengan database PostgreSQL Supabase di cloud
 * Mendukung sinkronisasi real-time multi-perangkat (Guru <-> Siswa antar-komputer).
 */

const NetLearnSupabase = {
  client: null,
  realtimeChannel: null,
  isSyncing: false,

  // Kunci penyimpanan konfigurasi lokal
  CONFIG_KEY: 'netlearn_supabase_config',

  // Ambil konfigurasi tersimpan
  getConfig() {
    try {
      const raw = localStorage.getItem(this.CONFIG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Gagal membaca konfigurasi Supabase:', e);
    }
    return {
      url: '',
      anonKey: '',
      autoSync: true,
      lastSynced: null
    };
  },

  // Simpan konfigurasi
  saveConfig(cfg) {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg));
    this.client = null; // reset client instance
    return this.init();
  },

  // Cek apakah Supabase sudah terkonfigurasi
  isConfigured() {
    const cfg = this.getConfig();
    return Boolean(cfg && cfg.url && cfg.anonKey && cfg.url.trim() && cfg.anonKey.trim());
  },

  // Inisialisasi Klien Supabase
  init() {
    const cfg = this.getConfig();
    if (!cfg.url || !cfg.anonKey) return false;

    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
      try {
        this.client = window.supabase.createClient(cfg.url.trim(), cfg.anonKey.trim(), {
          auth: { persistSession: false }
        });
        console.log('✅ Supabase Client berhasil diinisialisasi untuk NetLearn');
        
        // Aktifkan Realtime Listener jika autoSync aktif
        if (cfg.autoSync) {
          this.initRealtimeListeners();
          this.pullFromCloud(true); // Sinkronisasi awal di background
        }
        return true;
      } catch (err) {
        console.error('❌ Gagal inisialisasi Supabase Client:', err);
        return false;
      }
    }
    return false;
  },

  // Uji koneksi ke Supabase
  async testConnection(url, anonKey) {
    if (!window.supabase || !window.supabase.createClient) {
      return { success: false, message: 'Pustaka Supabase JS belum siap dimuat di peramban.' };
    }
    try {
      const testClient = window.supabase.createClient(url.trim(), anonKey.trim(), {
        auth: { persistSession: false }
      });
      const { data, error } = await testClient.from('modules').select('id').limit(1);
      if (error) {
        // Jika tabel belum dibuat, periksa kode pesan error
        if (error.code === '42P01') {
          return {
            success: true,
            warning: true,
            message: 'Terkoneksi ke Supabase! Namun tabel database belum dibuat. Silakan jalankan script SQL Schema di SQL Editor Supabase.'
          };
        }
        return { success: false, message: `Error Supabase: ${error.message} (${error.code || 'Gagal'})` };
      }
      return { success: true, message: 'Koneksi ke Supabase Cloud Database Berhasil 100%!' };
    } catch (e) {
      return { success: false, message: `Gagal menghubungi server Supabase: ${e.message}` };
    }
  },

  // Inisialisasi Realtime WebSocket Subscription
  initRealtimeListeners() {
    if (!this.client || this.realtimeChannel) return;
    try {
      this.realtimeChannel = this.client.channel('netlearn-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
          console.log('🔔 [Realtime] Perubahan modul materi terdeteksi dari komputer lain!');
          this.pullModules();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
          console.log('🔔 [Realtime] Perubahan data/nilai siswa terdeteksi dari komputer lain!');
          this.pullStudents();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription tidak aktif:', e);
    }
  },

  // SINKRONISASI 1: Tarik seluruh data dari Cloud ke Local NetLearnStore
  async pullFromCloud(silent = false) {
    if (!this.client || this.isSyncing) return false;
    this.isSyncing = true;
    try {
      await Promise.all([
        this.pullModules(),
        this.pullStudents(),
        this.pullReflections()
      ]);

      const cfg = this.getConfig();
      cfg.lastSynced = new Date().toLocaleString('id-ID');
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg));

      if (!silent && typeof showToast === 'function') {
        showToast('Sinkronisasi data dari cloud Supabase berhasil!', 'success');
      }
      return true;
    } catch (e) {
      console.error('Error saat pullFromCloud:', e);
      if (!silent && typeof showToast === 'function') {
        showToast(`Gagal sinkronisasi data cloud: ${e.message}`, 'error');
      }
      return false;
    } finally {
      this.isSyncing = false;
    }
  },

  // Tarik tabel modules
  async pullModules() {
    if (!this.client) return;
    try {
      const { data, error } = await this.client.from('modules').select('*').order('id', { ascending: true });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(row => ({
          id: row.id,
          title: row.title,
          tpCode: row.tp_code || 'TP1',
          subtitle: row.subtitle || '',
          pptUrl: row.ppt_url || '',
          pptSlides: row.ppt_slides || [],
          wordDetail: row.word_detail || '',
          wordFileUrl: row.word_file_url || '',
          wordFileName: row.word_file_name || '',
          videoUrl: row.video_url || '',
          videoTitle: row.video_title || '',
          keyPoints: row.key_points || []
        }));

        NetLearnStore.state.modulesData = mapped;
        while (NetLearnStore.state.materiProgress.length < mapped.length) {
          NetLearnStore.state.materiProgress.push(false);
        }
        NetLearnStore.save();

        if (typeof App !== 'undefined') {
          if (NetLearnStore.state.activeScreen === 'materi') App.renderMateri();
          if (NetLearnStore.state.activeScreen === 'beranda') App.renderBeranda();
          if (NetLearnStore.state.activeScreen === 'guru-cms-materi') App.renderGuruCMSMateri();
        }
      }
    } catch (e) {
      console.warn('Gagal menarik tabel modules:', e);
    }
  },

  // Tarik tabel students
  async pullStudents() {
    if (!this.client) return;
    try {
      const { data, error } = await this.client.from('students').select('*').order('id', { ascending: true });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        NetLearnStore.state.studentRecords = data.map(s => ({
          id: s.id,
          name: s.name,
          nis: s.nis,
          kelas: s.kelas,
          password: s.password || '123',
          latihanScore: s.latihan_score || 0,
          evaluasiScore: s.evaluasi_score || 0,
          status: s.status || 'Belum Ujian',
          date: s.date || ''
        }));
        NetLearnStore.save();

        if (typeof App !== 'undefined') {
          if (NetLearnStore.state.activeScreen === 'guru-laporan') App.renderGuruLaporan();
          if (NetLearnStore.state.activeScreen === 'guru-dashboard') App.renderGuruDashboard();
        }
      }
    } catch (e) {
      console.warn('Gagal menarik tabel students:', e);
    }
  },

  // Tarik tabel reflections
  async pullReflections() {
    if (!this.client) return;
    try {
      const { data, error } = await this.client.from('reflections').select('*').order('id', { ascending: false });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        NetLearnStore.state.reflections = data.map(r => ({
          id: r.id,
          studentName: r.student_name,
          nis: r.nis,
          date: r.date,
          paham: r.paham,
          sulit: r.sulit,
          lanjut: r.lanjut
        }));
        NetLearnStore.save();
        if (typeof App !== 'undefined' && NetLearnStore.state.activeScreen === 'guru-refleksi') {
          App.renderGuruRefleksi();
        }
      }
    } catch (e) {
      console.warn('Gagal menarik tabel reflections:', e);
    }
  },

  // SINKRONISASI 2: Unggah seluruh data lokal saat ini ke Cloud Supabase (Push All)
  async pushAllToCloud() {
    if (!this.client) {
      return { success: false, message: 'Database Supabase belum terkonfigurasi!' };
    }

    try {
      // 1. Unggah Modul Materi
      const currentModules = NetLearnStore.getModules();
      if (currentModules && currentModules.length > 0) {
        const rows = currentModules.map((m, idx) => ({
          id: Number(m.id) || (idx + 1),
          title: m.title || `Modul ${idx + 1}`,
          tp_code: m.tpCode || 'TP1',
          subtitle: m.subtitle || '',
          ppt_url: m.pptUrl || '',
          ppt_slides: m.pptSlides || [],
          word_detail: m.wordDetail || '',
          word_file_url: m.wordFileUrl || '',
          word_file_name: m.wordFileName || '',
          video_url: m.videoUrl || '',
          video_title: m.videoTitle || '',
          key_points: m.keyPoints || []
        }));
        const { error: modErr } = await this.client.from('modules').upsert(rows, { onConflict: 'id' });
        if (modErr) throw modErr;
      }

      // 2. Unggah Data Siswa & Rekap Nilai
      const students = NetLearnStore.state.studentRecords || [];
      if (students.length > 0) {
        const studentRows = students.map((s, idx) => ({
          id: Number(s.id) || (Date.now() + idx),
          name: s.name,
          nis: String(s.nis),
          kelas: s.kelas || 'XI TKJ 1',
          password: s.password || '123',
          latihan_score: Number(s.latihanScore) || 0,
          evaluasi_score: Number(s.evaluasiScore) || 0,
          status: s.status || 'Belum Ujian',
          date: s.date || new Date().toLocaleDateString('id-ID')
        }));
        const { error: stErr } = await this.client.from('students').upsert(studentRows, { onConflict: 'nis' });
        if (stErr) throw stErr;
      }

      // 3. Unggah Refleksi
      const reflections = NetLearnStore.state.reflections || [];
      if (reflections.length > 0) {
        const refRows = reflections.map((r, idx) => ({
          id: Number(r.id) || (Date.now() + idx),
          student_name: r.studentName || 'Siswa',
          nis: r.nis || '-',
          date: r.date || '',
          paham: r.paham || '',
          sulit: r.sulit || '',
          lanjut: r.lanjut || ''
        }));
        const { error: refErr } = await this.client.from('reflections').upsert(refRows, { onConflict: 'id' });
        if (refErr) throw refErr;
      }

      const cfg = this.getConfig();
      cfg.lastSynced = new Date().toLocaleString('id-ID');
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg));

      return {
        success: true,
        message: `Berhasil mengunggah ${currentModules.length} modul materi dan ${students.length} data siswa ke database Supabase Cloud!`
      };
    } catch (e) {
      console.error('Gagal pushAllToCloud:', e);
      return { success: false, message: `Gagal upload ke Supabase: ${e.message}` };
    }
  },

  // Simpan / Perbarui 1 Modul Materi secara spesifik ke Supabase
  async syncSaveModule(modData, index) {
    if (!this.client) return;
    try {
      const row = {
        id: Number(modData.id) || (index + 1),
        title: modData.title,
        tp_code: modData.tpCode || 'TP1',
        subtitle: modData.subtitle || '',
        ppt_url: modData.pptUrl || '',
        ppt_slides: modData.pptSlides || [],
        word_detail: modData.wordDetail || '',
        word_file_url: modData.wordFileUrl || '',
        word_file_name: modData.wordFileName || '',
        video_url: modData.videoUrl || '',
        video_title: modData.videoTitle || '',
        key_points: modData.keyPoints || []
      };
      await this.client.from('modules').upsert(row, { onConflict: 'id' });
      console.log('✅ Modul tersinkron ke Supabase Cloud:', modData.title);
    } catch (e) {
      console.warn('Gagal sinkron modul ke Supabase:', e);
    }
  },

  // Hapus 1 Modul di Supabase
  async syncDeleteModule(modId) {
    if (!this.client || !modId) return;
    try {
      await this.client.from('modules').delete().eq('id', modId);
      console.log('✅ Modul dihapus dari Supabase Cloud ID:', modId);
    } catch (e) {
      console.warn('Gagal hapus modul di Supabase:', e);
    }
  },

  // Simpan / Perbarui Data Siswa & Nilai Ujian ke Supabase
  async syncSaveStudent(studentObj) {
    if (!this.client || !studentObj || !studentObj.nis) return;
    try {
      const row = {
        id: Number(studentObj.id) || Date.now(),
        name: studentObj.name,
        nis: String(studentObj.nis),
        kelas: studentObj.kelas || 'XI TKJ 1',
        password: studentObj.password || '123',
        latihan_score: Number(studentObj.latihanScore) || 0,
        evaluasi_score: Number(studentObj.evaluasiScore) || 0,
        status: studentObj.status || 'Belum Ujian',
        date: studentObj.date || new Date().toLocaleDateString('id-ID')
      };
      await this.client.from('students').upsert(row, { onConflict: 'nis' });
      console.log('✅ Data/Nilai siswa tersinkron ke Supabase Cloud:', studentObj.name);
    } catch (e) {
      console.warn('Gagal sinkron siswa ke Supabase:', e);
    }
  },

  // Simpan Refleksi Siswa ke Supabase
  async syncSaveReflection(refObj) {
    if (!this.client || !refObj) return;
    try {
      const row = {
        id: Number(refObj.id) || Date.now(),
        student_name: refObj.studentName || 'Siswa',
        nis: refObj.nis || '-',
        date: refObj.date || new Date().toLocaleDateString('id-ID'),
        paham: refObj.paham || '',
        sulit: refObj.sulit || '',
        lanjut: refObj.lanjut || ''
      };
      await this.client.from('reflections').upsert(row, { onConflict: 'id' });
      console.log('✅ Refleksi siswa tersinkron ke Supabase Cloud');
    } catch (e) {
      console.warn('Gagal sinkron refleksi ke Supabase:', e);
    }
  },

  // Menghasilkan Script SQL Schema Siap Eksekusi untuk Supabase SQL Editor
  getSQLSchema() {
    return `-- ==============================================================================
-- NETLEARN PLATFORM PENGALAMATAN JARINGAN (IPv4) - SMK NEGERI 3 MAKASSAR
-- SKRIP DATABASE SUPABASE (POSTGRESQL CLOUD)
-- Jalankan kode ini di: Supabase Dashboard -> Project -> SQL Editor -> Run (F5)
-- ==============================================================================

-- 1. TABEL MODUL PEMBELAJARAN
create table if not exists public.modules (
  id bigint primary key,
  title text not null,
  tp_code text,
  subtitle text,
  ppt_url text,
  ppt_slides jsonb default '[]'::jsonb,
  word_detail text,
  word_file_url text,
  word_file_name text,
  video_url text,
  video_title text,
  key_points jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABEL DATA SISWA & REKAP NILAI KELAS
create table if not exists public.students (
  id bigint primary key,
  name text not null,
  nis text unique not null,
  kelas text not null,
  password text default '123',
  latihan_score integer default 0,
  evaluasi_score integer default 0,
  status text default 'Belum Ujian',
  date text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABEL RIWAYAT EVALUASI AKHIR
create table if not exists public.evaluasi_results (
  id text primary key,
  nis text not null,
  student_name text not null,
  kelas text not null,
  score integer not null,
  status text not null,
  answers jsonb default '{}'::jsonb,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABEL REFLEKSI BELAJAR SISWA
create table if not exists public.reflections (
  id bigint primary key,
  student_name text,
  nis text,
  date text,
  paham text,
  sulit text,
  lanjut text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Aktifkan Row Level Security (RLS) dan berikan izin akses publik (Anonim)
alter table public.modules enable row level security;
alter table public.students enable row level security;
alter table public.evaluasi_results enable row level security;
alter table public.reflections enable row level security;

-- Hapus policy lama jika ada untuk mencegah duplikasi
drop policy if exists "Allow public read-write on modules" on public.modules;
drop policy if exists "Allow public read-write on students" on public.students;
drop policy if exists "Allow public read-write on evaluasi_results" on public.evaluasi_results;
drop policy if exists "Allow public read-write on reflections" on public.reflections;

-- Buat policy baru yang mengizinkan baca & tulis untuk Guru dan Siswa
create policy "Allow public read-write on modules" on public.modules for all using (true) with check (true);
create policy "Allow public read-write on students" on public.students for all using (true) with check (true);
create policy "Allow public read-write on evaluasi_results" on public.evaluasi_results for all using (true) with check (true);
create policy "Allow public read-write on reflections" on public.reflections for all using (true) with check (true);

-- Aktifkan Realtime Replication untuk tabel modules dan students
alter publication supabase_realtime add table public.modules;
alter publication supabase_realtime add table public.students;
`;
  }
};

// Inisialisasi otomatis jika dijalankan di browser
if (typeof window !== 'undefined') {
  window.NetLearnSupabase = NetLearnSupabase;
  document.addEventListener('DOMContentLoaded', () => {
    NetLearnSupabase.init();
  });
}

