# NewJeans' Cosmic Rush

<img src="https://raw.githubusercontent.com/Kurniawanrzk/newjeans-cosmic-rush/refs/heads/main/image.png"></img>
Selamat datang di **NewJeans' Cosmic Rush**! Ini adalah game web multiplayer real-time yang seru di mana Anda dan seorang teman dapat bermain sebagai anggota NewJeans, Haerin dan Minji. Hindari rintangan yang datang, kumpulkan skor setinggi mungkin, dan bertahanlah lebih lama dari temanmu dalam petualangan kosmik ini!

## ✨ Fitur Utama

* **Multiplayer Real-Time:** Bermain bersama teman secara langsung dalam satu room yang sama melalui koneksi WebSocket.
* **Server-Authoritative Logic:** Logika inti permainan (pergerakan, skor, tabrakan) ditangani oleh server untuk memastikan permainan yang adil.
* **Karakter Ikonik:** Pilih antara karakter Haerin atau Minji yang ditetapkan secara otomatis saat memasuki room.
* **Kontrol Responsif:** Dukungan penuh untuk keyboard (tombol panah) di desktop dan kontrol sentuh (D-pad virtual) di perangkat mobile.
* **Efek Visual Menarik:**
    * Latar belakang parallax yang bergerak dinamis.
    * Efek jejak (trail) warna-warni yang mengikuti pergerakan karakter.
    * Peningkatan kecepatan rintangan seiring berjalannya waktu untuk tantangan ekstra.
* **UI Lengkap:** Tampilan status koneksi, jumlah pemain, skor, dan pesan game over yang jelas.

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan teknologi web modern:

* **Frontend (Client):**
    * HTML5 Canvas
    * JavaScript (ES6 Classes)
    * CSS3

* **Backend (Server):**
    * Node.js
    * Express.js (untuk menyajikan file client)
    * WebSocket (`ws` library) (untuk komunikasi real-time)

## 🚀 Panduan Instalasi & Menjalankan

Untuk menjalankan game ini di lingkungan lokal Anda, ikuti langkah-langkah berikut.

### Prasyarat

Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (yang sudah termasuk npm).

### 1. Setup Server

Pertama, jalankan server backend.

1.  **Clone repositori ini:**
    ```bash
    git clone [https://github.com/Kurniawanrzk/newjeans-cosmic-rush.git](https://github.com/Kurniawanrzk/newjeans-cosmic-rush.git)
    cd newjeans-cosmic-rush/server
    ```

2.  **Instal dependensi server:**
    ```bash
    npm install
    ```

3.  **Jalankan server:**
    ```bash
    npm start
    ```
    Secara default, server akan berjalan di `http://0.0.0.0:3000`. Catat alamat IP lokal Anda di jaringan (misalnya `192.168.1.10`).

### 2. Konfigurasi Client

Client perlu tahu alamat IP server untuk terhubung.

1.  **Buka file client utama:**
    Buka file `client/script/NetworkGame.js`.

2.  **Ubah Alamat WebSocket:**
    Cari baris berikut (sekitar baris 49):
    ```javascript
    const wsUrl = `ws://192.168.0.14:3000/`;
    ```
    Ganti alamat IP `192.168.0.14` dengan **alamat IP lokal mesin tempat Anda menjalankan server**. Contoh:
    ```javascript
    const wsUrl = `ws://192.168.1.10:3000/`;
    ```

### 3. Mainkan Game!

1.  Buka browser (seperti Chrome atau Firefox) di komputer Anda atau perangkat mobile yang terhubung ke jaringan WiFi yang sama.
2.  Akses alamat: `http://ALAMAT_IP_SERVER_ANDA:3000`. Contoh: `http://192.168.1.10:3000`.
3.  Buka tab atau perangkat kedua dan akses alamat yang sama untuk memulai permainan multiplayer. Game akan dimulai secara otomatis ketika dua pemain telah terhubung.

## 📁 Struktur Proyek

```
newjeans-cosmic-rush/
├── client/                      # Semua file untuk sisi client (frontend)
│   ├── assets/                  # Folder untuk gambar, suara, dll.
│   │   ├── bg1.gif
│   │   ├── haerin.png
│   │   └── minji.png
│   ├── script/                  # Kode JavaScript client
│   │   ├── Background.js
│   │   ├── Character.js         (Digunakan di versi single-player awal)
│   │   ├── Game.js              (Digunakan di versi single-player awal)
│   │   ├── NetworkGame.js       (Logika utama client multiplayer)
│   │   ├── Obstacle.js
│   │   └── main.js              (Titik masuk untuk client)
│   └── index.html               # File HTML utama
│
├── server/                      # Semua file untuk sisi server (backend)
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js                # Logika utama server WebSocket dan game
│
└── README.md                    # File yang sedang Anda baca
```
