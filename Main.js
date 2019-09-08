const path = require('path')
const electron = require('electron')
const {app, BrowserWindow} = electron
const isDev = require('electron-is-dev');
const dialog = electron.dialog

let win;

function createWindow () {   
  // Create the browser window.     
	win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      webSecurity: false,
      nodeIntegration:true
    }
  }) 
				
  win.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`) 
}      

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
})
