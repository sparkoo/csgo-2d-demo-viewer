package parser

import (
	"csgo/message"
	"fmt"
	"github.com/golang/geo/r3"
	dem "github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/common"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/events"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/metadata"
	"io"
	"log"
	"math"
	"sort"
	"time"
)

var zeroVector = r3.Vector{
	X: 0,
	Y: 0,
	Z: 0,
}

const velocityDelta = 0.000001

type RoundTimer struct {
	lastRoundStart time.Duration
}

func Parse(demoFile io.Reader, handler func(msg *message.Message, state dem.GameState)) error {
	parser := dem.NewParser(demoFile)
	defer parser.Close()

	matchErr := parseMatch(parser, handler)
	if matchErr != nil {
		return matchErr
	}

	return nil
}

func parseMatch(parser dem.Parser, handler func(msg *message.Message, state dem.GameState)) error {
	log.Println("parsing started")
	gameStarted := false
	var mapCS metadata.Map

	// parse one frame to have something
	if more, err := parser.ParseNextFrame(); !more || err != nil {
		return err
	}

	roundMessage := message.NewRound(parser.CurrentFrame())
	currentRoundTimer := RoundTimer{
		lastRoundStart: parser.CurrentTime(),
	}

	parser.RegisterEventHandler(func(ge events.GrenadeEventIf) {
		x, y := translatePosition(ge.Base().Position, &mapCS)
		switch ge.(type) {
		case events.FlashExplode, events.HeExplode:
			roundMessage.Add(&message.Message{
				MsgType: message.GrenadeEventType,
				Tick:    parser.CurrentFrame(),
				GrenadeEvent: &message.Grenade{
					Id:     ge.Base().GrenadeEntityID,
					Kind:   WeaponsEqType[ge.Base().Grenade.Type],
					X:      x,
					Y:      y,
					Z:      ge.Base().Position.Z,
					Action: "explode",
				},
			})
		}
	})

	parser.RegisterEventHandler(func(e events.WeaponFire) {})

	parser.RegisterEventHandler(func(e events.WeaponFire) {
		if c := e.Weapon.Class(); c == common.EqClassPistols || c == common.EqClassSMG || c == common.EqClassHeavy || c == common.EqClassRifle {
			x, y := translatePosition(e.Shooter.Position(), &mapCS)
			roundMessage.Add(&message.Message{
				MsgType: message.ShotType,
				Tick:    parser.CurrentFrame(),
				Shot: &message.Shot{
					PlayerId: e.Shooter.UserID,
					X:        x,
					Y:        y,
					Rotation: -(e.Shooter.ViewDirectionX() - 90.0),
				},
			})
		}
	})

	parser.RegisterEventHandler(func(e events.Kill) {
		roundMessage.Add(&message.Message{
			MsgType: message.KillType,
			Tick:    parser.CurrentFrame(),
			Kill:    &message.Kill{VictimId: e.Victim.UserID},
		})
	})
	parser.RegisterEventHandler(func(e events.RoundEnd) {
		//log.Printf("round end '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())
		roundMessage.Winner = team(e.Winner)
	})
	parser.RegisterEventHandler(func(e events.RoundEndOfficial) {
		//log.Printf("round end offic '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())
		roundMessage.RoundTookSeconds = int((parser.CurrentTime() - currentRoundTimer.lastRoundStart).Seconds())
		roundMessage.RoundNo = parser.GameState().TotalRoundsPlayed()
		roundMessage.EndTick = parser.CurrentFrame()
		msg := &message.Message{
			MsgType: message.RoundType,
			Tick:    parser.CurrentFrame(),
			Round:   roundMessage,
		}
		//log.Printf("sending round '%+v', messages '%v', roundNo '%v'   T [%v : %v] CT", msg, len(msg.Round.Ticks), msg.RoundNo, msg.TeamState.TScore, msg.TeamState.CTScore)
		handler(msg, parser.GameState())
	})

	parser.RegisterEventHandler(func(e events.BombEventIf) {
	})

	parser.RegisterEventHandler(func(e events.RoundFreezetimeEnd) {
		//log.Printf("freezetime end '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())

		roundMessage = message.NewRound(parser.CurrentFrame())
		currentRoundTimer.lastRoundStart = parser.CurrentTime()
		roundMessage.TeamState = message.CreateTeamUpdateMessage(parser.GameState())

		if !gameStarted {
			mapCS = metadata.MapNameToMap[parser.Header().MapName]
			handler(&message.Message{
				MsgType: message.InitType,
				Tick:    parser.CurrentFrame(),
				Init: &message.Init{
					MapName: mapCS.Name,
					CTName:  parser.GameState().TeamCounterTerrorists().ClanName(),
					TName:   parser.GameState().TeamTerrorists().ClanName(),
				},
			}, parser.GameState())
			gameStarted = true
		}

		roundMessage.FreezetimeEndTick = parser.CurrentFrame()
	})

	for {
		more, err := parser.ParseNextFrame()
		if err != nil {
			return err
		}
		if !more {
			log.Printf("ende")
			handler(&message.Message{
				MsgType: message.DemoEndType,
				Tick:    parser.CurrentFrame(),
				Init: &message.Init{
					MapName: mapCS.Name,
					CTName:  parser.GameState().TeamCounterTerrorists().ClanName(),
					TName:   parser.GameState().TeamTerrorists().ClanName(),
				}}, parser.GameState())
			return nil
		}
		if !gameStarted {
			continue
		}

		if parser.CurrentFrame()%1024 == 0 {
			progressWholePercent := int(math.Round(float64(parser.Progress()) * 100))
			handler(&message.Message{
				MsgType: message.ProgressType,
				Tick:    parser.CurrentFrame(),
				Progress: &message.Progress{
					Progress: progressWholePercent,
					Message:  "Loading match ...",
				},
			}, parser.GameState())
		}

		if parser.CurrentFrame()%16 == 0 {
			roundTime := parser.CurrentTime() - currentRoundTimer.lastRoundStart
			minutes := int(roundTime.Minutes())
			roundMessage.Add(&message.Message{
				MsgType: message.TimeUpdateType,
				Tick:    parser.CurrentFrame(),
				RoundTime: &message.RoundTime{
					RoundTime: fmt.Sprintf("%d:%02d", minutes, int(roundTime.Seconds())-(60*minutes)),
				},
			})
		}

		if parser.CurrentFrame()%4 != 0 {
			roundMessage.Add(&message.Message{
				MsgType: message.EmptyType,
				Tick:    parser.CurrentFrame(),
			})
			continue
		}

		roundMessage.Add(createTickStateMessage(parser.GameState(), &mapCS, parser))
	}
}

