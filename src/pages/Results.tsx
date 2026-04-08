import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, where, doc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { Tournament, TournamentResult } from '../types';
import { FileText, Trophy, Plus, Trash2, Medal, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Results() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [winners, setWinners] = useState<{ userId: string; rank: number; prize: number }[]>([
    { userId: '', rank: 1, prize: 0 }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tournaments that are ongoing or completed but results not yet declared
      const tSnap = await getDocs(query(
        collection(db, 'tournaments'), 
        where('status', 'in', ['ongoing', 'completed'])
      ));
      setTournaments(tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament)));

      const rSnap = await getDocs(collection(db, 'results'));
      setResults(rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TournamentResult)));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddWinner = () => {
    setWinners([...winners, { userId: '', rank: winners.length + 1, prize: 0 }]);
  };

  const handleRemoveWinner = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Save result in "results" collection
        const resultRef = doc(collection(db, 'results'));
        transaction.set(resultRef, {
          tournamentId: selectedTournament,
          winners,
          uploadedAt: new Date().toISOString()
        });

        // 2. Update winner wallet: walletBalance = walletBalance + prize
        for (const winner of winners) {
          if (winner.userId && winner.prize > 0) {
            const userRef = doc(db, 'users', winner.userId);
            const userDoc = await transaction.get(userRef);
            if (userDoc.exists()) {
              const currentBalance = userDoc.data().walletBalance || 0;
              transaction.update(userRef, {
                walletBalance: currentBalance + winner.prize
              });
            }
          }
        }

        // 3. Update tournament: resultDeclared = true, status = "completed"
        const tournamentRef = doc(db, 'tournaments', selectedTournament);
        transaction.update(tournamentRef, {
          resultDeclared: true,
          status: 'completed'
        });
      });

      setIsModalOpen(false);
      setSelectedTournament('');
      setWinners([{ userId: '', rank: 1, prize: 0 }]);
      fetchData();
    } catch (error) {
      console.error('Error uploading results:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tournament Results</h2>
          <p className="text-zinc-400 mt-1">Upload results and distribute prizes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-zinc-950 rounded-2xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Upload Results
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-40 bg-zinc-900 rounded-3xl animate-pulse" />)
        ) : results.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 p-12 text-center rounded-3xl">
            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No results uploaded yet.</p>
          </div>
        ) : (
          results.map((res) => {
            const tournament = tournaments.find(t => t.id === res.tournamentId);
            return (
              <div key={res.id} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-zinc-800">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <Trophy className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{tournament?.title || 'Unknown Tournament'}</h3>
                    <p className="text-zinc-500 text-sm">Uploaded on {new Date(res.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {res.winners.map((winner, idx) => (
                    <div key={idx} className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold text-sm">
                          {winner.rank}
                        </div>
                        <Medal className={cn(
                          "w-5 h-5",
                          winner.rank === 1 ? "text-yellow-500" :
                          winner.rank === 2 ? "text-zinc-400" :
                          "text-amber-700"
                        )} />
                      </div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">User ID</p>
                      <p className="text-sm font-medium mb-3 truncate">{winner.userId}</p>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Prize Won</p>
                      <p className="text-lg font-bold text-emerald-500">${winner.prize}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Upload Results</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Select Tournament</label>
                  <select
                    required
                    value={selectedTournament}
                    onChange={(e) => setSelectedTournament(e.target.value)}
                    className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Choose a completed tournament...</option>
                    {tournaments.filter(t => !t.resultDeclared).map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-400">Winners & Prizes</label>
                    <button
                      type="button"
                      onClick={handleAddWinner}
                      className="text-xs font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider"
                    >
                      + Add Winner
                    </button>
                  </div>

                  {winners.map((winner, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-end bg-zinc-800/30 p-4 rounded-2xl border border-zinc-800">
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500">Rank</label>
                        <input
                          type="number"
                          value={winner.rank}
                          onChange={(e) => {
                            const newWinners = [...winners];
                            newWinners[index].rank = Number(e.target.value);
                            setWinners(newWinners);
                          }}
                          className="w-full bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="col-span-5 space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500">User ID</label>
                        <input
                          required
                          type="text"
                          placeholder="User UID"
                          value={winner.userId}
                          onChange={(e) => {
                            const newWinners = [...winners];
                            newWinners[index].userId = e.target.value;
                            setWinners(newWinners);
                          }}
                          className="w-full bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="col-span-4 space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500">Prize ($)</label>
                        <input
                          required
                          type="number"
                          value={winner.prize}
                          onChange={(e) => {
                            const newWinners = [...winners];
                            newWinners[index].prize = Number(e.target.value);
                            setWinners(newWinners);
                          }}
                          className="w-full bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="col-span-1 pb-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveWinner(index)}
                          className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 text-zinc-950 rounded-2xl font-bold hover:bg-emerald-400 transition-all mt-4 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Publish Results
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
