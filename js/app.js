/**
 * NetLearn - Main Application Controller
 * Handles routing, UI state transitions, screen renders, teacher CMS, and modal management.
 */

const App = {
  init() {
    NetLearnStore.init();
    this.bindEvents();
    this.checkAuthUI();
    this.updateUserBadge();
    if (NetLearnStore.state.isLoggedIn) {
      this.navigateTo(NetLearnStore.state.activeScreen || (NetLearnStore.state.currentRole === 'guru' ? 'guru-dashboard' : 'beranda'));
    }
  },

  bindEvents() {
    // Keyboard shortcuts & window events (Revisi Item 5: ESC support & PPT Arrow navigation)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeModal();
        if (document.fullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        }
        const preview = document.getElementById('sidebar-preview-content');
        if (preview && preview.classList.contains('open')) {
          App.toggleSidebarPreview();
        }
      }
      // Navigasi Slide PPT Menggunakan Panah Kanan / Kiri (Revisi Item 8)
      if (NetLearnStore.state.activeScreen === 'materi') {
        if (e.key === 'ArrowRight') App.nextMateriSlide();
        if (e.key === 'ArrowLeft') App.prevMateriSlide();
      }
    });
  },

  // Toggle Dropdown Laman Preview pada Sidebar Guru (Revisi Item 3)
  toggleSidebarPreview() {
    const btn = document.getElementById('sidebar-preview-toggle');
    const content = document.getElementById('sidebar-preview-content');
    if (btn && content) {
      const isOpen = content.classList.contains('open');
      if (isOpen) {
        content.classList.remove('open');
        btn.classList.remove('open');
      } else {
        content.classList.add('open');
        btn.classList.add('open');
      }
    }
  },

  // Dialog Konfirmasi Aman Reset Data (Revisi Item 1: Proteksi Tanda Jelas)
  confirmResetSession() {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.innerHTML = '⚠️ Konfirmasi Reset Sesi Belajar';
    modalBody.innerHTML = `
      <div class="callout callout-important" style="margin-bottom:1rem; border-left:4px solid #DC2626;">
        <strong>Peringatan Proteksi Data:</strong> Tindakan ini akan mengosongkan progres belajar, riwayat simulasi, dan skor latihan lokal pada peramban ini kembali ke status bawaan.
      </div>
      <p style="font-size:0.92rem; color:var(--color-text-main); line-height:1.5;">
        Apakah Anda benar-benar yakin ingin melanjutkan reset sesi belajar?
      </p>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-danger" style="background:#DC2626; border-color:#DC2626; color:#FFF;" onclick="closeModal(); NetLearnStore.resetAll();">Ya, Reset Sesi Sekarang</button>
    `;

    openModal();
  },

  // =========================================================================
  // SISTEM AUTENTIKASI & KONTROL SESI (LOGIN / LOGOUT)
  // =========================================================================
  authMode: 'login', // 'login' or 'register'
  authRole: 'siswa', // 'siswa' or 'guru'

  checkAuthUI() {
    const overlay = document.getElementById('login-overlay');
    const isLoggedIn = Boolean(NetLearnStore.state.isLoggedIn);

    if (overlay) {
      if (isLoggedIn) {
        overlay.classList.add('hidden');
      } else {
        overlay.classList.remove('hidden');
        this.updateAuthView();
      }
    }
    return isLoggedIn;
  },

  setAuthMode(mode) {
    this.authMode = mode;
    const btnLogin = document.getElementById('auth-mode-login');
    const btnReg = document.getElementById('auth-mode-register');

    if (btnLogin && btnReg) {
      if (mode === 'register') {
        btnReg.classList.add('active');
        btnLogin.classList.remove('active');
      } else {
        btnLogin.classList.add('active');
        btnReg.classList.remove('active');
      }
    }
    this.updateAuthView();
  },

  switchLoginRole(role) {
    this.authRole = role;
    const tabSiswa = document.getElementById('tab-btn-siswa');
    const tabGuru = document.getElementById('tab-btn-guru');

    if (role === 'guru') {
      if (tabGuru) tabGuru.classList.add('active');
      if (tabSiswa) tabSiswa.classList.remove('active');
    } else {
      if (tabSiswa) tabSiswa.classList.add('active');
      if (tabGuru) tabGuru.classList.remove('active');
    }
    this.updateAuthView();
  },

  updateAuthView() {
    const errBox = document.getElementById('login-error-msg');
    if (errBox) errBox.style.display = 'none';

    const formLoginSiswa = document.getElementById('auth-view-login-siswa');
    const formRegSiswa = document.getElementById('auth-view-register-siswa');
    const formLoginGuru = document.getElementById('auth-view-login-guru');
    const formRegGuru = document.getElementById('auth-view-register-guru');

    // Sembunyikan semua form terlebih dahulu
    if (formLoginSiswa) formLoginSiswa.style.display = 'none';
    if (formRegSiswa) formRegSiswa.style.display = 'none';
    if (formLoginGuru) formLoginGuru.style.display = 'none';
    if (formRegGuru) formRegGuru.style.display = 'none';

    // Tampilkan form yang sesuai kombinasi mode (login/register) dan role (siswa/guru)
    if (this.authMode === 'register') {
      if (this.authRole === 'guru') {
        if (formRegGuru) formRegGuru.style.display = 'block';
      } else {
        if (formRegSiswa) formRegSiswa.style.display = 'block';
      }
    } else {
      if (this.authRole === 'guru') {
        if (formLoginGuru) formLoginGuru.style.display = 'block';
      } else {
        if (formLoginSiswa) formLoginSiswa.style.display = 'block';
      }
    }
  },

  handleLoginSiswa(e) {
    if (e && e.preventDefault) e.preventDefault();
    const nisInput = document.getElementById('login-siswa-nis');
    const passInput = document.getElementById('login-siswa-pass');
    const errBox = document.getElementById('login-error-msg');

    const nis = nisInput ? nisInput.value : '';
    const password = passInput ? passInput.value : '';

    const res = NetLearnStore.loginSiswa({ nis, password });
    if (!res.success) {
      if (errBox) {
        errBox.textContent = res.message;
        errBox.style.display = 'block';
      } else {
        alert(res.message);
      }
      return;
    }

    if (errBox) errBox.style.display = 'none';
    this.checkAuthUI();
    this.updateUserBadge();
    this.navigateTo('beranda');
    showToast(`Selamat datang kembali, ${res.user.name}! Selamat belajar.`, 'success');
  },

  handleRegisterSiswa(e) {
    if (e && e.preventDefault) e.preventDefault();
    const nameInput = document.getElementById('reg-siswa-name');
    const nisInput = document.getElementById('reg-siswa-nis');
    const kelasInput = document.getElementById('reg-siswa-kelas');
    const passInput = document.getElementById('reg-siswa-pass');
    const passConfirmInput = document.getElementById('reg-siswa-pass-confirm');
    const errBox = document.getElementById('login-error-msg');

    const name = nameInput ? nameInput.value : '';
    const nis = nisInput ? nisInput.value : '';
    const kelas = kelasInput ? kelasInput.value : 'XI TKJ 1';
    const password = passInput ? passInput.value : '';
    const confirmPassword = passConfirmInput ? passConfirmInput.value : '';

    const res = NetLearnStore.registerSiswa({ name, nis, kelas, password, confirmPassword });
    if (!res.success) {
      if (errBox) {
        errBox.textContent = res.message;
        errBox.style.display = 'block';
      } else {
        alert(res.message);
      }
      return;
    }

    if (errBox) errBox.style.display = 'none';
    this.checkAuthUI();
    this.updateUserBadge();
    this.navigateTo('beranda');
    showToast(`Akun siswa berhasil dibuat! Selamat datang, ${res.user.name}.`, 'success');
  },

  handleLoginGuru(e) {
    if (e && e.preventDefault) e.preventDefault();
    const nipInput = document.getElementById('login-guru-nip');
    const passInput = document.getElementById('login-guru-pass');
    const errBox = document.getElementById('login-error-msg');

    const nipOrUser = nipInput ? nipInput.value : '';
    const password = passInput ? passInput.value : '';

    const res = NetLearnStore.loginGuru({ nipOrUser, password });
    if (!res.success) {
      if (errBox) {
        errBox.textContent = res.message;
        errBox.style.display = 'block';
      } else {
        alert(res.message);
      }
      return;
    }

    if (errBox) errBox.style.display = 'none';
    this.checkAuthUI();
    this.updateUserBadge();
    this.navigateTo('guru-dashboard');
    showToast(`Selamat datang, ${res.user.name}! Panel Guru & CMS aktif.`, 'success');
  },

  handleRegisterGuru(e) {
    if (e && e.preventDefault) e.preventDefault();
    const nameInput = document.getElementById('reg-guru-name');
    const nipInput = document.getElementById('reg-guru-nip');
    const mapelInput = document.getElementById('reg-guru-mapel');
    const passInput = document.getElementById('reg-guru-pass');
    const passConfirmInput = document.getElementById('reg-guru-pass-confirm');
    const codeInput = document.getElementById('reg-guru-code');
    const errBox = document.getElementById('login-error-msg');

    const name = nameInput ? nameInput.value : '';
    const nip = nipInput ? nipInput.value : '';
    const mapel = mapelInput ? mapelInput.value : 'Perencanaan & Pengalamatan Jaringan';
    const password = passInput ? passInput.value : '';
    const confirmPassword = passConfirmInput ? passConfirmInput.value : '';
    const secretCode = codeInput ? codeInput.value : '';

    const res = NetLearnStore.registerGuru({ name, nip, mapel, password, confirmPassword, secretCode });
    if (!res.success) {
      if (errBox) {
        errBox.textContent = res.message;
        errBox.style.display = 'block';
      } else {
        alert(res.message);
      }
      return;
    }

    if (errBox) errBox.style.display = 'none';
    this.checkAuthUI();
    this.updateUserBadge();
    this.navigateTo('guru-dashboard');
    showToast(`Akun pengajar berhasil didaftarkan! Selamat bertugas, ${res.user.name}.`, 'success');
  },

  quickLoginSiswa(nis, pass = '123') {
    this.setAuthMode('login');
    this.switchLoginRole('siswa');
    const nisInput = document.getElementById('login-siswa-nis');
    const passInput = document.getElementById('login-siswa-pass');
    if (nisInput) nisInput.value = nis;
    if (passInput) passInput.value = pass;
    this.handleLoginSiswa();
  },

  quickLoginGuru() {
    this.setAuthMode('login');
    this.switchLoginRole('guru');
    const nipInput = document.getElementById('login-guru-nip');
    const passInput = document.getElementById('login-guru-pass');
    if (nipInput) nipInput.value = '198504122010011008';
    if (passInput) passInput.value = 'guru123';
    this.handleLoginGuru();
  },

  logout() {
    if (confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
      NetLearnStore.logout();
      this.checkAuthUI();
      showToast('Sesi ditutup. Anda telah keluar dari sistem.', 'info');
    }
  },

  updateUserBadge() {
    const isGuru = (NetLearnStore.state.currentRole === 'guru');
    const user = isGuru ? NetLearnStore.state.teacherUser : NetLearnStore.state.currentUser;

    const avatar = document.getElementById('user-avatar-display');
    const nameEl = document.getElementById('user-name-display');
    const roleEl = document.getElementById('user-role-display');

    if (avatar) avatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : (isGuru ? 'G' : 'S');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = isGuru ? 'Guru Pengampu • SMK Negeri 3 Makassar' : `${user.nis ? 'NIS: ' + user.nis + ' • ' : ''}${user.kelas || 'XI TKJ 1'}`;

    // Update pill switches & visibility (Siswa tidak boleh melihat tombol ganti peran)
    const headerRoleToggle = document.getElementById('header-role-toggle-pill');
    if (headerRoleToggle) {
      headerRoleToggle.style.display = isGuru ? 'inline-flex' : 'none';
    }

    const roleSwitchSidebarBtn = document.getElementById('role-switch-sidebar-btn');
    if (roleSwitchSidebarBtn) {
      roleSwitchSidebarBtn.style.display = isGuru ? 'inline-block' : 'none';
    }

    const btnSiswa = document.getElementById('role-pill-siswa');
    const btnGuru = document.getElementById('role-pill-guru');
    if (btnSiswa && btnGuru) {
      if (isGuru) {
        btnGuru.classList.add('active');
        btnSiswa.classList.remove('active');
      } else {
        btnSiswa.classList.add('active');
        btnGuru.classList.remove('active');
      }
    }

    // Toggle teacher nav items in sidebar (Revisi Item 3: Panel Guru di atas, Siswa di bawah/dropdown)
    const guruNavSection = document.getElementById('sidebar-guru-section');
    if (guruNavSection) {
      guruNavSection.style.display = isGuru ? 'block' : 'none';
    }

    const siswaNavSection = document.getElementById('sidebar-siswa-section');
    if (siswaNavSection) {
      siswaNavSection.style.display = isGuru ? 'none' : 'block';
    }

    const roleSidebarTitle = document.getElementById('role-sidebar-title');
    const roleSidebarDesc = document.getElementById('role-sidebar-desc');
    if (roleSidebarTitle) roleSidebarTitle.textContent = isGuru ? 'Portal Guru' : 'Mode Siswa';
    if (roleSidebarDesc) roleSidebarDesc.textContent = user.name || (isGuru ? 'Guru Pengampu' : 'Peserta Didik');
  },

  switchRole(targetRole) {
    // Siswa tidak memiliki izin untuk berganti peran ke Guru tanpa otentikasi
    if (targetRole === 'guru' && NetLearnStore.state.currentRole === 'siswa') {
      showToast('Akses ditolak! Panel Guru memerlukan autentikasi login Guru / Instruktur.', 'error');
      return;
    }

    NetLearnStore.setRole(targetRole);
    this.updateUserBadge();

    if (targetRole === 'guru') {
      showToast('Beralih ke Mode Guru (Dashboard & CMS Aktif)', 'info');
      this.navigateTo('guru-dashboard');
    } else {
      showToast('Beralih ke Mode Siswa (Pembelajaran & Evaluasi Aktif)', 'info');
      this.navigateTo('beranda');
    }
  },

  navigateTo(screenId) {
    NetLearnStore.state.activeScreen = screenId;
    NetLearnStore.save();

    // Hide all screens
    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));

    // Show target screen
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    // Update sidebar navigation active item
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-screen') === screenId) {
        btn.classList.add('active');
      }
    });

    // Update Breadcrumb & Header
    this.updateHeaderTitles(screenId);

    // Trigger screen-specific initializers
    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (screenId) {
      case 'beranda':
        this.renderBeranda();
        break;
      case 'tujuan':
        this.renderTujuan();
        break;
      case 'materi':
        this.renderMateri();
        break;
      case 'simulasi':
        this.renderSimulasi();
        break;
      case 'latihan':
        QuizEngine.initLatihan();
        break;
      case 'evaluasi':
        QuizEngine.initEvaluasi();
        break;
      case 'hasil':
        this.renderHasil();
        break;
      case 'refleksi':
        this.renderRefleksi();
        break;
      case 'guru-dashboard':
        this.renderGuruDashboard();
        break;
      case 'guru-cms-materi':
        this.renderGuruCMSMateri();
        break;
      case 'guru-bank-soal':
        this.renderGuruBankSoal();
        break;
      case 'guru-laporan':
        this.renderGuruLaporan();
        break;
      case 'guru-refleksi':
        this.renderGuruRefleksi();
        break;
      case 'guru-database':
        this.renderGuruDatabase();
        break;
    }
  },

  updateHeaderTitles(screenId) {
    const screenMeta = {
      'beranda': { title: 'Beranda Pembelajaran', breadcrumb: 'Beranda' },
      'tujuan': { title: 'Capaian & Tujuan Pembelajaran (CP / TP)', breadcrumb: 'Tujuan Pembelajaran' },
      'materi': { title: 'Materi Interaktif Perencanaan Jaringan', breadcrumb: 'Materi Interaktif' },
      'simulasi': { title: 'Simulasi Pengalamatan & Topologi', breadcrumb: 'Simulasi' },
      'latihan': { title: 'Latihan Soal Bertahap (10 Butir)', breadcrumb: 'Latihan Soal' },
      'evaluasi': { title: 'Evaluasi Akhir Semester (KKM 75)', breadcrumb: 'Evaluasi Akhir' },
      'hasil': { title: 'Hasil Belajar & Rekomendasi Lanjut', breadcrumb: 'Hasil Belajar' },
      'refleksi': { title: 'Refleksi Pembelajaran Mandiri', breadcrumb: 'Refleksi' },
      'guru-dashboard': { title: 'Dashboard Guru & Ringkasan Kelas', breadcrumb: 'Admin / Dashboard' },
      'guru-cms-materi': { title: 'CMS Pengelolaan Materi & Modul', breadcrumb: 'Admin / CMS Materi' },
      'guru-bank-soal': { title: 'Manajemen Bank Soal & Evaluasi', breadcrumb: 'Admin / Bank Soal' },
      'guru-laporan': { title: 'Rekapitulasi Nilai & Laporan Kelas', breadcrumb: 'Admin / Laporan Hasil' },
      'guru-refleksi': { title: 'Rekap Refleksi Belajar Siswa', breadcrumb: 'Admin / Rekap Refleksi' },
      'guru-database': { title: 'Pusat Manajemen Database & Cadangan Data', breadcrumb: 'Admin / Database' }
    };

    const meta = screenMeta[screenId] || { title: 'NetLearn', breadcrumb: 'Sistem' };
    const breadcrumbEl = document.getElementById('header-breadcrumb-text');
    const titleEl = document.getElementById('header-screen-title');

    if (breadcrumbEl) breadcrumbEl.textContent = meta.breadcrumb;
    if (titleEl) titleEl.textContent = meta.title;
  },

  // =========================================================================
  // Screen 1: Beranda
  // =========================================================================
  renderBeranda() {
    const modules = NetLearnStore.getModules();
    const totalMods = modules.length;
    const completedModules = NetLearnStore.state.materiProgress.filter(Boolean).length;
    const progressPercent = totalMods > 0 ? Math.round((completedModules / totalMods) * 100) : 0;

    const berandaFill = document.getElementById('beranda-progress-fill');
    const berandaRatio = document.getElementById('beranda-progress-ratio');
    if (berandaFill) berandaFill.style.width = `${progressPercent}%`;
    if (berandaRatio) {
      berandaRatio.textContent = totalMods > 0
        ? `${completedModules} dari ${totalMods} Modul (${progressPercent}%)`
        : '0 Modul Diunggah (0%)';
    }
  },

  // =========================================================================
  // Screen 2: Tujuan Pembelajaran
  // =========================================================================
  renderTujuan() {
    const tpContainer = document.getElementById('tp-cards-container');
    if (!tpContainer) return;

    tpContainer.innerHTML = NetLearnStore.learningObjectives.tpList.map(tp => `
      <div class="tp-card">
        <div class="tp-code-badge">${tp.id}</div>
        <h3 class="tp-card-title">${tp.title}</h3>
        <p class="tp-card-desc">${tp.desc}</p>
        <ul class="tp-feature-list">
          ${tp.features.map(f => `
            <li class="tp-feature-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>${f}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');
  },

  // =========================================================================
  // Screen 3: Materi Interaktif (Dinamis Terhubung Langsung dengan CMS Guru)
  // Menampilkan PPT sebagai fokus utama, Tombol Penjelasan Rinci (Word), dan YouTube
  // =========================================================================
  materiViewMode: 'ppt', // 'ppt' | 'video'

  setMateriViewMode(mode) {
    this.materiViewMode = mode;
    this.renderMateri();
  },

  renderMateri() {
    const mount = document.getElementById('materi-dynamic-mount');
    if (!mount) return;

    const modules = NetLearnStore.getModules();
    const isGuru = (NetLearnStore.state.currentRole === 'guru');

    // 1. JIKA MODUL KOSONG: Tampilkan Empty State Edukatif yang Bersih
    if (!modules || modules.length === 0) {
      mount.innerHTML = `
        <div class="materi-empty-state card">
          <div class="empty-icon-wrap" style="color:var(--color-primary); margin-bottom:1rem;">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <h3 class="empty-title">Materi Pembelajaran Belum Tersedia</h3>
          <p class="empty-desc">
            Bahan ajar lengkap berupa <strong>Slide PPT Presentasi</strong>, <strong>Dokumen Penjelasan Rinci (Word)</strong>, dan <strong>Video Tutorial YouTube</strong> akan otomatis tampil di sini segera setelah ditambahkan oleh Guru Pengampu melalui Panel CMS.
          </p>
          <div class="empty-actions">
            ${isGuru ? `
              <button class="btn btn-primary btn-lg" onclick="App.navigateTo('guru-cms-materi');" style="display:inline-flex; align-items:center; gap:0.45rem;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                <span>Buka Panel Guru &amp; Kelola Materi</span>
              </button>
            ` : ''}
            <button class="btn btn-secondary btn-lg" onclick="App.loadSampleMateriFromCMS()">
              Muat Contoh Materi Pengalamatan (Demo)
            </button>
          </div>
          <div class="empty-tips">
            <div class="tip-pill">Slide PPT Presentasi</div>
            <div class="tip-pill">Penjelasan Rinci Word (.docx)</div>
            <div class="tip-pill">Tautan Video Tutorial YouTube</div>
          </div>
        </div>
      `;
      return;
    }

    // 2. JIKA MODUL ADA: Tentukan Modul Aktif
    let modIdx = NetLearnStore.state.activeMateriIndex || 0;
    if (modIdx >= modules.length) modIdx = 0;
    NetLearnStore.state.activeMateriIndex = modIdx;

    // Tandai modul aktif sebagai sudah mulai dibaca
    if (!NetLearnStore.state.materiProgress) NetLearnStore.state.materiProgress = [];
    NetLearnStore.state.materiProgress[modIdx] = true;
    NetLearnStore.save();

    const cur = modules[modIdx];

    // Slide PPT State
    const slideIdx = NetLearnStore.state.activeSlideIndex || 0;
    const slides = cur.pptSlides || [];
    const hasEmbedPPT = Boolean(cur.pptUrl && cur.pptUrl.trim());
    const embedPPTUrl = hasEmbedPPT ? this.getSlidesEmbedUrl(cur.pptUrl) : '';

    // Video YouTube & Native Video State
    const hasVideo = Boolean(cur.videoUrl && cur.videoUrl.trim());
    const isNativeVideo = Boolean(cur.videoUrl && (
      cur.videoUrl.endsWith('.mp4') || 
      cur.videoUrl.endsWith('.webm') || 
      cur.videoUrl.startsWith('blob:') || 
      cur.videoUrl.startsWith('data:video/')
    ));
    const ytVideoId = !isNativeVideo ? this.extractYoutubeId(cur.videoUrl) : '';
    const ytEmbedUrl = !isNativeVideo ? this.getYoutubeEmbedUrl(cur.videoUrl) : '';
    const ytWatchUrl = !isNativeVideo ? this.getYoutubeWatchUrl(cur.videoUrl) : '';
    const isFileProtocol = (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:');

    // Hitung Progress
    const doneCount = NetLearnStore.state.materiProgress.filter(Boolean).length;
    const progressPercent = Math.round((doneCount / modules.length) * 100);

    // 3. Render Antarmuka Materi 2-Kolom yang Rapi
    mount.innerHTML = `
      <div class="materi-grid-layout">
        
        <!-- KOLOM KIRI: Navigasi Modul Pembelajaran -->
        <aside class="materi-sidebar-card">
          <div class="materi-sidebar-header">
            <span class="materi-sidebar-title">Modul Ajar</span>
            <span class="materi-mod-count">${modIdx + 1} / ${modules.length}</span>
          </div>

          <!-- Progress Bar Kecil -->
          <div class="progress-bar-container" style="margin-bottom: 0.85rem;">
            <div class="progress-header" style="font-size: 0.72rem;">
              <span>Progres Belajar</span>
              <span>${progressPercent}%</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>

          <!-- List Modul -->
          <ul class="materi-nav-list">
            ${modules.map((m, idx) => {
      const isActive = (idx === modIdx);
      const isDone = NetLearnStore.state.materiProgress[idx];
      const hasModYT = Boolean(m.videoUrl && m.videoUrl.trim());
      return `
                <li>
                  <button class="materi-nav-btn ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}"
                          onclick="App.openModule(${idx})">
                    <span class="num-badge">${isDone ? '✓' : idx + 1}</span>
                    <span class="mod-title-text" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                      <span>${m.title}</span>
                      ${hasModYT ? '<span title="Video YouTube Tersemat" style="font-size:0.75rem; color:#DC2626; margin-left:4px;">🎥</span>' : ''}
                    </span>
                  </button>
                </li>
              `;
    }).join('')}
          </ul>

          ${isGuru ? `
            <div style="margin-top: 1.25rem; padding-top: 0.85rem; border-top: 1px dashed var(--color-border);">
              <button class="btn btn-outline-primary btn-sm" style="width: 100%; display:inline-flex; align-items:center; justify-content:center; gap:0.4rem;" onclick="App.navigateTo('guru-cms-materi')">
                <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                <span>Kelola di CMS Guru</span>
              </button>
            </div>
          ` : ''}
        </aside>

        <!-- KOLOM UTAMA: Konten Materi Terfokus -->
        <main class="materi-main-card">

          <!-- Header Modul Aktif -->
          <div class="materi-header-box">
            <div class="materi-header-top">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge badge-blue">${cur.tpCode || 'TP1'}</span>
                <span style="font-size:0.75rem; color:var(--color-text-muted);">SMK Negeri 3 Makassar • Modul ${modIdx + 1}</span>
              </div>
              ${isGuru ? `
                <button class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.4rem;" onclick="App.openEditCMSModal(${modIdx})">
                  <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span>Sunting Modul Ini di CMS</span>
                </button>
              ` : ''}
            </div>
            <h2 class="materi-main-title">${cur.title}</h2>
            <p class="materi-main-subtitle">${cur.subtitle || 'Simak slide presentasi utama di bawah ini dan buka penjelasan lebih rinci untuk uraian dokumen lengkap.'}</p>

            <!-- Quick Media Navigation Bar -->
            <div class="materi-media-nav-bar" style="display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap; margin-top:1rem; padding-top:0.85rem; border-top:1px solid var(--color-border);">
              <button class="btn btn-secondary btn-sm" onclick="App.setMateriViewMode('ppt'); App.scrollToMateriElement('materi-ppt-wrapper-el')" style="display:inline-flex; align-items:center; gap:0.35rem;">
                <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <span>Slide Presentasi (${slides.length > 0 ? `${slides.length} Slide` : 'PPT'})</span>
              </button>
              
              <button class="btn btn-secondary btn-sm" onclick="App.scrollToMateriElement('word-detail-banner-el')" style="display:inline-flex; align-items:center; gap:0.35rem;">
                <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>Dokumen Rinci (Word)</span>
              </button>

              ${hasVideo ? `
                <button class="btn btn-primary btn-sm" onclick="App.setMateriViewMode('video'); App.scrollToMateriElement('materi-ppt-wrapper-el');" style="display:inline-flex; align-items:center; gap:0.35rem; background:#DC2626; border-color:#DC2626;">
                  <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  <span>Putar Video di Web (Tersedia) 🎥</span>
                </button>
              ` : `
                <span style="font-size:0.75rem; color:var(--color-text-muted); display:inline-flex; align-items:center; gap:0.3rem;">
                  <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  <span>Video: Belum Ditambahkan</span>
                </span>
              `}
            </div>
          </div>

          <!-- ============================================================
               KOMPONEN PALING MENONJOL: PPT MATERI / PEMUTAR VIDEO LANGSUNG
               ============================================================ -->
          <section class="materi-ppt-wrapper" id="materi-ppt-wrapper-el">
            <div class="materi-ppt-toolbar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
              <div class="materi-view-tabs" style="display:inline-flex; background:rgba(0,0,0,0.25); padding:3px; border-radius:8px; border:1px solid rgba(255,255,255,0.15); gap:4px;">
                <button class="btn btn-sm ${this.materiViewMode !== 'video' ? 'btn-primary' : 'btn-secondary'}" 
                        style="border-radius:6px; font-weight:700; display:inline-flex; align-items:center; gap:0.4rem; padding:0.35rem 0.85rem;"
                        onclick="App.setMateriViewMode('ppt')">
                  <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  <span>📊 Slide Presentasi PPT</span>
                </button>
                <button class="btn btn-sm ${this.materiViewMode === 'video' ? 'btn-primary' : 'btn-secondary'}" 
                        style="border-radius:6px; font-weight:700; display:inline-flex; align-items:center; gap:0.4rem; padding:0.35rem 0.85rem; ${this.materiViewMode === 'video' ? 'background:#DC2626; border-color:#DC2626;' : ''}"
                        onclick="App.setMateriViewMode('video')">
                  <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  <span>▶ Tonton Video Langsung 🎥 ${hasVideo ? '<span style="background:rgba(255,255,255,0.25); padding:1px 6px; border-radius:10px; font-size:0.65rem;">Tersedia</span>' : ''}</span>
                </button>
              </div>

              <div class="ppt-toolbar-actions">
                ${this.materiViewMode === 'video' ? (
                  hasVideo ? `
                    <a href="${ytWatchUrl || cur.videoUrl}" target="_blank" rel="noopener" class="ppt-action-btn" title="Buka di YouTube / Tab Baru">
                      <span>↗ Buka di Tab Baru</span>
                    </a>
                  ` : ''
                ) : (
                  hasEmbedPPT ? `
                    <a href="${cur.pptUrl}" target="_blank" rel="noopener" class="ppt-action-btn" title="Buka di Google Slides / Tab Baru">
                      <span>↗ Buka Slide Asli</span>
                    </a>
                  ` : ''
                )}
                <button class="ppt-action-btn" onclick="App.togglePPTFullscreen()" title="Tampilkan Layar Penuh">
                  <span>⛶ Layar Penuh</span>
                </button>
              </div>
            </div>

            <!-- Content Area PPT / Video -->
            <div class="materi-ppt-frame-area">
              ${this.materiViewMode === 'video' ? (
                hasVideo ? this.renderVideoPlayer(cur, modIdx, true) : `
                  <div style="height:100%; min-height:420px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2.5rem; text-align:center; color:#FFF; background:#0F172A; border-radius:0 0 12px 12px;">
                    <div style="font-size:3rem; margin-bottom:0.75rem;">🎥</div>
                    <h3 style="color:#FFF; font-size:1.25rem; font-weight:700; margin-bottom:0.5rem;">Video Belum Ditambahkan untuk Modul Ini</h3>
                    <p style="color:#94A3B8; max-width:520px; font-size:0.88rem; margin-bottom:1.5rem; line-height:1.6;">
                      Guru pengampu dapat memasukkan tautan YouTube atau memilih berkas video melalui Panel CMS Materi. Anda dapat mempelajari modul ini melalui Slide Presentasi dan Dokumen Rinci.
                    </p>
                    <div style="display:flex; gap:0.75rem; flex-wrap:wrap; justify-content:center;">
                      <button class="btn btn-secondary" onclick="App.setMateriViewMode('ppt')">
                        📊 Kembali ke Slide Presentasi PPT
                      </button>
                      ${isGuru ? `
                        <button class="btn btn-primary" style="background:#DC2626; border-color:#DC2626;" onclick="App.openEditCMSModal(${modIdx})">
                          + Tambah Video di CMS Sekarang
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `
              ) : (
                hasEmbedPPT ? `
                  <iframe id="materi-ppt-iframe" 
                          class="materi-ppt-iframe" 
                          src="${embedPPTUrl}" 
                          allowfullscreen 
                          title="Slide Presentasi Materi">
                  </iframe>
                ` : `
                  <!-- Slide Player Interaktif Bawaan -->
                  <div class="slide-deck-player">
                    <div class="slide-deck-top">
                      <span class="badge badge-purple">INTERACTIVE SLIDE DECK</span>
                      <span class="slide-counter-badge">Slide ${(slides.length > 0 ? slideIdx + 1 : 1)} dari ${(slides.length > 0 ? slides.length : 1)}</span>
                    </div>

                    <div class="slide-deck-content">
                      ${slides.length > 0 ? `
                        <h3 class="slide-main-title">${slides[slideIdx].title}</h3>
                        <div class="slide-subtitle">${slides[slideIdx].subtitle || ''}</div>
                        
                        <ul class="slide-bullets-list">
                          ${(slides[slideIdx].bullets || []).map(b => `
                            <li class="slide-bullet-item">
                              <span class="check-icon">✓</span>
                              <span>${b}</span>
                            </li>
                          `).join('')}
                        </ul>

                        ${slides[slideIdx].highlight ? `
                          <div class="slide-highlight-box">
                            ${slides[slideIdx].highlight}
                          </div>
                        ` : ''}
                      ` : `
                        <div style="text-align:center; padding: 2rem 0;">
                          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
                          <h3 class="slide-main-title">${cur.title}</h3>
                          <p style="color:#CBD5E1; max-width:600px; margin: 0 auto;">${cur.subtitle}</p>
                        </div>
                      `}
                    </div>

                    <!-- Controls Navigasi Slide (Revisi Item 8: Tombol Navigasi Berfungsi Lancar & Presisi) -->
                    <div class="slide-deck-controls">
                      <button id="slide-prev-btn" class="slide-nav-btn" onclick="App.prevMateriSlide()" ${(slides.length <= 1 || slideIdx === 0) ? 'disabled' : ''}>
                        ◀ Slide Sebelumnya
                      </button>

                      <div class="slide-dots-container" id="slide-dots-container-el">
                        ${slides.map((_, i) => `
                          <button class="slide-dot ${i === slideIdx ? 'active' : ''}" 
                                  onclick="App.setMateriSlide(${i})" 
                                  title="Buka Slide ${i + 1}"></button>
                        `).join('')}
                      </div>

                      <button id="slide-next-btn" class="slide-nav-btn" onclick="App.nextMateriSlide()" ${(slides.length <= 1 || slideIdx === slides.length - 1) ? 'disabled' : ''}>
                        Slide Selanjutnya ▶
                      </button>
                    </div>
                  </div>
                `
              )}
            </div>
          </section>

          <!-- ============================================================
               BANNER & TOMBOL PENJELASAN LEBIH RINCI (DOKUMEN WORD)
               ============================================================ -->
          <section class="word-detail-banner" id="word-detail-banner-el">
            <div class="word-banner-info">
              <div class="word-doc-icon-wrap">
                <svg viewBox="0 0 24 24" style="width:22px;height:22px;stroke:var(--color-primary);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div>
                <h3 class="word-banner-title">Penjelasan Lebih Rinci & Dokumen Materi</h3>
                <p class="word-banner-desc">
                  Pelajari uraian teori lengkap, rumus biner, studi kasus mendalam, dan unduh berkas modul pembelajaran format dokumen Word (.docx).
                </p>
              </div>
            </div>

            <div class="word-banner-actions">
              <button class="btn-word-main" style="display:inline-flex; align-items:center; gap:0.4rem;" onclick="App.openDetailWordModal(${modIdx})">
                <svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <span>Buka Penjelasan Rinci</span>
              </button>
              <button class="btn btn-secondary" style="display:inline-flex; align-items:center; gap:0.4rem;" onclick="App.downloadModuleWord(${modIdx})" title="Unduh Berkas Dokumen">
                <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Unduh Dokumen</span>
              </button>
              ${cur.wordFileUrl ? `
                <a href="${cur.wordFileUrl}" target="_blank" rel="noopener" class="btn btn-outline-primary" title="Buka Tautan Google Docs / Word">
                  ↗ File Eksternal
                </a>
              ` : ''}
            </div>
          </section>

          <!-- ============================================================
               KARTU VIDEO TUTORIAL YOUTUBE (SELALU AKTIF BILA ADA TAUTAN VIDEO)
               ============================================================ -->
          ${hasVideo ? `
            <section class="materi-video-section" id="materi-video-section-el">
              <div class="video-section-header">
                <div class="video-title-wrap">
                  <span class="video-yt-badge">${isNativeVideo ? 'VIDEO' : 'YOUTUBE'}</span>
                  <span>${cur.videoTitle || 'Video Tutorial Pembahasan Materi'}</span>
                </div>
                ${ytWatchUrl ? `
                  <a href="${ytWatchUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.35rem;">
                    <span>▶ Tonton di YouTube</span>
                    <svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                ` : ''}
              </div>

              <div class="materi-video-player-wrap">
                ${this.renderVideoPlayer(cur, modIdx, false)}
              </div>

              <div class="video-section-footer">
                <span style="display:flex; align-items:center; gap:0.35rem;">
                  <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>Simak penjelasan guru melalui video di atas untuk memperkuat pemahaman konsep visual.</span>
                </span>
                <span style="font-size:0.75rem; color:var(--color-text-muted);">
                  Tautan Video: <a href="${ytWatchUrl || cur.videoUrl}" target="_blank" rel="noopener" style="color:var(--color-accent); text-decoration:underline;">Buka Langsung ↗</a>
                </span>
              </div>
            </section>
          ` : `
            <!-- Keadaan Jika Belum Ada Video -->
            <section class="materi-video-section" id="materi-video-section-el" style="background:#F8FAFC; border-style:dashed;">
              <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem;">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                  <div style="width:36px; height:36px; border-radius:50%; background:#E2E8F0; display:flex; align-items:center; justify-content:center; color:#64748B;">
                    <svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  </div>
                  <div>
                    <div style="font-weight:700; font-size:0.92rem; color:var(--color-text);">Video Tutorial Belum Ditambahkan</div>
                    <div style="font-size:0.78rem; color:var(--color-text-muted);">Guru pengampu dapat melampirkan video YouTube penjelasan melalui Panel CMS.</div>
                  </div>
                </div>
                ${isGuru ? `
                  <button class="btn btn-secondary btn-sm" onclick="App.openEditCMSModal(${modIdx})" style="display:inline-flex; align-items:center; gap:0.35rem;">
                    <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>+ Tambah Link Video YouTube di CMS</span>
                  </button>
                ` : ''}
              </div>
            </section>
          `}

          <!-- Poin Kunci Tambahan jika ada -->
          ${(cur.keyPoints && cur.keyPoints.length > 0) ? `
            <div class="card" style="padding: 1.4rem;">
              <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--color-primary); display:flex; align-items:center; gap:0.4rem;">
                <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--color-accent);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                <span>Poin Kunci Pembahasan</span>
              </h4>
              <ul class="keypoints-list" style="margin: 0;">
                ${cur.keyPoints.map(kp => `
                  <li class="keypoint-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>${kp}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Navigasi Bawah Antar Modul -->
          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:1.25rem; border-top:1px solid var(--color-border); margin-top:0.5rem;">
            <button class="btn btn-secondary" onclick="App.prevModule()" ${modIdx === 0 ? 'disabled' : ''}>
              ← Modul Sebelumnya
            </button>
            <button class="btn btn-primary" onclick="App.nextModule()">
              ${modIdx === modules.length - 1 ? 'Selesaikan Materi & Mulai Praktik →' : 'Modul Selanjutnya →'}
            </button>
          </div>

        </main>

      </div>
    `;
  },

  openModule(index) {
    const modules = NetLearnStore.getModules();
    if (index >= 0 && index < modules.length) {
      NetLearnStore.state.activeMateriIndex = index;
      NetLearnStore.state.activeSlideIndex = 0; // reset slide ke slide awal
      this.materiViewMode = 'ppt';
      if (!NetLearnStore.state.materiProgress) NetLearnStore.state.materiProgress = [];
      NetLearnStore.state.materiProgress[index] = true;
      NetLearnStore.save();
      this.renderMateri();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  prevModule() {
    if (NetLearnStore.state.activeMateriIndex > 0) {
      this.openModule(NetLearnStore.state.activeMateriIndex - 1);
    }
  },

  nextModule() {
    const modules = NetLearnStore.getModules();
    if (NetLearnStore.state.activeMateriIndex < modules.length - 1) {
      this.openModule(NetLearnStore.state.activeMateriIndex + 1);
    } else {
      showToast('Selamat! Seluruh materi telah selesai dipelajari! Silakan lanjutkan ke Simulator Jaringan.', 'success');
      this.navigateTo('simulasi');
    }
  },

  // Slide Deck Navigation Helpers (Revisi Item 8: Transisi Mulus & Presisi Tanpa Loncat Layar)
  nextMateriSlide() {
    const modules = NetLearnStore.getModules();
    const cur = modules[NetLearnStore.state.activeMateriIndex || 0];
    let slides = (cur && cur.pptSlides) ? cur.pptSlides : [];
    if (typeof slides === 'string') {
      try { slides = JSON.parse(slides); } catch (e) { slides = []; }
    }
    const curSlide = NetLearnStore.state.activeSlideIndex || 0;
    if (curSlide < slides.length - 1) {
      NetLearnStore.state.activeSlideIndex = curSlide + 1;
      NetLearnStore.save();
      this.updateSlideDeckDOM(slides, curSlide + 1);
    }
  },

  prevMateriSlide() {
    const modules = NetLearnStore.getModules();
    const cur = modules[NetLearnStore.state.activeMateriIndex || 0];
    let slides = (cur && cur.pptSlides) ? cur.pptSlides : [];
    if (typeof slides === 'string') {
      try { slides = JSON.parse(slides); } catch (e) { slides = []; }
    }
    const curSlide = NetLearnStore.state.activeSlideIndex || 0;
    if (curSlide > 0) {
      NetLearnStore.state.activeSlideIndex = curSlide - 1;
      NetLearnStore.save();
      this.updateSlideDeckDOM(slides, curSlide - 1);
    }
  },

  setMateriSlide(slideIdx) {
    const modules = NetLearnStore.getModules();
    const cur = modules[NetLearnStore.state.activeMateriIndex || 0];
    let slides = (cur && cur.pptSlides) ? cur.pptSlides : [];
    if (typeof slides === 'string') {
      try { slides = JSON.parse(slides); } catch (e) { slides = []; }
    }
    if (slideIdx >= 0 && slideIdx < slides.length) {
      NetLearnStore.state.activeSlideIndex = slideIdx;
      NetLearnStore.save();
      this.updateSlideDeckDOM(slides, slideIdx);
    }
  },

  updateSlideDeckDOM(slides, slideIdx) {
    if (!slides || slides.length === 0) return;
    const curSlide = slides[slideIdx];
    if (!curSlide) return;

    // Update Counter Badge
    const counterBadge = document.querySelector('.slide-counter-badge');
    if (counterBadge) counterBadge.textContent = `Slide ${slideIdx + 1} dari ${slides.length}`;

    // Update Content with smooth fade
    const contentEl = document.querySelector('.slide-deck-content');
    if (contentEl) {
      contentEl.style.opacity = '0.3';
      contentEl.style.transition = 'opacity 0.15s ease';
      setTimeout(() => {
        contentEl.innerHTML = `
          <h3 class="slide-main-title">${curSlide.title}</h3>
          <div class="slide-subtitle">${curSlide.subtitle || ''}</div>
          <ul class="slide-bullets-list">
            ${(curSlide.bullets || []).map(b => `
              <li class="slide-bullet-item">
                <span class="check-icon">✓</span>
                <span>${b}</span>
              </li>
            `).join('')}
          </ul>
          ${curSlide.highlight ? `
            <div class="slide-highlight-box">
              ${curSlide.highlight}
            </div>
          ` : ''}
        `;
        contentEl.style.opacity = '1';
      }, 100);
    } else {
      this.renderMateri();
      return;
    }

    // Update Navigation Buttons Disabled State
    const prevBtn = document.getElementById('slide-prev-btn');
    const nextBtn = document.getElementById('slide-next-btn');
    if (prevBtn) prevBtn.disabled = (slideIdx === 0);
    if (nextBtn) nextBtn.disabled = (slideIdx === slides.length - 1);

    // Update Dots Container
    const dots = document.querySelectorAll('#slide-dots-container-el .slide-dot');
    dots.forEach((dot, i) => {
      if (i === slideIdx) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  },

  togglePPTFullscreen() {
    const wrapper = document.getElementById('materi-ppt-wrapper-el');
    if (!wrapper) return;
    if (!document.fullscreenElement) {
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen();
      } else if (wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  },

  // Ekstraktor ID Video YouTube Super Tangguh (Mendukung 16+ format tautan, live, shorts & snippet iframe)
  extractYoutubeId(url) {
    if (!url || typeof url !== 'string') return '';
    let str = url.trim();
    if (!str) return '';

    // 1. Jika pengguna menempelkan kode sematan <iframe> penuh (<iframe src="https://www.youtube.com/embed/..." ...>)
    if (str.includes('<iframe') || str.includes('src=')) {
      const srcMatch = str.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        str = srcMatch[1].trim();
      }
    }

    // 2. Jika sudah merupakan ID video 11 karakter murni
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
      return str;
    }

    // 3. Format youtube.com/embed/ID atau youtube-nocookie.com/embed/ID
    const embedMatch = str.match(/(?:youtube\.com|youtube-nocookie\.com)\/embed\/([a-zA-Z0-9_-]{11})/i);
    if (embedMatch && embedMatch[1]) return embedMatch[1];

    // 4. Format youtube.com/watch?v=ID atau parameter v= di mana saja
    const watchMatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
    if (watchMatch && watchMatch[1]) return watchMatch[1];

    // 5. Format youtu.be/ID (termasuk ?si=... dan parameter tracking)
    const beMatch = str.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (beMatch && beMatch[1]) return beMatch[1];

    // 6. Format YouTube Shorts: youtube.com/shorts/ID
    const shortsMatch = str.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
    if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

    // 7. Format YouTube Live: youtube.com/live/ID
    const liveMatch = str.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i);
    if (liveMatch && liveMatch[1]) return liveMatch[1];

    // 8. Fallback umum pola ID 11 karakter
    const generalMatch = str.match(/(?:[=/]|^)([a-zA-Z0-9_-]{11})(?:[?&/#]|$)/);
    if (generalMatch && generalMatch[1]) return generalMatch[1];

    return '';
  },

  // Helper Pengubah Tautan YouTube Menjadi Format Embed Resmi (Universally Supported)
  getYoutubeEmbedUrl(url, autoplay = false) {
    if (!url || typeof url !== 'string') return '';
    const videoId = this.extractYoutubeId(url);
    if (videoId) {
      const ap = autoplay ? '&autoplay=1' : '';
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1${ap}`;
    }
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return '';
  },

  getYoutubeWatchUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const videoId = this.extractYoutubeId(url);
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return url.trim();
  },

  // Render Pemutar Video Universal (Mendukung Video Lokal MP4, YouTube Embed di Localhost/Hosting, dan Poster Interaktif jika file:///)
  renderVideoPlayer(cur, modIdx, isHero = false) {
    if (!cur || !cur.videoUrl || !cur.videoUrl.trim()) return '';

    const isNativeVideo = Boolean(
      cur.videoUrl.endsWith('.mp4') || 
      cur.videoUrl.endsWith('.webm') || 
      cur.videoUrl.startsWith('blob:') || 
      cur.videoUrl.startsWith('data:video/')
    );
    const ytVideoId = !isNativeVideo ? this.extractYoutubeId(cur.videoUrl) : '';
    const ytEmbedUrl = !isNativeVideo ? this.getYoutubeEmbedUrl(cur.videoUrl) : '';
    const ytWatchUrl = !isNativeVideo ? this.getYoutubeWatchUrl(cur.videoUrl) : '';
    const isFileProtocol = (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:');

    // 1. Berkas Video Native (.mp4, .webm, blob) -> Putar via elemen <video> langsung di semua protokol
    if (isNativeVideo) {
      return `
        <div style="width:100%; height:100%; min-height:${isHero ? '480px' : '380px'}; background:#000; display:flex; align-items:center; justify-content:center;">
          <video src="${cur.videoUrl}" controls playsinline controlsList="nodownload" style="width:100%; height:100%; max-height:560px; object-fit:contain;"></video>
        </div>
      `;
    }

    // 2. Video YouTube dibuka langsung via file:/// -> Cegah Error 153 dari YouTube dengan Player Hub Interaktif Berkualitas Tinggi
    if (isFileProtocol) {
      const thumbUrl = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` : '';
      return `
        <div class="materi-video-fallback-card" style="width:100%; height:100%; min-height:${isHero ? '460px' : '380px'}; position:relative; background:#0B1120; display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; text-align:center; padding:1.5rem; border-radius:${isHero ? '0 0 12px 12px' : 'var(--radius-lg)'}; box-sizing:border-box;">
          ${thumbUrl ? `
            <div style="position:absolute; inset:0; background:url('${thumbUrl}') center/cover no-repeat; filter:brightness(0.32) blur(3px); transform:scale(1.06); z-index:1;"></div>
          ` : ''}
          <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(11,17,32,0.45) 0%, rgba(11,17,32,0.92) 100%); z-index:2;"></div>
          
          <div style="position:relative; z-index:3; max-width:620px; width:100%; display:flex; flex-direction:column; align-items:center; gap:0.85rem; padding:0 0.5rem;">
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; justify-content:center;">
              <span style="background:#DC2626; color:#FFF; font-size:0.72rem; font-weight:700; padding:0.25rem 0.7rem; border-radius:999px; letter-spacing:0.04em; text-transform:uppercase; box-shadow:0 2px 8px rgba(220,38,38,0.45);">
                ▶ YouTube Tutorial
              </span>
              <span style="background:rgba(255,255,255,0.18); color:#F1F5F9; font-size:0.72rem; font-weight:600; padding:0.25rem 0.7rem; border-radius:999px; backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,0.2);">
                Modul ${modIdx + 1}: ${cur.title || 'Materi'}
              </span>
            </div>

            <a href="${ytWatchUrl || cur.videoUrl}" target="_blank" rel="noopener" title="Klik untuk Memutar Video di YouTube" style="text-decoration:none; display:flex; align-items:center; justify-content:center; width:68px; height:68px; border-radius:50%; background:#DC2626; color:#FFF; box-shadow:0 0 25px rgba(220,38,38,0.6); transition:transform 0.2s, box-shadow 0.2s; cursor:pointer; margin:0.25rem 0;" onmouseover="this.style.transform='scale(1.12)';this.style.boxShadow='0 0 35px rgba(220,38,38,0.85)';" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 0 25px rgba(220,38,38,0.6)';">
              <svg viewBox="0 0 24 24" style="width:30px; height:30px; fill:currentColor; margin-left:3px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </a>

            <h3 style="color:#FFF; font-size:1.18rem; font-weight:700; margin:0; line-height:1.4; text-shadow:0 2px 8px rgba(0,0,0,0.85);">
              ${cur.videoTitle || 'Tutorial Konsep Pengalamatan IP Address & Konversi Biner'}
            </h3>

            <div style="display:flex; gap:0.65rem; flex-wrap:wrap; justify-content:center; margin-top:0.35rem;">
              <a href="${ytWatchUrl || cur.videoUrl}" target="_blank" rel="noopener" class="btn" style="background:#DC2626; color:#FFF; font-weight:700; border-radius:8px; font-size:0.85rem; padding:0.55rem 1.2rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.45rem; box-shadow:0 4px 14px rgba(220,38,38,0.45);">
                <span>▶ Tonton Video di YouTube</span>
                <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <a href="http://localhost:3000/index.html" class="btn" style="background:rgba(255,255,255,0.15); color:#F8FAFC; border:1px solid rgba(255,255,255,0.3); font-weight:600; border-radius:8px; font-size:0.85rem; padding:0.55rem 1.1rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.45rem; backdrop-filter:blur(6px);">
                <span>🚀 Buka via Localhost (Putar Langsung)</span>
              </a>
            </div>

            <div style="background:rgba(15,23,42,0.7); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.85rem; margin-top:0.4rem; max-width:520px;">
              <p style="color:#CBD5E1; font-size:0.75rem; margin:0; line-height:1.45;">
                ℹ️ <strong>Kenapa butuh Localhost / YouTube?</strong> Browser (Chrome/Edge) membatasi pemutaran langsung YouTube pada berkas lokal (<code>file:///</code>). Jalankan <strong>Jalankan_NetLearn.bat</strong> atau buka via hosting Vercel agar video otomatis terputar langsung di dalam website tanpa keluar tab.
              </p>
            </div>
          </div>
        </div>
      `;
    }

    // 3. YouTube Embed Standar pada HTTP / HTTPS (Localhost 3000 atau Hosting Vercel) -> 100% Berputar Langsung Bebas Error 153
    return `
      <iframe id="${isHero ? 'materi-video-main-iframe' : 'materi-video-section-iframe'}" 
              class="materi-ppt-iframe" 
              src="${ytEmbedUrl}" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerpolicy="strict-origin-when-cross-origin" 
              allowfullscreen 
              title="${cur.videoTitle || 'Video Tutorial YouTube'}">
      </iframe>
    `;
  },

  // Pratinjau Tautan Video YouTube / Berkas Lokal Secara Real-Time pada Modal CMS
  previewCMSVideoUrl() {
    const input = document.getElementById('cms-form-yt');
    const previewEl = document.getElementById('cms-yt-preview');
    if (!input || !previewEl) return;

    const val = input.value.trim();
    if (!val) {
      previewEl.innerHTML = '';
      return;
    }

    const isNative = val.endsWith('.mp4') || val.endsWith('.webm') || val.startsWith('blob:') || val.startsWith('data:video/');
    if (isNative) {
      previewEl.innerHTML = `
        <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:var(--radius-md); padding:0.6rem 0.85rem; font-size:0.78rem; color:#065F46; display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; margin-top:0.4rem;">
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <span>🎬</span>
            <strong>Berkas Video Terpilih!</strong>
            <span style="font-size:0.72rem; color:#047857;">(Format video didukung pemutar langsung web)</span>
          </div>
        </div>
      `;
      return;
    }

    const videoId = this.extractYoutubeId(val);
    if (videoId) {
      previewEl.innerHTML = `
        <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:var(--radius-md); padding:0.6rem 0.85rem; font-size:0.78rem; color:#065F46; display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; margin-top:0.4rem;">
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <span>✅</span>
            <strong>Link YouTube Terdeteksi Valid!</strong>
            <span style="font-family:var(--font-mono); font-size:0.72rem; color:#047857;">(ID: ${videoId})</span>
          </div>
          <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener" style="color:#047857; text-decoration:underline; font-weight:600;">
            Buka Video di Tab Baru ↗
          </a>
        </div>
      `;
    } else {
      previewEl.innerHTML = `
        <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:var(--radius-md); padding:0.6rem 0.85rem; font-size:0.78rem; color:#92400E; margin-top:0.4rem;">
          ⚠️ Format link YouTube belum dikenali. Contoh link yang didukung:
          <br><code>https://www.youtube.com/watch?v=M11SvDtPBhA</code> atau <code>https://youtu.be/M11SvDtPBhA</code>
        </div>
      `;
    }
  },

  handleCMSVideoFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const ytInput = document.getElementById('cms-form-yt');
    const titleInput = document.getElementById('cms-form-yt-title');
    const statusEl = document.getElementById('cms-video-file-status');
    if (ytInput) {
      ytInput.value = objectUrl;
    }
    if (titleInput && !titleInput.value) {
      titleInput.value = file.name.replace(/\.[^/.]+$/, "");
    }
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#059669; font-weight:600;">✓ Berkas dipilih: ${file.name} (${(file.size / (1024*1024)).toFixed(1)} MB)</span>`;
    }
    this.previewCMSVideoUrl();
  },

  // Helper Smooth Scroll ke Elemen Spesifik pada Layar Materi
  scrollToMateriElement(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const origBorder = el.style.borderColor;
      const origShadow = el.style.boxShadow;
      el.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      el.style.borderColor = 'var(--color-accent)';
      el.style.boxShadow = '0 0 0 4px rgba(79, 110, 247, 0.35)';
      setTimeout(() => {
        el.style.boxShadow = origShadow;
        el.style.borderColor = origBorder;
      }, 2000);
    }
  },

  // Helper Pengubah Tautan Google Slides Menjadi Format Embed
  getSlidesEmbedUrl(url) {
    if (!url || typeof url !== 'string') return '';
    let trimmed = url.trim();
    if (!trimmed) return '';

    // Deteksi Google Slides
    if (trimmed.includes('docs.google.com/presentation')) {
      if (!trimmed.includes('/embed')) {
        trimmed = trimmed.replace(/\/pub(\?.*)?$/, '/embed$1');
        trimmed = trimmed.replace(/\/edit(\?.*)?$/, '/embed$1');
        if (!trimmed.includes('/embed')) {
          trimmed = trimmed.replace(/\/$/, '') + '/embed';
        }
      }
    }
    return trimmed;
  },

  // =========================================================================
  // MODAL PENJELASAN LEBIH RINCI (DOKUMEN WORD)
  // =========================================================================
  openDetailWordModal(modIdx) {
    const modules = NetLearnStore.getModules();
    const cur = modules[modIdx];
    if (!cur) return;

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.innerHTML = `Dokumen Penjelasan Rinci: ${cur.title}`;

    const wordContent = cur.wordDetail && cur.wordDetail.trim()
      ? cur.wordDetail
      : `
        <div class="word-doc-paper">
          <div class="word-doc-header">
            <div class="doc-school-title">SMK NEGERI 3 MAKASSAR</div>
            <div class="doc-meta-sub">PROGRAM KEAHLIAN TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI</div>
            <div class="doc-meta-divider"></div>
            <div class="doc-subject">${cur.title}</div>
            <div class="doc-badge-tp">${cur.tpCode || 'TP1'}</div>
          </div>
          <p style="color:var(--color-text-muted); text-align:center; padding: 2rem 0;">
            Guru belum menambahkan uraian teks dokumen rinci untuk modul ini.<br>
            Silakan sunting melalui Panel Guru (CMS Kelola Materi).
          </p>
        </div>
      `;

    modalBody.innerHTML = `
      <div style="max-height: 65vh; overflow-y: auto; padding-right: 0.5rem;">
        ${wordContent}
      </div>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" style="display:inline-flex; align-items:center; gap:0.4rem;" onclick="App.copyWordDetail(${modIdx})">
        <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
        <span>Salin Teks Penjelasan</span>
      </button>
      <button class="btn btn-primary" style="display:inline-flex; align-items:center; gap:0.4rem;" onclick="App.downloadModuleWord(${modIdx})">
        <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Unduh File Dokumen (.docx)</span>
      </button>
      ${cur.wordFileUrl ? `
        <a href="${cur.wordFileUrl}" target="_blank" rel="noopener" class="btn btn-outline-primary">
          ↗ Buka Google Docs Asli
        </a>
      ` : ''}
      <button class="btn btn-secondary" onclick="closeModal()">
        Tutup
      </button>
    `;

    openModal();
  },

  // Unduh dokumen modul sebagai file .doc / .docx siap buka di MS Word
  downloadModuleWord(modIdx) {
    const modules = NetLearnStore.getModules();
    const cur = modules[modIdx];
    if (!cur) return;

    const filename = cur.wordFileName || `Modul_${modIdx + 1}_${cur.title.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;

    // Buat file HTML format Microsoft Word
    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${cur.title}</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #111; }
          h2 { color: #185ABD; font-size: 16pt; margin-bottom: 4pt; }
          h3 { color: #2B579A; font-size: 13pt; margin-top: 12pt; }
          p { margin-bottom: 8pt; text-align: justify; }
          table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
          th, td { border: 1pt solid #999; padding: 6pt 8pt; font-size: 10pt; }
          th { background-color: #EEF2F9; }
          .kop { text-align: center; border-bottom: 2pt solid #185ABD; padding-bottom: 8pt; margin-bottom: 14pt; }
          .kop h1 { font-size: 14pt; margin: 0; color: #0F172A; }
          .kop p { font-size: 9pt; margin: 2pt 0; color: #555; text-align: center; }
        </style>
      </head>
      <body>
        <div class="kop">
          <h1>SMK NEGERI 3 MAKASSAR</h1>
          <p>BIDANG KEAHLIAN TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI (TJKT)</p>
          <p>Mata Pelajaran: Perencanaan & Pengalamatan Jaringan • Sasaran: ${cur.tpCode || 'TP1'}</p>
        </div>

        <h2>${cur.title}</h2>
        <p><em>${cur.subtitle || ''}</em></p>
        <hr/>

        ${cur.wordDetail || '<p>Dokumen materi ini disiapkan untuk bimbingan belajar mandiri peserta didik SMK Negeri 3 Makassar.</p>'}

        <br/><br/>
        <p style="font-size:9pt; color:#666; text-align:right;">
          Dicetak dari NetLearn Learning Platform • Guru Pengampu: Bpk. Rifaldi, S.Pd., M.T.
        </p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Dokumen "${filename}" berhasil diunduh!`, 'success');
  },

  copyWordDetail(modIdx) {
    const modules = NetLearnStore.getModules();
    const cur = modules[modIdx];
    if (!cur) return;

    // Bersihkan HTML tag untuk disalin sebagai teks murni
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cur.wordDetail || cur.subtitle || cur.title;
    const plainText = tempDiv.innerText || tempDiv.textContent || '';

    navigator.clipboard.writeText(plainText).then(() => {
      showToast('Teks penjelasan rinci berhasil disalin ke clipboard!', 'success');
    }).catch(() => {
      showToast('Gagal menyalin teks secara otomatis.', 'error');
    });
  },

  // =========================================================================
  // GURU CMS SUITE: Pengelolaan Modul Materi Pembelajaran
  // Terhubung langsung ke data siswa
  // =========================================================================
  renderGuruCMSMateri() {
    const mount = document.getElementById('guru-cms-modules-list');
    if (!mount) return;

    const modules = NetLearnStore.getModules();

    if (!modules || modules.length === 0) {
      mount.innerHTML = `
        <div class="card" style="padding: 3rem 2rem; text-align: center; background:#FFF;">
          <div style="margin-bottom: 0.75rem; color: var(--color-primary);">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--color-primary); margin-bottom: 0.35rem;">
            Belum Ada Modul Materi di CMS
          </h3>
          <p style="color: var(--color-text-muted); font-size: 0.9rem; max-width: 500px; margin: 0 auto 1.5rem;">
            Materi pembelajaran untuk siswa saat ini kosong. Anda dapat menambahkan modul baru secara manual atau memuat template modul contoh.
          </p>
          <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
            <button class="btn btn-primary btn-lg" onclick="App.openCreateCMSModal()" style="display:inline-flex; align-items:center; gap:0.4rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Buat Modul Pertama</span>
            </button>
            <button class="btn btn-secondary btn-lg" onclick="App.loadSampleMateriFromCMS()">
              Muat Contoh Materi Pengalamatan
            </button>
          </div>
        </div>
      `;
      return;
    }

    mount.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${modules.map((m, idx) => {
      const hasPPT = Boolean(m.pptUrl && m.pptUrl.trim()) || (m.pptSlides && m.pptSlides.length > 0);
      const hasWord = Boolean(m.wordDetail && m.wordDetail.trim().length > 30);
      const hasYT = Boolean(m.videoUrl && m.videoUrl.trim());

      return `
            <div class="cms-module-card">
              <div class="cms-module-header">
                <div style="flex: 1; padding-right: 1rem;">
                  <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.35rem;">
                    <span class="badge badge-blue">Modul ${idx + 1}</span>
                    <span class="badge badge-purple">${m.tpCode || 'TP1'}</span>
                  </div>
                  <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--color-primary); margin-bottom: 0.25rem;">
                    ${m.title}
                  </h4>
                  <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.65rem;">
                    ${m.subtitle || 'Tidak ada deskripsi singkat.'}
                  </p>

                  <!-- Status Kelengkapan Konten -->
                  <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                    <span class="badge ${hasPPT ? 'badge-success' : 'badge-gray'}">
                      PPT: ${hasPPT ? 'Tersedia' : 'Belum Diisi'}
                    </span>
                    <span class="badge ${hasWord ? 'badge-success' : 'badge-gray'}">
                      Word: ${hasWord ? 'Terisi Lengkap' : 'Belum Ada'}
                    </span>
                    <span class="badge ${hasYT ? 'badge-success' : 'badge-gray'}">
                      YouTube: ${hasYT ? 'Terhubung' : 'Belum Ada'}
                    </span>
                  </div>
                </div>

                <!-- Tombol Aksi Guru -->
                <div style="display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0;">
                  <button class="btn btn-primary btn-sm" onclick="App.openEditCMSModal(${idx})">
                    Sunting
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="App.openModule(${idx}); App.navigateTo('materi');" title="Buka dan Pratinjau Modul Ini Langsung di Layar Materi">
                    Lihat Modul
                  </button>
                  <button class="btn btn-secondary btn-sm" style="color:var(--color-danger);" onclick="App.deleteCMSModule(${idx})" title="Hapus Modul">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  },

  openCreateCMSModal() {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.textContent = 'Tambah Modul Materi Baru';

    modalBody.innerHTML = `
      <form id="cms-module-form" onsubmit="event.preventDefault(); App.saveCMSModuleForm(-1);">
        <div class="form-group">
          <label class="form-label">Judul Modul Materi:</label>
          <input type="text" id="cms-form-title" class="form-control" placeholder="Contoh: Pengalamatan Jaringan (IPv4) & Perencanaan Subnet" required>
        </div>

        <div class="grid-two-equal" style="gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Sasaran Tujuan Pembelajaran (TP):</label>
            <select id="cms-form-tp" class="form-control">
              <option value="TP1">TP1 - Perencanaan Pengalamatan Topologi</option>
              <option value="TP2">TP2 - Penerapan Metode CIDR & VLSM</option>
              <option value="TP3">TP3 - Kalkulasi Parameter Subnetting</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nama File Dokumen Word:</label>
            <input type="text" id="cms-form-filename" class="form-control" placeholder="Modul_Ajar_Pengalamatan.docx">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi Singkat / Ringkasan Modul:</label>
          <input type="text" id="cms-form-sub" class="form-control" placeholder="Uraian singkat 1-2 kalimat mengenai pokok bahasan modul ini.">
        </div>

        <!-- Bagian PPT Materi (Paling Menonjol) -->
        <div style="background:var(--color-bg-muted); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--color-border); margin-bottom:1.25rem;">
          <div style="font-weight:700; font-size:0.9rem; color:var(--color-primary); margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem;">
            <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--color-primary);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span>Tautan Slide Presentasi PPT (Paling Menonjol di Layar Siswa):</span>
          </div>
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-bottom:0.6rem;">
            Masukkan tautan presentasi <strong>Google Slides</strong>, <strong>Canva</strong>, atau <strong>OneDrive</strong>. Jika dikosongkan, sistem akan otomatis menyediakan Slide Deck Interaktif bawaan.
          </p>
          <input type="text" id="cms-form-ppt" class="form-control" placeholder="https://docs.google.com/presentation/d/.../embed atau link slide">
        </div>

        <!-- Bagian Dokumen Penjelasan Rinci (Word) -->
        <div style="background:#F0F5FF; padding:1rem; border-radius:var(--radius-md); border:1px solid #BFDBFE; margin-bottom:1.25rem;">
          <div style="font-weight:700; font-size:0.9rem; color:#185ABD; margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem;">
            <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#185ABD;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Isi Dokumen Penjelasan Rinci (Field File Word):</span>
          </div>
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-bottom:0.6rem;">
            Tulis atau salin teks materi penjelasan lengkap (bab, pengertian, rumus biner, studi kasus). Isi ini akan tampil ketika siswa menekan tombol <strong>"Penjelasan Lebih Rinci"</strong>.
          </p>
          <textarea id="cms-form-word" class="form-control" rows="8" placeholder="Tuliskan uraian materi rinci di sini... (Mendukung paragraf dan format teks)">
BAB I: PENGERTIAN MATERI
Tuliskan pendahuluan dan teori dasar di sini...

BAB II: STRUKTUR DAN RUMUS
Tuliskan rumus atau poin penting di sini...

BAB III: CONTOH KASUS LAB
Tuliskan contoh praktikum di sini...
          </textarea>
          <div style="margin-top:0.65rem;">
            <label class="form-label" style="font-size:0.76rem;">Tautan Dokumen Word / Google Docs Asli (Opsional):</label>
            <input type="text" id="cms-form-wordurl" class="form-control" placeholder="https://docs.google.com/document/d/... (opsional)">
          </div>
        </div>

        <!-- Bagian Video YouTube -->
        <div style="background:#FFF5F5; padding:1.15rem; border-radius:var(--radius-md); border:1px solid #FECACA; margin-bottom:1.25rem;">
          <div style="font-weight:700; font-size:0.92rem; color:#DC2626; margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem;">
            <svg viewBox="0 0 24 24" style="width:17px;height:17px;stroke:#DC2626;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            <span>Tautan Video Tutorial YouTube (Terintegrasi ke Pemutar Materi):</span>
          </div>
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-bottom:0.6rem;">
            Mendukung link <strong>youtube.com/watch?v=...</strong>, <strong>youtu.be/...</strong>, <strong>YouTube Shorts</strong>, <strong>Live</strong>, maupun <strong>kode sematan &lt;iframe&gt;</strong>.
          </p>
          <div class="form-group" style="margin-bottom:0.5rem;">
            <label class="form-label" style="font-size:0.76rem;">Judul Video Tutorial (Opsional):</label>
            <input type="text" id="cms-form-yt-title" class="form-control" placeholder="Contoh: Video Tutorial Konsep Dasar & Subnetting IPv4">
          </div>
          <div class="form-group" style="margin-bottom:0.35rem;">
            <label class="form-label" style="font-size:0.76rem;">URL / Link Video YouTube:</label>
            <input type="text" id="cms-form-yt" class="form-control" oninput="App.previewCMSVideoUrl()" placeholder="Contoh: https://www.youtube.com/watch?v=M11SvDtPBhA atau https://youtu.be/...">
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center; margin-top:0.4rem; flex-wrap:wrap;">
            <label for="cms-form-video-file" class="btn btn-secondary btn-sm" style="cursor:pointer; display:inline-flex; align-items:center; gap:0.35rem; font-size:0.76rem;">
              <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Pilih Berkas Video dari Komputer (.mp4 / .webm)</span>
            </label>
            <input type="file" id="cms-form-video-file" accept="video/mp4,video/webm" style="display:none;" onchange="App.handleCMSVideoFileUpload(event)">
            <span id="cms-video-file-status" style="font-size:0.73rem; color:var(--color-text-muted);">atau tempel link YouTube di atas</span>
          </div>
          <div id="cms-yt-preview"></div>
        </div>
      </form>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" style="display:inline-flex; align-items:center; gap:0.4rem;" onclick="App.saveCMSModuleForm(-1)">
        <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        <span>Simpan Modul Baru</span>
      </button>
    `;

    openModal();
  },

  openEditCMSModal(idx) {
    const modules = NetLearnStore.getModules();
    const cur = modules[idx];
    if (!cur) return;

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.innerHTML = `Sunting Modul ${idx + 1}: ${cur.title}`;

    modalBody.innerHTML = `
      <form id="cms-module-form" onsubmit="event.preventDefault(); App.saveCMSModuleForm(${idx});">
        <div class="form-group">
          <label class="form-label">Judul Modul Materi:</label>
          <input type="text" id="cms-form-title" class="form-control" value="${cur.title || ''}" required>
        </div>

        <div class="grid-two-equal" style="gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Sasaran Tujuan Pembelajaran (TP):</label>
            <select id="cms-form-tp" class="form-control">
              <option value="TP1" ${cur.tpCode === 'TP1' ? 'selected' : ''}>TP1 - Perencanaan Pengalamatan Topologi</option>
              <option value="TP2" ${cur.tpCode === 'TP2' ? 'selected' : ''}>TP2 - Penerapan Metode CIDR & VLSM</option>
              <option value="TP3" ${cur.tpCode === 'TP3' ? 'selected' : ''}>TP3 - Kalkulasi Parameter Subnetting</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nama File Dokumen Word:</label>
            <input type="text" id="cms-form-filename" class="form-control" value="${cur.wordFileName || ''}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi Singkat / Ringkasan Modul:</label>
          <input type="text" id="cms-form-sub" class="form-control" value="${cur.subtitle || ''}">
        </div>

        <!-- Bagian PPT Materi (Paling Menonjol) -->
        <div style="background:var(--color-bg-muted); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--color-border); margin-bottom:1.25rem;">
          <div style="font-weight:700; font-size:0.9rem; color:var(--color-primary); margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem;">
            <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--color-primary);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span>Tautan Slide Presentasi PPT (Paling Menonjol di Layar Siswa):</span>
          </div>
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-bottom:0.6rem;">
            Masukkan tautan presentasi <strong>Google Slides</strong>, <strong>Canva</strong>, atau <strong>OneDrive</strong>. Jika dikosongkan, sistem otomatis memakai Slide Player Interaktif.
          </p>
          <input type="text" id="cms-form-ppt" class="form-control" value="${cur.pptUrl || ''}" placeholder="https://docs.google.com/presentation/d/.../embed">
        </div>

        <!-- Bagian Dokumen Penjelasan Rinci (Word) -->
        <div style="background:#F0F5FF; padding:1rem; border-radius:var(--radius-md); border:1px solid #BFDBFE; margin-bottom:1.25rem;">
          <div style="font-weight:700; font-size:0.9rem; color:#185ABD; margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem;">
            <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#185ABD;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Isi Dokumen Penjelasan Rinci (Field File Word):</span>
          </div>
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-bottom:0.6rem;">
            Tulis atau salin teks materi penjelasan lengkap. Teks ini akan tampil saat siswa menekan tombol <strong>"Penjelasan Lebih Rinci"</strong>.
          </p>
          <textarea id="cms-form-word" class="form-control" rows="8">${cur.wordDetail || ''}</textarea>
          <div style="margin-top:0.65rem;">
            <label class="form-label" style="font-size:0.76rem;">Tautan Dokumen Word / Google Docs Asli (Opsional):</label>
            <input type="text" id="cms-form-wordurl" class="form-control" value="${cur.wordFileUrl || ''}" placeholder="https://docs.google.com/document/d/... (opsional)">
          </div>
        </div>

        <!-- Bagian Video YouTube -->
        <div style="background:#FFF5F5; padding:1.15rem; border-radius:var(--radius-md); border:1px solid #FECACA; margin-bottom:1.25rem;">
          <div style="font-weight:700; font-size:0.92rem; color:#DC2626; margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem;">
            <svg viewBox="0 0 24 24" style="width:17px;height:17px;stroke:#DC2626;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            <span>Tautan Video Tutorial YouTube (Terintegrasi ke Pemutar Materi):</span>
          </div>
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-bottom:0.6rem;">
            Mendukung link <strong>youtube.com/watch?v=...</strong>, <strong>youtu.be/...</strong>, <strong>YouTube Shorts</strong>, <strong>Live</strong>, maupun <strong>kode sematan &lt;iframe&gt;</strong>.
          </p>
          <div class="form-group" style="margin-bottom:0.5rem;">
            <label class="form-label" style="font-size:0.76rem;">Judul Video Tutorial (Opsional):</label>
            <input type="text" id="cms-form-yt-title" class="form-control" value="${cur.videoTitle || ''}" placeholder="Contoh: Video Tutorial Konsep Dasar & Subnetting IPv4">
          </div>
          <div class="form-group" style="margin-bottom:0.35rem;">
            <label class="form-label" style="font-size:0.76rem;">URL / Link Video YouTube:</label>
            <input type="text" id="cms-form-yt" class="form-control" value="${cur.videoUrl || ''}" oninput="App.previewCMSVideoUrl()" placeholder="Contoh: https://www.youtube.com/watch?v=M11SvDtPBhA atau https://youtu.be/...">
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center; margin-top:0.4rem; flex-wrap:wrap;">
            <label for="cms-form-video-file" class="btn btn-secondary btn-sm" style="cursor:pointer; display:inline-flex; align-items:center; gap:0.35rem; font-size:0.76rem;">
              <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Pilih Berkas Video dari Komputer (.mp4 / .webm)</span>
            </label>
            <input type="file" id="cms-form-video-file" accept="video/mp4,video/webm" style="display:none;" onchange="App.handleCMSVideoFileUpload(event)">
            <span id="cms-video-file-status" style="font-size:0.73rem; color:var(--color-text-muted);">atau tempel link YouTube di atas</span>
          </div>
          <div id="cms-yt-preview"></div>
        </div>
      </form>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" style="display:inline-flex; align-items:center; gap:0.4rem;" onclick="App.saveCMSModuleForm(${idx})">
        <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        <span>Simpan Perubahan</span>
      </button>
    `;

    openModal();
    setTimeout(() => App.previewCMSVideoUrl(), 60);
  },

  saveCMSModuleForm(idx) {
    const title = (document.getElementById('cms-form-title') ? document.getElementById('cms-form-title').value : '').trim();
    if (!title) {
      alert('Judul modul materi wajib diisi.');
      return;
    }

    const tpCode = document.getElementById('cms-form-tp') ? document.getElementById('cms-form-tp').value : 'TP1';
    const subtitle = document.getElementById('cms-form-sub') ? document.getElementById('cms-form-sub').value.trim() : '';
    const pptUrl = document.getElementById('cms-form-ppt') ? document.getElementById('cms-form-ppt').value.trim() : '';
    const wordDetail = document.getElementById('cms-form-word') ? document.getElementById('cms-form-word').value.trim() : '';
    const wordFileUrl = document.getElementById('cms-form-wordurl') ? document.getElementById('cms-form-wordurl').value.trim() : '';
    const wordFileName = document.getElementById('cms-form-filename') ? document.getElementById('cms-form-filename').value.trim() : '';
    const videoUrl = document.getElementById('cms-form-yt') ? document.getElementById('cms-form-yt').value.trim() : '';
    const videoTitle = document.getElementById('cms-form-yt-title') ? document.getElementById('cms-form-yt-title').value.trim() : '';

    const modules = NetLearnStore.getModules();
    const existing = (idx >= 0 && modules[idx]) ? modules[idx] : {};

    const modData = {
      ...existing,
      id: existing.id || Date.now(),
      title,
      tpCode,
      subtitle,
      pptUrl,
      wordDetail,
      wordFileUrl,
      wordFileName: wordFileName || `Modul_${title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`,
      videoUrl,
      videoTitle: videoTitle || existing.videoTitle || `Tutorial: ${title}`,
      pptSlides: existing.pptSlides || [
        {
          title: title,
          subtitle: subtitle || 'Materi Pembelajaran SMK Negeri 3 Makassar',
          bullets: [
            'Simak uraian materi lengkap dengan menekan tombol Penjelasan Lebih Rinci di bawah.',
            'Tonton video tutorial YouTube terlampir untuk visualisasi konsep jaringan.',
            'Uji pemahaman Anda melalui kuis latihan dan simulator topologi.'
          ],
          highlight: '💡 Materi ini dirancang khusus oleh Guru Pengampu untuk siswa kelas XI TKJ.'
        }
      ]
    };

    NetLearnStore.saveModule(modData, idx);
    closeModal();

    // SINKRONISASI INDEKS MATERI: Otomatis set activeMateriIndex ke modul yang baru dibuat/disunting
    const targetIdx = (idx >= 0) ? idx : (NetLearnStore.getModules().length - 1);
    NetLearnStore.state.activeMateriIndex = targetIdx;
    NetLearnStore.state.activeSlideIndex = 0;
    if (videoUrl) {
      this.materiViewMode = 'video';
    }
    NetLearnStore.save();

    this.renderGuruCMSMateri();
    this.renderBeranda();
    this.renderMateri();

    showToast(`Modul "${title}" berhasil disimpan dan langsung disinkronkan ke Layar Materi!`, 'success');
  },

  deleteCMSModule(idx) {
    const modules = NetLearnStore.getModules();
    const cur = modules[idx];
    if (!cur) return;

    if (confirm(`Hapus modul "${cur.title}" dari daftar materi?`)) {
      NetLearnStore.deleteModule(idx);
      this.renderGuruCMSMateri();
      this.renderBeranda();
      showToast('Modul berhasil dihapus dari CMS.', 'info');
    }
  },

  loadSampleMateriFromCMS() {
    if (confirm('Muat contoh materi lengkap pengalamatan jaringan (dengan Slide PPT, Penjelasan Word, dan Video YouTube)?')) {
      NetLearnStore.loadSampleModules();
      this.renderGuruCMSMateri();
      this.renderBeranda();
      if (NetLearnStore.state.activeScreen === 'materi') {
        this.renderMateri();
      }
      showToast('Contoh materi berhasil dimuat ke sistem!', 'success');
    }
  },

  clearAllMateriFromCMS() {
    if (confirm('Kosongkan semua modul materi? Layar siswa akan kembali dalam keadaan bersih/kosong.')) {
      NetLearnStore.clearModules();
      this.renderGuruCMSMateri();
      this.renderBeranda();
      if (NetLearnStore.state.activeScreen === 'materi') {
        this.renderMateri();
      }
      showToast('Semua materi berhasil dikosongkan.', 'info');
    }
  },

  // =========================================================================
  // Screen 4: Simulasi (Subnet Calculator + Topology Simulator)
  // =========================================================================
  renderSimulasi() {
    // Initialize Topology Canvas if not already done
    TopologySim.init('topology-sim-mount');
    // Run default calculation
    this.processSubnetCalculation();
  },

  switchSimulasiMode(mode) {
    const btnCalc = document.getElementById('sim-mode-calc-btn');
    const btnTopo = document.getElementById('sim-mode-topo-btn');
    const viewCalc = document.getElementById('sim-view-calc');
    const viewTopo = document.getElementById('sim-view-topo');

    if (mode === 'calc') {
      btnCalc.classList.add('active');
      btnTopo.classList.remove('active');
      viewCalc.style.display = 'block';
      viewTopo.style.display = 'none';
    } else {
      btnTopo.classList.add('active');
      btnCalc.classList.remove('active');
      viewTopo.style.display = 'block';
      viewCalc.style.display = 'none';
      TopologySim.render();
      TopologySim.renderScenarioGuide();
      TopologySim.updateStudentProgress();
    }
  },

  handlePrefixSelectChange(val) {
    const slider = document.getElementById('calc-prefix-slider');
    const badge = document.getElementById('slider-prefix-val');
    if (slider) slider.value = val;
    if (badge) badge.textContent = `/${val}`;
    this.processSubnetCalculation();
  },

  handlePrefixSliderInput(val) {
    const select = document.getElementById('calc-prefix-select');
    const badge = document.getElementById('slider-prefix-val');
    if (badge) badge.textContent = `/${val}`;
    if (select) {
      // Find matching option or set value
      let found = false;
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === String(val)) {
          select.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        // If not in standard dropdown list, set value directly
        select.value = val;
      }
    }
    this.processSubnetCalculation();
  },

  applySubnetPreset(ip, prefix) {
    const ipInput = document.getElementById('calc-ip-input');
    const select = document.getElementById('calc-prefix-select');
    const slider = document.getElementById('calc-prefix-slider');
    const badge = document.getElementById('slider-prefix-val');

    if (ipInput) ipInput.value = ip;
    if (select) select.value = prefix;
    if (slider) slider.value = prefix;
    if (badge) badge.textContent = `/${prefix}`;

    // Highlight active preset button
    document.querySelectorAll('.preset-btn').forEach(btn => {
      if (btn.textContent.includes(`/${prefix}`)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.processSubnetCalculation();
    showToast(`Studi kasus diterapkan: IP ${ip}/${prefix}`, 'info');
  },

  toggleBitwisePanel() {
    const body = document.getElementById('bitwise-body');
    const icon = document.getElementById('bitwise-toggle-icon');
    if (!body) return;
    if (body.style.display === 'none') {
      body.style.display = 'block';
      if (icon) icon.textContent = '▲ Sembunyikan';
    } else {
      body.style.display = 'none';
      if (icon) icon.textContent = '▼ Pelajari Detail';
    }
  },

  processSubnetCalculation() {
    const ipInput = document.getElementById('calc-ip-input') ? document.getElementById('calc-ip-input').value : '192.168.10.15';
    const prefixInput = document.getElementById('calc-prefix-select') ? document.getElementById('calc-prefix-select').value : '26';

    const result = SubnetEngine.calculate(ipInput, prefixInput);
    const container = document.getElementById('calc-results-mount');
    if (!container) return;

    if (!result.success) {
      container.innerHTML = `
        <div class="callout callout-important" style="animation: fadeIn 0.3s ease;">
          <strong>Perhitungan Gagal:</strong> ${result.error}
        </div>
      `;
      return;
    }

    // Sync slider badge if exists
    const badge = document.getElementById('slider-prefix-val');
    if (badge) badge.textContent = `/${result.prefix}`;

    // 1. Render 32-bit visualization strip with 3 roles (Network, Borrowed, Host)
    const octetOcts = result.inputIp.split('.').map(Number);
    let octetsHeaderHtml = `
      <div class="bit-octets-header">
        <div class="octet-title-pill"><span>Oktet 1</span><span class="val">${octetOcts[0] || 0}</span></div>
        <div class="octet-title-pill"><span>Oktet 2</span><span class="val">${octetOcts[1] || 0}</span></div>
        <div class="octet-title-pill"><span>Oktet 3</span><span class="val">${octetOcts[2] || 0}</span></div>
        <div class="octet-title-pill"><span>Oktet 4</span><span class="val">${octetOcts[3] || 0}</span></div>
      </div>
    `;

    let bitStripHtml = '';
    for (let i = 0; i < 32; i++) {
      if (i > 0 && i % 8 === 0) {
        bitStripHtml += `<div class="bit-cell octet-separator">.</div>`;
      }
      let bitClass = 'host-bit';
      let bitChar = '0';
      let bitRole = 'Host Bit (Alamat Komputer)';

      if (i < result.defaultClassPrefix) {
        bitClass = 'network-bit';
        bitChar = '1';
        bitRole = 'Network Bit (Porsi Induk Kelas)';
      } else if (i < result.prefix) {
        bitClass = 'borrowed-bit';
        bitChar = '1';
        bitRole = 'Borrowed Bit (Bit Pinjaman Subnetting)';
      }

      bitStripHtml += `
        <div class="bit-cell ${bitClass}" title="Bit #${i + 1}: ${bitRole}">
          ${bitChar}
        </div>
      `;
    }

    // Determine IP Status on Ruler
    let ipStatusBadge = `<span class="badge badge-success">Host Valid</span>`;
    let ipStatusDesc = `Alamat IP ini sah dipasang pada komputer, laptop, router, atau server.`;
    if (result.isNetworkAddress) {
      ipStatusBadge = `<span class="badge badge-danger">Network ID</span>`;
      ipStatusDesc = `Ini adalah Identitas Jaringan! Komputer/host dilarang menggunakan IP ini.`;
    } else if (result.isBroadcastAddress) {
      ipStatusBadge = `<span class="badge badge-warning">Broadcast ID</span>`;
      ipStatusDesc = `Ini adalah Alamat Siaran Massal! Komputer/host dilarang menggunakan IP ini.`;
    }

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
        <div>
          <h3 style="font-size:1.25rem; font-weight:700; color:var(--color-primary); display:flex; align-items:center; gap:0.5rem;">
            <svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--color-accent);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span>${result.networkAddress}/${result.prefix}</span>
          </h3>
          <span style="font-size:0.8rem; color:var(--color-text-muted);">
            Kelas ${result.ipClass} • ${result.ipScope} • Blok Interval: <strong>${result.blockInterval}</strong>
          </span>
        </div>
        ${ipStatusBadge}
      </div>

      <!-- 1. PHYSICAL SUBNET ADDRESS RULER -->
      <div class="subnet-ruler-container">
        <div class="subnet-ruler-header">
          <div class="subnet-ruler-title">
            <span>📏</span> Visualisasi Garis Alamat Subnet (Subnet Address Ruler)
          </div>
          <span style="font-size:0.75rem; color:#94A3B8;">Kapasitas: ${result.totalHosts} Alamat IP</span>
        </div>

        <div class="subnet-ruler-track">
          <!-- Network ID Segment -->
          <div class="ruler-segment ruler-seg-network" title="Network Address: ${result.networkAddress}">
            <span>Net ID</span>
            <span style="font-size:0.65rem; opacity:0.8;">.${result.networkAddress.split('.').pop()}</span>
          </div>

          <!-- Usable Hosts Segment -->
          <div class="ruler-segment ruler-seg-usable" title="Usable Range: ${result.firstUsableHost} - ${result.lastUsableHost}">
            <span>🟢 ${result.usableHosts.toLocaleString()} Alamat Host Valid (Komputer / Router)</span>
            <span style="font-size:0.68rem; opacity:0.85;">.${result.firstUsableHost.split('.').pop()} s/d .${result.lastUsableHost.split('.').pop()}</span>
          </div>

          <!-- Broadcast Segment -->
          <div class="ruler-segment ruler-seg-broadcast" title="Broadcast Address: ${result.broadcastAddress}">
            <span>Bcast</span>
            <span style="font-size:0.65rem; opacity:0.8;">.${result.broadcastAddress.split('.').pop()}</span>
          </div>

          <!-- Pulsing Student IP Marker -->
          <div class="ruler-marker" style="left: ${result.inputIpPercent}%;">
            <div class="marker-tag">
              📍 ${result.inputIp} (${result.inputIpPercent}%)
            </div>
            <div class="marker-arrow"></div>
            <div class="marker-dot"></div>
          </div>
        </div>

        <div class="subnet-ruler-footer">
          <div class="ruler-legend-card">
            <div class="ruler-legend-label" style="color:#FCA5A5;">
              <span>🔴</span> Network Address
            </div>
            <div class="ruler-legend-val">${result.networkAddress}</div>
            <div style="font-size:0.68rem; color:#94A3B8; margin-top:2px;">Identitas segmen, bukan untuk host.</div>
          </div>
          <div class="ruler-legend-card">
            <div class="ruler-legend-label" style="color:#6EE7B7;">
              <span>🟢</span> Rentang Host Sah
            </div>
            <div class="ruler-legend-val">${result.firstUsableHost} - ${result.lastUsableHost}</div>
            <div style="font-size:0.68rem; color:#94A3B8; margin-top:2px;">Aman dipakai untuk PC siswa & server.</div>
          </div>
          <div class="ruler-legend-card">
            <div class="ruler-legend-label" style="color:#FCD34D;">
              <span>🟠</span> Broadcast Address
            </div>
            <div class="ruler-legend-val">${result.broadcastAddress}</div>
            <div style="font-size:0.68rem; color:#94A3B8; margin-top:2px;">Alamat siaran untuk kirim ke semua PC.</div>
          </div>
        </div>
      </div>

      <!-- 2. 32-BIT ANATOMY WITH 4 OCTETS -->
      <div class="bit-bar-container">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-size:0.82rem; font-weight:700; color:#F8FAFC;">
            🧬 Pembagian 32 Bit Biner Subnet Mask (Prefix /${result.prefix})
          </span>
          <span style="font-size:0.75rem; color:#38BDF8; font-family:var(--font-mono);">
            ${result.netmask}
          </span>
        </div>

        ${octetsHeaderHtml}
        <div class="bit-strip">${bitStripHtml}</div>

        <div class="bit-legend-bar">
          <div class="bit-legend-item">
            <div class="bit-legend-color" style="background:#4F6EF7;"></div>
            <span><strong>Bit Jaringan:</strong> ${result.defaultClassPrefix} bit</span>
          </div>
          <div class="bit-legend-item">
            <div class="bit-legend-color" style="background:#8B5CF6;"></div>
            <span><strong>Bit Pinjaman Subnet:</strong> ${result.borrowedBits} bit (Membelah jadi ${Math.pow(2, result.borrowedBits)} Subnet)</span>
          </div>
          <div class="bit-legend-item">
            <div class="bit-legend-color" style="background:#334155;"></div>
            <span><strong>Bit Host:</strong> ${result.hostBits} bit (Kapasitas: ${result.usableHosts} Host)</span>
          </div>
        </div>
      </div>

      <!-- 3. METRICS GRID -->
      <div class="grid-two-equal" style="margin-bottom:1.5rem;">
        <div class="calc-card-metric">
          <span class="metric-label">Network Address (ID Segmen)</span>
          <span class="metric-val" style="color:#4F6EF7;">${result.networkAddress}</span>
          <span class="metric-bin">${result.networkBinary.join('.')}</span>
        </div>
        <div class="calc-card-metric">
          <span class="metric-label">Broadcast Address (Broadcast)</span>
          <span class="metric-val" style="color:#D97706;">${result.broadcastAddress}</span>
          <span class="metric-bin">${result.broadcastBinary.join('.')}</span>
        </div>
        <div class="calc-card-metric">
          <span class="metric-label">Subnet Mask (Desimal Bertitik)</span>
          <span class="metric-val">${result.netmask}</span>
          <span class="metric-bin">${result.maskBinary.join('.')}</span>
        </div>
        <div class="calc-card-metric">
          <span class="metric-label">Wildcard Mask</span>
          <span class="metric-val">${result.wildcard}</span>
          <span class="metric-bin">Inverse Mask (Digunakan di ACL & OSPF)</span>
        </div>
        <div class="calc-card-metric">
          <span class="metric-label">Rentang Host Valid Digunakan</span>
          <span class="metric-val" style="color:#16A34A; font-size:1rem;">
            ${result.firstUsableHost} s/d ${result.lastUsableHost}
          </span>
          <span class="metric-bin">Rentang alamat untuk PC, Server, Gateway</span>
        </div>
        <div class="calc-card-metric">
          <span class="metric-label">Kapasitas Host</span>
          <span class="metric-val">${result.usableHosts.toLocaleString()} Host Valid</span>
          <span class="metric-bin">Total IP: ${result.totalHosts.toLocaleString()} (Rumus: 2^${result.hostBits} - 2)</span>
        </div>
      </div>

      <!-- 4. STEP-BY-STEP BITWISE AND EXPLORER -->
      <div class="bitwise-panel">
        <div class="bitwise-header" onclick="App.toggleBitwisePanel()">
          <div class="bitwise-title">
            <span>🔬</span> Bedah Logika Bitwise AND (Bagaimana Router Menemukan Network ID?)
          </div>
          <span id="bitwise-toggle-icon" style="font-size:0.75rem; color:#4F6EF7; font-weight:700;">
            ▲ Sembunyikan
          </span>
        </div>

        <div id="bitwise-body" class="bitwise-body">
          <table class="bitwise-table">
            <tbody>
              <tr>
                <td class="bitwise-label">IP Masukan Siswa:</td>
                <td class="bitwise-binary">${result.ipBinary.join(' . ')}</td>
                <td class="bitwise-decimal">${result.inputIp}</td>
              </tr>
              <tr>
                <td class="bitwise-label">Subnet Mask (/${result.prefix}):</td>
                <td class="bitwise-binary" style="color:#4F6EF7;">${result.maskBinary.join(' . ')}</td>
                <td class="bitwise-decimal">${result.netmask}</td>
              </tr>
              <tr class="bitwise-divider">
                <td class="bitwise-label" style="color:#16A34A;">Hasil Logika (AND):</td>
                <td class="bitwise-binary" style="color:#16A34A; font-weight:700;">${result.networkBinary.join(' . ')}</td>
                <td class="bitwise-decimal" style="color:#16A34A;">${result.networkAddress}</td>
              </tr>
            </tbody>
          </table>
          <div class="callout callout-info" style="margin-top:0.75rem; font-size:0.75rem; margin-bottom:0;">
            <strong>Catatan Edukatif SMK:</strong> Logika <code>AND</code> hanya menghasilkan <code>1</code> jika kedua bit bernilai <code>1</code> (1 AND 1 = 1, selain itu = 0). Operasi ini mengunci bit network dan menghapus seluruh bit host menjadi 0, sehingga menghasilkan <strong>Network ID</strong> murni!
          </div>
        </div>
      </div>

      <!-- 5. SUBNET BLOCK TABLE -->
      <div style="margin-top: 1.5rem;">
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center;">
          <span>📋 Daftar Blok Subnet yang Terbentuk (${result.totalSubnetsInBlock} Total Blok):</span>
          <span style="font-size:0.75rem; color:var(--color-text-muted); font-weight:normal;">Lompatan Blok: +${result.blockInterval}</span>
        </h4>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Subnet</th>
                <th>Network ID</th>
                <th>Rentang Host Valid</th>
                <th>Broadcast ID</th>
              </tr>
            </thead>
            <tbody>
              ${result.subnetsList.map(s => `
                <tr style="${s.isCurrent ? 'background:#EEF1FE; font-weight:600;' : ''}">
                  <td>Subnet #${s.index} ${s.isCurrent ? '<span class="badge badge-blue">Input Anda</span>' : ''}</td>
                  <td><code>${s.network}</code></td>
                  <td>${s.firstHost} – ${s.lastHost}</td>
                  <td><code>${s.broadcast}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // VLSM Modal Planner
  openVLSMModal() {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.textContent = 'Kalkulator Perencanaan VLSM Dinamis';
    modalBody.innerHTML = `
      <div class="form-group">
        <label class="form-label">Major Network (Blok IP Induk):</label>
        <input type="text" id="vlsm-major-input" class="form-control" value="192.168.10.0/24">
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
        <label class="form-label" style="margin:0;">Kebutuhan Segmen / Ruangan:</label>
        <button class="btn btn-secondary btn-sm" onclick="App.addVLSMSegmentRow()">+ Tambah Segmen</button>
      </div>
      <div id="vlsm-segments-list" style="display:flex; flex-direction:column; gap:0.5rem; max-height:240px; overflow-y:auto;">
        <div class="grid-two-equal" style="gap:0.5rem;">
          <input type="text" class="form-control vlsm-seg-name" value="Lab Komputer TKJ">
          <input type="number" class="form-control vlsm-seg-hosts" value="60" placeholder="Jml Host">
        </div>
        <div class="grid-two-equal" style="gap:0.5rem;">
          <input type="text" class="form-control vlsm-seg-name" value="Lab Multimedia">
          <input type="number" class="form-control vlsm-seg-hosts" value="28" placeholder="Jml Host">
        </div>
        <div class="grid-two-equal" style="gap:0.5rem;">
          <input type="text" class="form-control vlsm-seg-name" value="Ruang Guru & TU">
          <input type="number" class="form-control vlsm-seg-hosts" value="12" placeholder="Jml Host">
        </div>
        <div class="grid-two-equal" style="gap:0.5rem;">
          <input type="text" class="form-control vlsm-seg-name" value="Link Antar Router WAN">
          <input type="number" class="form-control vlsm-seg-hosts" value="2" placeholder="Jml Host">
        </div>
      </div>
      <div id="vlsm-results-area" style="margin-top:1.25rem;"></div>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
      <button class="btn btn-primary" onclick="App.runVLSMCalc()">Hitung Alokasi VLSM</button>
    `;

    openModal();
  },

  addVLSMSegmentRow() {
    const list = document.getElementById('vlsm-segments-list');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'grid-two-equal';
    row.style.gap = '0.5rem';
    row.innerHTML = `
      <input type="text" class="form-control vlsm-seg-name" placeholder="Nama Segmen (contoh: Ruang Server)">
      <input type="number" class="form-control vlsm-seg-hosts" placeholder="Kebutuhan Host">
    `;
    list.appendChild(row);
  },

  runVLSMCalc() {
    const major = document.getElementById('vlsm-major-input').value;
    const names = document.querySelectorAll('.vlsm-seg-name');
    const hosts = document.querySelectorAll('.vlsm-seg-hosts');

    const segments = [];
    for (let i = 0; i < names.length; i++) {
      const n = names[i].value.trim();
      const h = parseInt(hosts[i].value, 10);
      if (n && !isNaN(h) && h > 0) {
        segments.push({ name: n, hosts: h });
      }
    }

    if (segments.length === 0) {
      alert('Masukkan minimal 1 segmen dengan jumlah host valid.');
      return;
    }

    const res = SubnetEngine.calculateVLSM(major, segments);
    const resultsArea = document.getElementById('vlsm-results-area');

    if (!res.success) {
      resultsArea.innerHTML = `
        <div class="callout callout-important">
          <strong>Perhitungan VLSM Gagal:</strong> ${res.error}
        </div>
      `;
      return;
    }

    resultsArea.innerHTML = `
      <div class="callout callout-success" style="margin-bottom:1rem;">
        ✅ Alokasi VLSM Berhasil! Sisa IP bebas yang belum terpakai: <strong>${res.remainingIps} IP</strong> (Mulai dari ${res.nextFreeIp}).
      </div>
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Segmen</th>
              <th>Butuh</th>
              <th>Prefix & Mask</th>
              <th>Network ID</th>
              <th>Usable Host</th>
              <th>Broadcast</th>
            </tr>
          </thead>
          <tbody>
            ${res.subnets.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.neededHosts}</td>
                <td><code>${s.prefix}</code> (${s.subnetMask})</td>
                <td><code>${s.networkAddress}</code></td>
                <td>${s.usableRange}</td>
                <td><code>${s.broadcastAddress}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // =========================================================================
  // Screen 7: Hasil Belajar & Tindak Lanjut Terpadu
  // Menghubungkan secara dinamis: Materi, Simulasi, Latihan Soal, Evaluasi, & Refleksi
  // =========================================================================
  renderHasil() {
    const student = NetLearnStore.state.currentUser || { name: 'Peserta Didik', nis: '-', kelas: 'XI TKJ 1' };
    const materi = NetLearnStore.getMateriAnalytics();
    const latihan = NetLearnStore.getLatihanAnalytics();
    const evaluasi = NetLearnStore.getEvaluasiAnalytics();
    const simulasi = NetLearnStore.getSimulasiAnalytics();
    const refleksi = NetLearnStore.getRefleksiAnalytics();
    const tpMastery = NetLearnStore.getTPMastery();
    const overall = NetLearnStore.getOverallUnderstanding();

    // 1. Render Banner Profil Siswa
    const studentBanner = document.getElementById('hasil-student-banner');
    if (studentBanner) {
      let statusBadgeHtml = '';
      if (!evaluasi.isCompleted) {
        statusBadgeHtml = '<span class="badge badge-warning" style="font-size:0.85rem; padding:0.4rem 0.85rem;">⏳ Sedang Proses Belajar</span>';
      } else if (evaluasi.isPass) {
        statusBadgeHtml = '<span class="badge badge-success" style="font-size:0.85rem; padding:0.4rem 0.85rem;">🏆 LULUS & TUNTAS KKM</span>';
      } else {
        statusBadgeHtml = '<span class="badge badge-danger" style="font-size:0.85rem; padding:0.4rem 0.85rem;">⚠️ REMEDIAL (Di Bawah KKM 75)</span>';
      }

      studentBanner.innerHTML = `
        <div style="display:flex; align-items:center; gap:1.15rem;">
          <div style="width:52px; height:52px; border-radius:var(--radius-full); background:var(--color-accent); color:#FFF; font-weight:800; font-size:1.4rem; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(79,110,247,0.35);">
            ${student.name ? student.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <h2 style="font-size:1.35rem; font-weight:800; color:#FFFFFF; margin-bottom:0.25rem;">
              ${student.name}
            </h2>
            <div style="font-size:0.84rem; color:#94A3B8; display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
              <span>NIS: <strong style="color:#CBD5E1;">${student.nis}</strong></span>
              <span>•</span>
              <span>Kelas: <strong style="color:#CBD5E1;">${student.kelas || 'XI TKJ 1'}</strong></span>
              <span>•</span>
              <span>SMK Negeri 3 Makassar</span>
            </div>
          </div>
        </div>
        <div style="text-align:right;">
          ${statusBadgeHtml}
          <div style="font-size:0.75rem; color:#94A3B8; margin-top:0.4rem;">
            Status Pembelajaran Semester
          </div>
        </div>
      `;
    }

    // 2. Render 4 Kartu Metrik Utama
    const metricsGrid = document.getElementById('hasil-metrics-grid');
    if (metricsGrid) {
      metricsGrid.innerHTML = `
        <!-- Metrik 1: Modul Materi -->
        <div class="card" style="padding: 1.25rem;">
          <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted);">
            Progres Modul Materi
          </span>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--color-primary); margin-top: 0.2rem;">
            ${materi.total > 0 ? `${materi.completed}/${materi.total} Modul` : '0 Modul'}
          </div>
          <span style="font-size: 0.75rem; color: ${materi.percent === 100 ? 'var(--color-success)' : 'var(--color-interactive)'}; font-weight: 600;">
            ${materi.total > 0 ? `${materi.percent}% Modul Telah Dipelajari` : 'Belum Ada Modul Diunggah'}
          </span>
        </div>

        <!-- Metrik 2: Nilai Evaluasi Akhir -->
        <div class="card" style="padding: 1.25rem;">
          <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted);">
            Nilai Evaluasi Akhir (KKM 75)
          </span>
          <div id="hasil-score-val" style="font-size: 1.85rem; font-weight: 800; color: ${evaluasi.isCompleted ? (evaluasi.isPass ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-text-muted)'}; margin-top: 0.2rem;">
            ${evaluasi.isCompleted && evaluasi.score !== null ? evaluasi.score : '-'}
          </div>
          <span style="font-size: 0.75rem; color: var(--color-text-muted);">
            ${evaluasi.isCompleted ? (evaluasi.isPass ? '✅ Tuntas Memenuhi Syarat KKM' : '❌ Di Bawah KKM (Butuh Remedial)') : 'Belum Mengikuti Ujian'}
          </span>
        </div>

        <!-- Metrik 3: Skor Latihan Soal -->
        <div class="card" style="padding: 1.25rem;">
          <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted);">
            Skor Latihan Soal
          </span>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--color-interactive); margin-top: 0.2rem;">
            ${latihan.score}
          </div>
          <span style="font-size: 0.75rem; color: var(--color-text-muted);">
            ${latihan.answered}/10 Soal (${latihan.correct} Jawaban Benar)
          </span>
        </div>

        <!-- Metrik 4: Tingkat Pemahaman Terpadu -->
        <div class="card" style="padding: 1.25rem;">
          <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted);">
            Tingkat Pemahaman Terpadu
          </span>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--color-accent); margin-top: 0.2rem;">
            ${overall.percent}%
          </div>
          <div style="margin-top:0.35rem;">
            <span class="badge ${overall.badgeClass}" style="font-size:0.75rem;">
              ${overall.category}
            </span>
          </div>
        </div>
      `;
    }

    // 3. Render Adaptive Recommendation Banner
    const adaptMount = document.getElementById('hasil-adaptive-mount');
    if (adaptMount) {
      if (evaluasi.isCompleted && evaluasi.isPass) {
        adaptMount.innerHTML = `
          <div class="card" style="border-left: 6px solid var(--color-success); padding: 1.6rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1.25rem;">
              <div style="max-width: 720px;">
                <span class="badge badge-success" style="margin-bottom:0.6rem;">JALUR PENGAYAAN & SERTIFIKASI AKTIF</span>
                <h3 style="font-size:1.3rem; font-weight:800; color:var(--color-primary); margin-bottom:0.4rem;">
                  Selamat, ${student.name}! Anda Dinyatakan LULUS Kompetensi Pengalamatan Jaringan
                </h3>
                <p style="color:var(--color-text-muted); font-size:0.9rem; line-height:1.6;">
                  Perolehan nilai evaluasi Anda (<strong>${evaluasi.score}/100</strong>) telah melampaui KKM 75. Seluruh indikator pemahaman dasar IPv4, kalkulasi Subnetting CIDR, dan perancangan VLSM telah tercapai. Anda berhak mengunduh Sertifikat Resmi dan melanjutkan ke modul pengayaan mandiri.
                </p>
                <div style="display:flex; gap:0.75rem; margin-top:1.15rem; flex-wrap:wrap;">
                  <button class="btn btn-success" onclick="QuizEngine.openCertificateModal()">
                    🎓 Tampilkan & Cetak Sertifikat Kelulusan
                  </button>
                  <button class="btn btn-outline-primary" onclick="App.navigateTo('simulasi')">
                    🧪 Coba Studi Kasus VLSM Lanjutan di Lab
                  </button>
                </div>
              </div>
              <div style="text-align:center; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:var(--radius-lg); padding:1.25rem; min-width:160px;">
                <span style="font-size:2.4rem;">🏆</span>
                <div style="font-weight:800; color:#15803D; font-size:1.25rem; margin-top:0.25rem;">NILAI: ${evaluasi.score}</div>
                <span style="font-size:0.75rem; color:#166534; font-weight:600;">Status: TUNTAS KKM</span>
              </div>
            </div>
          </div>
        `;
      } else if (evaluasi.isCompleted && !evaluasi.isPass) {
        adaptMount.innerHTML = `
          <div class="card" style="border-left: 6px solid var(--color-danger); padding: 1.6rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1.25rem;">
              <div style="max-width: 720px;">
                <span class="badge badge-danger" style="margin-bottom:0.6rem;">JALUR REMEDIAL & BIMBINGAN AKTIF</span>
                <h3 style="font-size:1.3rem; font-weight:800; color:var(--color-primary); margin-bottom:0.4rem;">
                  Program Bimbingan Remedial Subnetting & CIDR
                </h3>
                <p style="color:var(--color-text-muted); font-size:0.9rem; line-height:1.6;">
                  Nilai evaluasi Anda (<strong>${evaluasi.score}/100</strong>) masih berada di bawah KKM 75. Sistem merekomendasikan Anda untuk mengulang membaca modul materi, menguji kembali kalkulasi pada simulator laboratorium, dan mengerjakan ulang latihan soal sebelum menempuh ujian remedial.
                </p>
                <div style="display:flex; gap:0.75rem; margin-top:1.15rem; flex-wrap:wrap;">
                  <button class="btn btn-primary" onclick="App.navigateTo('materi')">
                    📖 Review Modul Pembelajaran
                  </button>
                  <button class="btn btn-secondary" onclick="QuizEngine.resetLatihan(); App.navigateTo('latihan');">
                    ✏️ Ulangi Latihan Soal
                  </button>
                  <button class="btn btn-outline-danger" onclick="QuizEngine.resetEvaluasi()">
                    🔄 Ulangi Ujian Evaluasi (Remedial)
                  </button>
                </div>
              </div>
              <div style="text-align:center; background:#FEF2F2; border:1px solid #FECACA; border-radius:var(--radius-lg); padding:1.25rem; min-width:160px;">
                <span style="font-size:2.4rem;">⚠️</span>
                <div style="font-weight:800; color:#B91C1C; font-size:1.25rem; margin-top:0.25rem;">NILAI: ${evaluasi.score}</div>
                <span style="font-size:0.75rem; color:#991B1B; font-weight:600;">Status: Remedial</span>
              </div>
            </div>
          </div>
        `;
      } else {
        adaptMount.innerHTML = `
          <div class="card" style="border-left: 6px solid var(--color-interactive); padding: 1.6rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1.25rem;">
              <div style="max-width: 720px;">
                <span class="badge badge-blue" style="margin-bottom:0.6rem;">PANDUAN ALUR PEMBELAJARAN</span>
                <h3 style="font-size:1.3rem; font-weight:800; color:var(--color-primary); margin-bottom:0.4rem;">
                  Lengkapi Rangkaian Belajar Sebelum Menempuh Evaluasi Akhir
                </h3>
                <p style="color:var(--color-text-muted); font-size:0.9rem; line-height:1.6;">
                  Anda belum menyelesaikan Ujian Evaluasi Akhir. Untuk mencapai hasil belajar yang optimal, ikuti tahapan pembelajaran: <strong>1. Baca Modul Materi</strong> → <strong>2. Praktik Simulasi Topologi</strong> → <strong>3. Kerjakan Latihan 10 Soal</strong> → <strong>4. Ujian Evaluasi Akhir</strong>.
                </p>
                <div style="display:flex; gap:0.75rem; margin-top:1.15rem; flex-wrap:wrap;">
                  <button class="btn btn-primary" onclick="App.navigateTo('materi')">
                    📖 Buka Modul Materi
                  </button>
                  <button class="btn btn-secondary" onclick="App.navigateTo('latihan')">
                    ✏️ Latihan Soal (${latihan.answered}/10)
                  </button>
                  <button class="btn btn-success" onclick="App.navigateTo('evaluasi')">
                    🚀 Mulai Ujian Evaluasi Sekarang
                  </button>
                </div>
              </div>
              <div style="text-align:center; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:var(--radius-lg); padding:1.25rem; min-width:160px;">
                <span style="font-size:2.4rem;">📝</span>
                <div style="font-weight:800; color:var(--color-interactive); font-size:1.15rem; margin-top:0.25rem;">SIAP UJIAN?</div>
                <span style="font-size:0.75rem; color:#1E40AF; font-weight:600;">KKM: 75 Poin</span>
              </div>
            </div>
          </div>
        `;
      }
    }

    // 4. Render Keterhubungan 5 Komponen Belajar
    const compGrid = document.getElementById('hasil-components-grid');
    if (compGrid) {
      compGrid.innerHTML = `
        <!-- Komponen 1: Materi -->
        <div class="comp-box-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span style="font-size:1.4rem;">📖</span>
              <span class="badge ${materi.percent === 100 ? 'badge-success' : (materi.percent > 0 ? 'badge-blue' : 'badge-secondary')}" style="font-size:0.7rem;">
                ${materi.percent === 100 ? 'Tuntas' : `${materi.percent}%`}
              </span>
            </div>
            <strong style="font-size:0.9rem; color:var(--color-primary); display:block;">1. Materi Ajar</strong>
            <div style="font-size:0.78rem; color:var(--color-text-muted); margin-top:0.25rem;">
              ${materi.total > 0 ? `${materi.completed}/${materi.total} Modul Selesai` : '0 Modul Tersedia'}
            </div>
          </div>
          <div style="margin-top:0.85rem;">
            <div class="progress-bar-track" style="height:6px; margin-bottom:0.75rem;">
              <div class="progress-bar-fill ${materi.percent === 100 ? 'success' : ''}" style="width:${materi.percent}%;"></div>
            </div>
            <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; font-size:0.75rem;" onclick="App.navigateTo('materi')">
              Buka Modul →
            </button>
          </div>
        </div>

        <!-- Komponen 2: Simulasi -->
        <div class="comp-box-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span style="font-size:1.4rem;">🧪</span>
              <span class="badge ${simulasi.questsDone >= 2 ? 'badge-success' : 'badge-blue'}" style="font-size:0.7rem;">
                ${simulasi.questsDone}/3 Misi
              </span>
            </div>
            <strong style="font-size:0.9rem; color:var(--color-primary); display:block;">2. Simulasi IP</strong>
            <div style="font-size:0.78rem; color:var(--color-text-muted); margin-top:0.25rem;">
              ${simulasi.calcCount} Kalkulasi • ${simulasi.pingCount} Tes Ping
            </div>
          </div>
          <div style="margin-top:0.85rem;">
            <div class="progress-bar-track" style="height:6px; margin-bottom:0.75rem;">
              <div class="progress-bar-fill success" style="width:${Math.round((simulasi.questsDone / 3) * 100)}%;"></div>
            </div>
            <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; font-size:0.75rem;" onclick="App.navigateTo('simulasi')">
              Buka Lab →
            </button>
          </div>
        </div>

        <!-- Komponen 3: Latihan Soal -->
        <div class="comp-box-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span style="font-size:1.4rem;">✏️</span>
              <span class="badge ${latihan.answered === 10 ? 'badge-success' : 'badge-warning'}" style="font-size:0.7rem;">
                Nilai: ${latihan.score}
              </span>
            </div>
            <strong style="font-size:0.9rem; color:var(--color-primary); display:block;">3. Latihan Soal</strong>
            <div style="font-size:0.78rem; color:var(--color-text-muted); margin-top:0.25rem;">
              ${latihan.answered}/10 Soal Terjawab (${latihan.correct} Benar)
            </div>
          </div>
          <div style="margin-top:0.85rem;">
            <div class="progress-bar-track" style="height:6px; margin-bottom:0.75rem;">
              <div class="progress-bar-fill ${latihan.score >= 75 ? 'success' : ''}" style="width:${Math.round((latihan.answered / 10) * 100)}%;"></div>
            </div>
            <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; font-size:0.75rem;" onclick="App.navigateTo('latihan')">
              Buka Latihan →
            </button>
          </div>
        </div>

        <!-- Komponen 4: Evaluasi Akhir -->
        <div class="comp-box-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span style="font-size:1.4rem;">📝</span>
              <span class="badge ${evaluasi.isCompleted ? (evaluasi.isPass ? 'badge-success' : 'badge-danger') : 'badge-secondary'}" style="font-size:0.7rem;">
                ${evaluasi.isCompleted ? `Skor: ${evaluasi.score}` : 'Belum Ujian'}
              </span>
            </div>
            <strong style="font-size:0.9rem; color:var(--color-primary); display:block;">4. Evaluasi Akhir</strong>
            <div style="font-size:0.78rem; color:var(--color-text-muted); margin-top:0.25rem;">
              ${evaluasi.isCompleted ? (evaluasi.isPass ? 'Tuntas KKM 75' : 'Remedial') : 'Standar KKM: 75'}
            </div>
          </div>
          <div style="margin-top:0.85rem;">
            <div class="progress-bar-track" style="height:6px; margin-bottom:0.75rem;">
              <div class="progress-bar-fill ${evaluasi.isPass ? 'success' : (evaluasi.isCompleted ? 'danger' : '')}" style="width:${evaluasi.isCompleted ? evaluasi.score : 0}%;"></div>
            </div>
            <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; font-size:0.75rem;" onclick="App.navigateTo('evaluasi')">
              ${evaluasi.isCompleted ? 'Review Ujian →' : 'Mulai Ujian →'}
            </button>
          </div>
        </div>

        <!-- Komponen 5: Refleksi Belajar -->
        <div class="comp-box-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span style="font-size:1.4rem;">💡</span>
              <span class="badge ${refleksi.isCompleted ? 'badge-success' : 'badge-secondary'}" style="font-size:0.7rem;">
                ${refleksi.isCompleted ? `${refleksi.total} Entri` : 'Belum Isi'}
              </span>
            </div>
            <strong style="font-size:0.9rem; color:var(--color-primary); display:block;">5. Refleksi</strong>
            <div style="font-size:0.78rem; color:var(--color-text-muted); margin-top:0.25rem;">
              ${refleksi.isCompleted ? 'Evaluasi Mandiri Tersimpan' : 'Catatan Diri Belum Lengkap'}
            </div>
          </div>
          <div style="margin-top:0.85rem;">
            <div class="progress-bar-track" style="height:6px; margin-bottom:0.75rem;">
              <div class="progress-bar-fill ${refleksi.isCompleted ? 'success' : ''}" style="width:${refleksi.isCompleted ? 100 : 0}%;"></div>
            </div>
            <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; font-size:0.75rem;" onclick="App.navigateTo('refleksi')">
              Buka Refleksi →
            </button>
          </div>
        </div>
      `;
    }

    // 5. Render Capaian Kompetensi TP1, TP2, TP3
    const tpListMount = document.getElementById('hasil-tp-mastery-list');
    if (tpListMount) {
      tpListMount.innerHTML = tpMastery.map(tp => `
        <div class="progress-bar-container" style="margin-bottom: 1.15rem;">
          <div class="progress-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <div>
              <strong style="font-size:0.86rem; color:var(--color-primary);">${tp.id}: ${tp.title}</strong>
              <div style="font-size:0.73rem; color:var(--color-text-muted);">${tp.desc}</div>
            </div>
            <div style="text-align:right;">
              <span style="font-weight:800; font-size:0.95rem; color:${tp.status.color};">${tp.score}%</span>
              <div><span class="badge ${tp.status.badge}" style="font-size:0.68rem;">${tp.status.text}</span></div>
            </div>
          </div>
          <div class="progress-bar-track" style="height:8px;">
            <div class="progress-bar-fill" style="width: ${tp.score}%; background: ${tp.status.color};"></div>
          </div>
        </div>
      `).join('');
    }

    // Tombol Sertifikat Kelulusan
    const certBtn = document.getElementById('hasil-cert-btn');
    if (certBtn) {
      if (evaluasi.isCompleted && evaluasi.isPass) {
        certBtn.style.display = 'inline-flex';
        certBtn.disabled = false;
        certBtn.innerHTML = '🎓 Tampilkan Sertifikat Kelulusan';
      } else {
        certBtn.style.display = 'inline-flex';
        certBtn.disabled = true;
        certBtn.style.opacity = '0.55';
        certBtn.innerHTML = '🔒 Sertifikat (Tuntas KKM ≥75)';
      }
    }

    // 6. Render Riwayat & Log Aktivitas Belajar
    const historyTbody = document.getElementById('hasil-history-tbody');
    if (historyTbody) {
      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      historyTbody.innerHTML = `
        <tr>
          <td>
            <strong>Membaca Modul Materi Ajar</strong>
            <span style="font-size:0.73rem; color:var(--color-text-muted); display:block;">Slide PPT & Penjelasan Detail</span>
          </td>
          <td>${today}</td>
          <td>
            <span class="badge ${materi.percent === 100 ? 'badge-success' : (materi.percent > 0 ? 'badge-blue' : 'badge-secondary')}">
              ${materi.total > 0 ? `${materi.completed}/${materi.total} Selesai (${materi.percent}%)` : 'Kosong'}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('materi')">Lihat</button>
          </td>
        </tr>
        <tr>
          <td>
            <strong>Laboratorium Simulasi & Topologi</strong>
            <span style="font-size:0.73rem; color:var(--color-text-muted); display:block;">Kalkulasi Subnet & ICMP Ping</span>
          </td>
          <td>${today}</td>
          <td>
            <span class="badge ${simulasi.questsDone >= 2 ? 'badge-success' : 'badge-blue'}">
              ${simulasi.calcCount} Kalkulasi, ${simulasi.questsDone}/3 Misi
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('simulasi')">Buka</button>
          </td>
        </tr>
        <tr>
          <td>
            <strong>Pengerjaan Latihan Soal</strong>
            <span style="font-size:0.73rem; color:var(--color-text-muted); display:block;">10 Butir Soal Bertahap</span>
          </td>
          <td>${today}</td>
          <td>
            <span class="badge ${latihan.score >= 75 ? 'badge-success' : (latihan.answered > 0 ? 'badge-warning' : 'badge-secondary')}">
              Skor ${latihan.score}/100 (${latihan.answered}/10)
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('latihan')">Buka</button>
          </td>
        </tr>
        <tr>
          <td>
            <strong>Ujian Evaluasi Akhir Semester</strong>
            <span style="font-size:0.73rem; color:var(--color-text-muted); display:block;">15 PG + 5 Uraian Analisis</span>
          </td>
          <td>${evaluasi.submittedAt || '-'}</td>
          <td>
            ${evaluasi.isCompleted ? `
              <span class="badge ${evaluasi.isPass ? 'badge-success' : 'badge-danger'}">
                Skor ${evaluasi.score}/100 (${evaluasi.isPass ? 'TUNTAS' : 'REMEDIAL'})
              </span>
            ` : `
              <span class="badge badge-secondary">Belum Dikerjakan</span>
            `}
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('evaluasi')">
              ${evaluasi.isCompleted ? 'Review' : 'Mulai'}
            </button>
          </td>
        </tr>
        <tr>
          <td>
            <strong>Lembar Refleksi Pembelajaran</strong>
            <span style="font-size:0.73rem; color:var(--color-text-muted); display:block;">Evaluasi Mandiri Siswa</span>
          </td>
          <td>${refleksi.isCompleted ? (refleksi.list[refleksi.list.length - 1].date || today) : '-'}</td>
          <td>
            <span class="badge ${refleksi.isCompleted ? 'badge-success' : 'badge-secondary'}">
              ${refleksi.isCompleted ? `${refleksi.total} Refleksi Tersimpan` : 'Belum Mengisi'}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('refleksi')">Tulis</button>
          </td>
        </tr>
      `;
    }
  },

  printHasilReport() {
    window.print();
  },

  // =========================================================================
  // Screen 8: Refleksi Pembelajaran
  // =========================================================================
  renderRefleksi() {
    this.renderRefleksiHistory();
  },

  updateCharCount(id, max) {
    const input = document.getElementById(id);
    const counter = document.getElementById(`${id}-counter`);
    if (!input || !counter) return;

    const len = input.value.length;
    counter.textContent = `${len}/${max} karakter`;

    if (len >= max) {
      counter.className = 'char-counter limit-reached';
    } else if (len >= max - 30) {
      counter.className = 'char-counter limit-near';
    } else {
      counter.className = 'char-counter';
    }
  },

  resetRefleksiForm() {
    const q1 = document.getElementById('ref-q1');
    const q2 = document.getElementById('ref-q2');
    const q3 = document.getElementById('ref-q3');
    if (q1) q1.value = '';
    if (q2) q2.value = '';
    if (q3) q3.value = '';
    this.updateCharCount('ref-q1', 300);
    this.updateCharCount('ref-q2', 300);
    this.updateCharCount('ref-q3', 300);
  },

  saveRefleksi() {
    const q1 = (document.getElementById('ref-q1') ? document.getElementById('ref-q1').value : '').trim();
    const q2 = (document.getElementById('ref-q2') ? document.getElementById('ref-q2').value : '').trim();
    const q3 = (document.getElementById('ref-q3') ? document.getElementById('ref-q3').value : '').trim();

    if (!q1 || !q2 || !q3) {
      alert('Mohon isi ketiga pertanyaan refleksi pembelajaran sebelum menyimpan.');
      return;
    }

    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      studentName: NetLearnStore.state.currentUser.name || 'Siswa',
      studentNis: NetLearnStore.state.currentUser.nis || '',
      studentKelas: NetLearnStore.state.currentUser.kelas || '',
      paham: q1,
      sulit: q2,
      lanjut: q3
    };

    NetLearnStore.state.reflections.unshift(newEntry);
    NetLearnStore.save();

    this.resetRefleksiForm();
    this.renderRefleksiHistory();
    showToast('Refleksi belajar Anda berhasil disimpan!', 'success');
  },

  renderRefleksiHistory() {
    const mount = document.getElementById('refleksi-history-mount');
    if (!mount) return;

    const list = NetLearnStore.state.reflections;
    if (list.length === 0) {
      mount.innerHTML = `<div class="callout callout-info">Belum ada riwayat refleksi yang tersimpan.</div>`;
      return;
    }

    mount.innerHTML = list.map(item => `
      <div class="reflection-history-card">
        <div class="reflection-date">
          📅 Disimpan pada ${item.date}
        </div>
        <div class="reflection-item-field">
          <div class="reflection-field-label">1. Apa yang sudah dipahami:</div>
          <div class="reflection-field-val">${item.paham}</div>
        </div>
        <div class="reflection-item-field">
          <div class="reflection-field-label">2. Kendala yang masih sulit:</div>
          <div class="reflection-field-val">${item.sulit}</div>
        </div>
        <div class="reflection-item-field">
          <div class="reflection-field-label">3. Rencana langkah belajar selanjutnya:</div>
          <div class="reflection-field-val">${item.lanjut}</div>
        </div>
      </div>
    `).join('');
  },

  // =========================================================================
  // Guru / Admin Suite Renders
  // =========================================================================
  renderGuruDashboard() {
    const records = NetLearnStore.state.studentRecords;
    const totalStudents = records.length;
    const passedCount = records.filter(r => r.status === 'Tuntas').length;
    const remedialCount = records.filter(r => r.status === 'Remedial').length;
    const avgScore = Math.round(records.reduce((acc, r) => acc + r.evaluasiScore, 0) / totalStudents);

    const elTotal = document.getElementById('guru-stat-total');
    const elPassed = document.getElementById('guru-stat-passed');
    const elRemedial = document.getElementById('guru-stat-remedial');
    const elAvg = document.getElementById('guru-stat-avg');

    if (elTotal) elTotal.textContent = totalStudents;
    if (elPassed) elPassed.textContent = `${passedCount} Siswa`;
    if (elRemedial) elRemedial.textContent = `${remedialCount} Siswa`;
    if (elAvg) elAvg.textContent = `${avgScore} / 100`;

    // Render Recent Submissions Table
    const tableMount = document.getElementById('guru-recent-table-body');
    if (tableMount) {
      tableMount.innerHTML = records.slice(0, 5).map(r => `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.nis}</td>
          <td>${r.kelas}</td>
          <td>${r.latihanScore}</td>
          <td><strong>${r.evaluasiScore}</strong></td>
          <td>
            <span class="badge ${r.status === 'Tuntas' ? 'badge-success' : 'badge-danger'}">
              ${r.status}
            </span>
          </td>
        </tr>
      `).join('');
    }
  },

  // =========================================================================
  // Screen 5: Bank Soal & Evaluasi (Database Bank Soal)
  // =========================================================================
  bankSoalActiveTab: 'latihan', // 'latihan' | 'eval_pg' | 'eval_ur'

  switchBankSoalTab(tab) {
    this.bankSoalActiveTab = tab;
    const btnLat = document.getElementById('btn-bank-tab-latihan');
    const btnPg = document.getElementById('btn-bank-tab-eval-pg');
    const btnUr = document.getElementById('btn-bank-tab-eval-ur');

    if (btnLat) btnLat.classList.toggle('active', tab === 'latihan');
    if (btnPg) btnPg.classList.toggle('active', tab === 'eval_pg');
    if (btnUr) btnUr.classList.toggle('active', tab === 'eval_ur');

    this.renderGuruBankSoal();
  },

  renderGuruBankSoal() {
    const mount = document.getElementById('guru-bank-soal-list');
    if (!mount) return;

    // Update Counter Badges
    const countLat = document.getElementById('count-bank-latihan');
    const countPg = document.getElementById('count-bank-eval-pg');
    const countUr = document.getElementById('count-bank-eval-ur');

    const latList = NetLearnStore.latihanQuestions || [];
    const evalData = NetLearnStore.evaluasiData || { pgList: [], uraianList: [] };
    const pgList = evalData.pgList || [];
    const urList = evalData.uraianList || [];

    if (countLat) countLat.textContent = latList.length;
    if (countPg) countPg.textContent = pgList.length;
    if (countUr) countUr.textContent = urList.length;

    if (this.bankSoalActiveTab === 'latihan') {
      if (latList.length === 0) {
        mount.innerHTML = `<div class="card" style="padding:2rem; text-align:center; color:var(--color-text-muted);">Belum ada soal latihan. Klik tombol "+ Tambah Butir Soal Baru" di atas.</div>`;
        return;
      }
      mount.innerHTML = latList.map((q, idx) => `
        <div class="card" style="padding: 1.25rem 1.5rem; margin-bottom: 1rem; border-left: 4px solid var(--color-interactive);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
            <div style="flex:1;">
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem;">
                <span class="badge badge-blue">Soal Latihan #${idx + 1}</span>
                <span style="font-size:0.75rem; color:var(--color-text-muted);">Kunci: <strong>${q.correctKey}</strong></span>
              </div>
              <div style="font-weight:700; font-size:0.95rem; color:var(--color-primary); margin-bottom:0.65rem;">
                ${q.question}
              </div>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.45rem; font-size:0.83rem; margin-bottom:0.75rem;">
                ${q.options.map(opt => `
                  <div style="padding:0.35rem 0.65rem; border-radius:var(--radius-sm); background:${opt.key === q.correctKey ? '#DCFCE7; border:1px solid #86EFAC;' : '#F8FAFC; border:1px solid #E2E8F0;'}">
                    <strong>${opt.key}.</strong> ${opt.text}
                  </div>
                `).join('')}
              </div>
              ${q.explanation && q.explanation.steps ? `
                <div style="font-size:0.78rem; color:var(--color-text-muted); background:var(--color-bg-muted); padding:0.5rem 0.75rem; border-radius:var(--radius-sm);">
                  💡 <strong>Pembahasan:</strong> ${Array.isArray(q.explanation.steps) ? q.explanation.steps.join(' ') : q.explanation.steps}
                </div>
              ` : ''}
            </div>
            <div style="display:flex; flex-direction:column; gap:0.35rem;">
              <button class="btn btn-secondary btn-sm" onclick="App.openEditQuestionModal('latihan', ${idx})">
                ✏️ Edit
              </button>
              <button class="btn btn-secondary btn-sm" style="color:var(--color-danger);" onclick="App.deleteQuestionConfirm('latihan', ${idx})">
                🗑️ Hapus
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } else if (this.bankSoalActiveTab === 'eval_pg') {
      if (pgList.length === 0) {
        mount.innerHTML = `<div class="card" style="padding:2rem; text-align:center; color:var(--color-text-muted);">Belum ada butir soal Evaluasi Pilihan Ganda. Klik tombol "+ Tambah Butir Soal Baru" di atas.</div>`;
        return;
      }
      mount.innerHTML = pgList.map((q, idx) => {
        const optionLetters = ['A', 'B', 'C', 'D'];
        const correctLetter = optionLetters[q.correct] || 'A';
        return `
          <div class="card" style="padding: 1.25rem 1.5rem; margin-bottom: 1rem; border-left: 4px solid var(--color-accent);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem;">
                  <span class="badge badge-purple">Evaluasi PG #${idx + 1}</span>
                  <span class="badge badge-success" style="font-size:0.72rem;">Bobot: ${q.points || 5} Poin</span>
                  <span style="font-size:0.75rem; color:var(--color-text-muted);">Kunci: <strong>${correctLetter} (${q.options[q.correct] || ''})</strong></span>
                </div>
                <div style="font-weight:700; font-size:0.95rem; color:var(--color-primary); margin-bottom:0.65rem;">
                  ${q.text}
                </div>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.45rem; font-size:0.83rem;">
                  ${q.options.map((opt, oIdx) => `
                    <div style="padding:0.35rem 0.65rem; border-radius:var(--radius-sm); background:${oIdx === q.correct ? '#DCFCE7; border:1px solid #86EFAC;' : '#F8FAFC; border:1px solid #E2E8F0;'}">
                      <strong>${optionLetters[oIdx]}.</strong> ${opt}
                    </div>
                  `).join('')}
                </div>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.35rem;">
                <button class="btn btn-secondary btn-sm" onclick="App.openEditQuestionModal('eval_pg', ${idx})">
                  ✏️ Edit
                </button>
                <button class="btn btn-secondary btn-sm" style="color:var(--color-danger);" onclick="App.deleteQuestionConfirm('eval_pg', ${idx})">
                  🗑️ Hapus
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      if (urList.length === 0) {
        mount.innerHTML = `<div class="card" style="padding:2rem; text-align:center; color:var(--color-text-muted);">Belum ada butir soal Evaluasi Uraian. Klik tombol "+ Tambah Butir Soal Baru" di atas.</div>`;
        return;
      }
      mount.innerHTML = urList.map((q, idx) => `
        <div class="card" style="padding: 1.25rem 1.5rem; margin-bottom: 1rem; border-left: 4px solid #10B981;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
            <div style="flex:1;">
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem;">
                <span class="badge badge-success">Evaluasi Uraian #${idx + 1}</span>
                <span class="badge badge-blue" style="font-size:0.72rem;">Bobot: ${q.points || 5} Poin</span>
              </div>
              <div style="font-weight:700; font-size:0.95rem; color:var(--color-primary); margin-bottom:0.65rem;">
                ${q.text}
              </div>
              <div style="font-size:0.82rem; color:var(--color-text-muted); background:var(--color-bg-muted); padding:0.65rem 0.85rem; border-radius:var(--radius-sm); margin-bottom:0.5rem;">
                🔑 <strong>Kata Kunci Penilaian Otomatis:</strong> <code>${(q.keywords || []).join(', ')}</code>
              </div>
              <div style="font-size:0.8rem; color:#475569;">
                📋 <strong>Rubrik Penilaian:</strong> ${q.rubric || '-'}
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.35rem;">
              <button class="btn btn-secondary btn-sm" onclick="App.openEditQuestionModal('eval_ur', ${idx})">
                ✏️ Edit
              </button>
              <button class="btn btn-secondary btn-sm" style="color:var(--color-danger);" onclick="App.deleteQuestionConfirm('eval_ur', ${idx})">
                🗑️ Hapus
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
  },

  // =========================================================================
  // Screen 4: Laporan Nilai Kelas & Database Siswa
  // =========================================================================
  renderGuruLaporan() {
    const mount = document.getElementById('guru-laporan-table-body');
    if (!mount) return;

    const searchInput = document.getElementById('guru-laporan-search');
    const filterKelas = document.getElementById('guru-laporan-filter-kelas');
    const filterStatus = document.getElementById('guru-laporan-filter-status');

    const search = searchInput ? searchInput.value : '';
    const kelas = filterKelas ? filterKelas.value : 'all';
    const status = filterStatus ? filterStatus.value : 'all';

    const records = NetLearnStore.getStudents({ search, kelas, status });

    if (records.length === 0) {
      mount.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:2.5rem; color:var(--color-text-muted);">
            🔍 Tidak ada data siswa yang cocok dengan pencarian / filter Anda.
          </td>
        </tr>
      `;
      return;
    }

    mount.innerHTML = records.map(r => `
      <tr>
        <td>
          <strong>${r.name}</strong>
          <div style="font-size:0.75rem; color:var(--color-text-muted);">Sandi: <code>${r.password || '123'}</code></div>
        </td>
        <td><code>${r.nis}</code></td>
        <td><span class="badge badge-blue" style="font-size:0.73rem;">${r.kelas || 'XI TKJ 1'}</span></td>
        <td><strong>${r.latihanScore || 0}</strong> / 100</td>
        <td>
          <strong style="color:${(r.evaluasiScore || 0) >= 75 ? 'var(--color-success)' : 'var(--color-danger)'};">
            ${r.evaluasiScore !== null && r.evaluasiScore !== undefined ? r.evaluasiScore : '-'}
          </strong>
        </td>
        <td>
          <span class="badge ${r.status === 'Tuntas' ? 'badge-success' : (r.status === 'Remedial' ? 'badge-danger' : 'badge-secondary')}">
            ${r.status || 'Belum Ujian'}
          </span>
        </td>
        <td style="font-size:0.8rem; color:var(--color-text-muted);">${r.date || '-'}</td>
        <td style="text-align:center;">
          <div class="table-action-btns" style="justify-content:center;">
            <button class="table-action-btn" title="Lihat Transkrip Detail Siswa" onclick="App.openStudentDetailModal('${r.nis}')">
              👁️ Detail
            </button>
            <button class="table-action-btn" title="Sunting Data Siswa" onclick="App.openEditStudentModal('${r.nis}')">
              ✏️ Edit
            </button>
            <button class="table-action-btn" title="Reset Kata Sandi ke 123" onclick="App.quickResetStudentPassword('${r.nis}')">
              🔑 Sandi
            </button>
            <button class="table-action-btn" title="Reset Ujian untuk Remedial" onclick="App.quickResetStudentExam('${r.nis}')">
              🔄 Ujian
            </button>
            <button class="table-action-btn btn-danger" title="Hapus Siswa dari Database" onclick="App.deleteStudentConfirm('${r.nis}')">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  exportClassReportCSV() {
    const records = NetLearnStore.state.studentRecords;
    let csv = "Nama Siswa,NIS,Kelas,Kata Sandi,Nilai Latihan,Nilai Evaluasi,Status Kelulusan,Tanggal\n";
    records.forEach(r => {
      csv += `"${r.name}","${r.nis}","${r.kelas}","${r.password || '123'}",${r.latihanScore},${r.evaluasiScore},"${r.status}","${r.date}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Hasil_Belajar_NetLearn_SMK3_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Laporan database siswa format CSV berhasil diunduh!', 'success');
  },

  // Ekspor Rekapitulasi Capaian Nilai Siswa ke Format PDF Siap Cetak (Revisi Item 14)
  exportClassReportPDF() {
    const students = NetLearnStore.state.studentRecords || [];
    const teacher = NetLearnStore.state.teacherUser || { name: 'Bpk. Rifaldi, S.Pd., M.T.', nip: '198504122010011008' };
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let tuntasCount = 0;
    let remedialCount = 0;
    let totalScore = 0;
    let evaluatedCount = 0;

    students.forEach(s => {
      const score = Number(s.evaluasiScore) || 0;
      if (s.status === 'Tuntas' || score >= 75) {
        tuntasCount++;
        evaluatedCount++;
        totalScore += score;
      } else if (s.status === 'Remedial' || score > 0) {
        remedialCount++;
        evaluatedCount++;
        totalScore += score;
      }
    });

    const avgScore = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : 0;
    const tuntasPercent = evaluatedCount > 0 ? Math.round((tuntasCount / evaluatedCount) * 100) : 0;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Pop-up jendela cetak terblokir oleh peramban. Izinkan pop-up untuk mencetak / menyimpan dokumen PDF.');
      return;
    }

    const rowsHtml = students.map((s, idx) => `
      <tr>
        <td style="text-align:center; padding:7px 8px; border:1px solid #CBD5E1;">${idx + 1}</td>
        <td style="padding:7px 8px; border:1px solid #CBD5E1; font-weight:600;">${s.name}</td>
        <td style="text-align:center; padding:7px 8px; border:1px solid #CBD5E1; font-family:monospace;">${s.nis}</td>
        <td style="text-align:center; padding:7px 8px; border:1px solid #CBD5E1;">${s.kelas || 'XI TKJ 1'}</td>
        <td style="text-align:center; padding:7px 8px; border:1px solid #CBD5E1; font-weight:600;">${s.latihanScore || 0}</td>
        <td style="text-align:center; padding:7px 8px; border:1px solid #CBD5E1; font-weight:700; color:${(s.evaluasiScore || 0) >= 75 ? '#15803D' : '#B91C1C'};">${s.evaluasiScore || 0}</td>
        <td style="text-align:center; padding:7px 8px; border:1px solid #CBD5E1; font-weight:700;">
          <span style="display:inline-block; padding:3px 8px; border-radius:4px; font-size:11px; background:${(s.evaluasiScore || 0) >= 75 ? '#DCFCE7' : ((s.evaluasiScore || 0) > 0 ? '#FEE2E2' : '#F1F5F9')}; color:${(s.evaluasiScore || 0) >= 75 ? '#166534' : ((s.evaluasiScore || 0) > 0 ? '#991B1B' : '#475569')};">
            ${(s.evaluasiScore || 0) >= 75 ? 'TUNTAS' : ((s.evaluasiScore || 0) > 0 ? 'REMEDIAL' : 'BELUM UJIAN')}
          </span>
        </td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rekapitulasi_Nilai_NetLearn_SMKN3_Makassar_${new Date().toISOString().slice(0, 10)}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm 15mm 15mm 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; margin: 0; padding: 20px; font-size: 12px; }
          .kop-surat { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px; }
          .kop-surat h4 { margin: 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .kop-surat h2 { margin: 3px 0; font-size: 16px; font-weight: 800; text-transform: uppercase; }
          .kop-surat p { margin: 2px 0; font-size: 11px; color: #334155; }
          .doc-title { text-align: center; margin-bottom: 16px; }
          .doc-title h3 { margin: 0; font-size: 14px; text-decoration: underline; font-weight: 800; }
          .doc-title span { font-size: 11px; color: #475569; }
          .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
          .card { border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; text-align: center; background: #F8FAFC; }
          .card .val { font-size: 16px; font-weight: 800; color: #1E293B; margin-top: 2px; }
          .card .lbl { font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          th { background: #1E293B; color: #FFF; padding: 8px; border: 1px solid #1E293B; font-size: 11px; text-align: center; }
          .signature-section { display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px; page-break-inside: avoid; }
          .sign-col { text-align: center; width: 220px; }
          .sign-space { height: 60px; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; padding: 10px 15px; background: #EFF6FF; border: 1px solid #3B82F6; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: #1D4ED8;">Pratinjau Dokumen PDF Rekapitulasi Nilai Siswa</span>
          <div>
            <button onclick="window.print()" style="background: #2563EB; color: #FFF; border: none; padding: 6px 14px; border-radius: 4px; font-weight: 700; cursor: pointer;">Cetak / Simpan PDF (Ctrl+P)</button>
            <button onclick="window.close()" style="background: #E2E8F0; color: #334155; border: none; padding: 6px 14px; border-radius: 4px; font-weight: 600; cursor: pointer; margin-left: 6px;">Tutup</button>
          </div>
        </div>

        <div class="kop-surat">
          <h4>Pemerintah Provinsi Sulawesi Selatan • Dinas Pendidikan</h4>
          <h2>SMK NEGERI 3 MAKASSAR</h2>
          <p>Program Keahlian: Teknik Jaringan Komputer & Telekomunikasi (TJKT)</p>
          <p>Alamat: Jl. Bonto Te'ne No. 22, Kota Makassar, Sulawesi Selatan</p>
        </div>

        <div class="doc-title">
          <h3>REKAPITULASI CAPAIAN NILAI & KETUNTASAN SISWA</h3>
          <span>Mata Pelajaran: Perencanaan & Pengalamatan Jaringan (Fase F - Kurikulum Merdeka)</span>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="lbl">Total Siswa</div>
            <div class="val">${students.length} Orang</div>
          </div>
          <div class="card">
            <div class="lbl">Tuntas KKM (≥75)</div>
            <div class="val" style="color:#15803D;">${tuntasCount} Siswa (${tuntasPercent}%)</div>
          </div>
          <div class="card">
            <div class="lbl">Remedial (<75)</div>
            <div class="val" style="color:#B91C1C;">${remedialCount} Siswa</div>
          </div>
          <div class="card">
            <div class="lbl">Rata-Rata Nilai</div>
            <div class="val" style="color:#2563EB;">${avgScore} / 100</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:35px;">No.</th>
              <th>Nama Lengkap Siswa</th>
              <th style="width:110px;">NIS</th>
              <th style="width:80px;">Kelas</th>
              <th style="width:90px;">Latihan</th>
              <th style="width:90px;">Evaluasi</th>
              <th style="width:110px;">Status KKM</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sign-col">
            <p>Mengetahui,<br>Kepala SMK Negeri 3 Makassar</p>
            <div class="sign-space"></div>
            <p><strong>Drs. H. Muhammad Ridwan, M.Pd.</strong><br>NIP. 19681120 199403 1 004</p>
          </div>
          <div class="sign-col">
            <p>Makassar, ${today}<br>Guru Pengampu Mata Pelajaran</p>
            <div class="sign-space"></div>
            <p><strong>${teacher.name || 'Bpk. Rifaldi, S.Pd., M.T.'}</strong><br>NIP. ${teacher.nip || '198504122010011008'}</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  renderGuruRefleksi() {
    const mount = document.getElementById('guru-refleksi-table-body');
    if (!mount) return;

    const list = NetLearnStore.state.reflections || [];
    if (list.length === 0) {
      mount.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:2rem; color:var(--color-text-muted);">
            Belum ada catatan refleksi yang dikirimkan oleh siswa.
          </td>
        </tr>
      `;
      return;
    }

    mount.innerHTML = list.map((r, idx) => `
      <tr>
        <td style="font-size:0.8rem; white-space:nowrap;">${r.date || '-'}</td>
        <td>
          <strong>${r.studentName || 'Peserta Didik'}</strong>
          ${r.studentNis ? `<div style="font-size:0.75rem; color:var(--color-text-muted);">NIS: ${r.studentNis} • ${r.studentKelas || 'XI TKJ 1'}</div>` : ''}
        </td>
        <td style="font-size:0.84rem;">${r.paham || '-'}</td>
        <td style="font-size:0.84rem; color:#DC2626;">${r.sulit || '-'}</td>
        <td style="font-size:0.84rem;">${r.lanjut || '-'}</td>
        <td style="text-align:center;">
          <button class="table-action-btn btn-danger" onclick="App.deleteReflectionConfirm(${idx})">
            🗑️
          </button>
        </td>
      </tr>
    `).join('');
  },

  deleteReflectionConfirm(idx) {
    if (confirm('Hapus catatan refleksi ini dari database?')) {
      if (Array.isArray(NetLearnStore.state.reflections)) {
        NetLearnStore.state.reflections.splice(idx, 1);
        NetLearnStore.save();
        this.renderGuruRefleksi();
        this.renderGuruDatabase();
        showToast('Catatan refleksi berhasil dihapus.', 'info');
      }
    }
  },

  // =========================================================================
  // Screen 6: Pusat Manajemen Database & Cadangan Data (Full Database Center)
  // =========================================================================
  databaseActiveTab: 'siswa', // 'siswa' | 'modul' | 'soal' | 'guru' | 'cloud'

  switchDatabaseTab(tab) {
    this.databaseActiveTab = tab;
    const btnSiswa = document.getElementById('btn-db-tab-siswa');
    const btnModul = document.getElementById('btn-db-tab-modul');
    const btnSoal = document.getElementById('btn-db-tab-soal');
    const btnGuru = document.getElementById('btn-db-tab-guru');
    const btnCloud = document.getElementById('btn-db-tab-cloud');

    if (btnSiswa) btnSiswa.classList.toggle('active', tab === 'siswa');
    if (btnModul) btnModul.classList.toggle('active', tab === 'modul');
    if (btnSoal) btnSoal.classList.toggle('active', tab === 'soal');
    if (btnGuru) btnGuru.classList.toggle('active', tab === 'guru');
    if (btnCloud) btnCloud.classList.toggle('active', tab === 'cloud');

    this.renderGuruDatabaseTab();
  },

  renderGuruDatabase() {
    const stats = NetLearnStore.getDatabaseStats();

    const elStudents = document.getElementById('db-stat-students');
    const elModules = document.getElementById('db-stat-modules');
    const elQuestions = document.getElementById('db-stat-questions');
    const elReflections = document.getElementById('db-stat-reflections');
    const elStorage = document.getElementById('db-stat-storage');

    if (elStudents) elStudents.textContent = `${stats.studentCount} Siswa`;
    if (elModules) elModules.textContent = `${stats.moduleCount} Modul`;
    if (elQuestions) elQuestions.textContent = `${stats.questionCount} Soal`;
    if (elReflections) elReflections.textContent = `${stats.reflectionCount} Entri`;
    if (elStorage) elStorage.textContent = `${stats.storageKB} KB`;

    this.renderGuruDatabaseTab();
  },

  renderGuruDatabaseTab() {
    const mount = document.getElementById('guru-db-tab-content');
    if (!mount) return;

    if (this.databaseActiveTab === 'siswa') {
      const students = NetLearnStore.getStudents();
      mount.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <h4 style="margin:0; font-size:1.05rem; font-weight:800; color:var(--color-primary);">
            Tabel Database Siswa (${students.length} Akun Terdaftar)
          </h4>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-primary btn-sm" onclick="App.openAddStudentModal()">
              ➕ Tambah Siswa Baru
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.exportClassReportCSV()">
              📥 Ekspor CSV
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>NIS</th>
                <th>Kelas</th>
                <th>Sandi</th>
                <th>Latihan</th>
                <th>Evaluasi</th>
                <th>Status</th>
                <th style="text-align:center;">Aksi Database</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td><strong>${s.name}</strong></td>
                  <td><code>${s.nis}</code></td>
                  <td><span class="badge badge-blue" style="font-size:0.72rem;">${s.kelas || 'XI TKJ 1'}</span></td>
                  <td><code>${s.password || '123'}</code></td>
                  <td>${s.latihanScore || 0}</td>
                  <td><strong>${s.evaluasiScore || 0}</strong></td>
                  <td>
                    <span class="badge ${s.status === 'Tuntas' ? 'badge-success' : (s.status === 'Remedial' ? 'badge-danger' : 'badge-secondary')}">
                      ${s.status || 'Belum Ujian'}
                    </span>
                  </td>
                  <td style="text-align:center;">
                    <div class="table-action-btns" style="justify-content:center;">
                      <button class="table-action-btn" onclick="App.openStudentDetailModal('${s.nis}')" title="Detail Siswa">👁️</button>
                      <button class="table-action-btn" onclick="App.openEditStudentModal('${s.nis}')" title="Edit Siswa">✏️</button>
                      <button class="table-action-btn" onclick="App.quickResetStudentPassword('${s.nis}')" title="Reset Sandi">🔑</button>
                      <button class="table-action-btn btn-danger" onclick="App.deleteStudentConfirm('${s.nis}')" title="Hapus Siswa">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.databaseActiveTab === 'modul') {
      const modules = NetLearnStore.getModules();
      mount.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <h4 style="margin:0; font-size:1.05rem; font-weight:800; color:var(--color-primary);">
            Tabel Database Modul & Bahan Ajar (${modules.length} Modul Aktif)
          </h4>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-primary btn-sm" onclick="App.openCreateCMSModal()">
              ➕ Tambah Modul Baru
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.loadSampleMateriFromCMS()">
              ✨ Muat Contoh Materi
            </button>
            <button class="btn btn-secondary btn-sm" style="color:var(--color-danger);" onclick="App.clearAllMateriFromCMS()">
              🗑️ Kosongkan Modul
            </button>
          </div>
        </div>

        ${modules.length === 0 ? `
          <div class="card" style="padding:2.5rem; text-align:center; color:var(--color-text-muted);">
            📂 Database materi pembelajaran masih kosong. Silakan tambah modul baru atau klik "Muat Contoh Materi".
          </div>
        ` : `
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th style="width:50px;">No</th>
                  <th>Judul Modul</th>
                  <th>TP Terkait</th>
                  <th>Slide PPT</th>
                  <th>Dokumen Word</th>
                  <th>Video YouTube</th>
                  <th style="text-align:center;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${modules.map((m, idx) => `
                  <tr>
                    <td><strong>#${idx + 1}</strong></td>
                    <td>
                      <strong>${m.title}</strong>
                      <div style="font-size:0.75rem; color:var(--color-text-muted);">${m.subtitle ? m.subtitle.slice(0, 60) + '...' : '-'}</div>
                    </td>
                    <td><span class="badge badge-purple">${m.tpCode || 'TP1'}</span></td>
                    <td>${m.pptSlides ? `${m.pptSlides.length} Slide` : (m.pptUrl ? 'Embed PPT' : '-')}</td>
                    <td>${m.wordFileName ? `📄 ${m.wordFileName}` : (m.wordExplanation ? 'Teks Word' : '-')}</td>
                    <td>${m.videoUrl ? '🎥 Tersemat' : '-'}</td>
                    <td style="text-align:center;">
                      <div class="table-action-btns" style="justify-content:center;">
                        <button class="table-action-btn" onclick="App.openEditCMSModal(${idx})" title="Edit Modul">✏️ Edit</button>
                        <button class="table-action-btn btn-danger" onclick="App.deleteCMSModule(${idx})" title="Hapus Modul">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      `;
    } else if (this.databaseActiveTab === 'soal') {
      const latList = NetLearnStore.latihanQuestions || [];
      const evalData = NetLearnStore.evaluasiData || { pgList: [], uraianList: [] };
      const pgList = evalData.pgList || [];
      const urList = evalData.uraianList || [];
      mount.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <h4 style="margin:0; font-size:1.05rem; font-weight:800; color:var(--color-primary);">
            Ringkasan Database Bank Soal (${latList.length + pgList.length + urList.length} Butir Soal Total)
          </h4>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-primary btn-sm" onclick="App.navigateTo('guru-bank-soal')">
              🗂️ Buka Editor Bank Soal Lengkap →
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.resetBankSoalConfirm()">
              🔄 Reset ke Standar
            </button>
          </div>
        </div>

        <div class="grid-three-col" style="margin-bottom:1.5rem;">
          <div class="card" style="padding:1.25rem; border-left:4px solid var(--color-interactive);">
            <strong style="color:var(--color-primary); font-size:0.95rem; display:block;">Soal Latihan Interaktif</strong>
            <div style="font-size:1.6rem; font-weight:800; color:var(--color-interactive); margin:0.3rem 0;">${latList.length} Butir</div>
            <span style="font-size:0.75rem; color:var(--color-text-muted);">Pilihan Ganda dengan Pembahasan Solusi</span>
          </div>

          <div class="card" style="padding:1.25rem; border-left:4px solid var(--color-accent);">
            <strong style="color:var(--color-primary); font-size:0.95rem; display:block;">Evaluasi Pilihan Ganda</strong>
            <div style="font-size:1.6rem; font-weight:800; color:var(--color-accent); margin:0.3rem 0;">${pgList.length} Butir</div>
            <span style="font-size:0.75rem; color:var(--color-text-muted);">Otomatis Dihitung ke Nilai Akhir (KKM 75)</span>
          </div>

          <div class="card" style="padding:1.25rem; border-left:4px solid #10B981;">
            <strong style="color:var(--color-primary); font-size:0.95rem; display:block;">Evaluasi Uraian Analisis</strong>
            <div style="font-size:1.6rem; font-weight:800; color:#10B981; margin:0.3rem 0;">${urList.length} Butir</div>
            <span style="font-size:0.75rem; color:var(--color-text-muted);">Penilaian Berbasis Kata Kunci & Rubrik</span>
          </div>
        </div>
      `;
    } else if (this.databaseActiveTab === 'cloud') {
      const isConnected = typeof NetLearnSupabase !== 'undefined' && NetLearnSupabase.isConfigured();
      const cfg = typeof NetLearnSupabase !== 'undefined' ? NetLearnSupabase.getConfig() : { url: '', anonKey: '', autoSync: true, lastSynced: null };

      mount.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.75rem;">
          <div>
            <h4 style="margin:0; font-size:1.1rem; font-weight:800; color:var(--color-primary); display:flex; align-items:center; gap:0.5rem;">
              <span>⚡ Sinkronisasi Cloud Database (Supabase PostgreSQL)</span>
              ${isConnected ? `
                <span class="badge" style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-size:0.75rem;">● Online &amp; Terhubung</span>
              ` : `
                <span class="badge" style="background:#FFFBEB; color:#92400E; border:1px solid #FDE68A; font-size:0.75rem;">○ Mode Offline (LocalStorage)</span>
              `}
            </h4>
            <p style="margin:0.25rem 0 0 0; font-size:0.82rem; color:var(--color-text-muted);">
              Menghubungkan seluruh komputer siswa dan laptop guru dalam satu basis data terpusat secara real-time.
            </p>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="App.copySupabaseSQL()" style="display:inline-flex; align-items:center; gap:0.35rem;">
              📋 Salin Script SQL Schema
            </button>
            ${isConnected ? `
              <button class="btn btn-primary btn-sm" onclick="App.supabasePullNow()" style="display:inline-flex; align-items:center; gap:0.35rem;">
                🔄 Tarik Data Cloud (Pull)
              </button>
              <button class="btn btn-primary btn-sm" onclick="App.supabasePushNow()" style="background:#059669; border-color:#059669; display:inline-flex; align-items:center; gap:0.35rem;">
                ⬆️ Unggah Semua ke Cloud (Push All)
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Kartu Pengaturan Koneksi Supabase -->
        <div class="card" style="padding:1.5rem; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; margin-bottom:1.5rem;">
          <h5 style="margin:0 0 1rem 0; font-size:0.95rem; font-weight:700; color:var(--color-primary); display:flex; align-items:center; gap:0.4rem;">
            <span>🔑 Kredensial Proyek Supabase Anda</span>
          </h5>

          <form id="form-supabase-config" onsubmit="event.preventDefault(); App.saveSupabaseConfig();">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
              <div class="form-group">
                <label class="form-label" style="font-weight:600; font-size:0.82rem;">Supabase Project URL:</label>
                <input type="url" id="supabase-input-url" class="form-control" placeholder="https://xxxxxxxxxxxx.supabase.co" value="${cfg.url || ''}" required style="font-family:var(--font-mono); font-size:0.85rem;">
                <span style="font-size:0.72rem; color:var(--color-text-muted);">Didapat dari: Supabase Dashboard -> Project Settings -> API -> Project URL</span>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight:600; font-size:0.82rem;">Supabase Anon Public API Key:</label>
                <input type="text" id="supabase-input-key" class="form-control" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..." value="${cfg.anonKey || ''}" required style="font-family:var(--font-mono); font-size:0.85rem;">
                <span style="font-size:0.72rem; color:var(--color-text-muted);">Didapat dari: Supabase Dashboard -> Project Settings -> API -> anon public key</span>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; padding-top:0.5rem; border-top:1px solid #E2E8F0;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <input type="checkbox" id="supabase-auto-sync" ${cfg.autoSync !== false ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--color-interactive);">
                <label for="supabase-auto-sync" style="font-size:0.82rem; font-weight:600; color:var(--color-text); cursor:pointer;">
                  Aktifkan Sinkronisasi Real-Time Otomatis (Live Sync Guru &amp; Siswa)
                </label>
              </div>

              <div style="display:flex; gap:0.5rem;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="App.testSupabaseConnection()">
                  🔍 Uji Koneksi Database
                </button>
                <button type="submit" class="btn btn-primary btn-sm" style="background:#059669; border-color:#059669; font-weight:700;">
                  💾 Simpan &amp; Aktifkan Supabase
                </button>
                ${isConnected ? `
                  <button type="button" class="btn btn-sm" onclick="App.disconnectSupabase()" style="color:#DC2626; background:#FEE2E2; border:1px solid #FCA5A5;">
                    Putuskan
                  </button>
                ` : ''}
              </div>
            </div>
          </form>
        </div>

        <!-- Panduan 3 Langkah Menghubungkan Supabase -->
        <div class="card" style="padding:1.5rem; border:1px solid var(--color-border); border-radius:12px;">
          <h5 style="margin:0 0 0.85rem 0; font-size:0.95rem; font-weight:700; color:var(--color-primary);">
            📖 Panduan Cepat Menghubungkan Supabase (Hanya 3 Menit):
          </h5>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:1rem;">
              <div style="display:flex; align-items:center; gap:0.4rem; font-weight:700; font-size:0.88rem; color:#0284C7; margin-bottom:0.4rem;">
                <span style="background:#E0F2FE; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem;">1</span>
                Buat Proyek Gratis di Supabase
              </div>
              <p style="margin:0; font-size:0.78rem; color:var(--color-text-muted); line-height:1.5;">
                Buka <a href="https://supabase.com" target="_blank" rel="noopener" style="color:var(--color-interactive); font-weight:600;">supabase.com</a>, daftar akun gratis, lalu klik <strong>New Project</strong> (beri nama misal <code>netlearn-smkn3</code>).
              </p>
            </div>

            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:1rem;">
              <div style="display:flex; align-items:center; gap:0.4rem; font-weight:700; font-size:0.88rem; color:#059669; margin-bottom:0.4rem;">
                <span style="background:#DCFCE7; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem;">2</span>
                Eksekusi Script SQL Schema
              </div>
              <p style="margin:0; font-size:0.78rem; color:var(--color-text-muted); line-height:1.5;">
                Klik tombol <strong>📋 Salin Script SQL Schema</strong> di pojok kanan atas, lalu di dashboard Supabase buka menu <strong>SQL Editor</strong> -&gt; <strong>New Query</strong> -&gt; Paste dan klik <strong>Run</strong>.
              </p>
            </div>

            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:1rem;">
              <div style="display:flex; align-items:center; gap:0.4rem; font-weight:700; font-size:0.88rem; color:#7C3AED; margin-bottom:0.4rem;">
                <span style="background:#F3E8FF; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem;">3</span>
                Salin Kunci API &amp; Selesai!
              </div>
              <p style="margin:0; font-size:0.78rem; color:var(--color-text-muted); line-height:1.5;">
                Buka menu <strong>Project Settings -&gt; API</strong>, salin <strong>Project URL</strong> dan <strong>anon public key</strong> ke form di atas, lalu klik <strong>Simpan &amp; Aktifkan Supabase</strong>.
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      const teachers = NetLearnStore.state.teachersList || [];
      mount.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <h4 style="margin:0; font-size:1.05rem; font-weight:800; color:var(--color-primary);">
            Tabel Database Akun Guru & Pengajar (${teachers.length} Instruktur)
          </h4>
          <span class="badge badge-purple">Hak Akses Instruktur</span>
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Nama Lengkap Guru</th>
                <th>NIP / Username</th>
                <th>Mata Pelajaran</th>
                <th>Peran</th>
              </tr>
            </thead>
            <tbody>
              ${teachers.map(t => `
                <tr>
                  <td><strong>${t.name}</strong></td>
                  <td><code>${t.nip || t.username}</code></td>
                  <td>${t.mapel || 'Perencanaan & Pengalamatan Jaringan'}</td>
                  <td><span class="badge badge-purple">Guru / Pengampu</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  },

  // -------------------------------------------------------------------------
  // SUPABASE CLOUD DATABASE HANDLERS
  // -------------------------------------------------------------------------
  async saveSupabaseConfig() {
    const urlInput = document.getElementById('supabase-input-url');
    const keyInput = document.getElementById('supabase-input-key');
    const syncCheckbox = document.getElementById('supabase-auto-sync');

    const url = urlInput ? urlInput.value.trim() : '';
    const anonKey = keyInput ? keyInput.value.trim() : '';
    const autoSync = syncCheckbox ? syncCheckbox.checked : true;

    if (!url || !anonKey) {
      alert('Project URL dan Anon Key Supabase wajib diisi!');
      return;
    }

    if (typeof showToast === 'function') showToast('Menguji koneksi ke Supabase...', 'info');
    const test = await NetLearnSupabase.testConnection(url, anonKey);
    if (!test.success) {
      alert(test.message);
      return;
    }

    NetLearnSupabase.saveConfig({ url, anonKey, autoSync });
    this.renderGuruDatabase();
    if (typeof showToast === 'function') showToast('Koneksi Supabase aktif! Sinkronisasi otomatis berjalan.', 'success');

    if (confirm('Koneksi Supabase berhasil! Apakah Anda ingin langsung mengunggah (push) seluruh materi dan data siswa yang ada saat ini ke database cloud Supabase?')) {
      this.supabasePushNow();
    }
  },

  async testSupabaseConnection() {
    const urlInput = document.getElementById('supabase-input-url');
    const keyInput = document.getElementById('supabase-input-key');
    const url = urlInput ? urlInput.value.trim() : '';
    const anonKey = keyInput ? keyInput.value.trim() : '';
    if (!url || !anonKey) {
      alert('Masukkan Project URL dan Anon Key terlebih dahulu.');
      return;
    }
    if (typeof showToast === 'function') showToast('Menguji koneksi ke Supabase...', 'info');
    const res = await NetLearnSupabase.testConnection(url, anonKey);
    alert(res.message);
  },

  async supabasePullNow() {
    if (typeof showToast === 'function') showToast('Menarik data terbaru dari cloud...', 'info');
    const ok = await NetLearnSupabase.pullFromCloud(false);
    if (ok) {
      this.renderGuruDatabase();
      if (this.materiViewMode === 'video' && NetLearnStore.state.activeScreen === 'materi') {
        this.renderMateri();
      }
    }
  },

  async supabasePushNow() {
    if (typeof showToast === 'function') showToast('Mengunggah data lokal ke cloud Supabase...', 'info');
    const res = await NetLearnSupabase.pushAllToCloud();
    alert(res.message);
    if (res.success) {
      this.renderGuruDatabase();
    }
  },

  disconnectSupabase() {
    if (confirm('Putuskan koneksi dari Supabase? Aplikasi akan kembali menggunakan mode penyimpanan lokal (LocalStorage).')) {
      localStorage.removeItem(NetLearnSupabase.CONFIG_KEY);
      if (NetLearnSupabase.client) NetLearnSupabase.client = null;
      this.renderGuruDatabase();
      if (typeof showToast === 'function') showToast('Koneksi Supabase diputuskan. Menggunakan mode lokal.', 'info');
    }
  },

  copySupabaseSQL() {
    const sql = NetLearnSupabase.getSQLSchema();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(sql).then(() => {
        if (typeof showToast === 'function') showToast('Script SQL Schema berhasil disalin ke clipboard! Buka SQL Editor di Supabase untuk menjalankannya.', 'success');
      }).catch(() => {
        this.fallbackCopyText(sql);
      });
    } else {
      this.fallbackCopyText(sql);
    }
  },

  fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (typeof showToast === 'function') showToast('Script SQL Schema berhasil disalin!', 'success');
  },

  // =========================================================================
  // MODAL HANDLERS: DATABASE SISWA (ADD, EDIT, DETAIL, DELETE)
  // =========================================================================
  openAddStudentModal() {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.textContent = '➕ Tambah Siswa Baru ke Database';
    modalBody.innerHTML = `
      <form id="form-student-manage" onsubmit="event.preventDefault(); App.saveStudentFromModal(false);">
        <div class="form-group" style="margin-bottom:0.9rem;">
          <label class="form-label">Nama Lengkap Siswa:</label>
          <input type="text" id="modal-student-name" class="form-control" placeholder="Contoh: Muhammad Rezky" required>
        </div>

        <div class="grid-two-equal" style="gap:0.75rem; margin-bottom:0.9rem;">
          <div class="form-group">
            <label class="form-label">Nomor Induk Siswa (NIS):</label>
            <input type="text" id="modal-student-nis" class="form-control" placeholder="Contoh: 22108" required>
          </div>
          <div class="form-group">
            <label class="form-label">Kelas:</label>
            <select id="modal-student-kelas" class="form-control">
              <option value="XI TKJ 1" selected>XI TKJ 1</option>
              <option value="XI TKJ 2">XI TKJ 2</option>
              <option value="XI TKJ 3">XI TKJ 3</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:0.9rem;">
          <label class="form-label">Kata Sandi Masuk:</label>
          <input type="text" id="modal-student-pass" class="form-control" value="123" required>
          <span style="font-size:0.75rem; color:var(--color-text-muted);">Standar bawaan: 123 (Siswa dapat menggunakannya untuk login).</span>
        </div>

        <div class="grid-three-col" style="gap:0.75rem; margin-bottom:0.5rem;">
          <div class="form-group">
            <label class="form-label">Nilai Latihan (0-100):</label>
            <input type="number" id="modal-student-latihan" class="form-control" min="0" max="100" value="0">
          </div>
          <div class="form-group">
            <label class="form-label">Nilai Evaluasi (0-100):</label>
            <input type="number" id="modal-student-evaluasi" class="form-control" min="0" max="100" value="0">
          </div>
          <div class="form-group">
            <label class="form-label">Status Kelulusan:</label>
            <select id="modal-student-status" class="form-control">
              <option value="Belum Ujian" selected>Belum Ujian</option>
              <option value="Tuntas">Tuntas KKM</option>
              <option value="Remedial">Remedial</option>
            </select>
          </div>
        </div>
      </form>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="App.saveStudentFromModal(false)">💾 Simpan Siswa Baru</button>
    `;

    openModal();
  },

  openEditStudentModal(nis) {
    const student = NetLearnStore.getStudentByNis(nis);
    if (!student) {
      showToast('Data siswa tidak ditemukan!', 'error');
      return;
    }

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.textContent = `✏️ Sunting Data Siswa: ${student.name}`;
    modalBody.innerHTML = `
      <form id="form-student-manage" onsubmit="event.preventDefault(); App.saveStudentFromModal(true, '${student.nis}');">
        <div class="form-group" style="margin-bottom:0.9rem;">
          <label class="form-label">Nama Lengkap Siswa:</label>
          <input type="text" id="modal-student-name" class="form-control" value="${student.name}" required>
        </div>

        <div class="grid-two-equal" style="gap:0.75rem; margin-bottom:0.9rem;">
          <div class="form-group">
            <label class="form-label">Nomor Induk Siswa (NIS):</label>
            <input type="text" id="modal-student-nis" class="form-control" value="${student.nis}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Kelas:</label>
            <select id="modal-student-kelas" class="form-control">
              <option value="XI TKJ 1" ${student.kelas === 'XI TKJ 1' ? 'selected' : ''}>XI TKJ 1</option>
              <option value="XI TKJ 2" ${student.kelas === 'XI TKJ 2' ? 'selected' : ''}>XI TKJ 2</option>
              <option value="XI TKJ 3" ${student.kelas === 'XI TKJ 3' ? 'selected' : ''}>XI TKJ 3</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:0.9rem;">
          <label class="form-label">Kata Sandi Masuk:</label>
          <input type="text" id="modal-student-pass" class="form-control" value="${student.password || '123'}" required>
        </div>

        <div class="grid-three-col" style="gap:0.75rem; margin-bottom:0.5rem;">
          <div class="form-group">
            <label class="form-label">Nilai Latihan (0-100):</label>
            <input type="number" id="modal-student-latihan" class="form-control" min="0" max="100" value="${student.latihanScore || 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Nilai Evaluasi (0-100):</label>
            <input type="number" id="modal-student-evaluasi" class="form-control" min="0" max="100" value="${student.evaluasiScore || 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Status Kelulusan:</label>
            <select id="modal-student-status" class="form-control">
              <option value="Belum Ujian" ${student.status === 'Belum Ujian' ? 'selected' : ''}>Belum Ujian</option>
              <option value="Tuntas" ${student.status === 'Tuntas' ? 'selected' : ''}>Tuntas KKM</option>
              <option value="Remedial" ${student.status === 'Remedial' ? 'selected' : ''}>Remedial</option>
            </select>
          </div>
        </div>
      </form>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="App.saveStudentFromModal(true, '${student.nis}')">💾 Perbarui Data</button>
    `;

    openModal();
  },

  saveStudentFromModal(isEdit, oldNis) {
    const nameEl = document.getElementById('modal-student-name');
    const nisEl = document.getElementById('modal-student-nis');
    const kelasEl = document.getElementById('modal-student-kelas');
    const passEl = document.getElementById('modal-student-pass');
    const latEl = document.getElementById('modal-student-latihan');
    const evalEl = document.getElementById('modal-student-evaluasi');
    const statusEl = document.getElementById('modal-student-status');

    const name = nameEl ? nameEl.value.trim() : '';
    const nis = nisEl ? nisEl.value.trim() : '';
    const kelas = kelasEl ? kelasEl.value : 'XI TKJ 1';
    const password = passEl ? passEl.value.trim() : '123';
    const latihanScore = latEl ? Number(latEl.value) : 0;
    const evaluasiScore = evalEl ? Number(evalEl.value) : 0;
    const status = statusEl ? statusEl.value : 'Belum Ujian';

    if (!name || !nis) {
      alert('Nama lengkap dan NIS wajib diisi!');
      return;
    }

    let res;
    if (isEdit) {
      res = NetLearnStore.updateStudent(oldNis, { name, nis, kelas, password, latihanScore, evaluasiScore, status });
    } else {
      res = NetLearnStore.addStudent({ name, nis, kelas, password, latihanScore, evaluasiScore, status });
    }

    if (!res.success) {
      alert(res.message);
      return;
    }

    closeModal();
    this.renderGuruLaporan();
    this.renderGuruDashboard();
    this.renderGuruDatabase();
    showToast(isEdit ? `Data siswa "${name}" berhasil diperbarui!` : `Siswa baru "${name}" berhasil ditambahkan!`, 'success');
  },

  openStudentDetailModal(nis) {
    const student = NetLearnStore.getStudentByNis(nis);
    if (!student) return;

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    const isPass = (student.evaluasiScore || 0) >= 75;

    modalTitle.textContent = `📋 Transkrip & Capaian Belajar: ${student.name}`;
    modalBody.innerHTML = `
      <div style="background:var(--color-bg-muted); border-radius:var(--radius-lg); padding:1.25rem; margin-bottom:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <h3 style="margin:0; font-size:1.2rem; color:var(--color-primary);">${student.name}</h3>
            <div style="font-size:0.82rem; color:var(--color-text-muted); margin-top:0.25rem;">
              NIS: <strong>${student.nis}</strong> • Kelas: <strong>${student.kelas || 'XI TKJ 1'}</strong> • SMK Negeri 3 Makassar
            </div>
          </div>
          <span class="badge ${student.status === 'Tuntas' ? 'badge-success' : (student.status === 'Remedial' ? 'badge-danger' : 'badge-secondary')}" style="font-size:0.85rem; padding:0.35rem 0.8rem;">
            ${student.status || 'Belum Ujian'}
          </span>
        </div>
      </div>

      <div class="grid-three-col" style="gap:0.85rem; margin-bottom:1.25rem;">
        <div class="card" style="padding:1rem;">
          <span style="font-size:0.7rem; font-weight:700; text-transform:uppercase; color:var(--color-text-muted);">Nilai Latihan</span>
          <div style="font-size:1.6rem; font-weight:800; color:var(--color-interactive); margin-top:0.2rem;">${student.latihanScore || 0}</div>
          <span style="font-size:0.73rem; color:var(--color-text-muted);">Skala 0 - 100</span>
        </div>

        <div class="card" style="padding:1rem;">
          <span style="font-size:0.7rem; font-weight:700; text-transform:uppercase; color:var(--color-text-muted);">Nilai Evaluasi Akhir</span>
          <div style="font-size:1.6rem; font-weight:800; color:${isPass ? 'var(--color-success)' : 'var(--color-danger)'}; margin-top:0.2rem;">
            ${student.evaluasiScore || 0}
          </div>
          <span style="font-size:0.73rem; color:var(--color-text-muted);">Standar KKM: 75</span>
        </div>

        <div class="card" style="padding:1rem;">
          <span style="font-size:0.7rem; font-weight:700; text-transform:uppercase; color:var(--color-text-muted);">Kata Sandi Akun</span>
          <div style="font-size:1.3rem; font-weight:800; color:var(--color-primary); margin-top:0.35rem;">
            <code>${student.password || '123'}</code>
          </div>
          <span style="font-size:0.73rem; color:var(--color-text-muted);">Kredensial Login Siswa</span>
        </div>
      </div>

      <div class="card" style="padding:1.25rem;">
        <strong style="font-size:0.9rem; color:var(--color-primary); display:block; margin-bottom:0.5rem;">Aksi Cepat Instruktur</strong>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="App.quickResetStudentPassword('${student.nis}')">
            🔑 Reset Kata Sandi ke "123"
          </button>
          <button class="btn btn-secondary btn-sm" onclick="App.quickResetStudentExam('${student.nis}')">
            🔄 Reset Status Ujian (Izinkan Remedial)
          </button>
        </div>
      </div>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
      <button class="btn btn-primary" onclick="closeModal(); App.openEditStudentModal('${student.nis}');">✏️ Edit Siswa Ini</button>
    `;

    openModal();
  },

  deleteStudentConfirm(nis) {
    const student = NetLearnStore.getStudentByNis(nis);
    if (!student) return;
    if (confirm(`Apakah Anda yakin ingin menghapus siswa "${student.name}" (NIS: ${student.nis}) dari database? Seluruh riwayat nilai akan terhapus permanen.`)) {
      NetLearnStore.deleteStudent(nis);
      this.renderGuruLaporan();
      this.renderGuruDashboard();
      this.renderGuruDatabase();
      showToast(`Siswa "${student.name}" berhasil dihapus dari database.`, 'info');
    }
  },

  quickResetStudentPassword(nis) {
    const res = NetLearnStore.resetStudentPassword(nis, '123');
    if (res.success) {
      this.renderGuruLaporan();
      this.renderGuruDatabase();
      showToast(res.message, 'success');
    }
  },

  quickResetStudentExam(nis) {
    if (confirm(`Reset status ujian siswa ini agar dapat mengulang ujian evaluasi akhir (Remedial)?`)) {
      const res = NetLearnStore.resetStudentExam(nis);
      if (res.success) {
        this.renderGuruLaporan();
        this.renderGuruDashboard();
        this.renderGuruDatabase();
        showToast(res.message, 'success');
      }
    }
  },

  // =========================================================================
  // MODAL HANDLERS: DATABASE BANK SOAL (ADD, EDIT, DELETE)
  // =========================================================================
  openAddQuestionModal() {
    const type = this.bankSoalActiveTab || 'latihan';
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    const typeLabel = type === 'latihan' ? 'Soal Latihan' : (type === 'eval_pg' ? 'Evaluasi Pilihan Ganda' : 'Evaluasi Uraian');
    modalTitle.textContent = `➕ Tambah Butir ${typeLabel} Baru`;

    if (type === 'latihan') {
      modalBody.innerHTML = `
        <form id="form-question-manage" onsubmit="event.preventDefault(); App.saveQuestionFromModal('latihan', false);">
          <div class="form-group" style="margin-bottom:0.9rem;">
            <label class="form-label">Teks Pertanyaan Soal:</label>
            <textarea id="modal-q-text" class="form-control" rows="3" placeholder="Tuliskan soal perhitungan atau konsep..." required></textarea>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.9rem;">
            <div class="form-group">
              <label class="form-label">Pilihan A:</label>
              <input type="text" id="modal-q-opt-A" class="form-control" placeholder="Teks pilihan A" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan B:</label>
              <input type="text" id="modal-q-opt-B" class="form-control" placeholder="Teks pilihan B" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan C:</label>
              <input type="text" id="modal-q-opt-C" class="form-control" placeholder="Teks pilihan C" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan D:</label>
              <input type="text" id="modal-q-opt-D" class="form-control" placeholder="Teks pilihan D" required>
            </div>
          </div>

          <div class="grid-two-equal" style="gap:0.75rem; margin-bottom:0.9rem;">
            <div class="form-group">
              <label class="form-label">Kunci Jawaban Benar:</label>
              <select id="modal-q-correct" class="form-control">
                <option value="A">Pilihan A</option>
                <option value="B">Pilihan B</option>
                <option value="C">Pilihan C</option>
                <option value="D">Pilihan D</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Catatan Video / Tip:</label>
              <input type="text" id="modal-q-video-note" class="form-control" placeholder="Contoh: Tinjau rumus 2^y-2">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Pembahasan Langkah Perhitungan:</label>
            <textarea id="modal-q-explanation" class="form-control" rows="2" placeholder="Langkah 1: ..., Langkah 2: ..."></textarea>
          </div>
        </form>
      `;
    } else if (type === 'eval_pg') {
      modalBody.innerHTML = `
        <form id="form-question-manage" onsubmit="event.preventDefault(); App.saveQuestionFromModal('eval_pg', false);">
          <div class="form-group" style="margin-bottom:0.9rem;">
            <label class="form-label">Teks Pertanyaan Evaluasi PG:</label>
            <textarea id="modal-q-text" class="form-control" rows="3" placeholder="Tuliskan soal evaluasi semester..." required></textarea>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.9rem;">
            <div class="form-group">
              <label class="form-label">Pilihan A (Index 0):</label>
              <input type="text" id="modal-q-opt-0" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan B (Index 1):</label>
              <input type="text" id="modal-q-opt-1" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan C (Index 2):</label>
              <input type="text" id="modal-q-opt-2" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan D (Index 3):</label>
              <input type="text" id="modal-q-opt-3" class="form-control" required>
            </div>
          </div>

          <div class="grid-two-equal" style="gap:0.75rem;">
            <div class="form-group">
              <label class="form-label">Kunci Jawaban Benar:</label>
              <select id="modal-q-correct" class="form-control">
                <option value="0">Pilihan A</option>
                <option value="1">Pilihan B</option>
                <option value="2">Pilihan C</option>
                <option value="3">Pilihan D</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Bobot Poin (Standar: 5):</label>
              <input type="number" id="modal-q-points" class="form-control" value="5" min="1" max="50">
            </div>
          </div>
        </form>
      `;
    } else {
      modalBody.innerHTML = `
        <form id="form-question-manage" onsubmit="event.preventDefault(); App.saveQuestionFromModal('eval_ur', false);">
          <div class="form-group" style="margin-bottom:0.9rem;">
            <label class="form-label">Teks Pertanyaan Uraian Analisis:</label>
            <textarea id="modal-q-text" class="form-control" rows="3" placeholder="Tuliskan pertanyaan studi kasus / uraian..." required></textarea>
          </div>

          <div class="form-group" style="margin-bottom:0.9rem;">
            <label class="form-label">Kata Kunci Penilaian Otomatis (Pisahkan dengan koma):</label>
            <input type="text" id="modal-q-keywords" class="form-control" placeholder="Contoh: subnet, network, broadcast, host" required>
            <span style="font-size:0.75rem; color:var(--color-text-muted);">Sistem memeriksa kecocokan kata kunci ini pada jawaban uraian siswa.</span>
          </div>

          <div class="form-group" style="margin-bottom:0.9rem;">
            <label class="form-label">Pedoman / Rubrik Penilaian:</label>
            <textarea id="modal-q-rubric" class="form-control" rows="2" placeholder="Kriteria jawaban lengkap peserta didik..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Bobot Poin (Standar: 5):</label>
            <input type="number" id="modal-q-points" class="form-control" value="5" min="1" max="50">
          </div>
        </form>
      `;
    }

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="App.saveQuestionFromModal('${type}', false)">💾 Simpan Butir Soal</button>
    `;

    openModal();
  },

  openEditQuestionModal(type, index) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    if (type === 'latihan') {
      const q = NetLearnStore.latihanQuestions[index];
      if (!q) return;

      modalTitle.textContent = `✏️ Edit Soal Latihan #${index + 1}`;
      const optA = q.options.find(o => o.key === 'A') || { text: '' };
      const optB = q.options.find(o => o.key === 'B') || { text: '' };
      const optC = q.options.find(o => o.key === 'C') || { text: '' };
      const optD = q.options.find(o => o.key === 'D') || { text: '' };
      const steps = q.explanation && q.explanation.steps ? (Array.isArray(q.explanation.steps) ? q.explanation.steps.join('\n') : q.explanation.steps) : '';

      modalBody.innerHTML = `
        <form id="form-question-manage" onsubmit="event.preventDefault(); App.saveQuestionFromModal('latihan', true, ${index});">
          <div class="form-group" style="margin-bottom:0.9rem;">
            <label class="form-label">Teks Pertanyaan Soal:</label>
            <textarea id="modal-q-text" class="form-control" rows="3" required>${q.question}</textarea>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.9rem;">
            <div class="form-group">
              <label class="form-label">Pilihan A:</label>
              <input type="text" id="modal-q-opt-A" class="form-control" value="${optA.text}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan B:</label>
              <input type="text" id="modal-q-opt-B" class="form-control" value="${optB.text}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan C:</label>
              <input type="text" id="modal-q-opt-C" class="form-control" value="${optC.text}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan D:</label>
              <input type="text" id="modal-q-opt-D" class="form-control" value="${optD.text}" required>
            </div>
          </div>

          <div class="grid-two-equal" style="gap:0.75rem; margin-bottom:0.9rem;">
            <div class="form-group">
              <label class="form-label">Kunci Jawaban Benar:</label>
              <select id="modal-q-correct" class="form-control">
                <option value="A" ${q.correctKey === 'A' ? 'selected' : ''}>Pilihan A</option>
                <option value="B" ${q.correctKey === 'B' ? 'selected' : ''}>Pilihan B</option>
                <option value="C" ${q.correctKey === 'C' ? 'selected' : ''}>Pilihan C</option>
                <option value="D" ${q.correctKey === 'D' ? 'selected' : ''}>Pilihan D</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Catatan Video / Tip:</label>
              <input type="text" id="modal-q-video-note" class="form-control" value="${(q.explanation && q.explanation.videoNote) || ''}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Pembahasan Langkah Perhitungan:</label>
            <textarea id="modal-q-explanation" class="form-control" rows="3">${steps}</textarea>
          </div>
        </form>
      `;
    } else if (type === 'eval_pg') {
      const q = NetLearnStore.evaluasiData.pgList[index];
      if (!q) return;

      modalTitle.textContent = `✏️ Edit Evaluasi PG #${index + 1}`;
      modalBody.innerHTML = `
        <form id="form-question-manage" onsubmit="event.preventDefault(); App.saveQuestionFromModal('eval_pg', true, ${index});">
          <div class="form-group" style="margin-bottom:0.9rem;">
            <label class="form-label">Teks Pertanyaan Evaluasi PG:</label>
            <textarea id="modal-q-text" class="form-control" rows="3" required>${q.text}</textarea>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.9rem;">
            <div class="form-group">
              <label class="form-label">Pilihan A (Index 0):</label>
              <input type="text" id="modal-q-opt-0" class="form-control" value="${q.options[0] || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan B (Index 1):</label>
              <input type="text" id="modal-q-opt-1" class="form-control" value="${q.options[1] || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan C (Index 2):</label>
              <input type="text" id="modal-q-opt-2" class="form-control" value="${q.options[2] || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Pilihan D (Index 3):</label>
              <input type="text" id="modal-q-opt-3" class="form-control" value="${q.options[3] || ''}" required>
            </div>
          </div>

          <div class="grid-two-equal" style="gap:0.75rem;">
            <div class="form-group">
              <label class="form-label">Kunci Jawaban Benar:</label>
              <select id="modal-q-correct" class="form-control">
                <option value="0" ${q.correct === 0 ? 'selected' : ''}>Pilihan A</option>
                <option value="1" ${q.correct === 1 ? 'selected' : ''}>Pilihan B</option>
                <option value="2" ${q.correct === 2 ? 'selected' : ''}>Pilihan C</option>
                <option value="3" ${q.correct === 3 ? 'selected' : ''}>Pilihan D</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Bobot Poin:</label>
              <input type="number" id="modal-q-points" class="form-control" value="${q.points || 5}" min="1" max="50">
            </div>
          </div>
        </form>
      `;
    } else {
      const q = NetLearnStore.evaluasiData.uraianList[index];
      if (!q) return;

      modalTitle.textContent = `✏️ Edit Evaluasi Uraian #${index + 1}`;
      modalBody.innerHTML = `
        <form id="form-question-manage" onsubmit="event.preventDefault(); App.saveQuestionFromModal('eval_ur', true, ${index});">
          <div class="form-group" style="margin-bottom:0.9rem;">
            <label class="form-label">Teks Pertanyaan Uraian Analisis:</label>
            <textarea id="modal-q-text" class="form-control" rows="3" required>${q.text}</textarea>
          </div>

          <div class="form-group" style="margin-bottom:0.9rem;">
            <label class="form-label">Kata Kunci Penilaian Otomatis (Pisahkan dengan koma):</label>
            <input type="text" id="modal-q-keywords" class="form-control" value="${(q.keywords || []).join(', ')}" required>
          </div>

          <div class="form-group" style="margin-bottom:0.9rem;">
            <label class="form-label">Pedoman / Rubrik Penilaian:</label>
            <textarea id="modal-q-rubric" class="form-control" rows="2">${q.rubric || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Bobot Poin:</label>
            <input type="number" id="modal-q-points" class="form-control" value="${q.points || 5}" min="1" max="50">
          </div>
        </form>
      `;
    }

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="App.saveQuestionFromModal('${type}', true, ${index})">💾 Simpan Perubahan</button>
    `;

    openModal();
  },

  saveQuestionFromModal(type, isEdit, index) {
    const textEl = document.getElementById('modal-q-text');
    const text = textEl ? textEl.value.trim() : '';
    if (!text) {
      alert('Teks pertanyaan wajib diisi!');
      return;
    }

    if (type === 'latihan') {
      const optA = document.getElementById('modal-q-opt-A').value.trim();
      const optB = document.getElementById('modal-q-opt-B').value.trim();
      const optC = document.getElementById('modal-q-opt-C').value.trim();
      const optD = document.getElementById('modal-q-opt-D').value.trim();
      const correct = document.getElementById('modal-q-correct').value;
      const note = document.getElementById('modal-q-video-note').value.trim();
      const exp = document.getElementById('modal-q-explanation').value.trim();

      const qData = {
        question: text,
        options: [
          { key: "A", text: optA },
          { key: "B", text: optB },
          { key: "C", text: optC },
          { key: "D", text: optD }
        ],
        correctKey: correct,
        explanation: {
          steps: exp ? exp.split('\n').filter(Boolean) : ["Pembahasan langkah perhitungan."],
          videoNote: note
        }
      };

      if (isEdit) {
        NetLearnStore.updateLatihanQuestion(index, qData);
      } else {
        NetLearnStore.addLatihanQuestion(qData);
      }
    } else if (type === 'eval_pg') {
      const opt0 = document.getElementById('modal-q-opt-0').value.trim();
      const opt1 = document.getElementById('modal-q-opt-1').value.trim();
      const opt2 = document.getElementById('modal-q-opt-2').value.trim();
      const opt3 = document.getElementById('modal-q-opt-3').value.trim();
      const correct = Number(document.getElementById('modal-q-correct').value);
      const points = Number(document.getElementById('modal-q-points').value) || 5;

      const qData = {
        text,
        options: [opt0, opt1, opt2, opt3],
        correct,
        points
      };

      if (isEdit) {
        NetLearnStore.updateEvaluasiQuestion('pg', index, qData);
      } else {
        NetLearnStore.addEvaluasiQuestion('pg', qData);
      }
    } else {
      const kw = document.getElementById('modal-q-keywords').value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const rubric = document.getElementById('modal-q-rubric').value.trim();
      const points = Number(document.getElementById('modal-q-points').value) || 5;

      const qData = {
        text,
        keywords: kw,
        rubric,
        points
      };

      if (isEdit) {
        NetLearnStore.updateEvaluasiQuestion('uraian', index, qData);
      } else {
        NetLearnStore.addEvaluasiQuestion('uraian', qData);
      }
    }

    closeModal();
    this.renderGuruBankSoal();
    this.renderGuruDatabase();
    showToast(isEdit ? 'Butir soal berhasil diperbarui!' : 'Butir soal baru berhasil disimpan ke bank soal!', 'success');
  },

  deleteQuestionConfirm(type, index) {
    if (confirm('Hapus butir soal ini dari bank soal?')) {
      if (type === 'latihan') {
        NetLearnStore.deleteLatihanQuestion(index);
      } else if (type === 'eval_pg') {
        NetLearnStore.deleteEvaluasiQuestion('pg', index);
      } else {
        NetLearnStore.deleteEvaluasiQuestion('uraian', index);
      }
      this.renderGuruBankSoal();
      this.renderGuruDatabase();
      showToast('Butir soal berhasil dihapus dari bank soal.', 'info');
    }
  },

  resetBankSoalConfirm() {
    if (confirm('Kembalikan seluruh bank soal latihan dan evaluasi ke standar kurikulum awal SMK Negeri 3 Makassar?')) {
      NetLearnStore.resetBankSoal();
      this.renderGuruBankSoal();
      this.renderGuruDatabase();
      showToast('Bank soal berhasil direset ke standar kurikulum.', 'success');
    }
  },

  // =========================================================================
  // BACKUP & RESTORE DATABASE HANDLERS
  // =========================================================================
  exportDatabaseBackup() {
    const jsonStr = NetLearnStore.exportDatabaseJSON();
    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netlearn_smk3_database_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Cadangan Database NetLearn (.JSON) berhasil diunduh!', 'success');
  },

  triggerDatabaseImportFile() {
    const input = document.getElementById('db-file-input');
    if (input) input.click();
  },

  handleDatabaseFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const res = NetLearnStore.importDatabaseJSON(content);
      if (res.success) {
        showToast(res.message, 'success');
        this.renderGuruDatabase();
        this.renderGuruLaporan();
        this.renderGuruBankSoal();
        this.renderGuruCMSMateri();
        this.renderGuruDashboard();
        this.renderBeranda();
      } else {
        alert(res.message);
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  },

  seedFullDatabaseDemo() {
    if (confirm('Muat paket data demo standar SMK Negeri 3 Makassar (Siswa kelas XI TKJ 1, 2, 3, modul lengkap pengalamatan, dan bank soal)?')) {
      NetLearnStore.seedFullDatabase();
      this.renderGuruDatabase();
      this.renderGuruLaporan();
      this.renderGuruBankSoal();
      this.renderGuruCMSMateri();
      this.renderGuruDashboard();
      this.renderBeranda();
      showToast('Paket Database Lengkap SMK Negeri 3 Makassar berhasil dimuat!', 'success');
    }
  }
};

// Global UI Helper Functions
function openModal() {
  const modal = document.getElementById('global-modal');
  if (modal) modal.classList.add('open');
}

function closeModal() {
  const modal = document.getElementById('global-modal');
  if (modal) modal.classList.remove('open');
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  let iconSvg = '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#2563EB;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  if (type === 'success') {
    iconSvg = '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#16A34A;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>';
  } else if (type === 'error' || type === 'danger') {
    iconSvg = '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#DC2626;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  } else if (type === 'warning') {
    iconSvg = '<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:#D97706;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  }

  toast.innerHTML = `
    <span style="display:flex; align-items:center;">${iconSvg}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

window.App = App;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;

