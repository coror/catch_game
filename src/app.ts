import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  UniversalCamera,
  StandardMaterial,
  Color3,
} from '@babylonjs/core';
import {
  TextBlock,
  AdvancedDynamicTexture,
  Control,
  Button,
} from '@babylonjs/gui';

class App {
  // Declare variables to be used across methods
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private advancedTexture: AdvancedDynamicTexture | null = null;
  private catchText: TextBlock | null = null;
  private missText: TextBlock | null = null;
  private levelText: TextBlock | null = null;
  private scoreText: TextBlock | null = null;
  private resetButton: Button | null = null;
  private playAgainButton: Button | null = null;
  private basket: Mesh | null = null;
  private spheres: Mesh[] = [];
  private catches: number = 0;
  private totalCatches: number = 0;
  private misses: number = 0;
  private level: number = 1;
  private totalLevels: number = 10;
  private basketSpeed: number = 0.5;
  private basketBoundary: number = 30;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private lastSphereTime: number = 0;
  private sphereInterval: number = 3000;
  private sphereGravity: number = 0.1;
  private gameOver: boolean = false; // Add this to your class properties

  constructor() {
    // Set up the document and body styles to occupy full viewport without scrollbars
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    // Create the Start Game button
    this.createStartButton();
  }

  /**
   * Creates and styles the Start Game button.
   */
  private createStartButton() {
    const button = document.createElement('button');
    button.innerText = 'Start Game';
    button.id = 'startButton';
    // Style the button to be centered and prominent
    Object.assign(button.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '20px 40px',
      fontSize: '24px',
      cursor: 'pointer',
      zIndex: '1', // Ensure the button is above the canvas
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
    });

    // Append the button to the body
    document.body.appendChild(button);

