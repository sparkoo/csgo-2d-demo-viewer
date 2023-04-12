package steam

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/auth"
	"csgo-2d-demo-player/pkg/log"
	"net/http"
	"strings"

	"github.com/yohcop/openid-go"
	"go.uber.org/zap"
)

const SteamAuthCookieName = "authSteam"

type SteamClient struct {
	nonceStore     openid.NonceStore
	discoveryCache openid.DiscoveryCache
	hostScheme     string
	conf           *conf.Conf
}

func NewSteamClient(config *conf.Conf) *SteamClient {
	hostScheme := "https://"
	if config.Mode == conf.MODE_DEV {
		hostScheme = "http://"
	}
	return &SteamClient{
		nonceStore:     openid.NewSimpleNonceStore(),
		discoveryCache: openid.NewSimpleDiscoveryCache(),
		conf:           config,
		hostScheme:     hostScheme,
	}
}

func (s *SteamClient) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	auth.ClearCookie(SteamAuthCookieName, w)
	http.Redirect(w, r, r.Header.Get("Referer"), http.StatusSeeOther)
}

func (s *SteamClient) LoginHandler(w http.ResponseWriter, r *http.Request) {
	url, errOpenid := openid.RedirectURL("https://steamcommunity.com/openid", s.hostScheme+r.Host+"/auth/steam/callback", s.hostScheme+r.Host)
	if errOpenid != nil {
		log.L().Error("failed to create steam openid url", zap.Error(errOpenid))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	log.L().Info("redirecting to steam openid", zap.Any("url", url))
	http.Redirect(w, r, url, http.StatusSeeOther)
}

func (s *SteamClient) OAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	log.L().Info("got", zap.String("params", r.URL.Query().Encode()))
	fullUrl := s.hostScheme + r.Host + r.URL.String()
	id, errOpenidVerify := openid.Verify(fullUrl, s.discoveryCache, s.nonceStore)
	if errOpenidVerify != nil {
		log.L().Error("failed to verify steam openid", zap.Error(errOpenidVerify))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	log.L().Info("steam openid", zap.String("id", id))
	userSteamId, _ := parseSteamId(id)

	authInfo := &auth.SteamAuthInfo{UserId: userSteamId}
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

func parseSteamId(idUrl string) (string, error) {
	id := idUrl[strings.LastIndex(idUrl, "/")+1:]
	log.L().Info("user", zap.String("id", id))
	return id, nil
}

// https://steamcommunity.com/openid/.well-known/openid-configuration/
