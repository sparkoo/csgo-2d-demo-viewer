package match

type MatchInfo struct {
	Id           string    `json:"matchId"`
	Host         MatchHost `json:"hostPlatform"`
	DateTime     string    `json:"dateTime"`
	Map          string    `json:"map"`
	Type         string    `json:"type"`
	TeamA        string    `json:"teamA"`
	TeamAPlayers []string  `json:"teamAPlayers"`
	ScoreA       int       `json:"scoreA"`
	TeamB        string    `json:"teamB"`
	TeamBPlayers []string  `json:"teamBPlayers"`
	ScoreB       int       `json:"scoreB"`
	DemoLink     string    `json:"demoLink"`
	MatchLink    string    `json:"matchLink"`
}

type MatchHost string
