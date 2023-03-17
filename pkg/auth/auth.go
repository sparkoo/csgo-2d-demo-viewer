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

type FaceitUserInfo struct {
	Nickname string `json:"nickname"`
	Guid     string `json:"guid"`
	Iss      string `json:"iss"`
	Aud      string `json:"aud"`
}

type SteamAuthInfo struct{}
