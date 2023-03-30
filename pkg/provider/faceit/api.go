package faceit

const (
	TeamAKey = "faction1"
	TeamBKey = "faction2"
)

type MatchData struct {
	End   int64 `json:"end"`
	From  int64 `json:"from"`
	Items []struct {
		CompetitionID   string   `json:"competition_id"`
		CompetitionName string   `json:"competition_name"`
		CompetitionType string   `json:"competition_type"`
		FaceitURL       string   `json:"faceit_url"`
		FinishedAt      int64    `json:"finished_at"`
		GameID          string   `json:"game_id"`
		GameMode        string   `json:"game_mode"`
		MatchID         string   `json:"match_id"`
		MatchType       string   `json:"match_type"`
		MaxPlayers      int64    `json:"max_players"`
		OrganizerID     string   `json:"organizer_id"`
		PlayingPlayers  []string `json:"playing_players"`
		Region          string   `json:"region"`
		Results         struct {
			Score  map[string]int64 `json:"score"`
			Winner string           `json:"winner"`
		} `json:"results"`
		StartedAt int64  `json:"started_at"`
		Status    string `json:"status"`
		Teams     map[string]struct {
			Avatar   string   `json:"avatar"`
			Nickname string   `json:"nickname"`
			Players  []Player `json:"players"`
			TeamID   string   `json:"team_id"`
			Type     string   `json:"type"`
		} `json:"teams"`
		TeamsSize int64 `json:"teams_size"`
	} `json:"items"`
	Start int64 `json:"start"`
	To    int64 `json:"to"`
}

type Player struct {
	Avatar         string `json:"avatar"`
	FaceitURL      string `json:"faceit_url"`
	GamePlayerID   string `json:"game_player_id"`
	GamePlayerName string `json:"game_player_name"`
	Nickname       string `json:"nickname"`
	PlayerID       string `json:"player_id"`
	SkillLevel     int64  `json:"skill_level"`
}

type GameStats struct {
	Rounds []struct {
		BestOf        string      `json:"best_of"`
		CompetitionID interface{} `json:"competition_id"`
		GameID        string      `json:"game_id"`
		GameMode      string      `json:"game_mode"`
		MatchID       string      `json:"match_id"`
		MatchRound    string      `json:"match_round"`
		Played        string      `json:"played"`
		RoundStats    struct {
			Map    string `json:"Map"`
			Region string `json:"Region"`
			Score  string `json:"Score"`
			Winner string `json:"Winner"`
			Rounds string `json:"Rounds"`
		} `json:"round_stats"`
		Teams []struct {
			TeamID    string `json:"team_id"`
			Premade   bool   `json:"premade"`
			TeamStats struct {
				OvertimeScore   string `json:"Overtime score"`
				FirstHalfScore  string `json:"First Half Score"`
				SecondHalfScore string `json:"Second Half Score"`
				Team            string `json:"Team"`
				TeamWin         string `json:"Team Win"`
				TeamHeadshots   string `json:"Team Headshots"`
				FinalScore      string `json:"Final Score"`
			} `json:"team_stats"`
			Players []struct {
				PlayerID    string `json:"player_id"`
				Nickname    string `json:"nickname"`
				PlayerStats struct {
					KRRatio      string `json:"K/R Ratio"`
					KDRatio      string `json:"K/D Ratio"`
					Headshots    string `json:"Headshots"`
					PentaKills   string `json:"Penta Kills"`
					HeadshotsPct string `json:"Headshots %"`
					MVPs         string `json:"MVPs"`
					Kills        string `json:"Kills"`
					Assists      string `json:"Assists"`
					Result       string `json:"Result"`
					TripleKills  string `json:"Triple Kills"`
					Deaths       string `json:"Deaths"`
					QuadroKills  string `json:"Quadro Kills"`
				} `json:"player_stats"`
			} `json:"players"`
		} `json:"teams"`
	} `json:"rounds"`
}
