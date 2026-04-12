
fetch("https://tracker--originalitycode63.repl.co/track.php", {
  method: "post"
})

import {levelData, genLevelData} from "./levels.js"
import "./menu.js"

let gamearea = document.getElementById("game")
let gameTitle = document.getElementById("game-title")
let canvas = document.getElementById("canvas")
canvas.width = canvas.height = 1000
let ctx = canvas.getContext("2d")


function fade(e, start, end, step, callback = () => {}) {
  return new Promise((res) => {
    e.style.filter = `opacity(${start}%)`
    let opacity = start
    let interval = setInterval(() => {
      if ((start < end && opacity > end) || (start > end && opacity < end)) {
        clearInterval(interval)
        callback()
        res()
        return
      }
      e.style.filter = `opacity(${opacity}%)`
      opacity += step
    })
  })
}
let animating = false
for (let btn of document.querySelectorAll(".menu-btn, .menu-back")) {
  btn.addEventListener("click", async () => {
    if (animating) {
      return
    }
    let parent = btn.parentNode
    animating = true
    await fade(parent, 100, 0, -1, () => {
      parent.classList.add("hidden")
    })
    let redirect = btn.dataset.redirect
    if (redirect) { // is redirecting or action
      let menu = document.getElementById(redirect)
      if (!menu) {
        console.warn(`Redirect "${redirect}" does not exist. Redirect:`, redirect, "Button:", btn)
      }
      menu.classList.remove("hidden") // show
      await fade(menu, 0, 100, 1)
      animating = false
      btn.style.filter = ""
      return
    }
    
    let action = btn.dataset.action
    if (action == "play" || action == "playgen") {
      startLevels(action == "play" ? levelData : genLevelData, 0, () => {
        btn.parentNode.classList.remove("hidden")
      })
    } else {
      console.warn(`Action "${action}" does not exist. Button:`, btn)
    }
    btn.style.filter = ""
  })
}




