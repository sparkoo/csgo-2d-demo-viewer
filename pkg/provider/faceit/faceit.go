package faceit

import (
	"context"
	"crypto/tls"
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/auth"
	"csgo-2d-demo-player/pkg/list/match"
	"csgo-2d-demo-player/pkg/log"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

const faceitOpenApiUrlBase = "https://open.faceit.com/data/v4"

type FaceitClient struct {
	oauthConfig *oauth2.Config
	httpClient  *http.Client
	apiKey      string
}

func NewFaceitClient(config *conf.Conf) *FaceitClient {
	faceitOAuthConfig := &oauth2.Config{
		ClientID:     config.FaceitOAuthClientId,
		ClientSecret: config.FaceitOAuthClientSecret,
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.faceit.com",
			TokenURL: "https://api.faceit.com/auth/v1/oauth/token",
		},
		Scopes: []string{"openid", "profile"},
	}

	return &FaceitClient{
		oauthConfig: faceitOAuthConfig,
		apiKey:      config.FaceitApiKey,
		httpClient: &http.Client{
			Timeout: time.Second * 60,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: true,
				},
			}},
	}
}

type matchDemo struct {
	DemoUrl []string `json:"demo_url"`
}

var ErrorNoDemo = errors.New("no demo found for this match")

func (f *FaceitClient) FaceitLogoutHandler(w http.ResponseWriter, r *http.Request) {
	auth.ClearCookie(auth.AuthCookieName, w)
	http.Redirect(w, r, r.Header.Get("Referer"), http.StatusTemporaryRedirect)
}

func (f *FaceitClient) FaceitLoginHandler(w http.ResponseWriter, r *http.Request) {
	url := f.oauthConfig.AuthCodeURL(r.Header.Get("Referer"))
	url += "&redirect_popup=true"
	fmt.Printf("Visit the URL for the auth dialog: %v", url)

	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (f *FaceitClient) FaceitOAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	// we need to set insecure here, because faceit is using some weird CA
	// would be nice to fix, but who kers now (haha)
	ctx := context.WithValue(r.Context(), oauth2.HTTPClient, &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}})

	code := r.URL.Query().Get("code")
	tok, err := f.oauthConfig.Exchange(ctx, code)
	if err != nil {
		log.L().Error("failed to exchange oauth", zap.Error(err))
	}
	log.L().Info("faceit token", zap.Any("token", tok.TokenType), zap.Any("expiry", tok.Expiry))

	client := f.oauthConfig.Client(ctx, tok)
	resp, err := client.Get("https://api.faceit.com/auth/v1/resources/userinfo")
	if err != nil {
		log.L().Error("failed to get oauth", zap.Error(err))
	}
	respbody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.L().Error("failed to read resp body", zap.Error(err))
	}
	// log.L().Info("get resp", zap.String("getresp", string(respbody)))

	userInfo := &auth.FaceitUserInfo{}
	errUnmarshalUserInfo := json.Unmarshal(respbody, userInfo)
	if errUnmarshalUserInfo != nil {
		log.L().Error("failed to unmarshall user info", zap.Error(errUnmarshalUserInfo))
	}

	authInfo := &auth.AuthInfo{
		Faceit: &auth.FaceitAuthInfo{
			Token:    tok,
			UserInfo: userInfo,
		},
	}

	errCookie := auth.SetAuthCookie(auth.AuthCookieName, authInfo, w)
	if errCookie != nil {
		log.L().Error("failed to set the auth cookie", zap.Error(errCookie))
	}
	http.Redirect(w, r, r.URL.Query().Get("state"), http.StatusTemporaryRedirect)
}

