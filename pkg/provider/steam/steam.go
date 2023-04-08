package steam

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/auth"
	"csgo-2d-demo-player/pkg/log"
	"net/http"

	"github.com/yohcop/openid-go"
	"go.uber.org/zap"
)

type SteamClient struct {
}

func NewSteamClient(config *conf.Conf) *SteamClient {
	return &SteamClient{}
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
	// openid.Verify()
	http.Redirect(w, r, "http://localhost:3001", http.StatusSeeOther)
}

// https://steamcommunity.com/openid/.well-known/openid-configuration/
