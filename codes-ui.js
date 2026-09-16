(() => {
  const $ = id => document.getElementById(id);
  const dialog = $('codes-dialog');
  let productId = null, busy = false, ready = false, rows = [], actions;

  function controls() {
    $('new-code').disabled = busy || !ready;
    $('add-code').disabled = busy || !ready;
    $('reload-codes').disabled = busy;
    $('close-codes').disabled = busy;
    for (const button of $('codes-list').querySelectorAll('button')) button.disabled = busy || !ready;
  }

  function paint() {
    $('codes-list').replaceChildren();
    for (const item of rows) {
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = item.code;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `Quitar ${item.code}`;
      let confirmed = false;
      button.addEventListener('click', async () => {
        if (busy || !ready) return;
        if (!confirmed) { confirmed = true; button.textContent = `Confirmar quitar ${item.code}`; return; }
        await perform(() => window.stockizi.removeCode(productId, item.id), () => {
          rows = rows.filter(code => code.id !== item.id);
          paint();
          $('codes-status').textContent = 'Código quitado. El producto y su stock se conservan.';
        });
      });
      row.append(label, button);
      $('codes-list').append(row);
    }
  }

  async function perform(request, accept) {
    busy = true;
    controls();
    $('codes-status').textContent = 'Consultando…';
    try {
      const result = await request();
      if (!result.ok) throw new Error(result.error);
      accept(result);
    } catch (error) {
      // Tras respuesta perdida, no seguir escribiendo sobre una lista dudosa.
      ready = false;
      $('codes-status').textContent = (error.message || 'Operación no confirmada.') + ' Usá Volver a consultar.';
    } finally { busy = false; controls(); }
  }

  async function reload() {
    if (busy) return;
    ready = false;
    await perform(() => window.stockizi.listCodes(productId), result => {
      ready = true; rows = result.codes; paint();
      $('codes-status').textContent = rows.length ? `${rows.length} códigos activos.` : 'Este producto todavía no tiene códigos.';
    });
  }

  window.stockiziCodes = {
    setEnabled(selected, blocked) {
      $('manage-codes').disabled = !selected || blocked;
      $('find-code').disabled = blocked;
      $('code-search').disabled = blocked;
    },
    init(callbacks) {
      actions = callbacks;
      $('manage-codes').addEventListener('click', async () => {
        if (!actions.canLeave()) return;
        const product = actions.getProduct();
        if (!product) return;
        productId = product.id; rows = []; ready = false; paint();
        $('codes-title').textContent = `Códigos de ${product.name}`;
        $('new-code').value = '';
        dialog.showModal();
        await reload();
      });
      $('reload-codes').addEventListener('click', reload);
      $('close-codes').addEventListener('click', () => { if (!busy) dialog.close(); });
      dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
      $('code-form').addEventListener('submit', async event => {
        event.preventDefault();
        if (busy || !ready) return;
        await perform(() => window.stockizi.addCode(productId, $('new-code').value), result => {
          if (!rows.some(item => item.id === result.item.id)) rows.push(result.item);
          paint(); $('new-code').value = '';
          $('codes-status').textContent = 'Código guardado.';
        });
      });
      $('code-search-form').addEventListener('submit', async event => {
        event.preventDefault();
        if (!actions.canLeave()) return;
        actions.setBusy(true);
        $('code-search-status').textContent = 'Buscando en toda la base…';
        try {
          const result = await window.stockizi.findByCode($('code-search').value);
          if (!result.ok) throw new Error(result.error);
          if (result.product) {
            actions.found(result.product);
            $('code-search-status').textContent = `Encontrado: ${result.product.name}. Se limpiaron los filtros de nombre y rubro.`;
          } else $('code-search-status').textContent = 'No se encontró ese código. La selección anterior no cambió.';
        } catch (error) { $('code-search-status').textContent = error.message || 'No se pudo buscar el código.'; }
        finally { actions.setBusy(false); }
      });
    },
  };
})();
