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
        this.graphics.lineStyle(4, 0x000000, 1); // nét vẽ màu đen, độ dày 4px

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
        // Bắt đầu một đường vẽ mới tại tọa độ hiện tại của con trỏ
        this.graphics.beginPath();
        this.graphics.moveTo(pointer.x, pointer.y);
        this.lastPos = new Phaser.Math.Vector2(pointer.x, pointer.y);
        // Phát tín hiệu bắt đầu vẽ (sẽ nói rõ ở bước 5)
        EventBus.emit("draw:start", { x: pointer.x, y: pointer.y });
    }

    private drawStroke(pointer: Phaser.Input.Pointer) {
        if (!this.isDrawing || !this.lastPos) return;
        // Vẽ đoạn thẳng từ điểm cuối trước đó đến vị trí hiện tại của con trỏ
        this.graphics.lineBetween(
            this.lastPos.x,
            this.lastPos.y,
            pointer.x,
            pointer.y
        );
        // Cập nhật lại điểm cuối cùng đã vẽ
        this.lastPos.set(pointer.x, pointer.y);
        // Phát tín hiệu đang vẽ (bước 5)
        EventBus.emit("draw:point", { x: pointer.x, y: pointer.y });
    }

    private stopDrawing(pointer: Phaser.Input.Pointer) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.lastPos = null;
        // Kết thúc đường vẽ hiện tại
        this.graphics.closePath();
        // Phát tín hiệu kết thúc vẽ (bước 5)
        EventBus.emit("draw:end", {});
    }

    public clearDrawing(): void {
        this.graphics.clear(); // Xóa mọi nội dung đã vẽ&#8203;:contentReference[oaicite:10]{index=10}
        this.graphics.lineStyle(4, 0x0000ff, 1); // Thiết lập lại lineStyle sau khi clear
        EventBus.emit("draw:clear", {});
    }

    changeScene() {
        this.scene.start("GameOver");
    }
}
