import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

export class MainMenu extends Scene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor() {
        super("MainMenu");
    }

    create() {
        // Get the current viewport dimensions
        const { width, height } = this.scale;

        // 1. Background
        // Place at (0,0) and stretch it to fill the screen
        this.background = this.add
            .image(0, 0, "background")
            .setOrigin(0, 0)
            .setDisplaySize(width, height);

        // 2. Logo
        // Place it in the center, adjust Y position as needed
        this.logo = this.add
            .image(width * 0.5, height * 0.4, "logo")
            .setDepth(100)
            .setOrigin(0.5);

        // 3. Title
        this.title = this.add
            .text(width * 0.5, height * 0.6, "Main Menu", {
                fontFamily: "Arial Black",
                fontSize: "38px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        EventBus.emit("current-scene-ready", this);
    }

    changeScene() {
        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }
        this.scene.start("Game");
    }

    moveLogo(reactCallback: ({ x, y }: { x: number; y: number }) => void) {
        if (this.logoTween) {
            // Toggle play/pause
            if (this.logoTween.isPlaying()) {
                this.logoTween.pause();
            } else {
                this.logoTween.play();
            }
        } else {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: {
                    value: this.scale.width * 0.8,
                    duration: 3000,
                    ease: "Back.easeInOut",
                },
                y: {
                    value: this.scale.height * 0.15,
                    duration: 1500,
                    ease: "Sine.easeOut",
                },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback) {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y),
                        });
                    }
                },
            });
        }
    }
}

