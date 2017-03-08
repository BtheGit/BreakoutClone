const canvasWidth = 650;
const canvasHeight = 400;

let canvas = document.getElementById("gameCanvas");
let width = canvas.width = canvasWidth;
let height = canvas.height = canvasHeight;
let ctx = canvas.getContext("2d");
let animationFrameId;

// const SOUND_BOUNCE = new Audio('bounce.wav');
// const SOUND_BREAK = new Audio('break.wav');

//##### GAME STATE HANDLERS #####
let rightPressed = false;
let leftPressed = false;
let isPaused = false; 
let isClamped = true;
let gameOver = false;
let currentScreen = 'start';

//##### CONSTANTS ######

const paddleSpeed =8;
const paddleWidth = 100;
const paddleHeight = 18;
const paddleColor = "yellow";
const paddleStartX = (canvas.width / 2) - (paddleWidth / 2);
const paddleStartY = canvas.height - 30;

const ballRadius = 8;
const ballColor = "white";
const ballStartX = canvas.width / 2;
const ballStartY = canvas.height - 40;
const ballSpeed = 4;

const brickWidth = 75;
const brickHeight = 20;
const brickHealth = 1;
const brickColor = "green";

const LEVELS = [
	{
		board:[
			[1,1,1,1,1,1,1],
			[1,1,1,0,1,1,1],
			[1,1,0,0,0,1,1],
			[1,0,0,0,0,0,1],
		],
		padding: 10,
		offsetTop: 30,
		offsetLeft: 30
	},
	{
		board:[
			[1,0,2,0,2,0,1],
			[1,0,1,0,1,0,1],
			[3,0,3,0,3,0,3],
			[1,0,1,0,1,0,1],
			[1,0,2,0,2,0,1],
		],
		padding: 10,
		offsetTop: 30,
		offsetLeft: 30
	},
	{
		board:[
			[0,0,0,1,0,0,0],
			[0,2,4,4,4,2,0],
			[0,0,2,1,2,0,0]
		],
		padding: 10,
		offsetTop: 30,
		offsetLeft: 30
	},
	{
		board:[
			[1,0,1,0,1,1,1],
			[3,1,4,1,1,0,0],
			[1,2,2,2,3,2,1],
			[1,2,2,2,3,2,1]
		],
		padding: 10,
		offsetTop: 30,
		offsetLeft: 30
	}
]


//#### STARFIELD ####
class Star  {
	constructor(x, y, size, vel, color) {
		this.x = x,
		this.y = y,
		this.size = size,
		this.vel = vel,
		this.color = color
	}

	draw() {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.size, this.size);
	}
}

class Starfield {
	constructor(starCount) {
		this.starCount = starCount;
		this.minVel = 15;
		this.maxVel = 30;
		this.fps = 30;
		this.stars = this.generateStars();
	}

	generateStars() {
		let starArray = [];
		for (let i = 0; i < this.starCount; i++) {
			let star = new Star (
				Math.random() * canvas.width, 
				Math.random() * canvas.height, 
				(Math.random() * 2) + 1,
				(Math.random() * (this.maxVel - this.minVel)) + this.minVel, 
				"#FFFFFF"
			) 
			starArray.push(star);
		}
		return starArray;
	}

	renderStars() {
		for(let i = 0; i < this.stars.length; i++) {
			this.stars[i].draw();
		}
	}

	updatePositions() {
		const dy = 1 / this.fps;
		for(let i = 0; i < this.stars.length; i++) {
			this.stars[i].y += dy * this.stars[i].vel;
			if(this.stars[i].y > canvas.height) {
				this.stars[i] = new Star (
					Math.random() * canvas.width, 
					0, 
					(Math.random() * 2) + 1,
					(Math.random() * (this.maxVel - this.minVel)) + this.minVel, 
					"#FFFFFF"
				) 
			}
		}
	}
}


//#### MATH #####
function randRange(min, max) {
	return (Math.random() * (max - min)) + min;
}

