import { X, Check } from 'lucide-react'

export function WelcomeModal({ isOpen, onClose }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-webster-blue p-6 text-white text-center">
                    <h2 className="text-2xl font-bold mb-2">Welcome to Performances Tracker!</h2>
                    <p className="text-blue-100/80 text-sm">Your all-in-one Open Mic management tool.</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 text-slate-600">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-webster-gold/20 flex items-center justify-center text-webster-blue font-bold">1</div>
                            <div>
                                <h3 className="font-bold text-slate-800">Add Performers</h3>
                                <p className="text-sm">Sign up performers with their name, type, and optional piece. Returning performers will auto-complete!</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-webster-gold/20 flex items-center justify-center text-webster-blue font-bold">2</div>
                            <div>
                                <h3 className="font-bold text-slate-800">Fair Queue System</h3>
                                <p className="text-sm">The queue automatically prioritizes performers who haven't performed as much, ensuring everyone gets a turn.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-webster-gold/20 flex items-center justify-center text-webster-blue font-bold">3</div>
                            <div>
                                <h3 className="font-bold text-slate-800">Track & Reward</h3>
                                <p className="text-sm">Performers earn raffle tickets (2 per performance, up to 7). History is saved automatically.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-6 py-2.5 bg-webster-blue hover:bg-blue-900 text-white font-bold rounded-lg transition shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Check className="w-4 h-4" />
                        Got it, let's go!
                    </button>
                </div>
            </div>
        </div>
    )
}
