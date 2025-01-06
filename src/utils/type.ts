
export interface Player  {
    userId: string;
    level: number;
    username: string;
    coinsPerLevel: { level: number; coins: number }[];
    name: string;
  };
  
export interface Tournament  {
    id?: string;
    name: string;
    creatorId: string;
    players: Player[];
    numberOfPlayers: number;
    status: "running" | "ended";
    startDate: number;
    tournamentQuestIndexes: number[];
    winnerId?: string;
  };