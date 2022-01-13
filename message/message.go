package message

import "github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"

type messageType int

const (
	TeamUpdate   messageType = 0
	PlayerUpdate messageType = 1
)

type Message struct {
	MsgType      messageType          `json:"msgType"`
	Tick         int                  `json:"tick"`
	TeamUpdate   *MessageTeamUpdate   `json:"teamUpdate,omitempty"`
	PlayerUpdate *MessagePlayerUpdate `json:"playerUpdate,omitempty"`
}

type MessageTeamUpdate struct {
	TName   string
	TScore  int
	CTName  string
	CTScore int
}

type MessagePlayerUpdate struct {
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
		MsgType: TeamUpdate,
		Tick:    tick.IngameTick(),
		TeamUpdate: &MessageTeamUpdate{
			TName:   tick.TeamTerrorists().ClanName(),
			TScore:  tick.TeamTerrorists().Score(),
			CTName:  tick.TeamCounterTerrorists().ClanName(),
			CTScore: tick.TeamCounterTerrorists().Score(),
		},
	}
}
