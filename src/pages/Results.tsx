import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { Tournament, TournamentResult } from '../types';
import { FileText, Trophy, Plus, Trash2, Medal, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Results() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [winners, setWinners] = useState([
    { userId: '', rank: 1, prize: 0 }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tSnap = await getDocs(query(
        collection(db, 'tournaments'), 
        where('status', 'in', ['ongoing', 'completed'])
      ));

      setTournaments(
        tSnap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Tournament, 'id'>)
        }))
      );

      const rSnap = await getDocs(collection(db, 'results'));

      setResults(
        rSnap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<TournamentResult, 'id'>)
        }))
      );

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

        const resultRef = doc(collection(db, 'results'));
        transaction.set(resultRef, {
          tournamentId: selectedTournament,
          winners,
          uploadedAt: new Date().toISOString()
        });

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

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tournament Results</h2>
          <p className="text-zinc-400 mt-1">Upload results and distribute prizes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-zinc-950 rounded-2xl font-bold"
        >
          <Plus className="w-5 h-5" />
          Upload Results
        </button>
      </div>

      {/* RESULTS LIST */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1, 2].map(i => (
            <div key={i} className="h-40 bg-zinc-900 rounded-3xl animate-pulse" />
          ))
        ) : results.length === 0 ? (
          <div className="bg-zinc-900 p-12 text-center rounded-3xl">
            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No results uploaded yet.</p>
          </div>
        ) : (
          results.map((res) => {
            const tournament = tournaments.find(t => t.id === res.tournamentId);

            return (
              <div key={res.id || Math.random()} className="bg-zinc-900 p-8 rounded-3xl">

                <div className="flex items-center gap-4 mb-6">
                  <Trophy className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h3 className="text-xl font-bold">
                      {tournament?.title || 'Unknown Tournament'}
                    </h3>
                    <p className="text-zinc-500 text-sm">
                      {res.uploadedAt 
                        ? new Date(res.uploadedAt).toLocaleDateString() 
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(res.winners || []).map((winner, idx) => (
                    <div key={idx} className="bg-zinc-800 p-6 rounded-2xl">

                      <div className="flex justify-between mb-4">
                        <span className="font-bold">{winner.rank || idx + 1}</span>
                        <Medal className={cn(
                          winner.rank === 1 ? "text-yellow-500" :
                          winner.rank === 2 ? "text-zinc-400" :
                          "text-amber-700"
                        )} />
                      </div>

                      <p className="text-sm truncate">{winner.userId || "N/A"}</p>
                      <p className="text-lg text-emerald-500 font-bold">
                        ${winner.prize || 0}
                      </p>

                    </div>
                  ))}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-900 p-6 rounded-2xl w-full max-w-2xl"
            >
              <h3 className="text-xl font-bold mb-4">Upload Results</h3>

              <form onSubmit={handleSubmit} className="space-y-4">

                <select
                  required
                  value={selectedTournament}
                  onChange={(e) => setSelectedTournament(e.target.value)}
                  className="w-full p-2 bg-zinc-800 rounded"
                >
                  <option value="">Select Tournament</option>
                  {tournaments.filter(t => !t.resultDeclared).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title || "No Title"}
                    </option>
                  ))}
                </select>

                {winners.map((winner, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      placeholder="User ID"
                      value={winner.userId}
                      onChange={(e) => {
                        const newWinners = [...winners];
                        newWinners[index].userId = e.target.value;
                        setWinners(newWinners);
                      }}
                      className="flex-1 p-2 bg-zinc-800 rounded"
                    />
                    <input
                      type="number"
                      placeholder="Prize"
                      value={winner.prize}
                      onChange={(e) => {
                        const newWinners = [...winners];
                        newWinners[index].prize = Number(e.target.value);
                        setWinners(newWinners);
                      }}
                      className="w-24 p-2 bg-zinc-800 rounded"
                    />
                  </div>
                ))}

                <button type="button" onClick={handleAddWinner}>
                  + Add Winner
                </button>

                <button type="submit" className="w-full bg-emerald-500 p-3 rounded">
                  Submit
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
