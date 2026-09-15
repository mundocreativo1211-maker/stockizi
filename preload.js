const { contextBridge, ipcRenderer } = require('electron');

// Exponemos una operación concreta, no acceso general a Electron ni a Node.
contextBridge.exposeInMainWorld('stockizi', {
  listProducts: afterId => ipcRenderer.invoke('products:list', afterId),
  saveProduct: (id, changes) => ipcRenderer.invoke('products:save', id, changes),
});
