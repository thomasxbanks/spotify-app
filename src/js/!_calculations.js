// declare variables
let browserWidth, browserHeight, screenWidth, screenHeight, distance, target, device_type, device_name

// What are the screen dimensions?
let screenSize = () => {
    screenWidth = screen.width
    screenHeight = screen.height
    // log for debug
    console.info(screenWidth, screenHeight)
}


// What are the browser dimensions?
let browser = {
  width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
  height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
}
