   class Character {
            constructor(x, y, width, height, image) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                this.image = image;
                this.speedY = 0; // Kecepatan vertikal
                this.speedX = 0; // Kecepatan horizontal
                this.moveSpeed = 4;
                this.idleCenterY = 0;
                this.trail = [];
                this.maxTrailLength = 30;
                this.statusMoving = false;
                this.xBeforeTrail = this.x;

            }

            draw(ctx, frame) {
                if (this.trail.length > 1) {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    for (let i = 1; i < this.trail.length; i++) {
                        const hue = (frame * 6 + i * 5) % 360;
                        const lineWidth = (this.height * 0.7) * (i / this.trail.length);
                        ctx.beginPath();
                        ctx.moveTo(this.trail[i-1].x + this.width / 2, this.trail[i-1].y + this.height / 2);
                        ctx.lineTo(this.trail[i].x + this.width / 2, this.trail[i].y + this.height / 2);
                        ctx.strokeStyle = `hsl(${hue}, 90%, 60%)`;
                        ctx.lineWidth = lineWidth;
                        ctx.stroke();
                    }
                }
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }

            update(ctx, frame,canvasWidth, canvasHeight) {
                this.trail.push({ x: this.x, y: this.y });
                if (this.trail.length > this.maxTrailLength ) {
                    this.trail.shift();
                }

                this.x += this.speedX;
                   if (this.speedY !== 0 || this.speedX !== 0) {
                    // Jika ada input gerak, perbarui posisi Y secara normal
                    this.y += this.speedY;
                    // Dan perbarui posisi pusat untuk efek mengambang nanti
                    this.idleCenterY = this.y;
                     if (this.trail.length > this.maxTrailLength ) {
                    this.trail.shift();
                }
                    this.xBeforeTrail = this.x;  
                } else {
                    if(this.xBeforeTrail !==  this.x + (-30)) {
                        this.xBeforeTrail += -1
                    } else {
                     this.trail.shift(); 
                        this.xBeforeTrail = this.x;
                    }
                    this.trail.push({ x: this.xBeforeTrail , y: this.y });
                    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
                                            this.trail.shift();

                    // Jika tidak ada input (idle), terapkan efek mengambang
                    const floatAmplitude = 5; // Jarak naik-turun
                    const floatSpeed = 0.04;  // Kecepatan mengambang
                    this.y = this.idleCenterY + Math.sin(frame * floatSpeed) * floatAmplitude;
                  
                }
                // Batas pergerakan
                if (this.y < 0) this.y = 0;
                if (this.y > 480) this.y = this.y;
                if (this.x < 0) this.x = 0;
                if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
            }

            moveUpDown(direction) {
                this.speedY = direction * this.moveSpeed;

                if(direction !== 0) {
                    this.statusMoving = true;
                } else {
                    this.statusMoving = false;
                }
            }
            
            moveRightLeft(direction) {
                this.speedX = direction * this.moveSpeed;
                 if(direction !== 0) {
                    this.statusMoving = true;
                } else {
                    this.statusMoving = false;
                }
            }
            
            reset() {
                this.y = 150;
                this.x = 30;
                this.speedY = 0;
                this.speedX = 0;
                this.trail = [];
            }
        }