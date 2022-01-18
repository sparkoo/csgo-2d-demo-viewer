package message

import (
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/common"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/metadata"
	"log"
)

type messageType int

const (
	TeamUpdateType   messageType = 0
	PlayerUpdateType messageType = 1
	AddPlayerType    messageType = 2
	RemovePlayerType messageType = 3
	InitType         messageType = 4
	DemoEndType      messageType = 5
	RoundType        messageType = 6
	LoadProgressType messageType = 7
	TimeUpdateType   messageType = 8
	ShotType         messageType = 9
	EmptyType        messageType = 10
	KillType         messageType = 11
	ParseRequestType messageType = 12
)

type Message struct {
	MsgType       messageType `json:"msgType"`
	Tick          int         `json:"tick"`
	*TeamUpdate   `json:"teamUpdate,omitempty"`
	*PlayerUpdate `json:"playerUpdate,omitempty"`
	*AddPlayer    `json:"addPlayer,omitempty"`
	*RemovePlayer `json:"removePlayer,omitempty"`
	*Init         `json:"init,omitempty"`
	*Round        `json:"round,omitempty"`
	*Progress     `json:"progress,omitempty"`
	*RoundTime    `json:"roundTime,omitempty"`
	*Shot         `json:"shot,omitempty"`
	*Kill         `json:"kill,omitempty"`
	*Demo         `json:"demo,omitempty"`
}

type Demo struct {
	Filename string `json:"filename"`
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

type PlayerUpdate struct {
	Players []Player
}

type Shot struct {
	PlayerId int
	X        float64
	Y        float64
	Rotation float32
}

type AddPlayer struct {
	*Player
}

type RemovePlayer struct {
	PlayerId int
}

type Player struct {
	PlayerId int
	Name     string
	Team     string
	X        float64
	Y        float64
	Z        float64
	Rotation float32
}

func CreateTeamUpdateMessage(tick demoinfocs.GameState, parser demoinfocs.Parser) *Message {
	return &Message{
		MsgType: TeamUpdateType,
		Tick:    parser.CurrentFrame(),
		TeamUpdate: &TeamUpdate{
			TName:   tick.TeamTerrorists().ClanName(),
			TScore:  tick.TeamTerrorists().Score(),
			CTName:  tick.TeamCounterTerrorists().ClanName(),
			CTScore: tick.TeamCounterTerrorists().Score(),
		},
	}
}

func CreateAddPlayerMessage(player *common.Player, parser demoinfocs.Parser, mapCS metadata.Map) *Message {
	position := player.Position()
	x, y := mapCS.TranslateScale(position.X, position.Y)
	x = x / 1024 * 100
	y = y / 1024 * 100
	return &Message{
		MsgType: AddPlayerType,
		Tick:    parser.CurrentFrame(),
		AddPlayer: &AddPlayer{
			&Player{
				PlayerId: player.UserID,
				Name:     player.Name,
				Team:     team(player.Team),
				X:        0,
				Y:        0,
				Z:        0,
			},
		},
	}
}

func team(team common.Team) string {
	switch team {
	case common.TeamCounterTerrorists:
		return "CT"
	case common.TeamTerrorists:
		return "T"
	default:
		log.Fatalf("I don't know the team '%v'. Should not get here.", team)
	}
	return ""
}
