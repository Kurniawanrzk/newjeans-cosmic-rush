const networkGame = new NetworkGame('gameCanvas');

let imagesLoaded = 0;
// LAMA: const totalImages = 2;
const totalImages = 3; // BARU: Tunggu 3 gambar (background, haerin, minji)

const onImageLoad = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        networkGame.init(); //
    }
};

// Ganti properti yang dicek
networkGame.characterImages.haerin.onload = onImageLoad;
networkGame.characterImages.minji.onload = onImageLoad;
networkGame.backgroundImage.onload = onImageLoad; //