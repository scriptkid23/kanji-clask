import Phaser from "phaser";
import { EventBus } from "../EventBus";

export class Game extends Phaser.Scene {
    private graphics!: Phaser.GameObjects.Graphics;
    private isDrawing = false;
    private lastPos: Phaser.Math.Vector2 | null = null;

    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;

    constructor() {
        super("Game");
    }

    preload() {
        // Load background image if it doesn't exist
        if (!this.textures.exists("background")) {
            this.load.image(
                "background",
                "/placeholder.svg?height=768&width=1024"
            );
        }
    }

    create() {
        this.graphics = this.add.graphics();
        this.graphics.lineStyle(10, 0x0000ff, 1);

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        this.background = this.add.image(512, 384, "background");
        this.background.setAlpha(0.5);

        EventBus.emit("current-scene-ready", this);

        this.input.on("pointerdown", this.startDrawing, this);
        this.input.on("pointermove", this.drawStroke, this);
        this.input.on("pointerup", this.stopDrawing, this);
    }

    private startDrawing(pointer: Phaser.Input.Pointer) {
        this.isDrawing = true;

        this.graphics.beginPath();
        this.graphics.moveTo(pointer.x, pointer.y);
        this.lastPos = new Phaser.Math.Vector2(pointer.x, pointer.y);
        EventBus.emit("draw:start", { x: pointer.x, y: pointer.y });
    }

    private drawStroke(pointer: Phaser.Input.Pointer) {
        if (!this.isDrawing || !this.lastPos) return;

        this.graphics.lineBetween(
            this.lastPos.x,
            this.lastPos.y,
            pointer.x,
            pointer.y
        );
        this.lastPos.set(pointer.x, pointer.y);
        EventBus.emit("draw:point", { x: pointer.x, y: pointer.y });
    }

    private captureAndSaveDrawing() {
        try {
            // Hide background temporarily
            const bgVisible = this.background.visible;
            this.background.visible = false;

            // Create a temporary canvas
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = this.game.canvas.width;
            tempCanvas.height = this.game.canvas.height;
            const ctx = tempCanvas.getContext("2d");

            if (!ctx) {
                console.error("Could not get canvas context");
                return;
            }

            // Set white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            // Take a snapshot of the current scene
            this.game.renderer.snapshot((image: HTMLImageElement) => {
                // Draw the snapshot onto our white background
                ctx.drawImage(image, 0, 0);

                // Convert to PNG and save
                const dataURL = tempCanvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.download = `drawing-${Date.now()}.png`;
                link.href = dataURL;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Restore background visibility
                this.background.visible = bgVisible;
            });
        } catch (error) {
            console.error("Error saving drawing:", error);
            // Make sure background is restored even if there's an error
            this.background.visible = true;
        }
    }

    private saveCanvasAsPNG(canvas: HTMLCanvasElement) {
        try {
            // Convert to PNG
            const dataURL = canvas.toDataURL("image/png");

            // Create and trigger download
            const link = document.createElement("a");
            link.download = `drawing-${Date.now()}.png`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error saving PNG:", error);
        }
    }

    private stopDrawing(pointer: Phaser.Input.Pointer) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.lastPos = null;

        this.graphics.closePath();

        // Capture and save the drawing before fading out
        this.captureAndSaveDrawing();

        EventBus.emit("draw:end", {});

        this.fadeOutGraphics();
    }

    private fadeOutGraphics() {
        this.tweens.add({
            targets: this.graphics,
            alpha: 0,
            duration: 500,
            ease: "Linear",
            onComplete: () => {
                this.clearDrawing();
                this.graphics.setAlpha(1);
            },
        });
    }

    public clearDrawing(): void {
        this.graphics.clear();
        this.graphics.lineStyle(10, 0x0000ff, 1);
        EventBus.emit("draw:clear", {});
    }

    changeScene() {
        this.scene.start("GameOver");
    }
}

