export function StageSwitch({ stage, disabled = false }: { stage: 1 | 2; disabled?: boolean }) {
  return <select aria-label="Chặng học" value={stage} disabled={disabled} style={{ font: '600 13px system-ui', padding: '6px', maxWidth: 112 }} onChange={event => {
    try { sessionStorage.setItem(`quotation-workshop.location.stage${stage}`,location.pathname+location.search+location.hash) } catch { /* Navigation works without storage. */ }
    const fallback = event.target.value === '2' ? '/?stage=2&version=4#checkpoint=s2-r4-00' : '/#journey=2&step=0&sub=0&tab=build'
    let remembered = ''
    try { remembered=sessionStorage.getItem(`quotation-workshop.location.stage${event.target.value}`)??'' } catch { /* Use the explicit entry. */ }
    if(event.target.value==='2'&&remembered){
      const saved=new URL(remembered,location.origin)
      const checkpoint=new URLSearchParams(saved.hash.slice(1)).get('checkpoint')
      if(saved.searchParams.get('version')!=='4'||checkpoint&&!checkpoint.startsWith('s2-r4-'))remembered=''
    }
    window.location.href = remembered.startsWith('/?') || remembered.startsWith('/#') ? remembered : fallback
  }}><option value="1">Chặng 1</option><option value="2">Chặng 2</option></select>
}
