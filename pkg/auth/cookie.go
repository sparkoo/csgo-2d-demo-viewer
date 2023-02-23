package auth

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
)

const sparko2dAuth = "2dsparkoauth"

func getAuthCookie(r *http.Request) (*AuthInfo, error) {
	authCookie, err := r.Cookie(sparko2dAuth)
	if err != nil {
		//TODO: check if cookie was not found and return nil,nil in that case
		return nil, err
	}

	decoded, errDecode := base64.StdEncoding.DecodeString(authCookie.Value)
	if errDecode != nil {
		return nil, errDecode
	}

	authInfo := &AuthInfo{}
	errUnmarshall := json.Unmarshal(decoded, authInfo)
	if errUnmarshall != nil {
		return nil, errUnmarshall
	}

	return authInfo, nil
}

func setAuthCookie(authInfo *AuthInfo, w http.ResponseWriter) error {
	jsonAuth, errJsonMarshall := json.Marshal(authInfo)
	if errJsonMarshall != nil {
		return errJsonMarshall
	}

	authCookie := base64.StdEncoding.EncodeToString(jsonAuth)

	http.SetCookie(w, &http.Cookie{
		Name:     sparko2dAuth,
		Value:    authCookie,
		Path:     "/",
		MaxAge:   60 * 60 * 24 * 14,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	return nil
}
