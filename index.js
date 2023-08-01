/* global Blob $fx */
// Set a bunch of page sizes
const pageSizes = {
  A6: {
    width: 105,
    height: 148
  },
  A5: {
    width: 148,
    height: 210
  },
  A4: {
    width: 210,
    height: 297
  },
  A3: {
    width: 297,
    height: 420
  },
  A2: {
    width: 420,
    height: 594
  },
  A1: {
    width: 594,
    height: 841
  }
}

const cardSizes = {
  'Business Card UK (85x55mm)': {
    width: 85,
    height: 55
  },
  'Business Card US (89x51mm)': {
    width: 89,
    height: 51
  },
  'Business Card EU (85x54mm)': {
    width: 85,
    height: 54
  },
  'Postcard 6"x4"': {
    width: 152,
    height: 102
  },
  'Postcard A6': {
    width: 148,
    height: 105
  }
}

$fx.params([
  {
    id: 'papersize',
    name: 'Paper Size',
    type: 'select',
    default: 'A3',
    options: {
      options: ['A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'Custom']
    }
  },
  {
    id: 'cardType',
    name: 'Card Type',
    type: 'select',
    default: 'Business Card UK (85x55mm)',
    options: {
      options: ['Business Card UK (85x55mm)', 'Business Card US (89x51mm)', 'Business Card EU (85x54mm)', 'Postcard 6"x4"', 'Postcard A6', 'Custom']
    }
  },
  {
    id: 'angle',
    name: 'Rotation',
    type: 'number',
    default: 0,
    options: {
      min: -90,
      max: 90,
      step: 1
    }
  },
  {
    id: 'xOffset',
    name: 'X Offset',
    type: 'number',
    default: 0,
    options: {
      min: -100,
      max: 100,
      step: 1
    }
  },
  {
    id: 'yOffset',
    name: 'Y Offset',
    type: 'number',
    default: 0,
    options: {
      min: -100,
      max: 100,
      step: 1
    }
  },
  {
    id: 'customPaperWidth',
    name: 'Paper Width',
    type: 'number',
    default: 210,
    options: {
      min: 1,
      max: 1200,
      step: 1
    }
  },
  {
    id: 'customPaperHeight',
    name: 'Paper Height',
    type: 'number',
    default: 297,
    options: {
      min: 1,
      max: 1200,
      step: 1
    }
  },
  {
    id: 'customCardWidth',
    name: 'Card Width',
    type: 'number',
    default: 148,
    options: {
      min: 1,
      max: 1200,
      step: 1
    }
  },
  {
    id: 'customCardHeight',
    name: 'Card Height',
    type: 'number',
    default: 105,
    options: {
      min: 1,
      max: 1200,
      step: 1
    }
  }
])

let cardHolderMap = []
let cardHolderDict = {}
let ticks = []
let drawLines = []

const getPaperSize = () => {
  // Grab the current paper size
  const paperSize = {
    width: null,
    height: null
  }
  const thisPaper = $fx.getParam('papersize')
  // If the paper size is custom, we need to grab the values from the custom fields
  if (thisPaper === 'Custom') {
    paperSize.width = $fx.getParam('customPaperWidth')
    paperSize.height = $fx.getParam('customPaperHeight')
  } else {
    paperSize.width = pageSizes[thisPaper].width
    paperSize.height = pageSizes[thisPaper].height
  }
  return paperSize
}
// This function works out where we're going to place the canvas on the page
const layoutCanvas = async () => {
  // Grab the current paper size
  const paperSize = getPaperSize()

  // Grab the inner width and height of the page
  const pageWidth = window.innerWidth
  const pageHeight = window.innerHeight

  // We want the target canvas to be 90% of the page height
  let targetHeight = Math.floor(pageHeight * 0.9)
  // We want the target width to be the same ratio as the paper size
  let targetWidth = Math.floor((paperSize.width / paperSize.height) * targetHeight)
  // If the target width is greater than 90% page width, then we'll need to do it the other way around
  if (targetWidth > Math.floor(pageWidth * 0.9)) {
    targetWidth = Math.floor(pageWidth * 0.9)
    targetHeight = Math.floor((paperSize.height / paperSize.width) * targetWidth)
  }
  // Now we know the target width and height, we can work out the top and left positions to
  // center the canvas on the page
  const top = Math.floor((pageHeight - targetHeight) / 2)
  const left = Math.floor((pageWidth - targetWidth) / 2)
  // Delete any existing canvas, without using jQuery, remmeber there could be more than one
  const canvases = document.querySelectorAll('canvas')
  for (let i = 0; i < canvases.length; i++) {
    canvases[i].parentNode.removeChild(canvases[i])
  }
  // Now create a new canvas with the id of 'canvas' and the correct width and height adjusted for pixel density
  // and the correct top, left, width and height css values
  const canvas = document.createElement('canvas')
  canvas.id = 'target'
  canvas.width = targetWidth * window.devicePixelRatio
  canvas.height = targetHeight * window.devicePixelRatio
  canvas.style.position = 'absolute'
  canvas.style.top = `${top}px`
  canvas.style.left = `${left}px`
  canvas.style.width = `${targetWidth}px`
  canvas.style.height = `${targetHeight}px`
  // Add the canvas to the body
  document.body.appendChild(canvas)
  // Now fill the canvas with a red background
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'red'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  draw()
}

const placeCard = async (card, xOffset, yOffset, x, y, angle) => {
  // Grab the current paper size
  const paperSize = getPaperSize()

  // To start with we are going to place the card in the middle of the page, so get the middle of the page
  const pageMiddle = {
    x: paperSize.width / 2,
    y: paperSize.height / 2
  }
  // Blonk the card down in the middle of the page
  const cardCorners = {
    tl: {
      x: (pageMiddle.x - (card.width / 2)) + xOffset + (x * card.width),
      y: (pageMiddle.y - (card.height / 2)) + yOffset + (y * card.height)
    },
    tr: {
      x: (pageMiddle.x + (card.width / 2)) + xOffset + (x * card.width),
      y: (pageMiddle.y - (card.height / 2)) + yOffset + (y * card.height)
    },
    bl: {
      x: (pageMiddle.x - (card.width / 2)) + xOffset + (x * card.width),
      y: (pageMiddle.y + (card.height / 2)) + yOffset + (y * card.height)
    },
    br: {
      x: (pageMiddle.x + (card.width / 2)) + xOffset + (x * card.width),
      y: (pageMiddle.y + (card.height / 2)) + yOffset + (y * card.height)
    }
  }
  // Now we need to rotate the card
  // First we need to translate the card up and left by half the page width and height
  const translateX = -paperSize.width / 2
  const translateY = -paperSize.height / 2
  const corners = ['tl', 'tr', 'bl', 'br']
  for (let i = 0; i < corners.length; i++) {
    const corner = corners[i]
    cardCorners[corner].x += translateX
    cardCorners[corner].y += translateY
  }
  // Now we need to rotate each corner by the angle, remembering to convert the angle to radians
  const angleRadians = angle * (Math.PI / 180)
  for (let i = 0; i < corners.length; i++) {
    const corner = corners[i]
    const x = cardCorners[corner].x
    const y = cardCorners[corner].y
    cardCorners[corner].x = (x * Math.cos(angleRadians)) - (y * Math.sin(angleRadians))
    cardCorners[corner].y = (y * Math.cos(angleRadians)) + (x * Math.sin(angleRadians))
  }
  // Now we need to translate the card back to the middle of the page
  for (let i = 0; i < corners.length; i++) {
    const corner = corners[i]
    cardCorners[corner].x -= translateX
    cardCorners[corner].y -= translateY
  }
  // Finally figure out if the card is "valid" i.e. it's corners are within the page
  let valid = true
  for (let i = 0; i < corners.length; i++) {
    const corner = corners[i]
    if (cardCorners[corner].x < 0 || cardCorners[corner].x > paperSize.width || cardCorners[corner].y < 0 || cardCorners[corner].y > paperSize.height) {
      valid = false
    }
  }
  return {
    corners: cardCorners,
    x,
    y,
    valid
  }
}

const drawCard = (card) => {
  // Grab the canvas
  const canvas = document.getElementById('target')
  const w = canvas.width
  const h = canvas.height
  // Grab the context
  const ctx = canvas.getContext('2d')

  // Grab the current paper size
  const paperSize = getPaperSize()

  ctx.strokeStyle = '#999999'
  ctx.lineWidth = w / 800
  ctx.beginPath()
  ctx.moveTo(card.corners.tl.x / paperSize.width * w, card.corners.tl.y / paperSize.height * h)
  ctx.lineTo(card.corners.tr.x / paperSize.width * w, card.corners.tr.y / paperSize.height * h)
  ctx.lineTo(card.corners.br.x / paperSize.width * w, card.corners.br.y / paperSize.height * h)
  ctx.lineTo(card.corners.bl.x / paperSize.width * w, card.corners.bl.y / paperSize.height * h)
  ctx.lineTo(card.corners.tl.x / paperSize.width * w, card.corners.tl.y / paperSize.height * h)
  ctx.stroke()
}

const saveCard = (card) => {
  const index = `${card.x},${card.y}`
  cardHolderMap.push(index)
  cardHolderDict[index] = card
}

const draw = async () => {
  // Grab the canvas
  const canvas = document.getElementById('target')
  // Grab the context
  const ctx = canvas.getContext('2d')
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // Set the fill style to white
  ctx.fillStyle = 'white'
  // Draw a rectangle
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Grab the current paper size
  const paperSize = {
    width: null,
    height: null
  }
  const thisPaper = $fx.getParam('papersize')
  // If the paper size is custom, we need to grab the values from the custom fields
  if (thisPaper === 'Custom') {
    paperSize.width = $fx.getParam('customwidth')
    paperSize.height = $fx.getParam('customheight')
  } else {
    paperSize.width = pageSizes[thisPaper].width
    paperSize.height = pageSizes[thisPaper].height
  }

  // Grab the card type
  const cardType = $fx.getParam('cardType')
  const cardSize = {
    width: null,
    height: null
  }
  if (cardType === 'Custom') {
    cardSize.width = $fx.getParam('customCardWidth')
    cardSize.height = $fx.getParam('customCardHeight')
  } else {
    cardSize.width = cardSizes[cardType].width
    cardSize.height = cardSizes[cardType].height
  }

  // Extract the width and height from the card type
  const angle = $fx.getParam('angle')
  const xOffset = $fx.getParam('xOffset')
  const yOffset = $fx.getParam('yOffset')

  // Clear the map and the dict
  cardHolderMap = []
  cardHolderDict = {}

  // Now grab the middle card
  const middleCard = await placeCard(cardSize, xOffset, yOffset, 0, 0, angle)
  // If the middle card is valid, then draw it, converting the corners to the correct position on the canvas
  ctx.strokeStyle = 'black'
  ctx.lineWidth = ctx.width / 100
  if (middleCard.valid) {
    saveCard(middleCard)
  }

  // Now we want to move up the page and draw the next card, while the card is valid
  let upValid = true
  let up = 1
  while (upValid) {
    const upCard = await placeCard(cardSize, xOffset, yOffset, 0, -up, angle)
    // Try drawing all the way to the left
    let leftValid = true
    let left = 1
    while (leftValid) {
      const leftCard = await placeCard(cardSize, xOffset, yOffset, -left, -up, angle)
      if (leftCard.valid) {
        saveCard(leftCard)
        left++
      } else {
        leftValid = false
      }
    }
    // Trying drawing all the way to the right
    let rightValid = true
    let right = 1
    while (rightValid) {
      const rightCard = await placeCard(cardSize, xOffset, yOffset, right, -up, angle)
      if (rightCard.valid) {
        saveCard(rightCard)
        right++
      } else {
        rightValid = false
      }
    }
    // Now do the next card up
    if (upCard.valid) {
      saveCard(upCard)
      up++
    } else {
      upValid = false
    }
  }

  // Next we want to move down the page and draw the next card, while the card is valid
  let downValid = true
  let down = 1
  while (downValid) {
    const downCard = await placeCard(cardSize, xOffset, yOffset, 0, down, angle)
    // Try drawing all the way to the left
    let leftValid = true
    let left = 1
    while (leftValid) {
      const leftCard = await placeCard(cardSize, xOffset, yOffset, -left, down, angle)
      if (leftCard.valid) {
        saveCard(leftCard)
        left++
      } else {
        leftValid = false
      }
    }
    // Trying drawing all the way to the right
    let rightValid = true
    let right = 1
    while (rightValid) {
      const rightCard = await placeCard(cardSize, xOffset, yOffset, right, down, angle)
      if (rightCard.valid) {
        saveCard(rightCard)
        right++
      } else {
        rightValid = false
      }
    }
    // Now do the next card down
    if (downCard.valid) {
      saveCard(downCard)
      down++
    } else {
      downValid = false
    }
  }

  // Finally we want to move left and right across the page from the middle one, starting with left
  let leftValid = true
  let left = 1
  while (leftValid) {
    const leftCard = await placeCard(cardSize, xOffset, yOffset, -left, 0, angle)
    if (leftCard.valid) {
      saveCard(leftCard)
      left++
    } else {
      leftValid = false
    }
  }
  // Now do the right
  let rightValid = true
  let right = 1
  while (rightValid) {
    const rightCard = await placeCard(cardSize, xOffset, yOffset, right, 0, angle)
    if (rightCard.valid) {
      saveCard(rightCard)
      right++
    } else {
      rightValid = false
    }
  }

  // Now that we've done all the card, I want to loop through all of them and draw them, but I also want
  // to do it in a sensible order, so I want to find the lowest and highest x and y values
  let lowestX = 9999999
  let lowestY = 9999999
  let highestX = -999999
  let highestY = -999999
  // Loop through all the cards in the map
  for (let i = 0; i < cardHolderMap.length; i++) {
    const index = cardHolderMap[i]
    if (cardHolderDict[index]) {
      const card = cardHolderDict[index]
      if (card.x < lowestX) {
        lowestX = card.x
      }
      if (card.y < lowestY) {
        lowestY = card.y
      }
      if (card.x > highestX) {
        highestX = card.x
      }
      if (card.y > highestY) {
        highestY = card.y
      }
    }
  }
  // Empty the ticks so we can sort them here
  ticks = []
  // Loop from the lowest x to the highest x
  for (let x = lowestX; x <= highestX; x++) {
    // Loop from the lowest y to the highest y
    for (let y = lowestY; y <= highestY; y++) {
      // Grab the card at this position
      const index = `${x},${y}`
      if (cardHolderDict[index]) {
        const card = cardHolderDict[index]
        // Draw a circle at the top left corner
        ticks.push({ x: card.corners.tl.x, y: card.corners.tl.y })
        // If there ISN'T a card to the right, draw the top right corner
        if (!cardHolderDict[`${x + 1},${y}`]) {
          ticks.push({ x: card.corners.tr.x, y: card.corners.tr.y })
        }
        // If there ISN'T a card to the below then draw the bottom left corner
        if (!cardHolderDict[`${x},${y + 1}`]) {
          ticks.push({ x: card.corners.bl.x, y: card.corners.bl.y })
        }
        // If there ISN'T a card to the right and below then draw the bottom right corner
        if (!cardHolderDict[`${x + 1},${y + 1}`]) {
          ticks.push({ x: card.corners.br.x, y: card.corners.br.y })
        }
        drawCard(cardHolderDict[index])
      }
    }
  }
  // Now we want to draw the ticks
  // Loop through all the ticks
  drawLines = []
  for (let i = 0; i < ticks.length; i++) {
    const thisTick = ticks[i]
    // Ticks are made up of two lines, horizontal and a vertical ones each 5mm long
    const convertedToPxLength = 5
    const firstLine = {
      p1: {
        x: -convertedToPxLength / 2,
        y: 0
      },
      p2: {
        x: convertedToPxLength / 2,
        y: 0
      }
    }
    const secondLine = {
      p1: {
        x: 0,
        y: -convertedToPxLength / 2
      },
      p2: {
        x: 0,
        y: convertedToPxLength / 2
      }
    }
    // Now we need to rotate the lines by the angle, remembering to convert the angle to radians
    const angleRadians = angle * (Math.PI / 180)
    const corners = ['p1', 'p2']
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i]
      let x = firstLine[corner].x
      let y = firstLine[corner].y
      firstLine[corner].x = (x * Math.cos(angleRadians)) - (y * Math.sin(angleRadians))
      firstLine[corner].y = (y * Math.cos(angleRadians)) + (x * Math.sin(angleRadians))
      x = secondLine[corner].x
      y = secondLine[corner].y
      secondLine[corner].x = (x * Math.cos(angleRadians)) - (y * Math.sin(angleRadians))
      secondLine[corner].y = (y * Math.cos(angleRadians)) + (x * Math.sin(angleRadians))
    }
    // Now we need to translate the lines to the correct position
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i]
      firstLine[corner].x += thisTick.x
      firstLine[corner].y += thisTick.y
      secondLine[corner].x += thisTick.x
      secondLine[corner].y += thisTick.y
    }
    // Now we can draw the lines
    drawLines.push([[firstLine.p1.x, firstLine.p1.y], [firstLine.p2.x, firstLine.p2.y]])
    drawLines.push([[secondLine.p1.x, secondLine.p1.y], [secondLine.p2.x, secondLine.p2.y]])
  }

  ctx.strokeStyle = 'red'
  ctx.lineWidth = canvas.width / 400
  // Now loop through the drawLines and draw them
  for (let i = 0; i < drawLines.length; i++) {
    const line = drawLines[i]
    ctx.beginPath()
    ctx.moveTo(line[0][0] / paperSize.width * canvas.width, line[0][1] / paperSize.height * canvas.height)
    ctx.lineTo(line[1][0] / paperSize.width * canvas.width, line[1][1] / paperSize.height * canvas.height)
    ctx.stroke()
  }
}

