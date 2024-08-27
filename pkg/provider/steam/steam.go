package steam

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/auth"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/utils"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/yohcop/openid-go"
	"go.uber.org/zap"
)

const SteamAuthCookieName = "authSteam"

type SteamProvider struct {
	nonceStore     openid.NonceStore
	discoveryCache openid.DiscoveryCache
	hostScheme     string
	conf           *conf.Conf
	httpClient     *http.Client
	webKey         string
}

func NewSteamClient(config *conf.Conf) *SteamProvider {
	hostScheme := "https://"
	if config.Mode == conf.MODE_DEV {
		hostScheme = "http://"
	}
	return &SteamProvider{
		nonceStore:     openid.NewSimpleNonceStore(),
		discoveryCache: openid.NewSimpleDiscoveryCache(),
		conf:           config,
		hostScheme:     hostScheme,
		httpClient:     &http.Client{},
		webKey:         config.SteamWebApiKey,
	}
}

func (s *SteamProvider) DemoStream(matchId string) (io.ReadCloser, error) {
	log.L().Debug("obtaining steam demo", zap.String("matchId", matchId))
	// demoUrl, urlErr := s.getDemoUrl(matchId)
	// if urlErr != nil {
	// 	return nil, urlErr
	// }
	demoUrl := "http://replay271.valve.net/730/003649983419980447965_1042911274.dem.bz2"

	// log.Printf("Reading file '%s'", demoUrl)
	req, reqErr := utils.CreateRequest(demoUrl, "")
	if reqErr != nil {
		return nil, reqErr
	}
	resp, doReqErr := utils.DoRequest(s.httpClient, req, 200, 3)
	if doReqErr != nil {
		return nil, doReqErr
	}
	return resp.Body, nil
}

func (s *SteamProvider) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	auth.ClearCookie(SteamAuthCookieName, w)
	http.Redirect(w, r, r.Header.Get("Referer"), http.StatusSeeOther)
}

func (s *SteamProvider) LoginHandler(w http.ResponseWriter, r *http.Request) {
	url, errOpenid := openid.RedirectURL("https://steamcommunity.com/openid", s.hostScheme+r.Host+"/auth/steam/callback", s.hostScheme+r.Host)
	if errOpenid != nil {
		log.L().Error("failed to create steam openid url", zap.Error(errOpenid))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	log.L().Info("redirecting to steam openid", zap.Any("url", url))
	http.Redirect(w, r, url, http.StatusSeeOther)
}

func (s *SteamProvider) OAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	log.L().Info("got", zap.String("params", r.URL.Query().Encode()))
	fullUrl := s.hostScheme + r.Host + r.URL.String()
	log.L().Info("verify steam openid", zap.String("url", fullUrl))
	id, errOpenidVerify := openid.Verify(fullUrl, s.discoveryCache, s.nonceStore)
	if errOpenidVerify != nil {
		log.L().Error("failed to verify steam openid", zap.Error(errOpenidVerify))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	log.L().Info("steam openid", zap.String("id", id))
	userSteamId, _ := parseSteamId(id)
	userSteamDetails, errGetUsername := s.getSteamUsername(userSteamId)
	if errGetUsername != nil {
		log.L().Error("failed to get steam user details", zap.Error(errGetUsername))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	authInfo := &auth.SteamAuthInfo{
		UserId:    userSteamDetails.SteamID,
		Username:  userSteamDetails.PersonaName,
		AvatarUrl: userSteamDetails.AvatarMedium,
	}
	errCookieWrite := auth.SetAuthCookie(SteamAuthCookieName, authInfo, w)
	if errCookieWrite != nil {
		log.L().Error("failed to set auth cookie", zap.Error(errCookieWrite))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	log.L().Info("red", zap.String("referer", r.Header.Get("Referer")))
	redirectUrl := s.hostScheme + r.Host
	if s.conf.Mode == conf.MODE_DEV {
		redirectUrl = "http://localhost:3001"
	}
	http.Redirect(w, r, redirectUrl, http.StatusSeeOther)
}

func (s *SteamProvider) getSteamUsername(userId string) (*Player, error) {
	steamUserDetailUrl := fmt.Sprintf("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=%s&steamids=%s", s.webKey, userId)
	resp, errReq := s.httpClient.Get(steamUserDetailUrl)
	if errReq != nil {
		return nil, fmt.Errorf("failed to request steam user details: %w", errReq)
	}

	defer resp.Body.Close()
	body, errBodyRead := io.ReadAll(resp.Body)
	if errBodyRead != nil {
		return nil, fmt.Errorf("failed to read steam user request bnopdy: %w", errBodyRead)
	}

	userDetailsResponse := &SteamUserDetailsResponse{}
	errUnmarshall := json.Unmarshal(body, userDetailsResponse)
	if errUnmarshall != nil {
		log.L().Error("failed response from steam user detail", zap.String("body", string(body)), zap.String("url", steamUserDetailUrl))
		return nil, fmt.Errorf("failed to unmarshall response from steam: %w", errUnmarshall)
	}

	log.L().Info("steam user details", zap.Any("body", string(body)))

	return &userDetailsResponse.Response.Players[0], nil
}

func parseSteamId(idUrl string) (string, error) {
	id := idUrl[strings.LastIndex(idUrl, "/")+1:]
	log.L().Info("user", zap.String("id", id))
	return id, nil
}

type Player struct {
	SteamID                  string `json:"steamid"`
	CommunityVisibilityState int    `json:"communityvisibilitystate"`
	ProfileState             int    `json:"profilestate"`
	PersonaName              string `json:"personaname"`
	ProfileURL               string `json:"profileurl"`
	Avatar                   string `json:"avatar"`
	AvatarMedium             string `json:"avatarmedium"`
	AvatarFull               string `json:"avatarfull"`
	AvatarHash               string `json:"avatarhash"`
	LastLogOff               int64  `json:"lastlogoff"`
	PersonaState             int    `json:"personastate"`
	PrimaryClanID            string `json:"primaryclanid"`
	TimeCreated              int64  `json:"timecreated"`
	PersonaStateFlags        int    `json:"personastateflags"`
}

type Response struct {
	Players []Player `json:"players"`
}

type SteamUserDetailsResponse struct {
	Response Response `json:"response"`
}