func createTickStateMessage(tick dem.GameState, mapCS *metadata.Map, parser dem.Parser) *message.Message {
	msgPlayers := make([]message.Player, 0)
	for _, p := range tick.TeamTerrorists().Members() {
		msgPlayers = append(msgPlayers, transformPlayer(p, mapCS))
	}
	for _, p := range tick.TeamCounterTerrorists().Members() {
		msgPlayers = append(msgPlayers, transformPlayer(p, mapCS))
	}

	nades := make([]message.Grenade, 0)
	for _, g := range tick.GrenadeProjectiles() {
		var action string
		if g.WeaponInstance.Type == common.EqHE {
			// HE for some reason keep on map longer. we want to remove them after they explode
			if exploded, ok := g.Entity.PropertyValue("m_nExplodeEffectIndex"); ok && exploded.IntVal > 0 {
				continue
			}
		}
		if g.WeaponInstance.Type == common.EqSmoke {
			if exploded, ok := g.Entity.PropertyValue("m_bDidSmokeEffect"); ok && exploded.IntVal > 0 {
				action = "explode"
			}
		}
		if g.WeaponInstance.Type == common.EqDecoy {
			vel := g.Velocity()
			if vel.Distance(zeroVector) <= velocityDelta {
				action = "explode"
			}
		}
		x, y := translatePosition(g.Position(), mapCS)
		nades = append(nades, message.Grenade{
			Id:     g.Entity.ID(),
			Kind:   WeaponsEqType[g.WeaponInstance.Type],
			X:      x,
			Y:      y,
			Z:      g.Position().Z,
			Action: action,
		})
	}

	for _, inferno := range tick.Infernos() {
		for _, fire := range inferno.Fires().Active().ConvexHull3D().Vertices {
			x, y := translatePosition(fire, mapCS)
			dist := int(fire.Distance(zeroVector) * 100_000)
			nades = append(nades, message.Grenade{
				Id:     inferno.Entity.ID() + dist,
				Kind:   "fire",
				X:      x,
				Y:      y,
				Z:      fire.Z,
				Action: "explode",
			})
		}
	}

	return &message.Message{
		MsgType: message.TickStateUpdate,
		Tick:    parser.CurrentFrame(),
		TickState: &message.TickState{
			Players: msgPlayers,
			Nades:   nades,
		},
	}
}

func transformPlayer(p *common.Player, mapCS *metadata.Map) message.Player {
	x, y := translatePosition(p.LastAlivePosition, mapCS)
	player := message.Player{
		PlayerId: p.UserID,
		Name:     p.Name,
		Team:     team(p.Team),
		X:        x,
		Y:        y,
		Z:        p.Position().Z,
		Rotation: -(p.ViewDirectionX() - 90.0),
		Alive:    p.IsAlive(),
		Flashed:  p.IsBlinded(),
		Hp:       p.Health(),
		Armor:    p.Armor(),
		Helmet:   p.HasHelmet(),
		Defuse:   p.HasDefuseKit(),
		Money:    p.Money(),
	}

	if w := p.ActiveWeapon(); w != nil {
		player.Weapon = convertWeapon(w.OriginalString)
	}

	//TODO: Grenades should have priority left to right flash > he > smoke > molotov/inc > decoy
	for _, w := range p.Weapons() {
		weaponString := convertWeapon(w.OriginalString)
		switch w.Class() {
		case common.EqClassSMG, common.EqClassHeavy, common.EqClassRifle:
			player.Primary = weaponString
		case common.EqClassPistols:
			player.Secondary = weaponString
		case common.EqClassGrenade:
			player.Grenades = append(player.Grenades, weaponString)
		}
	}
	sort.Slice(player.Grenades, func(i, j int) bool {
		return player.Grenades[i] < player.Grenades[j]
	})

	return player
}

func translatePosition(position r3.Vector, mapCS *metadata.Map) (float64, float64) {
	x, y := mapCS.TranslateScale(position.X, position.Y)
	x = x / 1024 * 100
	y = y / 1024 * 100
	return x, y
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
