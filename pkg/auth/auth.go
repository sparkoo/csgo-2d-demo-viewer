package auth

import "golang.org/x/oauth2"

type AuthInfo struct {
	Faceit *FaceitAuthInfo `json:"faceit"`
	Steam  *SteamAuthInfo  `json:"steam"`
}

type FaceitAuthInfo struct {
	UserInfo *FaceitUserInfo `json:"user_info"`
	Token    *oauth2.Token   `json:"access_token"`
}

type FaceitUserInfo struct {
}

type SteamAuthInfo struct{}
