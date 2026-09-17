const { contextBridge, ipcRenderer } = require('electron');

// Exponemos una operación concreta, no acceso general a Electron ni a Node.
contextBridge.exposeInMainWorld('stockizi', {
  confirmLeave: reason => ipcRenderer.sendSync('window:confirm-leave', reason),
  listProducts: afterId => ipcRenderer.invoke('products:list', afterId),
  saveProduct: (id, changes) => ipcRenderer.invoke('products:save', id, changes),
  createProduct: values => ipcRenderer.invoke('products:create', values),
  listCategories: () => ipcRenderer.invoke('categories:list'),
  saveCategory: (kind, id, input) => ipcRenderer.invoke('categories:save', kind, id, input),
  listCodes: productId => ipcRenderer.invoke('codes:request', 'list', productId),
  addCode: (productId, code) => ipcRenderer.invoke('codes:request', 'add', productId, code),
  removeCode: (productId, id) => ipcRenderer.invoke('codes:request', 'remove', productId, id),
  findByCode: code => ipcRenderer.invoke('codes:request', 'find', null, code),
});
