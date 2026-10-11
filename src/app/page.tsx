'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { getSocket } from '@/lib/socket'
import { Landing } from '@/components/landing/Landing'
import { Panel } from '@/components/panel/Panel'

export default function Home() {
  const view = useAppStore((s) => s.view)

  // connect the engine socket as soon as the app loads so statuses are live
  useEffect(() => {
    getSocket()
  }, [])

  return view === 'landing' ? <Landing /> : <Panel />
}
