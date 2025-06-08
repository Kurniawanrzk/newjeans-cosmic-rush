// NetworkGame.js - Game client yang dimodifikasi untuk multiplayer
class NetworkGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.frame = 0;
        this.score = 0;
        this.gameState = 'connecting';
        
        // Network properties
        this.ws = null;
        this.playerId = null;
        this.roomId = 'default';
        this.players = new Map();
        this.obstacles = [];
        this.isHost = false;
        
        // Input handling
        this.keys = {};
        this.touchInput = { x: 0, y: 0 }; // <-- TAMBAHKAN state untuk input sentuh
        this.lastInputState = { x: 0, y: 0 };
        
        this.characterImages = {
            haerin: new Image(),
            minji: new Image()
        };
        this.characterImages.haerin.src = 'assets/haerin.png'; // Gambar untuk Player 1
        this.characterImages.minji.src = 'assets/minji.png';   // Gambar untuk Player 2

        this.characterImages.haerin.onerror = () => { this.characterImages.haerin.src = 'https://placehold.co/50x50/FFF/000?text=P1'; };
        this.characterImages.minji.onerror = () => { this.characterImages.minji.src = 'https://placehold.co/50x50/000/FFF?text=P2'; };
        
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'assets/backgroundGame.gif'; //
        this.backgroundImage.onerror = () => {
            console.error("Gagal memuat gambar latar belakang.");
        };
        
        this.background = null;
        
        this.setupEventListeners();
        this.connectToServer();
    }
    
    connectToServer() {
        const wsUrl = `ws://192.168.0.14:3000/`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to server');
            this.joinRoom();
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.gameState = 'disconnected';
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.gameState = 'error';
        };
    }
    
    joinRoom() {
        this.playerId = `player_${Date.now()}_${Math.random()}`;
        this.ws.send(JSON.stringify({
            type: 'joinRoom',
            playerId: this.playerId,
            roomId: this.roomId
        }));
    }
    
    handleServerMessage(data) {
        switch (data.type) {
            case 'joinedRoom':
                this.playerId = data.playerId;
                this.gameState = 'waiting';
                console.log(`Joined room as ${this.playerId}`);
                break;
                
            case 'playerJoined':
                console.log(`Player ${data.playerId} joined`);
                this.gameState = data.players.length >= 2 ? 'ready' : 'waiting';
                break;
                
            case 'playerLeft':
                console.log(`Player ${data.playerId} left`);
                this.players.delete(data.playerId);
                this.gameState = 'waiting';
                break;
                
            case 'gameStart':
                this.gameState = 'playing';
                this.frame = 0;
                this.score = 0;
                this.obstacles = [];
                console.log('Game started!');
                break;
                
            case 'gameState':
                this.updateGameState(data);
                break;
                
            case 'playerDied':
                const player = this.players.get(data.playerId);
                if (player) {
                    player.alive = false;
                }
                break;
                
            case 'gameOver':
                this.gameState = 'gameOver';
                this.score = data.score;
                break;
                
            case 'error':
                console.error('Server error:', data.message);
                this.gameState = 'error';
                break;
        }
    }
    
updateGameState(data) {
          if (data.state && this.gameState !== data.state) { // <-- TAMBAHKAN BLOK IF INI
            this.gameState = data.state;
        }

        this.frame = data.frame; //
        this.score = data.score; //
        this.obstacles = data.obstacles; //
        
        this.players.clear(); //
        data.players.forEach(playerData => {
            this.players.set(playerData.id, {
                id: playerData.id,
                x: playerData.x,
                y: playerData.y,
                alive: playerData.alive,
                trail: playerData.trail,
                isMe: playerData.id === this.playerId,
                character: playerData.character // <-- SIMPAN INFO KARAKTER DARI SERVER
            });
        });
    }
    
        
// updateGameState(data) {
//         // Atur gameState klien berdasarkan status dari server
  
//         this.frame = data.frame;
//         this.score = data.score;
//         this.obstacles = data.obstacles;
        
