package parser

import (
	"csgo/match"
	dem "github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/events"
	"log"
	"os"
)

func Parse(demoFile string, handler func(state dem.GameState)) error {
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

func parseMatch(parser dem.Parser, handler func(state dem.GameState)) error {
	gameStarted := false
	parser.RegisterEventHandler(func(e events.RoundFreezetimeEnd) {
		log.Printf("freezetime end '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())
		gameStarted = true
	})
	for {
		more, err := parser.ParseNextFrame()
		if err != nil {
			return err
		}
		if !more {
			log.Printf("ende")
			return nil
		}
		if !gameStarted {
			continue
		}
		tick := parser.GameState()
		handler(tick)
		return nil
	}
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
