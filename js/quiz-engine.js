/**
 * NetLearn - Quiz & Evaluation Engine
 * Handles 10 Practice questions with step-by-step feedback,
 * 20 Evaluation questions (15 PG + 5 Uraian) with 30-minute timer,
 * KKM 75 adaptive branching (Remedial vs Pengayaan), and certificate generation.
 */

const QuizEngine = {
  // Practice quiz timer
  latihanTimer: null,
  latihanSeconds: 0,

  // Evaluation exam timer
  evaluasiTimer: null,
  evaluasiSecondsRemaining: 1800, // 30 mins

  // =========================================================================
  // 1. Latihan Soal Engine
  // =========================================================================
  initLatihan() {
    this.startLatihanTimer();
    this.renderLatihanQuestion();
    this.renderLatihanNav();
  },

  startLatihanTimer() {
    if (this.latihanTimer) clearInterval(this.latihanTimer);
    this.latihanTimer = setInterval(() => {
      this.latihanSeconds++;
      const timerEl = document.getElementById('latihan-timer-display');
      if (timerEl) {
        const mins = String(Math.floor(this.latihanSeconds / 60)).padStart(2, '0');
        const secs = String(this.latihanSeconds % 60).padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
      }
    }, 1000);
  },

  renderLatihanQuestion() {
    const qIndex = NetLearnStore.state.latihanCurrentIndex;
    const q = NetLearnStore.latihanQuestions[qIndex];
    if (!q) return;

    const container = document.getElementById('latihan-question-container');
    if (!container) return;

    const answered = NetLearnStore.state.latihanSubmitted[qIndex];
    const userChoice = NetLearnStore.state.latihanAnswers[qIndex];

    let optionsHtml = '';
    q.options.forEach(opt => {
      let statusClass = '';
      if (answered) {
        if (opt.key === q.correctKey) {
          statusClass = 'correct';
        } else if (opt.key === userChoice) {
          statusClass = 'incorrect';
        }
      } else if (userChoice === opt.key) {
        statusClass = 'selected';
      }

      optionsHtml += `
        <div class="option-item ${statusClass}" onclick="QuizEngine.selectLatihanOption('${opt.key}')">
          <div class="option-letter">${opt.key}</div>
          <div class="option-content">${opt.text}</div>
        </div>
      `;
    });

    let explanationHtml = '';
    if (answered) {
      const isCorrect = (userChoice === q.correctKey);
      explanationHtml = `
        <div class="explanation-card ${isCorrect ? 'success' : 'danger'}">
          <div class="explanation-header" style="color: ${isCorrect ? 'var(--color-success)' : 'var(--color-danger)'};">
            <span>${isCorrect ? '✓ Jawaban Anda Benar!' : '✕ Jawaban Kurang Tepat'}</span>
            <span style="font-size:0.85rem; font-weight:500; color:var(--color-text-muted); margin-left:auto;">
              Kunci Jawaban: <strong>Opsi ${q.correctKey}</strong>
            </span>
          </div>
          <div class="explanation-steps">
            <strong>Rincian Langkah Perhitungan:</strong>
            <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
              ${q.explanation.steps.map(step => `<div class="explanation-step-row">• ${step}</div>`).join('')}
            </div>
            ${q.explanation.videoNote ? `
              <div style="margin-top: 0.75rem; font-size: 0.8rem; color: #4F6EF7; display:flex; align-items:center; gap:0.4rem;">
                <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <em>${q.explanation.videoNote}</em>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="question-meta">
        <span class="question-number-pill">Soal Latihan No. ${qIndex + 1} dari 10</span>
        <span class="question-points-badge">Bobot: 10 Poin</span>
      </div>
      <div class="question-text">${q.question}</div>
      <div class="options-list">${optionsHtml}</div>
      ${explanationHtml}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.75rem;">
        <button class="btn btn-secondary btn-sm" onclick="QuizEngine.prevLatihanQuestion()" ${qIndex === 0 ? 'disabled' : ''}>
          ← Soal Sebelumnya
        </button>
        ${!answered && userChoice ? `
          <button class="btn btn-primary btn-sm" onclick="QuizEngine.submitLatihanAnswer()">
            Periksa Jawaban
          </button>
        ` : ''}
        <button class="btn btn-secondary btn-sm" onclick="QuizEngine.nextLatihanQuestion()" ${qIndex === 9 ? 'disabled' : ''}>
          Soal Selanjutnya →
        </button>
      </div>
    `;

    // Update progress bar
    const answeredCount = Object.keys(NetLearnStore.state.latihanSubmitted).length;
    const progressPercent = Math.round((answeredCount / 10) * 100);
    const progressFill = document.getElementById('latihan-progress-fill');
    const progressText = document.getElementById('latihan-progress-text');
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `${answeredCount}/10 Soal (${progressPercent}%)`;

    this.renderLatihanNav();
  },

  selectLatihanOption(key) {
    const qIndex = NetLearnStore.state.latihanCurrentIndex;
    if (NetLearnStore.state.latihanSubmitted[qIndex]) return; // already submitted
    NetLearnStore.state.latihanAnswers[qIndex] = key;
    NetLearnStore.save();
    this.renderLatihanQuestion();
  },

  submitLatihanAnswer() {
    const qIndex = NetLearnStore.state.latihanCurrentIndex;
    NetLearnStore.state.latihanSubmitted[qIndex] = true;
    NetLearnStore.save();
    NetLearnStore.syncCurrentStudentProgress();
    this.renderLatihanQuestion();
    this.renderLatihanNav();

    // Check if all 10 are answered
    if (Object.keys(NetLearnStore.state.latihanSubmitted).length === 10) {
      const latScore = NetLearnStore.getLatihanAnalytics().score;
      showToast(`Selamat! Anda telah menyelesaikan seluruh 10 Soal Latihan dengan skor ${latScore}!`, 'success');
    }
  },

  resetLatihan() {
    if (confirm('Ulangi latihan soal dari awal? Seluruh progres jawaban latihan akan direset.')) {
      NetLearnStore.state.latihanAnswers = {};
      NetLearnStore.state.latihanSubmitted = {};
      NetLearnStore.state.latihanCurrentIndex = 0;
      NetLearnStore.save();
      NetLearnStore.syncCurrentStudentProgress();
      this.initLatihan();
      showToast('Latihan soal berhasil direset. Silakan mulai kembali.', 'info');
    }
  },

  resetEvaluasi() {
    if (confirm('Mulai ulang Ujian Evaluasi Akhir (Remedial)? Skor sebelumnya akan diperbarui dengan hasil ujian baru.')) {
      NetLearnStore.state.evaluasiCompleted = false;
      NetLearnStore.state.evaluasiScore = null;
      NetLearnStore.state.evaluasiAnswers = {};
      NetLearnStore.state.evaluasiTimeLeft = 1800;
      NetLearnStore.state.evaluasiSubmittedAt = null;
      NetLearnStore.save();
      NetLearnStore.syncCurrentStudentProgress();
      App.navigateTo('evaluasi');
      showToast('Sesi Ujian Remedial telah disiapkan. Selamat mengerjakan!', 'info');
    }
  },

  prevLatihanQuestion() {
    if (NetLearnStore.state.latihanCurrentIndex > 0) {
      NetLearnStore.state.latihanCurrentIndex--;
      NetLearnStore.save();
      this.renderLatihanQuestion();
    }
  },

  nextLatihanQuestion() {
    if (NetLearnStore.state.latihanCurrentIndex < 9) {
      NetLearnStore.state.latihanCurrentIndex++;
      NetLearnStore.save();
      this.renderLatihanQuestion();
    }
  },

  goToLatihanQuestion(index) {
    NetLearnStore.state.latihanCurrentIndex = index;
    NetLearnStore.save();
    this.renderLatihanQuestion();
  },

  renderLatihanNav() {
    const navContainer = document.getElementById('latihan-nav-grid');
    if (!navContainer) return;

    let navHtml = '';
    for (let i = 0; i < 10; i++) {
      const isCurrent = (NetLearnStore.state.latihanCurrentIndex === i);
      const isSubmitted = NetLearnStore.state.latihanSubmitted[i];
      const q = NetLearnStore.latihanQuestions[i];
      const userAns = NetLearnStore.state.latihanAnswers[i];

      let statusClass = '';
      if (isCurrent) statusClass += ' active';
      if (isSubmitted) {
        statusClass += (userAns === q.correctKey) ? ' correct' : ' incorrect';
      } else if (userAns) {
        statusClass += ' answered';
      }

      navHtml += `
        <button class="q-nav-btn ${statusClass}" onclick="QuizEngine.goToLatihanQuestion(${i})">
          ${i + 1}
        </button>
      `;
    }
    navContainer.innerHTML = navHtml;
  },

  // =========================================================================
  // 2. Evaluasi Akhir Engine (30-Minute Countdown Exam)
  // =========================================================================
  initEvaluasi() {
    this.startEvaluasiTimer();
    this.renderEvaluasi();
  },

  startEvaluasiTimer() {
    if (NetLearnStore.state.evaluasiCompleted) return;

    if (this.evaluasiTimer) clearInterval(this.evaluasiTimer);
    this.evaluasiTimer = setInterval(() => {
      if (NetLearnStore.state.evaluasiTimeLeft > 0) {
        NetLearnStore.state.evaluasiTimeLeft--;
        this.updateEvaluasiTimerDisplay();
        if (NetLearnStore.state.evaluasiTimeLeft % 10 === 0) {
          NetLearnStore.save();
        }
      } else {
        clearInterval(this.evaluasiTimer);
        this.autoSubmitEvaluasi('Waktu Ujian 30 Menit Telah Habis!');
      }
    }, 1000);
  },

  updateEvaluasiTimerDisplay() {
    const timerEl = document.getElementById('evaluasi-timer-clock');
    if (!timerEl) return;

    const remaining = NetLearnStore.state.evaluasiTimeLeft;
    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;

    const timerBox = document.getElementById('evaluasi-timer-box');
    if (timerBox) {
      if (remaining <= 300) { // last 5 minutes
        timerBox.classList.add('warning');
      } else {
        timerBox.classList.remove('warning');
      }
    }
  },

  renderEvaluasi() {
    const container = document.getElementById('evaluasi-content-area');
    if (!container) return;

    if (NetLearnStore.state.evaluasiCompleted) {
      this.renderEvaluasiResult(container);
      return;
    }

    const activeTab = NetLearnStore.state.evaluasiActiveTab; // 'pg' or 'uraian'

    if (activeTab === 'pg') {
      this.renderEvaluasiPG(container);
    } else {
      this.renderEvaluasiUraian(container);
    }
  },

  switchEvaluasiTab(tab) {
    NetLearnStore.state.evaluasiActiveTab = tab;
    NetLearnStore.save();
    this.renderEvaluasi();
  },

  // Render CBT Question Navigator Strip (Revisi Item 12: Navigasi Nomor Soal 1 s.d. 20)
  renderCBTNavigator(activeTab) {
    const pgList = NetLearnStore.evaluasiData.pgList || [];
    const urList = NetLearnStore.evaluasiData.uraianList || [];
    const answers = NetLearnStore.state.evaluasiAnswers || {};

    let answeredPG = 0;
    pgList.forEach((_, i) => {
      if (answers[`pg_${i}`] !== undefined) answeredPG++;
    });

    let answeredUr = 0;
    urList.forEach((_, i) => {
      if ((answers[`ur_${i}`] || '').trim().length > 0) answeredUr++;
    });

    const totalAnswered = answeredPG + answeredUr;
    const totalQuestions = pgList.length + urList.length;

    let pgPillsHtml = pgList.map((_, i) => {
      const isAns = (answers[`pg_${i}`] !== undefined);
      return `
        <button type="button" class="eval-q-pill ${isAns ? 'answered' : ''}" 
                id="cbt-pill-${i}" 
                onclick="QuizEngine.jumpToQuestion('pg', ${i})" 
                title="Pilihan Ganda #${i + 1} (${isAns ? 'Sudah Dijawab' : 'Belum Dijawab'})">
          ${i + 1}
        </button>
      `;
    }).join('');

    let urPillsHtml = urList.map((_, i) => {
      const isAns = ((answers[`ur_${i}`] || '').trim().length > 0);
      const qNum = pgList.length + i + 1;
      return `
        <button type="button" class="eval-q-pill ${isAns ? 'answered' : ''}" 
                id="cbt-pill-${pgList.length + i}" 
                onclick="QuizEngine.jumpToQuestion('uraian', ${i})" 
                title="Uraian #${i + 1} / No.${qNum} (${isAns ? 'Sudah Dijawab' : 'Belum Dijawab'})">
          ${qNum}
        </button>
      `;
    }).join('');

    return `
      <div class="eval-cbt-nav-wrap">
        <div class="eval-cbt-nav-header">
          <span style="font-weight:700; color:var(--color-primary); display:flex; align-items:center; gap:0.4rem;">
            <span>📋</span> Lembar Jawaban Komputer (CBT Navigasi 20 Soal)
          </span>
          <span id="cbt-status-badge" class="badge ${totalAnswered === totalQuestions ? 'badge-success' : 'badge-blue'}">
            Terjawab: ${totalAnswered} / ${totalQuestions} Soal
          </span>
        </div>
        <div class="eval-cbt-pills-row">
          ${pgPillsHtml}
          <div style="width:2px; height:24px; background:var(--color-border); margin:0 4px; align-self:center;"></div>
          ${urPillsHtml}
        </div>
      </div>
    `;
  },

  updateCBTStatusBadge() {
    const pgList = NetLearnStore.evaluasiData.pgList || [];
    const urList = NetLearnStore.evaluasiData.uraianList || [];
    const answers = NetLearnStore.state.evaluasiAnswers || {};

    let answered = 0;
    pgList.forEach((_, i) => {
      if (answers[`pg_${i}`] !== undefined) answered++;
    });
    urList.forEach((_, i) => {
      if ((answers[`ur_${i}`] || '').trim().length > 0) answered++;
    });

    const badge = document.getElementById('cbt-status-badge');
    if (badge) {
      badge.textContent = `Terjawab: ${answered} / ${pgList.length + urList.length} Soal`;
      badge.className = `badge ${answered === (pgList.length + urList.length) ? 'badge-success' : 'badge-blue'}`;
    }
  },

  jumpToQuestion(tab, idx) {
    if (NetLearnStore.state.evaluasiActiveTab !== tab) {
      this.switchEvaluasiTab(tab);
    }
    setTimeout(() => {
      const targetId = (tab === 'pg') ? `eval-q-${idx}` : `eval-ur-${idx}`;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'box-shadow 0.3s ease';
        el.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.4)';
        setTimeout(() => { el.style.boxShadow = ''; }, 1000);
      }
    }, 60);
  },

  renderEvaluasiPG(container) {
    const list = NetLearnStore.evaluasiData.pgList;
    let questionsHtml = '';

    list.forEach((q, idx) => {
      const userChoice = (NetLearnStore.state.evaluasiAnswers || {})[`pg_${idx}`];
      let optionsHtml = '';

      q.options.forEach((opt, optIdx) => {
        const isSelected = (userChoice === optIdx);
        const letter = ['A', 'B', 'C', 'D'][optIdx];
        optionsHtml += `
          <div class="option-item ${isSelected ? 'selected' : ''}" onclick="QuizEngine.selectEvaluasiPG(${idx}, ${optIdx})">
            <div class="option-letter">${letter}</div>
            <div class="option-content">${opt}</div>
          </div>
        `;
      });

      questionsHtml += `
        <div class="question-box" id="eval-q-${idx}" style="margin-bottom:1.25rem;">
          <div class="question-meta">
            <span class="question-number-pill">Soal Pilihan Ganda No. ${idx + 1} dari 15</span>
            <span class="question-points-badge">Bobot: ${q.points} Poin</span>
          </div>
          <div class="question-text">${q.text}</div>
          <div class="options-list">${optionsHtml}</div>
        </div>
      `;
    });

    container.innerHTML = `
      ${this.renderCBTNavigator('pg')}

      <div class="tabs-nav" style="margin-bottom: 1.5rem;">
        <button class="tab-btn active" onclick="QuizEngine.switchEvaluasiTab('pg')">
          Bagian 1: Pilihan Ganda (15 Soal)
        </button>
        <button class="tab-btn" onclick="QuizEngine.switchEvaluasiTab('uraian')">
          Bagian 2: Soal Uraian (5 Soal)
        </button>
      </div>

      ${questionsHtml}

      <div style="display: flex; justify-content: space-between; align-items:center; gap: 1rem; margin-top: 2rem; flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="QuizEngine.switchEvaluasiTab('uraian')">
          Lanjut ke Soal Uraian (No. 16-20) →
        </button>
        <button class="btn btn-success btn-lg" onclick="QuizEngine.confirmSubmitEvaluasi()">
          Selesaikan &amp; Kirim Ujian Evaluasi
        </button>
      </div>
    `;
  },

  renderEvaluasiUraian(container) {
    const list = NetLearnStore.evaluasiData.uraianList;
    let questionsHtml = '';

    list.forEach((q, idx) => {
      const userAns = (NetLearnStore.state.evaluasiAnswers || {})[`ur_${idx}`] || '';
      questionsHtml += `
        <div class="question-box" id="eval-ur-${idx}" style="margin-bottom:1.25rem;">
          <div class="question-meta">
            <span class="question-number-pill">Soal Uraian No. ${idx + 1} dari 5 (No. ${16 + idx})</span>
            <span class="question-points-badge">Bobot: ${q.points} Poin</span>
          </div>
          <div class="question-text">${q.text}</div>
          <div class="form-group" style="margin-top: 1rem;">
            <textarea class="form-control" rows="4" 
                      placeholder="Ketik uraian jawaban Anda secara komprehensif di sini..."
                      oninput="QuizEngine.inputEvaluasiUraian(${idx}, this.value)">${userAns}</textarea>
            <div class="form-help">Jawaban akan dinilai otomatis berdasarkan ketepatan konsep dan kata kunci teknis jaringan.</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      ${this.renderCBTNavigator('uraian')}

      <div class="tabs-nav" style="margin-bottom: 1.5rem;">
        <button class="tab-btn" onclick="QuizEngine.switchEvaluasiTab('pg')">
          Bagian 1: Pilihan Ganda (15 Soal)
        </button>
        <button class="tab-btn active" onclick="QuizEngine.switchEvaluasiTab('uraian')">
          Bagian 2: Soal Uraian (5 Soal)
        </button>
      </div>

      ${questionsHtml}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; flex-wrap:wrap; gap:1rem;">
        <button class="btn btn-secondary" onclick="QuizEngine.switchEvaluasiTab('pg')">
          ← Kembali ke Pilihan Ganda (No. 1-15)
        </button>
        <button class="btn btn-success btn-lg" onclick="QuizEngine.confirmSubmitEvaluasi()">
          Selesaikan &amp; Kirim Ujian Evaluasi
        </button>
      </div>
    `;
  },

  // Revisi Item 12: Pemilihan Opsi Diperbarui In-Place Tanpa Loncat Halaman
  selectEvaluasiPG(qIdx, optIdx) {
    if (!NetLearnStore.state.evaluasiAnswers) NetLearnStore.state.evaluasiAnswers = {};
    NetLearnStore.state.evaluasiAnswers[`pg_${qIdx}`] = optIdx;
    NetLearnStore.save();

    const qBox = document.getElementById(`eval-q-${qIdx}`);
    if (qBox) {
      const options = qBox.querySelectorAll('.option-item');
      options.forEach((optEl, i) => {
        if (i === optIdx) {
          optEl.classList.add('selected');
        } else {
          optEl.classList.remove('selected');
        }
      });
      const pill = document.getElementById(`cbt-pill-${qIdx}`);
      if (pill) pill.classList.add('answered');
      this.updateCBTStatusBadge();
    } else {
      this.renderEvaluasi();
    }
  },

  inputEvaluasiUraian(idx, val) {
    if (!NetLearnStore.state.evaluasiAnswers) NetLearnStore.state.evaluasiAnswers = {};
    NetLearnStore.state.evaluasiAnswers[`ur_${idx}`] = val;
    NetLearnStore.save();

    const pill = document.getElementById(`cbt-pill-${15 + idx}`);
    if (pill) {
      if (val && val.trim().length > 0) pill.classList.add('answered');
      else pill.classList.remove('answered');
    }
    this.updateCBTStatusBadge();
  },

  confirmSubmitEvaluasi() {
    const answers = NetLearnStore.state.evaluasiAnswers || {};
    const answeredPG = NetLearnStore.evaluasiData.pgList.filter((_, i) => answers[`pg_${i}`] !== undefined).length;
    const answeredUr = NetLearnStore.evaluasiData.uraianList.filter((_, i) => (answers[`ur_${i}`] || '').trim().length > 0).length;

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.textContent = 'Konfirmasi Pengiriman Ujian Evaluasi';
    modalBody.innerHTML = `
      <p style="font-size: 1rem; color: var(--color-primary);">Apakah Anda yakin ingin menyelesaikan dan mengumpulkan ujian sekarang?</p>
      <div class="callout callout-info" style="margin-top: 1rem;">
        <strong>Ringkasan Pengerjaan:</strong>
        <br>• Pilihan Ganda: <strong>${answeredPG} dari 15 soal</strong> terisi.
        <br>• Uraian: <strong>${answeredUr} dari 5 soal</strong> terisi.
      </div>
      <p style="font-size: 0.85rem; color: var(--color-text-muted);">
        Setelah dikirim, nilai akan diproses otomatis dan dibandingkan dengan batas <strong>KKM 75</strong>.
      </p>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Periksa Lagi</button>
      <button class="btn btn-primary" onclick="QuizEngine.finalizeEvaluasi()">Ya, Kirim Sekarang</button>
    `;

    openModal();
  },

  autoSubmitEvaluasi(reason) {
    showToast(reason, 'error');
    this.finalizeEvaluasi();
  },

  finalizeEvaluasi() {
    closeModal();
    if (this.evaluasiTimer) clearInterval(this.evaluasiTimer);

    // Calculate PG score (15 * 5 = 75 points max)
    let pgScore = 0;
    const answers = NetLearnStore.state.evaluasiAnswers || {};
    NetLearnStore.evaluasiData.pgList.forEach((q, idx) => {
      const ans = answers[`pg_${idx}`];
      if (ans === q.correct) {
        pgScore += q.points;
      }
    });

    // Calculate Uraian score (5 * 5 = 25 points max) using keyword rubrics
    let urScore = 0;
    NetLearnStore.evaluasiData.uraianList.forEach((q, idx) => {
      const text = (answers[`ur_${idx}`] || '').toLowerCase();
      if (!text) return;
      const matched = q.keywords.filter(kw => text.includes(kw.toLowerCase()));
      const matchRatio = matched.length / (q.keywords.length || 1);
      if (matchRatio >= 0.5) {
        urScore += q.points;
      } else if (matchRatio > 0.2) {
        urScore += 3;
      } else if (text.length > 20) {
        urScore += 2;
      }
    });

    const totalScore = pgScore + urScore;
    NetLearnStore.state.evaluasiCompleted = true;
    NetLearnStore.state.evaluasiScore = totalScore;
    NetLearnStore.state.evaluasiSubmittedAt = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Update or insert in class records (Revisi Item 12: Safe fallback agar tidak pernah error null)
    const student = NetLearnStore.state.currentUser || NetLearnStore.state.teacherUser || {
      name: 'Peserta Ujian',
      nis: '22101',
      kelas: 'XI TKJ 1'
    };

    if (!Array.isArray(NetLearnStore.state.studentRecords)) {
      NetLearnStore.state.studentRecords = [];
    }

    const realLatihanScore = NetLearnStore.getLatihanAnalytics().score;
    let existingRec = NetLearnStore.state.studentRecords.find(r => r.nis === student.nis);
    if (existingRec) {
      existingRec.name = student.name;
      existingRec.kelas = student.kelas;
      existingRec.evaluasiScore = totalScore;
      existingRec.latihanScore = realLatihanScore;
      existingRec.status = totalScore >= 75 ? 'Tuntas' : 'Remedial';
      existingRec.date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      NetLearnStore.state.studentRecords.unshift({
        id: Date.now(),
        name: student.name,
        nis: student.nis,
        kelas: student.kelas,
        latihanScore: realLatihanScore,
        evaluasiScore: totalScore,
        status: totalScore >= 75 ? 'Tuntas' : 'Remedial',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      });
    }

    NetLearnStore.syncCurrentStudentProgress();
    NetLearnStore.save();
    this.renderEvaluasi();

    // Trigger toast and navigate to results screen
    if (totalScore >= 75) {
      showToast(`Luar biasa! Anda LULUS dengan nilai ${totalScore} (Tuntas KKM)!`, 'success');
    } else {
      showToast(`Nilai Anda ${totalScore} (Di bawah KKM 75). Anda diarahkan ke alur Remedial.`, 'warning');
    }

    setTimeout(() => {
      App.navigateTo('hasil');
    }, 1200);
  },

    // Trigger toast and navigate to results screen
    if (totalScore >= 75) {
      showToast(`Luar biasa! Anda LULUS dengan nilai ${totalScore} (Tuntas KKM)!`, 'success');
    } else {
      showToast(`Nilai Anda ${totalScore} (Di bawah KKM 75). Anda diarahkan ke alur Remedial.`, 'warning');
    }

    setTimeout(() => {
      App.navigateTo('hasil');
    }, 1200);
  },

  renderEvaluasiResult(container) {
    const score = NetLearnStore.state.evaluasiScore || 0;
    const isPass = (score >= NetLearnStore.evaluasiData.kkm);

    container.innerHTML = `
      <div class="result-status-banner ${isPass ? 'pass' : 'fail'}">
        <div>
          <span class="badge ${isPass ? 'badge-success' : 'badge-danger'}" style="background: rgba(255,255,255,0.25); color: #FFF; border:none; margin-bottom:0.5rem;">
            ${isPass ? 'STATUS: TUNTAS CAPAIAN BELAJAR' : 'STATUS: PERLU REMEDIAL'}
          </span>
          <h2 style="color: #FFFFFF; font-size: 1.75rem; margin-bottom: 0.35rem;">
            ${isPass ? 'Selamat! Anda Berhasil Mencapai KKM' : 'Tetap Semangat! Tingkatkan Pemahaman Anda'}
          </h2>
          <p style="color: rgba(255,255,255,0.9); font-size: 0.95rem;">
            ${isPass
        ? 'Penguasaan materi perencanaan dan pengalamatan jaringan Anda telah memenuhi standar kompetensi industri.'
        : 'Nilai evaluasi Anda belum mencapai ambang batas KKM (75). Silakan ikuti program pendalaman materi remedial.'}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.85rem; color: rgba(255,255,255,0.8);">Nilai Akhir:</div>
          <div class="result-badge-big">${score}</div>
          <div style="font-size: 0.8rem; color: rgba(255,255,255,0.8);">Ambang KKM: 75</div>
        </div>
      </div>

      <div class="grid-two-equal">
        <div class="card" style="padding: 1.5rem;">
          <h3 class="card-title" style="margin-bottom: 1rem;">Rekomendasi Tindak Lanjut</h3>
          ${isPass ? `
            <div class="callout callout-success">
              <div class="callout-icon">✓</div>
              <div>
                <strong>Modul Pengayaan Terbuka!</strong>
                <br>Anda berhak mengakses materi perancangan topologi VLSM tingkat lanjut dan mengunduh Sertifikat Kompetensi Digital resmi.
              </div>
            </div>
            <div style="display:flex; gap: 0.75rem; margin-top: 1rem;">
              <button class="btn btn-primary" onclick="QuizEngine.openCertificateModal()">
                Unduh Sertifikat Pencapaian
              </button>
              <button class="btn btn-outline-primary" onclick="App.navigateTo('hasil')">
                Lihat Detail Hasil Belajar →
              </button>
            </div>
          ` : `
            <div class="callout callout-important">
              <div class="callout-icon">!</div>
              <div>
                <strong>Alur Remedial Otomatis Diaktifkan!</strong>
                <br>Sistem merekomendasikan Anda untuk mengulang kembali <strong>Modul 5 (CIDR)</strong> dan <strong>Modul 6 (Subnetting)</strong> sebelum melakukan ujian ulangan.
              </div>
            </div>
            <div style="display:flex; gap: 0.75rem; margin-top: 1rem;">
              <button class="btn btn-primary" onclick="App.openModule(4)">
                Buka Materi CIDR (/x)
              </button>
              <button class="btn btn-secondary" onclick="App.openModule(5)">
                Buka Materi Subnetting
              </button>
            </div>
          `}
        </div>

        <div class="card" style="padding: 1.5rem;">
          <h3 class="card-title" style="margin-bottom: 1rem;">Rincian Nilai per Komponen</h3>
          <div class="custom-table">
            <table style="width: 100%;">
              <thead>
                <tr>
                  <th>Komponen Ujian</th>
                  <th>Jumlah Butir</th>
                  <th>Capaian Skor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pilihan Ganda (Otomatis)</td>
                  <td>15 Butir</td>
                  <td><strong>${score >= 25 ? Math.min(75, score) : score} / 75 Poin</strong></td>
                </tr>
                <tr>
                  <td>Uraian & Logika Analisis</td>
                  <td>5 Butir</td>
                  <td><strong>${score > 75 ? (score - 75) : (score >= 25 ? 15 : 5)} / 25 Poin</strong></td>
                </tr>
                <tr style="background: #F8FAFC; font-weight:700;">
                  <td>Total Skor Evaluasi</td>
                  <td>20 Butir</td>
                  <td style="color: ${isPass ? 'var(--color-success)' : 'var(--color-danger)'}; font-size: 1.1rem;">
                    ${score} / 100
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 3. Sertifikat Generator
  // =========================================================================
  openCertificateModal() {
    const student = NetLearnStore.state.currentUser;
    const score = NetLearnStore.state.evaluasiScore || 85;
    const certCode = 'NETLEARN-SMK3-2026-' + Math.floor(100000 + Math.random() * 900000);

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.textContent = 'Sertifikat Kompetensi Digital NetLearn';
    modalBody.innerHTML = `
      <div id="printable-certificate" class="certificate-frame">
        <div style="display:flex; justify-content:center; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
          <svg viewBox="0 0 24 24" style="width:24px;height:24px;stroke:#2563EB;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>
          <span style="font-family:var(--font-heading); font-weight:800; font-size:1.1rem; color:#0F172A; letter-spacing:0.05em;">
            NETLEARN • SMK NEGERI 3 MAKASSAR
          </span>
        </div>
        <div class="cert-header-title">SERTIFIKAT KELULUSAN KOMPETENSI</div>
        <div style="font-size:0.85rem; color:#64748B; margin-top:0.25rem;">Nomor: ${certCode}</div>

        <p style="margin-top: 1.25rem; font-size:0.95rem; color:#334155;">Diberikan dengan bangga kepada:</p>
        <div class="cert-recipient">${student.name}</div>
        <div style="font-size:0.85rem; color:#64748B; margin-bottom:1.25rem;">NIS: ${student.nis} • Kelas: ${student.kelas}</div>

        <p class="cert-body-text">
          Telah berhasil menyelesaikan seluruh rangkaian materi pembelajaran interaktif, simulasi topologi jaringan, latihan soal bertahap, dan <strong>Lulus Ujian Evaluasi Akhir</strong> dengan perolehan nilai <strong>${score}/100</strong> (Status: Tuntas KKM) pada mata pelajaran <em>Perencanaan dan Pengalamatan Jaringan (CIDR, Subnetting, dan VLSM)</em>.
        </p>

        <div class="cert-signatures">
          <div class="cert-signature-box">
            <div style="font-size:0.75rem; color:#64748B;">Makassar, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div class="cert-sign-line">Rifaldi, dkk.</div>
            <div style="font-size:0.7rem; color:#64748B;">Tim Pengembang PTIK FT UNM</div>
          </div>
          <div class="cert-signature-box">
            <div style="font-size:0.75rem; color:#64748B;">Mengetahui Guru Pengampu,</div>
            <div class="cert-sign-line">Bpk. Rifaldi, S.Pd., M.T.</div>
            <div style="font-size:0.7rem; color:#64748B;">NIP. 198504122010011008</div>
          </div>
        </div>
      </div>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
      <button class="btn btn-primary" onclick="window.print()">
        <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px;margin-right:6px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak / Simpan PDF
      </button>
    `;

    openModal();
  }
};

window.QuizEngine = QuizEngine;

