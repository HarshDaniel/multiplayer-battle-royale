const express = require('express')
const app = express()

//socket io server setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })

const port = 3000 || process.env.PORT

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const players = {}
const projectiles = {}

const speed = 10
let projectileId = 0
const radius = 10
const projectileRadius = 5

io.on('connection', (socket) => {
  console.log('a user connected')

  

  io.emit('updatePlayers', players)


  socket.on('shoot', ({ x, y, angle }) => {
    projectileId++

    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }

    projectiles[projectileId] = {
      x, y, velocity, playerId: socket.id
    }
  })

  socket.on('initGame', ({ username, canvasWidth, canvasHeight }) => {
    players[socket.id] = {
      x: 1024 * Math.random(),
      y: 576 * Math.random(),
      color: `hsl(${ 360 * Math.random() }, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username: username
    }

    players[socket.id].canvas = {
      width: canvasWidth,
      height: canvasHeight,
    }

    players[socket.id].radius = radius

    
  })

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete players[socket.id]
  
    io.emit('updatePlayers', players)
  })



  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    const player = players[socket.id]
    
    if (!player) return

    players[socket.id].sequenceNumber = sequenceNumber
    
    switch(keycode) {

      case 'ArrowUp':
        players[socket.id].y -= speed
        break
  
      case 'ArrowDown':
        players[socket.id].y += speed
        break
        
      case 'ArrowLeft':
        players[socket.id].x -= speed
        break
  
      case 'ArrowRight':
        players[socket.id].x += speed
        break
    }

    const playerSides = {
      left: player.x - player.radius,
      right: player.x + player.radius,
      top: player.y - player.radius,
      bottom: player.y + player.radius
    }


    if (playerSides.left < 0) {
      players[socket.id].x = player.radius
    }

    if (playerSides.right > 1024) {
      players[socket.id].x = 1024 - player.radius
    }

    if (playerSides.top < 0) {
      players[socket.id].y = player.radius
    }

    if (playerSides.bottom > 576) {
      players[socket.id].y = 576 - player.radius
    }
  })
})

setInterval(() => {
  
  for (const id in projectiles) {
    projectiles[id].x += projectiles[id].velocity.x
    projectiles[id].y += projectiles[id].velocity.y

    const radius = 5
    if (projectiles[id].x - radius >= 
         players[projectiles[id].playerId]?.canvas.width ||
         projectiles[id].x + radius <= 0 ||
         projectiles[id].y - radius >=
         players[projectiles[id].playerId]?.canvas.height ||
         projectiles[id].y + radius <= 0) {
      delete projectiles[id]
      continue
    }

    for (const playerId in players) {
      const player = players[playerId]
      const distance = Math.hypot(
        projectiles[id].x - player.x,
        projectiles[id].y - player.y
      )

      if (distance < projectileRadius + player.radius && projectiles[id].playerId !== playerId) {
        if (players[projectiles[id].playerId]) {
          players[projectiles[id].playerId].score++
        }
        delete projectiles[id]
        delete players[playerId]
        break
      }
    }
  }

  io.emit('updatePlayers', players)
  io.emit('updateProjectiles', projectiles)
}, 15)

server.listen(port, () => {
  console.log(`app listening on port ${port}`)
})