func (f *FaceitClient) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	reqUrl := fmt.Sprintf("%s/%s", faceitOpenApiUrlBase, r.URL.String())

	log.L().Debug("Proxying request to faceit", zap.String("url", reqUrl))

	proxyReq, errProxyReq := http.NewRequestWithContext(ctx, r.Method, reqUrl, nil)
	proxyReq.Header.Set("Authorization", "Bearer "+f.apiKey)
	if errProxyReq != nil {
		log.L().Error("failed to create faceit proxy request", zap.Error(errProxyReq))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	proxyResponse, errProxyDoReq := f.httpClient.Do(proxyReq)
	if errProxyDoReq != nil {
		log.L().Error("failed to request faceit", zap.Error(errProxyDoReq))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if proxyResponse.Body != nil {
		proxyResponseContent, errReadBody := io.ReadAll(proxyResponse.Body)
		if errReadBody != nil {
			log.L().Error("failed to read faceit proxy response body", zap.Error(errReadBody))
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if proxyResponse.StatusCode != http.StatusOK {
			log.L().Debug("non ok status code to faceit api", zap.Int("code", proxyResponse.StatusCode))
		}
		w.WriteHeader(proxyResponse.StatusCode)
		if _, errWrite := w.Write(proxyResponseContent); errWrite != nil {
			log.L().Error("failed to write faceit proxy response", zap.Error(errWrite))
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	} else {
		log.L().Info("empty body? how so ?", zap.Int("code", proxyResponse.StatusCode))
		w.WriteHeader(proxyResponse.StatusCode)
	}
}

func (f *FaceitClient) ListMatches(authInfo *auth.FaceitAuthInfo) []match.MatchInfo {
	return []match.MatchInfo{
		{
			Id:       "ahahaha",
			DateTime: time.Now().String(),
			Map:      "de_inferno",
			TeamA:    "Lofu",
			TeamB:    "Bofu",
			ScoreA:   16,
			ScoreB:   6,
		},
		{
			Id:       "ehehe",
			DateTime: time.Now().Add(-2 * time.Hour).String(),
			Map:      "de_nuke",
			TeamA:    "Lofu",
			TeamB:    "Bofu 2",
			ScoreA:   4,
			ScoreB:   16,
		},
	}
}

func (f *FaceitClient) DemoStream(matchId string) (io.ReadCloser, error) {
	demoUrl, urlErr := f.getDemoUrl(matchId)
	if urlErr != nil {
		return nil, urlErr
	}

	// log.Printf("Reading file '%s'", demoUrl)
	req, reqErr := f.createRequest(demoUrl, false)
	if reqErr != nil {
		return nil, reqErr
	}
	reader, doReqErr := f.doRequestStream(req)
	if doReqErr != nil {
		return nil, doReqErr
	}
	return reader, nil
}

func (f *FaceitClient) getDemoUrl(matchId string) (string, error) {
	url := fmt.Sprintf("%s/matches/%s", faceitOpenApiUrlBase, matchId)
	// log.Printf("requesting url '%s'", url)
	req, reqErr := f.createRequest(url, true)
	if reqErr != nil {
		return "", reqErr
	}
	q := req.URL.Query()
	req.URL.RawQuery = q.Encode()
	resp, doReqErr := f.doRequest(req, true)
	if doReqErr != nil {
		return "", doReqErr
	}

	content, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	demo := &matchDemo{}
	jsonErr := json.Unmarshal(content, demo)
	if jsonErr != nil {
		return "", jsonErr
	}

	if len(demo.DemoUrl) == 0 {
		return "", ErrorNoDemo
	}

	return demo.DemoUrl[0], nil
}

func (f *FaceitClient) createRequest(url string, auth bool) (*http.Request, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	if auth && f.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+f.apiKey)
	}

	return req, nil
}

func (f *FaceitClient) doRequest(req *http.Request, expect200 bool) (*http.Response, error) {
	var resp *http.Response
	for i := 0; i < 3; i++ {
		var err error
		resp, err = f.httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		if !expect200 {
			break
		}
		if resp.StatusCode == 200 {
			break
		}
		log.Printf("response code '%d'", resp.StatusCode)
	}

	return resp, nil
}

func (f *FaceitClient) doRequestStream(req *http.Request) (io.ReadCloser, error) {
	var resp *http.Response
	for i := 0; i < 3; i++ {
		var err error
		resp, err = f.httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode == 200 {
			return resp.Body, nil
		}
		log.Printf("failed request '%+v', resp '%+v'", req, resp)
		resp.Body.Close()
	}

	return nil, fmt.Errorf("failed 3 times to do a request")
}
