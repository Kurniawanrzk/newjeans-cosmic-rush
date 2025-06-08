// server.js
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state
const gameRooms = new Map();
const characterTypes = ['haerin', 'minji'];

class GameRoom {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = new Map();
        this.obstacles = [];
        this.gameState = 'waiting'; // waiting, playing, gameOver
        this.frame = 0;
        this.score = 0;
        this.obstacleSpeed = 2.5;
        this.obstacleSpawnInterval = 30;
        this.maxPlayers = 2;
        this.gameLoop = null;
    }

    addPlayer(playerId, ws) {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }
        const character = characterTypes[this.players.size];

        this.players.set(playerId, {
            id: playerId,
            ws: ws,
            x: 30 + (this.players.size * 60),
            y: 150,
            width: 45,
            height: 45,
            speedX: 0,
            speedY: 0,
            alive: true,
            trail: [],
            character: character // <-- TAMBAHKAN PROPERTI INI
        });

        // Broadcast player joined
        this.broadcast({
            type: 'playerJoined',
            playerId: playerId,
            players: Array.from(this.players.keys())
        });

        // Start game if room is full
        if (this.players.size === this.maxPlayers) {
            this.startGame();
        }

        return true;
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        
        // Stop game if no players left
        if (this.players.size === 0) {
            this.stopGame();
        } else {
            this.broadcast({
                type: 'playerLeft',
                playerId: playerId,
                players: Array.from(this.players.keys())
            });
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.frame = 0;
        this.score = 0;
        this.obstacles = [];
        this.obstacleSpeed = 2.5;

        // Reset all players
        let xOffset = 0;
        for (let player of this.players.values()) {
            player.x = 30 + xOffset;
            player.y = 150;
            player.speedX = 0;
            player.speedY = 0;
            player.alive = true;
            player.trail = [];
            xOffset += 60;
        }

        this.broadcast({
            type: 'gameStart',
            gameState: this.gameState
        });

        // Start game loop
        this.gameLoop = setInterval(() => {
            this.update();
        }, 1000 / 60); // 60 FPS
    }

    stopGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        this.gameState = 'waiting';
    }

    handlePlayerInput(playerId, input) {
        const player = this.players.get(playerId);
        if (!player || !player.alive || this.gameState !== 'playing') return;

        const moveSpeed = 4;
        
        switch (input.type) {
            case 'move':
                player.speedX = input.x * moveSpeed;
                player.speedY = input.y * moveSpeed;
                break;
            case 'stop':
                if (input.axis === 'x') player.speedX = 0;
                if (input.axis === 'y') player.speedY = 0;
                break;
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Update players
        for (let player of this.players.values()) {
            if (!player.alive) continue;

            // Update position
            player.x += player.speedX;
            player.y += player.speedY;

            // Boundary check
            if (player.y < 0) player.y = 0;
            if (player.y + player.height > 480) player.y = 480 - player.height; // Canvas height
            if (player.x < 0) player.x = 0;
            if (player.x + player.width > 1000) player.x = 1000 - player.width; // Canvas width

            // Update trail
            player.trail.push({ x: player.x, y: player.y });
            if (player.trail.length > 30) {
                player.trail.shift();
            }
        }

        // Spawn obstacles
        if (this.frame % this.obstacleSpawnInterval === 0) {
            this.obstacles.push({
                id: Date.now() + Math.random(),
                x: 800, // Canvas width
                y: Math.random() * (400 - 70), // Canvas height - obstacle height
                width: Math.random() * 30 + 20,
                height: Math.random() * 50 + 20,
                speed: this.obstacleSpeed
            });
            this.obstacleSpeed += 0.02;
        }

        // Update obstacles
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= obstacle.speed;
            return obstacle.x + obstacle.width > 0;
        });

        // Check collisions
        this.checkCollisions();

        // Check if all players are dead
        const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);
        if (alivePlayers.length === 0) {
            this.gameState = 'gameOver';
            this.stopGame();
            this.broadcast({
                type: 'gameOver',
                score: Math.floor(this.score / 10)
            });
        }

        // Update score
        this.score++;
        this.frame++;

        // Broadcast game state
        this.broadcastGameState();
    }

    checkCollisions() {
        for (let player of this.players.values()) {
            if (!player.alive) continue;

            for (let obstacle of this.obstacles) {
                if (
                    player.x < obstacle.x + obstacle.width &&
                    player.x + player.width > obstacle.x &&
                    player.y < obstacle.y + obstacle.height &&
                    player.y + player.height > obstacle.y
                ) {
                    player.alive = false;
                    this.broadcast({
                        type: 'playerDied',
                        playerId: player.id
                    });
                }
            }
        }
    }

broadcastGameState() {
        const gameState = {
            type: 'gameState',
         state: this.gameState, // <-- TAMBAHKAN BARIS INI
            frame: this.frame,
            score: Math.floor(this.score / 10),
            obstacles: this.obstacles,
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                x: p.x,
                y: p.y,
                alive: p.alive,
                trail: p.trail,
                character: p.character // <-- KIRIM INFO KARAKTER KE KLIEN
            }))
        };

        this.broadcast(gameState);
    }

    broadcast(message, excludePlayerId = null) {
        for (let player of this.players.values()) {
            if (excludePlayerId && player.id === excludePlayerId) continue;
            if (player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        }
    }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    let playerId = null;
    let currentRoom = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'joinRoom':
                    playerId = data.playerId || `player_${Date.now()}_${Math.random()}`;
                    const roomId = data.roomId || 'default';
                    
                    // Get or create room
                    if (!gameRooms.has(roomId)) {
                        gameRooms.set(roomId, new GameRoom(roomId));
                    }
                    
                    currentRoom = gameRooms.get(roomId);
                    
                    if (currentRoom.addPlayer(playerId, ws)) {
                        ws.send(JSON.stringify({
                            type: 'joinedRoom',
                            playerId: playerId,
                            roomId: roomId,
                            players: Array.from(currentRoom.players.keys())
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Room is full'
                        }));
                    }
                    break;

                case 'playerInput':
                    if (currentRoom && playerId) {
                        currentRoom.handlePlayerInput(playerId, data.input);
                    }
                    break;

                case 'restartGame':
                    if (currentRoom && currentRoom.gameState === 'gameOver') {
                        currentRoom.startGame();
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('close', () => {
        if (currentRoom && playerId) {
            currentRoom.removePlayer(playerId);
            
            // Clean up empty rooms
            if (currentRoom.players.size === 0) {
                gameRooms.delete(currentRoom.roomId);
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});


const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // <-- Gunakan '0.0.0.0' untuk menerima koneksi dari IP manapun

server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});