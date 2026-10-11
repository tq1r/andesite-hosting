'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, ArrowLeft, ArrowRight, Rocket, Check, Loader2, Cpu, Globe } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import {
  PLATFORMS, VERSIONS, REGIONS, GAMEMODES, DIFFICULTIES, WORLD_TYPES,
  SERVER_NAME_IDEAS, PLANS, ramLabel, platformLabel, type ServerDTO,
} from '@/lib/mc'
import { useAppStore } from '@/lib/store'

const DEPLOY_STEPS = (platform: string, version: string) => [
  'Allocating resources on node',
  `Installing ${platformLabel(platform)} ${version} core`,
  'Generating spawn region',
  'Writing server.properties',
  'Finishing up',
]

export function CreateServerWizard() {
  const wizardOpen = useAppStore((s) => s.wizardOpen)
  const wizardSession = useAppStore((s) => s.wizardSession)
  const wizardRamMb = useAppStore((s) => s.wizardRamMb)
  const closeWizard = useAppStore((s) => s.closeWizard)

  return (
    <Dialog open={wizardOpen} onOpenChange={(o) => !o && closeWizard()}>
      <DialogContent className="max-w-lg bg-zinc-950 border-white/10 max-h-[90vh] overflow-y-auto">
        {/* key → fresh state every time the wizard opens */}
        <WizardBody key={wizardSession} prefillRamMb={wizardRamMb} />
      </DialogContent>
    </Dialog>
  )
}

