/**
 * Backend locale per il D&D standalone.
 *
 * Intercetta le chiamate `/dnd*` che l'app (dnd.html / tavolo.html) faceva al
 * server dell'HUD e le serve da localStorage — così i file funzionano da soli,
 * senza alcun server. Mappa, tavolo, calendario, party e dado sono completi;
 * bestiario/loremaster dipendevano dalle note di Obsidian e qui sono limitati.
 *
 * La sincronizzazione DM ⇄ Tavolo avviene tramite localStorage (stessa origine):
 * apri i due file dallo stesso indirizzo — servito su https (es. GitHub Pages)
 * la condivisione è affidabile.
 */
(function () {
  const LS = window.localStorage
  const get = (k, def) => {
    try {
      const v = LS.getItem(k)
      return v ? JSON.parse(v) : def
    } catch {
      return def
    }
  }
  const set = (k, v) => {
    try {
      LS.setItem(k, JSON.stringify(v))
    } catch {
      /* private mode */
    }
  }
  const json = (obj, status) =>
    new Response(JSON.stringify(obj), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' },
    })

  const DEFAULTS = {
    cal: { year: 835, month: 0, day: 1, events: [], log: [] },
    table: {
      mode: 'idle',
      image: '',
      images: [],
      mapref: '',
      card: null,
      freeitems: [],
      caption: '',
      combat: { active: false, round: 0 },
      updated: 0,
    },
    party: { chars: [] },
    map: { fog: [], tokens: [], grid: { on: false, size: 0.05 }, updated: 0 },
  }

  const origFetch = window.fetch.bind(window)

  async function dndAsk(body) {
    const key = get('anthropic_key', '')
    if (!key) {
      return json({
        error:
          'Loremaster offline. Per attivarlo: apri la Console del browser (F12) ed esegui  localStorage.anthropic_key = "sk-ant-…"  con una tua API key Anthropic.',
      })
    }
    try {
      const r = await origFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1024,
          system:
            'Sei il Loremaster (co-DM) della campagna Idayaso. Rispondi in italiano, conciso e coerente col tono fantasy.',
          messages: [
            {
              role: 'user',
              content:
                (body.open_note ? `Nota aperta:\n${body.open_note}\n\n` : '') +
                (body.history ? `Storico:\n${body.history}\n\n` : '') +
                `Domanda: ${body.question || ''}`,
            },
          ],
        }),
      })
      const d = await r.json()
      if (!r.ok) return json({ error: (d.error && d.error.message) || 'Errore AI' })
      const text = (d.content || [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
      return json({ reply: text, model: 'claude-haiku-4-5' })
    } catch (e) {
      return json({ error: String(e) })
    }
  }

  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || ''
    if (url.indexOf('/dnd') !== 0 && url.indexOf('/tavolo') !== 0) return origFetch(input, init)

    const path = url.split('?')[0]
    const params = new URLSearchParams(url.split('?')[1] || '')
    const method = ((init && init.method) || 'GET').toUpperCase()
    let body = null
    if (init && init.body) {
      try {
        body = JSON.parse(init.body)
      } catch {
        body = null
      }
    }

    if (method === 'GET') {
      if (path.startsWith('/dndcal')) return json(get('dnd_cal', DEFAULTS.cal))
      if (path.startsWith('/dndtable')) return json(get('dnd_table', DEFAULTS.table))
      if (path.startsWith('/dndparty')) return json(get('dnd_party', DEFAULTS.party))
      if (path.startsWith('/dndmap')) {
        const ref = params.get('ref') || ''
        return json(get(`dnd_map_${ref}`, DEFAULTS.map))
      }
      if (path.startsWith('/dnddata')) return json(get('dnd_data', { bestiary: [], cards: [] }))
      if (path.startsWith('/dndcards')) return json({ cards: get('dnd_cards', []) })
      if (path.startsWith('/dndmonstercards')) return json({ cards: [] })
      if (path.startsWith('/dndtree')) return json([])
      if (path.startsWith('/dndgraph')) return json({ nodes: [], links: [] })
      if (path.startsWith('/dndresolve')) return json({ path: '' })
      if (path.startsWith('/dndread')) return json({ path: params.get('path') || '', content: '', title: '' })
      if (path.startsWith('/dndmedia')) return json([])
      return json({})
    }

    // POST
    if (path.startsWith('/dndcalsave')) {
      set('dnd_cal', body)
      return json({ ok: true, msg: 'ok' })
    }
    if (path.startsWith('/dndmapsave')) {
      const ref = (body && body.ref) || ''
      set(`dnd_map_${ref}`, { ...(body || {}), updated: Date.now() })
      return json({ ok: true, msg: 'ok' })
    }
    if (path.startsWith('/dndtablesave')) {
      const cur = get('dnd_table', DEFAULTS.table)
      set('dnd_table', { ...cur, ...(body || {}), updated: Date.now() })
      return json({ ok: true, msg: 'ok' })
    }
    if (path.startsWith('/dndpartysave')) {
      const cur = get('dnd_party', DEFAULTS.party)
      set('dnd_party', { ...cur, ...(body || {}) })
      return json({ ok: true, msg: 'ok' })
    }
    if (path.startsWith('/dndask')) return dndAsk(body || {})
    // Note-wiki / portraits: dipendevano da Obsidian; qui no-op.
    return json({ ok: true, msg: 'offline' })
  }
})()