//         // Update players
//         this.players.clear();
//         data.players.forEach(playerData => {
//             this.players.set(playerData.id, {
//                 id: playerData.id,
//                 x: playerData.x,
//                 y: playerData.y,
//                 alive: playerData.alive,
//                 trail: playerData.trail,
//                 isMe: playerData.id === this.playerId
//             });
//         });
//     }
setupEventListeners() {
    // Listener untuk memulai/merestart game
    const startGame = () => {
        // Hanya restart jika game sudah selesai
        if (this.gameState === 'gameOver') {
            this.restartGame();
        }
    };
    this.canvas.addEventListener('click', () => { // Menggunakan 'click' lebih cocok daripada 'mousedown'
        if (this.gameState === 'gameOver') {
            this.restartGame();
        }
    });
    document.addEventListener('keydown', (evt) => {
        if ((evt.key === ' ' || evt.key === 'Enter') && this.gameState === 'gameOver') {
            this.restartGame();
        }
    });

    // --- INPUT GERAKAN ---

    // 1. Listener untuk Keyboard
    // Hanya mengubah state 'keys', tidak langsung mengirim input
    document.addEventListener('keydown', (evt) => {
        this.keys[evt.key] = true;
    });

    document.addEventListener('keyup', (evt) => {
        this.keys[evt.key] = false;
    });

    // 2. Listener untuk Kontrol Sentuh (Mobile)
    // Mengambil elemen tombol sentuh dari HTML
    const upButton = document.getElementById('touch-up');
    const downButton = document.getElementById('touch-down');
    const leftButton = document.getElementById('touch-left');
    const rightButton = document.getElementById('touch-right');
    const controls = [upButton, downButton, leftButton, rightButton];

    // Fungsi helper untuk menangani saat tombol disentuh
    const handleTouch = (e, x, y) => {
        e.preventDefault(); // Mencegah scrolling atau zoom pada browser mobile
        this.touchInput.x = x;
        this.touchInput.y = y;
    };

    // Fungsi helper untuk menangani saat sentuhan dilepas
    const handleTouchEnd = (e) => {
        e.preventDefault();
        this.touchInput = { x: 0, y: 0 }; // Reset input sentuh
    };

    // Menambahkan listener ke setiap tombol
    upButton.addEventListener('touchstart', (e) => handleTouch(e, 0, -1));
    downButton.addEventListener('touchstart', (e) => handleTouch(e, 0, 1));
    leftButton.addEventListener('touchstart', (e) => handleTouch(e, -1, 0));
    rightButton.addEventListener('touchstart', (e) => handleTouch(e, 1, 0));

    // Menambahkan listener 'touchend' untuk semua tombol
    controls.forEach(button => {
        button.addEventListener('touchend', handleTouchEnd);
        button.addEventListener('touchcancel', handleTouchEnd); // Jika sentuhan dibatalkan sistem
    });
}
    
