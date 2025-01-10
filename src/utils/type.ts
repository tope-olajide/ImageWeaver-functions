
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
  
export interface GameData {
  userId: string;
  level: number;
  coins: number;
  currentQuestArrayNumber: number;
  currentQuest: {
    word: string;
    imageURL: string;
    hint: string;
  };
  foundQuestsIndex: number[];
};