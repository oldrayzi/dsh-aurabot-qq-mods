// 人格成长 · 自定义面板
// 只做三件事：看当前档案、看变化历史、手动想一次 / 回到某一天。
// 人设本体（personas/*.md）不会被改，成长档案只追加在它后面。

const { useState } = React

function fmtTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function fieldLabel(field) {
  return ({ traits: '性格', likes: '喜欢', habits: '习惯', speech: '说话', focus: '最近在意' })[field] || field
}

function changeText(ch) {
  const f = fieldLabel(ch.field)
  if (ch.op === 'add') return `+ ${f}：${ch.after || ''}`
  if (ch.op === 'remove') return `− ${f}：${ch.before || ch.after || ''}`
  return `${f}：${ch.before || '（空）'} → ${ch.after || '（空）'}`
}

function triggerText(t) {
  if (t === 'manual') return '手动'
  if (t === 'rollback') return '回滚'
  return '每日'
}

return function Panel({ toast }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [open, setOpen] = useState('')

  const load = async () => {
    try {
      setData(await call('/status'))
      setError('')
    } catch (e) {
      setError(e.message || String(e))
    }
  }
  if (!data && !error) load()

  const runNow = async () => {
    setBusy('run')
    try {
      const r = await call('/run', {})
      toast(r.ok ? '想完了，档案已经更新' : '这次没想成：' + (r.message || '不知道为啥'))
      await load()
    } catch (e) {
      toast('没想成：' + (e.message || e))
    }
    setBusy('')
  }

  const rollback = async (entry) => {
    if (!confirm(`确定回到 ${entry.day} 那天的样子？\n这会覆盖当前档案，并记一条回滚历史；人格卡本身不会动。`)) return
    setBusy(entry.id)
    try {
      const r = await call('/rollback', { id: entry.id })
      toast(r.message || '已恢复')
      await load()
    } catch (e) {
      toast('恢复失败：' + (e.message || e))
    }
    setBusy('')
  }

  const profile = data && data.profile
  const overlay = data && data.overlay

  return h(ui.Card, { title: '人格成长' },
    h('p', { className: 'ab-note' },
      '每天中午她独处想一会儿，回看最近的聊天，然后让自己有一点点变化。变化只改「成长档案」，不改你写的人格卡；关掉「接进人设」就能冻结。'),

    error ? h('p', { className: 'ab-note', style: { color: '#c0392b' } }, '读取失败：' + error) : null,
    !data ? h('p', { className: 'ab-note' }, '读取中……') : null,

    data && h('div', { className: 'ab-note', style: { margin: '8px 0', lineHeight: 1.8 } },
      `自动思考：${data.enabled ? `每天 ${data.hour}:${String(data.minute).padStart(2, '0')} · 下次 ${fmtTime(data.nextRunAt)}` : '关（QQ 里发 /成长 现在 可手动）'}`,
      h('br'),
      `记录：${data.totalRuns} 次 · 最近 ${data.lastRunDay || '还没想过'}${data.lastError ? ' · 上次失败：' + data.lastError : ''}`,
    ),

    h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
      h(ui.Btn, { onClick: runNow, disabled: busy === 'run' }, busy === 'run' ? '她在想……（可能要半分钟）' : '现在想一次'),
      h(ui.Btn, { onClick: load, disabled: !!busy }, '刷新'),
    ),

    profile && h('div', { style: { marginTop: 14 } },
      h('h4', { style: { margin: '0 0 6px' } }, '当前档案'),
      h('div', { className: 'ab-note', style: { lineHeight: 1.9 } },
        h('div', null, '性格：' + (profile.traits.length ? profile.traits.join('；') : '（还没立起来）')),
        profile.likes.length ? h('div', null, '喜欢：' + profile.likes.join('；')) : null,
        profile.habits.length ? h('div', null, '习惯：' + profile.habits.join('；')) : null,
        profile.speech ? h('div', null, '说话：' + profile.speech) : null,
        profile.focus ? h('div', null, '最近在意：' + profile.focus) : null,
      ),
    ),

    overlay && h('div', { style: { marginTop: 10 } },
      h('div', { className: 'ab-note', style: { marginBottom: 4 } },
        data.inject ? '每次聊天时，这段会接在人格卡后面：' : '「接进人设」关着，这段现在不会生效，但档案还留着：'),
      h('pre', {
        className: 'ab-note',
        style: { whiteSpace: 'pre-wrap', margin: 0, padding: 8, background: 'rgba(127,127,127,0.06)', borderRadius: 6, lineHeight: 1.7 },
      }, overlay),
    ),

    h('h4', { style: { margin: '16px 0 6px' } }, '变化历史'),
    data && !data.history.length ? h('p', { className: 'ab-note' }, '还没有记录。到点会自动想；等不及可以点「现在想一次」。') : null,
    data && data.history.map((e) => h('div', {
      key: e.id,
      style: { borderTop: '1px solid rgba(127,127,127,0.18)', padding: '8px 0' },
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
        h('strong', null, `${e.day} ${fmtTime(e.at)}`),
        h('span', { className: 'ab-small ab-muted' }, triggerText(e.trigger)),
        e.targetDay ? h('span', { className: 'ab-small ab-muted' }, `回到 ${e.targetDay}`) : null,
        h('span', { style: { flex: 1 } }),
        h(ui.Btn, { onClick: () => setOpen(open === e.id ? '' : e.id) }, open === e.id ? '收起' : '详情'),
        h(ui.Btn, { onClick: () => rollback(e), disabled: busy === e.id || !e.canRollback }, busy === e.id ? '恢复中……' : '回到这一天'),
      ),
      e.thought ? h('div', { className: 'ab-note', style: { marginTop: 4, lineHeight: 1.8 } }, '想了：' + e.thought) : null,
      e.summary && e.summary !== e.thought ? h('div', { className: 'ab-small ab-muted', style: { marginTop: 2 } }, '小结：' + e.summary) : null,
      open === e.id && h('div', { className: 'ab-note', style: { marginTop: 6, lineHeight: 1.8 } },
        e.mood ? h('div', null, '心情：' + e.mood) : null,
        e.changes && e.changes.length
          ? h('div', null, '变化：', h('ul', { style: { margin: '4px 0 0 18px', padding: 0 } },
              e.changes.map((c, i) => h('li', { key: i }, changeText(c) + (c.reason ? `（${c.reason}）` : '')))))
          : h('div', null, '这次没改什么。'),
        e.context ? h('div', { className: 'ab-small ab-muted', style: { marginTop: 4 } },
          `回看：最近 ${e.context.hours || '?'} 小时的 ${e.context.lines || 0} 条消息 / ${e.context.chats || 0} 个聊天`) : null,
        e.skipped && e.skipped.length
          ? h('div', { className: 'ab-small ab-muted', style: { marginTop: 4 } }, `模型多给了 ${e.skipped.length} 处，按「轻微」的上限丢掉了`)
          : null,
      ),
    )),

    h('p', { className: 'ab-note', style: { marginTop: 14 } },
      'QQ 里发 /成长 看当前档案；/成长 历史 5 看记录；/成长 2026-01-05 看某天；/成长 现在 马上想一次。'),
  )
}