function withinRange(val, min, max) {
	if(val > max) {
		return max;
	} else if (val < min) {
		return min;
	} else {
		return val
	}
}

function cls() {
	ctx.fillStyle = '#000000';
	ctx.fillRect(0,0, canvas.width, canvas.height);		
}

function write(text, font, size, startX, startY, fillStyle, textAlign = "start") {
	ctx.font = size + " " + font;
	ctx.fillStyle = fillStyle;
	ctx.textAlign = textAlign;
	ctx.fillText(text, startX, startY, width)
}

//#### EVENT LISTENER CALLBACKS ####
handleKeyDown = (event) => {
	if (event.keyCode === 39) {
		rightPressed = true;
	} else if (event.keyCode === 37) {
		leftPressed = true;
	} else if (event.keyCode === 32) {
		switch (currentScreen){
			case 'start':
				//init game
				isClamped = true;
				gameScreen();
				break;
			case 'game':
				if(isClamped) {
					isClamped = false;
				} else{
					isPaused = !isPaused;
				};
				break;
			case 'gameover':
				//reset game
				cancelAnimationFrame(animationFrameId)
				currentScreen = 'start';
				cls();
				startScreen();
				break;
		}
	}
}

handleKeyUp = (event) => {
	if (event.keyCode === 39) {
		rightPressed = false;
	} else if (event.keyCode === 37) {
		leftPressed = false;
	} 
}

// handleMouseMove = (event) => {
// 	let relativeX = event.clientX - canvas.offsetLeft;
// 	if(relativeX > 0 && relativeX < canvas.width) {
// 		const dist = relativeX - (paddleWidth / 2)
// 		console.log(dist)
// 		//todo figure out how to keep the paddle from moving too fast but still have relative motion
// 		paddle.moveX(dist);
// 	}
// }

//#### EVENT LISTENERS ####
document.addEventListener('keydown', handleKeyDown, false);
document.addEventListener('keyup', handleKeyUp, false);
// document.addEventListener('mousemove', handleMouseMove, false);

startScreen()

//#### MAIN GAME LOOPS ####
function startScreen() {
	let colorStops =[
		{color:"#FF0000", stopPercent:0},
		{color:"#FFFF00", stopPercent: 1/11},
		{color:"#00FF00", stopPercent:2/11},
		{color:"#0000FF", stopPercent:3/11},
		{color:"#FF00FF", stopPercent:4/11},
		{color:"#FF0000", stopPercent:5/11},
		{color:"#FF0000", stopPercent:6/11},
		{color:"#FF00FF", stopPercent:7/11},
		{color:"#0000FF", stopPercent:8/11},
		{color:"#00FF00", stopPercent:9/11},
		{color:"#FFFF00", stopPercent:10/11},
		{color:"#FF0000", stopPercent:1},
	];

	function render() {
		if(animationFrameId) {
			cancelAnimationFrame(animationFrameId)
		};
		cls();
		animationFrameId = requestAnimationFrame(render);
		write('BREAKOUT', 'paralines', '120px', canvasWidth /2, 175, drawRainbowGrad(), 'center')
		write('Press SPACEBAR to begin', 'Times New Roman', '20px', canvasWidth / 2, 240, 'white', 'center')
	}

	function drawRainbowGrad() {

		let gradient = ctx.createLinearGradient(canvas.width /2, 0, canvas.width/2, 300)
		for (let i = 0; i < colorStops.length; i++){
			let tempColorStop = colorStops[i]
			gradient.addColorStop(tempColorStop.stopPercent, tempColorStop.color);
			tempColorStop.stopPercent += 0.003;
			if(tempColorStop.stopPercent > 1) {
				tempColorStop.stopPercent = 0;
			}
			colorStops[i] = tempColorStop;		
		}
		return gradient;
	}

	render();
}