handleInput() {
    // Hanya proses input jika sedang dalam permainan
    if (this.gameState !== 'playing' || !this.ws) return;

    let x = 0, y = 0;

    // Langkah 1: Cek input dari keyboard
    if (this.keys['ArrowLeft']) x = -1;
    else if (this.keys['ArrowRight']) x = 1;

    if (this.keys['ArrowUp']) y = -1;
    else if (this.keys['ArrowDown']) y = 1;

    // Langkah 2: Jika tidak ada input keyboard, gunakan input dari sentuhan
    // Ini membuat keyboard menjadi prioritas utama jika keduanya digunakan
    if (x === 0 && y === 0) {
        x = this.touchInput.x;
        y = this.touchInput.y;
    }

    // Langkah 3: Hanya kirim data ke server jika ada perubahan dari state sebelumnya
    if (x !== this.lastInputState.x || y !== this.lastInputState.y) {
        this.ws.send(JSON.stringify({
            type: 'playerInput',
            input: {
                type: 'move',
                x: x,
                y: y
            }
        }));

        // Simpan state input terakhir untuk perbandingan di frame berikutnya
        this.lastInputState = { x, y };
    }
}
    
    restartGame() {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'restartGame'
            }));
        }
    }
    
    init() {
        this.background = new Background(this.backgroundImage, 0.5, this.canvas.width, this.canvas.height);
        this.loop();
    }
    
    update() {
        if (this.gameState === 'playing' && this.background) {
            this.background.update(2.5); // Use constant speed for background
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        if (this.background) {
            this.background.draw(this.ctx);
        }
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
        
        // Draw players
        this.players.forEach(player => {
            this.drawPlayer(player);
        });
        
        this.drawUI();
    }
    
    drawPlayer(player) {
        // Draw trail
        if (player.trail && player.trail.length > 1) {
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            for (let i = 1; i < player.trail.length; i++) {
                const hue = player.isMe ? 
                    (this.frame * 6 + i * 5) % 360 : 
                    ((this.frame * 6 + i * 5) % 360 + 180) % 360; // Different color for other players
                
                const lineWidth = (45 * 0.7) * (i / player.trail.length);
                this.ctx.beginPath();
                this.ctx.moveTo(player.trail[i-1].x + 22.5, player.trail[i-1].y + 22.5);
                this.ctx.lineTo(player.trail[i].x + 22.5, player.trail[i].y + 22.5);
                this.ctx.strokeStyle = `hsl(${hue}, 90%, 60%)`;
                this.ctx.lineWidth = lineWidth;
                this.ctx.stroke();
            }
        }
        const imageToDraw = this.characterImages[player.character];

        // Draw character
        if (player.alive) {
             if (imageToDraw) {
                this.ctx.drawImage(imageToDraw, player.x, player.y, 45, 45);
            }
            // Draw player name/indicator
            this.ctx.fillStyle = player.isMe ? 'lime' : 'cyan';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                player.isMe ? 'YOU' : 'P2', 
                player.x + 22.5, 
                player.y - 5
            );
        } else {
            // Draw dead player indicator
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.fillRect(player.x, player.y, 45, 45);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💀', player.x + 22.5, player.y + 30);
        }
    }
    
    drawUI() {
        this.ctx.textAlign = 'left';
        
        // Score
        if (this.gameState === 'playing' || this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Skor: ${this.score}`, 10, 30);
        }
        
        // Connection status
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Players: ${this.players.size}/2`, 10, this.canvas.height - 10);
        
        // Game state messages
        this.ctx.textAlign = 'center';
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        switch (this.gameState) {
            case 'connecting':
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.font = '25px Arial';
                this.ctx.fillText('Connecting to server...', centerX, centerY);
                break;
                
            case 'waiting':
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.font = '25px Arial';
                this.ctx.fillText('Waiting for players...', centerX, centerY - 30);
                this.ctx.font = '18px Arial';
                this.ctx.fillText(`${this.players.size}/2 players connected`, centerX, centerY);
                break;
                
            case 'ready':
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.font = '25px Arial';
                this.ctx.fillText('Game starting...', centerX, centerY);
                break;
                
            case 'playing':
                // Show controls
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.font = '14px Arial';
                this.ctx.fillText('Use arrow keys to move', centerX, 50);
                break;
                
            case 'gameOver':
                this.ctx.font = '40px Arial';
                this.ctx.fillStyle = '#ff4757';
                this.ctx.fillText('Game Over', centerX, centerY - 20);
                
                this.ctx.font = '20px Arial';
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(`Final Score: ${this.score}`, centerX, centerY + 20);
                this.ctx.fillText('Click or press Space to restart', centerX, centerY + 60);
                break;
                
            case 'disconnected':
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                this.ctx.font = '25px Arial';
                this.ctx.fillText('Disconnected from server', centerX, centerY);
                break;
                
            case 'error':
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                this.ctx.font = '25px Arial';
                this.ctx.fillText('Connection error', centerX, centerY);
                break;
        }
    }
    
loop() {
    this.handleInput(); // Pastikan baris ini ada di paling atas loop
    this.update();
    this.draw();
    this.frame++;
    requestAnimationFrame(() => this.loop());
}
}

