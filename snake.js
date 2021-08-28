// Turns an HTML Canas into a fully functional Snake game
// Simply do something like `new SnakeGame(canvas)`
class SnakeGame {
    constructor(canvas) {
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw "First argument must exist and must " +
            "be an instance of an HTMLCanvasElement";
        }

        // Prepare Canvase
        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        // The max X and Y position a snake can be on
        this.maxX = 35;
        this.maxY = 27;
        this.tileWidth = Math.ceil(this.canvas.width / (this.maxX + 1));
        this.tileHeight = Math.ceil(this.canvas.height / (this.maxY + 3));
        this.canvas.width += Math.abs(this.canvas.width - (this.tileWidth * (this.maxX + 1)));

        this.gameTickSpeed = 70;

        // Pass keydown event, binding this to the class instance
        document.addEventListener("keydown", e => this.keydown.call(this, e));

        // Set it for the first time
        this.reset();
    }

    /*
     * Game state management
     */

    pause() {
        this.drawDialogBox("Press an arrow key to unpause...");
        this.state = "paused";
        clearInterval(this.gameTick); // Actually pauses the game
    }

    unpause() {
        this.drawDialogBox();
        this.state = "unpaused";
        this.gameTick = setInterval(() => this.doGameTick.call(this), this.gameTickSpeed);
    }

    reset() {
        // Initialize grid with empty tiles
        this.grid = [];
        for (let x = 0; x <= this.maxX; x++) {
            this.grid.push([]);
            for (let y = 0; y <= this.maxY; y++) {
                this.grid[x].push("empty");
            }
        }

        // Create the snake
        this.snakeLength = 1;
        this.snakeQueue = [{ x: 0, y: 0 }];
        this.grid[0][0] = "snake";
        this.currentDirection = "right";
        this.directionQueue = [];

        // Wait for the player to unpause before starting
        this.state = "paused";

        // Draw the game
        for (let x = 0; x <= this.maxX; x++) {
            for (let y = 0; y <= this.maxY; y++) {
                this.drawTile(x, y);
            }
        }
        this.pellet();
        this.drawBottomBar();
        this.drawDialogBox("Press an arrow key to begin...");
    }

    gameover() {
        // Highlight where the snake's front was is when it died
        const front = this.snakeQueue[this.snakeQueue.length - 1];
        this.grid[front.x][front.y] = "dead";
        this.drawTile(front.x, front.y);

        // Stop the game
        clearInterval(this.gameTick);
        this.state = "gameover";

        this.drawDialogBox("Game Over. Press enter to start a new game...");
    }

    /*
     * Game playing functions
     */


    // Create a pellet and draw it
    pellet() {
        let x, y;
        do {
            x = Math.floor(Math.random() * Math.floor(this.maxX));
            y = Math.floor(Math.random() * Math.floor(this.maxY));
        } while (this.grid[x][y] != "empty");

        this.grid[x][y] = "pellet";
        this.drawTile(x, y);
    }

    doGameTick() { // aka move the snake
        // front and rear of the snake
        const front = this.snakeQueue[this.snakeQueue.length - 1];
        const rear = this.snakeQueue[0];

        let nextX, nextY;

        let nextDirection;
        if (nextDirection = this.directionQueue.shift()) {
            this.currentDirection = nextDirection;
        }

        switch (this.currentDirection) {
            case "left":
                nextX = front.x - 1;
                nextY = front.y;
                break;
            case "right":
                nextX = front.x + 1;
                nextY = front.y;
                break;
            case "up":
                nextX = front.x;
                nextY = front.y - 1;
                break;
            case "down":
                nextX = front.x;
                nextY = front.y + 1;
                break;
        }

        // Snake hit the edge, game over
        if (nextX < 0 || nextX > this.maxX || nextY < 0 || nextY > this.maxY) {
            this.gameover();
            return;
        }

        switch (this.grid[nextX][nextY]) {
            case "pellet":
                this.snakeLength += 4;
                this.drawBottomBar();
                this.pellet();
            case "empty":
                // Removes the snake's rear if it didn't just eat a pellet
                if (this.snakeLength == this.snakeQueue.length) {
                    this.snakeQueue.shift();
                    this.grid[rear.x][rear.y] = "empty";
                    this.drawTile(rear.x, rear.y);
                }

                // Move the snake forward
                this.snakeQueue.push({ x: nextX, y: nextY });
                this.grid[nextX][nextY] = "snake";
                this.drawTile(nextX, nextY);
                break;

            // Snake ran into itself
            case "snake":
                this.gameover();
                break;
        }
    }

    keydown(e) {
        if (this.state !== "gameover" && !e.repeat) {
            // Either the direction at the front of the queue or the current direction
            const dirQueueBack = this.directionQueue[this.directionQueue.length - 1]
            const preceedingDirection = dirQueueBack ? dirQueueBack : this.currentDirection;
            let arrowKeyPressed = true;
            switch (e.key) {
                case "ArrowLeft":
                case "a":
                case "A":
                    if (preceedingDirection != "right") {
                        this.directionQueue.push("left");
                    }
                    break;
                case "ArrowRight":
                case "d":
                case "D":
                    if (preceedingDirection != "left") {
                        this.directionQueue.push("right");
                    }
                    break;
                case "ArrowUp":
                case "w":
                case "W":
                    if (preceedingDirection != "down") {
                        this.directionQueue.push("up");
                    }
                    break;
                case "ArrowDown":
                case "s":
                case "S":
                    if (preceedingDirection != "up") {
                        this.directionQueue.push("down");
                    }
                    break;
                default:
                    arrowKeyPressed = false;
            }

            if (this.state === "unpaused" && !arrowKeyPressed) {
                this.pause();
            }
            else if (this.state !== "unpaused" && arrowKeyPressed) {
                this.unpause();
            }
        }

        else if (this.state === "gameover" && e.key === "Enter") {
            this.reset();
        }
    }

    /*
     * Drawing functions
     */

    drawBottomBar() {
        const offsetX = 0;
        const offsetY = this.tileHeight * (this.maxY + 1);
        const width = this.canvas.width;
        const height = this.tileHeight * 2;
        const textOffset = Math.ceil(this.canvas.height - height * 0.25);

        this.context.fillStyle = "#333";

        // Don't draw more than necessary
        if (!this.drawBottomBar.drawn) {
            this.context.fillRect(offsetX, offsetY, width, height);
        } else {
            this.context.fillRect(offsetX, offsetY, textOffset, height);
            this.drawBottomBar.drawn = true;
        }

        // Draw the text that says "Length: n"
        this.context.fillStyle = "white";
        this.context.font = `${height - 20}px Monospace`;
        this.context.textAlign = "left";
        this.context.fillText(`Length: ${this.snakeLength}`, offsetX + 10, textOffset);
    }

    drawDialogBox(text) {
        if (!this.dialogBox) {
            this.dialogBox = {
                startX: 4,
                lastX: this.maxX - 4,
                startY: Math.ceil(this.maxY / 2) - Math.ceil(40 / this.tileHeight) + 1,
                lastY: Math.ceil(this.maxY / 2) + Math.ceil(40 / this.tileHeight) + 1
            }
        }

        // Redraw the background
        for (let x = this.dialogBox.startX; x <= this.dialogBox.lastX; x++) {
            for (let y = this.dialogBox.startY; y <= this.dialogBox.lastY; y++) {
                this.drawTile(x, y);
            }
        }

        // Draw the text if any was passed in
        if (text) {
            let offsetX = Math.ceil(this.canvas.width / 2);
            let offsetY = Math.ceil(this.canvas.height / 2);

            this.context.fillStyle = "lightgray";
            this.context.strokeStyle = "black";
            this.context.lineWidth = 1.25;
            this.context.font = "bold 35px Monospace";
            this.context.textAlign = "center";

            this.context.fillText(text, offsetX, offsetY, this.tileWidth * (this.dialogBox.lastX - this.dialogBox.startX));
            this.context.strokeText(text, offsetX, offsetY, this.tileWidth * (this.dialogBox.lastX - this.dialogBox.startX));
        }
    }

    drawTile(x, y) {
        if (!this.tileTypes) {
            this.tileTypes = {
                "empty": { imgdata: this.context.createImageData(this.tileWidth, this.tileHeight), rgba: [0, 0, 0, 0xFF] },
                "snake": { imgdata: this.context.createImageData(this.tileWidth, this.tileHeight), rgba: [0x00, 0x80, 0x00, 0xFF] },
                "pellet": { imgdata: this.context.createImageData(this.tileWidth, this.tileHeight), rgba: [0xFF, 0, 0, 0xFF] },
                "dead": { imgdata: this.context.createImageData(this.tileWidth, this.tileHeight), rgba: [0, 0xFF, 0, 0xFF] }
            }

            for (let key of Object.keys(this.tileTypes)) {
                for (let i = 0; i < this.tileTypes[key].imgdata.data.length; i += 4) {
                    this.tileTypes[key].imgdata.data[i] = this.tileTypes[key].rgba[0];
                    this.tileTypes[key].imgdata.data[i + 1] = this.tileTypes[key].rgba[1];
                    this.tileTypes[key].imgdata.data[i + 2] = this.tileTypes[key].rgba[2];
                    this.tileTypes[key].imgdata.data[i + 3] = this.tileTypes[key].rgba[3];
                }
            }
        }

        let offsetX = this.tileWidth * x;
        let offsetY = this.tileHeight * y;
        this.context.putImageData(this.tileTypes[this.grid[x][y]].imgdata, offsetX, offsetY);
    }
}