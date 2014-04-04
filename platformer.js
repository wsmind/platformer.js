/**
 * platformer.js - lightweight library for typical 2D platformer movements
 * Copyright 2014 Remi Papillie
 *
 * MIT license
 */

// unique global for platformer.js
var platformer = {}

platformer.World = function(options)
{
	options = options || {}
	
	var gravity = options.gravity || [0, -9.8]
	
	this.gravity = vec2.clone(gravity)
	
	this.platforms = []
	this.players = []
	
	this.debugCanvas = null
}

platformer.World.prototype.createPlatform = function(options)
{
	var platform = new platformer.Platform(options || {})
	this.platforms.push(platform)
}

platformer.World.prototype.createPlayer = function(options)
{
	var player = new platformer.Player(options || {})
	this.players.push(player)
}

// dt is in seconds
platformer.World.prototype.update = function(dt)
{
	// update player dynamics
	for (var i = 0; i < this.players.length; i++)
	{
		var player = this.players[i]
		
		// acceleration from forces (gravity)
		vec2.scaleAndAdd(player.velocity, player.velocity, this.gravity, dt)
		
		// position update from velocity integration
		vec2.scaleAndAdd(player.position, player.position, player.velocity, dt)
	}
	
	if (this.debugCanvas)
		this.drawDebug()
}

platformer.World.prototype.enableDebug = function(canvas)
{
	this.debugCanvas = canvas
}

platformer.World.prototype.disableDebug = function()
{
	this.debugCanvas = null
}

platformer.World.prototype.drawDebug = function()
{
	var context = this.debugCanvas.getContext("2d")
	
	context.fillStyle = "#000"
	context.fillRect(0, 0, this.debugCanvas.width, this.debugCanvas.height)
	
	context.save()
	context.translate(this.debugCanvas.width * 0.5, this.debugCanvas.height * 0.5)
	context.scale(100, -100)
	
	for (var i = 0; i < this.platforms.length; i++)
	{
		var platform = this.platforms[i]
		
		context.fillStyle = "#ff0"
		context.fillRect(platform.position[0], platform.position[1], platform.size[0], platform.size[1])
	}
	
	for (var i = 0; i < this.players.length; i++)
	{
		var player = this.players[i]
		
		context.fillStyle = "#0f0"
		context.fillRect(player.position[0], player.position[1], player.size[0], player.size[1])
	}
	
	context.restore()
}

platformer.Platform = function(options)
{
	var position = options.position || [0, 0]
	var size = options.size || [1, 1]
	
	this.position = vec2.clone(position)
	this.size = vec2.clone(size)
}

platformer.Player = function(options)
{
	var position = options.position || [0, 0]
	var velocity = options.velocity || [0, 0]
	var size = options.size || [1, 1]
	
	this.position = vec2.clone(position)
	this.velocity = vec2.clone(velocity)
	this.size = vec2.clone(size)
}
