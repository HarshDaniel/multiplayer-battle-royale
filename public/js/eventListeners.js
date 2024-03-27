addEventListener('click', (event) => {
  const canvas = document.querySelector('canvas')
  const { top, left } = canvas.getBoundingClientRect()

  const playerPos = {
    x: players[socket.id].x,
    y: players[socket.id].y
  }

  const angle = Math.atan2(
    event.clientY - top - playerPos.y,
    event.clientX - left - playerPos.x
  )

  // const velocity = {
  //   x: Math.cos(angle) * 5,
  //   y: Math.sin(angle) * 5
  // }

  socket.emit('shoot', { x: playerPos.x, y: playerPos.y, angle })
  // projectiles.push(
  //   new Projectile({ x: playerPos.x,
  //     y: playerPos.y,
  //     radius: 5,
  //     color: 'white',
  //     velocity: velocity
  //   })
  // )
})
