package message

import (
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
)

type messageType int

const (
	TickStateUpdate  messageType = 1
	AddPlayerType    messageType = 2
	InitType         messageType = 4
	DemoEndType      messageType = 5
	RoundType        messageType = 6
	ProgressType     messageType = 7
	TimeUpdateType   messageType = 8
	ShotType         messageType = 9
	EmptyType        messageType = 10
	KillType         messageType = 11
	PlayRequestType  messageType = 12
	ErrorType        messageType = 13
	GrenadeEventType messageType = 14
)

type Message struct {
	MsgType      messageType `json:"msgType"`
	Tick         int         `json:"tick"`
	*TeamUpdate  `json:"teamUpdate,omitempty"`
	*TickState   `json:"tickState,omitempty"`
	*Init        `json:"init,omitempty"`
	*Round       `json:"round,omitempty"`
	*Progress    `json:"progress,omitempty"`
	*RoundTime   `json:"roundTime,omitempty"`
	*Shot        `json:"shot,omitempty"`
	*Kill        `json:"kill,omitempty"`
	*Demo        `json:"demo,omitempty"`
	GrenadeEvent *Grenade `json:"grenadeEvent,omitempty"`
}

type Demo struct {
	MatchId string `json:"matchId"`
}

type RoundTime struct {
	RoundTime  string
	FreezeTime int
}

type Round struct {
	RoundNo           int
	RoundTookSeconds  int
	StartTick         int
	FreezetimeEndTick int
	EndTick           int
	Ticks             []Message
	TeamState         *TeamUpdate
	Winner            string
}

func NewRound(startTick int) *Round {
	return &Round{
		StartTick: startTick,
		Ticks:     make([]Message, 0),
	}
}

func (r *Round) Add(message *Message) {
	r.Ticks = append(r.Ticks, *message)
}

type Kill struct {
	VictimId int
}

type Progress struct {
	Progress int
	Message  string
}

type Init struct {
	MapName string `json:"mapName"`
	TName   string
	CTName  string
}

type TeamUpdate struct {
	TName   string
	TScore  int
	CTName  string
	CTScore int
}

type TickState struct {
	Players []Player
	Nades   []Grenade
}

type Shot struct {
	PlayerId int
	X        float64
	Y        float64
	Rotation float32
}

type Player struct {
	PlayerId              int
	Name                  string
	Team                  string
	X                     float64
	Y                     float64
	Z                     float64
	Rotation              float32
	Alive                 bool
	Weapon                string
	Flashed               bool
	Hp                    int
	Armor                 int
	Helmet                bool
	Defuse                bool
	Bomb                  bool
	Money                 int
	Primary               string
	PrimaryAmmoMagazine   int
	PrimaryAmmoReserve    int
	Secondary             string
	SecondaryAmmoMagazine int
	SecondaryAmmoReserve  int
	Grenades              []string
}

type Grenade struct {
	Id     int     `json:"id"`
	Kind   string  `json:"kind"`
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Z      float64 `json:"z"`
	Action string  `json:"action"`
}

func CreateTeamUpdateMessage(tick demoinfocs.GameState) *TeamUpdate {
	return &TeamUpdate{
		TName:   tick.TeamTerrorists().ClanName(),
		TScore:  tick.TeamTerrorists().Score(),
		CTName:  tick.TeamCounterTerrorists().ClanName(),
		CTScore: tick.TeamCounterTerrorists().Score(),
	}
}