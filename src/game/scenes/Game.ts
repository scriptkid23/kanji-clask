import Phaser from "phaser";
import { EventBus } from "../EventBus";

export class Game extends Phaser.Scene {
    private drawingLayer!: Phaser.GameObjects.Graphics;
    private isDrawing = false;
    private lastPos: Phaser.Math.Vector2 | null = null;
    private drawingPoints: {x: number, y: number}[] = [];

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
        this.camera = this.cameras.main;
        
        // Setup background layer first
        this.background = this.add.image(512, 384, "background");
        
        // Create transparent drawing layer on top
        this.drawingLayer = this.add.graphics();
        this.drawingLayer.lineStyle(10, 0x0000ff, 1); // Blue color for visible drawing
        
        // Initialize drawing points array
        this.drawingPoints = [];
        
        EventBus.emit("current-scene-ready", this);

        this.input.on("pointerdown", this.startDrawing, this);
        this.input.on("pointermove", this.drawStroke, this);
        this.input.on("pointerup", this.stopDrawing, this);
    }

    private startDrawing(pointer: Phaser.Input.Pointer) {
        this.isDrawing = true;
        
        // Clear previous drawing points and start a new path
        this.drawingPoints = [];
        this.drawingLayer.beginPath();
        this.drawingLayer.moveTo(pointer.x, pointer.y);
        
        // Store the initial point
        this.drawingPoints.push({x: pointer.x, y: pointer.y});
        this.lastPos = new Phaser.Math.Vector2(pointer.x, pointer.y);
        
        EventBus.emit("draw:start", { x: pointer.x, y: pointer.y });
    }

    private drawStroke(pointer: Phaser.Input.Pointer) {
        if (!this.isDrawing || !this.lastPos) return;

        this.drawingLayer.lineBetween(
            this.lastPos.x,
            this.lastPos.y,
            pointer.x,
            pointer.y
        );
        
        // Store the drawing point
        this.drawingPoints.push({x: pointer.x, y: pointer.y});
        this.lastPos.set(pointer.x, pointer.y);
        
        EventBus.emit("draw:point", { x: pointer.x, y: pointer.y });
    }

    private captureAndSaveDrawing() {
        try {
            // Create a 100x100 canvas with white background
            const canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                console.error("Could not get canvas context");
                return;
            }

            // Draw white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // If no drawing points, just save the blank canvas
            if (this.drawingPoints.length === 0) {
                this.saveCanvasAsPNG(canvas);
                return;
            }
            
            // Find the bounding box of the drawing
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            this.drawingPoints.forEach(point => {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            });
            
            // Add padding to account for line thickness in the bounding box
            const lineThickness = 10; // The line thickness in the original drawing
            minX -= lineThickness / 2;
            minY -= lineThickness / 2;
            maxX += lineThickness / 2;
            maxY += lineThickness / 2;
            
            // Calculate drawing dimensions
            const drawingWidth = maxX - minX;
            const drawingHeight = maxY - minY;
            
            // Calculate scaling factor to fit the drawing into the canvas while maintaining aspect ratio
            // Leave a small margin (15% of canvas size)
            const margin = 15; // 15px margin
            const availableWidth = canvas.width - (margin * 2);
            const availableHeight = canvas.height - (margin * 2);
            let scale = Math.min(
                availableWidth / Math.max(1, drawingWidth),
                availableHeight / Math.max(1, drawingHeight)
            );
            
            // If drawing is too small, scale it up a bit
            if (scale > 2) scale = 2;
            
            // Calculate centering offsets
            const offsetX = (canvas.width - drawingWidth * scale) / 2 - minX * scale;
            const offsetY = (canvas.height - drawingHeight * scale) / 2 - minY * scale;
            
            // Draw the lines in black with a thick stroke for the small canvas
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 9; // Thick line (8-10px as requested)
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            
            // Draw the lines using the stored drawing points
            if (this.drawingPoints.length > 1) {
                ctx.beginPath();
                // Move to the first point
                const firstPoint = this.drawingPoints[0];
                ctx.moveTo(firstPoint.x * scale + offsetX, firstPoint.y * scale + offsetY);
                
                // Connect all subsequent points
                for (let i = 1; i < this.drawingPoints.length; i++) {
                    const point = this.drawingPoints[i];
                    ctx.lineTo(point.x * scale + offsetX, point.y * scale + offsetY);
                }
                
                // Stroke the entire path at once
                ctx.stroke();
            }
            
            // Save the canvas as PNG
            this.saveCanvasAsPNG(canvas);
        } catch (error) {
            console.error("Error saving drawing:", error);
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

        this.drawingLayer.closePath();

        // Capture and save the drawing before fading out
        this.captureAndSaveDrawing();

        EventBus.emit("draw:end", {});

        this.fadeOutGraphics();
    }

    private fadeOutGraphics() {
        this.tweens.add({
            targets: this.drawingLayer,
            alpha: 0,
            duration: 500,
            ease: "Linear",
            onComplete: () => {
                this.clearDrawing();
                this.drawingLayer.setAlpha(1);
            },
        });
    }

    public clearDrawing(): void {
        this.drawingLayer.clear();
        this.drawingLayer.lineStyle(10, 0x0000ff, 1);
        this.drawingPoints = [];
        EventBus.emit("draw:clear", {});
    }

    changeScene() {
        this.scene.start("GameOver");
    }
}