import { useState, useEffect } from 'react'
import { PlusCircle, Mic, Music, Smile, User, Ticket } from 'lucide-react'

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

  // Input State
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('Poetry')

  // Persistence
  useEffect(() => {
    localStorage.setItem('openMicPerformers', JSON.stringify(performers))
    localStorage.setItem('openMicQueue', JSON.stringify(queue))
    localStorage.setItem('openMicCurrent', JSON.stringify(currentPerformer))
  }, [performers, queue, currentPerformer])

  // Logic
  const calculateTickets = (count) => {
    // 2 tickets for first performance (base) + 2 for each subsequent? 
    // Prompt: "Everyone gets 2 raffle tickets for performing, the more you perform, the more raffle tickets you get (max of 7 per person)."
    // Let's implement: 2 tickets per performance, capped at 7 total.
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
    } else {
      // Update type if they changed it? adhere to latest.
      // But maybe they want to do Comedy this time even if they did Poetry Last time.
      // Let's allow type update.
      // Actually, we shouldn't mutate the 'performers' array directly if it's state, but here we are finding.
      // Correct approach: Update the performer in the performers list if needed, or just use the ID in the queue.
      // For simplicity, let's just store the queue item with all current details.
    }

    // Check if already in queue or current
    if (queue.find(q => q.performerId === performer.id) || (currentPerformer && currentPerformer.performerId === performer.id)) {
      alert(`${performer.name} is already in the queue or performing!`)
      return
    }

    const queueItem = {
      id: generateId(), // unique queue entry id
      performerId: performer.id,
      name: performer.name,
      type: newType,
      count: performer.count, // snapshot of count at entry time? Or reference? 
      // If we sort by count, we should use their CURRENT count.
      // So when sorting, we should look up the performer's count.
      // But for simplicity, let's store it here and update it when they finish?
      // No, if they are stuck in queue, their count is static until they perform.
      timestamp: Date.now()
    }

    setQueue([...queue, queueItem])
    setNewName('')
  }

  // Priority Queue Logic
  // Sort by: count ASC, then timestamp ASC
  const getSortedQueue = () => {
    return [...queue].sort((a, b) => {
      // Primary: Performance Count
      // We need to look up the LIVE count from performers array to be safe, 
      // though it shouldn't change while they are in queue (unless we have bugs).
      const perfA = performers.find(p => p.id === a.performerId)
      const perfB = performers.find(p => p.id === b.performerId)

      const countA = perfA ? perfA.count : 0
      const countB = perfB ? perfB.count : 0

      if (countA !== countB) return countA - countB

      // Secondary: Time waited
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

    // Update performer stats
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Poetry': return <Mic className="w-4 h-4" />
      case 'Karaoke': return <Music className="w-4 h-4" />
      case 'Comedy': return <Smile className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-700 pb-6 text-center sm:text-left gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Performances Tracker
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">Poetry • Karaoke • Comedy</p>
          </div>
          <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-0 bg-slate-800/50 sm:bg-transparent px-4 py-2 sm:p-0 rounded-full sm:rounded-none">
            <div className="text-xs sm:text-sm text-slate-400">Total Performers</div>
            <div className="text-lg sm:text-2xl font-bold text-white sm:text-right">{performers.length}</div>
          </div>
        </header>

        {/* Current Performer */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 blur"></div>
          <div className="relative bg-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">

            {currentPerformer ? (
              <>
                <div className="flex-1 text-center sm:text-left">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-3 border border-purple-500/20">
                    {getTypeIcon(currentPerformer.type)}
                    {currentPerformer.type}
                  </span>
                  <h2 className="text-4xl font-bold text-white mb-2">{currentPerformer.name}</h2>
                  <p className="text-slate-400 animate-pulse">Now Performing...</p>
                </div>
                <button
                  onClick={finishPerformance}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-lg transform transition hover:scale-105 shadow-lg active:scale-95"
                >
                  Finish Performance
                </button>
              </>
            ) : (
              <div className="flex-1 text-center py-4">
                <h2 className="text-2xl font-bold text-slate-500">Stage is Empty</h2>
                <p className="text-slate-600">Waiting for the next performer...</p>
                {sortedQueue.length > 0 && (
                  <button
                    onClick={startNext}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition"
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
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-purple-400" />
              Sign Up Performer
            </h3>
            <form onSubmit={addToQueue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-slate-600"
                  placeholder="Enter performer name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Performance Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Poetry', 'Karaoke', 'Comedy'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewType(type)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${newType === type
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
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
                className="w-full py-3.5 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg sm:text-base"
              >
                Add to Queue
              </button>
            </form>
          </div>

          {/* Queue List */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-xs">
                  {queue.length}
                </span>
                Up Next
              </h3>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                Prioritized by least performances
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {sortedQueue.length === 0 ? (
                <div className="text-center py-8 text-slate-500 italic">
                  The queue is empty.
                </div>
              ) : (
                sortedQueue.map((item, index) => {
                  const pData = performers.find(p => p.id === item.performerId)
                  const isNew = pData?.count === 0
                  return (
                    <div key={item.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg border border-slate-600 hover:border-indigo-500 transition group">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-slate-500 text-sm">#{index + 1}</div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {item.name}
                            {isNew && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">New</span>}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            {getTypeIcon(item.type)} {item.type}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Performances</div>
                        <div className="font-mono font-bold text-indigo-400">{pData?.count || 0}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard / Performer History */}
        <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700/50">
          <h3 className="text-xl font-bold mb-6 text-slate-200">Performer Stats</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-slate-400 text-sm border-b border-slate-700">
                <tr>
                  <th className="pb-3 pl-2">Performer</th>
                  <th className="pb-3 text-center">Performances</th>
                  <th className="pb-3 text-center">Total Tickets</th>
                  <th className="pb-3 text-right pr-2">Last Seen</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {performers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">No performers yet.</td>
                  </tr>
                ) : (
                  [...performers].sort((a, b) => b.count - a.count).map(p => (
                    <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                      <td className="py-4 pl-2 font-bold">{p.name}</td>
                      <td className="py-4 text-center">
                        <span className="inline-block px-2 py-1 bg-slate-700 rounded-md font-mono text-sm">
                          {p.count}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <Ticket className="w-4 h-4" />
                          {calculateTickets(p.count)}
                        </div>
                      </td>
                      <td className="py-4 text-right pr-2 text-sm text-slate-400">
                        {p.lastPerformed ? new Date(p.lastPerformed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
