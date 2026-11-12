/**
 * NetLearn - Interactive Network Topology Simulator & Independent Practice Engine
 * 
 * Features:
 * - BAGIAN 1: Template Skenario Pembelajaran (Read-Only & Acuan Tetap dari Pengembang)
 * - BAGIAN 2: Area Praktik Mandiri Siswa (Setiap alat memiliki kolom input konfigurasi yang diisi sendiri oleh siswa)
 * - True multi-hop cable packet traversal (L2 Switching & L3 Routing BFS pathfinding)
 * - Interactive validation of student inputs against scenario specifications
 * - Animated ICMP packet flight, flowing cable dashes, and LED interface blink
 * - Educational failure diagnostics on canvas with floating tooltips
 * - Speed controls (0.5x educational slow-motion, 1x normal, 2x fast)
 * - Subnet clustering zones with color-coded boundaries
 * - Wireshark Mini (Live Layer 2 MAC, Layer 3 IP, Layer 4 ICMP packet inspector)
 * - Student guided lab challenges (Quests) with live checkmarks
 */

const TopologySim = {
  container: null,
  svg: null,
  devices: [],
  links: [],
  selectedDevice: null,
  connectingSource: null,
  isCableToolActive: false,
  dragTarget: null,
  dragOffset: { x: 0, y: 0 },
  simSpeed: 1, // 0.5 (slow/edu), 1 (normal), 2 (fast)
  isPacketInspectorOpen: false,
  isQuestsOpen: true,
  currentScenarioId: 1,

  // Student Lab Quests / Challenges
  quests: {
    q1: { id: 'quest-1', title: 'Misi 1: Ping sukses antar 2 PC dalam 1 Switch (/24)', completed: false },
    q2: { id: 'quest-2', title: 'Misi 2: Ping sukses antar 2 Subnet via Router Gateway (/25)', completed: false },
    q3: { id: 'quest-3', title: 'Misi 3: Periksa Header L2 (MAC) & L3 (IP) di Wireshark Mini', completed: false }
  },

  // Developer Fixed Reference Scenarios (Read-Only Template Specifications)
  scenarios: {
    1: {
      id: 1,
      title: 'Skenario 1: Jaringan LAN Dasar (1 Switch, 1 Subnet /24)',
      badge: 'Tingkat: Dasar (Satu Subnet)',
      objective: 'Peserta didik diminta melakukan konfigurasi pengalamatan IPv4 pada dua komputer (PC-01 dan PC-02) agar dapat saling berkomunikasi dalam satu segmen jaringan LAN (192.168.1.0/24) melalui perantara Switch.',
      instructions: [
        'Baca tabel acuan ketentuan konfigurasi di samping.',
        'Klik perangkat <strong>PC-01</strong> pada kanvas, lalu masukkan Alamat IP dan Subnet Mask sesuai tabel.',
        'Klik perangkat <strong>PC-02</strong> pada kanvas, lalu masukkan Alamat IP dan Subnet Mask sesuai tabel.',
        'Pastikan kabel penghubung dari masing-masing PC ke <strong>Switch-Lab1</strong> sudah terpasang.',
        'Klik tombol <strong>Uji Ping Cepat</strong> dari PC-01 ke <code>192.168.1.11</code> untuk memverifikasi hasil konfigurasi mandiri Anda!'
      ],
      referenceTable: [
        { device: 'PC-01', type: 'PC', targetIp: '192.168.1.10', netmask: '255.255.255.0', prefix: 24, gateway: '-', note: 'Host Klien 1' },
        { device: 'PC-02', type: 'PC', targetIp: '192.168.1.11', netmask: '255.255.255.0', prefix: 24, gateway: '-', note: 'Host Klien 2' },
        { device: 'Switch-Lab1', type: 'Switch', targetIp: 'Layer 2', netmask: '-', prefix: '-', gateway: '-', note: 'Penerus Frame MAC' }
      ],
      initialDevices: [
        { type: 'switch', name: 'Switch-Lab1', x: 270, y: 110, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'pc', name: 'PC-01', x: 110, y: 260, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'pc', name: 'PC-02', x: 430, y: 260, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' }
      ],
      initialLinks: [
        { sourceIdx: 0, targetIdx: 1 },
        { sourceIdx: 0, targetIdx: 2 }
      ]
    },

    2: {
      id: 2,
      title: 'Skenario 2: Perutean Antar-Subnet Berbeda (/25 & Router Gateway)',
      badge: 'Tingkat: Menengah (Subnetting & Gateway)',
      objective: 'Sebuah jaringan sekolah dipecah menjadi dua subnet /25 (Subnet A: 192.168.1.0/25 dan Subnet B: 192.168.1.128/25). Peserta didik harus mengonfigurasi IP masing-masing PC dan memasukkan IP Router sebagai Default Gateway agar paket dapat dirutekan antar-subnet.',
      instructions: [
        'Klik <strong>Router-Utama</strong> pada kanvas, isi IP Gateway: <code>192.168.1.1</code> dan Netmask: <code>255.255.255.128</code>.',
        'Klik <strong>PC-SubA</strong> pada kanvas, isi IP: <code>192.168.1.10</code>, Netmask: <code>255.255.255.128</code>, dan Default Gateway: <code>192.168.1.1</code>.',
        'Klik <strong>PC-SubB</strong> pada kanvas, isi IP: <code>192.168.1.130</code>, Netmask: <code>255.255.255.128</code>, dan Default Gateway: <code>192.168.1.1</code>.',
        'Klik tombol <strong>Uji Ping Cepat</strong> dari PC-SubA ke <code>192.168.1.130</code> dan amati alur paket yang menyeberang melalui Router Gateway!'
      ],
      referenceTable: [
        { device: 'Router-Utama', type: 'Router', targetIp: '192.168.1.1', netmask: '255.255.255.128', prefix: 25, gateway: '-', note: 'Gateway Penghubung Subnet' },
        { device: 'Switch-SubnetA', type: 'Switch', targetIp: 'Layer 2', netmask: '-', prefix: '-', gateway: '-', note: 'Switch Subnet A (.0 - .127)' },
        { device: 'Switch-SubnetB', type: 'Switch', targetIp: 'Layer 2', netmask: '-', prefix: '-', gateway: '-', note: 'Switch Subnet B (.128 - .255)' },
        { device: 'PC-SubA', type: 'PC', targetIp: '192.168.1.10', netmask: '255.255.255.128', prefix: 25, gateway: '192.168.1.1', note: 'Wajib isi Gateway Router!' },
        { device: 'PC-SubB', type: 'PC', targetIp: '192.168.1.130', netmask: '255.255.255.128', prefix: 25, gateway: '192.168.1.1', note: 'Wajib isi Gateway Router!' }
      ],
      initialDevices: [
        { type: 'router', name: 'Router-Utama', x: 280, y: 60, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'switch', name: 'Switch-SubnetA', x: 110, y: 170, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'switch', name: 'Switch-SubnetB', x: 450, y: 170, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'pc', name: 'PC-SubA', x: 80, y: 310, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'pc', name: 'PC-SubB', x: 480, y: 310, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' }
      ],
      initialLinks: [
        { sourceIdx: 0, targetIdx: 1 },
        { sourceIdx: 0, targetIdx: 2 },
        { sourceIdx: 1, targetIdx: 3 },
        { sourceIdx: 2, targetIdx: 4 }
      ]
    },

    3: {
      id: 3,
      title: 'Skenario 3: Perencanaan & Alokasi VLSM Multi-Segmen',
      badge: 'Tingkat: Mahir (VLSM Berbeda Prefix)',
      objective: 'Terapkan alokasi VLSM (Variable Length Subnet Mask) pada jaringan SMK Negeri 3 Makassar: Web Server (/26), Lab TKJ (/27), dan Ruang Guru (/28). Siswa menginput sendiri IP dan Subnet Mask tiap perangkat sesuai segmen VLSM masing-masing.',
      instructions: [
        'Konfigurasikan <strong>Router-Core</strong>: IP <code>192.168.10.1</code> dengan Netmask <code>255.255.255.192</code> (/26).',
        'Konfigurasikan <strong>Web-Server</strong>: IP <code>192.168.10.2</code>, Netmask <code>255.255.255.192</code>, Gateway <code>192.168.10.1</code>.',
        'Konfigurasikan <strong>PC-TKJ-01</strong>: IP <code>192.168.10.65</code>, Netmask <code>255.255.255.224</code> (/27), Gateway <code>192.168.10.1</code>.',
        'Konfigurasikan <strong>Laptop-Guru</strong>: IP <code>192.168.10.98</code>, Netmask <code>255.255.255.240</code> (/28), Gateway <code>192.168.10.1</code>.',
        'Lakukan uji Ping dari PC-TKJ-01 ke Web-Server untuk membuktikan perutean VLSM multi-prefix berjalan dengan tepat!'
      ],
      referenceTable: [
        { device: 'Router-Core', type: 'Router', targetIp: '192.168.10.1', netmask: '255.255.255.192', prefix: 26, gateway: '-', note: 'Core Gateway (/26)' },
        { device: 'Web-Server', type: 'Server', targetIp: '192.168.10.2', netmask: '255.255.255.192', prefix: 26, gateway: '192.168.10.1', note: 'Segmen Server (/26)' },
        { device: 'PC-TKJ-01', type: 'PC', targetIp: '192.168.10.65', netmask: '255.255.255.224', prefix: 27, gateway: '192.168.10.1', note: 'Segmen Lab TKJ (/27)' },
        { device: 'Laptop-Guru', type: 'Laptop', targetIp: '192.168.10.98', netmask: '255.255.255.240', prefix: 28, gateway: '192.168.10.1', note: 'Segmen Ruang Guru (/28)' }
      ],
      initialDevices: [
        { type: 'router', name: 'Router-Core', x: 280, y: 50, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'server', name: 'Web-Server', x: 80, y: 70, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'switch', name: 'SW-LabTKJ', x: 130, y: 190, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'switch', name: 'SW-RuangGuru', x: 430, y: 190, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'pc', name: 'PC-TKJ-01', x: 80, y: 320, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' },
        { type: 'laptop', name: 'Laptop-Guru', x: 470, y: 320, ip: '', netmask: '', prefix: '', gateway: '', status: 'UP' }
      ],
      initialLinks: [
        { sourceIdx: 0, targetIdx: 1 },
        { sourceIdx: 0, targetIdx: 2 },
        { sourceIdx: 0, targetIdx: 3 },
        { sourceIdx: 2, targetIdx: 4 },
        { sourceIdx: 3, targetIdx: 5 }
      ]
    },

    0: {
      id: 0,
      title: 'Mode Bebas (Sandbox Lab Praktik)',
      badge: 'Tingkat: Bebas Eksplorasi',
      objective: 'Pada mode ini, siswa dapat merancang sendiri topologi jaringan secara bebas dari awal. Tambahkan Router, Switch, PC, Laptop, dan Server, kemudian hubungkan kabel dan konfigurasikan IP mandiri.',
      instructions: [
        'Gunakan tombol pada palet sebelah kiri untuk menambahkan alat.',
        'Gunakan tombol <strong>Hubungkan Kabel</strong> untuk menyambungkan port antar-alat.',
        'Klik masing-masing alat di kanvas untuk mengisi alamat IP & Subnet Mask.',
        'Gunakan tombol <strong>Uji Ping Cepat</strong> untuk menguji rute yang Anda buat.'
      ],
      referenceTable: [
        { device: 'Bebas', type: 'Semua', targetIp: 'Sesuai Desain Siswa', netmask: 'Sesuai Kebutuhan', prefix: 'Bebas', gateway: 'Opsional', note: 'Topologi Kustom Mandiri' }
      ],
      initialDevices: [],
      initialLinks: []
    }
  },

  // High-contrast clean network device SVG icons
  icons: {
    router: `<svg width="40" height="40" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5"/><path d="M14 24h20M24 14v20M17 19l-3 5 3 5M31 19l3 5-3 5M19 17l5-3 5 3M19 31l5 3 5-3" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    switch: `<svg width="40" height="40" viewBox="0 0 48 48" fill="none"><rect x="4" y="12" width="40" height="24" rx="4" fill="#0F172A" stroke="#818CF8" stroke-width="2.5"/><path d="M12 20h24M12 28h24M16 17l-4 3 4 3M32 25l4 3-4 3M24 17l-4 3 4 3M24 25l4 3-4 3" stroke="#818CF8" stroke-width="2" stroke-linecap="round"/></svg>`,
    pc: `<svg width="40" height="40" viewBox="0 0 48 48" fill="none"><rect x="6" y="8" width="36" height="24" rx="3" fill="#0F172A" stroke="#34D399" stroke-width="2.5"/><rect x="10" y="12" width="28" height="16" rx="1.5" fill="#1E293B"/><path d="M18 36h12M24 32v4" stroke="#34D399" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="20" r="2" fill="#34D399"/></svg>`,
    laptop: `<svg width="40" height="40" viewBox="0 0 48 48" fill="none"><rect x="10" y="12" width="28" height="18" rx="2" fill="#0F172A" stroke="#F59E0B" stroke-width="2.5"/><rect x="14" y="15" width="20" height="12" fill="#1E293B"/><path d="M6 34h36a2 2 0 012 2v1H4v-1a2 2 0 012-2z" fill="#334155" stroke="#F59E0B" stroke-width="1.5"/><rect x="21" y="34.5" width="6" height="1.5" rx="0.5" fill="#CBD5E1"/></svg>`,
    server: `<svg width="40" height="40" viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="36" rx="4" fill="#0F172A" stroke="#EC4899" stroke-width="2.5"/><path d="M8 18h32M8 30h32" stroke="#475569" stroke-width="2"/><circle cx="15" cy="12" r="2" fill="#34D399"/><circle cx="21" cy="12" r="2" fill="#38BDF8"/><circle cx="15" cy="24" r="2" fill="#34D399"/><circle cx="15" cy="36" r="2" fill="#34D399"/></svg>`,
    ap: `<svg width="40" height="40" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="28" r="14" fill="#0F172A" stroke="#A855F7" stroke-width="2.5"/><circle cx="24" cy="28" r="4" fill="#A855F7"/><path d="M16 16c4.5-4 11.5-4 16 0M12 11c6.5-6 17.5-6 24 0M24 24V10" stroke="#A855F7" stroke-width="2" stroke-linecap="round"/></svg>`
  },

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="sim-topo-container">
        
        <!-- ========================================================
             BAGIAN 1: PANDUAN TEMPLATE SKENARIO (READ-ONLY)
             Bersifat tetap, acuan resmi pengembang, tidak dapat diedit siswa
             ======================================================== -->
        <div class="scenario-guide-card">
          <div class="scenario-guide-header">
            <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
              <span class="scenario-lock-badge">
                🔒 TEMPLATE ACUAN (READ-ONLY)
              </span>
              <h3 class="scenario-guide-title">
                📋 Panduan Skenario Praktikum Siswa
              </h3>
            </div>

            <!-- Scenario Selection Pills -->
            <div class="scenario-selector-pills">
              <button class="scenario-pill ${this.currentScenarioId === 1 ? 'active' : ''}" onclick="TopologySim.switchScenario(1)">
                📌 Skenario 1 (LAN 1 Switch)
              </button>
              <button class="scenario-pill ${this.currentScenarioId === 2 ? 'active' : ''}" onclick="TopologySim.switchScenario(2)">
                📌 Skenario 2 (Antar-Subnet /25)
              </button>
              <button class="scenario-pill ${this.currentScenarioId === 3 ? 'active' : ''}" onclick="TopologySim.switchScenario(3)">
                📌 Skenario 3 (Alokasi VLSM)
              </button>
              <button class="scenario-pill ${this.currentScenarioId === 0 ? 'active' : ''}" onclick="TopologySim.switchScenario(0)">
                🛠️ Mode Bebas (Sandbox)
              </button>
            </div>
          </div>

          <!-- Dynamic Read-Only Scenario Guide Content -->
          <div id="scenario-guide-mount" class="scenario-guide-body"></div>
        </div>


        <!-- ========================================================
             BAGIAN 2: AREA KERJA & INPUT MANDIRI SISWA (KANVAS PRAKTIK)
             Kolom input konfigurasi alat yang wajib diisi sendiri oleh siswa
             ======================================================== -->
        <div class="student-workspace-bar">
          <div class="workspace-instruct-text">
            <span class="pulse-dot-green"></span>
            <span><strong>🛠️ Area Praktik Mandiri Siswa:</strong> Setiap alat menyediakan kolom input konfigurasi yang dapat Anda edit sendiri. Rujuk tabel acuan di atas, klik alat di kanvas, lalu masukkan parameter IP-nya!</span>
          </div>

          <div id="student-progress-badge" class="student-progress-pill">
            📊 Progres Konfigurasi: 0/0 Alat
          </div>
        </div>

        <div class="topology-workspace">
          <!-- Sidebar Device Palette & Wiring Tool -->
          <div class="device-palette">
            <div class="palette-title">Tambah Alat Baru</div>
            <button class="device-drag-btn" data-type="router" onclick="TopologySim.addDevice('router')">
              <span style="color:#38BDF8">🔘</span> + Router (Gateway L3)
            </button>
            <button class="device-drag-btn" data-type="switch" onclick="TopologySim.addDevice('switch')">
              <span style="color:#818CF8">⬛</span> + Switch (LAN L2)
            </button>
            <button class="device-drag-btn" data-type="pc" onclick="TopologySim.addDevice('pc')">
              <span style="color:#34D399">🖥️</span> + PC Komputer
            </button>
            <button class="device-drag-btn" data-type="laptop" onclick="TopologySim.addDevice('laptop')">
              <span style="color:#F59E0B">💻</span> + Laptop Client
            </button>
            <button class="device-drag-btn" data-type="server" onclick="TopologySim.addDevice('server')">
              <span style="color:#EC4899">🗄️</span> + Server Web/DNS
            </button>
            <button class="device-drag-btn" data-type="ap" onclick="TopologySim.addDevice('ap')">
              <span style="color:#A855F7">📶</span> + Access Point (AP)
            </button>

            <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid var(--color-border);" />

            <div class="palette-title">Alat Penghubung</div>
            <button id="cable-tool-btn" class="btn btn-secondary btn-sm" style="width:100%; justify-content: flex-start;" onclick="TopologySim.toggleCableTool()">
              🔌 <span>Hubungkan Kabel</span>
            </button>

            <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid var(--color-border);" />

            <div class="palette-title">Bantuan & Referensi</div>
            <button class="btn btn-secondary btn-sm" style="width:100%; text-align:left; font-size:0.75rem;" onclick="TopologySim.validateStudentConfigurations()">
              🔍 <span>Validasi Mandiri Siswa</span>
            </button>
            <button class="btn btn-secondary btn-sm" style="width:100%; text-align:left; font-size:0.75rem; margin-top:0.35rem;" onclick="TopologySim.downloadPacketTracerGuide()">
              📥 <span>Unduh Panduan (.pkt)</span>
            </button>
          </div>

          <!-- Canvas & Terminal Area -->
          <div class="canvas-area-wrapper">
            <div class="canvas-toolbar">
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <span id="canvas-status-pill" class="badge badge-blue">Mode Edit Siswa</span>
                <span id="cable-active-hint" style="font-size:0.75rem; color:#F59E0B; display:none; font-weight:600;">
                  ⚡ Klik alat pertama, lalu klik alat kedua untuk memasang kabel!
                </span>
              </div>

              <div class="canvas-actions">
                <!-- Speed Controls for Education -->
                <div class="speed-control-group" title="Kecepatan Transmisi Paket Simulasi">
                  <button class="speed-btn" data-speed="0.5" onclick="TopologySim.setSpeed(0.5, this)">🐢 0.5x</button>
                  <button class="speed-btn active" data-speed="1" onclick="TopologySim.setSpeed(1, this)">🚶 1x</button>
                  <button class="speed-btn" data-speed="2" onclick="TopologySim.setSpeed(2, this)">⚡ 2x</button>
                </div>

                <!-- Wireshark Mini Packet Inspector -->
                <button class="btn btn-secondary btn-sm" onclick="TopologySim.togglePacketInspector()" title="Buka Detail Header Paket L2/L3/L4">
                  🔍 Wireshark Mini
                </button>

                <button class="btn btn-secondary btn-sm" onclick="TopologySim.validateStudentConfigurations()" title="Cek apakah input IP Anda sudah sesuai panduan">
                  ✅ Cek Konfigurasi
                </button>

                <button class="btn btn-primary btn-sm" onclick="TopologySim.openPingTesterModal()" title="Tes Ping Antar Host">
                  🚀 Uji Ping Cepat
                </button>

                <button class="btn btn-secondary btn-sm" onclick="TopologySim.clearCanvas()">
                  🗑️ Bersihkan
                </button>
              </div>
            </div>

            <!-- SVG Canvas with Subnet Zones, Cables, and Packets -->
            <svg id="topology-svg-canvas" width="100%" height="100%">
              <defs>
                <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.4" />
                </filter>
                <filter id="packet-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#38BDF8" flood-opacity="0.8" />
                </filter>
              </defs>

              <!-- Layer 1: Subnet Zones Background -->
              <g id="zones-group"></g>
              <!-- Layer 2: Cables/Wires -->
              <g id="links-group"></g>
              <!-- Layer 3: Packets in Transit -->
              <g id="packets-group"></g>
              <!-- Layer 4: Network Devices -->
              <g id="nodes-group"></g>
            </svg>

            <!-- Student Guided Lab Challenges Floating Card -->
            <div id="lab-quest-panel" class="lab-quest-panel">
              <div class="lab-quest-header" onclick="TopologySim.toggleQuests()">
                <span>🎯 Misi Praktikum SMK</span>
                <span id="quest-toggle-icon">▲</span>
              </div>
              <div id="lab-quest-list" class="lab-quest-list">
                <div id="quest-1" class="quest-item">
                  <span class="quest-icon">⚪</span>
                  <span><strong>Misi 1:</strong> Ping sukses 2 PC dalam 1 Switch (Satu Subnet /24)</span>
                </div>
                <div id="quest-2" class="quest-item">
                  <span class="quest-icon">⚪</span>
                  <span><strong>Misi 2:</strong> Ping sukses antar Subnet via Router Gateway (/25)</span>
                </div>
                <div id="quest-3" class="quest-item">
                  <span class="quest-icon">⚪</span>
                  <span><strong>Misi 3:</strong> Buka Wireshark Mini & periksa Header L2/L3</span>
                </div>
              </div>
            </div>

            <!-- Packet Inspector Drawer (Mini Wireshark) -->
            <div id="packet-inspector-drawer" class="packet-inspector-drawer">
              <div class="inspector-header">
                <span>📡 Wireshark Mini - Inspeksi Paket ICMP</span>
                <span style="cursor:pointer;" onclick="TopologySim.togglePacketInspector()">✖</span>
              </div>
              <div id="inspector-content" class="inspector-content">
                Belum ada transmisi paket. Konfigurasikan alamat IP alat dan kirim paket Ping untuk menganalisis frame Layer 2 & Layer 3!
              </div>
            </div>

            <!-- Terminal Output Drawer -->
            <div class="terminal-drawer">
              <div class="terminal-header">
                <span>CLI Terminal & Packet Sniffer Console (Cisco Packet Tracer Engine)</span>
                <span style="cursor:pointer;" onclick="TopologySim.clearTerminal()">Bersihkan Log</span>
              </div>
              <div id="terminal-logs" class="terminal-logs">
                <div>[SYSTEM] NetLearn Cisco Packet Tracer Simulation Engine Ready.</div>
                <div>[INFO] Rujuk tabel acuan di atas, klik alat di kanvas untuk mengisi alamat IP & Subnet Mask mandiri, lalu uji Ping!</div>
              </div>
              <div class="terminal-input-row">
                <span class="terminal-prompt">NetLearn-Router#</span>
                <input type="text" id="terminal-cmd-input" class="terminal-input" placeholder="Ketik perintah (contoh: ping 192.168.1.11 atau help)" onkeydown="TopologySim.handleTerminalKey(event)">
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    this.svg = document.getElementById('topology-svg-canvas');
    this.zonesGroup = document.getElementById('zones-group');
    this.linksGroup = document.getElementById('links-group');
    this.packetsGroup = document.getElementById('packets-group');
    this.nodesGroup = document.getElementById('nodes-group');
    this.terminalLogs = document.getElementById('terminal-logs');

    this.setupCanvasEvents();
    this.renderScenarioGuide();
    this.loadScenario(1);
  },

  setupCanvasEvents() {
    this.svg.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.svg.addEventListener('mouseup', () => this.onMouseUp());
    this.svg.addEventListener('mouseleave', () => this.onMouseUp());
  },

  // Render the Read-Only Template Scenario Guide at the top
  renderScenarioGuide() {
    const mount = document.getElementById('scenario-guide-mount');
    if (!mount) return;

    const sc = this.scenarios[this.currentScenarioId] || this.scenarios[1];

    mount.innerHTML = `
      <!-- Left Column: Problem Objective & Steps -->
      <div class="scenario-info-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <div class="scenario-desc-title">
            <span>🎯</span> ${sc.title}
          </div>
          <span class="badge badge-purple" style="font-size:0.7rem;">${sc.badge}</span>
        </div>
        
        <p class="scenario-desc-text">
          ${sc.objective}
        </p>

        <div style="font-size:0.78rem; font-weight:700; color:#38BDF8; margin-bottom:0.4rem;">
          Langkah Pengerjaan Mandiri Siswa:
        </div>
        <ul class="scenario-steps-list">
          ${sc.instructions.map((step, idx) => `
            <li>
              <span style="color:#38BDF8; font-weight:700;">${idx + 1}.</span>
              <span>${step}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Right Column: Fixed Reference Configuration Table (Read-Only) -->
      <div class="scenario-info-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <div class="scenario-desc-title">
            <span>📊</span> Tabel Ketentuan Konfigurasi Alat (Acuan Siswa)
          </div>
          <span style="font-size:0.68rem; color:#94A3B8; font-style:italic;">Bersifat Tetap / Acuan Resmi</span>
        </div>

        <div class="scenario-ref-table-wrapper">
          <table class="scenario-ref-table">
            <thead>
              <tr>
                <th>Nama Alat</th>
                <th>Jenis</th>
                <th>Alamat IP Target</th>
                <th>Subnet Mask</th>
                <th>Default Gateway</th>
                <th>Tugas Siswa</th>
              </tr>
            </thead>
            <tbody>
              ${sc.referenceTable.map(row => `
                <tr>
                  <td><strong>${row.device}</strong></td>
                  <td class="badge-cell"><span class="badge badge-blue" style="font-size:0.68rem;">${row.type}</span></td>
                  <td style="color:#38BDF8;">${row.targetIp}</td>
                  <td>${row.netmask}</td>
                  <td>${row.gateway}</td>
                  <td class="badge-cell" style="color:#CBD5E1; font-size:0.72rem;">${row.note}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top:0.65rem; font-size:0.72rem; color:#94A3B8; display:flex; align-items:center; gap:0.4rem;">
          <span>ℹ️</span> <em>Catatan: Tabel ini adalah spesifikasi acuan pengembang. Siswa harus menginput nilai-nilai di atas ke dalam masing-masing alat di kanvas bawah.</em>
        </div>
      </div>
    `;
  },

  switchScenario(id) {
    this.currentScenarioId = id;
    document.querySelectorAll('.scenario-pill').forEach((btn, idx) => {
      const pillIds = [1, 2, 3, 0];
      if (pillIds[idx] === id) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.renderScenarioGuide();
    this.loadScenario(id);
    showToast(`Memuat ${this.scenarios[id].title}. Silakan input konfigurasi pada alat di kanvas!`, 'info');
  },

  setSpeed(val, btn) {
    this.simSpeed = val;
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.logTerminal(`[SIMULASI] Kecepatan animasi paket diatur ke ${val}x kecepatan normal.`);
  },

  togglePacketInspector() {
    this.isPacketInspectorOpen = !this.isPacketInspectorOpen;
    const drawer = document.getElementById('packet-inspector-drawer');
    if (drawer) {
      drawer.style.display = this.isPacketInspectorOpen ? 'block' : 'none';
      if (this.isPacketInspectorOpen) {
        this.completeQuest('q3');
      }
    }
  },

  toggleQuests() {
    this.isQuestsOpen = !this.isQuestsOpen;
    const list = document.getElementById('lab-quest-list');
    const icon = document.getElementById('quest-toggle-icon');
    if (list) list.style.display = this.isQuestsOpen ? 'flex' : 'none';
    if (icon) icon.textContent = this.isQuestsOpen ? '▲' : '▼';
  },

  completeQuest(questKey) {
    if (this.quests[questKey] && !this.quests[questKey].completed) {
      this.quests[questKey].completed = true;
      const el = document.getElementById(this.quests[questKey].id);
      if (el) {
        el.classList.add('completed');
        const icon = el.querySelector('.quest-icon');
        if (icon) icon.textContent = '✅';
      }
      if (typeof NetLearnStore !== 'undefined' && NetLearnStore.state) {
        if (!NetLearnStore.state.simulasiQuests) NetLearnStore.state.simulasiQuests = {};
        NetLearnStore.state.simulasiQuests[questKey] = true;
        NetLearnStore.save();
      }
      showToast(`Tantangan Praktik Selesai: ${this.quests[questKey].title} 🎉`, 'success');
    }
  },

  // Update student configuration progress badge
  updateStudentProgress() {
    if (typeof document === 'undefined') return;
    const badge = document.getElementById('student-progress-badge');
    if (!badge) return;

    const devicesNeedingIp = this.devices.filter(d => d.type !== 'switch');
    if (devicesNeedingIp.length === 0) {
      badge.innerHTML = `📊 Progres Konfigurasi: 0 Alat`;
      badge.style.background = '#EFF6FF';
      badge.style.color = '#1D4ED8';
      return;
    }

    const configured = devicesNeedingIp.filter(d => d.ip && d.ip.trim() !== '').length;
    const total = devicesNeedingIp.length;
    const percent = Math.round((configured / total) * 100);

    badge.innerHTML = `📊 Konfigurasi Siswa: ${configured}/${total} Alat Terisi (${percent}%)`;
    if (configured === total) {
      badge.style.background = '#ECFDF5';
      badge.style.borderColor = '#A7F3D0';
      badge.style.color = '#047857';
    } else {
      badge.style.background = '#EFF6FF';
      badge.style.borderColor = '#BFDBFE';
      badge.style.color = '#1D4ED8';
    }
  },

  // Add Device with blank initial configuration for student to input
  addDevice(type, customConfig = null) {
    const rect = this.svg ? this.svg.getBoundingClientRect() : { width: 800, height: 500 };
    const count = this.devices.filter(d => d.type === type).length + 1;
    const defaultNames = {
      router: `Router-0${count}`,
      switch: `Switch-0${count}`,
      pc: `PC-0${count}`,
      laptop: `Laptop-0${count}`,
      server: `Server-Web`,
      ap: `AP-Office`
    };

    const device = {
      id: 'dev_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: type,
      name: customConfig ? customConfig.name : (defaultNames[type] || `Dev-${count}`),
      x: customConfig ? customConfig.x : Math.max(50, Math.min(rect.width - 140, 80 + (this.devices.length * 70) % 550)),
      y: customConfig ? customConfig.y : Math.max(50, Math.min(rect.height - 120, 80 + (this.devices.length * 50) % 320)),
      ip: customConfig ? (customConfig.ip || '') : '', // Blank by default for student to input!
      netmask: customConfig ? (customConfig.netmask || '') : '',
      prefix: customConfig ? (customConfig.prefix || '') : '',
      gateway: customConfig ? (customConfig.gateway || '') : '',
      status: customConfig ? (customConfig.status || 'UP') : 'UP'
    };

    this.devices.push(device);
    this.render();
    this.updateStudentProgress();
    this.logTerminal(`Alat '${device.name}' (${device.type.toUpperCase()}) ditambahkan ke kanvas. Klik alat untuk mengisi konfigurasi IP!`);
    return device;
  },

  toggleCableTool() {
    this.isCableToolActive = !this.isCableToolActive;
    const btn = document.getElementById('cable-tool-btn');
    const hint = document.getElementById('cable-active-hint');
    const pill = document.getElementById('canvas-status-pill');

    if (this.isCableToolActive) {
      if (btn) {
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
      }
      if (hint) hint.style.display = 'inline';
      if (pill) {
        pill.textContent = 'Mode Pasang Kabel';
        pill.className = 'badge badge-warning';
      }
    } else {
      if (btn) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
      if (hint) hint.style.display = 'none';
      if (pill) {
        pill.textContent = 'Mode Edit Siswa';
        pill.className = 'badge badge-blue';
      }
      this.connectingSource = null;
    }
    this.render();
  },

  handleDeviceClick(device, e) {
    e.stopPropagation();

    if (this.isCableToolActive) {
      if (!this.connectingSource) {
        this.connectingSource = device;
        this.logTerminal(`[KABEL] Memilih '${device.name}' sebagai titik awal. Sekarang klik alat tujuan.`);
        this.render();
      } else {
        if (this.connectingSource.id === device.id) {
          this.logTerminal(`[KABEL] Batal: Tidak bisa menghubungkan alat ke dirinya sendiri.`);
          this.connectingSource = null;
        } else {
          const exists = this.links.some(l => 
            (l.sourceId === this.connectingSource.id && l.targetId === device.id) ||
            (l.sourceId === device.id && l.targetId === this.connectingSource.id)
          );

          if (exists) {
            this.logTerminal(`[KABEL] Kedua alat sudah terhubung kabel sebelumnya.`);
          } else {
            this.links.push({
              id: 'link_' + Date.now(),
              sourceId: this.connectingSource.id,
              targetId: device.id,
              status: 'UP'
            });
            this.logTerminal(`[KABEL] Sukses memasang kabel antara '${this.connectingSource.name}' dan '${device.name}'.`);
          }
          this.connectingSource = null;
          this.toggleCableTool();
        }
        this.render();
      }
    } else {
      // Normal click -> Open Student Device Configuration Modal
      this.openDeviceConfig(device);
    }
  },

  onMouseDown(device, e) {
    if (this.isCableToolActive) return;
    this.dragTarget = device;
    const rect = this.svg.getBoundingClientRect();
    this.dragOffset.x = (e.clientX - rect.left) - device.x;
    this.dragOffset.y = (e.clientY - rect.top) - device.y;
  },

  onMouseMove(e) {
    if (!this.dragTarget) return;
    const rect = this.svg.getBoundingClientRect();
    this.dragTarget.x = Math.max(20, Math.min(rect.width - 100, (e.clientX - rect.left) - this.dragOffset.x));
    this.dragTarget.y = Math.max(20, Math.min(rect.height - 100, (e.clientY - rect.top) - this.dragOffset.y));
    this.render();
  },

  onMouseUp() {
    this.dragTarget = null;
  },

  // Render everything: Subnet zones, Cables, Devices
  render() {
    if (!this.svg) return;

    // 1. Render Subnet Clustering Zones
    this.renderSubnetZones();

    // 2. Render Cable Links
    let linksHtml = '';
    for (const link of this.links) {
      const src = this.devices.find(d => d.id === link.sourceId);
      const tgt = this.devices.find(d => d.id === link.targetId);
      if (!src || !tgt) continue;

      const x1 = src.x + 44;
      const y1 = src.y + 44;
      const x2 = tgt.x + 44;
      const y2 = tgt.y + 44;

      linksHtml += `
        <line id="${link.id}" class="cable-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />
        <circle cx="${x1}" cy="${y1}" r="4.5" fill="#10B981" filter="drop-shadow(0 0 3px #10B981)" />
        <circle cx="${x2}" cy="${y2}" r="4.5" fill="#10B981" filter="drop-shadow(0 0 3px #10B981)" />
      `;
    }
    if (this.linksGroup) this.linksGroup.innerHTML = linksHtml;

    // 3. Render Device Nodes with Independent Configuration Status
    let nodesHtml = '';
    const roleLabels = {
      router: 'L3 GATEWAY',
      switch: 'L2 SWITCH',
      pc: 'PC CLIENT',
      laptop: 'LAPTOP',
      server: 'WEB SERVER',
      ap: 'ACCESS POINT'
    };

    const roleColors = {
      router: '#38BDF8',
      switch: '#818CF8',
      pc: '#34D399',
      laptop: '#F59E0B',
      server: '#EC4899',
      ap: '#A855F7'
    };

    for (const d of this.devices) {
      const isConnecting = (this.connectingSource && this.connectingSource.id === d.id);
      const roleText = roleLabels[d.type] || 'DEVICE';
      const roleColor = roleColors[d.type] || '#38BDF8';
      const isConfigured = (d.type === 'switch') || (d.ip && d.ip.trim() !== '');

      // Border and status styling
      let strokeColor = isConnecting ? '#F59E0B' : (isConfigured ? '#334155' : '#F59E0B');
      let strokeDash = (isConnecting || !isConfigured) ? 'stroke-dasharray="5 3"' : '';
      let statusPillText = isConfigured ? (d.type === 'switch' ? 'Layer 2' : '🟢 Terkonfigurasi') : '⚠️ Belum Diisi';
      let statusPillColor = isConfigured ? '#10B981' : '#F59E0B';

      nodesHtml += `
        <g id="node-${d.id}" class="sim-node" transform="translate(${d.x}, ${d.y})" 
           style="cursor: ${this.isCableToolActive ? 'pointer' : 'grab'};"
           onmousedown="TopologySim.onMouseDown(TopologySim.devices.find(x => x.id === '${d.id}'), event)"
           onclick="TopologySim.handleDeviceClick(TopologySim.devices.find(x => x.id === '${d.id}'), event)">
          
          <!-- Card Background -->
          <rect class="node-card" x="-4" y="-4" width="92" height="94" rx="14" 
                fill="${isConnecting ? '#FEF08A' : '#1E293B'}" 
                stroke="${strokeColor}" 
                stroke-width="${isConnecting ? '3' : (!isConfigured ? '2.5' : '1.5')}"
                ${strokeDash}
                filter="url(#node-glow)" />

          <!-- Top Role Pill -->
          <rect x="6" y="2" width="70" height="13" rx="4" fill="${roleColor}" fill-opacity="0.15" />
          <text x="41" y="11.5" text-anchor="middle" font-family="Inter, sans-serif" font-size="8.5" font-weight="700" fill="${roleColor}">
            ${roleText}
          </text>

          <!-- Status LED Indicator on Top Right -->
          <circle cx="76" cy="8.5" r="3.5" class="${d.status === 'UP' ? 'led-indicator' : ''}" fill="${d.status === 'UP' ? '#10B981' : '#EF4444'}" />

          <!-- Device Icon -->
          <g transform="translate(22, 18)">
            ${this.icons[d.type] || this.icons.pc}
          </g>

          <!-- Device Name Label -->
          <text x="42" y="68" text-anchor="middle" font-family="Inter, sans-serif" font-size="10.5" font-weight="700" fill="${isConnecting ? '#0F172A' : '#F8FAFC'}">
            ${d.name}
          </text>
          
          <!-- IP Address / Configuration Status Label -->
          ${d.type === 'switch' ? `
            <text x="42" y="82" text-anchor="middle" font-family="Inter, sans-serif" font-size="8" fill="#818CF8">
              Layer 2 (Auto MAC)
            </text>
          ` : (d.ip ? `
            <text x="42" y="82" text-anchor="middle" font-family="Fira Code, monospace" font-size="9" font-weight="600" fill="#38BDF8">
              ${d.ip}/${d.prefix || 24}
            </text>
          ` : `
            <text x="42" y="82" text-anchor="middle" font-family="Inter, sans-serif" font-size="8.2" font-weight="700" fill="#FCD34D">
              [Klik Input IP]
            </text>
          `)}
        </g>
      `;
    }
    if (this.nodesGroup) this.nodesGroup.innerHTML = nodesHtml;
  },

  // Draw subtle visual boundaries grouping devices that belong to the same subnet
  renderSubnetZones() {
    if (!this.zonesGroup) return;

    const subnetGroups = {};
    for (const d of this.devices) {
      if (!d.ip || d.type === 'switch') continue;
      const calc = SubnetEngine.calculate(d.ip, d.prefix || 24);
      if (calc.success) {
        const netId = calc.networkAddress + '/' + calc.prefix;
        if (!subnetGroups[netId]) subnetGroups[netId] = [];
        subnetGroups[netId].push(d);
      }
    }

    const zoneColors = [
      { fill: 'rgba(56, 189, 248, 0.07)', stroke: 'rgba(56, 189, 248, 0.35)', badge: '#38BDF8' },
      { fill: 'rgba(168, 85, 247, 0.07)', stroke: 'rgba(168, 85, 247, 0.35)', badge: '#A855F7' },
      { fill: 'rgba(245, 158, 11, 0.07)', stroke: 'rgba(245, 158, 11, 0.35)', badge: '#F59E0B' }
    ];

    let zonesHtml = '';
    let colorIdx = 0;

    for (const [netId, devs] of Object.entries(subnetGroups)) {
      if (devs.length < 1) continue;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const d of devs) {
        minX = Math.min(minX, d.x);
        minY = Math.min(minY, d.y);
        maxX = Math.max(maxX, d.x + 92);
        maxY = Math.max(maxY, d.y + 94);
      }

      const padding = 24;
      const x = Math.max(10, minX - padding);
      const y = Math.max(10, minY - padding);
      const w = Math.max(130, (maxX - minX) + padding * 2);
      const h = Math.max(120, (maxY - minY) + padding * 2);
      const color = zoneColors[colorIdx % zoneColors.length];
      colorIdx++;

      zonesHtml += `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" 
              fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" stroke-dasharray="6 4" />
        <rect x="${x + 12}" y="${y - 10}" width="${netId.length * 7 + 42}" height="20" rx="5" fill="#0F172A" stroke="${color.stroke}" stroke-width="1.2" />
        <text x="${x + 18}" y="${y + 4}" font-family="Inter, sans-serif" font-size="9.5" font-weight="700" fill="${color.badge}">
          🌐 Subnet: ${netId}
        </text>
      `;
    }

    this.zonesGroup.innerHTML = zonesHtml;
  },

  // Open Student Independent Configuration Form
  openDeviceConfig(device) {
    this.selectedDevice = device;
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    // Find reference specification from active scenario if exists
    const sc = this.scenarios[this.currentScenarioId];
    const ref = sc ? sc.referenceTable.find(r => r.device === device.name) : null;

    modalTitle.textContent = `⚙️ Formulir Konfigurasi Mandiri Siswa: ${device.name}`;
    modalBody.innerHTML = `
      <div class="callout callout-info" style="margin-bottom:1.25rem; font-size:0.8rem;">
        <strong>Instruksi Praktik:</strong> Masukkan parameter alamat IP dan konfigurasi alat ini secara mandiri sesuai dengan ketentuan pada <strong>Tabel Panduan Skenario</strong> di atas!
      </div>

      <form id="device-config-form" onsubmit="event.preventDefault(); TopologySim.saveDeviceConfig();">
        <div class="form-group">
          <label class="form-label">Nama Host / Perangkat:</label>
          <input type="text" id="cfg-dev-name" class="form-control" value="${device.name}" required>
        </div>

        ${device.type !== 'switch' ? `
          <div class="grid-two-equal">
            <div class="form-group">
              <label class="form-label">Alamat IPv4 (Dotted-Decimal):</label>
              <input type="text" id="cfg-dev-ip" class="form-control" value="${device.ip}" placeholder="Contoh: 192.168.1.10" required>
              <div class="form-help">Alamat IP host unik dalam subnet.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Subnet Mask:</label>
              <input type="text" id="cfg-dev-mask" class="form-control" value="${device.netmask}" placeholder="Contoh: 255.255.255.0" required>
              <div class="form-help">Menentukan batas prefix CIDR.</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Default Gateway (Alamat IP Router):</label>
            <input type="text" id="cfg-dev-gw" class="form-control" value="${device.gateway}" placeholder="Contoh: 192.168.1.1">
            <div class="form-help">Wajib diisi jika alat berkomunikasi dengan host di subnet berbeda melewati Router.</div>
          </div>
        ` : `
          <div class="callout callout-info">
            Switch bekerja pada Layer 2 (Data Link Frame). Switch meneruskan paket berdasarkan MAC address otomatis sehingga tidak memerlukan konfigurasi alamat IP host.
          </div>
        `}

        <div class="form-group">
          <label class="form-label">Status Port Antarmuka (Interface):</label>
          <select id="cfg-dev-status" class="form-control">
            <option value="UP" ${device.status === 'UP' ? 'selected' : ''}>Port UP (Aktif / Hijau)</option>
            <option value="DOWN" ${device.status === 'DOWN' ? 'selected' : ''}>Port DOWN (Nonaktif / Merah)</option>
          </select>
        </div>

        ${ref ? `
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:var(--radius-md); padding:0.75rem; font-size:0.75rem; color:#475569;">
            <strong>📌 Acuan Skenario:</strong> Target IP untuk ${device.name} adalah <code>${ref.targetIp}</code> dengan Mask <code>${ref.netmask}</code> (Gateway: <code>${ref.gateway}</code>).
          </div>
        ` : ''}
      </form>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-danger btn-sm" onclick="TopologySim.deleteSelectedDevice()" style="margin-right:auto;">
        Hapus Alat
      </button>
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="TopologySim.saveDeviceConfig()">Simpan Konfigurasi</button>
    `;

    openModal();
  },

  saveDeviceConfig() {
    if (!this.selectedDevice) return;
    const name = document.getElementById('cfg-dev-name').value;
    this.selectedDevice.name = name;

    if (this.selectedDevice.type !== 'switch') {
      const ip = document.getElementById('cfg-dev-ip').value.trim();
      const mask = document.getElementById('cfg-dev-mask').value.trim();
      const gw = document.getElementById('cfg-dev-gw').value.trim();
      const status = document.getElementById('cfg-dev-status').value;

      this.selectedDevice.ip = ip;
      this.selectedDevice.netmask = mask;
      this.selectedDevice.gateway = gw;
      this.selectedDevice.status = status;

      const calcPrefix = SubnetEngine.maskToPrefix(mask);
      if (calcPrefix !== null) {
        this.selectedDevice.prefix = calcPrefix;
      }
    }

    this.render();
    this.updateStudentProgress();
    closeModal();
    this.logTerminal(`[KONFIGURASI] Alat '${this.selectedDevice.name}' berhasil diperbarui oleh siswa (IP: ${this.selectedDevice.ip || 'Layer 2'}).`);
    showToast(`Konfigurasi '${this.selectedDevice.name}' berhasil disimpan!`, 'success');
  },

  // Student Self-Validation against scenario specifications
  validateStudentConfigurations() {
    const sc = this.scenarios[this.currentScenarioId];
    if (!sc || !sc.referenceTable || sc.id === 0) {
      showToast('Mode Bebas: Tidak ada batasan skenario khusus. Anda bebas berkreasi!', 'info');
      return;
    }

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    let allCorrect = true;
    let evalRows = '';

    for (const ref of sc.referenceTable) {
      if (ref.type === 'Switch') {
        const found = this.devices.find(d => d.type === 'switch');
        evalRows += `
          <tr>
            <td><strong>${ref.device}</strong></td>
            <td>Layer 2 (Switch)</td>
            <td><span class="badge badge-success">✅ Otomatis Sesuai</span></td>
            <td>Switch tidak membutuhkan IP.</td>
          </tr>
        `;
        continue;
      }

      const dev = this.devices.find(d => d.name === ref.device);
      if (!dev) {
        allCorrect = false;
        evalRows += `
          <tr>
            <td><strong>${ref.device}</strong></td>
            <td>-</td>
            <td><span class="badge badge-danger">❌ Belum Dibuat</span></td>
            <td>Alat ini belum ada di kanvas. Tambahkan dari palet!</td>
          </tr>
        `;
      } else if (!dev.ip || dev.ip.trim() === '') {
        allCorrect = false;
        evalRows += `
          <tr>
            <td><strong>${ref.device}</strong></td>
            <td><em>Kosong</em></td>
            <td><span class="badge badge-warning">⚠️ Belum Diisi</span></td>
            <td>Klik alat di kanvas lalu isi IP: <code>${ref.targetIp}</code></td>
          </tr>
        `;
      } else {
        const isIpCorrect = (dev.ip === ref.targetIp);
        const isMaskCorrect = (!ref.netmask || ref.netmask === '-' || dev.netmask === ref.netmask);
        const isGwCorrect = (!ref.gateway || ref.gateway === '-' || dev.gateway === ref.gateway);

        if (isIpCorrect && isMaskCorrect && isGwCorrect) {
          evalRows += `
            <tr>
              <td><strong>${ref.device}</strong></td>
              <td><code>${dev.ip}/${dev.prefix || 24}</code></td>
              <td><span class="badge badge-success">✅ Tepat</span></td>
              <td>Konfigurasi sudah sesuai dengan acuan skenario.</td>
            </tr>
          `;
        } else {
          allCorrect = false;
          let notes = [];
          if (!isIpCorrect) notes.push(`IP Anda: ${dev.ip} (Harusnya: ${ref.targetIp})`);
          if (!isMaskCorrect) notes.push(`Netmask Anda: ${dev.netmask} (Harusnya: ${ref.netmask})`);
          if (!isGwCorrect) notes.push(`Gateway Anda: ${dev.gateway} (Harusnya: ${ref.gateway})`);

          evalRows += `
            <tr>
              <td><strong>${ref.device}</strong></td>
              <td><code>${dev.ip}/${dev.prefix || 24}</code></td>
              <td><span class="badge badge-danger">❌ Belum Sesuai</span></td>
              <td><small>${notes.join('<br>')}</small></td>
            </tr>
          `;
        }
      }
    }

    modalTitle.textContent = `📋 Hasil Evaluasi Konfigurasi Mandiri Siswa`;
    modalBody.innerHTML = `
      <div class="callout ${allCorrect ? 'callout-success' : 'callout-info'}" style="margin-bottom:1.25rem;">
        ${allCorrect 
          ? '<strong>🎉 Luar Biasa!</strong> Seluruh alat telah dikonfigurasi dengan tepat sesuai dengan ketentuan skenario pembelajaran. Silakan lakukan <strong>Uji Ping Cepat</strong> untuk membuktikan konektivitas jaringan!'
          : '<strong>Periksa Kembali:</strong> Ada beberapa alat yang belum diisi atau parameternya belum sesuai dengan ketentuan acuan skenario. Silakan edit alat terkait pada kanvas!'}
      </div>

      <div class="table-responsive">
        <table class="custom-table" style="font-size:0.8rem;">
          <thead>
            <tr>
              <th>Nama Alat</th>
              <th>Input Siswa</th>
              <th>Status</th>
              <th>Evaluasi & Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${evalRows}
          </tbody>
        </table>
      </div>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
      ${allCorrect ? `
        <button class="btn btn-primary" onclick="closeModal(); TopologySim.openPingTesterModal();">
          🚀 Lanjut ke Uji Ping
        </button>
      ` : ''}
    `;

    openModal();
  },

  deleteSelectedDevice() {
    if (!this.selectedDevice) return;
    const id = this.selectedDevice.id;
    const name = this.selectedDevice.name;

    this.links = this.links.filter(l => l.sourceId !== id && l.targetId !== id);
    this.devices = this.devices.filter(d => d.id !== id);

    this.render();
    this.updateStudentProgress();
    closeModal();
    this.logTerminal(`[DELETE] Alat '${name}' dan seluruh kabel terhubung telah dihapus.`);
  },

  clearCanvas() {
    if (confirm('Bersihkan seluruh alat pada kanvas simulasi?')) {
      this.devices = [];
      this.links = [];
      this.render();
      this.updateStudentProgress();
      this.logTerminal(`[RESET] Seluruh alat kanvas telah dibersihkan.`);
    }
  },

  // Terminal Logging
  logTerminal(msg, isError = false) {
    if (!this.terminalLogs) return;
    const el = document.createElement('div');
    el.innerHTML = `<span style="color:${isError ? '#F87171' : '#38BDF8'}">&gt;</span> ${msg}`;
    this.terminalLogs.appendChild(el);
    this.terminalLogs.scrollTop = this.terminalLogs.scrollHeight;
  },

  clearTerminal() {
    if (this.terminalLogs) {
      this.terminalLogs.innerHTML = '<div>[CONSOLE LOG CLEARED]</div>';
    }
  },

  handleTerminalKey(e) {
    if (e.key === 'Enter') {
      const input = document.getElementById('terminal-cmd-input');
      const cmd = input.value.trim();
      if (!cmd) return;
      input.value = '';
      this.executeCommand(cmd);
    }
  },

  executeCommand(cmd) {
    this.logTerminal(`NetLearn-Router# ${cmd}`);
    const parts = cmd.split(' ');
    const action = parts[0].toLowerCase();

    if (action === 'help') {
      this.logTerminal(`Daftar Perintah Cisco Simulator:`);
      this.logTerminal(`- ping &lt;target_ip&gt; : Menguji konektivitas ICMP`);
      this.logTerminal(`- show ip route : Menampilkan tabel routing router`);
      this.logTerminal(`- show ip interface brief : Menampilkan status antarmuka semua host`);
      this.logTerminal(`- clear : Membersihkan log konsol`);
    } else if (action === 'clear') {
      this.clearTerminal();
    } else if (action === 'show' && parts[1] === 'ip' && parts[2] === 'route') {
      this.logTerminal(`Codes: C - connected, S - static, R - RIP`);
      this.devices.filter(d => d.ip).forEach(d => {
        const calc = SubnetEngine.calculate(d.ip, d.prefix || 24);
        if (calc.success) {
          this.logTerminal(`C    ${calc.networkAddress}/${calc.prefix} is directly connected, FastEthernet0/0 (${d.name})`);
        }
      });
    } else if (action === 'show' && parts[1] === 'ip' && parts[2] === 'interface') {
      this.logTerminal(`Interface              IP-Address      OK? Status`);
      this.devices.forEach(d => {
        this.logTerminal(`${d.name.padEnd(22)} ${(d.ip || 'Belum Diisi').padEnd(15)} YES ${d.status}`);
      });
    } else if (action === 'ping') {
      const targetIp = parts[1];
      if (!targetIp) {
        this.logTerminal(`Format: ping &lt;Alamat IP Tujuan&gt; (Contoh: ping 192.168.1.11)`, true);
        return;
      }
      const sourceDev = this.devices.find(d => (d.type === 'pc' || d.type === 'laptop') && d.ip) || this.devices.find(d => d.ip);
      if (!sourceDev || !sourceDev.ip) {
        this.logTerminal(`Tidak ada perangkat PC aktif dengan IP valid untuk mengirim ping! Isi IP perangkat terlebih dahulu.`, true);
        return;
      }
      this.runPingTest(sourceDev, targetIp);
    } else {
      this.logTerminal(`% Perintah '${cmd}' tidak dikenali. Ketik 'help' untuk daftar perintah.`, true);
    }
  },

  // Breadth-First Search on the physical cable graph
  findPhysicalPath(sourceId, targetId) {
    const queue = [[sourceId]];
    const visited = new Set([sourceId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const curr = path[path.length - 1];
      if (curr === targetId) return path;

      const neighbors = [];
      for (const link of this.links) {
        if (link.sourceId === curr) neighbors.push(link.targetId);
        if (link.targetId === curr) neighbors.push(link.sourceId);
      }

      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }
    return null;
  },

  // Main Ping Engine with multi-hop animation & educational error diagnosis
  runPingTest(srcDevice, targetIp) {
    if (typeof NetLearnStore !== 'undefined' && NetLearnStore.state) {
      NetLearnStore.state.simulasiPingCount = (NetLearnStore.state.simulasiPingCount || 0) + 1;
      NetLearnStore.save();
    }
    this.logTerminal(`\n[ICMP] Mengirim 4 Echo Request dari ${srcDevice.name} (${srcDevice.ip}) ke ${targetIp}:`);
    
    // Update Wireshark Mini with packet details
    this.updateWiresharkDetails(srcDevice, targetIp);

    const targetDevice = this.devices.find(d => d.ip === targetIp);

    // Error 1: Target IP not found in entire topology
    if (!targetDevice) {
      this.showCanvasCallout(srcDevice.x + 40, srcDevice.y - 10, `❌ Request timed out: IP ${targetIp} tidak ditemukan pada alat apapun!`, true);
      setTimeout(() => {
        this.logTerminal(`Request timed out.`);
        this.logTerminal(`Request timed out.`);
        this.logTerminal(`Ping statistik untuk ${targetIp}: Terkirim = 4, Hilang = 4 (100% loss). Periksa konfigurasi IP pada alat tujuan!`, true);
      }, 600);
      return;
    }

    // Error 2: Target device port is DOWN
    if (targetDevice.status !== 'UP') {
      this.showCanvasCallout(targetDevice.x + 40, targetDevice.y - 10, `❌ Destination host unreachable: Port antarmuka ${targetDevice.name} dalam status DOWN!`, true);
      this.logTerminal(`Destination host unreachable (Port ${targetDevice.name} DOWN).`, true);
      return;
    }

    // Subnet logic calculation
    const srcMaskInt = SubnetEngine.prefixToMaskInt(srcDevice.prefix || 24);
    const srcIpInt = SubnetEngine.ipToInt(srcDevice.ip);
    const dstIpInt = SubnetEngine.ipToInt(targetIp);
    const isSameSubnet = ((srcIpInt & srcMaskInt) === (dstIpInt & srcMaskInt));

    if (isSameSubnet) {
      // Direct Layer 2 communication via Switch or Direct Cable
      const path = this.findPhysicalPath(srcDevice.id, targetDevice.id);
      if (!path) {
        this.showCanvasCallout(srcDevice.x + 40, srcDevice.y - 10, `❌ Jalur Terputus: Tidak ada kabel yang menghubungkan ${srcDevice.name} ke ${targetDevice.name}!`, true);
        this.logTerminal(`❌ GAGAL: ${srcDevice.name} dan ${targetDevice.name} satu subnet tetapi kabel fisik belum tersambung! Pasang kabel terlebih dahulu.`, true);
        return;
      }

      // Animate packet flight along the path
      this.animateMultiHopPacket(path, true, () => {
        this.logTerminal(`Reply from ${targetIp}: bytes=32 time=1ms TTL=128`);
        this.logTerminal(`Reply from ${targetIp}: bytes=32 time=1ms TTL=128`);
        this.logTerminal(`Reply from ${targetIp}: bytes=32 time=1ms TTL=128`);
        this.logTerminal(`Reply from ${targetIp}: bytes=32 time=1ms TTL=128`);
        this.logTerminal(`✅ SUKSES 100%: Host berada di Subnet yang sama. Ping berhasil 0% loss! Konfigurasi mandiri Anda berhasil.`);
        this.completeQuest('q1');
      });
    } else {
      // Different Subnets: Requires Default Gateway (Router)
      if (!srcDevice.gateway) {
        this.showCanvasCallout(srcDevice.x + 40, srcDevice.y - 10, `❌ Butuh Default Gateway! ${srcDevice.name} tidak tahu rute ke subnet ${targetIp}!`, true);
        this.logTerminal(`Destination host unreachable.`);
        this.logTerminal(`❌ GAGAL: ${srcDevice.name} dan ${targetDevice.name} berada pada subnet berbeda, dan ${srcDevice.name} belum memiliki Default Gateway! Edit alat ${srcDevice.name} dan isi Gateway-nya.`, true);
        return;
      }

      // Find Gateway Router
      const router = this.devices.find(d => d.type === 'router' && d.ip === srcDevice.gateway);
      if (!router) {
        this.showCanvasCallout(srcDevice.x + 40, srcDevice.y - 10, `❌ Gateway ${srcDevice.gateway} tidak ditemukan di topologi!`, true);
        this.logTerminal(`Default gateway (${srcDevice.gateway}) tidak merespons (Router tidak ditemukan). Pastikan Router memiliki IP tersebut.`, true);
        return;
      }

      // Find path from Src to Router, and Router to Target
      const pathToRouter = this.findPhysicalPath(srcDevice.id, router.id);
      if (!pathToRouter) {
        this.showCanvasCallout(srcDevice.x + 40, srcDevice.y - 10, `❌ Kabel Terputus: ${srcDevice.name} tidak terhubung ke Router Gateway (${router.name})!`, true);
        this.logTerminal(`❌ GAGAL: Tidak ada jalur kabel antara ${srcDevice.name} ke Router Gateway!`, true);
        return;
      }

      const pathToTarget = this.findPhysicalPath(router.id, targetDevice.id);
      if (!pathToTarget) {
        this.showCanvasCallout(router.x + 40, router.y - 10, `❌ Kabel Terputus: Router ${router.name} tidak terhubung ke ${targetDevice.name}!`, true);
        this.logTerminal(`❌ GAGAL: Router tidak memiliki jalur fisik ke subnet ${targetDevice.name}!`, true);
        return;
      }

      // Combined Full Routed Path
      const fullPath = [...pathToRouter, ...pathToTarget.slice(1)];

      this.animateMultiHopPacket(fullPath, true, () => {
        this.logTerminal(`Reply from ${targetIp}: bytes=32 time=4ms TTL=127 (Dirutekan via ${router.name})`);
        this.logTerminal(`Reply from ${targetIp}: bytes=32 time=3ms TTL=127`);
        this.logTerminal(`Reply from ${targetIp}: bytes=32 time=3ms TTL=127`);
        this.logTerminal(`Reply from ${targetIp}: bytes=32 time=3ms TTL=127`);
        this.logTerminal(`✅ SUKSES INTER-SUBNET: Paket berhasil dirutekan melewati Router ${router.name} (TTL berkurang 1 menjadi 127)!`);
        this.completeQuest('q2');
      });
    }
  },

  // Animate packet sequentially hop by hop along the path, then return
  animateMultiHopPacket(pathNodeIds, isSuccess, onComplete) {
    if (!this.packetsGroup || pathNodeIds.length < 2) return;

    // Create SVG Packet Token (Envelope badge)
    const packetG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    packetG.innerHTML = `
      <circle r="14" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5" filter="url(#packet-glow)" />
      <text y="4" text-anchor="middle" font-size="12">✉️</text>
    `;
    this.packetsGroup.appendChild(packetG);

    const speedFactor = 1 / Math.max(0.2, this.simSpeed);
    const hopDuration = 600 * speedFactor;

    // Forward trip animation
    this.animateHopChain(packetG, pathNodeIds, 0, hopDuration, () => {
      // Arrived at destination -> Celebrate with pulse
      const destDev = this.devices.find(d => d.id === pathNodeIds[pathNodeIds.length - 1]);
      if (destDev) {
        this.pulseDevice(destDev.id, '#10B981', 'Echo Request Diterima');
      }

      // Return trip animation (Echo Reply)
      const returnPath = pathNodeIds.slice().reverse();
      packetG.querySelector('circle').setAttribute('fill', '#10B981');
      packetG.querySelector('text').textContent = '📬';

      setTimeout(() => {
        this.animateHopChain(packetG, returnPath, 0, hopDuration, () => {
          const srcDev = this.devices.find(d => d.id === pathNodeIds[0]);
          if (srcDev) {
            this.pulseDevice(srcDev.id, '#10B981', 'Echo Reply Diterima!');
          }
          if (packetG.parentNode) packetG.parentNode.removeChild(packetG);
          if (onComplete) onComplete();
        });
      }, 300 * speedFactor);
    });
  },

  animateHopChain(packetEl, nodeIds, currIndex, hopDuration, onFinished) {
    if (currIndex >= nodeIds.length - 1) {
      if (onFinished) onFinished();
      return;
    }

    const srcDev = this.devices.find(d => d.id === nodeIds[currIndex]);
    const dstDev = this.devices.find(d => d.id === nodeIds[currIndex + 1]);
    if (!srcDev || !dstDev) {
      if (onFinished) onFinished();
      return;
    }

    const link = this.links.find(l => 
      (l.sourceId === srcDev.id && l.targetId === dstDev.id) ||
      (l.sourceId === dstDev.id && l.targetId === srcDev.id)
    );
    let lineEl = null;
    if (link) {
      lineEl = document.getElementById(link.id);
      if (lineEl) lineEl.classList.add('active-cable');
    }

    if (currIndex > 0) {
      if (srcDev.type === 'switch') {
        this.pulseDevice(srcDev.id, '#818CF8', 'L2 Frame Forwarding');
      } else if (srcDev.type === 'router') {
        this.pulseDevice(srcDev.id, '#38BDF8', 'L3 IP Routing Table Lookup');
      }
    }

    const startX = srcDev.x + 44;
    const startY = srcDev.y + 44;
    const endX = dstDev.x + 44;
    const endY = dstDev.y + 44;

    const frames = 25;
    const intervalTime = hopDuration / frames;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const ratio = frame / frames;
      const curX = startX + (endX - startX) * ratio;
      const curY = startY + (endY - startY) * ratio;
      packetEl.setAttribute('transform', `translate(${curX}, ${curY})`);

      if (frame >= frames) {
        clearInterval(timer);
        if (lineEl) lineEl.classList.remove('active-cable');
        this.animateHopChain(packetEl, nodeIds, currIndex + 1, hopDuration, onFinished);
      }
    }, intervalTime);
  },

  pulseDevice(devId, colorHex, label) {
    const nodeG = document.getElementById(`node-${devId}`);
    if (!nodeG) return;
    const rect = nodeG.querySelector('.node-card');
    if (rect) {
      rect.setAttribute('stroke', colorHex);
      rect.setAttribute('stroke-width', '3.5');
      setTimeout(() => {
        const d = this.devices.find(x => x.id === devId);
        rect.setAttribute('stroke', d && d.ip ? '#334155' : '#F59E0B');
        rect.setAttribute('stroke-width', '1.5');
      }, 700);
    }
    const dev = this.devices.find(x => x.id === devId);
    if (dev && label) {
      this.showCanvasCallout(dev.x + 40, dev.y - 12, label, false);
    }
  },

  showCanvasCallout(x, y, text, isError) {
    const callout = document.createElement('div');
    callout.className = 'packet-callout';
    callout.style.left = `${x}px`;
    callout.style.top = `${y}px`;
    callout.style.borderColor = isError ? '#EF4444' : '#38BDF8';
    callout.style.color = isError ? '#FCA5A5' : '#FFFFFF';
    callout.innerHTML = text;

    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.appendChild(callout);
      setTimeout(() => {
        if (callout.parentNode) callout.parentNode.removeChild(callout);
      }, 3500);
    }
  },

  updateWiresharkDetails(src, targetIp) {
    const content = document.getElementById('inspector-content');
    if (!content) return;

    content.innerHTML = `
      <div style="color:#38BDF8; font-weight:700; margin-bottom:4px;">▶ Frame: ICMP Echo Packet In Transit</div>
      <div style="color:#A78BFA; font-weight:600;">▼ Ethernet II (Layer 2 Data Link):</div>
      &nbsp;&nbsp;Source MAC: 00:1A:2B:3C:${src.id.slice(-4, -2) || '01'}:${src.id.slice(-2)}<br>
      &nbsp;&nbsp;Destination MAC: FF:FF:FF:FF:FF:FF (Broadcast/Gateway)<br>
      &nbsp;&nbsp;EtherType: IPv4 (0x0800)<br>
      <div style="color:#60A5FA; font-weight:600; margin-top:4px;">▼ Internet Protocol Version 4 (Layer 3 Network):</div>
      &nbsp;&nbsp;Source IP: ${src.ip || '0.0.0.0'} (Prefix /${src.prefix || 24})<br>
      &nbsp;&nbsp;Destination IP: ${targetIp}<br>
      &nbsp;&nbsp;Time to Live (TTL): 128<br>
      &nbsp;&nbsp;Protocol: ICMP (1)<br>
      <div style="color:#34D399; font-weight:600; margin-top:4px;">▼ Internet Control Message Protocol (Layer 4):</div>
      &nbsp;&nbsp;Type: 8 (Echo Request)<br>
      &nbsp;&nbsp;Code: 0<br>
      &nbsp;&nbsp;Sequence Number: 1, Identifier: 0x0042
    `;
  },

  openPingTesterModal() {
    const clients = this.devices.filter(d => d.ip && d.ip.trim() !== '');
    if (clients.length < 2) {
      alert('Konfigurasikan minimal 2 perangkat dengan alamat IP terlebih dahulu untuk menguji Ping.');
      return;
    }

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.textContent = 'Uji Ping Interaktif (ICMP Simulation)';
    modalBody.innerHTML = `
      <div class="form-group">
        <label class="form-label">Pilih Host Pengirim (Source):</label>
        <select id="ping-src-select" class="form-control">
          ${clients.map(c => `<option value="${c.id}">${c.name} (${c.ip}/${c.prefix || 24})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Pilih Host Tujuan (Destination):</label>
        <select id="ping-dst-select" class="form-control">
          ${clients.map((c, i) => `<option value="${c.ip}" ${i === 1 ? 'selected' : ''}>${c.name} (${c.ip}/${c.prefix || 24})</option>`).join('')}
        </select>
      </div>
      <div class="callout callout-info" style="font-size:0.78rem;">
        Sistem akan menghitung apakah kedua host berada di subnet yang sama atau membutuhkan rute router gateway, lalu menyimulasikan transmisi paket di kanvas secara bertahap!
      </div>
    `;

    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
      <button class="btn btn-primary" onclick="TopologySim.executeModalPing()">Kirim Ping Sekarang</button>
    `;

    openModal();
  },

  executeModalPing() {
    const srcId = document.getElementById('ping-src-select').value;
    const dstIp = document.getElementById('ping-dst-select').value;
    const src = this.devices.find(d => d.id === srcId);
    closeModal();
    if (src && dstIp) {
      this.runPingTest(src, dstIp);
    }
  },

  // Load scenarios with unconfigured devices so student must input them
  loadScenario(scenarioId) {
    this.devices = [];
    this.links = [];

    const sc = this.scenarios[scenarioId];
    if (!sc) return;

    if (sc.initialDevices && sc.initialDevices.length > 0) {
      // Create devices with blank configuration for student
      const createdDevices = [];
      for (const d of sc.initialDevices) {
        const newDev = this.addDevice(d.type, {
          name: d.name,
          x: d.x,
          y: d.y,
          ip: '', // Blank for student to fill!
          netmask: '',
          prefix: '',
          gateway: '',
          status: 'UP'
        });
        createdDevices.push(newDev);
      }

      // Connect initial wiring if specified
      if (sc.initialLinks) {
        for (const l of sc.initialLinks) {
          if (createdDevices[l.sourceIdx] && createdDevices[l.targetIdx]) {
            this.links.push({
              id: 'link_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              sourceId: createdDevices[l.sourceIdx].id,
              targetId: createdDevices[l.targetIdx].id,
              status: 'UP'
            });
          }
        }
      }
    }

    this.render();
    this.updateStudentProgress();
    this.logTerminal(`[${sc.title.toUpperCase()} DIMUAT] Rujuk tabel acuan di atas dan klik alat di kanvas untuk mengisi parameter IP mandiri!`);
  },

  downloadPacketTracerGuide() {
    const textContent = `Panduan Praktik Laboratorium Cisco Packet Tracer - SMK Negeri 3 Makassar
Mata Pelajaran: Perencanaan dan Pengalamatan Jaringan
Model: Konfigurasi Topologi & Pengalamatan IP NetLearn

SKENARIO AKTIF: ${this.scenarios[this.currentScenarioId] ? this.scenarios[this.currentScenarioId].title : 'Mode Bebas'}

STATUS KONFIGURASI ALAT SAAT INI:
${this.devices.map(d => `- Perangkat: ${d.name} (${d.type.toUpperCase()}) | IP: ${d.ip || 'BELUM DIISI'} | Subnet Mask: ${d.netmask || 'BELUM DIISI'} | Gateway: ${d.gateway || '-'}`).join('\n')}

PETUNJUK PENGERJAAN MANDIRI:
1. Buka Cisco Packet Tracer, letakkan perangkat sesuai model NetLearn di atas.
2. Hubungkan kabel fisik antar-alat.
3. Klik masing-masing PC -> Masuk tab 'Desktop' -> Pilih 'IP Configuration'.
4. Masukkan IP Address, Subnet Mask, dan Default Gateway sesuai tabel panduan skenario.
5. Pada Router, masuk tab 'CLI' dan masukkan perintah:
   enable
   configure terminal
   interface FastEthernet0/0
   ip address 192.168.1.1 255.255.255.128
   no shutdown
   exit
6. Lakukan pengetesan ICMP Ping di Command Prompt PC untuk memastikan status konektivitas 'Reply from...' 0% packet loss.
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Panduan_Cisco_Packet_Tracer_NetLearn.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Panduan konfigurasi Packet Tracer berhasil diunduh!', 'success');
  }
};

window.TopologySim = TopologySim;
