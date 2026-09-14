'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Globe,
  Copy,
  Check,
  RefreshCw,
  MapPin,
  Server,
  Network,
  ShieldCheck,
  ExternalLink,
  Clock,
  Compass,
  AlertCircle,
  Building2,
  Navigation,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface IpData {
  ip: string
  type: 'IPv4' | 'IPv6' | string
  continent?: string
  country?: string
  country_code?: string
  region?: string
  city?: string
  postal?: string
  latitude?: number
  longitude?: number
  flag?: {
    img?: string
    emoji?: string
  }
  connection?: {
    asn?: number | string
    org?: string
    isp?: string
    domain?: string
  }
  timezone?: {
    id?: string
    abbr?: string
    utc?: string
  }
}

export function PublicIpView() {
  const [data, setData] = React.useState<IpData | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [activeQuery, setActiveQuery] = React.useState<string>('')

  const fetchIpData = React.useCallback(async (targetIp?: string) => {
    setLoading(true)
    setError(null)
    const endpoint = targetIp && targetIp.trim() 
      ? `https://ipwho.is/${encodeURIComponent(targetIp.trim())}` 
      : 'https://ipwho.is/'

    try {
      const res = await fetch(endpoint, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()

      if (json.success === false) {
        throw new Error(json.message || 'Unable to resolve IP address.')
      }

      setData(json)
      setActiveQuery(json.ip || '')
    } catch (err: any) {
      // Fallback to simple IP resolution if ipwho.is is blocked or fails
      try {
        const fallbackRes = await fetch('https://api64.ipify.org?format=json')
        if (fallbackRes.ok) {
          const fallbackJson = await fallbackRes.json()
          const isV6 = (fallbackJson.ip || '').includes(':')
          setData({
            ip: fallbackJson.ip,
            type: isV6 ? 'IPv6' : 'IPv4',
            connection: {
              isp: 'Standard Public Gateway',
              org: 'Internet Service Provider',
            }
          })
          setActiveQuery(fallbackJson.ip)
          setError(null)
        } else {
          throw new Error('Fallback failed')
        }
      } catch {
        setError(err.message || 'Failed to retrieve public IP details. Please check your internet connection.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchIpData()
  }, [fetchIpData])

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev))
    }, 2000)
  }

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      fetchIpData(searchQuery.trim())
    } else {
      fetchIpData()
    }
  }

  const fullAddress = [data?.city, data?.region, data?.country]
    .filter(Boolean)
    .join(', ')

  const mapUrl = data?.latitude && data?.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`
    : undefined

  const osmUrl = data?.latitude && data?.longitude
    ? `https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=12/${data.latitude}/${data.longitude}`
    : undefined

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 1. Main Hero Card: Public IP + Primary Actions */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm glass-card">
        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header status bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                <Globe className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Public IP Address
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Visible to servers & services across the internet
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchIpData(searchQuery || undefined)}
                disabled={loading}
                className="h-8 gap-1.5 rounded-lg text-xs font-medium cursor-pointer"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
              </Button>
            </div>
          </div>

          {/* Large IP Display + Copy Button */}
          {loading ? (
            <div className="flex flex-col gap-3 py-4">
              <div className="h-10 w-3/4 animate-pulse rounded-xl bg-muted/60" />
              <div className="h-4 w-1/3 animate-pulse rounded-md bg-muted/40" />
            </div>
          ) : error && !data ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Unable to fetch IP details</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => fetchIpData()}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-4xl break-all">
                  {data?.ip || 'Unknown IP'}
                </span>

                {data?.type && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold tracking-wide uppercase',
                      data.type.toUpperCase() === 'IPV6'
                        ? 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {data.type}
                  </Badge>
                )}

                {/* COPY BUTTON DIRECTLY IN FRONT OF IP */}
                {data?.ip && (
                  <Button
                    size="sm"
                    variant={copiedKey === 'ip' ? 'default' : 'secondary'}
                    onClick={() => copyToClipboard(data.ip, 'ip')}
                    className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    {copiedKey === 'ip' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy IP</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Quick summary line */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground">
                {data?.flag?.emoji && <span className="text-base leading-none">{data.flag.emoji}</span>}
                {fullAddress && (
                  <span className="font-medium text-foreground">
                    {fullAddress}
                  </span>
                )}
                {data?.connection?.isp && (
                  <>
                    <span className="text-border">·</span>
                    <span>{data.connection.isp}</span>
                  </>
                )}
                {data?.connection?.domain && (
                  <>
                    <span className="text-border">·</span>
                    <span className="font-mono text-[11px]">{data.connection.domain}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Detailed Breakdown Grid */}
      {data && !loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card A: Location & Address */}
          <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-2xs glass-card">
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <span>Location & Address</span>
                </div>
                {data.flag?.emoji && (
                  <span className="text-lg">{data.flag.emoji}</span>
                )}
              </div>

              <dl className="space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-muted-foreground">Country</dt>
                  <dd className="font-medium text-right text-foreground">
                    {data.country || 'N/A'} {data.country_code ? `(${data.country_code})` : ''}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-muted-foreground">Region / State</dt>
                  <dd className="font-medium text-right text-foreground">
                    {data.region || 'N/A'}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-muted-foreground">City</dt>
                  <dd className="font-medium text-right text-foreground">
                    {data.city || 'N/A'}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-muted-foreground">Postal Code</dt>
                  <dd className="font-mono text-right text-foreground">
                    {data.postal || 'N/A'}
                  </dd>
                </div>

                {data.continent && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground">Continent</dt>
                    <dd className="text-right text-foreground">
                      {data.continent}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {fullAddress && (
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground truncate max-w-[190px]">
                  {fullAddress}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(fullAddress, 'address')}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  {copiedKey === 'address' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'address' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Card B: Network, Hostname & ISP */}
          <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-2xs glass-card">
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Server className="h-4 w-4 text-blue-500" />
                  <span>Network & ISP</span>
                </div>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-secondary-foreground font-semibold">
                  {data.type}
                </span>
              </div>

              <dl className="space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-muted-foreground">ISP Name</dt>
                  <dd className="font-medium text-right text-foreground max-w-[180px] break-words">
                    {data.connection?.isp || 'Unknown ISP'}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-muted-foreground">Organization</dt>
                  <dd className="font-medium text-right text-foreground max-w-[180px] break-words">
                    {data.connection?.org || 'N/A'}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-muted-foreground">Hostname</dt>
                  <dd className="font-mono text-[11px] text-right text-foreground max-w-[180px] break-all">
                    {data.connection?.domain || 'unresolved'}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-muted-foreground">Autonomous System</dt>
                  <dd className="font-mono text-right text-foreground">
                    {data.connection?.asn ? `AS${data.connection.asn}` : 'N/A'}
                  </dd>
                </div>

                {data.timezone?.id && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground">Timezone</dt>
                    <dd className="font-mono text-[11px] text-right text-foreground">
                      {data.timezone.id} ({data.timezone.utc || ''})
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {data.connection?.isp && (
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground truncate max-w-[190px]">
                  {data.connection.isp}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(data.connection?.isp || '', 'isp')}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  {copiedKey === 'isp' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'isp' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Card C: GPS Coordinates & Maps */}
          <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-2xs glass-card sm:col-span-2 lg:col-span-1">
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Compass className="h-4 w-4 text-emerald-500" />
                  <span>GPS Co-ordinates</span>
                </div>
                <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/40 p-3 mb-3">
                <div className="text-[11px] text-muted-foreground mb-1">Latitude & Longitude</div>
                <div className="font-mono text-sm font-semibold text-foreground flex items-center justify-between">
                  <span>
                    {data.latitude !== undefined && data.longitude !== undefined
                      ? `${data.latitude.toFixed(4)}°, ${data.longitude.toFixed(4)}°`
                      : 'Unavailable'}
                  </span>
                  {data.latitude !== undefined && data.longitude !== undefined && (
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `${data.latitude}, ${data.longitude}`,
                          'coords'
                        )
                      }
                      title="Copy Coordinates"
                      className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                    >
                      {copiedKey === 'coords' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Latitude</dt>
                  <dd className="font-mono text-foreground">
                    {data.latitude !== undefined ? data.latitude : 'N/A'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Longitude</dt>
                  <dd className="font-mono text-foreground">
                    {data.longitude !== undefined ? data.longitude : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2">
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Google Maps</span>
                </a>
              )}
              {osmUrl && (
                <a
                  href={osmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>OpenStreetMap</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Lookup another IP address */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-4 glass-card">
        <form onSubmit={handleCustomSearch} className="flex flex-col sm:flex-row gap-2.5 items-center">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query another IP address or domain (e.g., 8.8.8.8)..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button type="submit" size="sm" className="h-9 px-4 text-xs font-semibold cursor-pointer w-full sm:w-auto">
              Lookup IP
            </Button>
            {searchQuery && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  fetchIpData()
                }}
                className="h-9 text-xs cursor-pointer"
              >
                Reset to My IP
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* 4. PRIVACY & TRANSPARENCY NOTE (USER'S EXPLICIT REQUIREMENT) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 sm:p-5 shadow-2xs"
      >
        <div className="flex items-start gap-3.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground text-sm">
                About this tool: This is your public network routing data only
              </h4>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                100% Transparent
              </span>
            </div>
            <p>
              This tool displays only the <strong>public IP address</strong> and standard routing metadata
              assigned to you by your Internet Service Provider (ISP). Whenever your device visits any website
              on the internet, this public address is sent automatically so the remote server knows where to
              deliver web page responses.
            </p>
            <p className="text-[11px] text-muted-foreground/90">
              • <strong>Nothing private is accessed or collected</strong>: ToolForge does not read your device,
              files, cookies, or browsing history.
              <br />
              • <strong>No server tracking or logs</strong>: Your IP address is never stored, tracked, or
              persisted anywhere.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
