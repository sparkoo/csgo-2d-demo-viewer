package conf

type Mode string

const MODE_DEV Mode = "dev"
const MODE_PROD Mode = "prod"

type Conf struct {
	// Demodir string `arg:"--demodir, env:DEMODIR" default:"" help:"Path to directory with demos."`
	FaceitApiKey            string `arg:"--faceitApiKey, env:FACEIT_APIKEY" help:"Faceit Server API key. Get it at https://developers.faceit.com/docs/auth/api-keys"`
	FaceitOAuthClientId     string `arg:"--faceitOAuthClientId, env:FACEIT_OAUTH_CLIENT_ID"`
	FaceitOAuthClientSecret string `arg:"--faceitOAuthClientSecret, env:FACEIT_OAUTH_CLIENT_SECRET"`
	SteamWebApiKey          string `arg:"--steamWebApiKey, env:STEAM_WEB_APIKEY"`
	Listen                  string `arg:"--listen, env:LISTEN" default:"127.0.0.1"`
	Port                    int    `arg:"--port, env:PORT" default:"8080" help:"Server port"`
	Mode                    Mode   `arg:"--mode, env:MODE" default:"dev" help:"Runtime environment mode, one of 'dev', 'prod'"`
}

type ConfSteamSvc struct {
	SteamWebApiKey string `arg:"--steamWebApiKey, required, env:STEAM_WEB_APIKEY"`
	SteamUsername  string `arg:"--steamUsername, required, env:STEAM_USERNAME"`
	SteamPassword  string `arg:"--steamPassword, required, env:STEAM_PASSWORD"`
	Listen         string `arg:"--listen, env:LISTEN" default:"127.0.0.1"`
	Port           int    `arg:"--port, env:PORT" default:"8081" help:"Server port"`
	Mode           Mode   `arg:"--mode, env:MODE" default:"dev" help:"Runtime environment mode, one of 'dev', 'prod'"`
}
