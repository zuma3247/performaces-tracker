import { useState, useEffect } from 'react'
import { PlusCircle, Mic, Music, Smile, User, Ticket, Trash2 } from 'lucide-react'
import { WelcomeModal } from './components/WelcomeModal'

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

  // Input State
  const [newName, setNewName] = useState('')
  const [newPiece, setNewPiece] = useState('')
  const [newType, setNewType] = useState('Poetry')

  // Persistence
  useEffect(() => {
    localStorage.setItem('openMicPerformers', JSON.stringify(performers))
    localStorage.setItem('openMicQueue', JSON.stringify(queue))
    localStorage.setItem('openMicCurrent', JSON.stringify(currentPerformer))
  }, [performers, queue, currentPerformer])

  const handleCloseWelcome = () => {
    setShowWelcome(false)
    localStorage.setItem('openMicHasSeenWelcome', 'true')
  }

  // Logic
  const calculateTickets = (count) => {
    const tickets = count * 2
    return Math.min(tickets, 7)
  }

  const addToQueue = (e) => {
    e.preventDefault()
    if (!newName.trim()) return

    // Check if performer already exists in history
    let performer = performers.find(p => p.name.toLowerCase() === newName.trim().toLowerCase())

    if (!performer) {
      // Create new performer
      performer = {
        id: generateId(),
        name: newName.trim(),
        type: newType,
        count: 0
      }
      setPerformers([...performers, performer])
    }

    // Check if already in queue or current
    if (queue.find(q => q.performerId === performer.id) || (currentPerformer && currentPerformer.performerId === performer.id)) {
      alert(`${performer.name} is already in the queue or performing!`)
      return
    }

    const queueItem = {
      id: generateId(),
      performerId: performer.id,
      name: performer.name,
      type: newType,
      piece: newPiece.trim(),
      count: performer.count,
      timestamp: Date.now()
    }

    setQueue([...queue, queueItem])
    setNewName('')
    setNewPiece('')
  }

  // Priority Queue Logic
  const getSortedQueue = () => {
    return [...queue].sort((a, b) => {
      const perfA = performers.find(p => p.id === a.performerId)
      const perfB = performers.find(p => p.id === b.performerId)

      const countA = perfA ? perfA.count : 0
      const countB = perfB ? perfB.count : 0

      if (countA !== countB) return countA - countB
      return a.timestamp - b.timestamp
    })
  }

  const sortedQueue = getSortedQueue()

  const startNext = () => {
    if (sortedQueue.length === 0) return
    const next = sortedQueue[0]
    setCurrentPerformer({
      ...next,
      startTime: Date.now()
    })
    setQueue(queue.filter(q => q.id !== next.id))
  }

  const finishPerformance = () => {
    if (!currentPerformer) return

    setPerformers(prev => prev.map(p => {
      if (p.id === currentPerformer.performerId) {
        return {
          ...p,
          count: p.count + 1,
          lastPerformed: Date.now()
        }
      }
      return p
    }))

    setCurrentPerformer(null)
  }

  const resetEvent = () => {
    if (window.confirm("Are you sure you want to end the event? This will clear ALL data (Queue, Current Performer, and History).")) {
      setPerformers([])
      setQueue([])
      setCurrentPerformer(null)
      localStorage.removeItem('openMicPerformers')
      localStorage.removeItem('openMicQueue')
      localStorage.removeItem('openMicCurrent')
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-webster-gold selection:text-webster-blue">
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-6 text-center sm:text-left gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-webster-blue">
              Performances Tracker
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base font-medium">Poetry • Karaoke • Comedy</p>
          </div>
          <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-0 bg-slate-100 sm:bg-transparent px-4 py-2 sm:p-0 rounded-full sm:rounded-none">
            <div className="text-xs sm:text-sm text-slate-500 uppercase tracking-wider font-bold">Total Performers</div>
            <div className="text-lg sm:text-2xl font-bold text-webster-blue sm:text-right">{performers.length}</div>
          </div>
        </header>

        {/* Current Performer */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-webster-gold rounded-2xl opacity-75 blur"></div>
          <div className="relative bg-webster-blue rounded-xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-webster-gold opacity-10 rounded-full blur-2xl"></div>

            {currentPerformer ? (
              <>
                <div className="flex-1 text-center sm:text-left relative z-10">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-webster-gold/20 text-webster-gold text-sm font-bold mb-3 border border-webster-gold/30">
                    {getTypeIcon(currentPerformer.type)}
                    {currentPerformer.type}
                  </span>
                  <h2 className="text-4xl font-bold text-white mb-1">{currentPerformer.name}</h2>
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
                <p className="text-slate-300">Waiting for the next performer...</p>
                {sortedQueue.length > 0 && (
                  <button
                    onClick={startNext}
                    className="mt-4 px-6 py-2 bg-webster-gold text-webster-blue font-bold rounded-lg hover:shadow-lg hover:scale-105 transition"
                  >
                    Call Next: {sortedQueue[0].name}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sign Up Form */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-webster-blue">
              <PlusCircle className="text-webster-gold" />
              Sign Up Performer
            </h3>
            <form onSubmit={addToQueue} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  list="performer-names"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-webster-gold text-slate-900 placeholder-slate-400 transition"
                  placeholder="Enter performer name..."
                />
                <datalist id="performer-names">
                  {[...new Set(performers.map(p => p.name))].sort().map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Piece (Optional)</label>
                <input
                  type="text"
                  value={newPiece}
                  onChange={(e) => setNewPiece(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-webster-gold text-slate-900 placeholder-slate-400 transition"
                  placeholder="Song title, poem name, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Performance Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Poetry', 'Karaoke', 'Comedy'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewType(type)}
                      className={`py-2 px-3 rounded-lg text-sm font-bold border transition ${newType === type
                        ? 'bg-webster-blue text-white border-webster-blue'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-webster-blue/50'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={!newName.trim()}
                className="w-full py-3.5 sm:py-3 bg-webster-blue hover:bg-blue-900 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg sm:text-base border-b-4 border-blue-900 active:border-b-0 active:translate-y-1"
              >
                Add to Queue
              </button>
            </form>
          </div>

          {/* Queue List */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-webster-blue">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-webster-gold text-webster-blue text-xs font-bold">
                  {queue.length}
                </span>
                Up Next
              </h3>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded font-medium border border-slate-200">
                Prioritized by least performances
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {sortedQueue.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  The queue is empty.
                </div>
              ) : (
                sortedQueue.map((item, index) => {
                  const pData = performers.find(p => p.id === item.performerId)
                  const isNew = pData?.count === 0
                  return (
                    <div key={item.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-webster-gold transition group">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-slate-400 text-sm font-bold min-w-[20px]">#{index + 1}</div>
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            {item.name}
                            {isNew && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-green-200">New</span>}
                          </div>
                          <div className="text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="flex items-center gap-1 font-medium">{getTypeIcon(item.type)} {item.type}</span>
                            {item.piece && <span className="hidden sm:inline text-slate-300">•</span>}
                            {item.piece && <span className="italic text-slate-600">"{item.piece}"</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Perfs</div>
                        <div className="font-mono font-bold text-webster-blue text-lg leading-none">{pData?.count || 0}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard / Performer History */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold mb-6 text-webster-blue">Performer Stats</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-slate-500 text-xs uppercase tracking-wider font-bold border-b-2 border-slate-100">
                <tr>
                  <th className="pb-3 pl-2">Performer</th>
                  <th className="pb-3 text-center">Performances</th>
                  <th className="pb-3 text-center">Total Tickets</th>
                  <th className="pb-3 text-right pr-2">Last Seen</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {performers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg mt-2 ">No performers yet.</td>
                  </tr>
                ) : (
                  [...performers].sort((a, b) => b.count - a.count).map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-4 pl-2 font-bold text-slate-800">{p.name}</td>
                      <td className="py-4 text-center">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-md font-mono text-sm font-bold text-webster-blue">
                          {p.count}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="inline-flex items-center gap-1 text-amber-500 font-bold justify-center bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                          <Ticket className="w-4 h-4" />
                          {calculateTickets(p.count)}
                        </div>
                      </td>
                      <td className="py-4 text-right pr-2 text-sm text-slate-400 font-medium">
                        {p.lastPerformed ? new Date(p.lastPerformed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
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
            className="flex items-center gap-2 px-6 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition font-medium border border-transparent hover:border-red-100"
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
