const canvasWidth = 650;
const canvasHeight = 400;


let canvas = document.getElementById("gameCanvas");
let width = canvas.width = canvasWidth;
let height = canvas.height = canvasHeight;
let ctx = canvas.getContext("2d");
let animationFrameId;

//##### GAME STATE HANDLERS #####
let rightPressed = false;
let leftPressed = false;
let isPaused = false; 
let isDead = false; //currently unused
let isClamped = true;
let gameOver = false;

let playerLives = 2; //TODO Decide how to track player info, implement reset and gameover and level advance correctly
let playerScore = 0;
let currentLevel = 0;
let bricksArray = [];

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
			[0,0,0,0,0,0,0],
			[0,0,0,0,0,1,0],
			[0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0],
		],
		padding: 10,
		offsetTop: 30,
		offsetLeft: 30
	},
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

//#### GAMEOVER SCREEN VARIABLES ####
const DAMPING = 0.9999;
const FPS = 35;
const INTERVAL = 1000 / FPS;
let drops = [];
let then = Date.now()


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
		if (this.x + this.width > canvas.width - distance ) {
			this.x = canvas.width - this.width;
		} else if (this.x < 0 - distance) {
			this.x = 0;
		} else {
			this.x += distance;
			if(isClamped) {
				ball.x += distance;
			}
		}
	}

	moveY(distance) {
		if (this.y + this.height > canvas.height - distance ) {
			this.y = canvas.height - this.height;
		} else if (this.y < 0 - distance) {
			this.y = 0;
		} else {
			this.y += distance;
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
		if(!isDead && !isClamped){
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
		if(!isDead && !isClamped) {
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

		//WARNING This doesn't work with corner collisions

		//Return the ball to position prior to collision
		// this.x -= this.dx;
		// this.y -= this.dy;
		const lastX = this.x - this.dx;
		const lastY = this.y - this.dy;

		//Is the ball above or below the object?
		if(lastX > object.x && lastX < object.x + object.width) {
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
					
					if (areaOfCollision > 90) {
						newAngle =(Math.PI * 5) / 6;
						newSpeed = this.baseSpeed + 4;
						//left side (set angle and speed)
					}  else if (areaOfCollision > 5) {
						newAngle = (Math.PI * 3) / 4;
						newSpeed = this.baseSpeed + 2;
						//left middle (variable angle and speed)
					} else if (areaOfCollision > -5) {
						//middle (set 90 degree angle reset speed)
						newAngle = (Math.PI * 3) /2;
						newSpeed = this.baseSpeed;
					} else if (areaOfCollision > -90) {
						//right middle (variable angle and speed)
						newAngle = Math.PI / 4;
						newSpeed = this.baseSpeed + 2;
					} else {
						//rigth side (set angle and speed)
						newAngle = Math.PI / 6;
						newSpeed = this.baseSpeed + 4;
					}

					this.currentSpeed = newSpeed;
					this.angle = newAngle;
					this.dx = Math.cos(this.angle) * this.currentSpeed;
					this.dy = -Math.abs(Math.sin(this.angle) * this.currentSpeed);

				} else {					
					this.dy = -this.dy;
				}
			} else {
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
		let velX = this.x - this.prevX;
		let velY = this.y - this.prevY;
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
			let velY = this.y - this.prevY;
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


//#### PHYSICS #####
function randRange(min, max) {
	return (Math.random() * (max - min)) + min;
}

function detectCollisions() {
	//Check collisions with bottom of screen
	if (ball.y + ball.radius >= canvasHeight) {
		isDead = true;
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
	}
}

//##### GAME LOGIC ####
function onDeath() {
	if(playerLives > 0) {
		if(animationFrameId !== null){
			cancelAnimationFrame(animationFrameId);
		}
		playerLives -= 1;
		isDead = false;
		isClamped = true;
		initBoard();		
	} else {
		cancelAnimationFrame(animationFrameId)
		gameOverScreen();
	}
	
}

function checkLevelWinStatus() {
	//Check if any of the bricks are visible and change to next level
	if(!bricksArray.some(elem => elem.isVisible())) {
		currentLevel += 1; //cue up next map
		ball.baseSpeed += 0.5; //slowly turn up the volume on these points addicts!
		buildBricks(LEVELS[currentLevel]); //load next map
		isClamped = true; // keep ball attached to paddle until spacebar is pressed
		initBoard(); //get this party started
	}
}

function initBoard() {
	paddle.reset();
	ball.reset();
	draw();
}

function cls() {
	ctx.fillStyle = '#000000';
	ctx.fillRect(0,0, canvas.width, canvas.height);		
}

function write(text, font, size, startX, startY, fillStyle) {
	ctx.font = size + " " + font;
	ctx.fillStyle = fillStyle;
	ctx.fillText(text, startX, startY, width)
}

//#### EVENT LISTENER CALLBACKS ####
handleKeyDown = (event) => {
	if (event.keyCode === 39) {
		rightPressed = true;
	} else if (event.keyCode === 37) {
		leftPressed = true;
	} else if (event.keyCode === 32) {
		if(isClamped) {
			isClamped = false;
		} else{
			isPaused = !isPaused;
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

//#### MAIN GAME LOOPS ####
function draw() {

	//Solves the speed up problem
	if(animationFrameId) {
		cancelAnimationFrame(animationFrameId)
	}
	animationFrameId = requestAnimationFrame(draw);
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
		detectCollisions();

		//CHECK VICTORY CONDITIONS
		checkLevelWinStatus();
	}
}

function gameOverScreen() {
	function frame () {
		cancelAnimationFrame(animationFrameId)
		animationFrameId = requestAnimationFrame(frame);
		let now = Date.now();
		let delta = now - then;

		if (delta > INTERVAL) {
			then = now - (delta % INTERVAL);
			cls();
			write('Game Over', 'paralines', '85px', 120, 120, 'green')
			write('Score: ' + playerScore, 'paralines', '25px', 265, 180, 'yellow') //might need to change alignment
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

//#### INIT GAME OBJECTS ####
let	paddle = new Paddle(paddleStartX, paddleStartY,  paddleWidth, paddleHeight, paddleColor)
let	ball = new Ball(ballStartX, ballStartY,  ballRadius, 0, Math.PI*2, ballColor)
const starField = new Starfield(100);



//#### INIT GAME ####
buildBricks(LEVELS[currentLevel]);
initBoard();




//TODOS:

//fix clamp formula

//Start Screen

// add slow speed increase so I can reuse levels)


//Handle Mouse input correctly