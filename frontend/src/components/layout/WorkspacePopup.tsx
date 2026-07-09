import React from 'react'

type WorkspacePopupProps = {
  open: boolean
  title: string
  children: React.ReactNode
  onOpen: () => void
  onClose: () => void
}

export function WorkspacePopup({ open, title, children, onOpen, onClose }: WorkspacePopupProps) {
  if (!open) {
    return <button type="button" className="workspaceOpenButton" onClick={onOpen}>Buka Workspace</button>
  }

  return (
    <section className="workspaceFloatingPanel" role="dialog" aria-label="Workspace settings">
      <div className="workspaceFloatingHeader">
        <div>
          <small>Workspace</small>
          <b>{title}</b>
        </div>
        <button type="button" onClick={onClose}>Tutup</button>
      </div>
      <div className="workspacePanelBody">
        {children}
      </div>
    </section>
  )
}
