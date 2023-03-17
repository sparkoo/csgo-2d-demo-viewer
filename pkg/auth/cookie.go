package auth

import (
	"csgo-2d-demo-player/pkg/log"
	"encoding/base64"
	"encoding/json"
	"net/http"

	"go.uber.org/zap"
)

const AuthCookieName = "auth"

func GetAuthCookie[T any](name string, r *http.Request, objType *T) (*T, error) {
	authCookie, err := r.Cookie(name)
	if err != nil {
		//TODO: check if cookie was not found and return nil,nil in that case
		log.L().Info("failed to get the cookie", zap.Error(err))
		return nil, err
	}

	decoded, errDecode := base64.StdEncoding.DecodeString(authCookie.Value)
	if errDecode != nil {
		return nil, errDecode
	}

	errUnmarshall := json.Unmarshal(decoded, objType)
	if errUnmarshall != nil {
		return nil, errUnmarshall
	}

	return objType, nil
}

func SetAuthCookie(name string, obj any, w http.ResponseWriter) error {
	jsonAuth, errJsonMarshall := json.Marshal(obj)
	if errJsonMarshall != nil {
		return errJsonMarshall
	}

	authCookie := base64.StdEncoding.EncodeToString(jsonAuth)

	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    authCookie,
		Path:     "/",
		MaxAge:   60 * 60 * 24 * 30,
		Secure:   false,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Domain:   "",
	})

	return nil
}

func ClearCookie(name string, w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:   name,
		Path:   "/",
		MaxAge: 0,
	})
}
