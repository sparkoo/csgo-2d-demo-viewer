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
	"strings"
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
	matches, err := f.listMatches(authInfo.UserInfo.Guid, 30)
	if err != nil {
		log.L().Error("failed t olist faceit matches", zap.Error(err))
	}
	return matches
}

func (f *FaceitClient) MatchDetails(reader io.ReadCloser) (*match.MatchInfo, error) {
	matchBytes, errRead := io.ReadAll(reader)
	defer reader.Close()
	if errRead != nil {
		return nil, fmt.Errorf("failed to read match detail from request: %w", errRead)
	}
	matchInfo := &match.MatchInfo{}
	if errUnmarshall := json.Unmarshal(matchBytes, matchInfo); errUnmarshall != nil {
		return nil, fmt.Errorf("failed to unmarshall match detail", errUnmarshall)
	}

	req, errReq := f.createRequest(fmt.Sprintf("%s/matches/%s/stats", faceitOpenApiUrlBase), true)
	if errReq != nil {
		return nil, fmt.Errorf("failed to create list matches request: %w", errReq)
	}
	resp, errDoReq := f.doRequest(req, 200, 3)
	if errDoReq != nil {
		return nil, fmt.Errorf("failed to do list matches request: %w", errDoReq)
	}
	respBody, errRead := io.ReadAll(resp.Body)
	defer resp.Body.Close()
	if errRead != nil {
		return nil, fmt.Errorf("failed to read list matches response body: %w", errRead)
	}

	data := &GameStats{}
	errUnmarshall := json.Unmarshal(respBody, data)
	if errUnmarshall != nil {
		return nil, fmt.Errorf("failed to unmarshall list matches response body: %w", errUnmarshall)
	}
	matchInfo.Map = data.Rounds[0].RoundStats.Map

	return matchInfo, nil
}

func (f *FaceitClient) listMatches(userGuid string, limit int) ([]match.MatchInfo, error) {
	req, errReq := f.createRequest(fmt.Sprintf("%s/players/%s/history?game=csgo&limit=%d", faceitOpenApiUrlBase, userGuid, limit), true)
	if errReq != nil {
		return nil, fmt.Errorf("failed to create list matches request: %w", errReq)
	}

	resp, errDoReq := f.doRequest(req, 200, 3)
	if errDoReq != nil {
		return nil, fmt.Errorf("failed to do list matches request: %w", errDoReq)
	}

	respBody, errRead := io.ReadAll(resp.Body)
	defer resp.Body.Close()
	if errRead != nil {
		return nil, fmt.Errorf("failed to read list matches response body: %w", errRead)
	}

	data := MatchData{}
	errUnmarshall := json.Unmarshal(respBody, &data)
	if errUnmarshall != nil {
		return nil, fmt.Errorf("failed to unmarshall list matches response body: %w", errUnmarshall)
	}

	return convert(data), nil
}

func convert(matchData MatchData) []match.MatchInfo {
	matches := []match.MatchInfo{}
	for _, m := range matchData.Items {
		if m.GameMode != "5v5" || m.StartedAt == m.FinishedAt {
			continue
		}
		tm := time.Unix(m.StartedAt, 0)
		match := match.MatchInfo{
			Id:           m.MatchID,
			Host:         "faceit",
			DateTime:     tm.Local().Format("2006-01-02 15:04:05"),
			Type:         m.CompetitionName,
			TeamA:        m.Teams[TeamAKey].Nickname,
			ScoreA:       int(m.Results.Score[TeamAKey]),
			TeamAPlayers: mapPlayerIds(m.Teams[TeamAKey].Players),
			TeamB:        m.Teams[TeamBKey].Nickname,
			ScoreB:       int(m.Results.Score[TeamBKey]),
			TeamBPlayers: mapPlayerIds(m.Teams[TeamBKey].Players),
			MatchLink:    strings.Replace(m.FaceitURL, "{lang}", "en", 1),
		}
		// log.L().Info("converted", zap.Any("match", match))
		matches = append(matches, match)
	}
	return matches
}

func mapPlayerIds(players []Player) []string {
	playerIds := []string{}
	for _, pid := range players {
		playerIds = append(playerIds, pid.PlayerID)
	}
	return playerIds
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
	resp, doReqErr := f.doRequest(req, 200, 3)
	if doReqErr != nil {
		return nil, doReqErr
	}
	return resp.Body, nil
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
	resp, doReqErr := f.doRequest(req, 200, 3)
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

func (f *FaceitClient) doRequest(req *http.Request, expectCode int, retries int) (*http.Response, error) {
	var resp *http.Response
	for i := 0; i < retries; i++ {
		var err error
		resp, err = f.httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode == expectCode {
			return resp, nil
		}
		log.Printf("response code '%d' but expected '%d', trying again '%d/%d'", resp.StatusCode, expectCode, i, retries)
	}

	return resp, fmt.Errorf("failed request with code '%d'", resp.StatusCode)
}
