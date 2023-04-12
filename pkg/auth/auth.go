package auth

import (
	"golang.org/x/oauth2"
)

type AuthInfo struct {
	Faceit *FaceitAuthInfo `json:"faceit"`
	Steam  *SteamAuthInfo  `json:"steam"`
}

func (a *AuthInfo) String() string {
	return a.Faceit.UserInfo.Nickname
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

type SteamAuthInfo struct {
	UserId string `json:"user_id"`
}
