package auth

import (
	"golang.org/x/oauth2"
)

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
	UserId    string `json:"user_id"`
	Username  string `json:"username"`
	AvatarUrl string `json:"avatarUrl"`
}
