package conf

import "flag"

type Conf struct {
	Demodir      string
	FaceitApiKey string
}

func ParseArgs() *Conf {
	conf := &Conf{}
	flag.StringVar(&conf.Demodir, "demodir", "", "Path to directory with demos.")
	flag.StringVar(&conf.FaceitApiKey, "faceitApiKey", "", "Faceit Server API key. Get it at https://developers.faceit.com/docs/auth/api-keys")
	flag.Parse()

	return conf
}
