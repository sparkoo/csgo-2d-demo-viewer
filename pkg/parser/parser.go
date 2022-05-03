package parser

import (
	"csgo-2d-demo-player/pkg/message"
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

	readyForNewRound := false
	roundMessage := message.NewRound(parser.CurrentFrame())
	currentRoundTimer := RoundTimer{
		lastRoundStart: parser.CurrentTime(),
	}

	parser.RegisterEventHandler(func(ge events.GrenadeEventIf) {
		x, y := translatePosition(ge.Base().Position, &mapCS)
		switch ge.(type) {
		case events.FlashExplode, events.HeExplode:
			roundMessage.Add(&message.Message{
				MsgType: message.Message_GrenadeEventType,
				Tick:    int32(parser.CurrentFrame()),
				GrenadeEvent: &message.Grenade{
					Id:     int32(ge.Base().GrenadeEntityID),
					Kind:   WeaponsEqType[ge.Base().Grenade.Type],
					X:      x,
					Y:      y,
					Z:      ge.Base().Position.Z,
					Action: "explode",
				},
			})
		}
	})

	parser.RegisterEventHandler(func(e events.WeaponFire) {
		if c := e.Weapon.Class(); c == common.EqClassPistols || c == common.EqClassSMG || c == common.EqClassHeavy || c == common.EqClassRifle {
			x, y := translatePosition(e.Shooter.Position(), &mapCS)
			roundMessage.Add(&message.Message{
				MsgType: message.Message_ShotType,
				Tick:    int32(parser.CurrentFrame()),
				Shot: &message.Shot{
					PlayerId: int32(e.Shooter.UserID),
					X:        x,
					Y:        y,
					Rotation: -(e.Shooter.ViewDirectionX() - 90.0),
				},
			})
		}
	})

	parser.RegisterEventHandler(func(e events.Kill) {
		roundMessage.Add(&message.Message{
			MsgType: message.Message_KillType,
			Tick:    int32(parser.CurrentFrame()),
			Kill:    &message.Kill{VictimId: int32(e.Victim.UserID)},
		})
	})
	parser.RegisterEventHandler(func(e events.RoundEnd) {
		//log.Printf("round end '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())
		roundMessage.Winner = team(e.Winner)
	})
	parser.RegisterEventHandler(func(e events.RoundEndOfficial) {
		//log.Printf("round end offic '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())
		roundMessage.RoundTookSeconds = int32((parser.CurrentTime() - currentRoundTimer.lastRoundStart).Seconds())
		roundMessage.RoundNo = int32(parser.GameState().TotalRoundsPlayed())
		roundMessage.EndTick = int32(parser.CurrentFrame())
		msg := &message.Message{
			MsgType: message.Message_RoundType,
			Tick:    int32(parser.CurrentFrame()),
			Round:   roundMessage,
		}
		//log.Printf("sending round, messages '%v', roundNo '%v'   T [%v : %v] CT", len(msg.Round.Ticks), msg.Round.RoundNo, msg.Round.TeamState.TScore, msg.Round.TeamState.CTScore)
		handler(msg, parser.GameState())
	})
	parser.RegisterEventHandler(func(e events.GamePhaseChanged) {
		if e.NewGamePhase == common.GamePhaseGameEnded {
			//log.Printf("sending last round ? tick '%v' time '%v', winner '%v'", parser.CurrentFrame(), parser.CurrentTime(), roundMessage.Winner)
			roundMessage.RoundTookSeconds = int32((parser.CurrentTime() - currentRoundTimer.lastRoundStart).Seconds())
			roundMessage.RoundNo = int32(parser.GameState().TotalRoundsPlayed() + 1)
			roundMessage.EndTick = int32(parser.CurrentFrame())
			msg := &message.Message{
				MsgType: message.Message_RoundType,
				Tick:    int32(parser.CurrentFrame()),
				Round:   roundMessage,
			}
			//log.Printf("sending round, messages '%v', roundNo '%v'   T [%v : %v] CT", len(msg.Round.Ticks), msg.Round.RoundNo, msg.Round.TeamState.TScore, msg.Round.TeamState.CTScore)
			handler(msg, parser.GameState())
		}
	})
	parser.RegisterEventHandler(func(e events.RoundStart) {
		readyForNewRound = true
	})

	parser.RegisterEventHandler(func(e events.BombEventIf) {
	})

	parser.RegisterEventHandler(func(e events.RoundFreezetimeEnd) {
		//log.Printf("freezetime end '%+v' tick '%v' time '%v'", e, parser.CurrentFrame(), parser.CurrentTime())

		if readyForNewRound {
			readyForNewRound = false
			roundMessage = message.NewRound(parser.CurrentFrame())
			currentRoundTimer.lastRoundStart = parser.CurrentTime()
			roundMessage.TeamState = message.CreateTeamUpdateMessage(parser.GameState())
			roundMessage.FreezetimeEndTick = int32(parser.CurrentFrame())
		}

		if !gameStarted {
			mapCS = metadata.MapNameToMap[parser.Header().MapName]
			handler(&message.Message{
				MsgType: message.Message_InitType,
				Tick:    int32(parser.CurrentFrame()),
				Init: &message.Init{
					MapName: mapCS.Name,
					CTName:  parser.GameState().TeamCounterTerrorists().ClanName(),
					TName:   parser.GameState().TeamTerrorists().ClanName(),
				},
			}, parser.GameState())
			gameStarted = true
		}
	})

	for {
		more, err := parser.ParseNextFrame()
		if err != nil {
			return err
		}
		if !more {
			log.Printf("ende")
			handler(&message.Message{
				MsgType: message.Message_DemoEndType,
				Tick:    int32(parser.CurrentFrame()),
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
			progressWholePercent := int32(math.Round(float64(parser.Progress()) * 100))
			handler(&message.Message{
				MsgType: message.Message_ProgressType,
				Tick:    int32(parser.CurrentFrame()),
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
				MsgType: message.Message_TimeUpdateType,
				Tick:    int32(parser.CurrentFrame()),
				RoundTime: &message.RoundTime{
					RoundTime: fmt.Sprintf("%d:%02d", minutes, int(roundTime.Seconds())-(60*minutes)),
				},
			})
		}

		if parser.CurrentFrame()%4 != 0 {
			roundMessage.Add(&message.Message{
				MsgType: message.Message_EmptyType,
				Tick:    int32(parser.CurrentFrame()),
			})
			continue
		}

		roundMessage.Add(createTickStateMessage(parser.GameState(), &mapCS, parser))
	}
}

func createTickStateMessage(tick dem.GameState, mapCS *metadata.Map, parser dem.Parser) *message.Message {
	msgPlayers := make([]*message.Player, 0)
	for _, p := range tick.TeamTerrorists().Members() {
		msgPlayers = append(msgPlayers, transformPlayer(p, mapCS))
	}
	for _, p := range tick.TeamCounterTerrorists().Members() {
		msgPlayers = append(msgPlayers, transformPlayer(p, mapCS))
	}
	sort.Slice(msgPlayers, func(i, j int) bool {
		return msgPlayers[i].PlayerId < msgPlayers[j].PlayerId
	})

	nades := make([]*message.Grenade, 0)
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
		nades = append(nades, &message.Grenade{
			Id:     int32(g.Entity.ID()),
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
			nades = append(nades, &message.Grenade{
				Id:     int32(inferno.Entity.ID() + dist),
				Kind:   "fire",
				X:      x,
				Y:      y,
				Z:      fire.Z,
				Action: "explode",
			})
		}
	}

	sort.Slice(nades, func(i, j int) bool {
		return nades[i].Id < nades[j].Id
	})

	return &message.Message{
		MsgType: message.Message_TickStateUpdate,
		Tick:    int32(parser.CurrentFrame()),
		TickState: &message.TickState{
			Players: msgPlayers,
			Nades:   nades,
		},
	}
}

func transformPlayer(p *common.Player, mapCS *metadata.Map) *message.Player {
	x, y := translatePosition(p.LastAlivePosition, mapCS)
	player := &message.Player{
		PlayerId: int32(p.UserID),
		Name:     p.Name,
		Team:     team(p.Team),
		X:        x,
		Y:        y,
		Z:        p.Position().Z,
		Rotation: -(p.ViewDirectionX() - 90.0),
		Alive:    p.IsAlive(),
		Flashed:  p.IsBlinded(),
		Hp:       int32(p.Health()),
		Armor:    int32(p.Armor()),
		Helmet:   p.HasHelmet(),
		Defuse:   p.HasDefuseKit(),
		Money:    int32(p.Money()),
	}

	if w := p.ActiveWeapon(); w != nil {
		player.Weapon = convertWeapon(w.Type)
	}

	//TODO: Grenades should have priority left to right flash > he > smoke > molotov/inc > decoy
	for _, w := range p.Weapons() {
		weaponString := convertWeapon(w.Type)
		switch w.Class() {
		case common.EqClassSMG, common.EqClassHeavy, common.EqClassRifle:
			player.Primary = weaponString
			player.PrimaryAmmoMagazine = int32(w.AmmoInMagazine())
			player.PrimaryAmmoReserve = int32(w.AmmoReserve())
		case common.EqClassPistols:
			player.Secondary = weaponString
			player.SecondaryAmmoMagazine = int32(w.AmmoInMagazine())
			player.SecondaryAmmoReserve = int32(w.AmmoReserve())
		case common.EqClassGrenade:
			for gi := 0; gi < w.AmmoInMagazine()+w.AmmoReserve(); gi++ {
				player.Grenades = append(player.Grenades, weaponString)
			}
		case common.EqClassEquipment:
			switch w.Type {
			case common.EqBomb:
				player.Bomb = true
			case common.EqKnife:
			case common.EqZeus:
			default:
				log.Printf("what is this ? '%+v'", w)
			}
		case common.EqClassUnknown:
			log.Printf("what is that???")
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
