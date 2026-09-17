// Cada formulario aporta su estado actual; no duplicamos sus borradores.
(() => {
  const readers = [];
  window.stockiziExit = { register: reader => readers.push(reader) };
  window.addEventListener('beforeunload', event => {
    try {
      const states = readers.map(read => read());
      const reason = states.some(state => state.busy) ? 'busy'
        : states.some(state => state.dirty) ? 'dirty' : null;
      if (!reason) return;
      const allowed = window.stockizi?.confirmLeave?.(reason) === true;
      if (reason !== 'busy' && allowed) return;
    } catch { /* Ante un fallo de consulta del estado, conservar la ventana. */ }
    event.preventDefault();
    // Electron exige un valor explícito para impedir cierre/recarga.
    event.returnValue = false;
  });
})();
