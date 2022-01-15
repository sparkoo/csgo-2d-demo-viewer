package parser

import (
	"csgo/match"
	"csgo/message"
	dem "github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/common"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/events"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/metadata"
	"log"
	"os"
)

func Parse(demoFile string, handler func(msg *message.Message, state dem.GameState)) error {
	log.Printf("Parsing demo '%v'", demoFile)
	f, err := os.Open(demoFile)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	parser := dem.NewParser(f)
	defer parser.Close()

	matchErr := parseMatch(parser, handler)
	if matchErr != nil {
		return matchErr
	}

	return nil
}

func parseMatch(parser dem.Parser, handler func(msg *message.Message, state dem.GameState)) error {
	gameStarted := false
	var mapCS metadata.Map

	parser.ParseNextFrame()
	mapCS = metadata.MapNameToMap[parser.Header().MapName]
	handler(&message.Message{
		MsgType: message.InitType,
		Tick:    parser.CurrentFrame(),
		Init: &message.Init{
			MapName: mapCS.Name,
		},
	}, parser.GameState())

	roundMessage := message.NewRound()

	parser.RegisterEventHandler(func(e events.RoundEnd) {
		log.Printf("round end '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())
	})
	parser.RegisterEventHandler(func(e events.RoundEndOfficial) {
		log.Printf("round end offic '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())
		msg := &message.Message{
			MsgType: message.RoundType,
			Tick:    parser.CurrentFrame(),
			Round:   roundMessage,
		}
		log.Printf("sending round '%+v', messages '%v'", msg, len(msg.Round.Ticks))
		handler(msg, parser.GameState())
	})
	parser.RegisterEventHandler(func(e events.RoundStart) {
		log.Printf("round start '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())
		roundMessage = message.NewRound()
	})

	parser.RegisterEventHandler(func(e events.RoundFreezetimeEnd) {
		log.Printf("freezetime end '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())
		gameStarted = true
	})
	parser.RegisterEventHandler(func(e events.ScoreUpdated) {
		tick := parser.GameState()
		roundMessage.Add(message.CreateTeamUpdateMessage(tick, parser))
		//handler(message.CreateTeamUpdateMessage(tick, parser), tick)
	})
	parser.RegisterEventHandler(func(e events.PlayerConnect) {
		if isActiveTeam(e.Player.Team) {
			//roundMessage.Add(message.CreateAddPlayerMessage(e.Player, parser, mapCS))
			tick := parser.GameState()
			handler(message.CreateAddPlayerMessage(e.Player, parser, mapCS), tick)
		}
	})
	parser.RegisterEventHandler(func(e events.PlayerDisconnected) {
		message := &message.Message{
			MsgType:      message.RemovePlayerType,
			Tick:         parser.CurrentFrame(),
			RemovePlayer: &message.RemovePlayer{PlayerId: e.Player.UserID},
		}
		roundMessage.Add(message)
		//tick := parser.GameState()
		//handler(message, tick)
	})
	parser.RegisterEventHandler(func(e events.PlayerTeamChange) {
		if isActiveTeam(e.Player.Team) {
			//roundMessage.Add(message.CreateAddPlayerMessage(e.Player, parser, mapCS))
			tick := parser.GameState()
			handler(message.CreateAddPlayerMessage(e.Player, parser, mapCS), tick)
		}
	})
	for {
		more, err := parser.ParseNextFrame()
		if err != nil {
			return err
		}
		if !more {
			log.Printf("ende")
			handler(&message.Message{MsgType: message.DemoEndType, Tick: parser.CurrentFrame()}, parser.GameState())
			return nil
		}
		if !gameStarted {
			continue
		}

		//if parser.CurrentFrame() % 1024 == 0 {
		//	parser.Progress()
		//}

		if parser.CurrentFrame()%16 != 0 {
			continue
		}

		tick := parser.GameState()
		roundMessage.Add(createMessagePlayerUpdate(tick, &mapCS, parser))
		//handler(createMessagePlayerUpdate(tick, &mapCS, parser), tick)
		//handler(tick)
		//return nil
	}
}

func isActiveTeam(team common.Team) bool {
	return team == 2 || team == 3
}

func createParser(demoFile string) dem.Parser {
	f, err := os.Open(demoFile)
	if err != nil {
		panic(err)
	}

	return dem.NewParser(f)
}

func parseHeader(parser dem.Parser) (*match.Match, error) {
	if header, err := parser.ParseHeader(); err != nil {
		return nil, err
	} else {
		return &match.Match{
			OriginalTickrate: header.FrameRate(),
			Map:              header.MapName,
			Ticks:            header.PlaybackTicks,
		}, nil
	}
}

func createMessagePlayerUpdate(tick dem.GameState, mapCS *metadata.Map, parser dem.Parser) *message.Message {
	msgPlayers := make([]message.Player, 0)
	for _, p := range tick.TeamTerrorists().Members() {
		msgPlayers = append(msgPlayers, transformPlayer(p, mapCS))
	}
	for _, p := range tick.TeamCounterTerrorists().Members() {
		msgPlayers = append(msgPlayers, transformPlayer(p, mapCS))
	}

	return &message.Message{
		MsgType: message.PlayerUpdateType,
		Tick:    parser.CurrentFrame(),
		PlayerUpdate: &message.PlayerUpdate{
			Players: msgPlayers,
		},
	}
}

func transformPlayer(p *common.Player, mapCS *metadata.Map) message.Player {
	position := p.Position()
	x, y := mapCS.TranslateScale(position.X, position.Y)
	x = x / 1024 * 100
	y = y / 1024 * 100
	return message.Player{
		PlayerId: p.UserID,
		Name:     p.Name,
		X:        x,
		Y:        y,
		Z:        p.Position().Z,
	}
}