const saveSVG = () => {
  const paperSize = getPaperSize()
  let output = `<?xml version="1.0" standalone="no" ?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
      "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
      <svg version="1.1" id="square-example" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
      x="0" y="0"
      viewBox="0 0 ${paperSize.width} ${paperSize.height}"
      width="${paperSize.width}mm"
      height="${paperSize.height}mm" 
      xml:space="preserve">
    <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" >
`
  // Now loop through the drawLines and draw them
  for (let i = 0; i < drawLines.length; i++) {
    const line = drawLines[i]
    output += '<path style="fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="'
    output += `M ${line[0][0]} ${line[0][1]} `
    output += `L ${line[1][0]} ${line[1][1]} `
    output += `" />
    `
  }
  output += ` </g>
  </svg>`
  // Now download the file
  const element = document.createElement('a')
  element.setAttribute('download', 'ticks.svg')
  element.style.display = 'none'
  document.body.appendChild(element)
  //  Blob code via gec @3Dgec https://twitter.com/3Dgec/status/1226018489862967297
  element.setAttribute('href', window.URL.createObjectURL(new Blob([output], {
    type: 'text/plain;charset=utf-8'
  })))

  element.click()
  document.body.removeChild(element)
}

// eslint-disable-next-line no-unused-vars
const init = async () => {
  // When the page loads, we need to layout the canvas
  layoutCanvas()
  // Also set a listener for when the window is resized, but only fire it after 100ms
  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(layoutCanvas, 100)
  })

  // Add a click event to the button
  document.getElementById('saveSVG').addEventListener('click', saveSVG)
}
