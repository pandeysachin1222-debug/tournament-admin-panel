import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Tournament, TournamentStatus } from '../types';
import { Trophy, Plus, Calendar, Gamepad2, Users, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    game: '',
    entryFee: 0,
    maxPlayers: 100,
    commissionRate: 15,
    startTime: '',
    status: 'upcoming' as TournamentStatus
  });

  // Calculate Prize Pool and Profit
  const totalCollection = formData.entryFee * formData.maxPlayers;
  const profit = Math.round(totalCollection * (formData.commissionRate / 100));
  const prizePool = totalCollection - profit;

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'tournaments'), orderBy('startTime', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
      setTournaments(data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tournaments'), {
        ...formData,
        prizePool,
        profit,
        players: [],
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({ 
        title: '', 
        game: '', 
        entryFee: 0, 
        maxPlayers: 100, 
        commissionRate: 15, 
        startTime: '', 
        status: 'upcoming' 
      });
      fetchTournaments();
    } catch (error) {
      console.error('Error adding tournament:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    try {
      await deleteDoc(doc(db, 'tournaments', id));
      fetchTournaments();
    } catch (error) {
      console.error('Error deleting tournament:', error);
    }
  };

  const updateStatus = async (id: string, status: TournamentStatus) => {
    try {
      await updateDoc(doc(db, 'tournaments', id), { status });
      fetchTournaments();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEdit = (t: Tournament) => {
    setSelectedTournament(t);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    try {
      await updateDoc(doc(db, 'tournaments', selectedTournament.id), {
        roomId: selectedTournament.roomId || '',
        roomPass: selectedTournament.roomPass || '',
        prizePool: selectedTournament.prizePool,
        status: selectedTournament.status
      });
      setIsEditModalOpen(false);
      fetchTournaments();
    } catch (error) {
      console.error('Error updating tournament:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tournaments</h2>
          <p className="text-zinc-400 mt-1">Manage and create gaming tournaments.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-zinc-950 rounded-2xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          New Tournament
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-zinc-900 rounded-3xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((t) => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl group hover:border-emerald-500/50 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-zinc-800 rounded-2xl group-hover:bg-emerald-500/10 transition-colors">
                  <Gamepad2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(t)} className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">{t.title}</h3>
              <p className="text-zinc-400 text-sm mb-6">{t.game}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-zinc-800/50 p-3 rounded-2xl">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Entry Fee</p>
                  <p className="font-bold text-emerald-500">${t.entryFee}</p>
                </div>
                <div className="bg-zinc-800/50 p-3 rounded-2xl">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Prize Pool</p>
                  <p className="font-bold text-emerald-500">${t.prizePool}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-800/50 p-3 rounded-2xl border border-emerald-500/10">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Commission</p>
                  <p className="font-bold text-zinc-300">{t.commissionRate}%</p>
                </div>
                <div className="bg-zinc-800/50 p-3 rounded-2xl border border-emerald-500/10">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Est. Profit</p>
                  <p className="font-bold text-emerald-400">${t.profit}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-800/50 p-3 rounded-2xl border border-emerald-500/10">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Room ID</p>
                  <p className="font-mono text-sm text-zinc-300">{t.roomId || 'Not Set'}</p>
                </div>
                <div className="bg-zinc-800/50 p-3 rounded-2xl border border-emerald-500/10">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Password</p>
                  <p className="font-mono text-sm text-zinc-300">{t.roomPass || 'Not Set'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(t.startTime).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {t.players?.length || 0} Joined
                  </div>
                </div>
                <select 
                  value={t.status}
                  onChange={(e) => updateStatus(t.id, e.target.value as TournamentStatus)}
                  className="bg-zinc-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">New Tournament</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Tournament Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Pro League Season 1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Game Name</label>
                  <input
                    required
                    type="text"
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Call of Duty Mobile"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Entry Fee ($)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.entryFee}
                      onChange={(e) => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                      className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Max Players</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.maxPlayers}
                      onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                      className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Commission (%)</label>
                    <select
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                      className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={10}>10%</option>
                      <option value={11}>11%</option>
                      <option value={12}>12%</option>
                      <option value={13}>13%</option>
                      <option value={14}>14%</option>
                      <option value={15}>15%</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400 text-emerald-500">Auto Prize Pool ($)</label>
                    <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-500 font-bold">
                      ${prizePool}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Total Collection:</span>
                    <span className="text-zinc-200 font-medium">${totalCollection}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Admin Profit ({formData.commissionRate}%):</span>
                    <span className="text-emerald-500 font-bold">${profit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Start Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 text-zinc-950 rounded-2xl font-bold hover:bg-emerald-400 transition-all mt-4"
                >
                  Create Tournament
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedTournament && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Manage Tournament</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Room ID</label>
                    <input
                      type="text"
                      value={selectedTournament.roomId || ''}
                      onChange={(e) => setSelectedTournament({ ...selectedTournament, roomId: e.target.value })}
                      className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter Room ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Room Password</label>
                    <input
                      type="text"
                      value={selectedTournament.roomPass || ''}
                      onChange={(e) => setSelectedTournament({ ...selectedTournament, roomPass: e.target.value })}
                      className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter Password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Prize Pool ($)</label>
                  <input
                    required
                    type="number"
                    value={selectedTournament.prizePool}
                    onChange={(e) => setSelectedTournament({ ...selectedTournament, prizePool: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Match Status</label>
                  <select
                    value={selectedTournament.status}
                    onChange={(e) => setSelectedTournament({ ...selectedTournament, status: e.target.value as TournamentStatus })}
                    className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 text-zinc-950 rounded-2xl font-bold hover:bg-emerald-400 transition-all mt-4"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
