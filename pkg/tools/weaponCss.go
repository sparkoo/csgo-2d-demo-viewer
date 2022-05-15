package main

import (
	"csgo-2d-demo-player/pkg/parser"
	"fmt"
	"log"
	"os"
)

func main() {
	if f, err := os.OpenFile("weapons.css_tmp", os.O_CREATE|os.O_WRONLY, 0644); err == nil {
		defer f.Close()

		_, writeWarningErr := f.WriteString("/* THIS FILE IS GENERATED, PLEASE DO NOT CHANGE !!! */\n\n")
		if writeWarningErr != nil {
			log.Fatalln(writeWarningErr)
		}
		for _, g := range parser.WeaponsEqType {
			filename := fmt.Sprintf("%s.svg", g)
			if g == "world" {
				filename = fmt.Sprintf("%s.png", g)
			}
			_, writeLineErr := f.WriteString(fmt.Sprintf(".%s {\n  background-image: url(\"assets/icons/csgo/%s\");\n}\n\n", g, filename))
			if writeLineErr != nil {
				log.Fatalln(writeLineErr)
			}
		}
		log.Printf("Generated styles for '%d' guns.", len(parser.WeaponsEqType))
	} else {
		log.Fatalln(err)
	}
}
