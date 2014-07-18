window.onload = function() {
	game.init();
}

/*
 * Game init
 */
game = {
	FPS:30,
	init: function() {
		// Init canvas
		canvas = document.getElementById('stage');
		canvas.width = 800;
		canvas.height = 592;
		ctx = canvas.getContext("2d");

		// Handlers
		window.addEventListener('blur', function() {
			// Pause animation?
		});
		window.addEventListener('resize', function() {
			//
		});
		canvas.addEventListener('click', game.mouseClick, false);
		// Pause
		var btnPlay = document.getElementsByClassName('pause');
		game.pause = {};
		game.pause.active = 0;
		btnPlay[0].addEventListener('click', function() {
			if(!game.pause.active) {
				game.pause.active = 1;
				btnPlay[0].innerHTML = "Play";
			} else {
				game.pause.active = 0;
				btnPlay[0].innerHTML = "Pause";
			}
			return false;
		}, false);

		// Create world
		game.world.create();

		// Init entities
		game.ent.miner.init();
		game.initTrees();
		game.clouds.init();

		// Start main loop
		setInterval(game.loop, 1000/game.FPS);
	},
	loop: function() {
		if(!game.pause.active) {
			//Update
			game.ent.miner.update();
			//Draw
			// Need to determine when a redraw is necessary.
			game.clearCanvas();
			game.world.draw();
			game.drawTrees();
			game.clouds.draw();

			game.ent.miner.draw();

			// UI
			if(game.ent.miner.selected.target) {
				game.ent.miner.selected.draw();
			}
		}
	}
}

/*
 * Game map
 */
game.world = {
	width: 50,
	height: 37,
	map: [],
	create: function() {
		console.log('Creating world...');
		for (x = 0; x < this.width; x++) {
			this.map[x] = [];
			for (y = 0; y < this.width; y++) {
				if(y < 5) { // Sky
					this.map[x][y] = 0;
				} else if(y > 9 ) { // Stone
					this.map[x][y] = 3;
				} else if(y > this.height ) {
					this.map[x][y] = 0;
				} else { // Grass
					this.map[x][y] = 1;
				}
			}
		}
		// Tunnel
		tunx = Math.floor(Math.random()*this.width);
		tuny = Math.floor(Math.random()*(this.height - 24))+24;
		this.map[tunx][tuny] = 2;
		console.log([tunx, tuny]);
	},
	draw: function() {
		for (x = 0; x < this.width; x++) {
			for (y = 0; y < this.height; y++) {
				switch(this.map[x][y]) {
					case 0: // Sky
						ctx.fillStyle = "rgba(104,164,204,1)";
						break;
					case 1: // Grass
						ctx.fillStyle = "rgba(181,230,85,1)";
						break;
					case 2: // Tunnel
						ctx.fillStyle = "rgba(255,128,0,1)";
						break;
					case 3: // Solid Stone
						ctx.fillStyle = "rgba(145,163,171,1)";
						break;
					case 4: // Broken Stone 1
						ctx.fillStyle = "rgba(63,87,101,1)";
						break;
					case 5: // Broken Stone 2
						ctx.fillStyle = "rgba(43,58,66,1)";
						break;
					case 6: // Dark dirt
						ctx.fillStyle = "rgba(53,49,41,1)";
						break;
					case 7: // Light dirt
						ctx.fillStyle = "rgba(112,91,53,1)";
						break;
					default: // Dark dirt
						ctx.fillStyle = "rgba(53,49,41,1)";
				}
				ctx.lineWidth = 1;
				ctx.strokeStyle = "#fff";

				ctx.beginPath();
					ctx.rect(x*game.tile.width,
						y*game.tile.height,
						game.tile.width,
						game.tile.height);
				// ctx.stroke();
				ctx.fill();
				ctx.closePath();
			}
		}
	},
	getCell: function(x,y,size) {
		if(size) {
			x += size/2;
			y += size/2;
		}
		return [Math.floor(x/game.tile.width),
		Math.floor(y/game.tile.height)];
	}
};

game.tile = {
	width: 16,
	height: 16
}

/*
 * Game entities
 */
