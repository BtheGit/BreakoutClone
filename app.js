//##### GAME STATE HANDLERS #####
let rightPressed = false;
let leftPressed = false;
let isPaused = false; 
// let isFinished = false;

//##### VARIABLES ######
const canvasWidth = 650;
const canvasHeight = 400;

const paddleSpeed = 5;
const paddleWidth = 100;
const paddleHeight = 18;
const paddleColor = "blue";

const ballRadius = 8;
const ballColor = "red";

const brickWidth = 75;
const brickHeight = 20;
const brickHealth = 1;
const brickColor = "green";

const bricksArray = [];

let canvas = document.getElementById("gameCanvas");
canvas.width = canvasWidth;
canvas.height = canvasHeight;
let ctx = canvas.getContext("2d");

const level1 = {
	board:[
		[1,1,1,1,1,1,1],
		[1,1,1,1,1,1,1],
		[1,1,1,2,2,2,1]
	],
	padding: 10,
	offsetTop: 30,
	offsetLeft: 30
}

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

	// render() {
	// 	this.drawFillRect(this.x, this.y, this.width, this.height, this.color)
	// }
}

class Brick extends Rect {
	constructor(health = 1, x = 0, y = 0, width = 100, height = 20, color = "purple") {
		super(x, y, width, height, color);
		this.health = health;
	}

	takeDamage(damage = 1) {
		this.health -= damage;
	}

	isVisible() {
		return this.health ? true : false;
	}

	render() {
		if(this.health > 0) {
			this.drawFillRect(this.x, this.y, this.width, this.height, this.color)
		}
	}

	//TODO: later functions for brick health count color change
}

class Paddle extends Rect {
	moveX(distance) {
		if (this.x + this.width > canvas.width - distance ) {
			this.x = canvas.width - this.width;
		} else if (this.x < 0 - distance) {
			this.x = 0;
		} else {
			this.x += distance;
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

	render() {
		this.drawFillRect(this.x, this.y, this.width, this.height, this.color)
	}

}

class Ball {
	constructor(x = 0, y = 0, radius = 20, start = 0, end = Math.PI * 2, color = "purple", direction = false) {
		this.x = x;
		this.y = y;
		this.dx = 2;
		this.dy = 2;
		this.radius = radius;
		this.start = start;
		this.end = end;
		this.color = color;
		this.direction = direction;
	}

	moveX() {
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

	moveY() {
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

	collide(object) {
		if(this.y - this.radius <= object.y - (object.height/2) || this.y + this.radius >= object.y + (object.height/2)){
		  //Hit was from below the brick or above
			this.dy = -this.dy;
		}

		if(this.x  + this.radius <= object.x + (object.width / 2 || this.x  - this.radius >= object.x - (object.width / 2))){
		  //Hit was on left or right
		  this.dx = -this.dx
		}
	}

				// ball.x + ball.radius > brick.x 
				// && ball.x - ball.radius < brick.x + brick.width 
				// && ball.y + ball.radius > brick.y 
				// && ball.y - ball.radius < brick.y + brick.height

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

//#### EVENT LISTENER CALLBACKS ####
handleKeyDown = (event) => {
	if (event.keyCode === 39) {
		rightPressed = true;
	} else if (event.keyCode === 37) {
		leftPressed = true;
	} else if (event.keyCode === 32) {
		isPaused = !isPaused;
	}
}

handleKeyUp = (event) => {
	if (event.keyCode === 39) {
		rightPressed = false;
	} else if (event.keyCode === 37) {
		leftPressed = false;
	} 
}

//#### EVENT LISTENERS ####
document.addEventListener('keydown', handleKeyDown, false);
document.addEventListener('keyup', handleKeyUp, false);


function buildBricks(level) {
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

function detectCollisions() {
	//Check collisions with bottom of screen
	if (ball.y + ball.radius >= canvasHeight) {
		console.log('dead')
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

//#### MAIN GAME LOOP ####
draw = () => {
	if(!isPaused) {
		//CLEAR SCREEN
		ctx.clearRect(0,0,canvas.width, canvas.height);

		//HANDLE USER INPUT
		if(leftPressed) {
			paddle.moveX(-paddleSpeed);
		};
		if(rightPressed) {
			paddle.moveX(paddleSpeed);
		};

		//RENDER
		detectCollisions();
		renderBricks(bricksArray);
		ball.render();
		paddle.render();
	}
}

//#### INIT GAME OBJECTS ####
let paddle = new Paddle((canvas.width / 2) - (paddleWidth / 2), canvas.height - 30,  paddleWidth, paddleHeight, paddleColor)
let ball = new Ball(canvas.width / 2, canvas.height / 2,  ballRadius, 0, Math.PI*2, ballColor)
buildBricks(level1);

//#### INIT GAME ####
setInterval(draw, 10);

