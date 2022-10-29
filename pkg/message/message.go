package message

import "github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"

func NewRound(startTick int) *Round {
	return &Round{
		StartTick: int32(startTick),
		Ticks:     make([]*Message, 0),
	}
}

func (r *Round) Add(message *Message) {
	r.Ticks = append(r.Ticks, message)
}

func CreateTeamUpdateMessage(tick demoinfocs.GameState) *TeamUpdate {
	return &TeamUpdate{
		TName:   tick.TeamTerrorists().ClanName(),
		TScore:  int32(tick.TeamTerrorists().Score()),
		CTName:  tick.TeamCounterTerrorists().ClanName(),
		CTScore: int32(tick.TeamCounterTerrorists().Score()),
	}
}
