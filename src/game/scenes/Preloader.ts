import { Scene } from "phaser";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        // Get the current canvas dimensions
        const { width, height } = this.scale;

        // 1. Background - stretch it to fill the screen
        this.add
            .image(width / 2, height / 2, "background")
            .setOrigin(0.5)
            .setDisplaySize(width, height);

        // 2. A simple progress bar outline
        //    Here we use 80% of the screen width for the bar
        const barWidth = width * 0.8;
        const barHeight = height * 0.05; // 5% of screen height
        const centerX = width / 2;
        const centerY = height * 0.9; // Position at 90% of screen height

        // Create the bar outline (centered)
        this.add
            .rectangle(centerX, centerY, barWidth, barHeight)
            .setStrokeStyle(2, 0xffffff)
            .setOrigin(0.5);

        // 3. The progress bar itself
        const bar = this.add
            .rectangle(
                centerX - barWidth / 2,
                centerY,
                4,
                barHeight - 4,
                0xffffff
            )
            .setOrigin(0, 0.5);

        // 4. Use the 'progress' event to update the loading bar width
        this.load.on("progress", (progress: number) => {
            bar.width = 4 + (barWidth - 4) * progress;
        });

        // 5. Add loading text
        this.add
            .text(centerX, centerY - barHeight * 2, "Loading...", {
                font: "24px Arial",
                color: "#ffffff",
            })
            .setOrigin(0.5);
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath("assets");
        this.load.image("logo", "logo.png");
        this.load.image("star", "star.png");
        this.load.image("background", "background.png"); // Make sure to load the background
    }

    create() {
        //  When all the assets have finished loading, move to the MainMenu
        this.scene.start("MainMenu");
    }
}

