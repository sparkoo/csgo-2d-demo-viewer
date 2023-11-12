package steam

import (
	"csgo-2d-demo-player/conf"
	"fmt"
	"io/ioutil"
	"log"
	"sync"

	sclient "github.com/Philipp15b/go-steam/v3"
	csgoproto "github.com/Philipp15b/go-steam/v3/csgo/protocol/protobuf"
	"github.com/Philipp15b/go-steam/v3/protocol/gamecoordinator"
	"github.com/Philipp15b/go-steam/v3/protocol/steamlang"
	"google.golang.org/protobuf/proto"
)

// Your Steam Web API Key: 4272CD0C6DBFEFC0ED2D509E4EFE6165

// https://api.steampowered.com/ICSGOPlayers_730/GetNextMatchSharingCode/v1?key=4272CD0C6DBFEFC0ED2D509E4EFE6165&steamid=76561197979904892&steamidkey=73YF-MQ2HM-ZAKP&knowncode=CSGO-YaLAL-2Ornh-UE8pP-bhQVr-Q4zAC

const (
	csgoAppId = 730

	matchId = "CSGO-YaLAL-2Ornh-UE8pP-bhQVr-Q4zAC" // sparko
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

	var connected sync.WaitGroup
	connected.Add(1)
	go func() {

		for event := range client.Events() {
			fmt.Printf("received event '%T' => '%+v'\n", event, event)
			switch e := event.(type) {
			case *sclient.ConnectedEvent:
				client.Auth.LogOn(loginInfo)
				// CMsgGCCStrike15_v2_MatchListRequestFullGameInfo
				// client.GC.Write(&protobuf.CMsgGCCStrike15V2_MatchListRequestRecentUserGames{})
				// client.GC.Write(&protobuf.CMsgGCCStrike15V2_MatchListRequestFullGameInfo{})
				// var accId uint32 = 19639164
				// client.GC.Write(gamecoordinator.NewGCMsg(730, uint32(protobuf.ECsgoGCMsg_k_EMsgGCCStrike15_v2_MatchListRequestRecentUserGames), &mesidz{
				// 	msg: protobuf.CMsgGCCStrike15V2_MatchListRequestRecentUserGames{
				// 		Accountid: &accId,
				// 	},
				// }))
			case *sclient.MachineAuthUpdateEvent:
				ioutil.WriteFile("sentry", e.Hash, 0666)
			case *sclient.LoggedOnEvent:
				client.Social.SetPersonaState(steamlang.EPersonaState_Online)
				client.GC.RegisterPacketHandler(&handler{})
				client.GC.SetGamesPlayed(730)

				// time.Sleep(3 * time.Second)
				client.GC.Write(gamecoordinator.NewGCMsgProtobuf(730, uint32(csgoproto.EGCBaseClientMsg_k_EMsgGCClientHello), &csgoproto.CMsgClientHello{
					Version: Ptr(uint32(1)),
				}))
				// time.Sleep(3 * time.Second)
				// fmt.Println("sending some message to some black hole")
				// client.GC.Write(gamecoordinator.NewGCMsgProtobuf(csgoAppId, uint32(csgoproto.ECsgoGCMsg_k_EMsgGCCStrike15_v2_MatchListRequestFullGameInfo), &csgoproto.CMsgGCCStrike15V2_MatchListRequestFullGameInfo{
				// 	Matchid:   &matchData.MatchID,
				// 	Outcomeid: &matchData.OutcomeID,
				// 	Token:     &matchData.Token,
				// }))
				// client.GC.Write(gamecoordinator.NewGCMsgProtobuf(csgoAppId, uint32(csgoproto.ECsgoGCMsg_k_EMsgGCCStrike15_v2_MatchListRequestRecentUserGames),
				// 	&csgoproto.CMsgGCCStrike15V2_MatchListRequestRecentUserGames{Accountid: accountId(steamid)}))

				// client.GC.Write(gamecoordinator.NewGCMsgProtobuf(csgoAppId, uint32(csgoproto.ECsgoGCMsg_k_EMsgGCCStrike15_v2_MatchListRequestRecentUserGames),
				// &csgoproto.CMsgGCCStrike15V2_MatchListRequestRecentUserGames{Accountid: accountId(steamid)}))

			case *sclient.LogOnFailedEvent:
				fmt.Printf("eh? %+v\n", e)
			case sclient.FatalErrorEvent:
				log.Print(e)
			case error:
				log.Print(e)
			}
		}
	}()
	connected.Wait()

	return &steamClient{
		client: client,
	}
}

var steamid uint64 = 76561197979904892

type handler struct {
}

func (h *handler) HandleGCPacket(packet *gamecoordinator.GCPacket) {
	switch packet.MsgType {
	case uint32(csgoproto.EGCBaseClientMsg_k_EMsgGCClientWelcome):
		{
			// var msg protobuf.CMsgClientWelcome
			// packet.ReadProtoMsg(&msg)
			fmt.Println("Welcome")
			// fmt.Printf("message ??? co coco ??? %+v", msg)
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
			fmt.Printf(">>> %+v\n", packet)
			var msg csgoproto.GlobalStatistics
			packet.ReadProtoMsg(&msg)
			fmt.Printf("hm? %+v", msg)
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