function gameScreen() {
	let playerLives = 0;
	let playerScore = 0;
	let currentLevel = 0;
	let bricksArray = [];

	//#### CLASS DEFINITIONS ####
	class Rect {
		constructor(x = 0, y = 0, width = 100, height = 20, color = "purple") {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
			this.color = color;
		}

		drawFillRect(startx, starty, width, height, color = "#000000"){
			ctx.beginPath();
			ctx.rect(startx, starty, width, height);
			ctx.fillStyle = color;
			ctx.fill();
			ctx.closePath();
		}	
	}

	class Brick extends Rect {
		constructor(health, x, y, width, height, color) {
			super(x, y, width, height, color);
			this.type = 'brick';
			this.health = health;
		}

		takeDamage(damage = 1) {
			this.health -= damage;
			playerScore += 1;
			// this.health > 0 ? SOUND_BOUNCE.play() : SOUND_BREAK.play();
		}

		isVisible() {
			return this.health ? true : false;
		}

		getColor(health) {
			const colors = ['green', 'orange', 'purple', 'red'];
			return colors[health - 1];
		}

		render() {
			if(this.health > 0) {
				this.drawFillRect(this.x, this.y, this.width, this.height, this.getColor(this.health))
			}
		}
	}

	class Paddle extends Rect {
		constructor(x, y, width, height, color) {
			super(x, y, width, height, color);
			this.type = 'paddle';
		}

		moveX(distance) {

			// //not quite functioning test 
			// if(
			// 	ball.x + ball.radius > paddle.x 
			// 	&& ball.x - ball.radius < paddle.x + paddle.width 
			// 	&& ball.y + ball.radius > paddle.y 
			// 	&& ball.y - ball.radius < paddle.y + paddle.height
			// ) {
			// 	//change direction of ball
			// 	ball.collide(paddle);
			// 	// ball.x += distance;
			// }


			if (this.x + this.width > canvas.width - distance ) {
				this.x = canvas.width - this.width;
			} else if (this.x < 0 - distance) {
				this.x = 0;
			} else {
				if (ball.y + ball.radius < paddleStartY) {
					this.x += distance;				
				}
				if(isClamped) {
					ball.x += distance;
				}
			}
		}

		reset() {
			this.x = paddleStartX;
			this.y = paddleStartY;
		}

		render() {
			this.drawFillRect(this.x, this.y, this.width, this.height, this.color)
		}

	}

	class Ball {
		constructor(x = 0, y = 0, radius = 20, start = 0, end = Math.PI * 2, color = "purple", direction = false) {
			this.type = 'ball';
			this.x = x;
			this.y = y;
			this.baseSpeed = ballSpeed;
			this.currentSpeed = this.baseSpeed;
			this.angle = randRange((Math.PI * 3) / 4, Math.PI / 4);
			this.dx = Math.cos(this.angle) * this.currentSpeed;
			this.dy = -Math.abs(Math.sin(this.angle) * this.currentSpeed);
			this.radius = radius;
			this.start = start;
			this.end = end;
			this.color = color;
			this.direction = direction;
		}

		moveX() {
			if(!isClamped){
				if (this.x + this.radius > canvas.width - this.dx ) {
					this.x = canvas.width - this.radius;
					this.dx = -this.dx;
				} else if (this.x - this.radius < 0 - this.dx) {
					this.x = this.radius;
					this.dx = -this.dx;
				} else {
					this.x += this.dx;
				}
			}
		}

		moveY() {
			if(!isClamped) {
				if (this.y + this.radius > canvas.height - this.dy ) {
					this.y = canvas.height - this.radius;
					this.dy = -this.dy;
				} else if (this.y - this.radius < 0 - this.dy) {
					this.y = this.radius;
					this.dy = -this.dy;
				} else {
					this.y += this.dy;
				}			
			}
		}

		reset() {
			this.x = ballStartX;
			this.y = ballStartY;
			this.currentSpeed = this.baseSpeed;
			this.angle = randRange((Math.PI * 3) / 4, Math.PI / 4);
			this.dx = Math.cos(this.angle) * this.currentSpeed;
			this.dy = -Math.abs(Math.sin(this.angle) * this.currentSpeed);
		}

		collide(object) {

			//Return the ball to position prior to collision
			const lastX = this.x - this.dx;
			const lastY = this.y - this.dy;

			//Is the ball above or below the object?
			if(lastX > object.x - ballRadius && lastX < object.x + object.width + ballRadius) { // margin of error to avoid corner issues
				//Is the ball above? 
				if(lastY < object.y) {
					//If object.type = 'paddle', determine where on paddle it hits and adjust angle
					if (object.type === 'paddle'){

						//Fun FACTS
						//if this.dx is positive, this is coming from the left
						//if this.dx is negative, this is coming from the right
						const paddleCenter = object.x + (object.width / 2);
						const distanceFromCenter = paddleCenter - this.x;
						const areaOfCollision = distanceFromCenter / (object.width / 2) * 100;

						//Divide paddle into 6, middle 2 are simple reflection
						let newAngle, newSpeed;					

						if (areaOfCollision > 95) {
							newAngle =(Math.PI * 5) / 6;
							console.log("left corner ", newAngle)
							newSpeed = this.baseSpeed + 4;
							//left side (set angle and speed)
						}  else if (areaOfCollision > 5) {
							newAngle = (Math.PI * (areaOfCollision / 100)) - (Math.PI * 3 / 2);
							console.log("middle left ", newAngle)
							newAngle = withinRange(newAngle, -4.5, -2);
							console.log("ranged ", newAngle)
							newSpeed = this.baseSpeed + 2;
							//left middle (variable angle and speed)
						} else if (areaOfCollision > -5) {
							//middle (set 90 degree angle reset speed)
							newAngle = (Math.PI * 3) /2;
							newSpeed = this.baseSpeed;
						} else if (areaOfCollision > -95) {
							//right middle (variable angle and speed)
							newAngle = (Math.PI * (areaOfCollision / -100)) + (Math.PI * 3 / 2);
							console.log("middle right ", newAngle)
							newAngle = withinRange(newAngle, 4.8, 6.75);
							console.log("adjusted ", newAngle)
							newSpeed = this.baseSpeed + 2;
						} else {
							//rigth side (set angle and speed)
							newAngle = Math.PI / 6;
							console.log("right corner ", newAngle)
							newSpeed = this.baseSpeed + 4;
						}

						this.currentSpeed = newSpeed;
						this.angle = newAngle;
						this.dx = Math.cos(this.angle) * this.currentSpeed;
						this.dy = -Math.abs(Math.sin(this.angle) * this.currentSpeed);
						this.dy = withinRange(this.dy, -100, -3) //might fix horizontal reflection issue
						console.log("dx " , this.dx, "dy ", this.dy)

					} else { //Collision from above
						if(object.type === 'paddle') { //with paddle
							this.dy = -this.dy;
						} else { //with brick
							this.x = lastX;
							this.y = lastY;				
							this.dy = -this.dy;						
						}
					}
				} else { //collision with brick from below
					this.x = lastX;
					this.y = lastY;
					this.dy = -this.dy;
				}
			} else {
				//Is the ball on the left?
				if(lastX < object.x) {
					this.x = lastX;
					this.y = lastY;				
					this.dx = -this.dx;
				} else {
					this.x = lastX;
					this.y = lastY;
					this.dx = -this.dx;
				}
			}
		}

		drawFillArc(startx, starty, radius, start, end, color = "#000000", direction = false) {
			ctx.beginPath();
			ctx.arc(startx, starty, radius, start, end, direction);
			ctx.fillStyle = color;
			ctx.fill();
			ctx.closePath();
		}

		render() {
			this.drawFillArc(this.x, this.y, this.radius, this.start, this.end, this.color, this.direction);
			this.moveX();
			this.moveY();
		}
	}

	//#### BRICK LOGIC #####
	function buildBricks(level) {
		bricksArray = []; //clear old bricks out
		for (let r = 0; r < level.board.length; r++) {
			for(let c = 0; c < level.board[r].length; c++) {
				const brickX = (c *(brickWidth + level.padding)) + level.offsetLeft;
				const brickY = (r * (brickHeight + level.padding)) + level.offsetTop;
				const brickHealth = level.board[r][c];
				let brick = new Brick(brickHealth, brickX, brickY, brickWidth, brickHeight, brickColor)
				brick.render();
				bricksArray.push(brick);
			}
		}
	}

	function renderBricks(bricksArray) {
		for (let i = 0; i < bricksArray.length; i++) {
			bricksArray[i].render();
		}
	}

	//##### GAME LOGIC ####
	function detectCollisions() {
		//Check collisions with bottom of screen
		if (ball.y + ball.radius >= canvasHeight) {
			onDeath();
		}

		//Check collisions with Bricks
		for (let i in bricksArray) {
			const brick = bricksArray[i];
			if(brick.isVisible()) {			
				if(
					ball.x + ball.radius > brick.x 
					&& ball.x - ball.radius < brick.x + brick.width 
					&& ball.y + ball.radius > brick.y 
					&& ball.y - ball.radius < brick.y + brick.height
				) {	
					ball.collide(brick);
					brick.takeDamage();
				}
			}				
		}

		//Check collisions with Paddle
		if(
			ball.x + ball.radius > paddle.x 
			&& ball.x - ball.radius < paddle.x + paddle.width 
			&& ball.y + ball.radius > paddle.y 
			&& ball.y - ball.radius < paddle.y + paddle.height
		) {
			//change direction of ball
			ball.collide(paddle);
			// SOUND_BOUNCE.play();
		}
	}

	function onDeath() {
		if(playerLives > 0) {
			if(animationFrameId !== null){
				cancelAnimationFrame(animationFrameId);
			}
			playerLives -= 1;
			isClamped = true;
			initBoard();		
		} else {
			cancelAnimationFrame(animationFrameId)
			currentScreen = 'gameover';
			gameOverScreen(playerScore);
		}
		
	}

	function checkLevelWinStatus() {
		//Check if any of the bricks are visible and change to next level
		if(!bricksArray.some(elem => elem.isVisible())) {
			currentLevel = currentLevel < LEVELS.length - 1 ? currentLevel + 1 : 0; //cue up next map (or restart cycle)
			ball.baseSpeed += 0.5; //slowly turn up the volume on these points addicts!
			buildBricks(LEVELS[currentLevel]); //load next map
			isClamped = true; // keep ball attached to paddle until spacebar is pressed
			initBoard(); //get this party started
		}
	}

	function initBoard() {
		paddle.reset();
		ball.reset();
		render();
	}

	function render() {

		//Solves the speed up problem
		if(animationFrameId) {
			cancelAnimationFrame(animationFrameId)
		}
		animationFrameId = requestAnimationFrame(render);
			if(!isPaused) {

			//CLEAR SCREEN
			cls();

			//HANDLE USER INPUT
			if(leftPressed) {
				paddle.moveX(-paddleSpeed);
			};
			if(rightPressed) {
				paddle.moveX(paddleSpeed);
			};

			//RENDER
			starField.renderStars();
			starField.updatePositions();
			renderBricks(bricksArray);
			ball.render();
			paddle.render();
			write('Score: ' + playerScore + "   Lives: " + playerLives, 'arial', '10px', 5, 10, 'white')
			write('Press SPACEBAR to pause', 'arial', '10px', canvasWidth - 5, 10, 'white', "right")
			detectCollisions();

			//CHECK VICTORY CONDITIONS
			checkLevelWinStatus();
		}
	}


	//#### INIT GAME OBJECTS ####
	currentScreen = 'game';
	let	paddle = new Paddle(paddleStartX, paddleStartY,  paddleWidth, paddleHeight, paddleColor)
	let	ball = new Ball(ballStartX, ballStartY,  ballRadius, 0, Math.PI*2, ballColor)
	const starField = new Starfield(100);

	//#### INIT GAME ####
	buildBricks(LEVELS[currentLevel]);
	initBoard();
}