game.ent = {
	miner: {
		pos: {},
		init: function() {
			this.pos.x = canvas.width/2;
			this.pos.y = game.tile.height*7;
			this.cell = game.world.getCell(this.pos.x, this.pos.y);
			this.speed = 2;
			this.target = 0;
			this.path = [];
		},
		update: function() {
			this.cell = game.world.getCell(this.pos.x, this.pos.y, 10);
			if(this.path.length) {
				console.log(this.path);
				if(game.ent.compareCell([this.path[0][0],this.path[0][1]], this.cell)) {
					this.path.splice(0,1);
				}
			} else if(this.target) {
				if(game.ent.compareCell(this.target, this.cell)) {
					var tile = game.world.map[this.target[0]][this.target[1]];
					this.mine(tile);
				} else {
					this.selected.target = this.target;
					this.selected.valid = 0;
				}
				this.target = 0;
			}
			if(this.target) {
				if(!game.ent.compareCell(this.target, this.cell)) {
					game.ent.moveTarget(this);
				} else {
					this.selected.target = 0;
				}
			}
		},
		mine: function(tile) {
			if(tile >= 3 && tile <= 5) {
				game.world.map[this.target[0]][this.target[1]] += 1;
			} else if(tile == 1) {
				game.world.map[this.target[0]][this.target[1]] = 7;
			}
		},
		draw: function() {
			var size = 10;
			ctx.fillStyle = "rgba(0,0,0,1)";
			ctx.fillRect(this.pos.x, this.pos.y, size, size);
		},
		selected: {
			target: 0,
			valid: 0,
			draw: function() {
				var x = this.target[0]*game.tile.width,
				y = this.target[1]*game.tile.height;
				if(this.valid) {
					ctx.strokeStyle = "#0084ff";
				} else {
					ctx.strokeStyle = "red";
				}
				ctx.strokeRect(x, y, game.tile.width, game.tile.height);
			}
		},
	},
	moveTarget: function(unit) {
		if(unit.path) {
			if(!unit.path.length) {
				unit.target = 0;
			}
			var tx = unit.path[0][0]*game.tile.width;
			var ty = unit.path[0][1]*game.tile.height;
		} else {
			// Get coords for center of target
			var tx = unit.target[0]*game.tile.width;
			var ty = unit.target[1]*game.tile.height;
		}
		// Rotate us to face the target
	    var rotation = Math.atan2(ty - unit.pos.y, tx - unit.pos.x);
	    // Move towards the target
	    unit.pos.x += Math.cos(rotation) * unit.speed;
	    unit.pos.y += Math.sin(rotation) * unit.speed;
	    unit.pos.y += 0.5;
	},
	compareCell: function(cell1, cell2) {
		if(cell1[0] == cell2[0]) {
			if(cell1[1] == cell2[1]) {
				return true;
			}
		}
		return false;
	}
};

/*
 * Handle events
 */
game.mouseClick = function(e) {
	var x,y;
	// grab html page coords
	if (e.pageX != undefined && e.pageY != undefined) {
		x = e.pageX;
		y = e.pageY;
	} else {
		x = e.clientX + document.body.scrollLeft +
		document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop +
		document.documentElement.scrollTop;
	}
  
	// make them relative to the canvas only
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;

	// return tile x,y that we clicked
	var cell = game.world.getCell(x, y);
	game.ent.miner.target = [cell[0],cell[1]];
	var path = findPath(game.ent.miner.cell, game.ent.miner.target);
	game.ent.miner.selected.target = [cell[0],cell[1]];

	console.log('clicked tile '+cell[0]+','+cell[1]);

	if(path.length) {
		console.log(path);
		// console.log(game.ent.miner.target);
		game.ent.miner.path = path;
		game.ent.miner.selected.valid = "green";
	} else {
		game.ent.miner.target = 0;
	}
}

/*
 * Drawing
 */