function startLevels(levelData, level = 0, callback = () => {}) {
  gamearea.classList.remove("hidden") // show board

  // init
  let loaded = false
  let map = []
  let data = {}
  let levelMap
  let player = {x: 0, y: 0}
  let playeranimation = {xTarget: 0, yTarget: 0, xVel: 0, yVel: 0, animating: false}
  let arrowkey
  
  let moves = 0
  if (localStorage.getItem("highscores") == null) {
    localStorage.setItem("highscores", "{}")
  }
  let highscores = JSON.parse(localStorage.getItem("highscores"))

  
  function load() { 
    moves = 0
    highscores = JSON.parse(localStorage.getItem("highscores"))
    if (highscores[level] == null) {
      gameTitle.innerText = "Moves: 0"
    } else {
      gameTitle.innerText = `Moves: 0 || Best: ${highscores[level]}`
    }
    
    if (level > levelData.length) {
      removeEventListener("keydown", keydown)
      removeEventListener("keyup", keyup)
      gamearea.classList.add("hidden")
      callback()
      return
    }
    levelMap = levelData[level][0]
    map = JSON.parse(JSON.stringify(levelMap))
    data = JSON.parse(JSON.stringify(levelData[level][1]))
    player = data.player
    loaded = true
    arrowkey = undefined
    render()
    updateplayerpos()
    playeranimation = {xTarget: 0, yTarget: 0, xVel: 0, yVel: 0, animating: false}
  }
  
  
  function updateplayerpos() {
    let blocksize = canvas.width / map.length
    let sizeoffset = blocksize * 0.3
    ctx.fillStyle = "#CCC"
    ctx.fillRect((blocksize * player.x) + (sizeoffset / 2), (blocksize * player.y) + (sizeoffset / 2), blocksize - sizeoffset, blocksize - sizeoffset)
  }
  
  
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let blocksize = canvas.width / map.length
    for (let i = 0; i < levelMap.length; i++) {
      for (let j = 0; j < levelMap[i].length; j++) {
        let block = map[j][i]
        if (block == 0) {
          ctx.fillStyle = "#666"
        } else if (block == 1) {
          ctx.fillStyle = "#c00"
        } else if (block == 2) {
          continue
        } else if (block == 3) {
          ctx.fillStyle = "#0c0"
        } else if (block == 4) {
          ctx.fillStyle = "#9c0"
        } else if (block == 5) {
          ctx.fillStyle = "#c0c000"
        } else if (block == 6) {
          ctx.fillStyle = "#008"
        } else if (block == 7) {
          ctx.fillStyle = "#22c"
        } else if (block == 8) {
          ctx.fillStyle = "#60c"
        } else if (block == 9) {
          ctx.fillStyle = ""
        } else {
          continue
        }
        let sizeoffset = blocksize * 0.05
        ctx.fillRect((blocksize * i) + (sizeoffset / 2), (blocksize * j) + (sizeoffset / 2), blocksize - sizeoffset, blocksize - sizeoffset)
      }
    }
  }
  
  
  function pre_blocklogic() {
    let roundx = Math.round(player.x)
    let roundy = Math.round(player.y)
    try {
      let block = map[roundy][roundx]  
      if ([3,4,5,7,8].includes(block)) {
        block -= 1
      } else if (block == 6) {
        block = 0
      }
      map[roundy][roundx] = block
    } catch(e) {
      
    }
  }
  
  
  function post_blocklogic() {
    if (player.x < 0 || player.y < 0 || player.x > levelMap.length - 1|| player.y > levelMap.length - 1) {
      load(levelMap, levelData[level][1])
      return
    }
    let roundx = Math.round(player.x)
    let roundy = Math.round(player.y)
    let block = map[roundy][roundx] 
    if ([1,2].includes(block)) {
      load(levelMap, levelData[level][1])
      return
    }
    map[roundy][roundx] = block
    for (let i of map) {
      for (let j of i) {
        if (j >= 3 && j <= 8) {
          return
        }
      }
    }
    if (highscores[level] == null || moves < highscores[level]) {
      highscores[level] = moves
      localStorage.setItem("highscores", JSON.stringify(highscores))
    }
    level++
    load()
  }
  
  
  setInterval(() => {
    if (!loaded || playeranimation.animating) {
      return
    }
    playeranimation = {xTarget: 0, yTarget: 0, xVel: 0, yVel: 0, animating: false}
    switch (arrowkey) {
      case "Up":
        playeranimation.yVel = -1
        break
      case "Down":
        playeranimation.yVel = 1
        break
      case "Left":
        playeranimation.xVel = -1
        break
      case "Right":
        playeranimation.xVel = 1
        break
      default:
        return
    }
    // Update moves
    moves++
    if (highscores[level] == null) {
      gameTitle.innerText = `Moves: ${moves}`
    } else {
      gameTitle.innerText = `Moves: ${moves} || Best: ${highscores[level]}`
    }

    // Move
    playeranimation.xTarget -= playeranimation.xVel
    playeranimation.yTarget -= playeranimation.yVel
    playeranimation.animating = true

    // Update current block
    pre_blocklogic()

    // Animation
    let speed = 0.02
    let i = 0
    let interval = setInterval(() => {
      if (i >= 1 / speed) {
        playeranimation.animating = false
        player.x = Math.round(player.x)
        player.y = Math.round(player.y)
        clearInterval(interval)
        render()
        updateplayerpos()
        post_blocklogic() // won/lost/keep playing?
        return
      }
      render() // clear screen
      updateplayerpos()
      player.x += playeranimation.xVel * speed
      player.y += playeranimation.yVel * speed
      i++
    })
  })

  function keydown(e) {
    arrowkey = e.key.replaceAll("Arrow", "")
    if (e.key == "n") {
      level++
      load()
    }
    if (e.key == "b") {
      level--
      load()
    }
  }

  addEventListener("keydown", keydown)
  
  function keyup() {
    arrowkey = undefined
  }
  
  addEventListener("keyup", keyup)
  
  
  load()
}
