class Background {
    constructor(image, speedModifier, canvasWidth, canvasHeight) {
        this.image = image;
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.x1 = 0;
        this.x2 = this.width;
        this.y = 0;
        this.speedModifier = speedModifier;
    }
    
    update(gameSpeed) {
        const speed = gameSpeed * this.speedModifier;
        this.x1 -= speed;
        this.x2 -= speed;
        if (this.x1 <= -this.width) this.x1 = this.width + this.x2 - speed;
        if (this.x2 <= -this.width) this.x2 = this.width + this.x1 - speed;
    }
    
    draw(ctx) {
        ctx.drawImage(this.image, this.x1, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.x2, this.y, this.width, this.height);
    }
}