function gameOverScreen(playerScore) {

	//#### GAMEOVER SCREEN VARIABLES ####
	const DAMPING = 0.9999;
	const FPS = 35;
	const INTERVAL = 1000 / FPS;
	let drops = [];
	let then = Date.now()

	//#### FIREWORKS ####
	class Drop {
		constructor(x, y, color) {
			this.x = x,
			this.y = y,
			this.color = color;
			this.prevX = x,
			this.prevY = y
		}

		newVel() {
			const velX = this.x - this.prevX;
			const velY = this.y - this.prevY;
			this.prevX = this.x;
			this.prevY = this.y;
			this.x += velX * DAMPING;
			this.y += velY * DAMPING;
		}

		move(x, y) {
			this.x += x;
			this.y += y;
		}

		bounce() {
			if (this.y > height) {
				const velY = this.y - this.prevY;
				this.prevY = height;
				this.y = this.prevY - velY * 0.3;
			}
		}

		render() {
			ctx.strokeStyle = this.color;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(this.prevX, this.prevY);
			ctx.lineTo(this.x, this.y);
			ctx.stroke();
		}
	}

	class Fountain {
		constructor(x, y, color, gravity = 0.3, maxCount = 200) {
			this.drops = [];
			this.count = 0;
			this.maxCount = maxCount;
			this.gravity = gravity;
			this.x = x;
			this.y = y;
			this.color = color;
		}

		newDrop() {
			let drop = new Drop(this.x, this.y, this.color);
			drop.move(Math.random() * 4 - 2, Math.random() * -2 -15);			
			this.drops.push(drop);	
			this.count += 1;			
		}

		renderDrop(drop) {
			drop.move(0, this.gravity);
			drop.newVel();
			drop.bounce();
			drop.render();
		}

		render() {
			this.newDrop();
			for(let i = 0; i < this.drops.length; i++) {
				this.renderDrop(this.drops[i]);
			}
			if(this.count > this.maxCount) {
				this.drops.shift();
				this.count -= 1;
			}			
		}
	}

	function frame () {
		cancelAnimationFrame(animationFrameId)
		animationFrameId = requestAnimationFrame(frame);
		let now = Date.now();
		let delta = now - then;

		if (delta > INTERVAL) {
			then = now - (delta % INTERVAL);
			cls();
			write('Press SPACEBAR to restart', 'Times New Roman', '15px', canvasWidth / 2, 15, 'white', 'center') 
			write('Game Over', 'paralines', '85px', canvasWidth / 2, 120, 'green', 'center')
			write('Score: ' + playerScore, 'paralines', '25px', canvasWidth / 2, 180, 'yellow', 'center') //might need to change alignment
			fountainLeft.render();
			fountainMiddleLeft.render();
			fountainMiddleLeftB.render();
			fountainMiddleRight.render();
			fountainMiddleRightB.render();
			fountainRight.render();
		}
	}

	let fountainLeft = new Fountain(width * 0.15, height, '#0099FF', 0.4, 150);
	let fountainMiddleLeft = new Fountain(width * 0.4, height, 'yellow', 0.65, 100);
	let fountainMiddleLeftB = new Fountain(width * 0.4, height, 'red', 0.65, 50);
	let fountainMiddleRight = new Fountain(width * 0.6, height, 'yellow', 0.65, 100);
	let fountainMiddleRightB = new Fountain(width * 0.6, height, 'red', 0.65, 50);
	let fountainRight = new Fountain(width * 0.85, height, "#0099FF", 0.4, 150);

	frame();
}


//TODOS:

//add in support for major browser versions

//change collision handling to have two separate functions for ball instead of nested ifs

//fix brick collisions

//add audio

//Handle Mouse input correctly