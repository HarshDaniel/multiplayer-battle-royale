const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = 1024 * devicePixelRatio
canvas.height = 576 * devicePixelRatio

c.scale(devicePixelRatio, devicePixelRatio)

const x = canvas.width / 2
const y = canvas.height / 2



const players = {}
const projectiles = {}

socket.on('updatePlayers', (backendPlayers) => {
  for (const id in backendPlayers) {
    const backendPlayer = backendPlayers[id]

    if (!players[id]) {
      players[id] = new Player({
        x: backendPlayer.x,
        y: backendPlayer.y,
        radius: 10,
        color: backendPlayer.color,
        username: backendPlayer.username  
      })

      document.querySelector('#playerLabels').innerHTML += `<div data-id="${id}" data-score="${backendPlayer.score}">${backendPlayer.username}: ${backendPlayer.score}</div>`
    } else {

      document.querySelector(`div[data-id="${id}"]`).innerHTML = `${backendPlayer.username}: ${backendPlayer.score}`
      document.querySelector(`div[data-id="${id}"]`).setAttribute('data-score', backendPlayer.score)

      const parentDiv = document.querySelector("#playerLabels")
      const childDivs = Array.from(parentDiv.querySelectorAll('div'))

      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute('data-score'))
        const scoreB = Number(b.getAttribute('data-score'))

        return scoreB - scoreA
      })

      childDivs.forEach((div) => {
        parentDiv.removeChild(div)
      })

      childDivs.forEach((div) => {
        parentDiv.appendChild(div)
      })

      players[id].target = {
        x: backendPlayer.x,
        y: backendPlayer.y
      }

      if( id === socket.id) {
       

        const lastBackendInputIndex = playerInput.findIndex(input => {
          return backendPlayer.sequenceNumber === input.sequenceNumber
        })

        if (lastBackendInputIndex > -1) {
          playerInput.splice(0, lastBackendInputIndex + 1)
        }

        playerInput.forEach(input => {
          players[id].target.x += input.dx
          players[id].target.y += input.dy
        })
     } 
    }
  }
  
  for (const id in players) {
    if (!backendPlayers[id]) {
      const divDelete = document.querySelector(`div[data-id="${id}"]`)
      divDelete.parentNode.removeChild(divDelete)
      if (id === socket.id) {
        document.querySelector('#usernameForm').style.display = 'block'
      }
      delete players[id]
    }
  }

  for (const id in projectiles) {
    if (!backendPlayers[projectiles[id].playerId]) {
      delete projectiles[id]
    }
  }
  
})

socket.on('updateProjectiles', (backendProjectiles) => {
  for (const id in backendProjectiles) {
    const backendProjectile = backendProjectiles[id]

    if (!projectiles[id]) {
      projectiles[id] = new Projectile({ 
        x: backendProjectile.x,
        y: backendProjectile.y,
        radius: 5,
        color: players[backendProjectile.playerId]?.color,
        velocity: backendProjectile.velocity 
      })  
    } else {
      projectiles[id].x += backendProjectile.velocity.x
      projectiles[id].y += backendProjectile.velocity.y

    }
  }

})


let animationId

function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  for (const id in players) {
    const player = players[id]
    if (player.target) {
      //players[id].x += players[id].target.x - players[id].x * 0.1
      //players[id].y += players[id].target.y - players[id].y * 0.1
    }
    player.draw()

  }

  // for (let i = projectiles.length - 1; i >= 0; i--) {
  //   const projectile = projectiles[i]
  //   projectile.update()
  // }

  for (const id in projectiles) {
    const projectile = projectiles[id]
    projectile.draw()
  }
}

animate()

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
}

const speed = 10
const playerInput = []
let sequenceNumber = 0
setInterval(() => {

  if (keys.ArrowUp) {
    sequenceNumber++
    playerInput.push({ sequenceNumber, dx: 0, dy: -speed })
    players[socket.id].y -= speed
    socket.emit('keydown', { keycode: 'ArrowUp', sequenceNumber })
  }
  if (keys.ArrowDown) {
    sequenceNumber++
    playerInput.push({ sequenceNumber, dx: 0, dy: speed })
    players[socket.id].y += speed
    socket.emit('keydown', { keycode: 'ArrowDown', sequenceNumber })
  }
  if (keys.ArrowLeft) {
    sequenceNumber++
    playerInput.push({ sequenceNumber, dx: -speed, dy: 0 })
    players[socket.id].x -= speed
    socket.emit('keydown', { keycode: 'ArrowLeft', sequenceNumber })
  }
  if (keys.ArrowRight) {
    sequenceNumber++
    playerInput.push({ sequenceNumber, dx: speed, dy: 0 })
    players[socket.id].x += speed
    socket.emit('keydown', { keycode: 'ArrowRight', sequenceNumber })
  }

}, 15)

window.addEventListener('keydown', (event) => {

  if (!players[socket.id]) return

  switch(event.key) {

    case 'ArrowUp':
      keys.ArrowUp = true
      break

    case 'ArrowDown':
      keys.ArrowDown = true
      break
      
    case 'ArrowLeft':
      keys.ArrowLeft = true
      break

    case 'ArrowRight':
      keys.ArrowRight = true
      break
  }
})

window.addEventListener('keyup', (event) => {
  switch(event.key) {

    case 'ArrowUp':
      keys.ArrowUp = false
      break

    case 'ArrowDown':
      keys.ArrowDown = false
      break
      
    case 'ArrowLeft':
      keys.ArrowLeft = false
      break

    case 'ArrowRight':
      keys.ArrowRight = false
      break
  }
})

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
  event.preventDefault()
  document.querySelector('#usernameForm').style.display = 'none'
  const username = document.querySelector('#usernameInput').value
  socket.emit('initGame', { username, canvasWidth: canvas.width, canvasHeight: canvas.height, devicePixelRatio })
})

