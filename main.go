package main

import (
	"compress/gzip"
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/message"
	"csgo-2d-demo-player/pkg/parser"
	"csgo-2d-demo-player/pkg/provider/faceit"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"

	"github.com/alexflint/go-arg"
	"github.com/gorilla/websocket"
	"github.com/markus-wa/demoinfocs-golang/v3/pkg/demoinfocs"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
	"google.golang.org/protobuf/proto"
)

var config *conf.Conf
var faceitClient *faceit.FaceitClient
var faceitOAuthConfig *oauth2.Config

func main() {
	config = &conf.Conf{}
	arg.MustParse(config)

	faceitOAuthConfig = &oauth2.Config{
		ClientID:     config.FaceitOAuthClientId,
		ClientSecret: config.FaceitOAuthClientSecret,
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.faceit.com",
			TokenURL: "https://api.faceit.com/auth/v1/oauth/token",
		},
		Scopes:      []string{"openid"},
		RedirectURL: "http://localhost:8080/oauth/callback",
	}

	log.Init(config)
	defer log.Close()

	log.L().Debug("using config", zap.Any("config", config))
	faceitClient = faceit.NewFaceitClient(config.FaceitApiKey)
	// log.Printf("using config %+v", config)
	server()
}

func handleMessages(in chan []byte, out chan []byte) {
	for msg := range in {
		var messageObj message.Message
		err := json.Unmarshal(msg, &messageObj)
		if err != nil {
			log.Print("failed unmarshal websocket message", err)
		}
		switch messageObj.MsgType {
		case message.Message_PlayRequestType:
			go playDemo(out, messageObj.Demo.MatchId)
		}
	}
}

func server() {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		// we want just /
		if request.URL.Path != "/" {
			http.Error(writer, "", 404)
			return
		}

		temp, err := template.ParseFiles("templates/list.html")
		if err != nil {
			http.Error(writer, err.Error(), 500)
		}

		if temp.Execute(writer, nil) != nil {
			http.Error(writer, err.Error(), 500)
		}
	})

	mux.HandleFunc("/faceitClientKey", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte(config.FaceitClientApiKey))
	})

	mux.HandleFunc("/faceit/login", func(w http.ResponseWriter, r *http.Request) {
		// ctx := context.Background()
		if val, ok := os.LookupEnv("DOTENV"); ok {
			log.Printf("env", zap.String("DOTENV", val))
		} else {
			log.Printf("env DOTENV not set")
		}
		url := faceitOAuthConfig.AuthCodeURL("state")
		url += "&redirect_popup=true"
		fmt.Printf("Visit the URL for the auth dialog: %v", url)

		http.Redirect(w, r, url, http.StatusTemporaryRedirect)
	})

	mux.HandleFunc("/oauth/callback", func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		code := r.URL.Query().Get("code")
		tok, err := faceitOAuthConfig.Exchange(ctx, code)
		if err != nil {
			log.L().Error("failed to exchange oauth", zap.Error(err))
		}
		log.L().Info("faceit token", zap.Any("token", tok))

		client := faceitOAuthConfig.Client(ctx, tok)
		resp, err := client.Get("https://api.faceit.com/auth/v1/resources/userinfo")
		if err != nil {
			log.L().Error("failed to get oauth", zap.Error(err))
		}
		respbody, err := io.ReadAll(resp.Body)
		if err != nil {
			log.L().Error("failed to read resp body", zap.Error(err))
		}
		log.L().Info("get resp", zap.String("getresp", string(respbody)))

		tokenBytes, errMarshall := json.Marshal(tok)
		if errMarshall != nil {
			log.L().Error("failed to marshall the token", zap.Error(errMarshall))
		}

		encoded := make([]byte, 1024)
		base64.RawStdEncoding.Encode(encoded, tokenBytes)

		http.SetCookie(w, &http.Cookie{
			Name:  "auth",
			Value: string(encoded),
			Path:  "/",

			// Domain     string    // optional
			// Expires    time.Time // optional
			// RawExpires string    // for reading cookies only

			// // MaxAge=0 means no 'Max-Age' attribute specified.
			// // MaxAge<0 means delete cookie now, equivalently 'Max-Age: 0'
			// // MaxAge>0 means Max-Age attribute present and given in seconds
			MaxAge:   60 * 60 * 24 * 14,
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
			// Raw      string
			// Unparsed []string // Raw text of unparsed attribute-value pairs
		})
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
	})

	playerFileServer := http.FileServer(http.Dir("web/player/build"))
	mux.Handle("/player/", http.StripPrefix("/player", playerFileServer))

	assetsFileServer := http.FileServer(http.Dir("./assets"))
	mux.Handle("/assets/", http.StripPrefix("/assets", assetsFileServer))

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

func playDemo(out chan []byte, matchId string) {
	log.L().Info("playing faceit demo", zap.String("matchId", matchId))
	if matchId == "" {
		sendError("no matchId", out)
		return
	}
	demoFile, closers, err := obtainDemoFile(matchId)
	if err != nil {
		sendError(err.Error(), out)
		return
	}
	defer func() {
		for _, c := range closers {
			if closeErr := c.Close(); closeErr != nil {
				log.Printf("[%s] failed to close resource. %s", matchId, closeErr)
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
	out <- []byte(fmt.Sprintf("{\"msgType\": %d, \"error\": {\"message\": \"%s\"}}", message.Message_ErrorType, errorMessage))
}

func obtainDemoFile(matchId string) (io.Reader, []io.Closer, error) {
	closers := make([]io.Closer, 0)

	demoFileReader, streamErr := faceitClient.DemoStream(matchId)
	if streamErr != nil {
		return nil, closers, streamErr
	}
	closers = append(closers, demoFileReader)

	gzipReader, gzipErr := gzip.NewReader(demoFileReader)
	if gzipErr != nil {
		log.Printf("[%s] Failed to create gzip reader from demo. %s", matchId, gzipErr)
		return nil, closers, gzipErr
	}
	closers = append(closers, gzipReader)
	return gzipReader, closers, gzipErr
}
