// Mensajes fijos: el renderer no puede pedir diálogos arbitrarios ni elegir rutas.
function confirmLeave(dialog, owner, reason) {
  if (reason === 'busy') {
    dialog.showMessageBoxSync(owner, {
      type: 'info', title: 'Operación en curso',
      message: 'Esperá a que termine la operación antes de cerrar o recargar.',
      detail: 'Este intento se canceló. Revisá el resultado y volvé a intentar salir.',
      buttons: ['Esperar'], defaultId: 0, cancelId: 0, noLink: true,
    });
    return false;
  }
  if (reason !== 'dirty') return false;
  return dialog.showMessageBoxSync(owner, {
    type: 'warning', title: 'Cambios sin guardar',
    message: 'Tenés cambios sin guardar. ¿Querés seguir editando o descartarlos y salir?',
    detail: 'Salir continúa el cierre o la recarga que solicitaste. No guarda el borrador ni revierte operaciones ya guardadas.',
    buttons: ['Seguir editando', 'Descartar y salir'], defaultId: 0, cancelId: 0, noLink: true,
  }) === 1;
}
module.exports = { confirmLeave };
