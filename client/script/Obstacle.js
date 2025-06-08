        class Obstacle {
             constructor(canvasWidth, canvasHeight, speed) {
                this.speed = speed;
                this.width = Math.random() * 30 + 20;
                this.height = Math.random() * 50 + 20;
                this.x = canvasWidth;
                this.y = Math.random() * (canvasHeight - this.height);
                this.color = 'black';
            }
            draw(ctx) {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
            update() {
                this.x -= this.speed;
            }
        }