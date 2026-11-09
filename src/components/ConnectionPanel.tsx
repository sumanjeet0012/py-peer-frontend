import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { usePyPeer } from '../context/PyPeerContext'
import PeerList from './PeerList'
import Spinner from './Spinner'

interface ConnectionPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function ConnectionPanel({ isOpen, onClose }: ConnectionPanelProps) {
  const { nodeInfo, status, connectedPeers, connectPeer, subscribeTopic, topics } = usePyPeer()
  const [maddr, setMaddr] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [err, setErr] = useState('')
  const [topicErr, setTopicErr] = useState('')
  const [copiedPeerId, setCopiedPeerId] = useState(false)
  const [copiedAddrIndex, setCopiedAddrIndex] = useState<number | null>(null)
  const [addressesExpanded, setAddressesExpanded] = useState(true)

  const multiaddrs = (nodeInfo?.multiaddrs && nodeInfo.multiaddrs.length > 0)
    ? nodeInfo.multiaddrs
    : nodeInfo?.multiaddr
    ? [nodeInfo.multiaddr]
    : []

  const copyAddr = (text: string, index: number) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedAddrIndex(index)
      setTimeout(() => setCopiedAddrIndex(null), 2000)
    }).catch(() => {})
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (!maddr.trim()) return
    setConnecting(true)
    try {
      await connectPeer(maddr.trim())
      setMaddr('')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setTopicErr('')
    if (!newTopic.trim()) return
    setSubscribing(true)
    try {
      await subscribeTopic(newTopic.trim())
      setNewTopic('')
    } catch (e: unknown) {
      setTopicErr(e instanceof Error ? e.message : 'Subscribe failed')
    } finally {
      setSubscribing(false)
    }
  }

  const copy = (text: string, cb: (v: boolean) => void) => {
    navigator.clipboard?.writeText(text).then(() => {
      cb(true)
      setTimeout(() => cb(false), 2000)
    }).catch(() => { /* clipboard unavailable (e.g. insecure context) */ })
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-40 transition-opacity" />
        </Transition.Child>

        {/* Slide-in panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
                      <Dialog.Title className="text-base font-semibold text-gray-900">
                        Connection Info
                      </Dialog.Title>
                      <button
                        onClick={onClose}
                        className="rounded-full p-1 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex-1 px-4 py-4 space-y-6">
                      {/* Node identity */}
                      {nodeInfo && (
                        <section>
                          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                            Your Identity
                          </h2>
                          <div className="rounded-lg bg-gray-50 border border-gray-200 divide-y divide-gray-200">
                            <Row label="Nickname" value={nodeInfo.nickname} />
                            <Row
                              label="Peer ID"
                              value={nodeInfo.peer_id}
                              action={
                                <CopyBtn
                                  copied={copiedPeerId}
                                  onClick={() => copy(nodeInfo.peer_id, setCopiedPeerId)}
                                />
                              }
                              mono
                            />
                            <Row label="Port" value={String(nodeInfo.port)} />
                            <Row
                              label="Uptime"
                              value={`${Math.floor(nodeInfo.uptime_seconds)}s`}
                            />
                          </div>
                        </section>
                      )}

                      {/* Advertised Multiaddresses */}
                      {multiaddrs.length > 0 && (
                        <section>
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Advertised Multiaddrs ({multiaddrs.length})
                            </h2>
                            <button
                              type="button"
                              onClick={() => setAddressesExpanded(!addressesExpanded)}
                              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              <span>{addressesExpanded ? 'Collapse' : 'Expand'}</span>
                              {addressesExpanded ? (
                                <ChevronUpIcon className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDownIcon className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          {addressesExpanded ? (
                            <div className="rounded-lg bg-gray-50 border border-gray-200 divide-y divide-gray-200 max-h-56 overflow-y-auto">
                              {multiaddrs.map((addr, idx) => {
                                const badge = getTransportBadge(addr)
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-start justify-between gap-2 p-2.5 hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <span
                                        className={`inline-block mb-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border ${badge.color}`}
                                      >
                                        {badge.label}
                                      </span>
                                      <p className="font-mono text-xs text-gray-800 break-all select-all leading-relaxed">
                                        {addr}
                                      </p>
                                    </div>
                                    <CopyBtn
                                      copied={copiedAddrIndex === idx}
                                      onClick={() => copyAddr(addr, idx)}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div
                              onClick={() => setAddressesExpanded(true)}
                              className="cursor-pointer rounded-lg bg-gray-50 border border-gray-200 p-2.5 hover:bg-gray-100 transition-colors"
                            >
                              <p className="text-xs text-gray-600 font-medium">
                                {multiaddrs.length} multiaddress{multiaddrs.length > 1 ? 'es' : ''} available across transports
                              </p>
                              <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">
                                {multiaddrs[0]}
                              </p>
                            </div>
                          )}
                        </section>
                      )}

                      {/* Service status */}
                      {status && (
                        <section>
                          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                            Service
                          </h2>
                          <div className="rounded-lg bg-gray-50 border border-gray-200 divide-y divide-gray-200">
                            <Row
                              label="Status"
                              value={
                                <span className="flex items-center gap-1">
                                  <span
                                    className={`h-2 w-2 rounded-full ${status.ready ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                  />
                                  {status.ready ? 'Ready' : 'Starting…'}
                                </span>
                              }
                            />
                            <Row label="Connected peers" value={String(status.peer_count)} />
                          </div>
                        </section>
                      )}

                      {/* Connect to peer */}
                      <section>
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                          Connect to a Peer
                        </h2>
                        <form onSubmit={handleConnect} className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="/ip4/1.2.3.4/tcp/4001/p2p/Qm…"
                            value={maddr}
                            onChange={(e) => setMaddr(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-mono placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          {err && <p className="text-xs text-red-500">{err}</p>}
                          <button
                            type="submit"
                            disabled={connecting || !maddr.trim()}
                            className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {connecting && <Spinner className="h-4 w-4 text-white" />}
                            Connect
                          </button>
                        </form>
                      </section>

                      {/* Subscribe to topic */}
                      <section>
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                          Subscribe to Topic
                        </h2>
                        <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="my-custom-channel"
                            value={newTopic}
                            onChange={(e) => setNewTopic(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          {topicErr && <p className="text-xs text-red-500">{topicErr}</p>}
                          <button
                            type="submit"
                            disabled={subscribing || !newTopic.trim()}
                            className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {subscribing && <Spinner className="h-4 w-4 text-white" />}
                            Subscribe
                          </button>
                        </form>
                        {/* Current topics */}
                        {Object.keys(topics).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.keys(topics).map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </section>

                      {/* Connected peers */}
                      <section>
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                          Connected Peers ({connectedPeers.length})
                        </h2>
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                          <PeerList peers={connectedPeers} />
                        </div>
                      </section>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Row({
  label,
  value,
  action,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  action?: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span
        className={`flex-1 text-right text-xs text-gray-800 truncate ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
      {action}
    </div>
  )
}

function CopyBtn({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-600">
      {copied ? (
        <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-500" />
      ) : (
        <ClipboardIcon className="h-4 w-4" />
      )}
    </button>
  )
}

function getTransportBadge(addr: string): { label: string; color: string } {
  if (addr.includes('/webrtc-direct')) {
    return { label: 'WebRTC Direct', color: 'bg-blue-100 text-blue-700 border-blue-200' }
  }
  if (addr.includes('/webrtc')) {
    return { label: 'WebRTC', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' }
  }
  if (addr.includes('/webtransport')) {
    return { label: 'WebTransport', color: 'bg-purple-100 text-purple-700 border-purple-200' }
  }
  if (addr.includes('/quic') || addr.includes('/quic-v1')) {
    return { label: 'QUIC', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  }
  if (addr.includes('/ws') || addr.includes('/wss')) {
    return { label: 'WebSocket', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }
  if (addr.includes('/tcp/')) {
    return { label: 'TCP', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' }
  }
  return { label: 'Multiaddr', color: 'bg-gray-100 text-gray-700 border-gray-200' }
}
