package steam

import (
	"csgo-2d-demo-player/conf"
	"fmt"
	"time"

	"csgo-2d-demo-player/pkg/log"

	sclient "github.com/sparkoo/go-steam"
	csgoproto "github.com/sparkoo/go-steam/csgo/protocol/protobuf"
	"github.com/sparkoo/go-steam/protocol/gamecoordinator"
	"github.com/sparkoo/go-steam/protocol/steamlang"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

// https://api.steampowered.com/ICSGOPlayers_730/GetNextMatchSharingCode/v1?key=4272CD0C6DBFEFC0ED2D509E4EFE6165&steamid=76561197979904892&steamidkey=73YF-MQ2HM-ZAKP&knowncode=CSGO-YaLAL-2Ornh-UE8pP-bhQVr-Q4zAC

// steam://rungame/730/76561202255233023/+csgo_download_match%20CSGO-dK84y-25MFt-5zT4m-XzjS3-8LhWA

const (
	csgoAppId = 730

	// matchId = "CSGO-YaLAL-2Ornh-UE8pP-bhQVr-Q4zAC" // sparko
	matchId = "CSGO-dK84y-25MFt-5zT4m-XzjS3-8LhWA" // CS2 game
)

type steamClient struct {
	client *sclient.Client
}

func newSteamClient(conf *conf.Conf) *steamClient {
	loginInfo := &sclient.LogOnDetails{
		Username: conf.SteamUsername,
		Password: conf.SteamPassword,
	}

	client := sclient.NewClient()
	if _, errConnect := client.Connect(); errConnect != nil {
		panic(errConnect)
	}

	go func() {

		for event := range client.Events() {
			// fmt.Printf("received event '%T' => '%+v'\n", event, event)
			switch e := event.(type) {
			case *sclient.ConnectedEvent:
				client.Auth.LogOn(loginInfo)
			// case *sclient.MachineAuthUpdateEvent:
			// 	ioutil.WriteFile("sentry", e.Hash, 0666)
			case *sclient.LoggedOnEvent:
				client.Social.SetPersonaState(steamlang.EPersonaState_Online)
				client.GC.RegisterPacketHandler(&handler{})
				client.GC.SetGamesPlayed(730)

				time.Sleep(3 * time.Second)
				client.GC.Write(gamecoordinator.NewGCMsgProtobuf(730, uint32(csgoproto.EGCBaseClientMsg_k_EMsgGCClientHello), &csgoproto.CMsgClientHello{
					Version: Ptr(uint32(1)),
				}))
				time.Sleep(3 * time.Second)
				// fmt.Println("sending some message to some black hole")
				matchData, decodeErr := decode(matchId)
				if decodeErr != nil {
					panic(decodeErr)
				}
				client.GC.Write(gamecoordinator.NewGCMsgProtobuf(csgoAppId, uint32(csgoproto.ECsgoGCMsg_k_EMsgGCCStrike15_v2_MatchListRequestFullGameInfo), &csgoproto.CMsgGCCStrike15V2_MatchListRequestFullGameInfo{
					Matchid:   &matchData.MatchID,
					Outcomeid: &matchData.OutcomeID,
					Token:     &matchData.Token,
				}))

			case *sclient.LogOnFailedEvent:
				fmt.Printf("eh? %+v\n", e)
			case sclient.FatalErrorEvent:
				log.L().Error("steam client failed with FatalErrorEvent", zap.Error(e))
			case error:
				log.L().Error("steam client failed hard", zap.Error(e))
			}
		}
	}()

	return &steamClient{
		client: client,
	}
}

type handler struct {
}

func (h *handler) HandleGCPacket(packet *gamecoordinator.GCPacket) {
	switch packet.MsgType {
	case uint32(csgoproto.EGCBaseClientMsg_k_EMsgGCClientWelcome):
		{
			log.L().Debug("Steam client connected ...")
		}
	case uint32(csgoproto.ECsgoGCMsg_k_EMsgGCCStrike15_v2_MatchList):
		{
			var msg csgoproto.CMsgGCCStrike15V2_MatchList
			packet.ReadProtoMsg(&msg)
			for _, m := range msg.Matches {
				for _, r := range m.GetRoundstatsall() {
					if r.GetMap() != "" {
						fmt.Printf("demo link \\o/ '%s'\n", r.GetMap())
					}
				}
			}

		}
	case uint32(csgoproto.ECsgoGCMsg_k_EMsgGCCStrike15_v2_GC2ClientGlobalStats):
		{
			// fmt.Printf(">>> %+v\n", packet)
			// var msg csgoproto.GlobalStatistics
			// packet.ReadProtoMsg(&msg)
			// fmt.Printf("hm? %+v\n", msg)
		}
	case uint32(csgoproto.EGCBaseClientMsg_k_EMsgGCClientConnectionStatus):
		{
			var msg csgoproto.CMsgConnectionStatus
			packet.ReadProtoMsg(&msg)
			fmt.Printf("connection status '%+v' \n", msg)
		}
	default:
		fmt.Printf("received unknown message type %d\n", packet.MsgType)
	}

}

func accountId(accId uint64) *uint32 {
	newAccID := accId - 76561197960265728
	return proto.Uint32(uint32(newAccID))
}

func Ptr[T any](anything T) *T {
	return &anything
}
