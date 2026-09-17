const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { confirmLeave } = require('../exit-dialog');

function setup(reply) {
  let listener;
  const reasons = [];
  const window = { addEventListener: (name, fn) => { assert.equal(name, 'beforeunload'); listener = fn; },
    stockizi: { confirmLeave: reason => { reasons.push(reason); return reply; } } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../exit-guard'), 'utf8'), { window });
  return { window, reasons, attempt() {
    const event = { prevented: false, preventDefault() { this.prevented = true; } };
    listener(event); return event;
  } };
}
test('sin borrador no pregunta; cancelar conserva y descartar permite una salida', () => {
  const a = setup(false); let dirty = false;
  a.window.stockiziExit.register(() => ({ dirty }));
  assert.equal(a.attempt().prevented, false); assert.equal(a.reasons.length, 0);
  dirty = true;
  assert.equal(a.attempt().returnValue, false); assert.deepEqual(a.reasons, ['dirty']);
  const b = setup(true); b.window.stockiziExit.register(() => ({ dirty: true }));
  assert.equal(b.attempt().prevented, false);
});
test('operación en curso prevalece sobre descartar; fallo del puente bloquea', () => {
  const a = setup(true); let busy = true;
  a.window.stockiziExit.register(() => ({ dirty: true, busy }));
  assert.equal(a.attempt().prevented, true); assert.deepEqual(a.reasons, ['busy']);
  busy = false; assert.equal(a.attempt().prevented, false);
  a.window.stockizi.confirmLeave = () => { throw Error('fallo'); };
  assert.equal(a.attempt().prevented, true);
});
test('registra varios formularios y vuelve a consultar tras cancelar', () => {
  const a = setup(false); let dirty = true;
  a.window.stockiziExit.register(() => ({ dirty: false }));
  a.window.stockiziExit.register(() => ({ dirty }));
  assert.equal(a.attempt().prevented, true);
  dirty = false; assert.equal(a.attempt().prevented, false);
});
test('diálogo seguro por defecto, Escape conserva; ocupado no ofrece descartar', () => {
  const calls = []; let answer = 0;
  const dialog = { showMessageBoxSync: (owner, options) => { calls.push(options); return answer; } };
  assert.equal(confirmLeave(dialog, {}, 'dirty'), false);
  assert.equal(calls[0].defaultId, 0); assert.equal(calls[0].cancelId, 0);
  answer = 1; assert.equal(confirmLeave(dialog, {}, 'dirty'), true);
  assert.equal(confirmLeave(dialog, {}, 'busy'), false);
  assert.deepEqual(calls.at(-1).buttons, ['Esperar']);
  assert.equal(confirmLeave(dialog, {}, 'unknown'), false); assert.equal(calls.length, 3);
});
