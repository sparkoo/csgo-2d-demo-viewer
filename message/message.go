package message

import "github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"

type messageType int

const (
	TeamUpdateType   messageType = 0
	PlayerUpdateType messageType = 1
	AddPlayerType    messageType = 2
	RemovePlayerType messageType = 3
)

type Message struct {
	MsgType       messageType `json:"msgType"`
	Tick          int         `json:"tick"`
	*TeamUpdate   `json:"teamUpdate,omitempty"`
	*PlayerUpdate `json:"playerUpdate,omitempty"`
}

type TeamUpdate struct {
	TName   string
	TScore  int
	CTName  string
	CTScore int
}

type PlayerUpdate struct {
	TPlayers  []Player
	CTPlayers []Player
}

type Player struct {
	Name string
	X    float64
	Y    float64
	Z    float64
}

func CreateTeamUpdateMessage(tick demoinfocs.GameState) *Message {
	return &Message{
		MsgType: TeamUpdateType,
		Tick:    tick.IngameTick(),
		TeamUpdate: &TeamUpdate{
			TName:   tick.TeamTerrorists().ClanName(),
			TScore:  tick.TeamTerrorists().Score(),
			CTName:  tick.TeamCounterTerrorists().ClanName(),
			CTScore: tick.TeamCounterTerrorists().Score(),
		},
	}
}
