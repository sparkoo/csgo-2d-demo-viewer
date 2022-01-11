package parser

import (
	"csgo/match"
	dem "github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
	"os"
)

func Parse(demoFile string) (*match.Match, error) {
	parser := createParser(demoFile)
	defer parser.Close()

	parsedMatch, headerErr := parseHeader(parser)
	if headerErr != nil {
		return nil, headerErr
	}

	parsedMatch, matchErr := parseMatch(parser, parsedMatch)
	if matchErr != nil {
		return nil, matchErr
	}

	return parsedMatch, nil
}

func parseMatch(parser dem.Parser, parsedMatch *match.Match) (*match.Match, error) {
	for {
		more, err := parser.ParseNextFrame()
		if err != nil {
			return nil, err
		}
		if !more {
			return parsedMatch, nil
		}
	}
}

func createParser(demoFile string) dem.Parser {
	f, err := os.Open(demoFile)
	if err != nil {
		panic(err)
	}
	defer f.Close()

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
