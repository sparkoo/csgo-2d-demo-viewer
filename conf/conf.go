package conf

import (
	"flag"
	"log"
	"os"
	"strconv"
)

type Conf struct {
	Demodir      string
	FaceitApiKey string
	Port         int
}

func ParseArgs() *Conf {
	conf := &Conf{}
	flag.StringVar(&conf.Demodir, "demodir", "", "Path to directory with demos.")
	flag.StringVar(&conf.FaceitApiKey, "faceitApiKey", "", "Faceit Server API key. Get it at https://developers.faceit.com/docs/auth/api-keys")
	flag.Parse()

	if port, ok := os.LookupEnv("PORT"); ok {
		if portNo, err := strconv.Atoi(port); err == nil {
			conf.Port = portNo
		} else {
			log.Fatalf("PORT env must be number or empty. It is now set to '%s'. Error: '%s'", port, err.Error())
		}
	} else {
		conf.Port = 8080
	}

	return conf
}
