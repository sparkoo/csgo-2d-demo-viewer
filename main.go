package main

import (
	"compress/bzip2"
	"compress/gzip"
	"context"
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/auth"
	"csgo-2d-demo-player/pkg/list"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/message"
	"csgo-2d-demo-player/pkg/parser"
	"csgo-2d-demo-player/pkg/provider/faceit"
	"csgo-2d-demo-player/pkg/provider/steam"
	"csgo-2d-demo-player/pkg/provider/upload"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/alexflint/go-arg"
	"github.com/gorilla/websocket"
	"github.com/markus-wa/demoinfocs-golang/v4/pkg/demoinfocs"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

var config *conf.Conf
var faceitClient *faceit.FaceitClient
var steamClient *steam.SteamProvider
var uploadClient *upload.UploadProvider

func main() {
	ctx := context.Background()
	config = &conf.Conf{}
	arg.MustParse(config)

	log.Init(config.Mode)
	defer log.Close()

	log.L().Debug("using config", zap.Any("config", config))
	faceitClient = faceit.NewFaceitClient(config)
	steamClient = steam.NewSteamClient(config)
	uploadClient = upload.NewUploadClient()
	// log.Printf("using config %+v", config)
	server(ctx)
}

func handleMessages(in chan []byte, out chan []byte) {
	for msg := range in {
		var messageObj message.Message
		err := proto.Unmarshal(msg, &messageObj)
		if err != nil {
			log.Print("failed unmarshal websocket message", err)
		}
		switch messageObj.MsgType {
		case message.Message_PlayRequestType:
			go playDemo(out, messageObj.Demo)
		}
	}
}

func server(ctx context.Context) {
	mux := http.NewServeMux()

	mux.Handle("/assets/", http.StripPrefix("/assets", http.FileServer(http.Dir("./web/dist/assets"))))
	mux.Handle("/wasm/", http.StripPrefix("/wasm", http.FileServer(http.Dir("./web/dist/wasm"))))
	fs := http.FileServer(http.Dir("web/dist"))
	mux.Handle("/", fs)
	mux.Handle("/player", http.StripPrefix("/player", fs))
	// mux.Handle("/player/", http.StripPrefix("/player", http.FileServer(http.Dir("web/player/build"))))

	listService, listServiceErr := list.NewListService(ctx, config)
	if listServiceErr != nil {
		log.L().Error("failed to create match list service. /match endpoint won't work", zap.Error(listServiceErr))
	} else {
		mux.HandleFunc("/match", listService.ListMatches)
		mux.HandleFunc("/match/upload", listService.UploadMatch)
	}

	// faceit auth
	mux.HandleFunc("/auth/faceit/login", faceitClient.LoginHandler)
	mux.HandleFunc("/auth/faceit/callback", faceitClient.OAuthCallbackHandler)
	mux.HandleFunc("/auth/faceit/logout", faceitClient.LogoutHandler)
	mux.Handle("/faceit/api/", http.StripPrefix("/faceit/api/", faceitClient))

	// steam auth
	mux.HandleFunc("/auth/steam/login", steamClient.LoginHandler)
	mux.HandleFunc("/auth/steam/callback", steamClient.OAuthCallbackHandler)
	mux.HandleFunc("/auth/steam/logout", steamClient.LogoutHandler)

	mux.HandleFunc("/auth/whoami", func(w http.ResponseWriter, r *http.Request) {
		if config.Mode == conf.MODE_DEV {
			w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		faceitAuth, err := auth.GetAuthCookie(faceit.FaceitAuthCookieName, r, &auth.FaceitAuthInfo{})
		if err != nil {
			log.L().Info("some error getting the cookie, why???", zap.Error(err))
			// http.Error(writer, err.Error(), 500)
		}
		// log.L().Info("cookie", zap.Any("cok", authCookie))
		type whoamiInfo struct {
			FaceitNickname string `json:"faceitNickname,omitempty"`
			FaceitGuid     string `json:"faceitGuid,omitempty"`
			SteamId        string `json:"steamId,omitempty"`
			SteamName      string `json:"steamUsername,omitempty"`
			SteamAvatar    string `json:"steamAvatar,omitempty"`
		}
		whoami := whoamiInfo{}
		if faceitAuth != nil {
			whoami.FaceitNickname = faceitAuth.UserInfo.Nickname
			whoami.FaceitGuid = faceitAuth.UserInfo.Guid
		}

		steamAuth, err := auth.GetAuthCookie(steam.SteamAuthCookieName, r, &auth.SteamAuthInfo{})
		if err != nil {
			log.L().Info("some error getting the cookie, why???", zap.Error(err))
			// http.Error(writer, err.Error(), 500)
		}
		if steamAuth != nil {
			whoami.SteamId = steamAuth.UserId
			whoami.SteamName = steamAuth.Username
			whoami.SteamAvatar = steamAuth.AvatarUrl
		}

		if whoamiJson, errMarshal := json.Marshal(whoami); errMarshal != nil {
			log.L().Error("failed to marshall whoami info", zap.Error(errMarshal))
		} else {
			_, errWrite := w.Write(whoamiJson)
			if errWrite != nil {
				log.L().Error("failed to write response", zap.Error(errWrite))
				w.WriteHeader(http.StatusServiceUnavailable)
			}
		}
	})

	mux.HandleFunc("/ws", func(writer http.ResponseWriter, request *http.Request) {
		// Upgrade our raw HTTP connection to a websocket based one
		upgrader := websocket.Upgrader{}
		if request.Host == "localhost:8080" {
			upgrader.CheckOrigin = func(r *http.Request) bool {
				return true
			}
		}
		conn, err := upgrader.Upgrade(writer, request, nil)
		if err != nil {
			log.Print("Error during connection upgradation:", err)
			return
		}

		out := make(chan []byte)
		in := make(chan []byte)
		go handleMessages(in, out)

		// out routine
		go func() {
			defer func() {
				if closeErr := conn.Close(); closeErr != nil {
					log.Printf("failed to close connection [out] '%s'", closeErr.Error())
				}
			}()

			for msg := range out {
				err = conn.WriteMessage(websocket.BinaryMessage, msg)
				if err != nil {
					log.Println("Error during message writing:", err)
					break
				}
			}
		}()

		// in routine
		go func() {
			defer func() {
				if closeErr := conn.Close(); closeErr != nil {
					log.Printf("failed to close connection [in] '%s'", closeErr.Error())
				}
			}()

			for {
				_, msg, err := conn.ReadMessage()
				if err != nil {
					closeErr, isCloseErr := err.(*websocket.CloseError)
					if !isCloseErr || closeErr.Code != websocket.CloseGoingAway {
						log.Println("Error during message reading: ", err)
					}
					break
				}
				in <- msg
			}
		}()
	})
	log.L().Info("HTTP server listening on ...", zap.String("listen", config.Listen), zap.Int("port", config.Port))
	// log.Println("Listening on ", config.Port, " ...")
	listenErr := http.ListenAndServe(fmt.Sprintf("%s:%d", config.Listen, config.Port), mux)
	log.L().Fatal("failed to listen", zap.Error(listenErr))
}

func playDemo(out chan []byte, demo *message.Demo) {
	log.L().Info("playing demo", zap.String("matchId", demo.MatchId), zap.String("platform", demo.Platform.String()))
	if demo.MatchId == "" {
		sendError("no matchId", out)
		return
	}
	demoFile, closers, err := obtainDemoFile(demo)
	if err != nil {
		sendError(err.Error(), out)
		return
	}

	defer func() {
		for _, c := range closers {
			if closeErr := c.Close(); closeErr != nil {
				log.Printf("[%s] failed to close resource. %s", demo.MatchId, closeErr)
			}
		}
	}()
	err = parser.Parse(demoFile, func(msg *message.Message, tick demoinfocs.GameState) {
		sendMessage(msg, out)
	})
	if err != nil {
		sendError(err.Error(), out)
	}
}

func sendMessage(msg *message.Message, out chan []byte) {
	payload, protoErr := proto.Marshal(msg)
	if protoErr != nil {
		sendError(protoErr.Error(), out)
	}
	out <- payload
}

func sendError(errorMessage string, out chan []byte) {
	log.Printf("sending error to client: '%s'", errorMessage)
	msg := &message.Message{
		MsgType: message.Message_ErrorType,
		Message: &errorMessage,
	}
	sendMessage(msg, out)
}

func obtainDemoFile(demo *message.Demo) (io.Reader, []io.Closer, error) {
	closers := make([]io.Closer, 0)

	var demoFileReader io.Reader
	switch demo.Platform {
	case message.Demo_Faceit:
		var faceitDemoReader io.ReadCloser
		var streamErr error
		faceitDemoReader, streamErr = faceitClient.DemoStream(demo.MatchId)
		closers = append(closers, faceitDemoReader)
		if streamErr != nil {
			log.Printf("[%s] Failed to create gzip reader from demo. %s", demo.MatchId, streamErr)
			return nil, closers, streamErr
		}

		var gzipReader io.ReadCloser
		gzipReader, streamErr = gzip.NewReader(faceitDemoReader)
		demoFileReader = gzipReader
		closers = append(closers, gzipReader)
		if streamErr != nil {
			log.Printf("[%s] Failed to create gzip reader from demo. %s", demo.MatchId, streamErr)
			return nil, closers, streamErr
		}
	case message.Demo_Steam:
		var steamDemoReader io.ReadCloser
		var streamErr error
		steamDemoReader, streamErr = steamClient.DemoStream(demo.MatchId)
		closers = append(closers, steamDemoReader)

		if streamErr != nil {
			log.Printf("[%s] Failed to create gzip reader from demo. %s", demo.MatchId, streamErr)
			return nil, closers, streamErr
		}
		demoFileReader = bzip2.NewReader(steamDemoReader)
	case message.Demo_Upload:
		var faceitDemoReader io.ReadCloser
		var streamErr error
		faceitDemoReader, streamErr = uploadClient.DemoStream(demo.MatchId)
		closers = append(closers, faceitDemoReader)
		if streamErr != nil {
			log.Printf("[%s] Failed to create gzip reader from demo. %s", demo.MatchId, streamErr)
			return nil, closers, streamErr
		}

		var gzipReader io.ReadCloser
		gzipReader, streamErr = gzip.NewReader(faceitDemoReader)
		demoFileReader = gzipReader
		closers = append(closers, gzipReader)
		if streamErr != nil {
			log.Printf("[%s] Failed to create gzip reader from demo. %s", demo.MatchId, streamErr)
			return nil, closers, streamErr
		}
	default:
		return nil, closers, fmt.Errorf("unknown demo platform %s", demo.Platform)
	}

	return demoFileReader, closers, nil
}
