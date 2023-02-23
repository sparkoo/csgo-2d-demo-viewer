package auth

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/log"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

type FaceitAuth struct {
	oauthConfig *oauth2.Config
}

func NewFaceitAuth(config *conf.Conf) *FaceitAuth {
	faceitOAuthConfig := &oauth2.Config{
		ClientID:     config.FaceitOAuthClientId,
		ClientSecret: config.FaceitOAuthClientSecret,
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.faceit.com",
			TokenURL: "https://api.faceit.com/auth/v1/oauth/token",
		},
		Scopes:      []string{"openid"},
		RedirectURL: "http://localhost:8080/oauth/callback",
	}

	return &FaceitAuth{
		oauthConfig: faceitOAuthConfig,
	}
}

func (fa *FaceitAuth) FaceitLoginHandler(w http.ResponseWriter, r *http.Request) {
	url := fa.oauthConfig.AuthCodeURL("state")
	url += "&redirect_popup=true"
	fmt.Printf("Visit the URL for the auth dialog: %v", url)

	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (fa *FaceitAuth) FaceitOAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	code := r.URL.Query().Get("code")
	tok, err := fa.oauthConfig.Exchange(ctx, code)
	if err != nil {
		log.L().Error("failed to exchange oauth", zap.Error(err))
	}
	log.L().Info("faceit token", zap.Any("token", tok))

	client := fa.oauthConfig.Client(ctx, tok)
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
		Name:     "auth",
		Value:    string(encoded),
		Path:     "/",
		MaxAge:   60 * 60 * 24 * 14,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})
	http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
}
