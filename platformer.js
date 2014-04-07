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
	this.timeStep = options.timeStep || 0.01
	this.remainingUpdateTime = 0
	
	this.platforms = []
	this.players = []
	
	this.debugCanvas = null
}

platformer.World.prototype.createPlatform = function(options)
{
	var platform = new platformer.Platform(options || {})
	this.platforms.push(platform)
	
	return platform
}

platformer.World.prototype.createPlayer = function(options)
{
	var player = new platformer.Player(options || {})
	this.players.push(player)
	
	return player
}

// dt is in seconds
platformer.World.prototype.update = function(dt)
{
	this.remainingUpdateTime += dt
	while (this.remainingUpdateTime >= this.timeStep)
	{
		this.remainingUpdateTime -= this.timeStep
		this.updateStep(this.timeStep)
	}
}

platformer.World.prototype.updateStep = function(dt)
{
	// update player dynamics
	for (var i = 0; i < this.players.length; i++)
	{
		var player = this.players[i]
		
		// acceleration from forces (gravity)
		vec2.scaleAndAdd(player.velocity, player.velocity, this.gravity, dt)
		
		// position update from velocity integration
		vec2.scaleAndAdd(player.position, player.position, player.velocity, dt)
		
		// collision with platforms
		player.grounded = false
		for (var i = 0; i < this.platforms.length; i++)
		{
			var platform = this.platforms[i]
			
			var collisionInfo = {
				normal: null,
				depth: null
			}
			if (platform.collide(player, collisionInfo))
			{
				var velocityDotNormal = vec2.dot(player.velocity, collisionInfo.normal)
				
				// exclude this contact if it is separating
				if (velocityDotNormal > 0)
					return
				
				// fix interpenetration
				vec2.scaleAndAdd(player.position, player.position, collisionInfo.normal, collisionInfo.depth)
				
				// keep only tangent velocity
				vec2.scaleAndAdd(player.velocity, player.velocity, collisionInfo.normal, -velocityDotNormal)
				
				// check if we collided with the ground
				if (collisionInfo.normal[1] > Math.abs(collisionInfo.normal[0]))
					player.grounded = true
			}
		}
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
	
	context.fillStyle = "#ff0"
	for (var i = 0; i < this.platforms.length; i++)
	{
		var platform = this.platforms[i]
		context.fillRect(platform.position[0], platform.position[1], platform.size[0], platform.size[1])
	}
	
	context.fillStyle = "#0f0"
	for (var i = 0; i < this.players.length; i++)
	{
		var player = this.players[i]
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

platformer.Platform.prototype.collide = function()
{
	// create temporary vectors only once
	var LEFT = vec2.fromValues(-1, 0)
	var RIGHT = vec2.fromValues(1, 0)
	var UP = vec2.fromValues(0, 1)
	var DOWN = vec2.fromValues(0, -1)
	
	return function(player, collisionInfo)
	{
		collisionInfo.depth = null
		
		function testOverlap(overlap, normal)
		{
			if (overlap < 0)
				return false
			
			if ((collisionInfo.depth === null) || (overlap < collisionInfo.depth))
			{
				// new minimal overlap found
				collisionInfo.depth = overlap
				collisionInfo.normal = normal
			}
			
			return true
		}
		
		if (!testOverlap(this.position[0] + this.size[0] - player.position[0], RIGHT)) return false
		if (!testOverlap(player.position[0] + player.size[0] - this.position[0], LEFT)) return false
		if (!testOverlap(this.position[1] + this.size[1] - player.position[1], UP)) return false
		if (!testOverlap(player.position[1] + player.size[1] - this.position[1], DOWN)) return false
		
		return true
	}
}()

platformer.Player = function(options)
{
	var position = options.position || [0, 0]
	var velocity = options.velocity || [0, 0]
	var size = options.size || [1, 1]
	
	this.position = vec2.clone(position)
	this.velocity = vec2.clone(velocity)
	this.size = vec2.clone(size)
	this.moveSpeed = options.moveSpeed || 2
	this.jumpSpeed = options.jumpSpeed || 5
	
	this.grounded = false
}

platformer.Player.prototype.moveHorizontally = function(factor)
{
	this.velocity[0] = this.moveSpeed * factor
}

platformer.Player.prototype.jump = function()
{
	this.velocity[1] = this.jumpSpeed
}

platformer.EventDispatcher = function()
{
	this.listeners = {}
}

platformer.EventDispatcher.prototype.addEventListener = function(name, listener)
{
	if (!this.listeners[name])
		this.listeners[name] = []
	
	this.listeners[name].push(listener)
}

platformer.EventDispatcher.prototype.removeEventListener = function(name, listener)
{
	this.listeners[name].splice(this.listeners[name].indexOf(listener))
}

platformer.EventDispatcher.prototype.hasEventListener = function(name, listener)
{
	if (!this.listeners[name])
		return false
	
	return (this.listeners[name].indexOf(listener) != -1)
}

platformer.EventDispatcher.prototype.dispatchEvent = function(name, event)
{
	if (!this.listeners[name])
		return
	
	this.listeners[name].apply(function(listener)
	{
		listener(event)
	})
}
