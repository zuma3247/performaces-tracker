import { useState, useEffect, useRef } from 'react'
import { PlusCircle, Mic, Music, Smile, User, Ticket, Trash2, Moon, Sun, Sparkles, X, Plus, Minus } from 'lucide-react'
import { WelcomeModal } from './components/WelcomeModal'
import { Toast } from './components/Toast'

// Utility to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9)

function App() {
  // State
  const [performers, setPerformers] = useState(() => {
    const saved = localStorage.getItem('openMicPerformers')
    return saved ? JSON.parse(saved) : []
  })

  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem('openMicQueue')
    return saved ? JSON.parse(saved) : []
  })

  const [currentPerformer, setCurrentPerformer] = useState(() => {
    const saved = localStorage.getItem('openMicCurrent')
    return saved ? JSON.parse(saved) : null
  })

  const [showWelcome, setShowWelcome] = useState(() => {
    const hasSeen = localStorage.getItem('openMicHasSeenWelcome')
    return !hasSeen
  })

  const [toast, setToast] = useState(null)

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (localStorage.getItem('theme')) {
      return localStorage.getItem('theme')
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Input State
  const [newNames, setNewNames] = useState(['']) // Array for duets/groups
  const [newPiece, setNewPiece] = useState('')
  const [newType, setNewType] = useState('Poetry')

  // --- PERSISTENCE (Split to prevent monolithic wipes) ---
  useEffect(() => {
    localStorage.setItem('openMicPerformers', JSON.stringify(performers))
  }, [performers])

  useEffect(() => {
    localStorage.setItem('openMicQueue', JSON.stringify(queue))
  }, [queue])

  useEffect(() => {
    localStorage.setItem('openMicCurrent', JSON.stringify(currentPerformer))
  }, [currentPerformer])

  // --- CROSS-TAB SYNC ---
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'openMicPerformers') {
        const newData = e.newValue ? JSON.parse(e.newValue) : []
        setPerformers(newData)
      }
      if (e.key === 'openMicQueue') {
        const newData = e.newValue ? JSON.parse(e.newValue) : []
        setQueue(newData)
      }
      if (e.key === 'openMicCurrent') {
        const newData = e.newValue ? JSON.parse(e.newValue) : null
        setCurrentPerformer(newData)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Theme Logic
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleCloseWelcome = () => {
    setShowWelcome(false)
    localStorage.setItem('openMicHasSeenWelcome', 'true')
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }

  // Logic
  const calculateTickets = (perfCount, bonus = 0) => {
    const tickets = (perfCount * 2) + bonus
    return Math.max(0, Math.min(tickets, 7 + Math.max(0, bonus))) // Base cap is 7, bonus allows exceeding if needed
  }

  const handleNameChange = (index, value) => {
    const updatedNames = [...newNames]
    updatedNames[index] = value
    setNewNames(updatedNames)
  }

  const addNameInput = () => {
    setNewNames([...newNames, ''])
  }

  const removeNameInput = (index) => {
    const updatedNames = newNames.filter((_, i) => i !== index)
    setNewNames(updatedNames)
  }

  // Action Locks to prevent double-execution side-effects
  const actionLockRef = useRef(false)
  const setWithLock = (callback) => {
    if (actionLockRef.current) return
    actionLockRef.current = true
    callback()
    setTimeout(() => { actionLockRef.current = false }, 300)
  }

  const addToQueue = (e) => {
    e.preventDefault()

    const validNames = newNames.map(n => n.trim()).filter(n => n !== '')
    if (validNames.length === 0) return

    setWithLock(() => {
      let updatedPerformers = [...performers]
      const queuePerformers = []

      for (const name of validNames) {
        let performer = updatedPerformers.find(p => p.name.toLowerCase() === name.toLowerCase())
        if (!performer) {
          performer = {
            id: generateId(),
            name: name,
            type: newType,
            count: 0,
            bonusTickets: 0
          }
          updatedPerformers.push(performer)
        }
        queuePerformers.push({ id: performer.id, name: performer.name })
      }

      // Validation against queue
      for (const p of queuePerformers) {
        const inQueue = queue.find(q => q.queuePerformers?.some(qp => qp.id === p.id) || q.performerId === p.id)
        const isCurrent = currentPerformer && (currentPerformer.queuePerformers?.some(qp => qp.id === p.id) || currentPerformer.performerId === p.id)
        if (inQueue || isCurrent) {
          showToast(`${p.name} is already in the queue or performing!`, 'error')
          return
        }
      }

      const queueItem = {
        id: generateId(),
        queuePerformers: queuePerformers,
        type: newType,
        piece: newPiece.trim(),
        timestamp: Date.now()
      }

      setPerformers(updatedPerformers)
      setQueue([...queue, queueItem])

      setNewNames([''])
      setNewPiece('')
      showToast(`${validNames.join(' & ')} added to the queue!`)
    })
  }

  const removeFromQueue = (queueId) => {
    setQueue(prevQueue => {
      const itemList = prevQueue.find(q => q.id === queueId)
      if (itemList) {
        const names = itemList.queuePerformers ? itemList.queuePerformers.map(p => p.name).join(' & ') : itemList.name
        showToast(`${names} removed from queue.`, 'info')
      }
      return prevQueue.filter(q => q.id !== queueId)
    })
  }

  // Priority Queue Logic
  const getSortedQueue = () => {
    return [...queue].sort((a, b) => {
      // Find max count among the group for fair prioritization
      const getQueueCount = (queueItem) => {
        if (queueItem.queuePerformers) {
          const counts = queueItem.queuePerformers.map(qp => performers.find(p => p.id === qp.id)?.count || 0)
          return Math.max(...counts, 0) // Max count dictates priority (least fair)
        } else {
          // Legacy fallback
          const perf = performers.find(p => p.id === queueItem.performerId)
          return perf ? perf.count : 0
        }
      }

      const countA = getQueueCount(a)
      const countB = getQueueCount(b)

      if (countA !== countB) return countA - countB
      return a.timestamp - b.timestamp
    })
  }

  const sortedQueue = getSortedQueue()

  const startNext = () => {
    if (sortedQueue.length === 0) return
    setWithLock(() => {
      const next = sortedQueue[0]
      setCurrentPerformer({
        ...next,
        startTime: Date.now()
      })
      setQueue(prev => prev.filter(q => q.id !== next.id))
    })
  }

  const finishPerformance = () => {
    if (!currentPerformer) return

    setWithLock(() => {
      setPerformers(prev => prev.map(p => {
        // Check if this performer is in the current performing group
        const inCurrentGroup = currentPerformer.queuePerformers
          ? currentPerformer.queuePerformers.some(qp => qp.id === p.id)
          : currentPerformer.performerId === p.id // Legacy fallback

        if (inCurrentGroup) {
          return {
            ...p,
            count: p.count + 1,
            lastPerformed: Date.now()
          }
        }
        return p
      }))

      setCurrentPerformer(null)
    })
  }

  const adjustManualCount = (performerId, amount) => {
    setPerformers(prev => prev.map(p => {
      if (p.id === performerId) {
        return { ...p, count: Math.max(0, p.count + amount) }
      }
      return p
    }))
  }

  const adjustManualBonus = (performerId, amount) => {
    setPerformers(prev => prev.map(p => {
      if (p.id === performerId) {
        return { ...p, bonusTickets: (p.bonusTickets || 0) + amount }
      }
      return p
    }))
  }

  const resetEvent = () => {
    if (window.confirm("Are you sure you want to end the event? This will clear ALL data (Queue, Current Performer, and History).")) {
      setPerformers([])
      setQueue([])
      setCurrentPerformer(null)
      // localStorage is now handled by the separate useEffects
      showToast('Event reset successfully.', 'info')
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Poetry': return <Mic className="w-4 h-4" />
      case 'Karaoke': return <Music className="w-4 h-4" />
      case 'Comedy': return <Smile className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const renderGroupNames = (item) => {
    if (item.queuePerformers && item.queuePerformers.length > 0) {
      return item.queuePerformers.map(p => p.name).join(' & ')
    }
    return item.name // Legacy
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-webster-gold selection:text-webster-blue transition-colors duration-200">
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-webster-blue dark:text-webster-gold">
              Performances Tracker
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base font-medium hidden sm:block">Poetry • Karaoke • Comedy</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-0 bg-slate-100 dark:bg-slate-800 px-3 py-2 sm:p-0 rounded-lg sm:rounded-none">
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Total</div>
              <div className="text-lg sm:text-2xl font-bold text-webster-blue dark:text-webster-gold sm:text-right">{performers.length}</div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition ring-offset-2 focus:ring-2 ring-webster-gold outline-none"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Current Performer */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-webster-gold rounded-2xl opacity-75 blur"></div>
          <div className="relative bg-webster-blue dark:bg-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-webster-gold opacity-10 rounded-full blur-2xl"></div>

            {currentPerformer ? (
              <>
                <div className="flex-1 text-center sm:text-left relative z-10">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-webster-gold/20 text-webster-gold text-sm font-bold mb-3 border border-webster-gold/30">
                    {getTypeIcon(currentPerformer.type)}
                    {currentPerformer.type}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-1">{renderGroupNames(currentPerformer)}</h2>
                  {currentPerformer.piece && <p className="text-lg text-slate-300 italic mb-2">"{currentPerformer.piece}"</p>}
                  <p className="text-slate-400 animate-pulse text-sm uppercase tracking-widest font-bold">Now Performing...</p>
                </div>
                <button
                  onClick={finishPerformance}
                  className="relative z-10 px-8 py-3 bg-webster-gold hover:bg-yellow-400 text-webster-blue font-bold rounded-lg transform transition hover:scale-105 shadow-lg active:scale-95 border-2 border-transparent hover:border-white/20"
                >
                  Finish Performance
                </button>
              </>
            ) : (
              <div className="flex-1 text-center py-4 relative z-10">
                <h2 className="text-2xl font-bold text-white/90">Stage is Empty</h2>
                <p className="text-slate-300">Waiting for the next act...</p>
                {sortedQueue.length > 0 && (
                  <button
                    onClick={startNext}
                    className="mt-4 px-6 py-2 bg-webster-gold text-webster-blue font-bold rounded-lg hover:shadow-lg hover:scale-105 transition"
                  >
                    Call Next: {renderGroupNames(sortedQueue[0])}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sign Up Form */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-webster-blue dark:text-webster-gold">
              <PlusCircle className="text-webster-gold" />
              Sign Up Act
            </h3>
            <form onSubmit={addToQueue} className="space-y-4">

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Performers</label>
                  {newNames.length < 5 && (
                    <button type="button" onClick={addNameInput} className="text-xs text-webster-blue dark:text-webster-gold font-bold flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Add Co-Performer
                    </button>
                  )}
                </div>

                {newNames.map((name, index) => (
                  <div key={index} className="flex items-center gap-2 relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      list="performer-names"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-webster-gold text-slate-900 dark:text-slate-100 placeholder-slate-400 transition"
                      placeholder={index === 0 ? "Enter main performer name..." : "Enter co-performer name..."}
                    />
                    {newNames.length > 1 && (
                      <button type="button" onClick={() => removeNameInput(index)} className="absolute right-3 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-900">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                <datalist id="performer-names">
                  {[...new Set(performers.map(p => p.name))].sort().map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Piece (Optional)</label>
                <input
                  type="text"
                  value={newPiece}
                  onChange={(e) => setNewPiece(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-webster-gold text-slate-900 dark:text-slate-100 placeholder-slate-400 transition"
                  placeholder="Song title, poem name, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Performance Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Poetry', 'Karaoke', 'Comedy'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewType(type)}
                      className={`py-2 px-3 rounded-lg text-sm font-bold border transition ${newType === type
                        ? 'bg-webster-blue text-white border-webster-blue'
                        : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-webster-blue/50 dark:hover:border-webster-gold/50'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={!newNames[0].trim()}
                className="w-full py-3.5 sm:py-3 bg-webster-blue hover:bg-blue-900 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg sm:text-base border-b-4 border-blue-900 active:border-b-0 active:translate-y-1"
              >
                Add to Queue
              </button>
            </form>
          </div>

          {/* Queue List */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-colors max-h-[640px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-webster-blue dark:text-webster-gold">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-webster-gold text-webster-blue text-xs font-bold">
                  {queue.length}
                </span>
                Up Next
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-medium border border-slate-200 dark:border-slate-600">
                Prioritized by least performances
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {sortedQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Sparkles className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="font-medium">The queue is empty!</p>
                  <p className="text-sm opacity-75">Be the first to perform.</p>
                </div>
              ) : (
                sortedQueue.map((item, index) => {

                  // Calculate max count for display logic
                  let maxCount = 0
                  if (item.queuePerformers) {
                    const counts = item.queuePerformers.map(qp => performers.find(p => p.id === qp.id)?.count || 0)
                    maxCount = Math.max(...counts, 0)
                  } else {
                    maxCount = performers.find(p => p.id === item.performerId)?.count || 0
                  }

                  const isNew = maxCount === 0

                  return (
                    <div key={item.id} className="relative flex items-center justify-between bg-slate-50 dark:bg-slate-900 pr-10 pl-3 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-webster-gold dark:hover:border-webster-gold transition group">
                      <div className="flex items-center gap-3 w-full">
                        <div className="font-mono text-slate-400 dark:text-slate-500 text-sm font-bold min-w-[20px]">#{index + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-2">
                            <span className="truncate">{renderGroupNames(item)}</span>
                            {isNew && <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-green-200 dark:border-green-800 flex-shrink-0">New</span>}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5">
                            <span className="flex items-center gap-1 font-medium whitespace-nowrap">{getTypeIcon(item.type)} {item.type}</span>
                            {item.piece && <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>}
                            {item.piece && <span className="italic text-slate-600 dark:text-slate-400 truncate">"{item.piece}"</span>}
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove from Queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard / Performer History */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <h3 className="text-xl font-bold mb-6 text-webster-blue dark:text-webster-gold">Performer Stats & Adjustments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold border-b-2 border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="pb-3 pl-2 min-w-[120px]">Performer</th>
                  <th className="pb-3 text-center min-w-[120px]">Performances</th>
                  <th className="pb-3 text-center min-w-[140px]">Total Tickets</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                {performers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg mt-2 " border="0">No performers yet.</td>
                  </tr>
                ) : (
                  [...performers].sort((a, b) => b.count - a.count).map(p => (
                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                      <td className="py-3 pl-2 font-bold text-slate-800 dark:text-slate-200 break-words">{p.name}</td>

                      {/* Performance Adjuster */}
                      <td className="py-3 text-center">
                        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                          <button onClick={() => adjustManualCount(p.id, -1)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors rounded-l-lg hover:text-red-500" title="Decrease Count"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="w-8 font-mono text-sm font-bold text-webster-blue dark:text-webster-gold text-center">{p.count}</span>
                          <button onClick={() => adjustManualCount(p.id, 1)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors rounded-r-lg hover:text-green-500" title="Increase Count"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>

                      {/* Ticket Adjuster */}
                      <td className="py-3 text-center">
                        <div className="inline-flex items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg shadow-sm">
                          <button onClick={() => adjustManualBonus(p.id, -1)} className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-500 transition-colors rounded-l-lg" title="Decrease Bonus Tickets"><Minus className="w-3.5 h-3.5" /></button>
                          <div className="w-12 inline-flex items-center gap-1 justify-center font-bold text-amber-600 dark:text-amber-500">
                            <Ticket className="w-3 h-3" />
                            {calculateTickets(p.count, p.bonusTickets || 0)}
                          </div>
                          <button onClick={() => adjustManualBonus(p.id, 1)} className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-500 transition-colors rounded-r-lg" title="Increase Bonus Tickets"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer / Reset */}
        <div className="flex justify-center pt-8 pb-12">
          <button
            onClick={resetEvent}
            className="flex items-center gap-2 px-6 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-medium border border-transparent hover:border-red-100 dark:hover:border-red-800"
          >
            <Trash2 className="w-4 h-4" />
            Reset Event
          </button>
        </div>

      </div>
    </div>
  )
}

export default App