function WizardBody({ prefillRamMb }: { prefillRamMb: number | null }) {
  const closeWizard = useAppStore((s) => s.closeWizard)
  const openServer = useAppStore((s) => s.openServer)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)
  const [name, setName] = useState(() => SERVER_NAME_IDEAS[Math.floor(Math.random() * SERVER_NAME_IDEAS.length)])
  const [platform, setPlatform] = useState<string>('paper')
  const [version, setVersion] = useState('1.21.4')
  const [ramMb, setRamMb] = useState(prefillRamMb ?? 2048)
  const [maxPlayers, setMaxPlayers] = useState(20)
  const [region, setRegion] = useState('us-east')
  const [gamemode, setGamemode] = useState('survival')
  const [difficulty, setDifficulty] = useState('normal')
  const [worldType, setWorldType] = useState('normal')
  const [motd, setMotd] = useState('Welcome to our Minecraft server!')
  const [pvp, setPvp] = useState(true)
  const [whitelist, setWhitelist] = useState(false)
  const [deployProgress, setDeployProgress] = useState(0)
  const [deployLabel, setDeployLabel] = useState('')

  const planHint = useMemo(
    () => [...PLANS].reverse().find((p) => ramMb >= p.ramMb) ?? PLANS[0],
    [ramMb]
  )

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api<{ server: ServerDTO }>('/api/servers', { method: 'POST', body: JSON.stringify(payload) }),
  })

  const deploy = async () => {
    setStep(5)
    setDeployProgress(0)
    const steps = DEPLOY_STEPS(platform, version)
    try {
      const res = await createMutation.mutateAsync({
        name: name.trim(),
        platform,
        version,
        motd: motd.trim() || 'A CraftHost Server',
        maxPlayers,
        ramMb,
        region,
        gamemode,
        difficulty,
        worldType,
        pvp,
        onlineMode: true,
        whitelist,
      })
      const server = res.server
      for (let i = 0; i < steps.length; i++) {
        setDeployLabel(steps[i])
        setDeployProgress(Math.round((i / steps.length) * 100))
        await new Promise((r) => setTimeout(r, 650 + Math.random() * 500))
      }
      setDeployProgress(100)
      setDeployLabel('Server deployed')
      await new Promise((r) => setTimeout(r, 400))

      await queryClient.invalidateQueries({ queryKey: ['servers'] })
      await queryClient.invalidateQueries({ queryKey: ['activity'] })
      closeWizard()
      openServer(server.id)
      toast({
        title: `${server.name} is deployed`,
        description: 'Press Start to boot it up and watch the console come alive.',
      })
    } catch (e) {
      toast({
        title: 'Deployment failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
      setStep(4)
    }
  }

  const canNext = step === 1 ? name.trim().length > 0 : true

  const platformCards = PLATFORMS.map((p) => (
    <button
      key={p.id}
      type="button"
      onClick={() => setPlatform(p.id)}
      className={`rounded-lg border p-3 text-left transition-colors ${platform === p.id
        ? 'border-emerald-500/60 bg-emerald-500/10'
        : 'border-white/10 bg-white/[0.02] hover:border-white/25'}`}
      aria-pressed={platform === p.id}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-zinc-100">{p.label}</span>
        {platform === p.id && <Check className="h-4 w-4 text-emerald-400" />}
      </div>
      <p className="mt-1 text-xs text-zinc-500 leading-snug">{p.desc}</p>
    </button>
  ))

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-pixel text-xs text-emerald-400">
          {step <= 4 ? `DEPLOY A SERVER — ${step}/4` : 'DEPLOYING…'}
        </DialogTitle>
        <DialogDescription className="sr-only">Create a new Minecraft server</DialogDescription>
      </DialogHeader>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Basics ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="srv-name">Server name</Label>
              <div className="flex gap-2">
                <Input
                  id="srv-name"
                  value={name}
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Angry Creepers SMP"
                  className="bg-white/[0.03] border-white/10"
                />
                <Button
                  type="button" variant="outline" size="icon"
                  onClick={() => setName(SERVER_NAME_IDEAS[Math.floor(Math.random() * SERVER_NAME_IDEAS.length)])}
                  className="shrink-0 border-white/10 hover:bg-white/5"
                  aria-label="Random name"
                >
                  <Dices className="h-4 w-4 text-emerald-400" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{platformCards}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="srv-version">Version</Label>
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger id="srv-version" className="bg-white/[0.03] border-white/10">
                  <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10">
                  {VERSIONS.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Resources ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><Cpu className="h-4 w-4 text-emerald-400" /> Memory</Label>
                <span className="font-mono text-sm text-emerald-400">{ramLabel(ramMb)}</span>
              </div>
              <Slider
                value={[ramMb]}
                min={1024}
                max={16384}
                step={1024}
                onValueChange={([v]) => setRamMb(v)}
                aria-label="Memory allocation"
              />
              <p className="text-xs text-zinc-500">
                {ramMb <= 2048
                  ? '2 GB runs great for Vanilla with a few friends.'
                  : ramMb <= 4096
                    ? '4 GB comfortably handles 10–25 players with plugins.'
                    : ramMb <= 8192
                      ? '8 GB suits a busy SMP with 25–60 players.'
                      : '16 GB for large communities and modpacks.'}
                {' · '}
                <span className="text-zinc-400">{planHint.name} plan ({planHint.priceLabel}{planHint.price > 0 ? planHint.period : ''})</span>
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Player slots</Label>
                <span className="font-mono text-sm text-emerald-400">{maxPlayers}</span>
              </div>
              <Slider
                value={[maxPlayers]}
                min={2}
                max={100}
                step={1}
                onValueChange={([v]) => setMaxPlayers(v)}
                aria-label="Player slots"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="srv-region" className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-emerald-400" /> Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="srv-region" className="bg-white/[0.03] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10">
                  {REGIONS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label} · ~{r.ping} ms
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Gameplay ── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Gamemode</Label>
                <Select value={gamemode} onValueChange={setGamemode}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10">
                    {GAMEMODES.map((g) => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10">
                    {DIFFICULTIES.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>World type</Label>
                <Select value={worldType} onValueChange={setWorldType}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10">
                    {WORLD_TYPES.map((w) => <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="srv-motd">MOTD — message of the day</Label>
                <span className="text-[11px] text-zinc-600 font-mono">{motd.length}/59</span>
              </div>
              <Input
                id="srv-motd"
                value={motd}
                maxLength={59}
                onChange={(e) => setMotd(e.target.value)}
                className="bg-white/[0.03] border-white/10"
                placeholder="Welcome to our server!"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium text-zinc-200">PvP</div>
                  <div className="text-xs text-zinc-600">Players can fight</div>
                </div>
                <Switch checked={pvp} onCheckedChange={setPvp} aria-label="Toggle PvP" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium text-zinc-200">Whitelist</div>
                  <div className="text-xs text-zinc-600">Invite-only access</div>
                </div>
                <Switch checked={whitelist} onCheckedChange={setWhitelist} aria-label="Toggle whitelist" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] divide-y divide-white/5">
              {[
                ['Name', name],
                ['Platform', `${platformLabel(platform)} ${version}`],
                ['Memory', ramLabel(ramMb)],
                ['Slots', String(maxPlayers)],
                ['Region', REGIONS.find((r) => r.id === region)?.label ?? region],
                ['Gamemode', GAMEMODES.find((g) => g.id === gamemode)?.label ?? gamemode],
                ['Difficulty', DIFFICULTIES.find((d) => d.id === difficulty)?.label ?? difficulty],
                ['World', WORLD_TYPES.find((w) => w.id === worldType)?.label ?? worldType],
                ['PvP', pvp ? 'Enabled' : 'Disabled'],
                ['Whitelist', whitelist ? 'On' : 'Off'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-zinc-500">{k}</span>
                  <span className="text-zinc-200 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-600">
              Estimated deploy time: ~60 seconds. You can change everything later in Settings.
            </p>
          </motion.div>
        )}

        {/* ── Step 5: Deploying ── */}
        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 space-y-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
              <span className="text-sm text-zinc-300">{deployLabel}</span>
            </div>
            <Progress value={deployProgress} className="h-2 bg-zinc-800" />
            <div className="flex justify-between text-[11px] text-zinc-600 font-mono">
              <span>{deployProgress}%</span>
              <span>node {region}-01</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* footer nav */}
      {step <= 4 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)} className="text-zinc-400 hover:text-zinc-100">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          {step < 4 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold">
              Continue <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={deploy} disabled={createMutation.isPending || !name.trim()} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold">
              <Rocket className="mr-1.5 h-4 w-4" /> Deploy server
            </Button>
          )}
        </div>
      )}
    </>
  )
}
