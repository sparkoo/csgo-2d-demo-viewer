package conf

type Conf struct {
	Demodir            string `arg:"--demodir, env:DEMODIR" default:"" help:"Path to directory with demos."`
	FaceitApiKey       string `arg:"--faceitApiKey, required, env:FACEIT_APIKEY" help:"Faceit Server API key. Get it at https://developers.faceit.com/docs/auth/api-keys"`
	FaceitClientApiKey string `arg:"--faceitClientApiKey, required, env:FACEIT_CLIENT_APIKEY" help:"Faceit Client API key. Get it at https://developers.faceit.com/docs/auth/api-keys"`
	Port               int    `arg:"--port, env:PORT" default:"8080" help:"Server port"`
}