    // Add click event listener to initialize the game
    button.addEventListener('click', () => {
      this.startGame();
      button.style.display = 'none'; // Hide the button after starting the game
    });
  }

  /**
   * Initializes and starts the game.
   */
  private startGame() {
    // Create and set up the canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.id = 'gameCanvas';
    document.body.appendChild(this.canvas);

    // Initialize Babylon Engine and Scene
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);

    // Create camera
    const camera: UniversalCamera = new UniversalCamera(
      'Camera',
      new Vector3(0, 5, -40),
      this.scene
    );
    camera.setTarget(Vector3.Zero());

    // Create light
    const light1: HemisphericLight = new HemisphericLight(
      'light1',
      new Vector3(1, 1, 0),
      this.scene
    );

    // Create basket and assign to class variable
    this.basket = MeshBuilder.CreatePlane(
      'basket',
      { width: 5, height: 0.5 },
      this.scene
    );
    this.basket.position.y = -15;
    const basketMaterial = new StandardMaterial('basketMaterial', this.scene);
    basketMaterial.diffuseColor = new Color3(0.5, 0.2, 0);
    this.basket.material = basketMaterial;

    // Create GUI for displaying scores and level
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    // Catches Text Block
    this.catchText = new TextBlock();
    this.catchText.text = 'Catches: 0';
    this.catchText.color = 'white';
    this.catchText.fontSize = 24;
    this.catchText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
    this.catchText.paddingTop = 20;
    this.catchText.left = -500;
    this.advancedTexture.addControl(this.catchText);

    // Misses Text Block
    this.missText = new TextBlock();
    this.missText.text = 'Misses: 0';
    this.missText.color = 'white';
    this.missText.fontSize = 24;
    this.missText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
    this.missText.paddingTop = 20;
    this.missText.left = 500;
    this.advancedTexture.addControl(this.missText);

    // Level Text Block
    this.levelText = new TextBlock();
    this.levelText.text = 'Level: 1';
    this.levelText.color = 'yellow';
    this.levelText.fontSize = 24;
    this.levelText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
    this.levelText.paddingTop = 20;
    this.advancedTexture.addControl(this.levelText);

    // Call this method in startGame after creating advancedTexture
    this.createTestButton();

    // Create Reset Button
    this.createResetButton(this.advancedTexture);

    console.log(this.resetButton);

    // Event listeners for keyboard input
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Event listener to toggle Inspector
    window.addEventListener('keydown', (ev) => {
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i') {
        if (this.scene?.debugLayer.isVisible()) {
          this.scene.debugLayer.hide();
        } else {
          this.scene?.debugLayer.show();
        }
      }
    });

    // Start the game loop
    this.engine.runRenderLoop(() => {
      this.scene?.render();
      this.updateGame();
    });

    // Resize the engine on window resize
    window.addEventListener('resize', () => {
      this.engine?.resize();
    });
  }

  /**
   * Creates and styles the Reset button in the GUI.
   * The AdvancedDynamicTexture to add the button to.
   */
  private createResetButton(advancedTexture: AdvancedDynamicTexture) {
    this.resetButton = Button.CreateSimpleButton('resetButton', 'Reset');
    this.resetButton.width = '100px';
    this.resetButton.height = '40px';
    this.resetButton.color = 'white';
    this.resetButton.background = 'red';
    this.resetButton.cornerRadius = 10;
    this.resetButton.thickness = 0;
    this.resetButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.resetButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.resetButton.paddingTop = 20; // Changed from '20px'

    console.log('Reset button created:', this.resetButton); // Confirm creation

    this.resetButton.onPointerUpObservable.add(() => {
      console.log('Reset button clicked!');
      alert('Reset button clicked!');
      this.resetGame();
    });

    advancedTexture.addControl(this.resetButton);
  }

  private createTestButton() {
    const testButton = Button.CreateSimpleButton('testButton', 'Test');
    testButton.width = '100px';
    testButton.height = '40px';
    testButton.color = 'white';
    testButton.background = 'blue';
    testButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    testButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    testButton.paddingBottom = 20;

    testButton.onPointerUpObservable.add(() => {
      console.log('Test button clicked!');
      alert('Test button clicked!');
      this.resetGame();
    });

    this.advancedTexture?.addControl(testButton);
    console.log('Test button added to advanced texture');
  }

  /**
   * Creates and styles the Play Again button in the GUI.
   */
  private createPlayAgainButton() {
    console.log('Creating Play Again button'); // Check if function is called
    if (!this.advancedTexture) {
      console.log('Advanced texture is null'); // Check if advancedTexture is available
      return;
    }

    this.playAgainButton = Button.CreateSimpleButton(
      'playAgainButton',
      'Play Again'
    );

    console.log('Play Again button created'); // Confirm button creation

    this.playAgainButton.width = '150px';
    this.playAgainButton.height = '60px';
    this.playAgainButton.color = 'white';
    this.playAgainButton.background = 'green'; // Change to distinct color
    this.playAgainButton.cornerRadius = 10;
    this.playAgainButton.thickness = 0;
    this.playAgainButton.horizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.playAgainButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.playAgainButton.top = 100;

    this.playAgainButton.onPointerUpObservable.add(() => {
      console.log('Play Again button clicked'); // Debug line to confirm click event
      this.restartGame();
    });

    this.advancedTexture.addControl(this.playAgainButton);
    console.log('Play Again button added to advanced texture'); // Confirm button added
  }

  /**
   * Handles keydown events.
   */
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      this.moveLeft = true;
    }
    if (e.key === 'ArrowRight') {
      this.moveRight = true;
    }
  };

  /**
   * Handles keyup events.
   */
  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      this.moveLeft = false;
    }
    if (e.key === 'ArrowRight') {
      this.moveRight = false;
    }
  };

  /**
   * Updates the game state on each frame.
   */
  private updateGame() {
    if (!this.scene || !this.basket || !this.advancedTexture) return;

    // Check for game over condition due to misses
    if (this.misses >= 2) {
      this.endGame();
      return;
    }

    // Initialize lastSphereTime if not set
    if (!this.lastSphereTime) {
      this.lastSphereTime = Date.now();
    }

    // Check if it's time to generate a new sphere
    const currentTime = Date.now();
    if (currentTime - this.lastSphereTime > this.sphereInterval) {
      this.generateSphere();
      this.lastSphereTime = currentTime;
    }

    // Update the position of all spheres
    this.spheres = this.spheres.filter((sphere) => {
      sphere.position.y -= this.sphereGravity;

      // Check for collision with the basket
      if (sphere.intersectsMesh(this.basket, false)) {
        this.catches++;
        this.totalCatches++;
        this.catchText!.text = 'Catches: ' + this.catches;
        sphere.dispose();
        return false;
      }

      // Check if the sphere has missed the basket
      if (sphere.position.y < -17) {
        this.misses++;
        this.missText!.text = 'Misses: ' + this.misses;
        sphere.dispose();
        return false;
      }
      return true;
    });

    // Update basket position based on key presses
    if (this.moveLeft && this.basket.position.x > -this.basketBoundary) {
      this.basket.position.x -= this.basketSpeed;
    }
    if (this.moveRight && this.basket.position.x < this.basketBoundary) {
      this.basket.position.x += this.basketSpeed;
    }

    // Progress to the next level if 20 catches are reached
    if (this.catches >= 2) {
      this.nextLevel();
    }
  }

  private endGame() {
    if (this.gameOver) return; // Prevent multiple calls
    this.gameOver = true; // Set the game over flag

    console.log('End game called'); // Should only log once

    if (this.levelText) this.levelText.text = 'GAME OVER!';

    this.spheres.forEach((sphere) => sphere.dispose());
    this.spheres = [];

    this.displayFinalScore();
  }
  /**
   * Generates a new sphere at a random X position.
   */
  private generateSphere() {
    if (!this.scene) return;

    const sphere: Mesh = MeshBuilder.CreateSphere(
      'sphere',
      { diameter: 1 },
      this.scene
    );
    sphere.position.y = 15;
    sphere.position.x = Math.random() * 60 - 30;

    this.spheres.push(sphere);
  }

  /**
   * Resets the game state for a new level.
   */
  private resetGame() {
    if (!this.advancedTexture) return;

    // Reset game variables
    this.catches = 0;
    this.misses = 0;

    // Dispose of existing spheres
    this.spheres.forEach((sphere) => sphere.dispose());
    this.spheres = [];

    // Update GUI elements
    if (this.catchText) this.catchText.text = 'Catches: 0';
    if (this.missText) this.missText.text = 'Misses: 0';
    if (this.levelText) this.levelText.text = `Level ${this.level}`;

    // Reposition the basket to the center
    if (this.basket) this.basket.position.x = 0;
  }

  /**
   * Advances the game to the next level or ends the game.
   */
  private nextLevel() {
    if (this.level < this.totalLevels) {
      this.level++;
      this.resetGame();
      this.sphereInterval = this.sphereInterval -= 200;
      this.sphereGravity = this.sphereGravity += 0.02;
      if (this.levelText) this.levelText.text = `Level ${this.level}`;
    } else {
      if (this.levelText) this.levelText.text = 'GAME OVER!';

      // Dispose of any remaining spheres
      this.spheres.forEach((sphere) => sphere.dispose());
      this.spheres = [];

      // Display final score
      this.displayFinalScore();

      // Optionally, disable further sphere generation or movement
      // You might also want to show a "Play Again" button here
    }
  }

  /**
   * Displays the final score with total catches.
   */
  private displayFinalScore() {
    console.log('Display final score called'); // Add this line to track calls

    if (!this.advancedTexture) return;

    // Create Final Score Text Block
    this.scoreText = new TextBlock();
    this.scoreText.text = `Final Score: ${this.totalCatches} Catches`;
    this.scoreText.color = 'yellow';
    this.scoreText.fontSize = 32;
    this.scoreText.textHorizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.scoreText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.scoreText.top = -200;
    this.advancedTexture.addControl(this.scoreText);

    // Optionally, create a Play Again button
    this.createPlayAgainButton();
  }

  /**
   * Restarts the game by resetting variables and UI elements.
   */
  private restartGame() {
    // Reset game variables
    this.catches = 0;
    this.misses = 0;
    this.totalCatches = 0;
    this.level = 1;
    this.sphereInterval = 3000;
    this.sphereGravity = 0.1;

    // Reset game over state
    this.gameOver = false; // Reset this flag

    // Dispose of existing spheres
    this.spheres.forEach((sphere) => sphere.dispose());
    this.spheres = [];

    // Update GUI elements
    if (this.catchText) this.catchText.text = 'Catches: 0';
    if (this.missText) this.missText.text = 'Misses: 0';
    if (this.levelText) this.levelText.text = `Level ${this.level}`;

    // Reposition the basket to the center
    if (this.basket) this.basket.position.x = 0;

    // Remove final score and Play Again button
    if (this.scoreText) this.advancedTexture?.removeControl(this.scoreText);
    if (this.playAgainButton)
      this.advancedTexture?.removeControl(this.playAgainButton);
  }
}

new App();
