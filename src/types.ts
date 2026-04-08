export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  walletBalance: number;
  createdAt: string;
}

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Tournament {
  id: string;
  title: string;
  game: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  commissionRate: number;
  profit: number;
  startTime: string;
  status: TournamentStatus;
  players: string[];
  roomId?: string;
  roomPass?: string;
  resultDeclared?: boolean;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface FinancialRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: RequestStatus;
  createdAt: string;
  type: 'recharge' | 'withdraw';
  upiId?: string;
}

export interface TournamentResult {
  id: string;
  tournamentId: string;
  winners: {
    userId: string;
    rank: number;
    prize: number;
  }[];
  uploadedAt: string;
}
