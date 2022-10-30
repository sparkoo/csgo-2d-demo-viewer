package provider

import "io"

type DemoProvider interface {
	DemoStream(matchId string) (io.ReadCloser, error)
}
