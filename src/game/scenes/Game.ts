import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export class Game extends Scene {
    private graphics!: Phaser.GameObjects.Graphics;

    private isDrawing: boolean = false;
    private lastPos: Phaser.Math.Vector2 | null = null;

    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;

    constructor() {
        super("Game");
    }

    create() {
        this.graphics = this.add.graphics();
        this.graphics.lineStyle(4, 0x000000, 1);

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

    private stopDrawing(pointer: Phaser.Input.Pointer) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.lastPos = null;

        this.graphics.closePath();
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
        this.graphics.lineStyle(4, 0x0000ff, 1);
        EventBus.emit("draw:clear", {});
    }

    changeScene() {
        this.scene.start("GameOver");
    }
}
