package auth

import (
	"fmt"

	"golang.org/x/oauth2"
)

type AuthInfo struct {
	Faceit *FaceitAuthInfo `json:"faceit"`
	Steam  *SteamAuthInfo  `json:"steam"`
}

func (a *AuthInfo) String() string {
	return fmt.Sprintf("%b", a)
}

type FaceitAuthInfo struct {
	UserInfo *FaceitUserInfo `json:"user_info"`
	Token    *oauth2.Token   `json:"access_token"`
}

// {\"nickname\":\"spr21\",\"guid\":\"d0a85a88-0f69-4671-8f5e-d6dd10b98168\",\"iss\":\"https://api.faceit.com/auth\",\"aud\":\"320c957d-cc44-4176-848c-835e453af091\"}
type FaceitUserInfo struct {
	Nickname string `json:"nickname"`
	Guid     string `json:"guid"`
	Iss      string `json:"iss"`
	Aud      string `json:"aud"`
}

type SteamAuthInfo struct{}
