package auth

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
)

func GetAuthCookie[T any](name string, r *http.Request, objType *T) (*T, error) {
	authCookie, err := r.Cookie(name)
	if err != nil {
		if err == http.ErrNoCookie {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get the cookie: %w", err)
	}

	if authCookie.Value == "" {
		return nil, nil
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
		MaxAge: -1,
	})
}
