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

type SteamClient struct {
	nonceStore     openid.NonceStore
	discoveryCache openid.DiscoveryCache
}

func NewSteamClient(config *conf.Conf) *SteamClient {
	return &SteamClient{
		nonceStore:     openid.NewSimpleNonceStore(),
		discoveryCache: openid.NewSimpleDiscoveryCache(),
	}
}

func (s *SteamClient) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	auth.ClearCookie(auth.AuthCookieName, w)
	http.Redirect(w, r, r.Header.Get("Referer"), http.StatusSeeOther)
}

func (s *SteamClient) LoginHandler(w http.ResponseWriter, r *http.Request) {
	url, errOpenid := openid.RedirectURL("http://steamcommunity.com/openid", "http://localhost:8080/auth/steam/callback", "http://localhost:8080")
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
	fullUrl := "http://localhost:8080" + r.URL.String()
	id, errOpenidVerify := openid.Verify(fullUrl, s.discoveryCache, s.nonceStore)
	if errOpenidVerify != nil {
		log.L().Error("failed to verify steam openid", zap.Error(errOpenidVerify))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	log.L().Info("steam openid", zap.String("id", id))
	userSteamId, _ := parseSteamId(id)

	authInfo, errCookie := auth.GetAuthCookie(auth.AuthCookieName, r, &auth.AuthInfo{})
	if errCookie != nil {
		log.L().Error("failed to get auth cookie")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if authInfo == nil {
		authInfo = &auth.AuthInfo{}
	}
	authInfo.Steam = &auth.SteamAuthInfo{UserId: userSteamId}
	errCookieWrite := auth.SetAuthCookie(auth.AuthCookieName, authInfo, w)
	if errCookieWrite != nil {
		log.L().Error("failed to set auth cookie", zap.Error(errCookieWrite))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, "http://localhost:3001", http.StatusSeeOther)
}

func parseSteamId(idUrl string) (string, error) {
	id := idUrl[strings.LastIndex(idUrl, "/")+1:]
	log.L().Info("user", zap.String("id", id))
	return id, nil
}

// https://steamcommunity.com/openid/.well-known/openid-configuration/