// Environment
game.clearCanvas = function() {
	ctx.clearRect(0,0,canvas.width,canvas.height);
};
game.initTrees = function() {
	game.trees = [];
    for (i=0; i<=80; i++) {
      // Get random positions for trees
      var treex = ~~(Math.random() * (canvas.width - 22));
      // var treey = ~~(Math.random() * canvas.height);
      var treey = ~~(Math.random() * 10)+game.tile.height*4;
      // var treey = 10;

      var colors = ['rgba(31, 138, 112, 1)','rgba(26, 117, 95, 1)','rgba(36, 159, 129, 1)'];
	  // var color = (Math.random()*colors.length - 1).toFixed(0);
	  var color = Math.floor(Math.random()*colors.length - 1);
	  treeFill = colors[color];

	  if(treeFill == undefined) {
		treeFill = colors[0];
	  }

      treeSize = ~~(Math.random() * 10)+12;
      game.trees.push([treeFill, treex, treey, treeSize]);
    }
    game.trees = game.trees.sort((function(index){
	    return function(a, b){
	        return (a[index] === b[index] ? 0 : (a[index] < b[index] ? -1 : 1));
	    };
	})(2));
};
game.drawTrees = function() {
	for (i=0; i < game.trees.length; i++) {
		// game.trees[i][1] += 0.19;
		// if(game.trees[i][1] > (canvas.width*2)) {
		// 	game.trees[i][1] = -game.trees[i][3];
		// }
		var x = game.trees[i][1];
		var y = 22;
		y += game.trees[i][2];
		// Draw the given tree
		ctx.fillStyle = game.trees[i][0];
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.lineTo((x+game.trees[i][3]),y);
		ctx.lineTo((x+(game.trees[i][3])/2),(y-game.trees[i][3]));
		ctx.lineTo(x,y);
		ctx.closePath();
		ctx.fill();
	}
};
game.clouds = {
	init: function() {
		this.arr = [];
	    for (i=0; i<=20; i++) {
	      // Get random positions for trees
	      var cx = ~~(Math.random() * (canvas.width - 22));
	      // var cy = ~~(Math.random() * canvas.height);
	      var cy = Math.floor(Math.random() * 2);

	      size = Math.floor(Math.random() * 2)+1;
	      speed = Math.random()*0.25;
	      this.arr.push([cx, cy, size, speed]);
	    }
	},
	draw: function() {
		for (i=0; i < this.arr.length; i++) {
			var x = this.arr[i][0],
			y = this.arr[i][1],
			size = 20,
			speed = this.arr[i][3];

			this.arr[i][0] += speed;
			if(this.arr[i][0] > (canvas.width+size)) {
				this.arr[i][0] = -size;
			}
			// Draw the given cloud
			ctx.fillStyle = "rgba(255,255,255,0.5)";
			ctx.beginPath();
			ctx.arc(x, y, 20, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
		}
	}
}

// world is a 2d array of integers (eg world[10][15] = 0)
// pathStart and pathEnd are arrays like [5,10]
function findPath(pathStart, pathEnd)
{
	// shortcuts for speed
	var	abs = Math.abs,
	max = Math.max,
	pow = Math.pow,
	sqrt = Math.sqrt,
	world = game.world.map;

	// the world data are integers:
	// anything higher than this number is considered blocked
	// this is handy is you use numbered sprites, more than one
	// of which is walkable road, grass, mud, etc
	var walkableTiles = [1, 4, 5, 6, 7];

	// keep track of the world dimensions
    // Note that this A-star implementation expects the world array to be square: 
	// it must have equal height and width. If your game world is rectangular, 
	// just fill the array with dummy values to pad the empty space.
	var worldWidth = world[0].length;
	var worldHeight = world.length;
	var worldSize =	worldWidth * worldHeight;

	// which heuristic should we use?
	// default: no diagonals (Manhattan)
	// var distanceFunction = ManhattanDistance;
	// var findNeighbours = function(){}; // empty

	

	// alternate heuristics, depending on your game:

	// diagonals allowed but no sqeezing through cracks:
	var distanceFunction = DiagonalDistance;
	var findNeighbours = DiagonalNeighbours;

	// diagonals and squeezing through cracks allowed:
	// var distanceFunction = DiagonalDistance;
	// var findNeighbours = DiagonalNeighboursFree;

	// // euclidean but no squeezing through cracks:
	// var distanceFunction = EuclideanDistance;
	// var findNeighbours = DiagonalNeighbours;

	// // euclidean and squeezing through cracks allowed:
	// var distanceFunction = EuclideanDistance;
	// var findNeighbours = DiagonalNeighboursFree;

	

	// distanceFunction functions
	// these return how far away a point is to another

	function ManhattanDistance(Point, Goal)
	{	// linear movement - no diagonals - just cardinal directions (NSEW)
		return abs(Point.x - Goal.x) + abs(Point.y - Goal.y);
	}

	function DiagonalDistance(Point, Goal)
	{	// diagonal movement - assumes diag dist is 1, same as cardinals
		return max(abs(Point.x - Goal.x), abs(Point.y - Goal.y));
	}

	function EuclideanDistance(Point, Goal)
	{	// diagonals are considered a little farther than cardinal directions
		// diagonal movement using Euclide (AC = sqrt(AB^2 + BC^2))
		// where AB = x2 - x1 and BC = y2 - y1 and AC will be [x3, y3]
		return sqrt(pow(Point.x - Goal.x, 2) + pow(Point.y - Goal.y, 2));
	}

	// Neighbours functions, used by findNeighbours function
	// to locate adjacent available cells that aren't blocked

	// Returns every available North, South, East or West
	// cell that is empty. No diagonals,
	// unless distanceFunction function is not Manhattan
	function Neighbours(x, y)
	{
		var	N = y - 1,
		S = y + 1,
		E = x + 1,
		W = x - 1,
		myN = N > -1 && canWalkHere(x, N),
		myS = S < worldHeight && canWalkHere(x, S),
		myE = E < worldWidth && canWalkHere(E, y),
		myW = W > -1 && canWalkHere(W, y),
		result = [];
		if(myN)
		result.push({x:x, y:N});
		if(myE)
		result.push({x:E, y:y});
		if(myS)
		result.push({x:x, y:S});
		if(myW)
		result.push({x:W, y:y});
		findNeighbours(myN, myS, myE, myW, N, S, E, W, result);
		return result;
	}

	// returns every available North East, South East,
	// South West or North West cell - no squeezing through
	// "cracks" between two diagonals
	function DiagonalNeighbours(myN, myS, myE, myW, N, S, E, W, result)
	{
		if(myN)
		{
			if(myE && canWalkHere(E, N))
			result.push({x:E, y:N});
			if(myW && canWalkHere(W, N))
			result.push({x:W, y:N});
		}
		if(myS)
		{
			if(myE && canWalkHere(E, S))
			result.push({x:E, y:S});
			if(myW && canWalkHere(W, S))
			result.push({x:W, y:S});
		}
	}

	// returns every available North East, South East,
	// South West or North West cell including the times that
	// you would be squeezing through a "crack"
	function DiagonalNeighboursFree(myN, myS, myE, myW, N, S, E, W, result)
	{
		myN = N > -1;
		myS = S < worldHeight;
		myE = E < worldWidth;
		myW = W > -1;
		if(myE)
		{
			if(myN && canWalkHere(E, N))
			result.push({x:E, y:N});
			if(myS && canWalkHere(E, S))
			result.push({x:E, y:S});
		}
		if(myW)
		{
			if(myN && canWalkHere(W, N))
			result.push({x:W, y:N});
			if(myS && canWalkHere(W, S))
			result.push({x:W, y:S});
		}
	}

	// returns boolean value (world cell is available and open)
	function canWalkHere(x, y)
	{
		if(world[x] != null) {
			if(world[x][y] != null) {
				if(walkableTiles.contains(world[x][y])) {
					return true;
				}
				if(typeof world[x-1][y] != 'undefined') {
					if(walkableTiles.contains(world[x-1][y])) {
						return true;
					}
				}
				if(typeof world[x+1][y] != 'undefined') {
					if(walkableTiles.contains(world[x+1][y])) {
						return true;
					}
				}
				if(typeof world[x][y-1] != 'undefined') {
					if(walkableTiles.contains(world[x][y-1])) {
						return true;
					}
				}
				if(typeof world[x][y+1] != 'undefined') {
					if(walkableTiles.contains(world[x][y+1])) {
						return true;
					}
				}
				// switch(true) {
				// 	case walkableTiles.contains(world[x][y]):
				// 	case walkableTiles.contains(world[x-1][y]):
				// 	case walkableTiles.contains(world[x+1][y]):
				// 	case walkableTiles.contains(world[x][y-1]):
				// 	case walkableTiles.contains(world[x][y+1]):
				// 		return true;
				// 		break;
				// 	default:
				// 	return false;
				// }
			}
		}
		return false;
	};

	// Node function, returns a new object with Node properties
	// Used in the calculatePath function to store route costs, etc.
	function Node(Parent, Point)
	{
		var newNode = {
			// pointer to another Node object
			Parent:Parent,
			// array index of this Node in the world linear array
			value:Point.x + (Point.y * worldWidth),
			// the location coordinates of this Node
			x:Point.x,
			y:Point.y,
			// the heuristic estimated cost
			// of an entire path using this node
			f:0,
			// the distanceFunction cost to get
			// from the starting point to this node
			g:0
		};

		return newNode;
	}

	// Path function, executes AStar algorithm operations
	function calculatePath()
	{
		// create Nodes from the Start and End x,y coordinates
		var	mypathStart = Node(null, {x:pathStart[0], y:pathStart[1]});
		var mypathEnd = Node(null, {x:pathEnd[0], y:pathEnd[1]});
		// create an array that will contain all world cells
		var AStar = new Array(worldSize);
		// list of currently open Nodes
		var Open = [mypathStart];
		// list of closed Nodes
		var Closed = [];
		// list of the final output array
		var result = [];
		// reference to a Node (that is nearby)
		var myNeighbours;
		// reference to a Node (that we are considering now)
		var myNode;
		// reference to a Node (that starts a path in question)
		var myPath;
		// temp integer variables used in the calculations
		var length, max, min, i, j;
		// iterate through the open list until none are left
		while(length = Open.length)
		{
			max = worldSize;
			min = -1;
			for(i = 0; i < length; i++)
			{
				if(Open[i].f < max)
				{
					max = Open[i].f;
					min = i;
				}
			}
			// grab the next node and remove it from Open array
			myNode = Open.splice(min, 1)[0];
			// is it the destination node?
			if(myNode.value === mypathEnd.value)
			{
				myPath = Closed[Closed.push(myNode) - 1];
				do
				{
					result.push([myPath.x, myPath.y]);
				}
				while (myPath = myPath.Parent);
				// clear the working arrays
				AStar = Closed = Open = [];
				// we want to return start to finish
				result.reverse();
			}
			else // not the destination
			{
				// find which nearby nodes are walkable
				myNeighbours = Neighbours(myNode.x, myNode.y);
				// test each one that hasn't been tried already
				for(i = 0, j = myNeighbours.length; i < j; i++)
				{
					myPath = Node(myNode, myNeighbours[i]);
					if (!AStar[myPath.value])
					{
						// estimated cost of this particular route so far
						myPath.g = myNode.g + distanceFunction(myNeighbours[i], myNode);
						// estimated cost of entire guessed route to the destination
						myPath.f = myPath.g + distanceFunction(myNeighbours[i], mypathEnd);
						// remember this new path for testing above
						Open.push(myPath);
						// mark this node in the world graph as visited
						AStar[myPath.value] = true;
					}
				}
				// remember this route as having no more untested options
				Closed.push(myNode);
			}
		} // keep iterating until the Open list is empty
		return result;
	}

	// actually calculate the a-star path!
	// this returns an array of coordinates
	// that is empty if no path is possible
	return calculatePath();

} // end of findPath() function

/*
 * Stats
 * - https://github.com/mrdoob/stats.js
 */
var stats = new Stats();
stats.setMode(1); // 0: fps, 1: ms

// Align top-left
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';

document.body.appendChild( stats.domElement );

setInterval( function () {

    stats.begin();

    // your code goes here

    stats.end();

}, 1000 / 60 );

/*
 * Prototype
 */
Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}