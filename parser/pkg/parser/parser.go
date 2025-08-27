package parser

import (
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/message"
	"fmt"
	"io"
	"math"
	"sort"
	"time"

	"github.com/golang/geo/r3"
	dem "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/common"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/events"
	demsg "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/msg"
	"go.uber.org/zap"
)

var zeroVector = r3.Vector{
	X: 0,
	Y: 0,
	Z: 0,
}

const velocityDelta = 0.000001 //nolint:golint,unused // unused now

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
	parseTimer := time.Now()
	gameStarted := false
	var mapCS MapCS

	parser.RegisterNetMessageHandler(func(e *demsg.CSVCMsg_ServerInfo) {
		mapCS = MapNameToMap[e.GetMapName()]
	})

	// parse one frame to have something
	if more, err := parser.ParseNextFrame(); !more || err != nil {
		return err
	}

	readyForNewRound := false
	roundMessage := message.NewRound(parser.CurrentFrame())
	currentRoundTimer := RoundTimer{
		lastRoundStart: parser.CurrentTime(),
	}

	bombH := newBombHandler(parser)

	parser.RegisterEventHandler(func(ge events.GrenadeEventIf) {
		msg := handleGrenadeEvent(ge, &mapCS, NewRoundMessage(parser))
		roundMessage.Add(msg)
	})

	parser.RegisterEventHandler(func(e events.WeaponFire) {
		msg := handleWeaponFireEvent(e, &mapCS, NewRoundMessage(parser))
		roundMessage.Add(msg)
	})

	parser.RegisterEventHandler(func(e events.Kill) {
		// log.Printf("r: '%d', '%+v'", parser.GameState().TotalRoundsPlayed(), e)
		frag := &message.Frag{
			Weapon: convertWeapon(e.Weapon.Type),
		}
		if e.Victim != nil {
			frag.VictimName = e.Victim.Name
			frag.VictimTeam = team(e.Victim.Team)
		}
		if e.Killer != nil {
			frag.KillerName = e.Killer.Name
			frag.KillerTeam = team(e.Killer.Team)
		}

		roundMessage.Add(&message.Message{
			MsgType: message.Message_FragType,
			Tick:    int32(parser.CurrentFrame()),
			Frag:    frag,
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

	bombH.registerEvents()

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
			log.L().Info("demo parsed", zap.Duration("took", time.Since(parseTimer)))
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

		bombH.tick()

		if parser.CurrentFrame()%4 != 0 {
			roundMessage.Add(&message.Message{
				MsgType: message.Message_EmptyType,
				Tick:    int32(parser.CurrentFrame()),
			})
			continue
		}

		roundMessage.Add(createTickStateMessage(parser.GameState(), &mapCS, parser, bombH))
	}
}

func handleGrenadeEvent(ge events.GrenadeEventIf, mapCS *MapCS, msg *message.Message) *message.Message {
	x, y := translatePosition(ge.Base().Position, mapCS)
	switch ge.(type) {
	case events.FlashExplode, events.HeExplode:
		msg.MsgType = message.Message_GrenadeEventType
		msg.GrenadeEvent = &message.Grenade{
			Id:     int32(ge.Base().GrenadeEntityID),
			Kind:   WeaponsEqType[ge.Base().Grenade.Type],
			X:      x,
			Y:      y,
			Z:      ge.Base().Position.Z,
			Action: "explode",
		}
		return msg
	}
	return nil
}

func handleWeaponFireEvent(e events.WeaponFire, mapCS *MapCS, msg *message.Message) *message.Message {
	if c := e.Weapon.Class(); c == common.EqClassPistols || c == common.EqClassSMG || c == common.EqClassHeavy || c == common.EqClassRifle {
		x, y := translatePosition(e.Shooter.Position(), mapCS)
		msg.MsgType = message.Message_ShotType
		msg.Shot = &message.Shot{
			PlayerId: int32(e.Shooter.UserID),
			X:        x,
			Y:        y,
			Rotation: -(e.Shooter.ViewDirectionX() - 90.0),
		}
		return msg
	}
	return nil
}

func NewRoundMessage(parser dem.Parser) *message.Message {
	return &message.Message{
		Tick: int32(parser.CurrentFrame()),
	}
}

func createTickStateMessage(tick dem.GameState, mapCS *MapCS, parser dem.Parser, bombH *bombHandler) *message.Message {
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
			if exploded, ok := g.Entity.PropertyValue("m_nExplodeEffectIndex"); ok && exploded.UInt64() > 0 {
				continue
			}
		}
		if g.WeaponInstance.Type == common.EqSmoke {
			if exploded, ok := g.Entity.PropertyValue("m_bDidSmokeEffect"); ok && exploded.BoolVal() {
				action = "explode"
			}
		}
		// if g.WeaponInstance.Type == common.EqDecoy {
		// TODO: fix decoy firing when not moving
		// vel := g.Velocity()
		// if vel.Distance(zeroVector) <= velocityDelta {
		// 	action = "explode"
		// }
		// }
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
			Bomb:    bombH.message(mapCS),
		},
	}
}

func transformPlayer(p *common.Player, mapCS *MapCS) *message.Player {
	x, y := translatePosition(p.Position(), mapCS)
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
				log.Printf("what is this ? '%+v'\n", w)
			}
		case common.EqClassUnknown:
			log.Printf("what is that??? %+v\n", w)
		}
	}
	sort.Slice(player.Grenades, func(i, j int) bool {
		return player.Grenades[i] < player.Grenades[j]
	})

	return player
}

func translatePosition(position r3.Vector, mapCS *MapCS) (float64, float64) {
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
		log.Printf("I don't know the team '%v'. Should not get here, but apparently it sometimes happen that spectators wins the round.", team)
	}
	return ""
}
