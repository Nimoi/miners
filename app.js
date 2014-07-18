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
		//Update
		game.ent.miner.update();
		//Draw
		// Need to determine when a redraw is necessary.
		game.clearCanvas();
		game.world.draw();
		game.drawTrees();
		game.clouds.draw();

		game.ent.miner.draw();
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
			for (y = 0; y < this.height; y++) {
				if(y < 5) { // Sky
					this.map[x][y] = 0;
				} else if(y > 9 ) { // Stone
					this.map[x][y] = 3;
				} else { // Grass
					this.map[x][y] = 1;
				}
			}
		}
		// Relic
		relicx = Math.floor(Math.random()*this.width);
		relicy = Math.floor(Math.random()*(this.height - 24))+24;
		this.map[relicx][relicy] = 2;
		console.log([relicx, relicy]);
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
					case 2: // Relic
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
					default: // Grass
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
			this.speed = 1;
			this.target = 0;
		},
		update: function() {
			this.cell = game.world.getCell(this.pos.x, this.pos.y, 10);
			if(this.target) {
				if(game.ent.compareCell(this.target, this.cell)) {
					game.world.map[this.target[0]][this.target[1]] += 1;
					this.target = 0;
				} else {
					game.ent.moveTarget(this);
				}
			}
		},
		draw: function() {
			var size = 10;
			ctx.fillStyle = "rgba(0,0,0,1)";
			ctx.fillRect(this.pos.x, this.pos.y, size, size);
		},
	},
	moveTarget: function(unit) {
		// Get coords for center of target
		var tx = unit.target[0]*game.tile.width;
		var ty = unit.target[1]*game.tile.height;
		// Rotate us to face the target
	    var rotation = Math.atan2(ty - unit.pos.y, tx - unit.pos.x);
	    // Move towards the target
	    unit.pos.x += Math.cos(rotation) * unit.speed;
	    unit.pos.y += Math.sin(rotation) * unit.speed;
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

	console.log('clicked tile '+cell[0]+','+cell[1]);

	game.ent.miner.target = [cell[0],cell[1]];
	console.log(game.ent.miner.target);
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