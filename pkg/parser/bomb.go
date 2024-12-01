package parser

import (
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/message"

	"github.com/golang/geo/r3"
	dem "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/events"
)

type bombHandler struct {
	parser   dem.Parser
	position r3.Vector
	state    message.Bomb_BombState
}

const distanceDelta float64 = 5

func newBombHandler(parser dem.Parser) *bombHandler {
	return &bombHandler{
		parser: parser,
		position: r3.Vector{
			X: 0,
			Y: 0,
			Z: 0,
		},
		state: message.Bomb_Zero,
	}
}

func (b *bombHandler) registerEvents() {
	b.parser.RegisterEventHandler(func(e events.BombEventIf) {
		switch e.(type) {
		case events.BombPlantBegin:
			b.state = message.Bomb_Planting
		case events.BombPlantAborted:
			b.state = message.Bomb_Zero
		case events.BombPlanted:
			b.state = message.Bomb_Planted
		case events.BombDefuseStart:
			b.state = message.Bomb_Defusing
		case events.BombDefuseAborted:
			b.state = message.Bomb_Planted
		case events.BombDefused:
			b.state = message.Bomb_Defused
		case events.BombExplode:
			b.state = message.Bomb_Explode
		default:
			log.Printf("unknown bomb state ? '%+v'", e)
		}
		//log.Printf("bomb state changed '%+v', time '%v', tick '%v'", b.state, b.parser.CurrentTime(), b.parser.CurrentFrame())
	})
}

func (b *bombHandler) tick() {
	// because there is no event that tells us bomb is in zero state (in game, not planted), we detect
	// bomb movement by calculating distance between frames. this happens at the end of the round when bomb was
	// previously in different state (planted, exploded)
	bombPos := b.parser.GameState().Bomb().Position()
	bombPos.Z = 0
	oldBombPos := b.position
	oldBombPos.Z = 0
	distance := bombPos.Distance(oldBombPos)

	if distance > distanceDelta &&
		(b.state == message.Bomb_Planted || b.state == message.Bomb_Explode || b.state == message.Bomb_Defused) {
		//log.Printf("bomb movement detected '%v', state back to ZERO from '%v'", distance, b.state)
		b.state = message.Bomb_Zero
	}

	b.position = b.parser.GameState().Bomb().Position()
}

func (b *bombHandler) message(mapCS *MapCS) *message.Bomb {
	x, y := translatePosition(b.position, mapCS)
	return &message.Bomb{
		X:     x,
		Y:     y,
		Z:     b.position.Z,
		State: b.state,
	}
}
