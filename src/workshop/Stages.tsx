import { Suspense, lazy, useEffect, useLayoutEffect, useState } from 'react'
import { Workshop } from './Workshop'
import { archiveMapping } from '../stage2/revision'
const StageTwoWorkshop = lazy(() => import('../stage2/StageTwoAdapter').then(module => ({ default: module.StageTwoAdapter })))
const ArchiveThree = lazy(() => import('../stage2/archive3/StageTwoAdapter').then(m=>({default:m.StageTwoAdapter})))
const Archive = lazy(() => import('../stage2/archive/StageTwoAdapter').then(m=>({default:m.StageTwoAdapter})))
function StageTwoEntry(){
 const [address,setAddress]=useState(()=>location.href)
 useLayoutEffect(()=>{
  const sync=(event:Event)=>setAddress(event instanceof HashChangeEvent?event.newURL:location.href)
  window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);window.addEventListener('workshop:navigation',sync)
  sync(new Event('mount'))
  return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync);window.removeEventListener('workshop:navigation',sync)}
 },[])
 const url=new URL(address),version=url.searchParams.get('version'),requested=new URLSearchParams(url.hash.slice(1)).get('checkpoint')??''
 const revision3=requested.startsWith('s2-r3-')||!requested&&version==='3'
 const old=!requested.startsWith('s2-r4-')&&((version==='1'||version==='2'||revision3)||Object.hasOwn(archiveMapping,requested))
 return old?<><aside role="status" style={{padding:'8px 16px',background:'#fff4d6',fontSize:13}}>Phiên bản bài học cũ · source và tiến độ được giữ nguyên. <a href={'/?stage=2&version=4#checkpoint='+(archiveMapping[requested]??'s2-r4-00')}>Chuyển tới mốc mới tương ứng</a></aside>{revision3?<ArchiveThree/>:<Archive/>}</>:<StageTwoWorkshop/>
}
const Evolution = lazy(() => import('./Evolution').then(module => ({ default:module.Evolution })))

export function Stages() {
  const isEvolution=()=>new URLSearchParams(location.search).get('screen')==='evolution'
  const [evolution,setEvolution]=useState(isEvolution),[visited,setVisited]=useState(isEvolution)
  useEffect(()=>{
    const open=()=>{const url=new URL(location.href);url.searchParams.set('screen','evolution');history.pushState(null,'',url);setEvolution(true);setVisited(true)}
    const change=()=>{setEvolution(isEvolution());if(isEvolution())setVisited(true)}
    window.addEventListener('workshop:evolution',open);window.addEventListener('popstate',change)
    return()=>{window.removeEventListener('workshop:evolution',open);window.removeEventListener('popstate',change)}
  },[])
  function close(){const url=new URL(location.href);url.searchParams.delete('screen');history.pushState(null,'',url);setEvolution(false)}
  return <><div style={{display:evolution?'none':undefined}}>{new URLSearchParams(location.search).get('stage') === '2'
    ? <Suspense fallback={<p role="status">Đang mở Chặng 2…</p>}><StageTwoEntry /></Suspense>
    : <Workshop />}</div>{visited&&<div style={{display:evolution?undefined:'none'}}><Suspense fallback={<p role="status">Đang mở hành trình…</p>}><Evolution onClose={close}/></Suspense></div>}</>
}
