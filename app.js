

// drawEmptyRect = (startx, starty, width, height, color = "#000000") => {
// 	ctx.beginPath();
// 	ctx.rect(startx, starty, width, height);
// 	ctx.strokeStyle = color;
// 	ctx.stroke();
// 	ctx.closePath();
// }


// drawEmptyArc = (startx, starty, radius, start, end, color = "#000000", direction = false) => {
// 	ctx.beginPath();
// 	ctx.arc(startx, starty, radius, start, end, direction);
// 	ctx.strokeStyle = color;
// 	ctx.stroke();
// 	ctx.closePath();
// }


// drawFillRect(40,40,50,50, "purple");
// drawEmptyRect(100,40,50,50, "purple");

// drawFillArc(200, 200, 30, 0, Math.PI * 2, false, "blue");
// drawEmptyArc(300, 200, 30, 0, Math.PI * 2, false, "blue");


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
const brickColor = "green";

const brickRowCount = 3;
const brickColumnCount = 7;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
const bricksArray = [];

let canvas = document.getElementById("gameCanvas");
canvas.width = canvasWidth;
canvas.height = canvasHeight;
let ctx = canvas.getContext("2d");

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

	render() {
		this.drawFillRect(this.x, this.y, this.width, this.height, this.color)
	}
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

}

class Brick extends Rect {
	constructor(health = 1) {
		this.health = health;
	}

	takeDamage(damage = 1) {
		this.health -= damage;
	}
	//functions for destroying brick

	//later functions for brick health count and color change
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


function drawBricks() {
	for (let c = 0; c < brickColumnCount; c++) {
		let brickRow = [];
		for(let r = 0; r < brickRowCount; r++) {
			let brickX = (c *(brickWidth + brickPadding)) + brickOffsetLeft;
			let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
			let brick = new Brick(brickX, brickY, brickWidth, brickHeight, brickColor)
			brick.render();
			brickRow.push(brick);
		}
		bricksArray.push(brickRow);
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
		drawBricks();
		ball.render();
		paddle.render();
	}
}

//#### INIT GAME OBJECTS ####
let paddle = new Paddle((canvas.width / 2) - (paddleWidth / 2), canvas.height - 30,  paddleWidth, paddleHeight, paddleColor)
let ball = new Ball(canvas.width / 2, canvas.height / 2,  ballRadius, 0, Math.PI*2, ballColor)

//#### INIT GAME ####
setInterval(draw, 10);

