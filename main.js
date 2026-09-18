const { app, BrowserWindow, ipcMain, dialog } = require('electron/main');
const { confirmLeave } = require('./exit-dialog');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { fetchProductsPage, saveProduct, createProduct, categoryRequest, codeRequest } = require('./api-client');
const indexPath = path.join(__dirname, 'index.html');
const indexUrl = pathToFileURL(indexPath).href;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== indexUrl) event.preventDefault();
  });
  mainWindow.loadFile(indexPath);
}

app.whenReady().then(() => {
  // beforeunload no puede esperar una Promise. Solo este aviso usa IPC síncrono.
  ipcMain.on('window:confirm-leave', (event, reason) => {
    const owner = BrowserWindow.fromWebContents(event.sender);
    if (!owner || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== indexUrl) {
      event.returnValue = false;
      return;
    }
    try { event.returnValue = confirmLeave(dialog, owner, reason); }
    catch { event.returnValue = false; }
  });
  ipcMain.handle('codes:request', (event, operation, productId, value) => {
    if (!BrowserWindow.fromWebContents(event.sender) || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== indexUrl) {
      return { ok: false, error: 'Operación no autorizada.' };
    }
    return codeRequest(operation, productId, value, { port: Number(process.env.API_PORT || 3000) });
  });
  ipcMain.handle('categories:list', event => {
    if (!BrowserWindow.fromWebContents(event.sender) || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== indexUrl) {
      return { ok: false, error: 'Consulta no autorizada.' };
    }
    return categoryRequest('categories', null, undefined, { port: Number(process.env.API_PORT || 3000) });
  });
  ipcMain.handle('categories:save', (event, kind, id, input) => {
    if (!BrowserWindow.fromWebContents(event.sender) || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== indexUrl) {
      return { ok: false, error: 'Guardado no autorizado.' };
    }
    return categoryRequest(kind, id, input, { port: Number(process.env.API_PORT || 3000) });
  });
  ipcMain.handle('products:create', (event, values) => {
    const trustedWindow = BrowserWindow.fromWebContents(event.sender);
    if (!trustedWindow || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== indexUrl) {
      return { ok: false, error: 'Alta no autorizada.' };
    }
    return createProduct(values, { port: Number(process.env.API_PORT || 3000) });
  });
  ipcMain.handle('products:save', (event, id, changes) => {
    const trustedWindow = BrowserWindow.fromWebContents(event.sender);
    if (!trustedWindow || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== indexUrl) {
      return { ok: false, error: 'Guardado no autorizado.' };
    }
    return saveProduct(id, changes, { port: Number(process.env.API_PORT || 3000) });
  });
  ipcMain.handle('products:list', (event, afterId, filters) => {
    const trustedWindow = BrowserWindow.fromWebContents(event.sender);
    if (!trustedWindow || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== indexUrl) {
      return { ok: false, error: 'Consulta no autorizada.' };
    }
    // No leemos .env ni entregamos credenciales a Electron. El puerto no es secreto.
    return fetchProductsPage(afterId, { port: Number(process.env.API_PORT || 3000), filters });
  });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
