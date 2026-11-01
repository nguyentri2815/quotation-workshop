import type { ReactNode, ComponentProps } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { WorkshopHeader } from './WorkshopHeader'
import type { useSplitLayout } from './useSplitLayout'
import styles from './workshop.module.css'

/** Shared workspace structure. Stage adapters supply learning data and regions. */
export function WorkshopFrame({ header, sidebar, substeps, children, preview, runToolbar, split, mobile, onMobile, hidden = false, runState }: {
  header: ComponentProps<typeof WorkshopHeader>; sidebar: ReactNode; substeps?: ReactNode
  children: ReactNode; preview: ReactNode; runToolbar?: ReactNode
  split: ReturnType<typeof useSplitLayout>; mobile: 'guide' | 'preview'; onMobile: (pane: 'guide' | 'preview') => void; hidden?: boolean
  runState?: {status:string;index:number;id:string} | null
}) {
  return <div className={styles.workshop} hidden={hidden} data-workspace="shared" data-stage={header.stage ?? 1} data-run-status={runState?.status} data-run-step={runState?.index} data-run-session={runState?.id}>
    <a className={styles.skip} href="#workspace-title" onClick={event => { event.preventDefault(); document.getElementById('workspace-title')?.focus() }}>Đến nội dung</a>
    <WorkshopHeader {...header} />
    {runToolbar}
    <div className={styles.layout}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <div className={styles.mobileSwitch} role="tablist" aria-label="Vùng làm việc"><button role="tab" aria-selected={mobile === 'guide'} onClick={() => onMobile('guide')}>Hướng dẫn</button><button role="tab" aria-selected={mobile === 'preview'} onClick={() => onMobile('preview')}>Preview</button></div>
      <Group id="learning-preview" groupRef={split.group} defaultLayout={split.initial} disabled={split.small} className={`${styles.split} ${mobile === 'guide' ? styles.showGuide : styles.showPreview}`} onLayoutChanged={split.changed}>
        <Panel id="code" minSize={split.small ? '0%' : '420px'} className={styles.panelContent}><main className={`${styles.middle} ${mobile !== 'guide' ? styles.mobileHidden : ''}`}>{substeps}{children}</main></Panel>
        <Separator className={styles.resizeHandle} aria-label="Kéo độ rộng preview" onPointerDownCapture={split.startDrag}><span aria-hidden>⋮</span></Separator>
        <Panel id="preview" collapsible minSize={split.small ? '0%' : '300px'} collapsedSize="0%" className={styles.panelContent}><aside className={`${styles.previewPane} ${mobile !== 'preview' ? styles.mobileHidden : ''}`} aria-label="Vùng preview" inert={!split.small && split.collapsed} aria-hidden={!split.small && split.collapsed || undefined}>{preview}</aside></Panel>
      </Group>
    </div>
    {split.dragging && <div className={styles.dragShield} data-testid="iframe-drag-shield" aria-hidden />}
  </div>
}
