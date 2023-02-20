package conf

const (
	MODE_DEV  = "dev"
	MODE_PROD = "prod"
)

type Conf struct {
	Demodir                 string `arg:"--demodir, env:DEMODIR" default:"" help:"Path to directory with demos."`
	FaceitApiKey            string `arg:"--faceitApiKey, required, env:FACEIT_APIKEY" help:"Faceit Server API key. Get it at https://developers.faceit.com/docs/auth/api-keys"`
	FaceitClientApiKey      string `arg:"--faceitClientApiKey, required, env:FACEIT_CLIENT_APIKEY" help:"Faceit Client API key. Get it at https://developers.faceit.com/docs/auth/api-keys"`
	FaceitOAuthClientId     string `arg:"--faceitOAuthClientId, env:FACEIT_OAUTH_CLIENT_ID"`
	FaceitOAuthClientSecret string `arg:"--faceitOAuthClientSecret, env:FACEIT_OAUTH_CLIENT_SECRET"`
	Listen                  string `arg:"--listen, env:LISTEN" default:"127.0.0.1"`
	Port                    int    `arg:"--port, env:PORT" default:"8080" help:"Server port"`
	Mode                    string `arg:"--mode, env:MODE" default:"dev" help:"Runtime environment mode, one of 'dev', 'prod'"`
}
