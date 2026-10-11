'use client'

import { create } from 'zustand'

interface AppState {
  view: 'landing' | 'panel'
  activeServerId: string | null
  wizardOpen: boolean
  wizardRamMb: number | null // prefill from pricing plan
  wizardSession: number // increments per open → remounts wizard body for fresh state
  goPanel: () => void
  goLanding: () => void
  openServer: (id: string) => void
  closeServer: () => void
  openWizard: (ramMb?: number) => void
  closeWizard: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'landing',
  activeServerId: null,
  wizardOpen: false,
  wizardRamMb: null,
  wizardSession: 0,
  goPanel: () => set({ view: 'panel', activeServerId: null }),
  goLanding: () => set({ view: 'landing', activeServerId: null }),
  openServer: (id) => set({ view: 'panel', activeServerId: id }),
  closeServer: () => set({ activeServerId: null }),
  openWizard: (ramMb) =>
    set((s) => ({ wizardOpen: true, wizardRamMb: ramMb ?? null, wizardSession: s.wizardSession + 1 })),
  closeWizard: () => set({ wizardOpen: false, wizardRamMb: null }),
}))
